import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { normalizeMachineIds, parseArgs, npmSpawnSpec, publishApplyArgs } from "../tools/batch-publish-pipeline.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

test("atomic batch regression: repository checks run only after the per-machine loop", () => {
  const source = fs.readFileSync(path.join(ROOT, "tools", "batch-publish-pipeline.mjs"), "utf8");
  const loopPos = source.indexOf("for (const id of ids) publishOne(id, parsed.apply);");
  const registryPos = source.indexOf('runNode("sync-machine-registry.mjs")', loopPos);
  const checksPos = source.indexOf("repositoryChecks();", loopPos);

  assert.notEqual(loopPos, -1, "per-machine publish loop must exist");
  assert.ok(registryPos > loopPos, "registry sync must happen after every target machine has been published");
  assert.ok(checksPos > registryPos, "full repository checks must happen after all target catalog updates and registry sync");
});

test("atomic batch regression: deferred publish never runs the full auditor per machine", () => {
  const source = fs.readFileSync(path.join(ROOT, "tools", "publish-machine-data.mjs"), "utf8");
  const deferredPos = source.indexOf("if(deferAudit){");
  const auditPos = source.indexOf("const result=audit();", deferredPos);
  const pendingStatusPos = source.indexOf("PUBLISHED_PENDING_BATCH_AUDIT", deferredPos);

  assert.notEqual(deferredPos, -1, "deferred audit branch must exist");
  assert.ok(pendingStatusPos > deferredPos, "deferred publish must record a pending batch-audit status");
  assert.ok(auditPos > deferredPos, "normal single-machine audit path must still exist after the deferred early-return branch");

  const deferredBlock = source.slice(deferredPos, auditPos);
  assert.doesNotMatch(deferredBlock, /audit\(\)/, "deferred per-machine path must not invoke the full repository auditor");
  assert.match(deferredBlock, /return;/, "deferred per-machine path must return before the normal audit path");
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
