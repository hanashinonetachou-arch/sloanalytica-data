import fs from "node:fs";

const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
const isRealDate=value=>{
  if(!DATE_RE.test(value)) return false;
  const d=new Date(`${value}T00:00:00Z`);
  return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;
};

export function validateMachineRegistry(registry){
  const errors=[],warnings=[];
  if(registry?.schemaVersion!=="machine-registry-v1") errors.push("schemaVersion must be machine-registry-v1");
  if(!Array.isArray(registry?.machines)) errors.push("machines must be an array");
  const machines=Array.isArray(registry?.machines)?registry.machines:[];
  const ids=new Set();
  const provisionalIds=new Set();
  const registrationIds=new Set();
  const allowed={
    marketStatus:new Set(["ACTIVE","DECLINING","UNCERTAIN","RETIRED","UNKNOWN"]),
    appStatus:new Set(["NOT_STARTED","RESEARCHING","MACHINE_DATA_BUILDING","FIELD_TESTING","INCLUDED","BLOCKED"]),
    researchStatus:new Set(["NOT_RESEARCHED","RESEARCH_DATA_PRESENT","NEEDS_UPDATE","UNKNOWN"]),
    fieldTestStatus:new Set(["NOT_TESTED","TESTING","PASS","NEEDS_FIX","UNKNOWN"]),
    priority:new Set(["HIGH","MEDIUM","LOW","NONE"]),
    releaseDateStatus:new Set(["VERIFIED","UNRESOLVED"]),
  };
  for(const m of machines){
    if(!/^[A-Z0-9_]+$/.test(m.machineId??"")) errors.push(`invalid machineId: ${m.machineId}`);
    if(ids.has(m.machineId)) errors.push(`duplicate machineId: ${m.machineId}`); ids.add(m.machineId);
    if(!m.displayName) errors.push(`${m.machineId}: displayName required`);
    if(!m.manufacturer) errors.push(`${m.machineId}: manufacturer required`);
    if(m.provisionalRegistrationId!=null){
      if(!Number.isInteger(m.provisionalRegistrationId)||m.provisionalRegistrationId<1) errors.push(`${m.machineId}: invalid provisionalRegistrationId`);
      else if(provisionalIds.has(m.provisionalRegistrationId)) errors.push(`${m.machineId}: duplicate provisionalRegistrationId ${m.provisionalRegistrationId}`);
      else provisionalIds.add(m.provisionalRegistrationId);
    }else warnings.push(`${m.machineId}: provisionalRegistrationId is not assigned`);
    if(m.registrationId!=null){
      if(!Number.isInteger(m.registrationId)||m.registrationId<1) errors.push(`${m.machineId}: invalid registrationId`);
      else if(registrationIds.has(m.registrationId)) errors.push(`${m.machineId}: duplicate registrationId ${m.registrationId}`);
      else registrationIds.add(m.registrationId);
    }
    if(m.releaseDate!=null && !isRealDate(m.releaseDate)) errors.push(`${m.machineId}: releaseDate must be YYYY-MM-DD or null`);
    if(m.releaseDateStatus!=null && !allowed.releaseDateStatus.has(m.releaseDateStatus)) errors.push(`${m.machineId}: invalid releaseDateStatus ${m.releaseDateStatus}`);
    if(m.releaseDateStatus==="VERIFIED" && m.releaseDate==null) errors.push(`${m.machineId}: VERIFIED releaseDateStatus requires releaseDate`);
    for(const [k,set] of Object.entries(allowed)) if(k!=="releaseDateStatus" && !set.has(m[k])) errors.push(`${m.machineId}: invalid ${k} ${m[k]}`);
    if(m.appStatus==="INCLUDED" && !m.machineDataVersion) errors.push(`${m.machineId}: INCLUDED requires machineDataVersion`);
    if(m.marketStatus==="ACTIVE" && !m.marketLastCheckedAt) warnings.push(`${m.machineId}: ACTIVE but marketLastCheckedAt is empty`);
    if(m.latestInstallCountRank!=null && (!Number.isInteger(m.latestInstallCountRank)||m.latestInstallCountRank<1)) errors.push(`${m.machineId}: invalid latestInstallCountRank`);
    if(m.latestInstallationRatePercent!=null && (!Number.isFinite(m.latestInstallationRatePercent)||m.latestInstallationRatePercent<0||m.latestInstallationRatePercent>100)) errors.push(`${m.machineId}: invalid latestInstallationRatePercent`);
    if(m.latestSevenDayTrend!=null && !["UP","DOWN","KEEP","UNKNOWN"].includes(m.latestSevenDayTrend)) errors.push(`${m.machineId}: invalid latestSevenDayTrend`);
    if(m.marketEvidenceLevel!=null && !["RANKED_CURRENT","RELEASE_ONLY","UNKNOWN"].includes(m.marketEvidenceLevel)) errors.push(`${m.machineId}: invalid marketEvidenceLevel`);
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
