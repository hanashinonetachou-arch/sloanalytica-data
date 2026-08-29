import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { auditV64ObservationTrialUniverse } from '../tools/audit-v64-observation-trial-universe.mjs';

const machineId='S_HAPPY_JUGGLER_V3_EA';

test('Happy Juggler V3 Observation v2 maps predecessor and self-play Features',()=>{
  const o=JSON.parse(fs.readFileSync(`research/${machineId}/machine-observation-data.json`,'utf8'));
  const s=JSON.parse(fs.readFileSync(`research/${machineId}/selection-data.json`,'utf8'));
  assert.equal(o.schemaVersion,'machine-observation-data-v2');
  assert.equal(o.sourceCoverage.dataCounter,'VERIFIED_ON_MACHINE');
  assert.equal(o.sourceCoverage.seatedState,'VERIFIED_ON_MACHINE');
  assert.equal(o.sourceCoverage.linkedService,'CHECKED_NONE');
  const active=s.features.filter(f=>['INCLUDE_PRIMARY','INCLUDE_SUPPORT','INCLUDE_FALLBACK'].includes(f.adoptionCategory)).map(f=>f.featureId).sort();
  const mapped=o.featureMappings.filter(m=>m.usableForInference).map(m=>m.featureId).sort();
  assert.deepEqual(mapped,active);
  assert.deepEqual(o.featureMappings.find(m=>m.featureId==='FEAT_PREDECESSOR_BONUS_OUTCOME').observationIds,['OBS_PREDECESSOR_DATA_COUNTER']);
  assert.deepEqual(o.featureMappings.find(m=>m.featureId==='FEAT_SELF_BONUS_OUTCOME').observationIds,['OBS_SELF_PLAY_COUNTERS']);
});

test('Happy Juggler V3 clears Observation REVIEW and keeps only genuinely unresolved auxiliary surfaces as debt',()=>{
  const r=auditV64ObservationTrialUniverse('.');
  const m=r.machines.find(x=>x.machineId===machineId);
  assert.ok(m);
  assert.equal(m.status,'PASS');
  assert.equal(m.issues.some(x=>x.severity==='REVIEW'||x.severity==='HIGH_RISK'),false);
  assert.ok(m.issues.some(x=>x.type==='SOURCE_COVERAGE_UNRESOLVED'&&x.sourceSurface==='machineMenu'));
  assert.equal(m.issues.some(x=>x.type==='SOURCE_COVERAGE_UNRESOLVED'&&x.sourceSurface==='linkedService'),false);
});
