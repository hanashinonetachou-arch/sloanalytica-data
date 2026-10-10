import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {buildResearchResolutionRequirements} from '../src/research-resolution-requirements.ts';

const batch='batches/batch-20261008-009';
const review=()=>JSON.parse(fs.readFileSync(path.join(batch,'research-resolution-review-v47-20261010.json'),'utf8')).rows;
const drafts=()=>{
 const audit=JSON.parse(fs.readFileSync(path.join(batch,'research-progress-audit-v42-20261009.json'),'utf8'));
 return audit.machineRows.map((m:any)=>{
  const wave=fs.existsSync(path.join(batch,'research-working/wave-1',m.machineId+'.json'))?'wave-1':'wave-2';
  return JSON.parse(fs.readFileSync(path.join(batch,'research-working',wave,m.machineId+'.json'),'utf8'));
 });
};

test('Resolution review covers every remaining domain and numeric candidate without changing research',()=>{
 const d=drafts(),before=JSON.stringify(d);
 const result=buildResearchResolutionRequirements(d,review(),'v42');
 assert.equal(result.remainingDomains,36);
 assert.equal(result.unresolvedNumericCandidates,22);
 assert.equal(result.rows.length,58);
 assert.equal(JSON.stringify(d),before);
 assert.ok(result.rows.every(r=>r.resolutionStatus==='OPEN'&&r.approvalRequired===false));
 assert.deepEqual(result.machineOrder,d.map(x=>x.machineId));
 const internal=result.rows.find(r=>r.machineId==='S_BIOHAZARD_RE2_XB'&&r.refId==='CZ')!;
 assert.ok(internal.blockerKinds.includes('LATENT_STATE_NOT_IDENTIFIABLE'));
 const end=result.rows.find(r=>r.refId==='at-end-categorical')!;
 assert.deepEqual(end.blockerKinds,['OBSERVATION_RECONCILIATION_NOT_IMPLEMENTED']);
});

test('New pending candidate cannot silently disappear from the resolution work queue',()=>{
 const d=drafts();
 d[0].findings.push({findingId:'new-pending',observationType:'probability',settingDistribution:{'1':'1/100'},
  liveObservation:{status:'UNRESOLVED'},sourceIds:[d[0].sources[0].sourceId]});
 assert.throws(()=>buildResearchResolutionRequirements(d,review(),'v42'),/RESOLUTION_MISSING_TARGET.*new-pending/);
});

test('Duplicate and stale review references cannot substitute for missing work',()=>{
 const r=review();r.push(r[0]);
 assert.throws(()=>buildResearchResolutionRequirements(drafts(),r,'v42'),/RESOLUTION_DUPLICATE_TARGET/);
 const stale=review();stale[0].refId='unknown';
 assert.throws(()=>buildResearchResolutionRequirements(drafts(),stale,'v42'),/RESOLUTION_UNKNOWN_TARGET/);
});

test('Invalid classifications, empty proof and unregistered provenance are rejected',()=>{
 const r=review();r[0].blockerKinds=['UNCHECKED_MEANS_UNPUBLISHED'];
 assert.throws(()=>buildResearchResolutionRequirements(drafts(),r,'v42'),/RESOLUTION_BLOCKER_KIND/);
 const empty=review();empty[0].requiredProof=[' '];
 assert.throws(()=>buildResearchResolutionRequirements(drafts(),empty,'v42'),/RESOLUTION_REQUIRED_PROOF/);
 const d=drafts();d[0].researchCompleteness.domains.find((x:any)=>x.domain==='INITIAL_HIT').sourceIds=['unknown'];
 assert.throws(()=>buildResearchResolutionRequirements(d,review(),'v42'),/RESOLUTION_SOURCE_PROVENANCE/);
});

test('RE2 marginal direct AT remains reference only, separate from role-conditioned trials',()=>{
 const d=drafts().find((x:any)=>x.machineId==='S_BIOHAZARD_RE2_XB');
 const b=d.blockedItems.find((x:any)=>x.blockId==='re2-direct-at-marginal-scope');
 assert.deepEqual(Object.values(b.referenceMarginalDistribution.settingDistribution),
  ['1/9101','1/7419','1/6016','1/2914','1/2379','1/2094']);
 assert.equal(b.referenceMarginalDistribution.runtimeSettingLikelihood,'DISABLED');
 assert.equal(b.observationScopeAudit.status,'UNRESOLVED_OBSERVATION_SCOPE');
 assert.ok(d.researchCompleteness.candidateLedger.some((r:any)=>r.disposition.refId===b.blockId&&r.disposition.type==='BLOCKED'));
 assert.ok(!d.findings.some((f:any)=>f.findingId===b.blockId));
});
