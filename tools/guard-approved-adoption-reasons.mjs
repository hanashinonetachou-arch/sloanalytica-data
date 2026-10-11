import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const sha = s => crypto.createHash('sha256').update(s,'utf8').digest('hex');
const read = p => JSON.parse(fs.readFileSync(p,'utf8'));
const rationale = pkg => {
 const rows=pkg?.v8?.machineResearchSummary?.adopted;
 if(!Array.isArray(rows))throw Error('ADOPTION_GUARD_MISSING_SUMMARY');
 const result=new Map();
 for(const r of rows){if(typeof r.featureId!=='string'||!r.featureId||result.has(r.featureId)||typeof r.reason!=='string'||!r.reason.trim())throw Error('ADOPTION_GUARD_INVALID_REASON');result.set(r.featureId,r.reason.trim())}
 return result;
};
export function verifyApprovedRationaleFleet(baselineDir,candidateDir,approvals=[]){
 const authorized=new Map();
 for(const row of approvals){
  if(!row||typeof row.machineId!=='string'||typeof row.featureId!=='string'||!/^[0-9a-f]{64}$/.test(row.newReasonSha256)||typeof row.reviewReason!=='string'||!row.reviewReason.trim())throw Error('ADOPTION_GUARD_INVALID_APPROVAL');
  const key=row.machineId+'::'+row.featureId;
  if(authorized.has(key))throw Error('ADOPTION_GUARD_DUPLICATE_APPROVAL:'+key);
  authorized.set(key,row);
 }
 const entries=fs.readdirSync(path.join(baselineDir,'machines'),{withFileTypes:true}).filter(d=>d.isDirectory());
 let checked=0,protectedReasons=0;
 for(const d of entries){
  const basePath=path.join(baselineDir,'machines',d.name,'machine-package.json');
  const nextPath=path.join(candidateDir,'machines',d.name,'machine-package.json');
  if(!fs.existsSync(basePath)||!fs.existsSync(nextPath))continue;
  const before=read(basePath),after=read(nextPath);
  if(before?.machine?.machineId!==d.name||after?.machine?.machineId!==d.name)throw Error('ADOPTION_GUARD_IDENTITY:'+d.name);
  if(!before?.machine?.machineDataVersion?.startsWith('8.5')||!after?.machine?.machineDataVersion?.startsWith('8.5'))continue;
  const old=rationale(before),next=rationale(after);checked++;
  for(const [id,reason] of old){
   const changed=next.get(id)!==reason;
   const key=d.name+'::'+id;
   if(changed){
    const approval=authorized.get(key);
    if(!approval||approval.newReasonSha256!==sha(next.get(id)??''))throw Error('ADOPTION_GUARD_UNREVIEWED:'+key);
    authorized.delete(key);
   }
   protectedReasons++;
  }
  for(const [id,reason] of next){
   if(!reason||/^(現在の採用基準を満たしているため|採用条件を満たし、実戦で観測できる設定差|優先する設定推測項目を記録していない場合の補助)/.test(reason))throw Error('ADOPTION_GUARD_BOILERPLATE:'+d.name+'::'+id);
  }
 }
 if(authorized.size)throw Error('ADOPTION_GUARD_UNUSED_APPROVAL:'+authorized.keys().next().value);
 if(checked===0)throw Error('ADOPTION_GUARD_NO_BASELINE');
 return {status:'PASS',machinesCompared:checked,protectedReasons};
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){
 const [base,candidate,approvalFile]=process.argv.slice(2);
 if(!base||!candidate)throw Error('USAGE: node tools/guard-approved-adoption-reasons.mjs <baseline-dir> <current-dir> [approved-changes.json]');
 console.log(JSON.stringify(verifyApprovedRationaleFleet(base,candidate,approvalFile?read(approvalFile).approvals:[])));
}
