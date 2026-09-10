import fs from 'node:fs';
import path from 'node:path';
import { validateSelectionData } from './validate-selection-data.mjs';

const ROOT=process.cwd();
const BATCH='20260910-next10-v7';
const machineIds=['L_YABACHIBA_ZM','L_NANGOKU_SPECIAL_M1','L_SENGOKU_COLLECTION6_KS','L_KARAKURI_CIRCUS2_JG','L_ULTRAMAN_FINAL_BATTLE_ME','L_WORLD_DAI_STAR_PA3','L_YAJIKITA_MAIRU_BG','L_TONDEMO_SKILL_KM','LB_TRIPLE_CROWN_X300','L_TOARU_INDEX2_FA'];
const report=[]; let errors=[];
for(const id of machineIds){
 const dir=path.join(ROOT,'research',id);
 const rp=path.join(dir,'research-data.json'), sp=path.join(dir,'selection-data.json');
 const research=JSON.parse(fs.readFileSync(rp,'utf8')), sel=JSON.parse(fs.readFileSync(sp,'utf8'));
 const rfById=new Map((research.features??[]).map(x=>[x.researchFeatureId,x]));
 const inputById=new Map((sel.inputs??[]).map(x=>[x.id,x]));
 const groups=new Map();
 for(const f of sel.features??[]){
   if(!f.denominatorInputId || f.adoptionCategory==='EXCLUDE') continue;
   const rf=rfById.get(f.researchFeatureId); if(!rf) continue;
   const key=JSON.stringify([rf.denominatorDefinition??'',rf.trialUnit??'']);
   if(!groups.has(key)) groups.set(key,[]);
   groups.get(key).push({f,rf,input:inputById.get(f.denominatorInputId)});
 }
 let removed=0, sharedGroups=0;
 const removeIds=new Set();
 for(const [key,items] of groups){
   if(items.length<2) continue;
   const canonical=items[0].input;
   if(!canonical){errors.push(`${id}: missing canonical denominator input for ${key}`);continue;}
   canonical.category='SHARED_DENOMINATOR';
   canonical.inferenceRole='INCLUDE_PRIMARY';
   canonical.description=`複数の設定推測要素で同じ公開母集団を使うため共有します。${items[0].rf.denominatorDefinition??items[0].rf.trialUnit??''}`;
   canonical.sharedByFeatureIds=items.map(x=>x.f.featureId);
   for(const item of items.slice(1)){
     if(!item.input){errors.push(`${id}: missing denominator input ${item.f.denominatorInputId}`);continue;}
     removeIds.add(item.input.id); item.f.denominatorInputId=canonical.id; removed++;
   }
   sharedGroups++;
 }
 sel.inputs=(sel.inputs??[]).filter(x=>!removeIds.has(x.id));
 sel.denominatorSharingContract={schemaVersion:'denominator-sharing-v1',ruleId:'RSO-OBS-003',exactDefinitionOnly:true,sharedGroups:[...groups.entries()].filter(([,xs])=>xs.length>1).map(([key,xs])=>({definitionKey:key,denominatorInputId:xs[0].f.denominatorInputId,featureIds:xs.map(x=>x.f.featureId)}))};
 const v=validateSelectionData(sel,research); if(!v.ok) errors.push(...v.errors.map(e=>`${id}: ${e}`));
 fs.writeFileSync(sp,JSON.stringify(sel,null,2)+'\n');
 report.push({machineId:id,sharedGroups,removedDuplicateDenominatorInputs:removed,validator:v.ok?'PASS':'FAIL'});
}
const out={schemaVersion:'gate-b-denominator-sharing-report-v1',batchId:BATCH,checkedAt:'2026-09-11T00:48:00+09:00',status:errors.length?'BLOCKED':'PASS',machines:report,summary:{machines:10,validatorPass:report.filter(x=>x.validator==='PASS').length,sharedGroups:report.reduce((a,x)=>a+x.sharedGroups,0),removedDuplicateDenominatorInputs:report.reduce((a,x)=>a+x.removedDuplicateDenominatorInputs,0)},errors};
fs.writeFileSync(path.join(ROOT,'batches',BATCH,'gate-b-denominator-sharing-report.json'),JSON.stringify(out,null,2)+'\n');
console.log(`DENOMINATOR SHARING ${out.status}`,JSON.stringify(out.summary));
if(errors.length){for(const e of errors)console.error(e);process.exit(1);}
