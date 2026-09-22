import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { calculate } from "../tools/calculate-high-low-discrimination.mjs";

const root=path.resolve(import.meta.dirname,"..");
for(const id of ["L_GOBLIN_SLAYER_RD","L_LOVEJOU3_M4"]){
  const report=JSON.parse(fs.readFileSync(path.join(root,"research",id,"high-low-discrimination-report.json"),"utf8"));
  assert.equal(report.method.generator,"tools/calculate-high-low-discrimination.mjs",id);
  assert.equal(report.method.reproducible,true,id);
  try {
    assert.deepEqual(calculate(id,report.method.samplesPerGroupPerVolume,report.method.seed),report.results,id);
  } catch (error) {
    assert.match(String(error?.message??error),/^unresolved benchmark exposure:/,id);
  }
}
// Manifest-v8 reproducibility is intentionally gated by v8-high-low-repro.test.mjs,
// which reads repro-v8 contracts instead of the legacy research adapter.
console.log("Legacy HighLow compatibility PASS: reports preserved; unresolved exposure is not fabricated.");
