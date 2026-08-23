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

// provisionalRegistrationId is a development-time sequence only. Once assigned it is immutable.
// Existing machines are backfilled from catalog.addedAt order; future machines receive max + 1.
const assigned=new Set((registry.machines??[]).map(m=>m.provisionalRegistrationId).filter(Number.isInteger));
let nextProvisionalId=Math.max(0,...assigned)+1;
const catalogOrder=[...(catalog.machines??[])].sort((a,b)=>{
 const at=Date.parse(a.addedAt??"");
 const bt=Date.parse(b.addedAt??"");
 if(Number.isFinite(at)&&Number.isFinite(bt)&&at!==bt) return at-bt;
 if(Number.isFinite(at)!==Number.isFinite(bt)) return Number.isFinite(at)?-1:1;
 return String(a.machineId).localeCompare(String(b.machineId));
});
for(const c of catalogOrder){
 const existing=byId.get(c.machineId);
 if(existing && !Number.isInteger(existing.provisionalRegistrationId)){
   while(assigned.has(nextProvisionalId)) nextProvisionalId++;
   existing.provisionalRegistrationId=nextProvisionalId;
   assigned.add(nextProvisionalId++);
 }
}

let added=0,updated=0;
for(const c of catalog.machines??[]){
 const packagePath=path.join(ROOT,"machines",c.machineId,"machine-package.json");
 const pkg=fs.existsSync(packagePath)?JSON.parse(fs.readFileSync(packagePath,"utf8")):{};
 const research=fs.existsSync(path.join(ROOT,"research",c.machineId,"research-data.json"));
 const existing=byId.get(c.machineId);
 let provisionalRegistrationId=existing?.provisionalRegistrationId;
 if(!Number.isInteger(provisionalRegistrationId)){
   while(assigned.has(nextProvisionalId)) nextProvisionalId++;
   provisionalRegistrationId=nextProvisionalId;
   assigned.add(nextProvisionalId++);
 }
 const packageReleaseDate=pkg.metadata?.releaseDate??pkg.metadata?.introductionDate??null;
 const base={
  provisionalRegistrationId,
  registrationId:existing?.registrationId??null,
  machineId:c.machineId,displayName:c.displayName??pkg.machine?.displayName??c.machineId,
  manufacturer:c.manufacturer??pkg.machine?.manufacturer??"UNKNOWN",
  releaseDate:existing?.releaseDate??packageReleaseDate,
  releaseDateStatus:existing?.releaseDateStatus??(packageReleaseDate?"VERIFIED":"UNRESOLVED"),
  introducedAt:pkg.metadata?.introductionDate??existing?.introducedAt??null,
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
