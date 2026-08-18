import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = path.join(ROOT, "catalog.json");
const DIFFICULTY_CATALOG = path.join(ROOT, "difficulty-catalog.json");
const MAX_BATCH = 10;

export function validMachineId(id) {
  return typeof id === "string" && /^[A-Z0-9_]+$/.test(id);
}

export function normalizeMachineIds(ids) {
  const out = [];
  const seen = new Set();
  for (const raw of ids) {
    const id = String(raw ?? "").trim();
    if (!id || seen.has(id)) continue;
    if (!validMachineId(id)) throw new Error(`invalid machineId: ${id}`);
    seen.add(id);
    out.push(id);
  }
  if (!out.length) throw new Error("machineIdを1件以上指定してください。");
  if (out.length > MAX_BATCH) throw new Error(`1バッチは最大${MAX_BATCH}機種です。`);
  return out;
}

export function parseArgs(argv) {
  const args = [...argv];
  const apply = args.includes("--apply");
  const keepBuild = args.includes("--keep-build");
  const fileIndex = args.indexOf("--file");
  let file = null;
  if (fileIndex >= 0) {
    file = args[fileIndex + 1];
    if (!file) throw new Error("--file のパスを指定してください。");
    args.splice(fileIndex, 2);
  }
  const ids = args.filter(a => !a.startsWith("--"));
  return { apply, keepBuild, file, ids };
}

function readMachineIdsFromFile(file) {
  const p = path.resolve(file);
  if (!fs.existsSync(p)) throw new Error(`batch file not found: ${p}`);
  const raw = fs.readFileSync(p, "utf8");
  if (p.toLowerCase().endsWith(".json")) {
    const value = JSON.parse(raw);
    if (Array.isArray(value)) return value;
    if (Array.isArray(value.machineIds)) return value.machineIds;
    throw new Error("JSON batch file must be an array or { machineIds: [] }.");
  }
  return raw.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
}

function run(command, args, { allowFailure = false } = {}) {
  const r = spawnSync(command, args, { cwd: ROOT, encoding: "utf8", stdio: "pipe" });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  if (!allowFailure && r.status !== 0) {
    throw new Error(`${path.basename(command)} ${args.join(" ")} failed with exit ${r.status}`);
  }
  return r;
}

function runNode(script, args = []) {
  return run(process.execPath, [path.join(ROOT, "tools", script), ...args]);
}

function runNpm(args) {
  const command = process.platform === "win32" ? "npm.cmd" : "npm";
  return run(command, args);
}

function snapshotFile(p) {
  return fs.existsSync(p) ? fs.readFileSync(p) : null;
}

function restoreFile(p, bytes) {
  if (bytes === null) {
    if (fs.existsSync(p)) fs.rmSync(p, { force: true });
    return;
  }
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, bytes);
}

function cleanupBuild(ids) {
  for (const id of ids) {
    const p = path.join(ROOT, "build", id);
    if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
  }
}

function snapshotBatch(ids) {
  return {
    catalog: snapshotFile(CATALOG),
    difficultyCatalog: snapshotFile(DIFFICULTY_CATALOG),
    machines: new Map(ids.map(id => {
      const p = path.join(ROOT, "machines", id, "machine-package.json");
      return [id, snapshotFile(p)];
    })),
  };
}

function rollbackBatch(ids, snap) {
  restoreFile(CATALOG, snap.catalog);
  restoreFile(DIFFICULTY_CATALOG, snap.difficultyCatalog);
  for (const id of ids) {
    restoreFile(path.join(ROOT, "machines", id, "machine-package.json"), snap.machines.get(id) ?? null);
  }
}

function verifySources(ids) {
  for (const id of ids) {
    const source = path.join(ROOT, "machines", id, "machine-package.json");
    const difficulty = path.join(ROOT, "research", id, "difficulty-report.json");
    if (!fs.existsSync(source)) throw new Error(`${id}: machine-package.json not found`);
    if (!fs.existsSync(difficulty)) throw new Error(`${id}: difficulty-report.json not found`);
    const pkg = JSON.parse(fs.readFileSync(source, "utf8"));
    if (pkg.machine?.machineId !== id) throw new Error(`${id}: machine-package machineId mismatch`);
  }
}

function publishOne(id, apply) {
  const source = path.join("machines", id, "machine-package.json");
  console.log(`\n=== ${id} ===`);
  runNode("publish-machine-data.mjs", ["approve", id, source]);
  runNode("publish-machine-data.mjs", ["publish", id]);
  if (apply) {
    runNode("publish-machine-data.mjs", ["publish", id, "--apply"]);
    runNode("sync-machine-difficulty-catalog.mjs", [id]);
  }
}

function repositoryChecks() {
  console.log("\n=== REPOSITORY CHECKS (ONCE PER BATCH) ===");
  runNpm(["test"]);
  runNpm(["run", "audit"]);
  runNpm(["run", "audit:ui-service-names"]);
}

export function help() {
  console.log(`SloAnalytica Batch Publish Pipeline v1
Usage:
  npm run machine:publish:batch -- MACHINE_ID_1 MACHINE_ID_2
  npm run machine:publish:batch -- --file batch.txt
  npm run machine:publish:batch -- --apply MACHINE_ID_1 MACHINE_ID_2

Default:
  DRY RUN. approve + per-machine publish dry-run only. Tracked public data is not changed.

--apply:
  Up to 10 machines are published as one atomic batch:
  approve -> dry-run -> publish apply -> Difficulty sync (per machine)
  -> repository tests/audit/service-name audit (once per batch).
  Any failure restores catalog.json, difficulty-catalog.json and all target machine packages
  to their pre-batch bytes.

Safety:
  - Maximum 10 unique machineIds.
  - Existing single-machine fixed-SHA approval/publish contract is reused.
  - build/<MACHINE_ID>/ approval artifacts are removed by default after the run.
  - Publish approval is still explicit: --apply is required for tracked public-data mutation.
  - Use --keep-build only when approval artifacts are needed for debugging.`);
}

export function main(argv = process.argv.slice(2)) {
  if (!argv.length || argv.includes("--help") || argv.includes("help")) {
    help();
    return;
  }
  const parsed = parseArgs(argv);
  const fromFile = parsed.file ? readMachineIdsFromFile(parsed.file) : [];
  const ids = normalizeMachineIds([...fromFile, ...parsed.ids]);
  verifySources(ids);
  const snap = snapshotBatch(ids);
  const mode = parsed.apply ? "APPLY" : "DRY_RUN";
  console.log(`BATCH PUBLISH START: ${ids.length} machines / mode=${mode}`);
  try {
    for (const id of ids) publishOne(id, parsed.apply);
    if (parsed.apply) repositoryChecks();
    console.log(`\nBATCH PUBLISH PASS: ${ids.length} machines / mode=${mode}`);
  } catch (e) {
    if (parsed.apply) {
      rollbackBatch(ids, snap);
      console.error("BATCH ROLLBACK: restored catalog, difficulty catalog and machine packages");
    }
    throw e;
  } finally {
    if (!parsed.keepBuild) cleanupBuild(ids);
  }
}

const invoked = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (invoked) {
  try {
    main();
  } catch (e) {
    console.error(`ERROR: ${e.message ?? e}`);
    process.exit(1);
  }
}
