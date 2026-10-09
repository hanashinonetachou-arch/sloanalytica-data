import fs from 'node:fs';import path from 'node:path';
import {buildResearchWorkQueue} from './research-work-queue.ts';
import {summarizeResearchProgress} from './research-progress.ts';
import {auditBatch009Staging} from './batch009-staging-integrity.ts';
import {validateResearchCandidateLedger} from './research-validator.ts';
const [basisAudit,output]=process.argv.slice(2);
if(!basisAudit||!output)throw new Error('Usage: basis-audit-path output-path');
const audit=JSON.parse(fs.readFileSync(basisAudit,'utf8')),batch=path.dirname(basisAudit);
const drafts=audit.machineRows.map((row:any)=>{
 const wave=fs.existsSync(path.join(batch,'research-working/wave-1',row.machineId+'.json'))?'wave-1':'wave-2';
 const read=(part:string)=>JSON.parse(fs.readFileSync(path.join(batch,part,row.machineId+'.json'),'utf8'));
 const working=read('research-working/'+wave),staged=read('research-evidence-staged/'+wave),reviewed=read('research-evidence-reviewed');
 for(const d of [working,staged])validateResearchCandidateLedger(d,new Set(d.sources.map((s:any)=>s.sourceId)));
 const errors=auditBatch009Staging(working,reviewed,staged);if(errors.length)throw new Error(row.machineId+':'+errors.join(','));
 return working;
});
fs.writeFileSync(output,JSON.stringify(buildResearchWorkQueue(drafts,path.basename(basisAudit)),null,2)+'\n');
console.log(JSON.stringify(summarizeResearchProgress(drafts)));
