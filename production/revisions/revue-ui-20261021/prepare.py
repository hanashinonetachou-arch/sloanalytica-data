import json, pathlib, hashlib, copy
root=pathlib.Path(__file__).resolve().parents[4]/'distribution024'
rev=pathlib.Path(__file__).resolve().parent
mid='S_REVUE_STARLIGHT_CX'; path=root/'machines'/mid/'machine-package.json'
p=json.loads((rev/'original-package.json').read_text()); old=copy.deepcopy(p)
version='0.3.12'; agg='INP_SPECIFIC_BONUS_5_AGG'; feat='FEAT_SPECIFIC_BONUS_5_AGG'
triggers=[('KIRAMEKI_REG','キラめき目＋REG'),('CHANCE_REG','チャンス目＋REG'),('WATERMELON_REG','スイカ＋REG'),('WATERMELON_BLUE_BIG','スイカ＋青7BIG'),('CHANCE_BLUE_BIG','チャンス目＋青7BIG'),('UNKNOWN','契機不明')]
ids=['INP_SPECIFIC_BONUS_'+suffix for suffix,label in triggers]
for suffix,label in triggers:
 p['inputs']['inputs'].append({'id':'INP_SPECIFIC_BONUS_'+suffix,'name':label,'type':'counter','category':'NUMERIC','unit':'回','inferenceRole':'LIVE_CONDITIONAL','defaultValue':None,'minimum':0})
a=next(x for x in p['inputs']['inputs'] if x['id']==agg)
a.update(derivedCalculation='sum',derivedFromInputIds=ids,inputVisible=False,legacyAggregateTargetInputId=ids[-1],name='特定ボーナス合算（自動計算）')
next(x for x in p['inputs']['inputs'] if x['id']=='DERIVED_FEAT_SPECIFIC_BONUS_5_AGG_ELIGIBLE_TRIALS')['requireAllTermsObserved']=True
sections=p['ui']['sections']; specific=next(s for s in sections if s['id']=='SEC_SPECIFIC_BONUS')
notes='※同じボーナスは、いずれか1つの欄に入力してください。\n※「契機不明」は、対象5契機の特定ボーナスと確認できたものの、どの契機か区別できない場合に入力してください。対象かどうか不明なボーナスは含めません。\n※前兆中にレア役を引き、成立したボーナスとの組み合わせが特定ボーナスの対象外になる可能性がある場合は、合算対象から除外し、「契機不明」にも入力しないでください。'
specific['description']='5契機と契機不明の回数を自動合算し、設定推測には合算だけを使用します。\n'+notes
specific['descriptionPresentation']={'collapsible':False}
g=specific['items'][0]; existing=g['inputs'][1:]
for n in existing:
 n['directNumeric']=True
 if n['input']=='denominator':n['quickAdd']=[50]
 if n['id']=='INP_NORMAL_REPRODUCTION_ENTRIES': n['description']='1回につき20Gを自動で除外します。突入なしを確認できた場合は0を入力してください。';n['descriptionPresentation']={'collapsible':False}
 if n['id']=='INP_BONUS_BROADER_GAMES':
  n['label']='通常・CZ・ATの対象G';n['description']='同じ記録区間の通常・CZ・AT中のGを入力します。ボーナス中や、再生産モード以外の赤BIGを保持した区間は含めません。再生産モードの除外分は下の3欄から自動で差し引きます。';n['descriptionPresentation']={'collapsible':False}
