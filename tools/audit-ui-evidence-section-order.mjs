import fs from 'node:fs';
import path from 'node:path';

export const isHardEvidenceSection=(name)=>{
  if(typeof name!=='string') return false;
  if(name.includes('非確定')) return false;
  return /設定.*確定|確定演出|確定情報/.test(name);
};

export function auditUiEvidenceSectionOrder(data){
  const order=Array.isArray(data?.sectionOrder)?data.sectionOrder:[];
  const hardIndexes=order.map((name,index)=>isHardEvidenceSection(name)?index:-1).filter((index)=>index>=0);
  if(hardIndexes.length===0) return [];
  const firstHard=Math.min(...hardIndexes);
  const laterNormal=order.slice(firstHard+1).filter((name)=>!isHardEvidenceSection(name));
  return laterNormal.length ? [`hard Evidence / setting-confirmation section must be last; later sections: ${laterNormal.join(', ')}`] : [];
}

const root=path.resolve(process.argv[2]??'.');
const researchDir=path.join(root,'research');
let failed=0;
let files=0;
for(const ent of fs.readdirSync(researchDir,{withFileTypes:true})){
  if(!ent.isDirectory()) continue;
  const file=path.join(researchDir,ent.name,'ui-design-data.json');
  if(!fs.existsSync(file)) continue;
  files++;
  const data=JSON.parse(fs.readFileSync(file,'utf8'));
  const errors=auditUiEvidenceSectionOrder(data);
  for(const error of errors){
    failed++;
    console.error(`ERROR ${ent.name}: ${error}`);
  }
}
console.log(`UI Evidence section order audit: ${failed?'FAIL':'PASS'} / files ${files}`);
if(failed) process.exit(1);
