import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {RepoStore} from '../../src/core.ts';import {validateResearchArtifacts} from '../../src/research-validator.ts';
const root=process.cwd(),s=new RepoStore(root),dir=path.join(root,'research-inbox/batch023/reviewed');
for(const name of fs.readdirSync(dir)){
 const p=path.join(dir,name),d=JSON.parse(fs.readFileSync(p,'utf8'));d.workId='preflight-'+d.machineId;
 const rel='research-inbox/batch023/preflight/'+name;fs.mkdirSync(path.dirname(s.p(rel)),{recursive:true});fs.writeFileSync(s.p(rel),JSON.stringify(d,null,2)+'\n');
 const sha=crypto.createHash('sha256').update(fs.readFileSync(s.p(rel))).digest('hex');
 try{const r=validateResearchArtifacts(s,{stage:'RESEARCH',batchId:d.batchId,machineId:d.machineId} as any,{status:'SUCCESS',workId:d.workId,producedArtifacts:[{kind:'research',path:'production/'+rel,sha256:sha,producerWorkId:d.workId}]} as any);console.log(JSON.stringify({machineId:d.machineId,result:r}));}catch(e){console.log(JSON.stringify({machineId:d.machineId,error:String(e)}));process.exitCode=1;}
}
