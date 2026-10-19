"""Read-only checkpoint verification, apart from writing verification.json."""
import hashlib,json,pathlib,subprocess
root=pathlib.Path(__file__).resolve().parents[2]
inbox=root/'research-inbox/batch024';batch=root/'batches/batch-20261019-024'
read=lambda p:json.loads(p.read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
sel=read(root/'next-machine-selection-20261019-batch024.json')['selected']
stages=['RESEARCH','EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT']
rows=[];current_works=set();refs=0;inputs=0
for m in sel:
 mid=m['machineId'];outputs={}
 for stage in stages:
  state=read(batch/'machines'/mid/'stages'/(stage+'.json'))
  assert state['state']=='COMPLETE',(mid,stage,state['state'])
  ref=state['authoritativeOutputRef'];p=root.parent/ref['path']
  assert sha(p)==ref['sha256'],p
  q=read(batch/'work-requests'/(ref['producerWorkId']+'.json'))
  assert q['stage']==stage and q['machineId']==mid
  attempt=read(batch/'machines'/mid/'attempts'/(q['attemptId']+'.json'))
  assert attempt['status']=='COMPLETE'
  assert read(batch/'leases'/(q['leaseId']+'.json'))['status']=='RELEASED'
  assert (batch/'events'/('accepted-'+q['workId']+'.json')).exists()
  for inp in q['inputArtifacts']:
   assert sha(root.parent/inp['path'])==inp['sha256'],inp
   inputs+=1
  current_works.add(q['workId']);outputs[stage]=read(p);refs+=1
 for p in (batch/'machines'/mid/'stages').glob('*.json'):
  if p.stem not in stages: assert read(p)['state']!='COMPLETE',p
 research=outputs['RESEARCH'];prov=research['importProvenance']
 assert sha(root.parent/prov['path'])==prov['sha256']
 for f in research['findings']:
  if f.get('observationType')=='appearance_distribution':
   for row in f['settingDistribution'].values():
    assert '=' not in row,row
 contract=outputs['CANDIDATE_CONTRACT']
 rows.append({'machineId':mid,'machineName':m['displayName'],'formalStages':'COMPLETE','ledgerRows':len(research['researchCompleteness']['candidateLedger']),'numericCandidates':len(contract['candidates']),'evidenceGroups':len(contract['evidenceCandidates']),'closedBlocks':len(contract['blockedItems'])})
archive=read(inbox/'review-reconciliation.json')
for item in archive: assert sha(root.parent/item['archivedPath'])==item['priorRef']['sha256']
chain=[json.loads(x) for x in (batch/'provenance/chain.jsonl').read_text().splitlines()]
assert current_works.issubset({x['workId'] for x in chain})
# First pass and revised pass each preserve the explicit machine ordering.
for pass_records in [chain[:len(sel)*len(stages)],chain[len(sel)*len(stages):]]:
 positions={m['machineId']:i for i,m in enumerate(sel)}
 order=[positions[x['machineId']] for x in pass_records]
 assert order==sorted(order),'machine order'
base='b4cb47f0cb925a113107a75218f7414cd8033ad5'
paths=subprocess.check_output(['git','diff','--name-only',base],cwd=root.parent,text=True).splitlines()
paths+=subprocess.check_output(['git','ls-files','--others','--exclude-standard'],cwd=root.parent,text=True).splitlines()
allowed=('production/research-inbox/batch024/','production/batches/batch-20261019-024/','production/specs/batch-20261019-024.json')
assert all(p.startswith(allowed) for p in paths),[p for p in paths if not p.startswith(allowed)]
test_log=(inbox/'existing-tests.log').read_text()
assert 'ℹ tests 47' in test_log and 'ℹ pass 47' in test_log and 'ℹ fail 0' in test_log
result={'batchId':'batch-20261019-024','status':'VERIFIED_THROUGH_CANDIDATE_CONTRACT','machines':rows,'currentArtifactHashesVerified':refs,'currentInputArtifactHashesVerified':inputs,'priorArtifactHashesVerified':len(archive),'existingTests':{'passed':47,'failed':0},'runtime':'NOT_EXECUTED','distribution':'NOT_EXECUTED','physicalQA':'NOT_PERFORMED','independentAudit':'NOT_PERFORMED','actionsRuns':0}
(inbox/'verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False))