existing[-2]['description']='該当区間なしを確認できた場合は0を入力してください。';existing[-1]['description']=existing[-2]['description']
g.pop('inferenceReadiness',None)
g['inputs']=[{'id':iid,'inputId':iid,'label':label,'input':'counter','gridSpan':6,'directNumeric':True,'engineBinding':{'inputId':iid},'featureId':feat} for iid,(_,label) in zip(ids,triggers)]+existing+[{'id':'SPECIFIC_BONUS_STATUS','derivedObservationStatus':{'aggregateInputId':agg,'effectiveTrialInputId':'DERIVED_FEAT_SPECIFIC_BONUS_5_AGG_ELIGIBLE_TRIALS','requiredInputs':[{'id':x['id'],'label':x['label']} for x in existing]}}]
normal=sections[0]['items'][0]['inputs']
normal[0].update(inputId='INP_NORMAL_GAMES',playDataBinding={'source':'PLAY_NORMAL_GAME_DELTA','mode':'AUTO_EXACT','exactness':'EXACT_ONLY'})
for n in normal[1:]:n['directNumeric']=True
for cat in sections[1]['items'][0]['interaction']['categories']:cat.pop('meaning',None)
big=next(s for s in sections if s['id']=='SEC_BONUS_END'); hard=copy.deepcopy(big)
hard.update(id='SEC_BONUS_END_EXACT',items=[big['items'][1]],description='青・赤・金・虹のエフェクトを記録します。同じ終了画面を「通常の示唆」にも入力しないでください。',tabGroup={'id':'REVUE_BIG_END','title':big['title'],'label':'確定エフェクト'})
big.update(items=[big['items'][0]],description='確定エフェクトが出なかった終了画面を、3種類のうち1つに記録します。3種類の確認回数から設定推測に使用します。',tabGroup={'id':'REVUE_BIG_END','title':big['title'],'label':'通常の示唆'})
sections.insert(sections.index(big)+1,hard)
# Formal evaluation is scoped to the three normal voices; no invented confirmation-voice probabilities.
atid='FEAT_AT_END_KIRIN_HINT_MULTINOMIAL'; voiceids=['INP_AT_END_VOICE_DEFAULT','INP_AT_END_VOICE_HIGH_WEAK','INP_AT_END_VOICE_HIGH_STRONG']
labels=['デフォルト','高設定示唆・弱','高設定示唆・強']; voices=['オーディション終了します。','そこまでキラめきが残るなんて予測できませんでした。','トップスタァになったあなたが望む「運命の舞台」とは？']
for iid,label in zip(voiceids,labels):p['inputs']['inputs'].append({'id':iid,'name':label,'type':'counter','category':'NUMERIC','unit':'回','inferenceRole':'LIVE_CONDITIONAL','defaultValue':None,'minimum':0})
rows=json.loads((rev/'normalizedRows.json').read_text()); e=json.loads((rev/'evaluation.json').read_text())['evaluations'][0]
evaluation={'metric':'PER_ELIGIBLE_TRIAL_POWER','value':e['metrics']['perEligibleTrialPower'],'status':'FORMAL','userLabel':'1回の判別力'}
policy={'mode':'THRESHOLD','metric':'PER_ELIGIBLE_TRIAL_POWER'}
for key in ['candidates','runtimeProjection']:
 a=next(x for x in p['features'][key] if x['featureId']==atid);a.update(eligibility='ELIGIBLE',evaluation=evaluation,runtimePolicyBinding=policy,importance='補助')
 if key=='runtimeProjection':a.update(runtimeStatus='ACTIVE',runtimeReason='THRESHOLD_MET')
