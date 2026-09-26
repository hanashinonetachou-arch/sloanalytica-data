import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const manifest=fs.readFileSync(new URL("../docs/SloAnalytica-Reproducible-Machine-Research-UX-Manifest-v8.md",import.meta.url),"utf8");

test("Manifest v8.4 normatively locks Runtime Policy responsibility boundaries",()=>{
  const required=[
    "RTP-001:","RTP-002:","RTP-003:","RTP-004:","RTP-005:","RTP-006:","RTP-007:",
    "RTP-008:","RTP-009:","RTP-010:","RTP-011:","RTP-012:","RTP-013:","RTP-014:",
    "ACTIVE / THRESHOLD_MET",
    "INACTIVE / THRESHOLD_NOT_MET",
    "INACTIVE / INELIGIBLE",
    "INACTIVE / RUNTIME_POLICY_BINDING_MISMATCH",
    "INACTIVE / EVALUATION_UNAVAILABLE",
    "ACTIVE / NOT_THRESHOLD_CONTROLLED",
    "ACTIVE / NO_RUNTIME_THRESHOLD",
    "A Runtime Policy threshold change MUST NOT require Selection to be re-run",
    "MUST NOT directly edit Canonical UI",
    "Evidence is an independent contract",
    "MUST NOT publish different bytes under an already-published package version"
  ];
  for(const token of required) assert.ok(manifest.includes(token),token);
});

test("Manifest v8.4 requires reversible generic Runtime Policy regression",()=>{
  assert.match(manifest,/ACTIVE -> INACTIVE -> ACTIVE/);
  assert.match(manifest,/same preserved Candidate Contract/);
  assert.match(manifest,/Machine-specific integration fixtures MAY supplement but MUST NOT replace this generic contract/);
});
