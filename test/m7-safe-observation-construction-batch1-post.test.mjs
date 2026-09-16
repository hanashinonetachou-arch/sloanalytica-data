import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateObservationFiles} from '../tools/validate-machine-observation-data.mjs';

const REVIEW='reports/m7-phase2-2-single-discrete-evidence-review-20260916.json';
const TARGETS=[
 ['L_ANOTHER_RINO_HEAVEN_CC','RINO_TROPHY'],
 ['L_BIOHAZARD_VILLAGE_XA','TROPHY'],
 ['L_GEN_CHOMUGEN_PH','TROPHY'],
];
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const norm=a=>[...a].sort();

test('batch1 production observation files validate',()=>{
 const files=TARGETS.map(([m])=>`research/${m}/machine-observation-data.json`);
 const r=validateObservationFiles(files,{emitWarnings:false});
 assert.equal(r.ok,true,JSON.stringify(r.errors));
});

test('batch1 has exact formal observation IDs and exact reviewed evidence lineage',()=>{
 const review=read(REVIEW);
 for(const [machineId,groupId] of TARGETS){
  const reviewed=review.groups.find(g=>g.machineId===machineId&&g.groupId===groupId);
  assert.ok(reviewed);
  const data=read(`research/${machineId}/machine-observation-data.json`);
  const id=`OBS_EVI_${groupId.replace(/[^A-Z0-9_]/gi,'_').toUpperCase()}`;
  const matches=(data.observations||[]).filter(o=>o.observationId===id);
  assert.equal(matches.length,1,`${machineId}/${groupId}: expected one ${id}`);
  const o=matches[0];
  assert.equal(o.groupId,groupId);
  assert.deepEqual(norm(o.sourceEvidenceIds||[]),norm(reviewed.selectedSourceEvidenceIds||[]));
  assert.equal(o.sourceType,'END_EVENT');
  assert.equal(o.observationMode,'VISUAL_EVENT');
  assert.equal(o.status,'FOUND');
 }
});

test('batch1 formalization does not claim real-device verification or alter unrelated feature mappings',()=>{
 for(const [machineId] of TARGETS){
  const data=read(`research/${machineId}/machine-observation-data.json`);
  const evidenceObs=(data.observations||[]).filter(o=>o.observationId.startsWith('OBS_EVI_'));
  assert.equal(evidenceObs.length,1);
  for(const m of (data.featureMappings||[])) for(const id of (m.observationIds||[])) assert.notEqual(id,evidenceObs[0].observationId);
 }
});