f=copy.deepcopy(p['features']['features'][-1]);f.update(featureId=atid,name='AT終了時の通常ボイス',numeratorInputId=voiceids[0],denominatorInputId=voiceids[0],categoryInputIds=voiceids[1:],categoryProbabilities=rows,sourceResearchFeatureIds=['RF_AT_END_KIRIN_HINT_DISTRIBUTION'],categoryConditioning={'excludedCategories':['EV_KIRIN_2PLUS','EV_KIRIN_4PLUS','EV_KIRIN_6'],'normalization':'SOURCE_CONDITIONAL_NO_RENORMALIZATION'})
p['features']['features'].append(f)
at=next(s for s in sections if s['id']=='SEC_KIRIN_VOICE'); at.update(tabGroup={'id':'REVUE_AT_END','title':at['title'],'label':'確定ボイス'})
at['description']='AT終了時に「アタシ再生産」役物をタッチして確認した確定ボイスを記録します。同じボイスを「通常の示唆」にも入力しないでください。'
atnormal=copy.deepcopy(at);atnormal.update(id='SEC_KIRIN_VOICE_NORMAL',importance='補助',description='AT終了時に「アタシ再生産」役物をタッチし、確定ボイス以外を3種類のうち1つに記録します。確認できなかった回は加算しません。',tabGroup={'id':'REVUE_AT_END','title':at['title'],'label':'通常の示唆'},items=[{'id':'OBS_AT_END_NORMAL_VOICE','observationMultiplicity':'REPEATED_CATEGORICAL_EVENT','interaction':{'type':'CATEGORY_COUNTERS','categoryCoverage':'EXHAUSTIVE','totalOpportunities':'SUM_CATEGORY_COUNTS','preservePriorObservations':True,'showAccumulatedCounts':True,'categories':[{'id':iid,'label':label,'meaning':voice,'engineBinding':{'inputId':iid},'featureId':atid} for iid,label,voice in zip(voiceids,labels,voices)]}}])
sections.insert(sections.index(at),atnormal)
selection=p['v8']['selection'];selection['machineDataVersion']=version
selection['inputs']=copy.deepcopy(p['inputs']['inputs'])
selection['selectionSummaryContract'].update(liveConditionalCount=3,unresolvedCount=0)
sf=next(x for x in selection['features'] if x['featureId']==atid);sf.update(adoptionCategory='LIVE_CONDITIONAL',trialUniverse='AT_END_NON_CONFIRMATION_VOICE_TRIAL',liveInferenceGate='EXACT_CATEGORY_COUNTS_COMPLETE',userReason='通常3種の全設定の公開振り分けを、確定ボイスを除く確認回数だけに使用する。',eligibility='ELIGIBLE',evaluation=evaluation,runtimePolicyBinding=policy,importance='補助',dependencyContract={'relationship':'COLOCATED_WITH_AT_END_VOICE_EVIDENCE','combinationPolicy':'CONDITIONAL_NUMERIC_EXCLUDES_CONFIRMATION_EVIDENCE_TRIALS'})
obs=p['v8']['observation'];ob=next(x for x in obs['numeric'] if x['featureId']==feat)
if ob:
 ob['how']='5契機と対象と確認できた契機不明を自動合算する。'+notes
 ob['inputs']=[{'id':iid,'label':label,'type':'counter','unit':'回','directNumeric':True} for iid,(_,label) in zip(ids,triggers)]+ob['inputs'][1:]
