import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {RepoStore,Orchestrator} from '../src/core.ts';
import {initializeBatch,productionRequest} from '../src/runtime.ts';
import {completeResearch} from '../src/complete-research.ts';

test('complete-research computes SHA, commits through orchestrator, promotes dependency, and fills freed research slots',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'complete-research-'));
 const s=new RepoStore(root);
 fs.mkdirSync(s.p('config'),{recursive:true});
 fs.writeFileSync(s.p('config','orchestrator.json'),JSON.stringify({manifestVersion:'8.5',concurrency:{semanticSlots:2,productionSlots:2,validationSlots:2,integrationSlots:1}}));
 initializeBatch(s,{batchId:'b',manifestVersion:'8.5',waves:[{waveId:'w1',machineIds:['M1','M2','M3','M4','M5']},{waveId:'w2',machineIds:['M6','M7','M8','M9','M10']}]});
 const o=new Orchestrator(s);
 for(const m of ['M1','M2']){
  let x=o.stage('b',m,'RESEARCH');const a=o.createAttempt(x),l=o.acquire(x,a);x=o.transition(o.stage('b',m,'RESEARCH'),'LEASED','DISPATCH',a.workId);x=o.transition(x,'RUNNING','WORKER_START',a.workId);const q=productionRequest(o,x,a,l);s.write(q,'batches','b','work-requests',q.workId+'.json');
  const d={schemaVersion:'research-v1',manifestVersion:'8.5',batchId:'b',machineId:m,machineName:m,workId:q.workId,sources:[{sourceId:'s1',url:'https://example.com/official',title:'Official',sourceType:'official',claims:['identity'],sourceMachineIdentity:{machineName:m,typeCode:'T1',manufacturer:'Maker',introduced:'2026-01',generation:'6.5号機',gameType:'AT',matchStatus:'MATCH'}},{sourceId:'s2',url:'https://example.org/regulatory',title:'Regulatory',sourceType:'regulatory',claims:['identity'],sourceMachineIdentity:{machineName:m,typeCode:'T1',manufacturer:'Maker',matchStatus:'MATCH'}}],machineIdentity:{formalName:m,typeCode:'T1',manufacturer:'Maker',introduced:'2026-01',generation:'6.5号機',gameType:'AT'},findings:[{findingId:'f1',label:'rate',observationType:'probability',sourceIds:['s1'],settingDistribution:{'1':0.1,'6':0.2}}],blockedItems:[{blockId:'b1',label:'unknown',reason:'not published',reevaluationCondition:'publish values'}]};
  const f=s.p('batches','b','artifacts',m,'research','result.json');fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,JSON.stringify(d,null,2));
 }
 const r=completeResearch(root,'b',['M1','M2']);
 assert.deepEqual(r.completed.map(x=>x.kind),['COMMITTED','COMMITTED']);
 assert.equal(o.stage('b','M1','RESEARCH').state,'COMPLETE');
 assert.equal(o.stage('b','M1','EVALUATION').state,'READY');
 assert.deepEqual(r.dispatched.map(x=>x.machineId),['M3','M4']);
 assert.equal(o.stage('b','M3','RESEARCH').state,'RUNNING');
 assert.ok(fs.readFileSync(s.p('batches','b','provenance','chain.jsonl'),'utf8').trim().split('\n').length===2);
});
