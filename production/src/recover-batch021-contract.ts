import {RepoStore,Orchestrator} from './core.ts';
import {acceptAndRecord} from './runtime.ts';
const s=new RepoStore(process.cwd()),o=new Orchestrator(s),b='batch-20261017-021',m='L_GIRLS_UND_PANZER_FINALE_H1',n='CANDIDATE_CONTRACT';
const x=o.stage(b,m,n);if(x.state==='RUNNING'){
 const a=s.read<any>('batches',b,'machines',m,'attempts',x.activeAttemptId+'.json'),l=s.read<any>('batches',b,'leases',x.activeLeaseId+'.json');
 const r:any={workId:a.workId,attemptId:a.attemptId,leaseId:l.leaseId,leaseGeneration:l.leaseGeneration,status:'FAILED_RETRYABLE',observedInputFingerprint:x.authoritativeInputFingerprint,producedArtifacts:[],validationEvidence:[{ok:false,reason:'MIXED_CATEGORICAL_SCALAR_AGGREGATE_PARSE',fix:'Guard categorical models in scalar aggregate detection; score selection unchanged'}],requestedActions:[],provenance:{inputArtifacts:[]}};
 acceptAndRecord(o,s,r,'bounded-contract-recovery','existing-production-validators');
}
o.reconcile(b,m,n);
