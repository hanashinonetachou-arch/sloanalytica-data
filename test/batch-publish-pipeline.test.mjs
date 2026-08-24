import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import {
  machinePackageIdFromPath,
  normalizeMachineIds,
  npmSpawnSpec,
  parseArgs,
  publishApplyArgs,
  restoreDirectory,
  snapshotDirectory,
  unexpectedMachinePackageIds,
} from "../tools/batch-publish-pipeline.mjs";

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

test("batch safety extracts machine IDs only from machine-package paths", () => {
  assert.equal(machinePackageIdFromPath("machines/L_INITIAL_D_2ND/machine-package.json"), "L_INITIAL_D_2ND");
  assert.equal(machinePackageIdFromPath("machines\\L_INITIAL_D_2ND\\machine-package.json"), "L_INITIAL_D_2ND");
  assert.equal(machinePackageIdFromPath("research/L_INITIAL_D_2ND/research-data.json"), null);
  assert.equal(machinePackageIdFromPath("machines/L_INITIAL_D_2ND/notes.json"), null);
});

test("batch safety blocks machine-package changes outside requested IDs", () => {
  const paths = [
    "machines/S_FAMISTA_KAIDO_FB/machine-package.json",
    "machines/L_INITIAL_D_2ND/machine-package.json",
    "research/L_INITIAL_D_2ND/ui-design-data.json",
    "machines/L_ONIMUSHA3_XA/machine-package.json",
    "machines/L_INITIAL_D_2ND/machine-package.json",
  ];
  assert.deepEqual(
    unexpectedMachinePackageIds(paths, ["S_FAMISTA_KAIDO_FB", "L_ONIMUSHA3_XA"]),
    ["L_INITIAL_D_2ND"],
  );
});

test("batch safety allows only requested machine-package changes", () => {
  assert.deepEqual(
    unexpectedMachinePackageIds([
      "machines/S_FAMISTA_KAIDO_FB/machine-package.json",
      "machines/L_ONIMUSHA3_XA/machine-package.json",
    ], ["S_FAMISTA_KAIDO_FB", "L_ONIMUSHA3_XA"]),
    [],
  );
});

test("build cleanup restores the exact pre-run directory contents", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sloanalytica-build-snapshot-"));
  const buildDir = path.join(root, "build", "L_INITIAL_D_2ND");
  fs.mkdirSync(path.join(buildDir, "nested"), { recursive: true });
  fs.writeFileSync(path.join(buildDir, "approval.json"), "before-approval\n");
  fs.writeFileSync(path.join(buildDir, "nested", "tracked.json"), "before-tracked\n");

  const snapshot = snapshotDirectory(buildDir);

  fs.writeFileSync(path.join(buildDir, "approval.json"), "after-approval\n");
  fs.rmSync(path.join(buildDir, "nested"), { recursive: true, force: true });
  fs.writeFileSync(path.join(buildDir, "new-artifact.json"), "generated\n");

  restoreDirectory(buildDir, snapshot);

  assert.equal(fs.readFileSync(path.join(buildDir, "approval.json"), "utf8"), "before-approval\n");
  assert.equal(fs.readFileSync(path.join(buildDir, "nested", "tracked.json"), "utf8"), "before-tracked\n");
  assert.equal(fs.existsSync(path.join(buildDir, "new-artifact.json")), false);
  fs.rmSync(root, { recursive: true, force: true });
});

test("build cleanup removes a directory that did not exist before the run", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sloanalytica-build-empty-"));
  const buildDir = path.join(root, "build", "NEW_MACHINE");
  const snapshot = snapshotDirectory(buildDir);
  assert.equal(snapshot, null);

  fs.mkdirSync(buildDir, { recursive: true });
  fs.writeFileSync(path.join(buildDir, "generated.json"), "generated\n");
  restoreDirectory(buildDir, snapshot);

  assert.equal(fs.existsSync(buildDir), false);
  fs.rmSync(root, { recursive: true, force: true });
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

test("atomic batch regression: scope guard runs before any publish mutation", () => {
  const source = fs.readFileSync(path.join(ROOT, "tools", "batch-publish-pipeline.mjs"), "utf8");
  const guardPos = source.indexOf("verifyBatchMachineScope(ids);");
  const snapshotPos = source.indexOf("const snap = snapshotBatch(ids);");
  const loopPos = source.indexOf("for (const id of ids) publishOne(id, parsed.apply);");

  assert.notEqual(guardPos, -1, "batch scope guard must exist");
  assert.ok(snapshotPos > guardPos, "scope guard must run before batch snapshots and mutations");
  assert.ok(loopPos > snapshotPos, "publish loop must run after the scope guard");
});

test("atomic batch regression: default cleanup restores build snapshots instead of deleting build dirs", () => {
  const source = fs.readFileSync(path.join(ROOT, "tools", "batch-publish-pipeline.mjs"), "utf8");
  assert.match(source, /const buildSnapshots = snapshotBuild\(ids\);/);
  assert.match(source, /if \(!parsed\.keepBuild\) restoreBuild\(ids, buildSnapshots\);/);
  assert.doesNotMatch(source, /function cleanupBuild\(/, "destructive build-directory cleanup must not return");
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
