import test from "node:test";
import assert from "node:assert/strict";
import { normalizeMachineIds, parseArgs, npmSpawnSpec, publishApplyArgs } from "../tools/batch-publish-pipeline.mjs";

test("batch publish normalizes duplicates and preserves order", () => {
  assert.deepEqual(normalizeMachineIds(["L_BAKI_L3", "L_BAKI_L3", "L_HOKUTO_AD_XR"]), ["L_BAKI_L3", "L_HOKUTO_AD_XR"]);
});

test("batch publish rejects invalid machine ids", () => {
  assert.throws(() => normalizeMachineIds(["bad-id"]), /invalid machineId/);
});

test("batch publish enforces 10-machine safety limit", () => {
  const ids = Array.from({ length: 11 }, (_, i) => `L_TEST_${i}`);
  assert.throws(() => normalizeMachineIds(ids), /最大10機種/);
});

test("batch publish defaults to dry-run and requires explicit apply", () => {
  assert.deepEqual(parseArgs(["L_BAKI_L3"]), { apply: false, keepBuild: false, file: null, ids: ["L_BAKI_L3"] });
  assert.deepEqual(parseArgs(["--apply", "L_BAKI_L3"]), { apply: true, keepBuild: false, file: null, ids: ["L_BAKI_L3"] });
});

test("batch publish parses file and keep-build flags", () => {
  assert.deepEqual(parseArgs(["--file", "batch.txt", "--keep-build"]), { apply: false, keepBuild: true, file: "batch.txt", ids: [] });
});

test("batch publish defers per-machine audit until all catalog entries are updated", () => {
  assert.deepEqual(publishApplyArgs("L_BAKI_L3"), ["publish", "L_BAKI_L3", "--apply", "--defer-audit"]);
});

test("batch publish invokes npm.cmd through cmd.exe on Windows", () => {
  assert.deepEqual(npmSpawnSpec(["test"], "win32", "C:\\Windows\\System32\\cmd.exe"), {
    command: "C:\\Windows\\System32\\cmd.exe",
    args: ["/d", "/s", "/c", "npm.cmd", "test"],
  });
  assert.deepEqual(npmSpawnSpec(["run", "audit"], "linux"), {
    command: "npm",
    args: ["run", "audit"],
  });
});
