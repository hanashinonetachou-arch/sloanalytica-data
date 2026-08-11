import fs from"node:fs";import path from"node:path";
const machineId=process.argv[2];
if(!machineId||!/^[A-Z0-9_]+$/.test(machineId)){console.error("ERROR: valid MACHINE_ID required");process.exit(2)}
const d=JSON.parse(fs.readFileSync("research-dispatch.json","utf8")),p=path.join("research",machineId,"research-data.json");
if(!fs.existsSync(p)){console.error(`ERROR: ${p} not found`);process.exit(1)}
const research=JSON.parse(fs.readFileSync(p,"utf8"));
if(research?.machine?.machineId!==machineId){console.error("ERROR: research-data machineId mismatch");process.exit(1)}
d.activeResearch.machineId=machineId;d.activeResearch.status="RESEARCH_COMPLETE";d.activeResearch.completedAt=new Date().toISOString();d.activeResearch.nextAction=`npm run machine:new -- run ${machineId}`;
fs.writeFileSync("research-dispatch.json",JSON.stringify(d,null,2)+"\n");
console.log(`RESEARCH_COMPLETE: ${d.activeResearch.displayName} -> ${machineId}`);
