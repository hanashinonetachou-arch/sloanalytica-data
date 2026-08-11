import fs from "node:fs";
export function validateResearchDispatch(d){
 const errors=[];
 if(d?.schemaVersion!=="research-dispatch-v1") errors.push("invalid schemaVersion");
 const a=d?.activeResearch;
 if(!a) errors.push("activeResearch required");
 if(a){
   if(!a.dispatchId) errors.push("activeResearch.dispatchId required");
   if(!a.marketKey) errors.push("activeResearch.marketKey required");
   if(!a.displayName) errors.push("activeResearch.displayName required");
   if(!["READY_FOR_FULL_RESEARCH","RESEARCHING","RESEARCH_COMPLETE","BLOCKED"].includes(a.status)) errors.push("invalid activeResearch.status");
 }
 if((d?.queue??[]).some(x=>!x.marketKey||!x.displayName||!Number.isFinite(x.finalScore))) errors.push("invalid queue row");
 if((d?.policy?.maxActiveFullResearch??0)!==1) errors.push("maxActiveFullResearch must be 1 in v1");
 return {ok:errors.length===0,errors};
}
if(import.meta.url===`file://${process.argv[1]}`){
 const r=validateResearchDispatch(JSON.parse(fs.readFileSync(process.argv[2]??"research-dispatch.json","utf8")));
 if(!r.ok){for(const e of r.errors)console.error("ERROR:",e);process.exit(1)}
 console.log("OK: Research Dispatchを検証しました");
}