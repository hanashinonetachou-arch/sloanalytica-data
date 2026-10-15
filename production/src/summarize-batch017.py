import json,pathlib,collections,hashlib,csv
ROOT=pathlib.Path(__file__).resolve().parents[1];base=ROOT/'batches/batch-20261015-017'
original=[];machines=[];classes=collections.Counter();metrics=collections.Counter();exact=0;evalrows=[]
for entry in json.load(open(ROOT/'next-machine-selection-20261015.json'))['selected']:
 mid=entry['machineId'];b=base/'artifacts'/mid
 get=lambda s:json.load(open(b/s/'result.json'))
 r=get('research');e=get('evaluation');c=get('candidate_contract');policy=get('runtime_policy');pkg=get('app_runtime')['package']
 eb={x['findingId']:x for x in e['evaluations']};cb={x['findingId']:x for x in c['candidates']};pb={x['findingId']:x for x in policy['featureDecisions']}
 rows=[]
 for old in r['inheritedCandidateDispositions']:
  dec=dict(old['finalDisposition']);fid=dec.get('findingId');dec['processingRoute']=dec.pop('route')
  if fid in eb:
   ev=eb[fid];cc=cb.get(fid);pd=pb.get(fid)
   dec.update(selectionScore=ev['metrics']['selectionScore'],benchmarkExposure=ev['benchmarkExposure'],perEligibleTrialPower=ev['metrics']['perEligibleTrialPower'])
   if ev['metrics']['selectionScore']['status']=='COMPUTED':dec['selectionClass']=ev['selectionClass']
   if cc:dec.update(dependencyResolution=cc['dependencyResolution'],resolvedIntoFindingId=cc.get('resolvedIntoFindingId'))
   if cc and cc['dependencyResolution']=='RESOLVED_IN_JOINT_MODEL':dec['processingRoute']='JOINT_COMPONENT'
   elif cc and not cc['runtimeInferenceAllowed']:dec['processingRoute']='DEPENDENCY_NOT_SELECTED'
   elif pd:dec['processingRoute']='NUMERIC_ACTIVE_OR_FALLBACK' if pd['state']=='ACTIVE' else 'EXCLUDE_BELOW_RUNTIME_THRESHOLD'
   else:dec['processingRoute']='EXCLUDE_NUMERIC'
  row=dict(candidateId=old['candidate_id'],machineId=mid,label=old['name'],**dec);original.append(row);rows.append(row)
 for ev in e['evaluations']:
  scored=ev['metrics']['selectionScore']['status']=='COMPUTED'
  if scored:classes[ev['selectionClass']]+=1
  evalrows.append(dict(machineId=mid,**ev))
 for f in pkg['features']['features']:
  cc=cb[f['featureId']];metrics[cc['runtimePolicyBinding']['metric']]+=1
 exact+=sum(x.get('type')=='SETTING_CONSTRAINT' for x in pkg['evidence']['evidences'])
 stages={p.stem:json.load(open(p))['state'] for p in (base/'machines'/mid/'stages').glob('*.json')}
 machines.append(dict(machineId=mid,name=entry['displayName'],originalCandidates=len(rows),candidateContract='COMPLETE',machineData='COMPLETE',appRuntime='COMPLETE',stageStates=stages,runtimeFeatures=len(pkg['features']['features']),evidenceDefinitions=len(pkg['evidence']['evidences']),activeFeatures=[f['name'] for f in pkg['features']['features']]))
assert len(original)==102 and len({r['candidateId'] for r in original})==102
routes=collections.Counter(r['processingRoute'] for r in original)
summary=dict(batchId='batch-20261015-017',manifestVersion='8.5',originalCandidateCount=102,processingRoutes=dict(routes),evaluationModels=len(evalrows),formalEIG7000Models=sum(classes.values()),selectionClasses=dict(classes),runtimeMetricBindings=dict(metrics),exactConstraintDefinitions=exact,candidateContracts=10,machineData=10,appRuntimePackages=10,machines=machines,distribution='COMPLETE' if all(m['stageStates']['DISTRIBUTION']=='COMPLETE' for m in machines) else 'NOT_PUBLISHED',deviceQA='PARTIAL_PASS_CORRECTIONS_AWAITING_RECHECK' if (base/'device-qa/user-feedback-20261016.json').exists() else 'NOT_PERFORMED',independentExternalAudit='NOT_PERFORMED')
(base/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
(base/'candidate-final-dispositions.json').write_text(json.dumps(original,ensure_ascii=False,indent=2)+'\n')
(base/'evaluation-summary.json').write_text(json.dumps(evalrows,ensure_ascii=False,indent=2)+'\n')
with (base/'candidate-final-dispositions.csv').open('w',newline='') as f:
 w=csv.writer(f);w.writerow(['candidateId','machineId','label','processingRoute','reason'])
 for r in original:w.writerow([r[k] for k in ['candidateId','machineId','label','processingRoute','reason']])
prior=json.load(open(base/'imported-handoff/extracted/IG_TRIAL_SCENARIOS.json'))['scenarios'];match=[]
for x in prior:
 if x['trials']!=7000:continue
 for ev in evalrows:
  if ev['metrics']['selectionScore']['status']!='COMPUTED':continue
  name=next(m['name'] for m in machines if m['machineId']==ev['machineId'])
  if name!=x['machine']:continue
  score=ev['metrics']['selectionScore']['value']
  if abs(score-x['score_x200'])<0.00002:match.append(dict(machine=x['machine'],parameter=x['parameter'],findingId=ev['findingId'],priorScore=x['score_x200'],formalScore=score));break
reuse=dict(retainedScenarios=len(prior),retainedSeries=len({(x['machine'],x['parameter']) for x in prior}),scenarioRecomputation=False,formalScalarMatches=match,scope='Diagnostic n-trial curves retained intact. Formal engine and validator establish reviewed denominators; zero-imputed REG rows remain constraints only.')
(base/'validation/previous-calculation-reuse.json').write_text(json.dumps(reuse,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in summary.items() if k!='machines'},ensure_ascii=False,indent=2))
