import {RepoStore,Orchestrator} from './core.ts';

const batchId=process.argv[2];
const machineId=process.argv[3];
if(!batchId||!machineId)throw new Error('USAGE: invalidate-machine-downstream <batch-id> <machine-id>');

const s=new RepoStore(process.cwd());
const o=new Orchestrator(s);
const stages=['EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT','OBSERVATION_EVIDENCE','CANONICAL_UI','MACHINE_DATA','RUNTIME_POLICY','RUNTIME_PROJECTION','APP_RUNTIME','DISTRIBUTION'] as const;
const changed:any[]=[];
for(const stage of stages){
  let x=o.stage(batchId,machineId,stage);
  if(x.state==='COMPLETE'){
    x=o.transition(x,'READY','AUTHORITATIVE_OUTPUT_INVALIDATED','semantic-contract-repair');
    changed.push({stage,revision:x.revision,state:x.state});
    continue;
  }
  if(x.state==='READY'){changed.push({stage,revision:x.revision,state:x.state});continue}
  throw new Error('DOWNSTREAM_INVALIDATION_STATE:'+stage+':'+x.state);
}
console.log(JSON.stringify({batchId,machineId,changed},null,2));
