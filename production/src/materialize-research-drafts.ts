import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {RepoStore,Orchestrator} from './core.ts';
import {acceptAndRecord,promoteDependencies,reconcileBatch,scheduleByKind,productionRequest} from './runtime.ts';
import type {WorkRequest,WorkResult,Concurrency} from './core.ts';

const batchId=process.argv[2];
const waveId=process.argv[3];
if(!batchId||!waveId)throw new Error('USAGE: materialize-research-drafts <batch-id> <wave-id>');

const s=new RepoStore(process.cwd());
const o=new Orchestrator(s);
const cfg=JSON.parse(fs.readFileSync(s.p('config','orchestrator.json'),'utf8')) as {concurrency:Concurrency;manifestVersion:string};
const spec=s.read<any>('batches',batchId,'batch.json');
const wave=spec.waves.find((w:any)=>w.waveId===waveId);
if(!wave)throw new Error('UNKNOWN_WAVE:'+waveId);
const targets=new Set<string>(wave.machineIds);
const sha=(b:Buffer)=>crypto.createHash('sha256').update(b).digest('hex');

function materialize(candidate:any){
  let x=o.stage(batchId,candidate.machineId,'RESEARCH');
  if(x.state==='COMPLETE')return {machineId:candidate.machineId,kind:'ALREADY_COMPLETE'};
  if(x.state!=='READY')throw new Error('RESEARCH_NOT_READY:'+candidate.machineId+':'+x.state);
  const a=o.createAttempt(x);
  const l=o.acquire(x,a,300000);
  x=o.transition(o.stage(batchId,candidate.machineId,'RESEARCH'),'LEASED','DISPATCH',a.workId);
  x=o.transition(x,'RUNNING','WORKER_START',a.workId);
  const q=productionRequest(o,x,a,l,cfg.manifestVersion);
  s.write(q,'batches',batchId,'work-requests',q.workId+'.json');

  const draftPath=s.p('batches',batchId,'research-drafts',waveId,candidate.machineId+'.json');
  if(!fs.existsSync(draftPath))throw new Error('RESEARCH_DRAFT_MISSING:'+candidate.machineId);
  const draft=JSON.parse(fs.readFileSync(draftPath,'utf8'));
  const doc={...draft,workId:q.workId};
  const rel='batches/'+batchId+'/artifacts/'+candidate.machineId+'/research/result.json';
  const full=s.p(rel);
  fs.mkdirSync(path.dirname(full),{recursive:true});
  const bytes=Buffer.from(JSON.stringify(doc,null,2)+'\n','utf8');
  fs.writeFileSync(full,bytes);
  const artifact={artifactId:'research-'+candidate.machineId,kind:'research',path:'production/'+rel,sha256:sha(bytes),producerWorkId:q.workId};
  const r:WorkResult={
    workId:q.workId,attemptId:q.attemptId,leaseId:q.leaseId,leaseGeneration:q.leaseGeneration,
    status:'SUCCESS',observedInputFingerprint:q.authoritativeInputFingerprint,
    producedArtifacts:[artifact],validationEvidence:[],requestedActions:[],proposedNextState:'COMPLETE',
    provenance:{inputArtifacts:q.inputArtifacts,adapter:'repository-research-draft-v1'}
  };
  const accepted=acceptAndRecord(o,s,r,'semantic-worker/repository-research-draft-v1','research-v1');
  if(accepted.kind!=='COMMITTED')throw new Error('RESEARCH_NOT_COMMITTED:'+candidate.machineId+':'+accepted.kind);
  promoteDependencies(o,batchId,candidate.machineId);
  return {machineId:candidate.machineId,kind:accepted.kind,workId:q.workId,sha256:artifact.sha256};
}

const completed:any[]=[];
for(let guard=0;guard<20;guard++){
  reconcileBatch(o,s,batchId);
  const remaining=[...targets].filter(machineId=>o.stage(batchId,machineId,'RESEARCH').state!=='COMPLETE');
  if(remaining.length===0)break;
  const selected=scheduleByKind(o,s,batchId,cfg.concurrency,'SEMANTIC')
    .filter((x:any)=>x.name==='RESEARCH'&&targets.has(x.machineId));
  if(selected.length===0)throw new Error('RESEARCH_WAVE_STALLED:'+remaining.join(','));
  for(const candidate of selected)completed.push(materialize(candidate));
}
const incomplete=[...targets].filter(machineId=>o.stage(batchId,machineId,'RESEARCH').state!=='COMPLETE');
if(incomplete.length)throw new Error('RESEARCH_WAVE_INCOMPLETE:'+incomplete.join(','));
console.log(JSON.stringify({batchId,waveId,completed,dashboard:reconcileBatch(o,s,batchId)},null,2));
