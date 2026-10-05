import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {buildEvaluation} from './evaluation-builder.ts';
import {buildDependencyReview} from './dependency-gate.ts';

// Discovery audit only. It does not complete RESEARCH or authorize runtime adoption.
const root=process.cwd();
const batchId='batch-20261005-006';
const batchRoot=path.join(root,'batches',batchId);
const read=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
const batch=read(path.join(batchRoot,'batch.json'));
const order=read(path.join(root,'machine-production-order.json'));
const ids=batch.waves.flatMap((w:any)=>w.machineIds);
assert.deepEqual(ids,order.nextSequence);
assert.equal(order.completedThroughMachineId,'L_NEO_PLANET_SLED');
const sourceArg=process.argv.find(x=>x.startsWith('--identity-source='));
if(!sourceArg)throw new Error('USAGE: --identity-source=<canonical-distribution-metadata-file>');
const bytes=fs.readFileSync(sourceArg.slice('--identity-source='.length));
const blob=crypto.createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
assert.equal(blob,order.source.sourceBlobSha,'Canonical selection source changed; reconcile first');
const source=JSON.parse(bytes.toString('utf8'));
const sourceIds=source.machines.map((m:any)=>m.machineId);
const cursor=sourceIds.indexOf(order.completedThroughMachineId);
assert.ok(cursor>=0);
assert.deepEqual(ids,sourceIds.slice(cursor+1,cursor+11));
const machines=ids.map((machineId:string,ordinal:number)=>{
 const d=read(path.join(batchRoot,'research-progress',machineId+'.json'));
 assert.equal(d.machineId,machineId);assert.equal(d.status,'IN_PROGRESS');
 assert.equal(d.stageCompletionClaim,false);assert.equal(d.selectedOrdinal,ordinal+1);
 const findingIds=d.numericalCandidates.map((f:any)=>f.findingId);
 assert.equal(new Set(findingIds).size,findingIds.length);
 const sourceIdSet=new Set(d.sources.map((s:any)=>s.sourceId));
 for(const f of d.numericalCandidates){
  assert.deepEqual(Object.keys(f.settingDistribution).map(Number),d.settings.values);
  assert.ok(f.sourceIds.every((x:string)=>sourceIdSet.has(x)));
  assert.equal(f.scopeVerification,'PENDING');
 }
 const research={...d,findings:d.numericalCandidates,blockedItems:[]};
 const evaluation=buildEvaluation(research);
 const review=buildDependencyReview(d.numericalCandidates);
 const stage=read(path.join(batchRoot,'machines',machineId,'stages','RESEARCH.json'));
 assert.notEqual(stage.state,'COMPLETE','Discovery must not be represented as completed Research');
 return {machineId,ordinal:ordinal+1,researchStage:stage.state,discoveryStatus:d.status,
  candidateCount:d.numericalCandidates.length,dependencyReview:review.summary,
  provisionalEvaluation:evaluation.evaluations.map((e:any)=>({findingId:e.findingId,label:e.label,
   model:e.model,trialUniverse:e.trialUniverse,selectionScore:e.metrics.selectionScore,
   perEligibleTrialPower:e.metrics.perEligibleTrialPower,selectionClass:e.selectionClass,
   adoptionStatus:'NOT_AUTHORIZED_SCOPE_AND_COMPLETENESS_PENDING'}))};
});
// The inherited gate must keep common denominators separate unless semantic overlap is explicit.
const bancho=machines[0];
assert.equal(bancho.dependencyReview.groups.some((g:any)=>g.members.includes('common-bell-a')),false);
assert.equal(bancho.dependencyReview.groups.some((g:any)=>g.members.includes('weak-cherry')),false);
assert.ok(bancho.dependencyReview.groups.some((g:any)=>g.members.includes('direct-total')&&g.members.includes('at-initial')));
const report={schemaVersion:'research-discovery-audit-v1',manifestVersion:'8.5',batchId,
 status:'PASS',completedResearchMachines:0,checkedSourceBlobSha:blob,
 productionBaseCommit:'30598f4564f912a2aa86e0a6805d77873a36bd5d',
 purpose:'Validate selected order and discovered numeric source distributions with inherited evaluation/dependency builders; no stage completion or adoption.',
 machines};
fs.writeFileSync(path.join(batchRoot,'research-progress','audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,machines:machines.length,candidates:machines.reduce((n:any,m:any)=>n+m.candidateCount,0),completedResearchMachines:0}));
