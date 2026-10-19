import json,pathlib,re,hashlib,subprocess,sys
ROOT=pathlib.Path(__file__).resolve().parent
PROD=ROOT.parent.parent
BATCH='batch-20261019-024'
SEL=json.loads((PROD/'next-machine-selection-20261019-batch024.json').read_text())['selected']
DOMAINS=['INITIAL_HIT','BONUS','SMALL_ROLE','CZ','AT','INTERNAL_CONDITIONAL_DRAW','MODE_TRANSITION','STATE_TRANSITION','SUCCESS_RATE','POINTS_GAME_DISTRIBUTION','CARRY_OVER','THRESHOLD_BEHAVIOR','RESET_BEHAVIOR','POST_EVENT_TRANSITION','NAVIGATION','ROLE_CONDITIONAL_DISTRIBUTION','BONUS_TYPE_CONDITIONAL','EVIDENCE','EXTERNAL_DATA_ONLY','MACHINE_SPECIFIC']
DINDEX=[0,0,1,0,0,2,2,5,2,2,5,5,5,5,5,1,0,3,5,4]
def write(p,d):
 p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def clean(s):
 for x in ['なな徹','DMMぱちタウン','ちょんぼりすた','一撃','パチ7']:s=s.replace(x,'公開資料')
 return s
