import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {RepoStore,Orchestrator,MockWorkerAdapter} from '../src/core.ts';

function fixture(){
 const s=new RepoStore(fs.mkdtempSync(path.join(os.tmpdir(),'recovery-')));
 s.write({maxAttemptsPerInput:3},'batches','b','work-recovery-policy.json');
 let now=new Date('2026-10-11T00:00:00Z');
 const o=new Orchestrator(s,()=>now);
 o.saveStage({batchId:'b',machineId:'M',name:'RESEARCH',state:'READY',revision:0,dependencies:[],authoritativeInputFingerprint:'fp',contractVersion:'c'});
 const start=()=>{const x=o.stage('b','M','RESEARCH'),a=o.createAttempt(x),l=o.acquire(x,a,100);let st=o.transition(o.stage('b','M','RESEARCH'),'LEASED','DISPATCH',a.workId);st=o.transition(st,'RUNNING','START',a.workId);return {q:o.request(st,a,l),a,l};};
 return {s,o,start,advance:()=>{now=new Date(now.getTime()+101);}};
}
test('retryable failures stop after three attempts and survive process restart',()=>{
 const {s,o,start}=fixture();
 for(let i=0;i<3;i++){
  const {q}=start();const result=o.accept(new MockWorkerAdapter().execute(q,'FAILED_RETRYABLE'));
  assert.equal(result.kind,i===2?'FAILED':'RETRY_WAIT');
  o.reconcile('b','M','RESEARCH');
 }
 const resumed=new Orchestrator(s);
 assert.equal(resumed.stage('b','M','RESEARCH').state,'FAILED');
 assert.throws(()=>resumed.createAttempt(resumed.stage('b','M','RESEARCH')),/RETRY_BUDGET_EXHAUSTED/);
 assert.equal(fs.readdirSync(s.p('batches','b','machines','M','attempts')).length,3);
 assert.equal(resumed.stage('b','M','RESEARCH').authoritativeOutputRef,undefined);
});
test('expired active work has the same finite budget; unrelated stage/input is isolated',()=>{
 const {s,o,start,advance}=fixture();
 for(let i=0;i<3;i++){start();advance();o.reconcile('b','M','RESEARCH');}
 assert.equal(o.stage('b','M','RESEARCH').state,'FAILED');
 assert.equal(o.retryExhausted({...o.stage('b','M','RESEARCH'),name:'EVALUATION'}),false);
 assert.equal(o.retryExhausted({...o.stage('b','M','RESEARCH'),authoritativeInputFingerprint:'new'}),false);
 assert.equal(fs.readdirSync(s.p('batches','b','leases')).length,3);
});
