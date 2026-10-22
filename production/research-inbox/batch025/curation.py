import json,hashlib,re,pathlib,shutil
ROOT=pathlib.Path(__file__).resolve().parent
HANDOFF=ROOT/'original'
SEL=json.loads((ROOT.parents[1]/'next-machine-selection-20261022-batch025.json').read_text())
DOMAINS=['INITIAL_HIT','BONUS','SMALL_ROLE','CZ','AT','INTERNAL_CONDITIONAL_DRAW','MODE_TRANSITION','STATE_TRANSITION','SUCCESS_RATE','POINTS_GAME_DISTRIBUTION','CARRY_OVER','THRESHOLD_BEHAVIOR','RESET_BEHAVIOR','POST_EVENT_TRANSITION','NAVIGATION','ROLE_CONDITIONAL_DISTRIBUTION','BONUS_TYPE_CONDITIONAL','EVIDENCE','EXTERNAL_DATA_ONLY','MACHINE_SPECIFIC']
UNKNOWN='このセクションの全項目は設定別出現率が公表・確認されていないため、記録のみです。設定推測の計算には使用しません。'
class Review:
 def __init__(self,n):
  self.n=n; self.sel=SEL['selected'][n-1]; self.id=self.sel['machineId']; self.findings=[];self.blocks=[];self.ledger=[];self.sources=[];self.queries=[]
  manifest=json.loads((HANDOFF/'HANDOFF_MANIFEST.json').read_text());self.meta=manifest['machines'][n-1]
  self.original=(HANDOFF/self.meta['model']).read_text();self.urls=list(dict.fromkeys(re.findall(r'https?://[^\s;；）)]+',self.original)))
  for i,u in enumerate(self.urls):self.sources.append(dict(sourceId=f'S{i+1}',url=u,title=self.sel['displayName']+' 公開解析（添付Researchから再利用）',sourceType='HANDOFF_REUSED_ANALYSIS',claims=[]))
  self.d=dict(schemaVersion='research-v1',manifestVersion='8.5',batchId='batch-20261022-025',machineId=self.id,machineName=self.sel['displayName'],settings=dict(status='SOURCE_DERIVED',values=[]),findings=self.findings,blockedItems=self.blocks,sources=self.sources,uiRequirements=dict(alwaysVisibleEvidence=True,unknownSectionNotice=UNKNOWN,siteNamesInProductCopy=False,gameCountInput='TOTAL_GAMES',automaticOther=True,groupSameOpportunity=True,sharedRejectedReasonBulletList=True),audit=dict(independentExternalAudit=False,standardSourceBoundary=['nana-press.com','p-town.dmm.com','chonborista.com','1geki.jp','pachiseven.jp'],makerSites='NOT_APPLICABLE: 対象メーカー3系列の機種ではない',originalModel=self.meta['model'],originalModelSha256=hashlib.sha256(self.original.encode()).hexdigest(),formalStageStatus='ACCEPTANCE_BY_PRODUCTION_VALIDATOR_REQUIRED'))
 def src(self,needle):return next(s['sourceId'] for s in self.sources if needle in s['url'])
 def addsrc(self,url,title,kind='SUPPLEMENTAL_ANALYSIS'):
  sid=f'S{len(self.sources)+1}';self.sources.append(dict(sourceId=sid,url=url,title=title,sourceType=kind,claims=[]));return sid
 def trace(self,id,label,sids,disp,claim=None):
  claim=claim or label
  for sid in sids:
   s=next(s for s in self.sources if s['sourceId']==sid)
   if claim not in s['claims']:s['claims'].append(claim)
  self.ledger.append(dict(candidateId=id,label=label,sourceClaims=[dict(sourceId=s,claim=claim) for s in sids],discoveryQueries=[],disposition=disp))
 def numeric(self,id,label,values,sids,scope='TOTAL_GAME_TRIAL',denom='総ゲーム数を母数として成立回数を記録する。',typ='probability',settings=None,group=None,reason=None,**kw):
  keys=settings or [s.removeprefix('SET_') for s in self.d['settings']['values']]
  vals=dict(zip(keys,values)) if isinstance(values,list) else values
  f=dict(findingId=id,label=label,observationType=typ,settingDistribution=vals,sourceIds=sids,trialUniverse=scope,denominatorSemantics=denom,liveObservation=dict(status='EXACT_WITH_SCOPE_TRACKING' if scope!='TOTAL_GAME_TRIAL' else 'DIRECT_EXACT',reason=denom),details=[denom],**kw)
  if group:f.update(dependencyGroupId=group,dependencyKind='CAUSAL_PATH_OVERLAP',dependencyReason=reason or '同じ当選経路の合算・内訳は重複するため同時加算せず、正式な評価で代表を選ぶ。',dependencyScopeAudit=dict(status='KNOWN_DEPENDENCY_DEFERRED_TO_CONTRACT'))
  self.findings.append(f);self.trace(id,label,sids,dict(type='FINDING',refId=id),label+'：'+json.dumps(vals,ensure_ascii=False)+'。'+denom);return f
 def evidence(self,id,label,categories,sids,details=None):
  cats=[]
  for item in categories:
   lab,meaning=item[:2];typ='EXACT_CONSTRAINT' if re.search(r'^設定[1-6](?:以上|否定|$)|^設定[1-6](?:[・,／/][1-6])+(?:否定)?$|^(奇数|偶数)設定濃厚',meaning) and '示唆' not in meaning else 'PROBABILITY_UNKNOWN'
   cats.append(dict(label=lab,meaning=meaning,semanticType=typ))
  f=dict(findingId=id,label=label,observationType='evidence',sourceIds=sids,semanticCategories=cats,details=details or ([UNKNOWN] if all(c['semanticType']!='EXACT_CONSTRAINT' for c in cats) else ['条件が明確な確定・否定表示は、設定候補の絞り込みへ反映できる可能性があります。']))
  self.findings.append(f);self.trace(id,label,sids,dict(type='FINDING',refId=id),label+'：'+'／'.join(c['label']+'='+c['meaning'] for c in cats));return f
 def block(self,id,label,reason,sids,values=None):
  b=dict(blockId=id,label=label,reason=reason,reevaluationCondition='不足している観測条件または本機の設定別公表値が、新しい具体的な公開資料で確認できた場合に限り再評価する。',sourceIds=sids,closure=dict(basis='Manifest v8.5 Research終了契約と添付の個別終了記録',ownerStage='RESEARCH',releaseCondition='NEW_CONCRETE_SOURCE_ONLY',repeatPublicSearch=False))
  if values is not None:b['retainedSourceValues']=values
  self.blocks.append(b);self.trace(id,label,sids,dict(type='BLOCKED',refId=id),label+'：'+reason);return b
 def no_diff(self,id,label,reason,sids):self.trace(id,label,sids,dict(type='NO_SETTING_DIFFERENCE',reason=reason),label+'：'+reason)
 def finish(self,notes,mapping=None):
  # Source rows with no candidate claim are audit references, not invented claims.
  unused=[s for s in self.sources if not s['claims']]; self.d['audit']['additionalSourceReferences']=unused
  self.sources[:]=[s for s in self.sources if s['claims']]
  self.d['researchCompleteness']=dict(version=2,domains=[dict(domain=k,status='NOT_APPLICABLE' if v is None else 'CHECKED',note=('本機には当該独立機構がない。' if v is None else v),sourceIds=[] if v is None else [s['sourceId'] for s in self.sources]) for k,v in notes.items()],machineSpecificQueries=[],candidateLedger=self.ledger)
  if set(notes)!=set(DOMAINS):raise Exception('domain coverage')
  for q,idx in [('設定別確率と当選内訳',0),('終了画面と設定確定表示',min(1,len(self.ledger)-1)),('観測母数と重複する当選経路',len(self.ledger)-1)]:
   query=self.sel['displayName']+' '+q;self.d['researchCompleteness']['machineSpecificQueries'].append(query);self.ledger[idx]['discoveryQueries'].append(query)
  package=json.loads((ROOT/'original-packages'/f'{self.id}.json').read_text());self.d['settings']['values']=package['machine']['settings']
  old=[]
  for x in package.get('features',{}).get('features',[]):old.append((x.get('featureId'),x.get('name')))
  for x in package.get('selectionSummary',{}).get('rejected',[]):old.append((x.get('featureId'),x.get('name')))
  for x in package.get('evidence',{}).get('evidences',[]):old.append((x.get('id'),x.get('name')))
  reconciliation=[]
  for oid,label in old:
   target=(mapping or {}).get(oid)
   if not target:raise Exception('UNMAPPED_ORIGINAL:'+str((oid,label)))
   if not any(x['candidateId']==target for x in self.ledger):raise Exception('INVALID_MAPPING:'+target)
   reconciliation.append(dict(originalId=oid,label=label,reviewedCandidateId=target,preserved=True))
  self.d['originalCandidateReconciliation']=reconciliation
  self.d['audit']['sixDomainReview']={k:notes[v] for k,v in dict(initial_hit='INITIAL_HIT',small_roles='SMALL_ROLE',transitions='STATE_TRANSITION',screens='EVIDENCE',constraints='MACHINE_SPECIFIC',conditions='RESET_BEHAVIOR').items()}
  p=ROOT/'original';p.mkdir(exist_ok=True)
  for f in [self.meta['model'],self.meta['closure'],self.meta['status_file']]:
   if (HANDOFF/f).resolve()!=(p/f).resolve():shutil.copy2(HANDOFF/f,p/f)
  p=ROOT/'reviewed';p.mkdir(exist_ok=True);(p/f'{self.id}.json').write_text(json.dumps(self.d,ensure_ascii=False,indent=2)+'\n')
  print(json.dumps(dict(machine=self.id,findings=len(self.findings),blocks=len(self.blocks),ledger=len(self.ledger),originalMapped=len(reconciliation)),ensure_ascii=False))
def ratios(xs):return ['1/'+str(x) for x in xs]
def perc(xs):return [x/100 for x in xs]
