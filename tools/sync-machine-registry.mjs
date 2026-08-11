import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const registryPath=path.join(ROOT,"machine-registry.json");
const catalog=JSON.parse(fs.readFileSync(path.join(ROOT,"catalog.json"),"utf8"));
const registry=JSON.parse(fs.readFileSync(registryPath,"utf8"));
const byId=new Map((registry.machines??[]).map(m=>[m.machineId,m]));
let added=0,updated=0;
for(const c of catalog.machines??[]){
 const packagePath=path.join(ROOT,"machines",c.machineId,"machine-package.json");
 const pkg=fs.existsSync(packagePath)?JSON.parse(fs.readFileSync(packagePath,"utf8")):{};
 const research=fs.existsSync(path.join(ROOT,"research",c.machineId,"research-data.json"));
 const existing=byId.get(c.machineId);
 const base={
  machineId:c.machineId,displayName:c.displayName??pkg.machine?.displayName??c.machineId,
  manufacturer:c.manufacturer??pkg.machine?.manufacturer??"UNKNOWN",
  introducedAt:pkg.metadata?.introductionDate??existing?.introducedAt??null,
  marketStatus:existing?.marketStatus??"UNKNOWN",marketLastCheckedAt:existing?.marketLastCheckedAt??null,
  marketSources:existing?.marketSources??[],appStatus:"INCLUDED",
  researchStatus:research?"RESEARCH_DATA_PRESENT":(existing?.researchStatus??"UNKNOWN"),
  fieldTestStatus:existing?.fieldTestStatus??"UNKNOWN",machineDataVersion:c.machineDataVersion??null,
  priority:existing?.priority??"NONE",notes:existing?.notes??"catalogから自動登録。"
 };
 if(existing){ Object.assign(existing,base); updated++; } else { registry.machines.push(base); added++; }
}
registry.generatedAt=new Date().toISOString();
registry.machines.sort((a,b)=>a.displayName.localeCompare(b.displayName,"ja"));
fs.writeFileSync(registryPath,JSON.stringify(registry,null,2)+"\n");
console.log(`Registry sync: added ${added}, updated ${updated}`);
