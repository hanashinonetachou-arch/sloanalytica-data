#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const BASE_HEAD = "f02e7fca2fb35dc2e7f6ad303dbc7f23dd7b6fb9";
export const EXPECTED_GROUP_COUNT = 447;
export const OUTPUT_PATH = "audit-inputs/m7-phase2-2-observation-contract-completion-population-20260916.json";

function git(root, args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024
  });
}

function readAtCommit(root, repoPath) {
  return JSON.parse(git(root, ["show", `${BASE_HEAD}:${repoPath}`]));
}

export function buildHistoricalPopulation(root) {
  const paths = git(root, ["ls-tree", "-r", "--name-only", BASE_HEAD, "research"])
    .split(/\r?\n/)
    .filter(Boolean);
  const pathSet = new Set(paths);
  const selectionPaths = paths
    .filter(repoPath => /^research\/[^/]+\/selection-data\.json$/.test(repoPath))
    .sort();

  const groups = [];
  for (const selectionPath of selectionPaths) {
    const machineId = selectionPath.split("/")[1];
    const dir = `research/${machineId}`;
    if (!pathSet.has(`${dir}/research-data.json`) || !pathSet.has(`${dir}/machine-observation-data.json`)) continue;

    const selection = readAtCommit(root, selectionPath);
    for (const group of selection.evidenceUi?.groups ?? []) {
      groups.push({ machineId, group });
    }
  }

  groups.sort((a, b) => a.machineId.localeCompare(b.machineId) || a.group.groupId.localeCompare(b.group.groupId));
  const keys = groups.map(item => `${item.machineId}/${item.group.groupId}`);
  if (new Set(keys).size !== keys.length) throw new Error("HISTORICAL_POPULATION_DUPLICATE_MACHINE_GROUP");
  if (groups.length !== EXPECTED_GROUP_COUNT) {
    throw new Error(`HISTORICAL_POPULATION_COUNT_MISMATCH: expected ${EXPECTED_GROUP_COUNT}, got ${groups.length}`);
  }

  return {
    schemaVersion: "m7-phase2.2-observation-contract-completion-population-v1",
    sourceBaseHead: BASE_HEAD,
    groupCount: groups.length,
    groups
  };
}

export function writeHistoricalPopulation(root) {
  const population = buildHistoricalPopulation(root);
  const output = path.join(root, OUTPUT_PATH);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(population, null, 2)}\n`);
  return output;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath && fileURLToPath(import.meta.url) === invokedPath) {
  const root = process.cwd();
  const output = writeHistoricalPopulation(root);
  console.log(`WROTE ${EXPECTED_GROUP_COUNT} historical Evidence groups -> ${path.relative(root, output)}`);
}
