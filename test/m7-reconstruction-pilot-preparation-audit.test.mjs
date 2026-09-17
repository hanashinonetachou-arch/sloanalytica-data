import test from "node:test";
import assert from "node:assert/strict";
import { buildReport, markdownReport } from "../tools/audit-m7-reconstruction-pilot-preparation.mjs";

const machine = (machineId, classification="ALREADY_M7", overrides={}) => ({
  machineId, classification, migrationDisposition:"X", blockReasons:[],
  observationProof:{status:"PASS"}, canonicalUiProof:{status:"PASS"},
  normalizationProof:{status:"PASS"}, selectionQualityProof:{status:"PASS"}, ...overrides
});
const route = (machineId, overrides={}) => ({
  machineId, deficitCount:0, semantic:{fourLayerUnresolved:false,fieldVerificationWaiting:false},
  downstream:{verificationStatus:null}, ...overrides
});

test("complete one-to-one join succeeds", () => {
  const r=buildReport({machines:[machine("A")]},{machines:[route("A")]});
  assert.equal(r.summary.joinedCount,1);
});
test("missing route ID fails closed", () => {
  assert.throws(()=>buildReport({machines:[machine("A")]},{machines:[]}),/one-to-one join failed/);
});
test("duplicate ID fails closed", () => {
  assert.throws(()=>buildReport({machines:[machine("A"),machine("A")]},{machines:[route("A")]}),/duplicate machineId/);
});
test("route deficit zero does not imply M7 readiness", () => {
  const r=buildReport({machines:[machine("A","OBSERVATION_BLOCKED")]},{machines:[route("A")]});
  assert.equal(r.summary.deficitZeroButM7BlockedCount,1);
});
test("supplemental contradictions remain visible", () => {
  const full={machines:[machine("A","ALREADY_M7"),machine("B","NORMALIZATION_BLOCKED")]};
  const rr={machines:[route("A",{semantic:{fourLayerUnresolved:true,fieldVerificationWaiting:true}}),route("B")]};
  const r=buildReport(full,rr);
  assert.equal(r.summary.alreadyM7WithSupplementalHoldCount,1);
  assert.equal(r.summary.normalizationBlockedWithoutSupplementalSignalCount,1);
});
test("pilot role drift is fail-closed data", () => {
  const ids=["L_EVANGELION_MIRAI_JF","S_BOOWY_SV","L_ANOTHER_RINO_HEAVEN_CC","L_ANIMAL_SLOT_DOCCHI_ZT","L_AZURLANE_THE_ANIMATION_KN"];
  const full={machines:ids.map(id=>machine(id,"OTHER_BLOCKED"))};
  const rr={machines:ids.map(id=>route(id))};
  const r=buildReport(full,rr);
  assert.ok(r.summary.pilotRoleDriftCount>0);
});
test("markdown is deterministic", () => {
  const r=buildReport({machines:[machine("A")]},{machines:[route("A")]});
  assert.equal(markdownReport(r),markdownReport(r));
});
