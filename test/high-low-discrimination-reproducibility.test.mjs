import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { calculate } from "../tools/calculate-high-low-discrimination.mjs";

const root=path.resolve(import.meta.dirname,"..");
const ids=["L_GOBLIN_SLAYER_RD","L_LOVEJOU3_M4","L_SMASLO_KAIJI_KYOEN_FJ"];
for(const id of ids){
  const report=JSON.parse(fs.readFileSync(path.join(root,"research",id,"high-low-discrimination-report.json"),"utf8"));
  assert.equal(report.method.generator,"tools/calculate-high-low-discrimination.mjs",id);
  assert.equal(report.method.reproducible,true,id);
  assert.deepEqual(calculate(id,report.method.samplesPerGroupPerVolume,report.method.seed),report.results,id);
}
console.log("HighLow reproducibility PASS:",ids.join(", "));
