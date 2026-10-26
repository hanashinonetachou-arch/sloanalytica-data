"""Artifact-only normalization. Never edits a published package or common builder."""
import json, pathlib, re, hashlib, sys
ROOT=pathlib.Path(__file__).resolve().parents[3]
BASE=ROOT.parent/'baseline'
OUT=ROOT/'production/batches/batch-20261026-026/artifacts'
ORDER=['LB_FUJIKO_M2','LB_SLOT_GALFY_A4','LB_EVA_PROMISE_DOOR_SR','LB_ISEKAI_QUARTET_KR','LB_TOBE_HAREM_ACE_CF','S_NEO_IM_JUGGLER_EX_KK','S_ULTRA_MIRACLE_JUGGLER_KT','S_MR_JUGGLER_KK','S_JUGGLER_GIRLS_SS_KH','S_GOGO_JUGGLER_3_KA']
FILES=['l-fujiko-bt','lb-galfy','lb-eva-yakusoku','isekai-quartet-bt','tobe-harem-ace','neo-im-juggler-ex','ultra-miracle-juggler','mr-juggler','juggler-girls-ss','go-go-juggler-3']
def read(p):return json.loads(p.read_text())
def write(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
class Machine:
 def __init__(self,i):
  self.i=i;self.id=ORDER[i]; rec=read(OUT/self.id/'research/reconciliation.json') if not (BASE/'research'/self.id/'research-data.json').exists() else None; self.old=rec['originalResearchSnapshot'] if rec else read(BASE/'research'/self.id/'research-data.json'); self.pkg={'features':{'features':[{'featureId':id}for id in rec['packageFeatureIds']]},'inputs':{'inputs':[{'id':id}for id in rec['packageInputIds']]}} if rec else read(BASE/'machines'/self.id/'machine-package.json');self.md=ROOT/'research/2026-10-26'/(FILES[i]+'-research.md');self.settings=[s.removeprefix('SET_') for s in self.old['machine']['settings']];self.raw=self.md.read_text();self.rows=[];self.claims={};self.sources={s['sourceId']:{**s,'claims':[]} for s in self.old['sources']};self.old_by={x['researchFeatureId']:x for x in self.old['features']};self.e_old={x['researchEvidenceId']:x for x in self.old.get('evidenceCandidates',[])};self.notes=[]
 def source(self,url):
  for k,v in self.sources.items():
   if v['url'].rstrip('/')==url.rstrip('/'):return k
  k='SRC_20261026_'+hashlib.sha256(url.encode()).hexdigest()[:10];self.sources[k]={'sourceId':k,'url':url,'title':self.old['machine']['displayName']+' 調査参照ページ','sourceType':'analysis','checkedAt':'2026-10-26','claims':[]};return k
 def attach(self,row,urls):
  row['sourceIds']=[self.source(u) for u in urls]; claim=row['label']+'：'+row.get('auditClaim',row.get('denominatorSemantics',row.get('reason','記録内容と示唆条件を照合。')))
  row.pop('auditClaim',None)
  for sid in row['sourceIds']:
   if claim not in self.sources[sid]['claims']:self.sources[sid]['claims'].append(claim)
  self.rows.append(row);return row
 def numeric(self,id,label,values,urls,universe='NORMAL_GAME_TRIAL',scope='通常時。ボーナス消化中とBT中を除き、同じ対象ゲーム数を1回だけ入力する。',group=None,categories=None,details=None):
  iscat=isinstance(values[0],dict)
  dist={s:(' / '.join(k+': '+format(v*100,'.14f')+'%' for k,v in row.items()) if iscat else (f'1/{row}' if isinstance(row,(float,int)) and row>1 else row)) for s,row in zip(self.settings,values)}
  f={'findingId':id,'label':label,'observationType':'appearance_distribution' if iscat else 'probability','settingDistribution':dist,'trialUniverse':universe,'denominatorSemantics':scope,'liveObservation':{'status':'EXHAUSTIVE_CATEGORICAL' if iscat else 'EXACT_WITH_SCOPE_TRACKING','reason':scope},'details':details or [],'dependencyReview':{'status':'INDEPENDENT','reason':'別の観測区間の試行数を記録する。'}}
  if iscat:f['categoryModel']={'residualPolicy':'SOURCE_EXPLICIT_OTHER'};f['categoryLabels']=list(values[0]);f['rawCategoryProbabilities']={s:row for s,row in zip(self.settings,values)}
  if group:f.update(dependencyGroupId=group,dependencyKind='DEPENDENT',dependencyReason='同じ遊技区間の情報を共有するため、正式な7000G情報量で代表候補を選び、同時加算しない。',dependencyReview={'status':'DEPENDENT'})
  return self.attach(f,urls)
 def block(self,id,label,reason,urls,raw=None):
  return self.attach({'blockId':id,'label':label,'reason':reason,'reevaluationCondition':'不足している設定別の値または観測条件を裏付ける新たな具体的な公開資料が確認された場合。','disposition':'CLOSED_SOURCE_BOUNDED','runtimeUse':'DISABLED','reopenPolicy':'NEW_CONCRETE_SOURCE_ONLY',**({'retainedSourceData':raw} if raw is not None else {})},urls)
 def evidence(self,id,label,cats,urls,details=None):
  # cats: (label, meaning, allowed settings or None); allowed sets never inferred from frequency.
  cs=[{'label':l,'meaning':m,'semanticType':'EXACT_CONSTRAINT' if a is not None else 'PROBABILITY_UNKNOWN',**({'allowedSettings':['SET_'+str(s) for s in a]} if a is not None else {})} for l,m,a in cats]
  return self.attach({'findingId':id,'label':label,'observationType':'evidence','semanticCategories':cs,'details':details or ['出現率が未確認の項目は記録のみ。条件が明確な設定制約は推測に反映できる可能性があります。']},urls)
 def finalize(self,ui,domains,coverage):
  for id,f in self.old_by.items():
   if not any(x.get('findingId',x.get('blockId'))==id for x in self.rows):raise ValueError('LEGACY_CANDIDATE_UNROUTED '+id)
  for id,f in self.e_old.items():
   if not any(x.get('findingId',x.get('blockId'))==id for x in self.rows):raise ValueError('LEGACY_EVIDENCE_UNROUTED '+id)
  findings=[x for x in self.rows if 'findingId'in x];blocks=[x for x in self.rows if 'blockId'in x]
  ledger=[]
  for x in self.rows:
   id=x.get('findingId',x.get('blockId'));claims=[{'sourceId':sid,'claim':c}for sid in x['sourceIds'] for c in self.sources[sid]['claims'] if c.startswith(x['label']+'：')]
   ledger.append({'candidateId':id,'label':x['label'],'sourceClaims':claims,'discoveryQueries':[],'disposition':{'type':'FINDING' if 'findingId'in x else 'BLOCKED','refId':id}})
  # The 6 requested areas map onto the unchanged 20-domain Production validator.
  mapping={'INITIAL_HIT':0,'BONUS':0,'SMALL_ROLE':1,'CZ':None,'AT':None,'INTERNAL_CONDITIONAL_DRAW':2,'MODE_TRANSITION':2,'STATE_TRANSITION':5,'SUCCESS_RATE':2,'POINTS_GAME_DISTRIBUTION':3,'CARRY_OVER':5,'THRESHOLD_BEHAVIOR':4,'RESET_BEHAVIOR':5,'POST_EVENT_TRANSITION':5,'NAVIGATION':5,'ROLE_CONDITIONAL_DISTRIBUTION':2,'BONUS_TYPE_CONDITIONAL':3,'EVIDENCE':4,'EXTERNAL_DATA_ONLY':5,'MACHINE_SPECIFIC':5}
  queries=[self.old['machine']['displayName']+' '+q for q in ['設定別ボーナスと対象ゲーム数','小役とボーナスの重複関係','設定示唆と観測条件']]
  for j,q in enumerate(queries):ledger[j % len(ledger)]['discoveryQueries'].append(q)
  sourceids=sorted({sid for x in self.rows for sid in x['sourceIds']})
  dd=[{'domain':k,'status':'NOT_APPLICABLE' if v is None else 'CHECKED','note':'AT・CZ機構のないノーマル／BT機。' if v is None else domains[v],'sourceIds':[] if v is None else sourceids}for k,v in mapping.items()]
  d={'schemaVersion':'research-v1','manifestVersion':'8.5','batchId':'batch-20261026-026','machineId':self.id,'machineName':self.old['machine']['displayName'],'workId':'research-20261026-'+self.id,'settings':{'status':'SOURCE_DERIVED','values':['SET_'+s for s in self.settings]},'sources':[s for s in self.sources.values() if s['claims']],'findings':findings,'blockedItems':blocks,'researchCompleteness':{'version':2,'domains':dd,'machineSpecificQueries':queries,'candidateLedger':ledger},'sourceBoundedClosure':{'status':'CLOSED_WITH_DOCUMENTED_LIMITATIONS','sixDomains':domains,'sourceCoverage':coverage,'externalIndependentAudit':False,'previousClosedSearchesRepeated':False,'reopenPolicy':'NEW_CONCRETE_SOURCE_OR_CONCRETE_ERROR_ONLY','inheritedResearchPath':str(self.md.relative_to(ROOT)),'notes':self.notes},'observationContract':ui}
  rec={'machineId':self.id,'canonicalResearchCommit':'310bc400ea067c5d29312d31ed89ca570283fe25','productionStateCommit':'eeb059c717a4d42ee34a7d806574270bd9cd56d0','selectionAndLatestQACommit':'35a80e198ef7766200d7e05c895db1145bbfbb22','researchFeaturesRetained':list(self.old_by),'evidenceIdsRetained':list(self.e_old),'originalResearchSnapshot':self.old,'oldFeatures':self.old['features'],'oldEvidence':self.old.get('evidenceCandidates',[]),'oldSelectionData':read(BASE/'research'/self.id/'selection-data.json') if (BASE/'research'/self.id/'selection-data.json').exists() else read(OUT/self.id/'research/reconciliation.json')['oldSelectionData'],'packageFeatureIds':[x['featureId'] for x in self.pkg.get('features',{}).get('features',[])],'packageInputIds':[x.get('id') for x in (self.pkg.get('inputs',{}).get('inputs',[]) if isinstance(self.pkg.get('inputs'),dict) else self.pkg.get('inputs',[])) if isinstance(x,dict)],'candidateRouting':ledger,'existingContractsOverwritten':False,'publishedMachineDataChanged':False,'qaStateChanged':False}
  path=OUT/self.id;write(path/'research/result.json',d);write(path/'research/reconciliation.json',rec)
  return path
def coverage(manufacturer,extra=None):return {'nana-press':'INHERITED_BOUNDED_REVIEW','1geki':'INHERITED_BOUNDED_REVIEW','chonborista':'INHERITED_REVIEW_OR_TARGETED_NO_VERIFIED_VALUES_SEE_SOURCE_ARTIFACT','DMM':'INHERITED_TARGETED_NO_VERIFIED_VALUES','pachiseven':'INHERITED_TARGETED_NO_VERIFIED_VALUES','Sammy': 'RELEVANT_TARGETED_NO_VERIFIED_VALUES' if manufacturer=='Sammy' else 'NOT_APPLICABLE','SANKYO':'RELEVANT_TARGETED_UNCONFIRMED' if manufacturer=='Bisty' else 'NOT_APPLICABLE','Spiky':'NOT_APPLICABLE',**(extra or {})}
def partition(**ds):return [dict(zip(ds,[1/v[i] for v in ds.values()]))for i in range(len(next(iter(ds.values()))))]
def fujiko():
 m=Machine(0);u=['https://nana-press.com/kaiseki/machine/1070/34193/'];v=['https://nana-press.com/kaiseki/machine/1070/34201/'];r=['https://nana-press.com/kaiseki/machine/1070/34202/'];grp='FUJIKO_NORMAL_SHARED_OBSERVATIONS'
 m.numeric('RF_PREDECESSOR_BONUS','着席時 BIG・REG',partition(BIG=[394.8,364.1,319.7,291.3,229.1],REG=[321.3,304.8,278.9,252.1,227.6]),u,'PREDECESSOR_NORMAL_GAME_TRIAL','着席前に確認できた通常GとBIG・REG。自分の遊技区間と重複させず、SBIGとBT中当選を含めない。')
 m.numeric('RF_BONUS_OUTCOME','通常時ボーナス',partition(SBIG=[697.2]*5,BIG=[394.8,364.1,319.7,291.3,229.1],REG=[321.3,304.8,278.9,252.1,227.6]),u,group=grp)
 m.numeric('RF_NORMAL_PLUM','通常時 平行プラム・斜めプラム',partition(PLUM_A=[9.3,9.1,8.9,8.7,8.6],PLUM_B=[25.6,25.1,24.3,24,23.7]),u,group=grp)
 m.numeric('RF_NORMAL_CHERRY','通常時チェリー',[53.1,51.8,49.3,48.2,46.7],u,group=grp)
 m.numeric('RF_CHERRY_BIG','チェリー＋BIG',[6553.6,5461.3,3120.8,2520.6,1560.4],u,group=grp)
 m.numeric('RF_CHERRY_REG','チェリー＋REG',[2621.4,2184.5,1424.7,1170.3,978.1],u,group=grp)
 m.numeric('RF_BIG_DIAGONAL_PLUM','BIG中 斜めプラム',[4.5,4.3,4.15,4,4],u,'FUJIKO_BIG_PLUM_TRIAL','SBIG・BIG中の平行／斜めプラムの合計を試行数にする。通常Gや枚数調整ゲームを混ぜない。')
 voices=[dict(zip(['ルパン','次元','銭形','五エ門','不二子'],vs))for vs in [[.5,.273,.164,.063,0],[.5,.164,.273,.063,0],[.469,.164,.273,.094,0],[.465,.273,.164,.094,.004],[.465,.175,.262,.094,.004]]]
 m.numeric('RF_BIG_VOICE_1G','BIG 1G目 枚数調整成功ボイス',voices,v,'FUJIKO_VOICE_FIRST_SUCCESS_TRIAL','SBIG・BIGの1G目に枚数調整を成功させた回だけ。失敗・未実施は試行数に含めない。')
 voices2=[dict(zip(['ルパン','次元','銭形','五エ門','不二子'],vs))for vs in [[.594,.225,.15,.031,0],[.594,.15,.225,.031,0],[.578,.15,.225,.047,0],[.576,.225,.15,.047,.002],[.576,.15,.225,.047,.002]]]
 m.numeric('RF_BIG_VOICE_2G_PLUS','BIG 2G目以降 枚数調整成功ボイス',voices2,v,'FUJIKO_VOICE_LATER_SUCCESS_TRIAL','SBIG・BIGの2G目以降に枚数調整を成功させた回だけ。1G目成功と相互に区別する。')
 for id,e in m.e_old.items():
  if id.startswith('RE_STAMP_'):m.evidence(id,e['name'],[(e['name'],'現行機の設定制約として確認されていないため記録のみ。',None)],u,details=['過去機種からの類推を設定確定条件にしない。記録のみ・推測計算には使用しない。']);continue
  urls=v if id=='RE_VOICE_FUJIKO' else r if id.startswith('RE_REG') else u
  allowed=[int(s.removeprefix('SET_'))for s in e['allowedSettings']];meaning='設定'+str(min(allowed))+'以上'
  f=m.evidence(id,e['name'],[(e['name'],meaning,allowed)],urls)
  if id=='RE_VOICE_FUJIKO':f['inputReuse']={'type':'DERIVED_CONSTRAINT','fromFindingIds':['RF_BIG_VOICE_1G','RF_BIG_VOICE_2G_PLUS'],'category':'不二子','extraInput':False}
 m.evidence('RE_REG_SCENARIOS','REG中のキャラ紹介',[(f'シナリオ{i}',('設定5以上' if i==12 else '設定4以上' if i==11 else '設定2以上' if i>=8 else '設定別の出現率は観測条件別に未確認'),([5,6]if i==12 else [4,5,6]if i==11 else [2,4,5,6]if i>=8 else None))for i in range(1,13)],r)
 m.block('RF_REG_ZENIGATA_AGGREGATE','REG中 銭形出現率','全状態合算の分布はあるが、初回・5の倍数回目の出現率変化と標本構成を再現する条件別の値がない。条件を無視して同じ率を2タブへ適用しない。',r,{'1':.375,'2':.625,'4':.625,'5':.375,'6':.625})
 m.notes=['チェリー＋REG設定1はユーザー決定の1/2621.4。対立値1/2624.4と多数決の出典問題は原Researchに保存。','旧スタンプ設定制約を参考記録に訂正。旧IDと旧許容設定はreconciliationに保持。','1geki表の設定3を設定4と読む根拠は既存Research。','条件別REG分布がないため数値化を閉じる。銭形合算を都合のよい固定母数とみなさない。']
 ui={'normalGames':'ONE_SHARED_INPUT','normalBonusCategories':['SBIG','BIG','REG'],'regScenarios':{'section':'REG中のキャラ紹介','tabs':['初回・5の倍数回目','それ以外'],'ordinalRule':'1,5,10,15,... vs all others','categoriesPerTab':12,'numericLikelihood':'DISABLED','exactConstraints':'SOURCE_GROUNDED_ONLY','oldConstraintCounters':'derive from scenario inputs; no duplicate input'},'voices':{'tabs':['1G目','2G目以降'],'trial':'successful adjustment only'},'recordOnlyCopy':'記録のみ・推測計算には使用しない','unobserved':'NULL_NOT_ZERO'}
 domains=['通常3枚掛けのSBIG/BIG/REG。BT中当選を通常Gへ混ぜず、合算は表示用。','平行・斜めプラムとチェリー、チェリー重複BIG/REG。包含関係を保持し代表選択。','BTは2枚掛け別状態。通常ボーナス・小役の独立加算を禁止。','BIGボイスは1G目と2G目以降の成功機会別。REGは初回/5の倍数回とそれ以外の条件別分布が未公表。','シナリオ8–10/11/12、特定ボイス、8図柄、ハルルナの制約を保持。スタンプは類推なので記録のみ。','REG通算順を保持。着席前と自分の区間を分離。全未知の欄は記録のみと表示。']
 return m.finalize(ui,domains,coverage('Amtex',{'DMM':'2026-10-27 DIRECT_OPEN_403','nana-press':'2026-10-27 DIRECT_RECHECK_34193_34201_34202'}))
if __name__=='__main__':
 fn=globals().get(sys.argv[1]);assert callable(fn);print(fn())
