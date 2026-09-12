import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const registryPath=path.join(ROOT,"machine-registry.json");
const catalog=JSON.parse(fs.readFileSync(path.join(ROOT,"catalog.json"),"utf8"));
const registry=JSON.parse(fs.readFileSync(registryPath,"utf8"));
const previousGeneratedAt=registry.generatedAt;
const comparable=value=>{
 const clone=structuredClone(value);
 delete clone.generatedAt;
 return JSON.stringify(clone);
};
const beforeComparable=comparable(registry);
const byId=new Map((registry.machines??[]).map(m=>[m.machineId,m]));

// provisionalRegistrationId is the canonical development-time sequence.
// From 2026-09-12 onward, all currently registered machines are resequenced by
// introduction date (oldest first). New machines are expected to be newer than
// this frozen historical universe and therefore append naturally at the end.
// Same-day machines use machineId as a deterministic tie-breaker.
const catalogMachines=[...(catalog.machines??[])];
const invalidIntroductionDates=catalogMachines.filter(c=>{
 const raw=c.introductionDate;
 return typeof raw!=="string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw) || !Number.isFinite(Date.parse(`${raw}T00:00:00Z`));
});
if(invalidIntroductionDates.length){
 console.error("Registry resequence blocked: every catalog machine must have a valid introductionDate.");
 for(const c of invalidIntroductionDates) console.error(`- ${c.machineId}: ${c.introductionDate??"<missing>"}`);
 process.exit(1);
}
const chronologicalOrder=catalogMachines.sort((a,b)=>{
 const dateCompare=String(a.introductionDate).localeCompare(String(b.introductionDate));
 if(dateCompare!==0) return dateCompare;
 return String(a.machineId).localeCompare(String(b.machineId));
});
const provisionalIdByMachineId=new Map(chronologicalOrder.map((c,index)=>[c.machineId,index+1]));

let added=0,updated=0;
for(const c of catalog.machines??[]){
 const packagePath=path.join(ROOT,"machines",c.machineId,"machine-package.json");
 const pkg=fs.existsSync(packagePath)?JSON.parse(fs.readFileSync(packagePath,"utf8")):{};
 const research=fs.existsSync(path.join(ROOT,"research",c.machineId,"research-data.json"));
 const existing=byId.get(c.machineId);
 const provisionalRegistrationId=provisionalIdByMachineId.get(c.machineId);
 const packageReleaseDate=pkg.metadata?.releaseDate??pkg.metadata?.introductionDate??null;
 const base={
  provisionalRegistrationId,
  registrationId:existing?.registrationId??null,
  machineId:c.machineId,displayName:c.displayName??pkg.machine?.displayName??c.machineId,
  manufacturer:c.manufacturer??pkg.machine?.manufacturer??"UNKNOWN",
  releaseDate:c.introductionDate??existing?.releaseDate??packageReleaseDate,
  releaseDateStatus:c.introductionDate?"VERIFIED":(existing?.releaseDateStatus??(packageReleaseDate?"VERIFIED":"UNRESOLVED")),
  introducedAt:c.introductionDate??pkg.metadata?.introductionDate??existing?.introducedAt??null,
  marketStatus:existing?.marketStatus??"UNKNOWN",marketLastCheckedAt:existing?.marketLastCheckedAt??null,
  marketSources:existing?.marketSources??[],appStatus:"INCLUDED",
  researchStatus:research?"RESEARCH_DATA_PRESENT":(existing?.researchStatus??"UNKNOWN"),
  fieldTestStatus:existing?.fieldTestStatus??"UNKNOWN",machineDataVersion:c.machineDataVersion??null,
  priority:existing?.priority??"NONE",notes:existing?.notes??"catalogから自動登録。"
 };
 if(existing){ Object.assign(existing,base); updated++; } else { registry.machines.push(base); byId.set(c.machineId,base); added++; }
}
registry.machines.sort((a,b)=>a.displayName.localeCompare(b.displayName,"ja"));
const changed=beforeComparable!==comparable(registry);
if(changed){
 registry.generatedAt=new Date().toISOString();
 fs.writeFileSync(registryPath,JSON.stringify(registry,null,2)+"\n");
}else{
 registry.generatedAt=previousGeneratedAt;
}
console.log(`Registry sync: added ${added}, updated ${updated}${changed?" (changed)":" (unchanged)"}`);
console.log(`Provisional registration IDs: 1..${chronologicalOrder.length} by introductionDate (oldest first)`);
