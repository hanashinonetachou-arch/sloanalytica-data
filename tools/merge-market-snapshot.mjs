import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const registryPath=path.join(ROOT,"machine-registry.json");
const snapshotPath=path.join(ROOT,"market-snapshot.json");
const reportPath=path.join(ROOT,"reports","market-registry-merge.json");
const registry=JSON.parse(fs.readFileSync(registryPath,"utf8"));
const snapshot=JSON.parse(fs.readFileSync(snapshotPath,"utf8"));
const byId=new Map((registry.machines??[]).map(m=>[m.machineId,m]));
const normalize=s=>String(s??"").normalize("NFKC").replace(/[\s・･\-‐‑–—―~〜]/g,"").toLowerCase();
const byName=new Map();
for(const m of registry.machines??[]){ const key=normalize(m.displayName); if(key && !byName.has(key)) byName.set(key,m); else if(key) byName.set(key,null); }
let updated=0; const matched=[],unmatched=[],ambiguous=[];
for(const market of snapshot.machines??[]){
 let target=null,method=null;
 if(market.registryMachineId){ target=byId.get(market.registryMachineId)??null; method="registryMachineId"; }
 if(!target){ const hit=byName.get(normalize(market.displayName)); if(hit){target=hit;method="normalizedDisplayName";} else if(hit===null){ambiguous.push(market);continue;} }
 if(!target){unmatched.push(market);continue;}
 target.marketStatus=market.marketStatus==="SCHEDULED"?"UNCERTAIN":market.marketStatus;
 target.marketLastCheckedAt=snapshot.checkedAt;
 target.marketSources=[...new Set([...(target.marketSources??[]),...market.sourceRefs])];
 if(!target.introducedAt && market.introducedAt) target.introducedAt=market.introducedAt;
 matched.push({marketKey:market.marketKey,machineId:target.machineId,method}); updated++;
}
registry.generatedAt=new Date().toISOString();
fs.writeFileSync(registryPath,JSON.stringify(registry,null,2)+"\n");
fs.mkdirSync(path.dirname(reportPath),{recursive:true});
const report={version:"market-registry-merge-v1",snapshotId:snapshot.snapshotId,updatedCount:updated,matched,unmatched,ambiguous,
 note:"unmatchedは内部machineIdを推測生成せずMarket Snapshotに残す。新機種作成時に正式machineIdを確定して紐付ける。"};
fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+"\n");
console.log(`Market merge: matched ${matched.length}, unmatched ${unmatched.length}, ambiguous ${ambiguous.length}`);
