#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]??'.');
const auditPath=path.join(root,'reports/v64-observation-trial-universe-audit.json');
const outPath=path.join(root,'reports/v64-observation-debt-classification.json');
const audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));

function classify(issue){
  if(issue.type==='HIGH_PRIORITY_FIELD_VERIFICATION_PENDING') return {
    bucket:'MACHINE_REQUIRED',
    reason:'Observation contract explicitly marks this HIGH-priority field verification as WAITING_FOR_MACHINE.'
  };
  if(issue.type==='SOURCE_COVERAGE_UNRESOLVED'){
    if(issue.sourceSurface==='linkedService') return {
      bucket:'WEB_RESEARCH_CANDIDATE',
      reason:'Linked-service existence and published obtainable fields can often be verified from manufacturer/service documentation before real-device confirmation.'
    };
    return {
      bucket:'LOW_PRIORITY_HOLD',
      reason:'Unresolved source coverage is outside the active-Feature linkage gate; resolving it is not required for current inference correctness unless a dedicated field-verification item is opened.'
    };
  }
  return {bucket:'LOW_PRIORITY_HOLD',reason:'Debt does not currently block active inference and has no safe automatic resolution rule.'};
}

const items=[];
for(const machine of audit.machines??[]){
  for(const issue of machine.issues??[]){
    if(issue.severity!=='DEBT') continue;
    const c=classify(issue);
    items.push({machineId:machine.machineId,displayName:machine.displayName,bucket:c.bucket,reason:c.reason,...issue});
  }
}
const buckets={};
for(const item of items) buckets[item.bucket]=(buckets[item.bucket]??0)+1;
const machineBuckets={};
for(const item of items){
  machineBuckets[item.bucket]??=new Set();
  machineBuckets[item.bucket].add(item.machineId);
}
const summary={totalDebt:items.length,buckets,machinesByBucket:Object.fromEntries(Object.entries(machineBuckets).map(([k,v])=>[k,v.size]))};
const report={schemaVersion:'v6.4-observation-debt-classification-v1',generatedAt:new Date().toISOString(),sourceAuditGeneratedAt:audit.generatedAt,summary,items};
fs.writeFileSync(outPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
if(items.length!==(audit.severityCounts?.DEBT??items.length)) throw new Error(`Debt classification mismatch: classified ${items.length}, audit has ${audit.severityCounts?.DEBT}`);
