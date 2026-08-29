#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(process.argv[2]??'.');
const debt=JSON.parse(fs.readFileSync(path.join(root,'reports/v64-observation-debt-classification.json'),'utf8'));
const ids=[...new Set((debt.items??[]).filter(x=>x.bucket==='WEB_RESEARCH_CANDIDATE').map(x=>x.machineId))].sort();
const machines=[];
for(const machineId of ids){
  const dir=path.join(root,'research',machineId);
  const obs=JSON.parse(fs.readFileSync(path.join(dir,'machine-observation-data.json'),'utf8'));
  const sel=JSON.parse(fs.readFileSync(path.join(dir,'selection-data.json'),'utf8'));
  let research={};
  const rp=path.join(dir,'research-data.json'); if(fs.existsSync(rp)) research=JSON.parse(fs.readFileSync(rp,'utf8'));
  const hay=JSON.stringify({obs,sel,research});
  const hints=[...new Set(['マイスロ','ユニメモ','打-WIN','打WIN','スロプラNEXT','スロプラ','ダイトモ','パチログ','クイックマイスロ'].filter(x=>hay.includes(x)))];
  machines.push({machineId,displayName:sel.displayName??obs.displayName??machineId,linkedServiceHints:hints,activeFeatureCount:(sel.features??[]).filter(f=>['INCLUDE_PRIMARY','INCLUDE_SUPPORT','INCLUDE_FALLBACK'].includes(f.adoptionCategory)).length});
}
const groups={}; for(const m of machines){const k=m.linkedServiceHints[0]??'NO_INTERNAL_HINT'; (groups[k]??=[]).push(m.machineId);}
const report={schemaVersion:'v6.4-linked-service-research-plan-v1',generatedAt:new Date().toISOString(),summary:{machineCount:machines.length,groups:Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,v.length]))},machines};
fs.writeFileSync(path.join(root,'reports/v64-linked-service-research-plan.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.summary,null,2));
