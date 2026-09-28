import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {RepoStore,Orchestrator} from '../src/core.ts';
import {initializeBatch} from '../src/runtime.ts';
import {migrationPreflight} from '../src/migration-preflight.ts';

function ready(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'migration-'));const s=new RepoStore(root);
 initializeBatch(s,{batchId:'b',manifestVersion:'8.5',waves:[{waveId:'w1',machineIds:['M1','M2','M3','M4','M5']},{waveId:'w2',machineIds:['M6','M7','M8','M9','M10']}]});
 const o=new Orchestrator(s);
 for(let i=1;i<=10;i++){const m='M'+i;let r=o.stage('b',m,'RESEARCH');r=o.transition(r,'LEASED','MIGRATION','x');r=o.transition(r,'RUNNING','MIGRATION','x');r=o.transition(r,'VALIDATING','MIGRATION','x');r=o.transition(r,'COMPLETE','MIGRATION','x');r.activeAttemptId=undefined;r.activeLeaseId=undefined;o.saveStage(r);let e=o.stage('b',m,'EVALUATION');e=o.transition(e,'READY','DEPENDENCY_COMPLETE','RESEARCH');const f=s.p('batches','b','artifacts',m,'research','result.json');fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,'{}\n')}
 return {root,s,o};
}
test('accepts exactly completed research batch ready for evaluation',()=>{const {root}=ready();assert.equal(migrationPreflight(root,'b').machineCount,10)});
test('rejects incomplete research',()=>{const {root,s,o}=ready();const r=o.stage('b','M1','RESEARCH');s.write({...r,state:'FAILED'},'batches','b','machines','M1','stages','RESEARCH.json');assert.throws(()=>migrationPreflight(root,'b'),/MIGRATION_RESEARCH_NOT_COMPLETE/)});
test('rejects evaluation already dispatched',()=>{const {root,s,o}=ready();const e=o.stage('b','M1','EVALUATION');s.write({...e,state:'LEASED'},'batches','b','machines','M1','stages','EVALUATION.json');assert.throws(()=>migrationPreflight(root,'b'),/MIGRATION_EVALUATION_NOT_READY/)});
test('rejects missing research artifact',()=>{const {root,s}=ready();fs.unlinkSync(s.p('batches','b','artifacts','M1','research','result.json'));assert.throws(()=>migrationPreflight(root,'b'),/MIGRATION_RESEARCH_ARTIFACT_MISSING/)});
