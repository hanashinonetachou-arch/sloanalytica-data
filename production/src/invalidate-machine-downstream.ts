import {RepoStore,Orchestrator} from './core.ts';

const batchId=process.argv[2];
const machineId=process.argv[3];
const includeResearch=process.argv.includes('--include-research');
if(!batchId||!machineId)throw new Error('USAGE: invalidate-machine-downstream <batch-id> <machine-id> [--include-research]');

const s=new RepoStore(process.cwd());
const o=new Orchestrator(s);
const downstreamStages=['EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT','OBSERVATION_EVIDENCE','CANONICAL_UI','MACHINE_DATA','RUNTIME_POLICY','RUNTIME_PROJECTION','APP_RUNTIME','DISTRIBUTION'] as const;
const stages=(includeResearch?['RESEARCH',...downstreamStages]:downstreamStages) as readonly string[];
const changed:any[]=[];
for(const stage of stages){
  let x=o.stage(batchId,machineId,stage);
  if(x.state==='COMPLETE'){
    x=o.transition(x,'READY','AUTHORITATIVE_OUTPUT_INVALIDATED','semantic-contract-repair');
    changed.push({stage,revision:x.revision,state:x.state});
    continue;
  }
  if(x.state==='READY'||x.state==='PENDING'){changed.push({stage,revision:x.revision,state:x.state});continue}
  throw new Error('DOWNSTREAM_INVALIDATION_STATE:'+stage+':'+x.state);
}
console.log(JSON.stringify({batchId,machineId,includeResearch,changed},null,2));
