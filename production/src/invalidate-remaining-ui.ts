import {RepoStore,Orchestrator} from './core.ts';
import {reconcileBatch} from './runtime.ts';
const batchId=process.argv[2];if(!batchId)throw new Error('USAGE: invalidate-remaining-ui <batch-id>');
const targets=['L_WORLD_DAI_STAR_PA3','L_ULTRAMAN_FINAL_BATTLE_ME','L_KARAKURI_CIRCUS2_JG','L_SENGOKU_COLLECTION6_KS','L_NANGOKU_SPECIAL_M1'];
const stages=['APP_RUNTIME','RUNTIME_PROJECTION','RUNTIME_POLICY','MACHINE_DATA','CANONICAL_UI'];
const s=new RepoStore(process.cwd()),o=new Orchestrator(s);reconcileBatch(o,s,batchId);
for(const machineId of targets)for(const name of stages){const x=o.stage(batchId,machineId,name);if(x.state==='COMPLETE')o.transition(x,'READY','AUTHORITATIVE_OUTPUT_INVALIDATED','canonical-ui-contract-v8.5-20260930');}
console.log(JSON.stringify({batchId,targets,invalidatedFrom:'CANONICAL_UI'},null,2));
