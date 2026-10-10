import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../..'),batch=process.argv[2];if(!batch)throw Error('BATCH_ID_REQUIRED');const base=root+'/production/batches/'+batch;
const {RepoStore}=await import(root+'/production/src/core.ts');const store=new RepoStore(root+'/production');
const names={RESEARCH:'research',EVALUATION:'evaluation',ELIGIBILITY:'eligibility',CANDIDATE_CONTRACT:'candidate-contract',OBSERVATION_EVIDENCE:'observation-evidence',CANONICAL_UI:'canonical-ui',MACHINE_DATA:'machine-data',RUNTIME_POLICY:'runtime-policy',RUNTIME_PROJECTION:'runtime-projection',APP_RUNTIME:'app-runtime'};
const rows=[];for(const machineId of fs.readdirSync(base+'/machines')){
 const checks=[];for(const [stage,name] of Object.entries(names)){
  const s=JSON.parse(fs.readFileSync(base+'/machines/'+machineId+'/stages/'+stage+'.json'));if(s.state!=='COMPLETE')throw Error(machineId+':'+stage);
  const ref=s.authoritativeOutputRef;const bytes=fs.readFileSync(path.join(root,ref.path));if(crypto.createHash('sha256').update(bytes).digest('hex')!==ref.sha256)throw Error('SHA:'+ref.path);
  const mod=await import(root+'/production/src/'+name+'-validator.ts');const fn=Object.entries(mod).find(([k])=>/^validate.*Artifacts$/.test(k));if(!fn)throw Error('validator:'+name);
  fn[1](store,{batchId:batch,machineId,stage},{producedArtifacts:[ref],status:'SUCCESS',workId:ref.producerWorkId});checks.push(stage);
 }
 rows.push({machineId,status:'PASS',checks});
}
console.log(JSON.stringify({batchId:batch,status:'PASS',machines:rows},null,2));
