import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const manifestArg = args.find((x) => !x.startsWith("--"));
const manifestPath = manifestArg ?? "reports/v64-linked-service-audit-batch.json";
const allowedStatuses = new Set(["FOUND", "CHECKED_NONE", "UNRESOLVED"]);

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exitCode = 1;
}

function stable(value) {
  return JSON.stringify(value);
}

function sourceKey(source) {
  return source.sourceId ?? `${source.publisher ?? ""}\u0000${source.title ?? ""}\u0000${source.url ?? ""}`;
}

if (!fs.existsSync(manifestPath)) {
  fail(`manifest not found: ${manifestPath}`);
} else {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const entries = Array.isArray(manifest.entries) ? manifest.entries : [];
  if (entries.length === 0) fail("manifest.entries is empty");

  const seen = new Set();
  let changedFiles = 0;

  for (const entry of entries) {
    const machineId = entry.machineId;
    if (!machineId || seen.has(machineId)) {
      fail(`duplicate or missing machineId: ${machineId ?? "<missing>"}`);
      continue;
    }
    seen.add(machineId);

    if (!allowedStatuses.has(entry.linkedService)) {
      fail(`${machineId}: invalid linkedService ${entry.linkedService}`);
      continue;
    }

    const filePath = path.join("research", machineId, "machine-observation-data.json");
    if (!fs.existsSync(filePath)) {
      fail(`${machineId}: observation file not found: ${filePath}`);
      continue;
    }

    const beforeText = fs.readFileSync(filePath, "utf8");
    const before = JSON.parse(beforeText);
    const after = structuredClone(before);

    if (after.machineId !== machineId) {
      fail(`${machineId}: machineId mismatch in observation file`);
      continue;
    }
    if (!after.sourceCoverage || typeof after.sourceCoverage !== "object") {
      fail(`${machineId}: sourceCoverage missing`);
      continue;
    }

    const current = after.sourceCoverage.linkedService;
    if (entry.expectedCurrent && current !== entry.expectedCurrent && current !== entry.linkedService) {
      fail(`${machineId}: expected linkedService=${entry.expectedCurrent} or already-applied ${entry.linkedService}, found ${current}`);
      continue;
    }
    if (current !== "UNRESOLVED" && current !== entry.linkedService) {
      fail(`${machineId}: refusing transition ${current} -> ${entry.linkedService}`);
      continue;
    }

    const sources = Array.isArray(after.sources) ? after.sources : [];
    const sourceMap = new Map(sources.map((source) => [sourceKey(source), source]));
    for (const source of entry.sources ?? []) {
      if (!source || !source.url || !source.title || !source.publisher || !source.sourceType) {
        fail(`${machineId}: source requires publisher/title/url/sourceType`);
        continue;
      }
      const key = sourceKey(source);
      if (!sourceMap.has(key)) {
        sources.push(source);
        sourceMap.set(key, source);
      }
    }
    after.sources = sources;
    after.sourceCoverage.linkedService = entry.linkedService;

    const protectedChecks = [
      ["observations", before.observations, after.observations],
      ["featureMappings", before.featureMappings, after.featureMappings],
      ["fieldVerificationItems", before.fieldVerificationItems, after.fieldVerificationItems],
      ["machineId", before.machineId, after.machineId],
      ["displayName", before.displayName, after.displayName],
      ["releaseDate", before.releaseDate, after.releaseDate],
    ];
    for (const [label, left, right] of protectedChecks) {
      if (stable(left) !== stable(right)) {
        fail(`${machineId}: protected section changed: ${label}`);
      }
    }

    for (const [surface, value] of Object.entries(before.sourceCoverage)) {
      if (surface !== "linkedService" && after.sourceCoverage[surface] !== value) {
        fail(`${machineId}: sourceCoverage.${surface} changed unexpectedly`);
      }
    }

    const changed = stable(before) !== stable(after);
    console.log(`${changed ? "CHANGE" : "NOOP"} ${machineId}: ${current} -> ${entry.linkedService} (+${sources.length - (before.sources?.length ?? 0)} sources)`);
    if (changed && apply && process.exitCode !== 1) {
      fs.writeFileSync(filePath, `${JSON.stringify(after, null, 2)}\n`);
      changedFiles++;
    } else if (changed) {
      changedFiles++;
    }
  }

  if (process.exitCode !== 1) {
    console.log(`${apply ? "APPLIED" : "DRY-RUN"}: ${changedFiles} file(s) would change`);
    if (!apply) console.log("Re-run with --apply to write changes.");
  }
}
