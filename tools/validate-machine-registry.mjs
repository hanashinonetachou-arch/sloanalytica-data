import fs from "node:fs";

export function validateMachineRegistry(registry){
  const errors=[],warnings=[];
  if(registry?.schemaVersion!=="machine-registry-v1") errors.push("schemaVersion must be machine-registry-v1");
  if(!Array.isArray(registry?.machines)) errors.push("machines must be an array");
  const machines=Array.isArray(registry?.machines)?registry.machines:[];
  const ids=new Set();
  const allowed={
    marketStatus:new Set(["ACTIVE","DECLINING","UNCERTAIN","RETIRED","UNKNOWN"]),
    appStatus:new Set(["NOT_STARTED","RESEARCHING","MACHINE_DATA_BUILDING","FIELD_TESTING","INCLUDED","BLOCKED"]),
    researchStatus:new Set(["NOT_RESEARCHED","RESEARCH_DATA_PRESENT","NEEDS_UPDATE","UNKNOWN"]),
    fieldTestStatus:new Set(["NOT_TESTED","TESTING","PASS","NEEDS_FIX","UNKNOWN"]),
    priority:new Set(["HIGH","MEDIUM","LOW","NONE"]),
  };
  for(const m of machines){
    if(!/^[A-Z0-9_]+$/.test(m.machineId??"")) errors.push(`invalid machineId: ${m.machineId}`);
    if(ids.has(m.machineId)) errors.push(`duplicate machineId: ${m.machineId}`); ids.add(m.machineId);
    if(!m.displayName) errors.push(`${m.machineId}: displayName required`);
    if(!m.manufacturer) errors.push(`${m.machineId}: manufacturer required`);
    for(const [k,set] of Object.entries(allowed)) if(!set.has(m[k])) errors.push(`${m.machineId}: invalid ${k} ${m[k]}`);
    if(m.appStatus==="INCLUDED" && !m.machineDataVersion) errors.push(`${m.machineId}: INCLUDED requires machineDataVersion`);
    if(m.marketStatus==="ACTIVE" && !m.marketLastCheckedAt) warnings.push(`${m.machineId}: ACTIVE but marketLastCheckedAt is empty`);
  }
  return {ok:errors.length===0,errors,warnings};
}
if(import.meta.url===`file://${process.argv[1]}`){
  const p=process.argv[2]??"machine-registry.json";
  try{
    const r=validateMachineRegistry(JSON.parse(fs.readFileSync(p,"utf8")));
    for(const w of r.warnings) console.warn(`WARNING: ${w}`);
    if(!r.ok){ for(const e of r.errors) console.error(`ERROR: ${e}`); process.exit(1); }
    console.log(`OK: Machine Registryを検証しました（${r.warnings.length}警告）`);
  }catch(e){ console.error(`ERROR: ${e.message}`); process.exit(1); }
}
