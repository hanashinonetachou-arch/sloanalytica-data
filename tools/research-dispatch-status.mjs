import fs from"node:fs";
const d=JSON.parse(fs.readFileSync("research-dispatch.json","utf8")),a=d.activeResearch;
console.log(`ACTIVE: ${a.displayName}`);
console.log(`status: ${a.status}`);
console.log(`score: ${a.finalScore}`);
console.log(`machineId: ${a.machineId??"未確定"}`);
console.log(`workspace: ${a.researchWorkspace}`);
console.log(`queued: ${(d.queue??[]).length}`);
for(const q of d.queue??[])console.log(`  ${q.finalScore}\t${q.displayName}`);
