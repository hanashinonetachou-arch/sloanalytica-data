import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const registry=JSON.parse(fs.readFileSync(path.join(ROOT,"machine-registry.json"),"utf8"));
const snapshotPath=path.join(ROOT,"market-snapshot.json");
const snapshot=fs.existsSync(snapshotPath)?JSON.parse(fs.readFileSync(snapshotPath,"utf8")):null;
const presencePath=path.join(ROOT,"market-presence-snapshot.json");
const presence=fs.existsSync(presencePath)?JSON.parse(fs.readFileSync(presencePath,"utf8")):null;
const args=new Set(process.argv.slice(2));
const normalize=s=>String(s??"").normalize("NFKC").replace(/[\s・･\-‐‑–—―~〜]/g,"").toLowerCase();
const registryNames=new Set((registry.machines??[]).map(m=>normalize(m.displayName)));
const unresolved=(snapshot?.machines??[]).filter(m=>!m.registryMachineId&&!registryNames.has(normalize(m.displayName)));
const activeUnresolved=unresolved.filter(m=>m.marketStatus==="ACTIVE");
const scheduledUnresolved=unresolved.filter(m=>m.marketStatus==="SCHEDULED");
let machines=[...(registry.machines??[])];
if(args.has("--missing")){
 const existing=machines.filter(m=>["ACTIVE","DECLINING","UNCERTAIN"].includes(m.marketStatus)&&m.appStatus!=="INCLUDED")
   .map(m=>({kind:"registry",...m}));
 const market=activeUnresolved.map(m=>({kind:"market",machineId:"(未確定)",appStatus:"NOT_STARTED",fieldTestStatus:"NOT_TESTED",priority:"NONE",...m}));
 console.log(`Machine Registry v1 + Market Snapshot`);
 console.log(`稼働中未収録候補: ${existing.length+market.length}（Registry ${existing.length} / Market未紐付け ${market.length}）`);
 for(const m of [...existing,...market]) console.log(`${m.machineId}\t${m.displayName}\t市場:${m.marketStatus}\tアプリ:${m.appStatus}\t導入:${m.introducedAt??"-"}`);
 process.exit(0);
}
if(args.has("--priority")){
 const included=new Set((registry.machines??[]).filter(m=>m.appStatus==="INCLUDED").map(m=>m.machineId));
 const rows=(presence?.machines??[]).filter(p=>!p.registryMachineId||!included.has(p.registryMachineId)).map(p=>({...p,priority:p.installCountRank<=10?"HIGH":p.installCountRank<=20?"MEDIUM":"LOW"}));
 console.log(`現在設置上位・未収録候補: ${rows.length}`);
 for(const r of rows) console.log(`${r.priority}\t#${r.installCountRank}\t${r.displayName}\t導入率:${r.installationRatePercent}%\t傾向:${r.sevenDayTrend}`);
 process.exit(0);
}
if(args.has("--market")){
 console.log(`Market Snapshot ${snapshot?.snapshotId??"なし"}`);
 console.log(`候補: ${snapshot?.machines?.length??0} / 稼働中未紐付け: ${activeUnresolved.length} / 導入予定未紐付け: ${scheduledUnresolved.length}`);
 for(const m of snapshot?.machines??[]) console.log(`${m.marketKey}\t${m.displayName}\t市場:${m.marketStatus}\t導入:${m.introducedAt??"-"}\tRegistry:${m.registryMachineId??"未紐付け"}`);
 process.exit(0);
}
if(args.has("--active")) machines=machines.filter(m=>m.marketStatus==="ACTIVE");
if(args.has("--included")) machines=machines.filter(m=>m.appStatus==="INCLUDED");
const counts={total:registry.machines.length,active:registry.machines.filter(m=>m.marketStatus==="ACTIVE").length,included:registry.machines.filter(m=>m.appStatus==="INCLUDED").length,fieldTesting:registry.machines.filter(m=>m.appStatus==="FIELD_TESTING"||m.fieldTestStatus==="TESTING").length,needsFix:registry.machines.filter(m=>m.fieldTestStatus==="NEEDS_FIX").length,unknownMarket:registry.machines.filter(m=>m.marketStatus==="UNKNOWN").length};
console.log(`Machine Registry v1 + Market Snapshot`);
console.log(`Registry: ${counts.total} / アプリ収録済: ${counts.included} / Registry稼働中: ${counts.active} / 市場未確認: ${counts.unknownMarket}`);
console.log(`Market Seed: ${snapshot?.machines?.length??0} / 稼働中未収録候補: ${activeUnresolved.length} / 導入予定: ${scheduledUnresolved.length}`);
console.log(`Presence Top: ${presence?.machines?.length??0} / Registry紐付け: ${(presence?.machines??[]).filter(m=>m.registryMachineId).length}`);
if(machines.length){console.log("");for(const m of machines)console.log(`${m.machineId}\t${m.displayName}\t市場:${m.marketStatus}\tアプリ:${m.appStatus}\t実機:${m.fieldTestStatus}\t優先:${m.priority}${m.machineDataVersion?`\tv${m.machineDataVersion}`:""}`)}
