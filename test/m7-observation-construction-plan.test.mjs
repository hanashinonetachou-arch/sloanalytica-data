import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditObservationConstructionPlan, BASE_HEAD, CONSTRUCTION_PATTERNS } from "../tools/audit-m7-observation-construction-plan.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const report=auditObservationConstructionPlan(root);

test("controlled lineage population remains exact 238 = 10 + 228",()=>{
  assert.equal(report.summary.controlledLineageGroupCount,238);
  assert.equal(report.summary.uniqueCandidateCount,10);
  assert.equal(report.summary.noCandidateCount,228);
  assert.equal(report.summary.uniqueCandidateCount+report.summary.noCandidateCount,238);
});

test("group identities are unique",()=>{
  const rows=[...report.uniqueCandidateReview,...report.noCandidateConstructionPlan];
  const keys=rows.map(r=>`${r.machineId}/${r.groupId}`);
  assert.equal(new Set(keys).size,238);
});

test("unique candidates preserve topology and never auto-formalize",()=>{
  for (const r of report.uniqueCandidateReview) {
    assert.equal(r.observationTopology,"EXISTING_UNIQUE_OBSERVATION_CANDIDATE");
    assert.equal(r.candidateObservationIds.length,1);
    assert.equal(r.formalProofEstablished,false);
  }
});

test("no-candidate rows preserve topology",()=>{
  for (const r of report.noCandidateConstructionPlan) {
    assert.equal(r.observationTopology,"NO_EXISTING_OBSERVATION_CANDIDATE");
    assert.equal(r.candidateObservationIds.length,0);
    assert.equal(r.formalProofEstablished,false);
    assert.ok(CONSTRUCTION_PATTERNS.includes(r.constructionPattern));
  }
});

test("labels/categories/names are explicitly non-proof",()=>{
  assert.match(report.policy.labelCategoryRule,/never proof/i);
  assert.match(report.policy.classificationRule,/planning aids only/i);
});

test("audit establishes no formal proof",()=>{
  assert.equal(report.summary.formalProofEstablishedCount,0);
});

test("known mismatch/redesign rows are not absorbed into controlled population",()=>{
  const keys=new Set([...report.uniqueCandidateReview,...report.noCandidateConstructionPlan].map(r=>`${r.machineId}/${r.groupId}`));
  for (const key of ["L_ASLOT_KONOSUBA_FX/KONOSUBA_BIG_END","L_SISTER_QUEST_CA/SMARTALK","S_TOARU_RAILGUN_FB/SETTING_EVIDENCE"]) assert.equal(keys.has(key),false);
});

test("plan is deterministic",()=>{
  assert.deepEqual(auditObservationConstructionPlan(root),report);
});

test("base is the PR #298 integrated prototype head",()=>{
  assert.equal(BASE_HEAD,"c9ca6a016599e931175065e3311f7b4116cf7632");
});

test("policy forbids production mutation and real-device claims",()=>{
  assert.match(report.policy.scope,/no production/i);
  assert.match(report.policy.realDevice,/No real-device verification is claimed/i);
});
