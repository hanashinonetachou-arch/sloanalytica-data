import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]??'.');
const researchDir=path.join(root,'research');
const isHardEvidenceSection=(name)=>{
  if(typeof name!=='string') return false;
  if(name.includes('非確定')) return false;
  return /設定.*確定|確定演出|確定情報/.test(name);
};

let changed=0;
const changedMachines=[];
for(const ent of fs.readdirSync(researchDir,{withFileTypes:true})){
  if(!ent.isDirectory()) continue;
  const file=path.join(researchDir,ent.name,'ui-design-data.json');
  if(!fs.existsSync(file)) continue;
  const data=JSON.parse(fs.readFileSync(file,'utf8'));
  if(!Array.isArray(data.sectionOrder)) continue;
  const hard=data.sectionOrder.filter(isHardEvidenceSection);
  if(hard.length===0) continue;
  const normal=data.sectionOrder.filter((name)=>!isHardEvidenceSection(name));
  const next=[...normal,...hard];
  if(JSON.stringify(next)===JSON.stringify(data.sectionOrder)) continue;
  data.sectionOrder=next;
  data.auditNotes=Array.isArray(data.auditNotes)?data.auditNotes:[];
  if(!data.auditNotes.includes('UI ordering policy: setting-confirmation / hard-Evidence sections are placed at the bottom after ordinary inference inputs.')){
    data.auditNotes.push('UI ordering policy: setting-confirmation / hard-Evidence sections are placed at the bottom after ordinary inference inputs.');
  }
  fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');
  changed++;
  changedMachines.push(ent.name);
}
console.log(`Evidence-section order normalized: ${changed} files`);
for(const id of changedMachines) console.log(`CHANGED ${id}`);
