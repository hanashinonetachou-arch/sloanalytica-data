import fs from "node:fs";
export function validateMarketPresenceSnapshot(snapshot){
 const errors=[],warnings=[];
 if(snapshot?.schemaVersion!=="market-presence-snapshot-v1") errors.push("schemaVersion must be market-presence-snapshot-v1");
 if(!Array.isArray(snapshot?.machines)) errors.push("machines must be an array");
 const sourceIds=new Set((snapshot?.sources??[]).map(s=>s.sourceId)),keys=new Set(),ranks=new Set();
 for(const m of snapshot?.machines??[]){
  if(!/^[A-Z0-9_]+$/.test(m.marketKey??"")) errors.push(`invalid marketKey: ${m.marketKey}`);
  if(keys.has(m.marketKey)) errors.push(`duplicate marketKey: ${m.marketKey}`); keys.add(m.marketKey);
  if(!Number.isInteger(m.installCountRank)||m.installCountRank<1) errors.push(`${m.marketKey}: invalid installCountRank`);
  if(ranks.has(m.installCountRank)) warnings.push(`duplicate rank: ${m.installCountRank}`); ranks.add(m.installCountRank);
  if(!Number.isFinite(m.installationRatePercent)||m.installationRatePercent<0||m.installationRatePercent>100) errors.push(`${m.marketKey}: invalid installationRatePercent`);
  if(!["UP","DOWN","KEEP","UNKNOWN"].includes(m.sevenDayTrend)) errors.push(`${m.marketKey}: invalid sevenDayTrend`);
  for(const ref of m.sourceRefs??[]) if(!sourceIds.has(ref)) errors.push(`${m.marketKey}: unknown sourceRef ${ref}`);
 }
 return {ok:errors.length===0,errors,warnings};
}
if(import.meta.url===`file://${process.argv[1]}`){const p=process.argv[2]??"market-presence-snapshot.json";try{const r=validateMarketPresenceSnapshot(JSON.parse(fs.readFileSync(p,"utf8")));for(const w of r.warnings)console.warn(`WARNING: ${w}`);if(!r.ok){for(const e of r.errors)console.error(`ERROR: ${e}`);process.exit(1)}console.log(`OK: Market Presence Snapshotを検証しました（${r.warnings.length}警告）`)}catch(e){console.error(`ERROR: ${e.message}`);process.exit(1)}}