import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { auditV64ObservationTrialUniverse } from '../tools/audit-v64-observation-trial-universe.mjs';

const machineId='LB_ISEKAI_QUARTET_KR';
const observationPath=`research/${machineId}/machine-observation-data.json`;
const selectionPath=`research/${machineId}/selection-data.json`;

test('Isekai Quartet BT Observation v2 maps every active inference Feature',()=>{
  const o=JSON.parse(fs.readFileSync(observationPath,'utf8'));
  const s=JSON.parse(fs.readFileSync(selectionPath,'utf8'));
  assert.equal(o.schemaVersion,'machine-observation-data-v2');
  assert.equal(o.sourceCoverage.dataCounter,'VERIFIED_ON_MACHINE');
  assert.equal(o.sourceCoverage.seatedState,'VERIFIED_ON_MACHINE');
  assert.equal(o.sourceCoverage.linkedService,'FOUND');
  assert.equal(o.sourceCoverage.machineMenu,'UNRESOLVED');
  const active=s.features.filter(f=>['INCLUDE_PRIMARY','INCLUDE_SUPPORT','INCLUDE_FALLBACK'].includes(f.adoptionCategory)).map(f=>f.featureId).sort();
  const mapped=o.featureMappings.filter(m=>m.usableForInference).map(m=>m.featureId).sort();
  assert.deepEqual(mapped,active);
  const pred=o.featureMappings.find(m=>m.featureId==='FEAT_PREDECESSOR_BONUS_INITIAL');
  assert.equal(pred.mappingType,'EXACT');
  assert.deepEqual(pred.observationIds,['OBS_PREDECESSOR_DATA_COUNTER']);
  const big=o.featureMappings.find(m=>m.featureId==='FEAT_BIG_MISS_15');
  assert.equal(big.mappingType,'COMBINABLE');
  assert.deepEqual(new Set(big.observationIds),new Set(['OBS_MYSLOT_BIG_TYPES','OBS_BIG_MISS15_DIRECT']));
});

test('Isekai Quartet BT clears Observation REVIEW while preserving unrelated source debt',()=>{
  const r=auditV64ObservationTrialUniverse('.');
  const m=r.machines.find(x=>x.machineId===machineId);
  assert.ok(m);
  assert.equal(m.status,'PASS');
  assert.ok(m.issues.some(x=>x.type==='SOURCE_COVERAGE_UNRESOLVED'&&x.sourceSurface==='machineMenu'));
  assert.equal(m.issues.some(x=>x.severity==='REVIEW'||x.severity==='HIGH_RISK'),false);
});
