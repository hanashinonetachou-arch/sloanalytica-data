import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { validateObservationObject } from '../tools/validate-machine-observation-data.mjs';

const root=path.resolve('.');
const PILOTS=['S_MY_JUGGLER_V_KD','LB_SLOT_GALFY_A4','L_INITIAL_D_2ND'];
const read=(id,name)=>JSON.parse(fs.readFileSync(path.join(root,'research',id,name),'utf8'));

test('Observation Engine pilots use v2 and map every adopted Selection feature',()=>{
  for(const id of PILOTS){
    const observation=read(id,'machine-observation-data.json');
    const selection=read(id,'selection-data.json');
    assert.equal(observation.schemaVersion,'machine-observation-data-v2',`${id} must use Observation v2`);
    assert.equal(validateObservationObject(observation,id).ok,true,`${id} Observation must validate`);
    const mapped=new Set((observation.featureMappings??[]).map(m=>m.featureId));
    const adopted=(selection.features??[]).filter(f=>String(f.adoptionCategory??'').startsWith('INCLUDE'));
    for(const feature of adopted) assert.ok(mapped.has(feature.featureId),`${id}/${feature.featureId} must have Observation mapping`);
  }
});

test('UI Design pilots explicitly consume Selection and Observation layers',()=>{
  for(const id of PILOTS){
    const ui=read(id,'ui-design-data.json');
    assert.equal(ui.generatedFrom?.selection,`research/${id}/selection-data.json`);
    assert.equal(ui.generatedFrom?.observation,`research/${id}/machine-observation-data.json`);
  }
});

test('UNRESOLVED is retained as field verification instead of blocking pilots',()=>{
  for(const id of PILOTS){
    const observation=read(id,'machine-observation-data.json');
    const unresolved=Object.values(observation.sourceCoverage??{}).includes('UNRESOLVED');
    if(unresolved) assert.ok((observation.fieldVerificationItems??[]).some(v=>v.status==='WAITING_FOR_MACHINE'),`${id} unresolved coverage must have a field verification item`);
    assert.equal((observation.researchReopenRequests??[]).some(r=>r.status==='RESEARCH_REOPEN_REQUIRED'),false);
  }
});
