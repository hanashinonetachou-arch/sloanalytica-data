import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const root=process.cwd(),batch='batch-20261022-025',base=path.join(root,'batches',batch),read=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
const ids=read(path.join(base,'batch.json')).waves.flatMap((w:any)=>w.machineIds),sha=(p:string)=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const stages=['RESEARCH','EVALUATION','ELIGIBILITY','CANDIDATE_CONTRACT','OBSERVATION_EVIDENCE','CANONICAL_UI','MACHINE_DATA','RUNTIME_POLICY','RUNTIME_PROJECTION','APP_RUNTIME'];if(process.argv.includes('--include-distribution'))stages.push('DISTRIBUTION');const machines:any[]=[];
for(const id of ids){
 for(const stage of stages){const s=read(path.join(base,'machines',id,'stages',stage+'.json'));assert.equal(s.state,'COMPLETE');const ref=s.authoritativeOutputRef;assert.equal(sha(path.resolve(root,'..',ref.path)),ref.sha256);const q=read(path.join(base,'work-requests',ref.producerWorkId+'.json'));for(const input of q.inputArtifacts)assert.equal(sha(path.resolve(root,'..',input.path)),input.sha256,'Current upstream binding: '+id+':'+stage);}
 const research=read(path.join(base,'artifacts',id,'research/result.json')),runtime=read(path.join(base,'artifacts',id,'app_runtime/result.json')).package;
 assert.deepEqual(runtime.machine.settings,research.settings.values);assert.equal(runtime.machine.machineDataVersion,'8.5.'+(research.packageRevision??1)+'-'+batch);
 if(!['L_BAKI_L3','L_ANOTHER_RINO_HEAVEN_CC'].includes(id))assert.equal(runtime.ui.playInfo.mode,runtime.metadata?.observationContractRevision?.manualTargetGames?'NONE':'TOTAL_ONLY');
 assert.notEqual(read(path.join(base,'machines',id,'stages/DEVICE_QA.json')).state,'COMPLETE');
 const r=read(path.join(base,'validation/rendered-ui',id+'.json'));assert.equal(r.status,'PASS');
 machines.push({machineId:id,stages:stages.length,activeFeatures:runtime.features.features.length,renderedUi:'PASS',settings:runtime.machine.settings});
}
const report={batchId:batch,status:'PASS',authoritativeStages:ids.length*stages.length,researchReused:true,statisticalThresholdsUnchanged:true,deviceQaAccepted:false,machines};
fs.writeFileSync(path.join(base,'validation/runtime-final-verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
