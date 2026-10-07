import test from 'node:test';
import assert from 'node:assert/strict';
import {selectProductionBatch} from '../src/production-order-selector.ts';
const machines=['old','bt','cursor','next','last'].map(machineId=>({machineId}));
const migrated=(machineId:string)=>({machineId,status:'AVAILABLE',machineDataVersion:'8.5.0',manifestVersion:'8.5',productionArtifact:true});
test('recovers skipped available machines before advancing, including BT',()=>{
 const records=[{...migrated('old'),machineDataVersion:'8.4.0'},{...migrated('bt'),manifestVersion:'8.0'},migrated('cursor')];
 assert.deepEqual(selectProductionBatch(machines,'cursor',records,4).selected,['old','bt','next','last']);
});
test('withdrawn entries are skipped and missing provenance cannot pass silently',()=>{
 const records=[{machineId:'old',status:'WITHDRAWN'},migrated('bt'),migrated('cursor')];
 assert.deepEqual(selectProductionBatch(machines,'cursor',records,2).selected,['next','last']);
 records[1]={...records[1],productionArtifact:false};
 assert.throws(()=>selectProductionBatch(machines,'cursor',records),/PRODUCTION_PROVENANCE_GAP/);
});
test('missing records and unknown cursor fail closed',()=>{
 assert.throws(()=>selectProductionBatch(machines,'cursor',[]),/RECORD_MISSING/);
 assert.throws(()=>selectProductionBatch(machines,'missing',[]),/CURSOR_NOT/);
});
