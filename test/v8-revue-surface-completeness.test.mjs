import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const base = new URL("../repro-v8/S_REVUE_STARLIGHT_CX/", import.meta.url);

test("Revue research surface completeness: known setting hints cannot bypass numeric-distribution review", () => {
  const blind = JSON.parse(fs.readFileSync(new URL("phase7-blind-research.json", base), "utf8"));
  const numericNames = new Set((blind.freshResearchSnapshot?.numericCandidates ?? []).map(x => x.name));
  const suggestionOnly = blind.freshResearchSnapshot?.suggestionOnlyCandidates ?? [];

  assert.ok(
    !suggestionOnly.includes("bonus end weak/strong high-setting hints") ||
      numericNames.has("BIG-end default/weak/strong distribution"),
    "BIG-end weak/strong hints were discovered but their published setting-specific distribution never entered the Numeric candidate universe"
  );
});

test("Revue surface completeness keeps Numeric and Hard Evidence paths separate on the same BIG-end surface", () => {
  const blind = JSON.parse(fs.readFileSync(new URL("phase7-blind-research.json", base), "utf8"));
  const numericNames = new Set((blind.freshResearchSnapshot?.numericCandidates ?? []).map(x => x.name));
  const evidence = blind.freshResearchSnapshot?.hardEvidenceCandidates ?? [];

  assert.ok(numericNames.has("BIG-end default/weak/strong distribution"));
  assert.ok(evidence.some(x => x.context === "bonusEndScreen"));
});
