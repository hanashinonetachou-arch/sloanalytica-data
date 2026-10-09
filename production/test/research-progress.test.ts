import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeResearchProgress} from '../src/research-progress.ts';

const draft=()=>({machineId:'fixture',researchStage:'EVIDENCE_STAGED_NOT_APPROVED',sources:[{sourceId:'s'}],
 findings:[{findingId:'n',observationType:'probability',settingDistribution:{'1':'.1'},liveObservation:{status:'UNRESOLVED',reason:'pending'}}],
 researchCompleteness:{status:'INCOMPLETE',domains:[
  {domain:'SMALL_ROLE',status:'CHECKED',sourceIds:['s'],note:'verified'},
  {domain:'CZ',status:'PARTIAL',sourceIds:['s'],note:'pending'},
  {domain:'BONUS',status:'NOT_APPLICABLE',sourceIds:['s'],note:'no bonus'}]}});
test('progress includes missing domains and never counts partial or unresolved candidates as approval',()=>{
 const d=draft(),s=summarizeResearchProgress([d]);
 assert.equal(s.requiredDomains,20);assert.equal(s.verifiedDomains,2);assert.equal(s.unverifiedDomains,18);
 assert.equal(s.machineRows[0].remainingDomains.filter(x=>x.status==='MISSING').length,17);
 assert.equal(s.numericCandidateObservationScopePending,1);
 assert.equal(s.machineRows[0].researchCompletenessStatus,'INCOMPLETE');
});
test('progress fails closed on duplicate machines/domains or unsupported checked provenance',()=>{
 assert.throws(()=>summarizeResearchProgress([draft(),draft()]),/PROGRESS_MACHINE_ID/);
 const d=draft();d.researchCompleteness.domains.push(d.researchCompleteness.domains[0]);
 assert.throws(()=>summarizeResearchProgress([d]),/PROGRESS_DOMAIN_ID/);
 const invalid=draft();invalid.researchCompleteness.domains[0].sourceIds=['missing'];
 assert.throws(()=>summarizeResearchProgress([invalid]),/PROGRESS_DOMAIN_PROVENANCE/);
});
