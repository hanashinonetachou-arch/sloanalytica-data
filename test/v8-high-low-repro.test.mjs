import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {calculate} from "../tools/calculate-high-low-discrimination.mjs";
const base="repro-v8/L_SMASLO_KAIJI_KYOEN_FJ";
test("Kaiji v8 HighLow artifact is reproducible from v8 Research and Selection",()=>{
 const saved=JSON.parse(fs.readFileSync(new URL("../"+base+"/high-low-discrimination.json",import.meta.url),"utf8"));
 const actual=calculate(saved.machineId,saved.simulation.samplesPerGroup,saved.simulation.seed,["RF_CZ_INITIAL","RF_WATERMELON"],base);
 assert.deepEqual(actual,saved.results);
});
