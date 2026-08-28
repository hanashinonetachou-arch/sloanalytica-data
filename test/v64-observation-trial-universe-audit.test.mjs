import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { auditV64ObservationTrialUniverse } from '../tools/audit-v64-observation-trial-universe.mjs';

function writeJson(p,value){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(value,null,2));}
function fixture({schema='v2',mappingType='EXACT',usableForInference=true,observationStatus='FOUND',missingMapping=false,missingObservation=false,sourceUnresolved=false,highPriorityPending=false}={}){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'slo-v64-observation-'));
  const machineId='TEST_MACHINE';
  writeJson(path.join(root,'research',machineId,'selection-data.json'),{
    machineId,displayName:'Test',features:[{featureId:'FEAT_A',researchFeatureId:'RF_A',adoptionCategory:'INCLUDE_PRIMARY'}]
  });
  if(schema==='v1'){
    writeJson(path.join(root,'research',machineId,'machine-observation-data.json'),{
      schemaVersion:'machine-observation-data-v1',machineId,displayName:'Test',
      machineMenu:{status:'CHECKED',availableData:[],sourceRefs:[],notes:''},
      linkedService:{status:'UNRESOLVED',availableData:[],sourceRefs:[],notes:''},
      predecessorData:{status:'CHECKED',availableData:[],sourceRefs:[],notes:''},sources:[]
    });
    return root;
  }
  const observations=missingObservation?[]:[{observationId:'OBS_A',sourceType:'DIRECT_PLAY',observationMode:'MANUAL_COUNTER',status:observationStatus,label:'A',categories:[],timing:[],excludedConditions:[],sourceRefs:[]}];
  const featureMappings=missingMapping?[]:[{featureId:'FEAT_A',mappingType,observationIds:['OBS_A'],collectionMethods:['MANUAL_COUNTER'],usableForInference,usableForDifficulty:true}];
  writeJson(path.join(root,'research',machineId,'machine-observation-data.json'),{
    schemaVersion:'machine-observation-data-v2',machineId,displayName:'Test',researchedAt:'2026-08-29',sources:[],
    sourceCoverage:{machineMenu:sourceUnresolved?'UNRESOLVED':'CHECKED_NONE',dataCounter:'CHECKED_NONE',linkedService:'CHECKED_NONE',directPlay:'FOUND',endEvent:'CHECKED_NONE',seatedState:'CHECKED_NONE'},
    observations,featureMappings,researchReopenRequests:[],
    fieldVerificationItems:highPriorityPending?[{verificationId:'V1',status:'WAITING_FOR_MACHINE',sourceType:'MACHINE_MENU',priority:'HIGH',question:'確認'}]:[]
  });
  return root;
}

test('clean v2 active Feature mapping passes',()=>{
  const r=auditV64ObservationTrialUniverse(fixture());
  assert.equal(r.summary.PASS,1);
  assert.equal(r.summary.REVIEW,0);
  assert.equal(r.summary.HIGH_RISK,0);
});

test('legacy v1 is REVIEW, not HIGH_RISK',()=>{
  const r=auditV64ObservationTrialUniverse(fixture({schema:'v1'}));
  assert.equal(r.summary.REVIEW,1);
  assert.ok(r.machines[0].issues.some(x=>x.type==='OBSERVATION_V1_COMPATIBILITY'));
  assert.ok(r.machines[0].issues.some(x=>x.type==='LEGACY_SOURCE_SCOPE_UNRESOLVED'));
});

test('missing active Feature mapping is REVIEW',()=>{
  const r=auditV64ObservationTrialUniverse(fixture({missingMapping:true}));
  assert.equal(r.summary.REVIEW,1);
  assert.ok(r.machines[0].issues.some(x=>x.type==='ACTIVE_FEATURE_MAPPING_MISSING'));
});

test('explicit incompatible active Feature is HIGH_RISK',()=>{
  const r=auditV64ObservationTrialUniverse(fixture({mappingType:'INCOMPATIBLE',usableForInference:false}));
  assert.equal(r.summary.HIGH_RISK,1);
  assert.ok(r.machines[0].issues.some(x=>x.type==='ACTIVE_FEATURE_OBSERVATION_INCOMPATIBLE'));
});

test('missing referenced Observation is HIGH_RISK',()=>{
  const r=auditV64ObservationTrialUniverse(fixture({missingObservation:true}));
  assert.equal(r.summary.HIGH_RISK,1);
  assert.ok(r.machines[0].issues.some(x=>x.type==='ACTIVE_FEATURE_OBSERVATION_MISSING'));
});

test('unresolved active source and high-priority field check are REVIEW',()=>{
  const r=auditV64ObservationTrialUniverse(fixture({observationStatus:'UNRESOLVED',sourceUnresolved:true,highPriorityPending:true}));
  assert.equal(r.summary.REVIEW,1);
  assert.ok(r.machines[0].issues.some(x=>x.type==='ACTIVE_FEATURE_SOURCE_UNRESOLVED'));
  assert.ok(r.machines[0].issues.some(x=>x.type==='SOURCE_COVERAGE_UNRESOLVED'));
  assert.ok(r.machines[0].issues.some(x=>x.type==='HIGH_PRIORITY_FIELD_VERIFICATION_PENDING'));
});