class Machine:
 def __init__(self,n,urls,six):
  self.n=n;self.m=SEL[n-1];self.id=self.m['machineId'];self.raw=next((ROOT/'imported-handoff').glob(f'{n:02d}_*.md'))
  self.baseline=json.loads((ROOT/'repository-baseline'/(self.id+'.json')).read_text())
  self.sources=[{'sourceId':f'S{i+1:02d}','url':u,'title':self.m['displayName']+' 設定差・観測条件','sourceType':'inherited_research_and_bounded_verification','checkedAt':'2026-10-20','claims':[]} for i,u in enumerate(urls)]
  self.rows=[];self.findings=[];self.blocks=[];self.six=six;self.notes=[];self.counter=0
 def row(self,label,claim,s=1):
  self.counter+=1;fid=f'B024-M{self.n:02d}-{self.counter:03d}';src=self.sources[s-1];claim=label+'：'+str(claim);src['claims'].append(claim)
  row={'candidateId':fid,'label':label,'sourceClaims':[{'sourceId':src['sourceId'],'claim':claim}],'discoveryQueries':[]};self.rows.append(row)
  return fid,row,[src['sourceId']]
 def num(self,label,values,den,detail,kind='probability',s=1,group=None,dep='CAUSAL_PATH_OVERLAP',rank=None,cat=False):
  claim=json.dumps({'values':values,'trialUniverse':den,'conditions':detail},ensure_ascii=False)
  fid,row,sids=self.row(label,claim,s);settings=[x.removeprefix('SET_') for x in self.baseline['machine']['settings']]
  dist=values if isinstance(values,dict) else dict(zip(settings,values,strict=True))
  if cat:
   dist={str(k):'/'.join(f'{a}: {v}%' for a,v in r.items()) for k,r in dist.items()};kind='appearance_distribution'
  f={'findingId':fid,'label':label,'sourceIds':sids,'observationType':kind,'settingDistribution':dist,'trialUniverse':den,'denominatorSemantics':clean(detail),'details':[clean(detail)],'liveObservation':{'status':'EXACT_WITH_SCOPE_TRACKING','reason':clean(detail)},'dependencyReview':{'status':'INDEPENDENT','reason':'対象条件と成功事象を分けて記録する。'}}
  if cat:f['categoryModel']={'residualPolicy':'SOURCE_EXHAUSTIVE'}
  if group:
   f.pop('dependencyReview');f.update(dependencyGroupId=group,dependencyKind=dep,dependencyReason='同じ当選系列やその内訳を独立に重ねず、代表候補だけを使用する。')
  if rank is not None:f['dependencyFallbackRank']=rank
  self.findings.append(f);row['disposition']={'type':'FINDING','refId':fid};return fid
 def ratio(self,label,vals,den,detail,**kw):return self.num(label,['1/'+str(v) for v in vals],den,detail,**kw)
 def pct(self,label,vals,den,detail,**kw):return self.num(label,[v/100 for v in vals],den,detail,kind='conditional_probability',**kw)
 def evidence(self,label,mapping,detail='',s=1):
  fid,row,sids=self.row(label,json.dumps(mapping,ensure_ascii=False)+' '+detail,s)
  cats=[]
  for a,v in mapping.items():
   exact=bool(re.search(r'設定[0-6]',v)) and not re.search('示唆|期待|未確定|未確認',v)
   cats.append({'label':a,'meaning':v,'semanticType':'EXACT_CONSTRAINT' if exact else 'PROBABILITY_UNKNOWN'})
  f={'findingId':fid,'label':label,'sourceIds':sids,'observationType':'evidence','semanticCategories':cats,'details':[clean(detail or '出現した演出を1回ずつ記録します。設定確定・否定が確認できる項目は設定候補の絞り込みに反映できる可能性があります。')],'semanticType':'PROBABILITY_UNKNOWN'}
  if not any(c['semanticType']=='EXACT_CONSTRAINT' for c in cats):f['details'].append('記録のみ・推測計算には使用しない。')
  self.findings.append(f);row['disposition']={'type':'FINDING','refId':fid};return fid
 def block(self,label,reason,retained=None,s=1):
  fid,row,sids=self.row(label,reason+' '+json.dumps(retained,ensure_ascii=False),s);bid=fid+'-BLOCK'
  self.blocks.append({'blockId':bid,'label':label,'reason':clean(reason),'reevaluationCondition':'対象条件と全設定の数値が確認できる具体的な新資料が得られた場合に限り再確認します。','sourceIds':sids,'retainedSourceParameters':retained})
  row['disposition']={'type':'BLOCKED','refId':bid};return bid
 def finish(self,legacy):
  # Every previous feature/evidence survives as an immutable snapshot and a traced disposition.
  reconciled=[]
  for kind,items in [('feature',self.baseline.get('features',{}).get('features',[])),('evidence',self.baseline.get('evidence',{}).get('evidences',[]))]:
   for x in items:
    ident=x.get('featureId',x.get('id'));label=x.get('name',ident);term=legacy.get(ident)
    if term is None:raise ValueError('Unreconciled previous candidate: '+str(ident))
    reconciled.append({'kind':kind,'id':ident,'label':label,'disposition':term,'snapshotPath':f'production/research-inbox/batch024/repository-baseline/{self.id}.json'})
  sources=[s for s in self.sources if s['claims']]
  queries=[self.m['displayName']+' '+x for x in ['初当り・小役・試行母数','終了画面・確定否定条件','内部状態・リセット・重複当選']]
  for i,q in enumerate(queries):self.rows[min(i,len(self.rows)-1)]['discoveryQueries'].append(q)
  doc={'schemaVersion':'research-v1','manifestVersion':'8.5','batchId':BATCH,'machineId':self.id,'machineName':self.m['displayName'],'researchStage':'SOURCE_REVIEW_COMPLETE','machineIdentity':self.baseline['machine'],'settings':{'status':'SOURCE_DERIVED','values':self.baseline['machine']['settings']},'sources':sources,'findings':self.findings,'blockedItems':self.blocks,'researchCompleteness':{'version':2,'domains':[{'domain':a,'status':'CHECKED','note':self.six[DINDEX[i]],'sourceIds':[s['sourceId'] for s in sources]} for i,a in enumerate(DOMAINS)],'machineSpecificQueries':queries,'candidateLedger':self.rows},'importProvenance':{'path':'production/research-inbox/batch024/imported-handoff/'+self.raw.name,'sha256':hashlib.sha256(self.raw.read_bytes()).hexdigest(),'scope':'Inherited CLOSED_WITH_LIMITATIONS six-domain survey; bounded corrections only; no exhaustive-site or independent-audit claim','independentAudit':'NOT_PERFORMED'},'legacyReconciliation':reconciled,'boundedReviewNotes':self.notes,'scopeBoundary':{'runtime':'NOT_EXECUTED','distribution':'NOT_EXECUTED','physicalQA':'NOT_PERFORMED'}}
  write(ROOT/'reviewed'/(self.id+'.json'),doc);print(self.n,self.id,len(self.rows),len(self.findings),len(self.blocks))

if __name__=='__main__':
 n=int(sys.argv[1]);exec((ROOT/f'machine{n:02d}.py').read_text())
