import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {calculateHighLow} from "../tools/high-low-discrimination-engine.mjs";

test("generic HLD reproduces Revue v8.4 formal artifact", () => {
  const base = new URL("../repro-v8/S_REVUE_STARLIGHT_CX/", import.meta.url);
  const input = JSON.parse(fs.readFileSync(new URL("high-low-discrimination-input.json", base), "utf8"));
  const report = JSON.parse(fs.readFileSync(new URL("high-low-discrimination.json", base), "utf8"));
  assert.deepEqual(calculateHighLow(input), report.results);
  assert.deepEqual(report.benchmark.lowSettings, ["SET_1", "SET_2"]);
  assert.deepEqual(report.benchmark.highSettings, ["SET_5", "SET_6"]);
  assert.equal(report.benchmark.classifier, "CLASS_MARGINAL_LIKELIHOOD");
});
