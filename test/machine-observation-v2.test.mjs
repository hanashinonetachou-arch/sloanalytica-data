import test from 'node:test';
import assert from 'node:assert/strict';
import { validateObservationObject } from '../tools/validate-machine-observation-data.mjs';

test('machine-observation-data-v2 accepts valid contract',()=>{
  const data={
    schemaVersion:'machine-observation-data-v2',machineId:'TEST_MACHINE',displayName:'Test',provisionalRegistrationId:1,registrationId:null,releaseDate:null,researchedAt:'2026-08-24',sources:[],
    sourceCoverage:{machineMenu:'UNRESOLVED',dataCounter:'CHECKED_NONE',linkedService:'FOUND',directPlay:'FOUND',endEvent:'VERIFIED_ON_MACHINE',seatedState:'UNRESOLVED'},
    observations:[{observationId:'OBS_ROLE',sourceType:'DIRECT_PLAY',observationMode:'MANUAL_COUNTER',label:'小役',status:'FOUND',categories:['A'],timing:['NORMAL'],excludedConditions:[],sourceRefs:[]}],
    featureMappings:[{featureId:'FEAT_ROLE',observationIds:['OBS_ROLE'],mappingType:'EXACT',collectionMethods:['MANUAL_COUNTER'],usableForInference:true,usableForDifficulty:true}],
    researchReopenRequests:[],
    fieldVerificationItems:[{verificationId:'FV_001',sourceType:'MACHINE_MENU',question:'メニュー表示を確認',priority:'MEDIUM',status:'WAITING_FOR_MACHINE',uiImpact:'INPUT_SOURCE'}]
  };
  const r=validateObservationObject(data,'test');
  assert.equal(r.ok,true,r.errors.join('\n'));
});

test('v2 rejects unknown observation references',()=>{
  const data={schemaVersion:'machine-observation-data-v2',machineId:'TEST_MACHINE',displayName:'Test',researchedAt:'2026-08-24',sources:[],sourceCoverage:{machineMenu:'FOUND',dataCounter:'FOUND',linkedService:'FOUND',directPlay:'FOUND',endEvent:'FOUND',seatedState:'FOUND'},observations:[],featureMappings:[{featureId:'F',observationIds:['MISSING'],mappingType:'EXACT',collectionMethods:['MANUAL_COUNTER'],usableForInference:true}],researchReopenRequests:[],fieldVerificationItems:[]};
  const r=validateObservationObject(data,'test');
  assert.equal(r.ok,false);
  assert.match(r.errors.join('\n'),/unknown observationId/);
});

test('legacy v1 remains valid in compatibility mode',()=>{
  const data={schemaVersion:'machine-observation-data-v1',machineId:'TEST_MACHINE',displayName:'Test',sources:[],machineMenu:{status:'UNRESOLVED',availableData:[],sourceRefs:[],notes:''},linkedService:{status:'NOT_AVAILABLE',availableData:[],sourceRefs:[],notes:''},predecessorData:{status:'UNRESOLVED',availableData:[],sourceRefs:[],notes:'',usableForInference:false,usableForSelfSessionDelta:false}};
  const r=validateObservationObject(data,'test');
  assert.equal(r.ok,true,r.errors.join('\n'));
  assert.ok(r.warnings.length>0);
});