obs.setdefault('revisionContracts',[]).append({'featureId':atid,'trialUniverse':'AT_END_NON_CONFIRMATION_VOICE_TRIAL','categoryInputIds':voiceids,'excludedEvidenceInputIds':['INP_V8_EV_KIRIN_2PLUS','INP_V8_EV_KIRIN_4PLUS','INP_V8_EV_KIRIN_6'],'sumCategoryCounts':True})
obs['generatedAt']='2026-10-21'
obs['numeric'].append({'featureId':atid,'context':'AT終了時の通常ボイス','runtimeRole':'LIVE_CONDITIONAL_EXACT_CATEGORICAL','how':atnormal['description'],'model':'multinomial','denominator':{'type':'DERIVED_SUM','inputIds':voiceids},'inputs':[{'id':iid,'label':label,'type':'counter','unit':'回'} for iid,label in zip(voiceids,labels)],'exclusionRule':{'excludedEvidenceOutcomes':['EV_KIRIN_2PLUS','EV_KIRIN_4PLUS','EV_KIRIN_6'],'reason':'確定ボイスの出現機会は通常3種の分母に含めない。'},'stateSemantics':{'unobserved':None,'observedZero':0}})
summary=p['v8']['machineResearchSummary'];summary['generatedAt']='2026-10-21'
summary['selection']['liveConditional'].append({'featureId':atid,'label':'AT終了時の通常ボイス','reason':sf['userReason'],'evaluation':evaluation,'importance':'補助','benchmarkScoreStatus':'BLOCKED_UNRESOLVED_EXPOSURE'})
summary['notAdopted']=[{'name':'特定ボーナス5種の個別評価','label':'特定ボーナス5種の個別評価','reason':'各契機は入力できますが、同じボーナスを二重に評価しないよう、推測には合算だけを使用します。'},{'name':'赤BIG・青BIG・REG・ボーナス合算','label':'赤BIG・青BIG・REG・ボーナス合算','reason':'特定ボーナスの成立経路と重なるため、独立した設定推測要素としては採用していません。'},{'name':'条件付きAT直撃','label':'条件付きAT直撃','reason':'正確な抽選対象回数を実戦で常に確認できないため、設定推測には使用していません。'}]
summary['unresolved']=[s for s in summary['unresolved'] if not s.startswith('AT-end')]
summary['evidence']['suggestionOnly']=[];summary['evidence']['unsupportedOrUnresolved']=[]
summary['uiGuidance']['specificBonus']='5契機と対象と確認できた契機不明を入力し、自動合算のみを評価。'+notes
summary['uiGuidance']['bonusEndInput']=big['description']+' '+hard['description']
p['machine']['machineDataVersion']=version
p['provenance']['targetedRevision']={'id':'revue-ui-20261021','date':'2026-10-21','scope':['SPECIFIC_BONUS_BREAKDOWN_UI','AT_NORMAL_VOICE_CONDITIONAL_DISTRIBUTION','LEGACY_UI_REPAIR'],'preservesLegacyResearchOrigin':True,'officialSource':'https://oizumi-slot-dev-room.com/qa/396'}
def write(path,obj):path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
write(path,p)
repro=root/'repro-v8'/mid
for name,k in [('selection-data','selection'),('observation-contract','observation'),('machine-research-summary','machineResearchSummary')]:write(repro/(name+'.json'),p['v8'][k])
can=json.loads((repro/'canonical-ui.json').read_text());can.update(sections=sections,generatedAt='2026-10-21');write(repro/'canonical-ui.json',can)
r=json.loads((repro/'research-data.json').read_text());r['targetedRevision']={'officialAtNormalVoices':json.loads((rev/'research.json').read_text()),'specificBonusTriggerInputs':[{'id':iid,'label':label} for iid,(_,label) in zip(ids,triggers)],'sources':['https://nana-press.com/kaiseki/machine/886/27707/','https://1geki.jp/slot/l_revuestarlight/44/'],'notes':notes};write(repro/'research-data.json',r)
catpath=root/'catalog.json';cat=json.loads(catpath.read_text());entry=next(x for x in cat['machines'] if x['machineId']==mid);raw=path.read_bytes();entry.update(machineDataVersion=version,sha256=hashlib.sha256(raw).hexdigest(),packageSizeBytes=len(raw),updatedAt='2026-10-21T00:00:00Z');cat['generatedAt']='2026-10-21T00:00:00Z';write(catpath,cat)
write(rev/'revision-record.json',{'machineId':mid,'previousVersion':old['machine']['machineDataVersion'],'machineDataVersion':version,'sha256':entry['sha256'],'packageSizeBytes':len(raw),'status':'IMPLEMENTED_QA_PENDING','batch024Status':'DEVICE_QA_HUMAN_REQUIRED','probabilityChanges':['AT normal voice conditional distribution only'],'unchangedProbabilityFeatures':[x['featureId'] for x in old['features']['features']]})
print(json.dumps({'version':version,'bytes':len(raw),'sha256':entry['sha256']}))
