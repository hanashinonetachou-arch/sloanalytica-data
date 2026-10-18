import json,pathlib,hashlib
P=pathlib.Path(__file__).resolve().parents[2];B='batch-20261018-023';base=P/'batches'/B
sel=json.load(open(P/'next-machine-selection-20261018-batch023.json'))['selected'];out=[]
for m in sel:
 mid=m['machineId'];st={p.stem:json.load(open(p)) for p in (base/'machines'/mid/'stages').glob('*.json')}
 for n in ['RESEARCH','EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT']:
  assert st[n]['state']=='COMPLETE',(mid,n,st[n]['state'])
  ref=st[n]['authoritativeOutputRef'];f=P/ref['path'].removeprefix('production/');assert hashlib.sha256(f.read_bytes()).hexdigest()==ref['sha256'],(mid,n,'HASH')
 for n in ['OBSERVATION_EVIDENCE','CANONICAL_UI','MACHINE_DATA','RUNTIME_POLICY','RUNTIME_PROJECTION','APP_RUNTIME','DISTRIBUTION','DEVICE_QA']:assert st[n]['state']!='COMPLETE',(mid,n)
 d=json.load(open(base/'artifacts'/mid/'research/result.json'));e=json.load(open(base/'artifacts'/mid/'evaluation/result.json'));c=json.load(open(base/'artifacts'/mid/'candidate_contract/result.json'))
 assert all(a['disposition']['type'] in ['FINDING','BLOCKED','NO_SETTING_DIFFERENCE'] for a in d['researchCompleteness']['candidateLedger'])
 assert not c['sourceIntegrityIssues']
 if mid=='L_NOGIZAKA46_UD':
  for x in e['evaluations']:assert '0' in x['settingDistribution'] and '3' not in x['settingDistribution']
  assert any(t.get('meaning')=='設定0' and t['semanticType']=='EXACT_CONSTRAINT' for f in c['evidenceCandidates'] for t in f.get('semanticCategories',[]))
 out.append({'machineId':mid,'machineName':m['displayName'],'ledgerRows':len(d['researchCompleteness']['candidateLedger']),'numericEvaluations':len(e['evaluations']),'numericContractRoutes':len([x for x in c['candidates'] if x['runtimeInferenceAllowed']]),'evidenceGroups':len(c['evidenceCandidates']),'closedBlocks':len(c['blockedItems']),'state':'CANDIDATE_CONTRACT_COMPLETE','runtime':'NOT_EXECUTED','distribution':'NOT_EXECUTED','physicalQA':'NOT_PERFORMED'})
r={'schemaVersion':'batch023-formal-integrity-v1','status':'PASS','machines':out,'totals':{k:sum(x[k] for x in out) for k in ['ledgerRows','numericEvaluations','numericContractRoutes','evidenceGroups','closedBlocks']},'independentAudit':'NOT_PERFORMED','actionsRuns':0}
(P/'research-inbox/batch023/final-integrity.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n');print(json.dumps(r['totals']));print('PASS 10/10; implementation/distribution/QA untouched')
