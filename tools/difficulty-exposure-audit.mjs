import fs from 'node:fs';
import path from 'node:path';

const ALLOWED=new Set(['EXACT','DERIVED','PROVISIONAL','UNRESOLVED']);
function read(p){return JSON.parse(fs.readFileSync(p,'utf8'));}
export function auditExposure(root='.',manifestPath='difficulty-exposure-audit.json'){
  const m=read(path.resolve(root,manifestPath));
  const errors=[];
  const machines=(m.machines??[]).map(machine=>{
    const selectionPath=path.join(root,'research',machine.machineId,'selection-data.json');
    const researchPath=path.join(root,'research',machine.machineId,'research-data.json');
    const selection=fs.existsSync(selectionPath)?read(selectionPath):null;
    const research=fs.existsSync(researchPath)?read(researchPath):null;
    const selectionIds=new Set((selection?.features??[]).map(f=>f.featureId));
    const researchIds=new Set((research?.features??[]).map(f=>f.researchFeatureId));
    const features=(machine.features??[]).map(f=>{
      if(!ALLOWED.has(f.status))errors.push(`${machine.machineId}/${f.featureId}: invalid status ${f.status}`);
      if(selection && !selectionIds.has(f.featureId))errors.push(`${machine.machineId}: selection feature missing ${f.featureId}`);
      if(research && !researchIds.has(f.researchFeatureId))errors.push(`${machine.machineId}: research feature missing ${f.researchFeatureId}`);
      const usable=['EXACT','DERIVED'].includes(f.status)&&f.safeToApply===true;
      return {...f,calibrationUsable:usable};
    });
    const counts=Object.fromEntries(['EXACT','DERIVED','PROVISIONAL','UNRESOLVED'].map(s=>[s,features.filter(f=>f.status===s).length]));
    return {...machine,sourceAvailability:{researchData:!!research,selectionData:!!selection},features,summary:{...counts,total:features.length,usable:features.filter(f=>f.calibrationUsable).length,blocked:features.filter(f=>!f.calibrationUsable).length}};
  });
  const totals=machines.reduce((a,m)=>{a.total+=m.summary.total;a.usable+=m.summary.usable;a.blocked+=m.summary.blocked;return a;},{total:0,usable:0,blocked:0});
  return {reportVersion:'difficulty-exposure-audit-v1.0',phase:m.phase,generatedAt:new Date().toISOString(),ok:errors.length===0,errors,policy:m.policy,summary:{machineCount:machines.length,...totals},machines,nextAction:'RESOLVE_EVENT_EXPOSURE_AND_PROVISIONAL_GAME_BASIS_BEFORE_CROSS_MACHINE_SCORING'};
}
if(import.meta.url===`file://${process.argv[1]}`){
  const root=process.argv[2]??'.'; const out=process.argv[3]; const r=auditExposure(root); const t=JSON.stringify(r,null,2)+'\n';
  if(out){fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,t);console.log(`Difficulty exposure audit: ${out}`);}else process.stdout.write(t);
  if(!r.ok)process.exit(1);
}
