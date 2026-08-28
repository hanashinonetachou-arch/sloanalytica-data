import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { auditV64ObservationTrialUniverse } from '../tools/audit-v64-observation-trial-universe.mjs';

const machineId='LB_FUJIKO_M2';

test('Fujiko M2 Observation v2 maps all active inference Features',()=>{
  const o=JSON.parse(fs.readFileSync(`research/${machineId}/machine-observation-data.json`,'utf8'));
  const s=JSON.parse(fs.readFileSync(`research/${machineId}/selection-data.json`,'utf8'));
  assert.equal(o.schemaVersion,'machine-observation-data-v2');
  assert.equal(o.sourceCoverage.machineMenu,'VERIFIED_ON_MACHINE');
  assert.equal(o.sourceCoverage.seatedState,'VERIFIED_ON_MACHINE');
  assert.equal(o.sourceCoverage.linkedService,'FOUND');
  const active=s.features.filter(f=>['INCLUDE_PRIMARY','INCLUDE_SUPPORT','INCLUDE_FALLBACK'].includes(f.adoptionCategory)).map(f=>f.featureId).sort();
  const mapped=o.featureMappings.filter(m=>m.usableForInference).map(m=>m.featureId).sort();
  assert.deepEqual(mapped,active);
  assert.deepEqual(o.featureMappings.find(m=>m.featureId==='FEAT_PREDECESSOR_BONUS').observationIds,['OBS_MACHINE_MENU_PREDECESSOR']);
  assert.deepEqual(o.featureMappings.find(m=>m.featureId==='FEAT_BIG_VOICE_1G').observationIds,['OBS_BIG_VOICE_1G_DIRECT']);
});

test('Fujiko M2 clears Observation REVIEW without active-linkage risk',()=>{
  const r=auditV64ObservationTrialUniverse('.');
  const m=r.machines.find(x=>x.machineId===machineId);
  assert.ok(m);
  assert.equal(m.status,'PASS');
  assert.equal(m.issues.some(x=>x.severity==='REVIEW'||x.severity==='HIGH_RISK'),false);
});
