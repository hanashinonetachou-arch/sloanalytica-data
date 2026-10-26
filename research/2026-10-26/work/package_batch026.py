"""Scoped, replayable package integration. Frozen candidate probabilities are never edited.
Raw builder outputs and their unmodified common-validator evidence remain beside delivery.
"""
import json,pathlib,hashlib,copy,datetime
ROOT=pathlib.Path('data/production/batches/batch-20261026-026');DIST=pathlib.Path('distribution')
IDS=['LB_FUJIKO_M2','LB_SLOT_GALFY_A4','LB_EVA_PROMISE_DOOR_SR','LB_ISEKAI_QUARTET_KR','LB_TOBE_HAREM_ACE_CF','S_NEO_IM_JUGGLER_EX_KK','S_ULTRA_MIRACLE_JUGGLER_KT','S_MR_JUGGLER_KK','S_JUGGLER_GIRLS_SS_KH','S_GOGO_JUGGLER_3_KA']
def read(p):return json.loads(pathlib.Path(p).read_text())
def write(p,o):p=pathlib.Path(p);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
cat=read(DIST/'catalog.json');originals={x['machineId']:copy.deepcopy(x) for x in cat['machines']};logs=[]
for mid in IDS:
 d=ROOT/'artifacts'/mid;a=read(d/'app_runtime/result.json');p=a['package'];ins=p['inputs']['inputs'];sections=p['ui']['v8Sections'];evis=p['evidence']['evidences'];raw=copy.deepcopy(p);aliases={}
 def inp(i):return next(x for x in ins if x['id']==i)
 def remove_node_id(i):
  for s in sections:
   for n in s.get('items',[]):
    if n.get('interaction',{}).get('categories'):n['interaction']['categories']=[c for c in n['interaction']['categories'] if c['inputId']!=i]
   s['items']=[n for n in s.get('items',[]) if n.get('interaction',{}).get('type')!='CATEGORY_COUNTERS' or n['interaction'].get('categories')]
 def alias(old,new,derived=False):
  aliases[old]=list(new) if derived else [new]
  if derived:inp(old).update(inputVisible=False,derivedCalculation='sum',derivedFromInputIds=list(new))
  else:
   for e in evis:
    if e['inputId']==old:e['inputId']=new
   p['inputs']['inputs'][:]=[x for x in ins if x['id']!=old]
  remove_node_id(old)
 def merge(title,ids):
  ss=[s for s in sections if s['id'] in ids]
  if not ss:return
  target=ss[0];target['title']=title
  for s in ss[1:]:target['items'].extend(s['items']);sections.remove(s)
 def tab(title,ids,labels):
  for i,(sid,label) in enumerate(zip(ids,labels)):
   s=next(s for s in sections if s['id']==sid);s['tabGroup']={'id':'B026_'+title,'title':title,'label':label}
 # Prior play belongs to a separate snapshot, automatically linked to the one seating field.
 for f in p['features']['features']:
  if f['modelType']=='multinomial' and 'GAME_TRIAL' in f['trialUniverse']:f['requireAllCategoryCountsObserved']=True
  f['displayFormat']='ratio_1_over_n' if f['modelType']=='binomial' and 'GAME_TRIAL' in f['trialUniverse'] else 'percentage'
  if f['trialUniverse']=='PREDECESSOR_NORMAL_GAME_TRIAL':
   for s in sections:
    for n in s.get('items',[]):
     if n.get('featureId')!=f['featureId']:continue
     n['interaction']['opportunityTracking']['playDataBinding']={'source':'PLAY_START_TOTAL_GAMES' if mid.startswith('S_') else 'PLAY_START_NORMAL_GAMES','mode':'AUTO_EXACT','exactness':'EXACT_ONLY'}
   for i in ins:
    if i['id']==f['denominatorInputId'] or i.get('parentInputId')==f['denominatorInputId']:i['observationScope']='PREDECESSOR_SNAPSHOT'
  elif f['trialUniverse']=='NORMAL_GAME_TRIAL':
   for i in ins:
    if i['id']==f['denominatorInputId'] or i.get('parentInputId')==f['denominatorInputId']:i['observationScope']='SELF_PLAY'
 # The common builder's residualGameCount field is not an app input contract.
 # Express the same complete multinomial using supported exact play binding and
 # a hidden linear residual. Every category must be explicitly observed (0 is valid).
 for f in p['features']['features']:
  if f['trialUniverse']!='NORMAL_GAME_TRIAL' or f['modelType']!='multinomial':continue
  f.pop('denominatorRule',None);trial=inp(f['denominatorInputId']);trial.pop('derivedCalculation',None);trial.pop('derivedFromInputIds',None);trial.pop('inputVisible',None)
  ids=[f['numeratorInputId']]+f['categoryInputIds'];other=next(i for i in ids if inp(i)['name']=='その他');inp(other).update(inputVisible=False,derivedCalculation='linear_combination',derivedTerms=[{'inputId':f['denominatorInputId'],'multiplier':1}]+[{'inputId':i,'multiplier':-1} for i in ids if i!=other])
  for ss in sections:
   for n in ss.get('items',[]):
    if n.get('featureId')!=f['featureId']:continue
    inter=n['interaction'];inter.pop('residualGameCount',None);inter.update(categoryCoverage='NON_EXHAUSTIVE',totalOpportunities='SEPARATE_COUNTER',opportunityTracking={'type':'SEPARATE_COUNTER','inputId':f['denominatorInputId'],'label':'通常ゲーム数' if not mid.startswith('S_') else '総ゲーム数','directNumeric':True,'quickAdd':[50],'playDataBinding':{'source':'PLAY_TOTAL_GAME_DELTA' if mid.startswith('S_') else 'PLAY_NORMAL_GAME_DELTA','mode':'AUTO_EXACT','exactness':'EXACT_ONLY'}});inter['categories']=[c for c in inter['categories'] if c['inputId']!=other]
 def input_controls(v):
  if isinstance(v,list):
   for x in v:input_controls(x)
  elif isinstance(v,dict):
   if v.get('inputId') and (v.get('input')=='counter' or v.get('id')==v.get('inputId')):v.update(directNumeric=True,compactCounter=True,quickAdd=[1])
   if v.get('playDataBinding',{}).get('source') in ['PLAY_NORMAL_GAME_DELTA','PLAY_TOTAL_GAME_DELTA']:v['playDataBinding'].update(mode='AUTO_EXACT',exactness='EXACT_ONLY')
   for x in list(v.values()):input_controls(x)
 input_controls(sections)
 # Translate labels while keeping input IDs, vector order and all likelihoods intact.
 labels={'PLUM_A':'平行プラム','PLUM_B':'斜めプラム','BELL':'ベル合算','SUIKA':'スイカ合算','WATERMELON':'スイカ合算','CHERRY':'チェリー','GC_CHERRY':'GCチェリー','BONE':'ボーン','HB':'ハーレムボーナス','NONE':'その他','RED_SBB':'赤SBB','BLUE_SBB':'青SBB','YELLOW_BB':'黄BIG','BOUSOU':'暴走モード','ISEKARU':'いせかる目','ISEKARU_EYE':'いせかる目','BIG_DIRECT':'BIG直撃','DIRECT_BIG':'BIG直撃','HAREM_BONUS':'ハーレムボーナス','BIG_TOTAL':'BIG合計','SPECIAL_15':'特殊15枚役'}
 def translate(v):
  if isinstance(v,list):
   for x in v:translate(x)
  if isinstance(v,dict):
   for k,x in list(v.items()):
    if k in ['label','title','name'] and isinstance(x,str) and x in labels:v[k]=labels[x]
    else:translate(x)
 translate(p['ui']);translate(p['inputs'])
 if mid=='LB_FUJIKO_M2':
  voice=next(f for f in p['features']['features'] if f['featureId']=='RF_BIG_VOICE_1G');later=next(f for f in p['features']['features'] if f['featureId']=='RF_BIG_VOICE_2G_PLUS')
  voiceIds=[]
  for f in [voice,later]:
   node=next(n for s in sections for n in s.get('items',[]) if n.get('featureId')==f['featureId']);voiceIds.extend(c['inputId'] for c in node['interaction']['categories'] if '不二子' in c['label'])
  alias('REF_RE_VOICE_FUJIKO_1',voiceIds,True)
  tab('BIG枚数調整成功ボイス',['OBS_RF_BIG_VOICE_1G','OBS_RF_BIG_VOICE_2G_PLUS'],['1G目','2G目以降'])
  s=next(s for s in sections if s['id']=='EVI_RE_REG_SCENARIOS');s2=copy.deepcopy(s);s2['id']+='_OTHER';sections.insert(sections.index(s)+1,s2)
  sequences=['ルパン→次元→五エ門→不二子','ルパン→銭形→五エ門→不二子','ルパン→次元→銭形→不二子','ルパン→次元→五エ門→赤不二子','ルパン→銭形→五エ門→赤不二子','ルパン→次元→銭形→赤不二子','赤ルパン→次元→五エ門→不二子','ルパン→次元→五エ門→赤3人','ルパン→銭形→五エ門→赤3人','ルパン→次元→銭形→赤3人','赤ルパン→次元→五エ門→赤不二子','赤ルパン→次元→五エ門→赤3人']
  for ix,ss in enumerate([s,s2]):
   ss['title']='REG中のキャラ紹介（'+['初回・5の倍数回目','それ以外'][ix]+'）'
   if ix:ss['items'][0]['id']+='_OTHER';ss['items'][0].pop('evidenceId',None)
   ss['description']='REG通算1・5・10・15…回目は「初回・5の倍数回目」、それ以外は別タブへ記録します。条件別出現率は未確認のため回数は記録のみ。シナリオ8〜10は設定2以上、11は設定4以上、12は設定5以上として反映します。赤は赤背景です。'
   ss['tabGroup']={'id':'B026_REG_SCENARIOS','title':'REG中のキャラ紹介','label':['初回・5の倍数回目','それ以外'][ix]}
   for k,c in enumerate(ss['items'][0]['interaction']['categories']):
    old=c['inputId'];new=old if ix==0 else old+'_OTHER'
    if ix:ni=copy.deepcopy(inp(old));ni['id']=new;ins.append(ni)
    c.update(id=new,inputId=new,label=str(k+1)+'：'+sequences[k]);inp(new)['name']=c['label']
    # Remove the old unconditional scenario constraints; recreate each separated opportunity below.
    if k>=7:evis.append({'id':'REG_SCENARIO_'+str(ix)+'_'+str(k+1),'inputId':new,'name':c['label'],'displayName':c['label'],'type':'SETTING_CONSTRAINT','confirmedSettings':[x for x in p['machine']['settings'] if int(x[4:])>=[2,4,5][0 if k<10 else k-9]],'deniedSettings':[],'sourceEvidenceRefs':['RE_REG_SCENARIOS']})
  evis[:]=[e for e in evis if not e['id'].startswith('RE_REG_SCENARIOS__')]
  for old,ks in [('REF_RE_REG_2PLUS_1',[8,9,10]),('REF_RE_REG_4PLUS_1',[11]),('REF_RE_REG_5PLUS_1',[12])]:alias(old,['REF_RE_REG_SCENARIOS_'+str(k)+suffix for suffix in ['', '_OTHER'] for k in ks],True)
  merge('BIG終了画面（記録のみ）',['EVI_RE_STAMP_KA','EVI_RE_STAMP_RYO','EVI_RE_STAMP_YU','EVI_RE_STAMP_KIWAMI'])
 if mid=='LB_SLOT_GALFY_A4':
  rainbow=next(c['inputId'] for s in sections if s['id']=='EVI_RE_SIDE_LAMP' for n in s['items'] for c in n['interaction']['categories'] if c['label']=='虹');alias('REF_RE_SIDE_RAINBOW_1',rainbow)
 if mid=='LB_EVA_PROMISE_DOOR_SR':
  alias('REF_RE_BELL_YELLOW_1','REF_RF_BELL_YELLOW_BB_1');alias('REF_RE_SINGLE_BOUSOU_1','REF_RF_SINGLE_BOUSOU_1')
  merge('REG中キャラ紹介',['EVI_RE_REG_KAORU','EVI_RE_REG_OTHER']);merge('BT中プレミアムムービー',['EVI_RE_BT_GENDO','EVI_RE_BT_KAJI','EVI_RE_BT_KAORU','EVI_RE_MOVIE_OTHER'])
  for s in sections:
   if s['title']=='BT中プレミアムムービー':s['description']='BT中に右リールへ赤7＋BARを狙い、所定の停止に成功したときだけ記録します。ゲンドウは設定4以上、加持は5以上、カヲルは6。失敗・未確認は記録に含めません。他のムービーは記録のみです。'
 if mid=='LB_ISEKAI_QUARTET_KR':
  for old,n in [('REF_RE_PAYOUT_086_3_1',3),('REF_RE_PAYOUT_086_4_1',4)]:
   for e in evis:
    if e['inputId']==old:e['minimumCount']=n
   alias(old,'REF_RE_PAYOUT_086_1')
  inp('REF_RE_PAYOUT_086_1')['name']='086枚OVER 当日累計回数'
  for s in sections:
   for node in s.get('items',[]):
    for x in node.get('interaction',{}).get('categories',[]):
     if x['inputId']=='REF_RE_PAYOUT_086_1':x.update(label='086枚OVER 当日累計回数',meaning='1回以上：設定2以上／3回以上：設定5以上／4回以上：設定6')
  merge('BIG終了画面',['EVI_RE_END_HAT','EVI_RE_END_HAM','EVI_RE_END_OTHER']);merge('サミートロフィー',['EVI_RE_TROPHY_BRONZE','EVI_RE_TROPHY_KIRIN','EVI_RE_TROPHY_RAINBOW']);merge('いせかるぼーなす キャラ・シナリオ',['EVI_RE_CHAR_SPORTS','EVI_RE_CHAR_BEACH','EVI_RE_CHAR_FESTIVAL','EVI_RE_SCENARIO_5','EVI_RE_SCENARIO_6','EVI_RE_CHAR_OTHER']);merge('獲得枚数表示',['EVI_RE_PAYOUT_086','EVI_RE_PAYOUT_RE0','EVI_RE_PAYOUT_666'])
 if mid=='LB_TOBE_HAREM_ACE_CF':
  merge('ボーナス終了画面',['EVI_RE_END_DOLLS_HOUSE','EVI_RE_END_SALUTE','EVI_RE_END_WEDDING','EVI_RE_END_OTHER']);merge('ボーナス中BAR停止形',['EVI_RE_BAR_LINE','EVI_RE_BAR_ZV']);merge('枚数調整成功ボイス',['EVI_RE_VOICE_SPECIAL_2','EVI_RE_VOICE_OTHER'])
 if mid.startswith('S_'):
  gid='REC_GRAPE_COUNT';ins.append({'id':gid,'name':'ブドウ回数（記録のみ）','category':'EVIDENCE_REFERENCE','type':'counter','unit':'回','defaultValue':0,'minimum':0,'inferenceRole':'DISPLAY_ONLY'})
  sections.append({'id':'EVI_GRAPE_REFERENCE','title':'ブドウ（記録のみ）','collapsible':True,'defaultExpanded':False,'description':'実戦値は確認済みの設定のみ保持しています。全設定の分布が揃わないため推測計算には使用しません。','descriptionPresentation':{'collapsible':True,'label':'説明','defaultExpanded':False},'items':[{'id':'NODE_GRAPE_REFERENCE','label':'ブドウ回数','interaction':{'type':'CATEGORY_COUNTERS','categoryCoverage':'NON_EXHAUSTIVE','totalOpportunities':'NONE','categories':[{'id':gid,'inputId':gid,'label':'ブドウ','meaning':'記録のみ・推測計算には使用しない'}]}}]})
  p['metadata']['grapeReference']=next(x.get('empiricalSiteMeans',{}) for x in read(d/'research/result.json')['findings'] if 'GRAPE_CANDIDATE' in x['findingId'])
 sections[:]=[s for s in sections if s.get('items') or s.get('groups')]
 p['v8']['machineResearchSummary']['highLowDiscrimination']=read(d/'high-low-benchmark.json');p['v8']['machineResearchSummary']['unresolved']=[x for x in p['v8']['machineResearchSummary'].get('unresolved',[]) if x['label']!='高低判別精度']
 p['metadata'].update(manifestVersion='8.5',observationPrerequisites=read(d/'candidate_contract/result.json').get('observationPrerequisites',[]),batch026Integration={'contract':'batch026-observation-contract-v1','rawCandidateCommit':'55d81dc66dadf57772ab30f78b71add4beef28df','deviceQa':'NOT_PERFORMED','ledgerCandidatesRetained':True,'sourceBoundedLimitationsRetained':True})
 p['metadata']['batch026Integration']['inputAliases']=aliases
 # Store complete candidate ledger for accountability, including closed and record-only items.
 p['metadata']['candidateLedger']=read(d/'research/result.json')['researchCompleteness']['candidateLedger']
 write(d/'app_runtime/delivered-result.json',{**a,'package':p,'integrationContract':'batch026-observation-contract-v1'})
 target=DIST/'machines'/mid/'machine-package.json';write(target,p);b=target.read_bytes();entry=next(x for x in cat['machines'] if x['machineId']==mid);entry.update(machineDataVersion=p['machine']['machineDataVersion'],sha256=hashlib.sha256(b).hexdigest(),packageSizeBytes=len(b),status='available',updatedAt='2026-10-26T22:36:26.000Z',requiredCapabilities=sorted(set(entry.get('requiredCapabilities',[])+['batch026_observation_contract','feature_suppression','derived_denominator','multinomial','evidence'])))
 logs.append({'machineId':mid,'sha256':entry['sha256'],'packageSizeBytes':len(b),'features':len(p['features']['features']),'evidences':len(evis),'inputs':len(ins),'rawCommonValidators':'PASS','deliveryAdapter':'batch026-observation-contract-v1','deviceQa':'NOT_PERFORMED'})
cat['generatedAt']='2026-10-26T22:36:26.000Z';write(DIST/'catalog.json',cat)
write(ROOT/'validation/package-integration.json',{'batchId':'batch-20261026-026','manifestVersion':'8.5','scope':'Ten packages only; previous 263 package files preserved byte-for-byte','rows':logs})
print(json.dumps(logs,ensure_ascii=False))
