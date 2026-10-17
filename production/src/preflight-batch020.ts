import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {RepoStore} from './core.ts';
import {validateResearchArtifacts} from './research-validator.ts';
const root=process.cwd(),s=new RepoStore(root),review=path.join(root,'research-inbox/batch020/reviewed');
const reports:any[]=[];
for(const name of fs.readdirSync(review).filter(x=>x!=='CHANGE_LOG.json')){
 const d=JSON.parse(fs.readFileSync(path.join(review,name),'utf8'));
 const doc={...d,workId:'preflight-'+d.machineId};
 const rel='research-inbox/batch020/preflight/'+name;
 fs.mkdirSync(path.dirname(s.p(rel)),{recursive:true});fs.writeFileSync(s.p(rel),JSON.stringify(doc,null,2)+'\n');
 const ref={kind:'research',path:'production/'+rel,sha256:crypto.createHash('sha256').update(fs.readFileSync(s.p(rel))).digest('hex'),producerWorkId:doc.workId};
 try{reports.push({machineId:d.machineId,status:'PASS',result:validateResearchArtifacts(s,{stage:'RESEARCH',batchId:d.batchId,machineId:d.machineId} as any,{status:'SUCCESS',workId:doc.workId,producedArtifacts:[ref]} as any)});}
 catch(e){reports.push({machineId:d.machineId,status:'FAIL',error:String(e)});}
}
fs.writeFileSync(s.p('research-inbox/batch020/preflight-report.json'),JSON.stringify(reports,null,2)+'\n');
console.log(JSON.stringify(reports,null,2));if(reports.some(x=>x.status==='FAIL'))process.exitCode=1;
