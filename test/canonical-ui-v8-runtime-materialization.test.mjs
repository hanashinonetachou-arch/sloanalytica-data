import test from "node:test";
import assert from "node:assert/strict";
import { materializeCanonicalUiV8, assertCanonicalRuntimeUiEquality } from "../tools/materialize-canonical-ui-v8-runtime.mjs";

const canonicalFixture = {
  schemaVersion: "canonical-ui-v8",
  machineId: "FIXTURE_GENERIC_V8",
  accordion: { enabled: true, singleOpen: true },
  sections: [
    {
      id: "SEC_NUMERIC",
      title: "通常時",
      collapsible: true,
      defaultExpanded: false,
      items: [{
        id: "ITEM_NUMERIC",
        title: "通常時",
        inputs: [{
          id: "INP_GAMES",
          label: "通常時ゲーム数",
          type: "number",
          directNumeric: true,
          quickAdd: [50],
          gridSpan: 12,
          unobservedDisplay: "—"
        }]
      }]
    },
    {
      id: "SEC_EVIDENCE",
      title: "終了画面",
      collapsible: true,
      defaultExpanded: false,
      items: [{
        id: "ITEM_EVIDENCE",
        title: "終了画面",
        interaction: {
          type: "CATEGORY_COUNTERS",
          totalOpportunities: "SEPARATE_COUNTER",
          categories: [{ id: "CAT_A", label: "パターンA" }]
        }
      }]
    },
    {
      id: "SEC_SUMMARY",
      title: "この機種の設定推測について",
      collapsible: true,
      defaultExpanded: false
    }
  ],
  layoutRules: { columns: 2, denominatorsFullWidth: true, multipleQuickAddForcesFullWidth: true, oddEligibleLeavesEmptyCell: true, noInferenceRoleHeadings: true, noGenericEditButton: true, sectionHeaderIsToggle: true, explanationIndependentFromSection: true },
  inputState: { unobserved: null, observedZero: 0, unobservedDisplay: "—", resetVisibleOnlyAfterValue: true },
  assertions: ["single-open accordion","large denominators direct numeric","UNOBSERVED distinct from OBSERVED_ZERO","no duplicated primary labels","summary renders high-low/adopted/rejected/unresolved in fixed order","Evidence category counters accumulate rather than overwrite"],
  quickInput: { enabled: false },
  previewCheckpoint: { repeatedEntryDemonstrationRequired: true, unobservedVsZeroDemonstrationRequired: true, directDenominatorEntryDemonstrationRequired: true, summaryRenderingRequired: true, singleOpenDemonstrationRequired: true, independentDescriptionDemonstrationRequired: true }
};

test("v8 runtime UI is a lossless canonical translation",()=>{
  const r=materializeCanonicalUiV8(canonicalFixture);
  assert.equal(r.source,"CANONICAL_UI");
  assert.equal(r.accordion.singleOpen,true);
  assert.equal(r.sections[0].items[0].inputs[0].label,"通常時ゲーム数");
  assert.equal(r.sections[0].items[0].inputs[0].directNumeric,true);
  assert.deepEqual(r.sections[0].items[0].inputs[0].quickAdd,[50]);
  assert.equal(r.sections[0].items[0].inputs[0].unobservedDisplay,"—");
  assert.equal(r.sections[1].items[0].interaction.type,"CATEGORY_COUNTERS");
  assert.equal(r.sections[1].items[0].interaction.totalOpportunities,"SEPARATE_COUNTER");
  assertCanonicalRuntimeUiEquality(canonicalFixture,r);
});

test("runtime mutation fails semantic equality",()=>{
  const r=materializeCanonicalUiV8(canonicalFixture);
  r.sections[0].items[0].inputs[0].label="母数";
  assert.throws(()=>assertCanonicalRuntimeUiEquality(canonicalFixture,r));
});
