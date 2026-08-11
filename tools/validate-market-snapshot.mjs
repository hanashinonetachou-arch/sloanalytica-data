import fs from "node:fs";
const file=process.argv[2]??"market-snapshot.json";
function fail(m){console.error(`ERROR: ${m}`);process.exitCode=1;}
let d; try{d=JSON.parse(fs.readFileSync(file,"utf8"));}catch(e){console.error(`ERROR: ${e.message}`);process.exit(1);}
if(d.schemaVersion!=="market-snapshot-v1") fail("schemaVersion must be market-snapshot-v1");
if(!d.snapshotId||!d.checkedAt||d.scope?.category!=="PACHISLOT") fail("snapshot metadata is incomplete");
const sourceIds=new Set();
for(const s of d.sources??[]){
 if(sourceIds.has(s.sourceId)) fail(`duplicate sourceId: ${s.sourceId}`); sourceIds.add(s.sourceId);
 if(!/^https?:\/\//.test(s.url??"")) fail(`invalid source URL: ${s.sourceId}`);
}
const keys=new Set();
for(const m of d.machines??[]){
 if(keys.has(m.marketKey)) fail(`duplicate marketKey: ${m.marketKey}`); keys.add(m.marketKey);
 if(!["ACTIVE","SCHEDULED","UNCERTAIN","RETIRED"].includes(m.marketStatus)) fail(`invalid marketStatus: ${m.marketKey}`);
 if(!(m.sourceRefs??[]).length) fail(`sourceRefs required: ${m.marketKey}`);
 for(const r of m.sourceRefs??[]) if(!sourceIds.has(r)) fail(`${m.marketKey}: unknown sourceRef ${r}`);
}
if(process.exitCode) process.exit(process.exitCode);
console.log(`OK: Market Snapshotを検証しました（${d.machines?.length??0}機種 / ${d.sources?.length??0}出典）`);
