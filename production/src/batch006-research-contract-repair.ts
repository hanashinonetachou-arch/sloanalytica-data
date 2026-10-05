import fs from 'node:fs';
import {RepoStore,Orchestrator} from './core.ts';
import {acceptAndRecord,reconcileBatch} from './runtime.ts';
const b='batch-20261005-006',s=new RepoStore(process.cwd()),o=new Orchestrator(s);
const targets=['L_DARLING_IN_THE_FRANXX_SA','L_SAKI_CHOJO_KESSEN_YR','S_KONOSUBA_ZR'];
for(const m of targets){
 const p=s.p('batches',b,'research-drafts','wave-2',m+'.json'),d=JSON.parse(fs.readFileSync(p,'utf8'));
 for(const f of d.findings)if(f.categoryCoverage==='SOURCE_EXHAUSTIVE'){
  f.categoryModel={residualPolicy:'SOURCE_EXHAUSTIVE'};delete f.categoryCoverage;
 }
 fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n');
 for(const n of ['RESEARCH','EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT','OBSERVATION_EVIDENCE','CANONICAL_UI','MACHINE_DATA','RUNTIME_POLICY','RUNTIME_PROJECTION','APP_RUNTIME']){
  let x=o.reconcile(b,m,n);
  if(x.state==='RUNNING'){
   const l=s.read<any>('batches',b,'leases',x.activeLeaseId+'.json');
   acceptAndRecord(o,s,{workId:l.workId,attemptId:l.attemptId,leaseId:l.leaseId,leaseGeneration:l.leaseGeneration,status:'FAILED_RETRYABLE',observedInputFingerprint:x.authoritativeInputFingerprint,producedArtifacts:[],validationEvidence:[],requestedActions:[],provenance:{reason:'Published exhaustive category rounding policy was missing from the Research contract; repair the draft and rematerialize upstream.'}},'batch006-research-contract-repair','deterministic');
   x=o.reconcile(b,m,n);
  }
  if(x.state==='COMPLETE')o.transition(x,'READY','AUTHORITATIVE_OUTPUT_INVALIDATED','batch006-source-exhaustive-category-contract');
 }
}
console.log(JSON.stringify(reconcileBatch(o,s,b),null,2));
