"""Thunder-only input/UI overlay. No research, eligibility, rates or thresholds are rebuilt."""
import json,hashlib,sys
from pathlib import Path
here=Path(__file__).parent
baseline=Path(sys.argv[1]) if len(sys.argv)>1 else here/'correction-20261025/machine-package.json'
p=json.loads(baseline.read_text());old=json.loads(baseline.read_text())
assert p['machine']['machineId']=='LB_THUNDER_V_HA'
assert p['machine']['machineDataVersion']=='8.5.9-batch-20261022-025'
p['machine']['machineDataVersion']='8.5.10-batch-20261022-025'
if 'packagePolicy' in p['machine']:p['machine']['packagePolicy']['machineDataRevision']=10
p['metadata']['thunderInputSharing']={'revision':'20261025','normalBellCountInputId':'BELL_A.successCount','sharedSuccessCountInputId':'OVERLAP_BELL_A.sharedIntervalSuccessCount','intervalRecheckInputId':'INP_THUNDER_BELL_A_INTERVAL_RECHECK','legacyMigration':'PRESERVE_RAW_REQUIRE_EXPLICIT_NEW_COUNT','cohortRule':'START_BOTH_COUNTS_TOGETHER; NO_UNKNOWN_PREFIX; POST_ESTABLISHMENT_EXCLUDED'}
p['ui']['thunderInputSharing']=True
normal=next(s for s in p['ui']['v8Sections'] if s['id']=='OBS_SHARED_BONUS_ELIGIBLE_GAME_TRIAL')
order=['REG','CHERRY_B','BELL_A','BELL_B','WATER_A','WATER_B'];normal['items']=sorted(normal['items'],key=lambda x:order.index(x['featureId']))
# A direct counter per cell avoids a nested 12-column grid whose 11 gaps
# alone exceed a narrow phone cell. Bindings and counter behavior are unchanged.
normal['items']=[{**x,**x['inputs'][0],'id':x['id'],'featureId':x['featureId'],'title':x['title'],'gridSpan':6,'compactCounter':True} for x in normal['items']]
for x in normal['items']:x.pop('inputs',None)
sec=next(s for s in p['ui']['v8Sections'] if s['id']=='OBS_ROLE_OVERLAP');bell=next(x for x in sec['items'] if x.get('featureId')=='OVERLAP_BELL_A')
count=next(x for x in bell['inputs'] if x['input']=='counter');count.update(id='OVERLAP_BELL_A.sharedIntervalSuccessCount',inputId='OVERLAP_BELL_A.sharedIntervalSuccessCount',engineBinding={'inputId':'OVERLAP_BELL_A.sharedIntervalSuccessCount'},label='ベルA同時当選回数',gridSpan=12)
bell['title']='ベルA同時当選回数';bell['gridSpan']=12;bell['inputs']=[count];sec['items']=[bell];sec['groups']=[]
sec['description']='ベルAの成立回数は「通常時の小役・REG」から自動取得します。2つのカウントは同時に始め、ボーナス成立後を含めず、同じ区間で数えてください。同時当選時は必ずフリーズが発生します。'
f=next(x for x in p['features']['features'] if x['featureId']=='OVERLAP_BELL_A');f['denominatorInputId']='BELL_A.successCount';f['numeratorInputId']='OVERLAP_BELL_A.sharedIntervalSuccessCount'
reason='通常時に数えたベルA成立回数を母数、その同じ区間のフリーズを伴う同時当選回数を分子に、設定別の同時当選期待度で比較します。通常時の優先要素が有効な場合は重複加算しません。'
f['selectionRationale']['adoptionReason']=reason
for x in p['v8']['machineResearchSummary']['adopted']:
 if x['featureId']=='OVERLAP_BELL_A':x['reason']=reason
old_input=next(x for x in p['inputs']['inputs'] if x['id']=='OVERLAP_BELL_A.successCount')
p['inputs']['inputs'].append({**old_input,'id':'OVERLAP_BELL_A.sharedIntervalSuccessCount','name':'ベルA同時当選回数','parentInputId':'BELL_A.successCount'})
p['inputs']['inputs'].append({'id':'INP_THUNDER_BELL_A_INTERVAL_RECHECK','name':'ベルA同時当選の区間再確認','category':'V8_NUMERIC','type':'integer','defaultValue':0,'minimum':0,'inputVisible':False})
removed=['OVERLAP_CHERRY_B','OVERLAP_WATER_A','OVERLAP_WATER_B','OVERLAP_REPLAY']
for x in p['inputs']['inputs']:
 if x['id'] in ['OVERLAP_BELL_A.eligibleTrialCount','OVERLAP_BELL_A.successCount'] or any(x['id'].startswith(fid+'.') for fid in removed):x['inputVisible']=False
for x in p['metadata']['observationPrerequisites']:
 if x['findingId']=='OVERLAP_BELL_A':
  x['denominatorSemantics']='通常時のベルA成立回数を共有。同時当選と同時に数え始めた同じ区間のみ。成立後と、同時当選の記録開始前のベルAを含めない。旧専用母数・旧同時当選回数は自動移行しない。'
  x['liveObservation']['reason']=x['denominatorSemantics']
# Source adoption decisions remain byte-for-byte represented in their existing immutable artifacts.
for before,after in zip(old['features']['features'],p['features']['features']):
 assert before['featureId']==after['featureId']
 for key in ['probabilities','categoryProbabilities','modelType','trialUniverse','suppressedByFeatureIds']:
  assert before.get(key)==after.get(key),(before['featureId'],key)
assert old['features']['runtimeProjection']==p['features']['runtimeProjection']
assert old['blockedItems']==p['blockedItems']
assert old['v8']['machineResearchSummary']['notAdopted']==p['v8']['machineResearchSummary']['notAdopted']
out=here/'input-sharing-20261025';out.mkdir(exist_ok=True)
(out/'machine-package.json').write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
(out/'scope.json').write_text(json.dumps({'status':'PASS','baseDataCommit':'fe8c4e5793eeb5dac4d2b0d6f0b739226a1e2db5','version':p['machine']['machineDataVersion'],'normalOrder':order,'removedUiOnly':removed,'ratesModelsPrioritiesRuntimePolicyBlockedRejectionReasonsUnchanged':True,'researchRebuilt':False,'legacyInputsRetained':True},indent=2)+'\n')
print(p['machine']['machineDataVersion'])
