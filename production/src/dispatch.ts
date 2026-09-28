import fs from 'node:fs';
import {RepoStore,Orchestrator} from './core.ts';
import {scheduleByKind,productionRequest} from './runtime.ts';
import type {Concurrency} from './core.ts';

const batchId=process.argv[2];
const kind=(process.argv[3]??'SEMANTIC') as 'SEMANTIC'|'PRODUCTION'|'INTEGRATION';
if(!batchId) throw new Error('USAGE: dispatch <batch-id> [SEMANTIC|PRODUCTION|INTEGRATION]');
if(!['SEMANTIC','PRODUCTION','INTEGRATION'].includes(kind)) throw new Error('INVALID_WORKER_KIND');
const s=new RepoStore(process.cwd());
const config=JSON.parse(fs.readFileSync(s.p('config','orchestrator.json'),'utf8')) as {concurrency:Concurrency;manifestVersion:string};
const o=new Orchestrator(s);
const selected=scheduleByKind(o,s,batchId,config.concurrency,kind);
const supported=new Set(['RESEARCH','EVALUATION','ELIGIBILITY']);
const unsupported=selected.find(candidate=>!supported.has(candidate.name));
if(unsupported) throw new Error(`DETERMINISTIC_VALIDATOR_REQUIRED:${unsupported.name}:${unsupported.machineId}`);
const requests=selected.map(candidate=>{
  let x=o.stage(batchId,candidate.machineId,candidate.name);
  const a=o.createAttempt(x);
  const l=o.acquire(x,a);
  x=o.transition(o.stage(batchId,candidate.machineId,candidate.name),'LEASED','DISPATCH',a.workId);
  x=o.transition(x,'RUNNING','WORKER_START',a.workId);
  const q=productionRequest(o,x,a,l,config.manifestVersion);
  s.write(q,'batches',batchId,'work-requests',q.workId+'.json');
  return q;
});
console.log(JSON.stringify({batchId,workerKind:kind,dispatched:requests.map(q=>({workId:q.workId,machineId:q.machineId,stage:q.stage,attemptId:q.attemptId,leaseId:q.leaseId}))},null,2));
