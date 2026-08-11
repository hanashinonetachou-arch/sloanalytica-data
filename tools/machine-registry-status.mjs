import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const registry=JSON.parse(fs.readFileSync(path.join(ROOT,"machine-registry.json"),"utf8"));
const args=new Set(process.argv.slice(2));
let machines=[...(registry.machines??[])];
if(args.has("--missing")) machines=machines.filter(m=>["ACTIVE","DECLINING","UNCERTAIN"].includes(m.marketStatus) && m.appStatus!=="INCLUDED");
if(args.has("--active")) machines=machines.filter(m=>m.marketStatus==="ACTIVE");
if(args.has("--included")) machines=machines.filter(m=>m.appStatus==="INCLUDED");
const counts={
 total:registry.machines.length,
 active:registry.machines.filter(m=>m.marketStatus==="ACTIVE").length,
 included:registry.machines.filter(m=>m.appStatus==="INCLUDED").length,
 fieldTesting:registry.machines.filter(m=>m.appStatus==="FIELD_TESTING"||m.fieldTestStatus==="TESTING").length,
 needsFix:registry.machines.filter(m=>m.fieldTestStatus==="NEEDS_FIX").length,
 missingActive:registry.machines.filter(m=>m.marketStatus==="ACTIVE"&&m.appStatus!=="INCLUDED").length,
 unknownMarket:registry.machines.filter(m=>m.marketStatus==="UNKNOWN").length,
};
console.log(`Machine Registry v1`);
console.log(`全登録: ${counts.total} / 稼働中: ${counts.active} / アプリ収録済: ${counts.included} / 実機テスト中: ${counts.fieldTesting} / 要修正: ${counts.needsFix} / 稼働中未収録: ${counts.missingActive} / 市場未確認: ${counts.unknownMarket}`);
if(machines.length){
 console.log("");
 for(const m of machines){
  console.log(`${m.machineId}\t${m.displayName}\t市場:${m.marketStatus}\tアプリ:${m.appStatus}\t実機:${m.fieldTestStatus}\t優先:${m.priority}${m.machineDataVersion?`\tv${m.machineDataVersion}`:""}`);
 }
}else console.log("\n該当機種なし");
