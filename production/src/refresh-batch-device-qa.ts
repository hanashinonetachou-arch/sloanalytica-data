import fs from 'node:fs';
import {RepoStore,Orchestrator} from './core.ts';
// Reissue human QA for a newer APK after user feedback, without accepting it.
const batchId=process.argv[2],revision=process.argv[3];
if(!batchId||!revision||!/^[a-z0-9-]+$/.test(revision))throw Error('BATCH_AND_REVISION_REQUIRED');
const s=new RepoStore(process.cwd()),o=new Orchestrator(s);
const handoff=s.read<any>('batches',batchId,'device-qa','handoff.json');
const previous=s.read<any>('batches',batchId,'revisions',revision,'handoff-r1.json');
if(handoff.status!=='AWAITING_USER_DEVICE_QA'||handoff.deviceQaAccepted!==false||!handoff.apk.libraryFileId||handoff.apk.versionCode<=previous.apk.versionCode)throw Error('NEW_UNACCEPTED_APK_REQUIRED');
for(const machineId of s.read<any>('batches',batchId,'batch.json').waves.flatMap((w:any)=>w.machineIds)){
 let x=o.stage(batchId,machineId,'DEVICE_QA');
 if(x.state!=='HUMAN_REQUIRED')throw Error('EXPECTED_PENDING_QA:'+machineId+':'+x.state);
 const requests=fs.readdirSync(s.p('batches',batchId,'action-requests'));
 for(const file of requests){const r=s.read<any>('batches',batchId,'action-requests',file);if(r.machineId!==machineId||r.type!=='DEVICE_QA'||r.status!=='OPEN')continue;r.status='SUPERSEDED';r.resolution='REPLACED_BY_REVISED_APK';r.supersededAt=new Date().toISOString();r.replacementVersionCode=handoff.apk.versionCode;s.write(r,'batches',batchId,'action-requests',file);}
 x=o.transition(x,'READY','QA_FEEDBACK_REVISION',revision);
 x.humanResolved=false;delete x.authoritativeOutputRef;o.saveStage(x);
}
console.log(JSON.stringify({batchId,revision,deviceQaAccepted:false,status:'READY_TO_REISSUE'}));
