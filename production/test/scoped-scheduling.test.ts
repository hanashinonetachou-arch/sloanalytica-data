import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {RepoStore,Orchestrator} from '../src/core.ts';
import {initializeBatch,scheduleByKind} from '../src/runtime.ts';
test('a stage ceiling leaves slots available for remaining evaluation work',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'stage-ceiling-'));
 try{
  const s=new RepoStore(root),o=new Orchestrator(s);
  const ids=Array.from({length:10},(_,i)=>'M'+String(i+1).padStart(2,'0'));
  initializeBatch(s,{batchId:'scope',manifestVersion:'8.5',waves:[{waveId:'w1',machineIds:ids.slice(0,5)},{waveId:'w2',machineIds:ids.slice(5)}]});
  for(const id of ids){const r=o.stage('scope',id,'RESEARCH');r.state='COMPLETE';o.saveStage(r)}
  for(const id of ids.slice(0,2)){
   for(const stage of ['EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT']){const x=o.stage('scope',id,stage);x.state='COMPLETE';o.saveStage(x)}
   const x=o.stage('scope',id,'OBSERVATION_EVIDENCE');x.state='READY';o.saveStage(x);
  }
  for(const id of ids.slice(2)){const x=o.stage('scope',id,'EVALUATION');x.state='READY';o.saveStage(x)}
  const cap={semanticSlots:2,productionSlots:2,validationSlots:2,integrationSlots:1};
  const ordinary=scheduleByKind(o,s,'scope',cap,'SEMANTIC');
  assert.deepEqual(ordinary.map(x=>x.name),['OBSERVATION_EVIDENCE','OBSERVATION_EVIDENCE']);
  const allowed=new Set(['RESEARCH','EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT']);
  const scoped=scheduleByKind(o,s,'scope',cap,'SEMANTIC',allowed);
  assert.equal(scoped.length,2);assert.ok(scoped.every(x=>x.name==='EVALUATION'));
  assert.deepEqual(scoped.map(x=>x.machineId),['M03','M04']);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
