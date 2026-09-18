import test from "node:test";
import assert from "node:assert/strict";
import { proveFeatureEvidenceNonSharing } from "../tools/lib/feature-evidence-sharing-proof.mjs";

const base = () => ({
  selection: {
    features: [{
      featureId: "FEAT_AT",
      adoptionCategory: "INCLUDE_PRIMARY",
      numeratorInputId: "INP_AT",
      denominatorInputId: "INP_GAMES"
    }],
    evidenceUi: {
      groups: [{
        groupId: "TROPHY",
        options: [{ value: "GOLD", sourceEvidenceIds: ["EV_GOLD"] }]
      }]
    }
  },
  observation: {
    observations: [
      { observationId: "OBS_AT" },
      { observationId: "OBS_GAMES" },
      { observationId: "OBS_EVI_TROPHY" }
    ],
    featureMappings: [{
      featureId: "FEAT_AT",
      observationIds: ["OBS_AT", "OBS_GAMES"]
    }]
  },
  ui: {
    inputContracts: {
      INP_AT: {},
      INP_GAMES: {}
    },
    evidenceContracts: {
      EVI_UI_TROPHY: {
        sourceEvidenceGroupId: "TROPHY",
        inheritOptions: true
      }
    }
  }
});

test("proves NONE only when Feature and Evidence are formally isolated", () => {
  const x = base();
  const result = proveFeatureEvidenceNonSharing(x.selection, x.observation, x.ui);
  assert.equal(result.status, "PASS");
  assert.equal(result.featureSharing, "NONE");
  assert.deepEqual(result.sharedFeatureIds, []);
  assert.equal(result.groups[0].evidenceObservationId, "OBS_EVI_TROPHY");
});

test("fails when a Feature mapping consumes the Evidence Observation", () => {
  const x = base();
  x.observation.featureMappings[0].observationIds.push("OBS_EVI_TROPHY");
  const result = proveFeatureEvidenceNonSharing(x.selection, x.observation, x.ui);
  assert.equal(result.status, "FAIL");
  assert.match(result.detail, /consumed by Feature mapping/);
});

test("fails when a Feature owns the canonical Evidence input", () => {
  const x = base();
  x.selection.features[0].numeratorInputId = "INP_EVI_TROPHY";
  const result = proveFeatureEvidenceNonSharing(x.selection, x.observation, x.ui);
  assert.equal(result.status, "FAIL");
  assert.match(result.detail, /owned by Feature/);
});

test("reviews when canonical Evidence linkage is missing", () => {
  const x = base();
  x.ui.evidenceContracts = {};
  const result = proveFeatureEvidenceNonSharing(x.selection, x.observation, x.ui);
  assert.equal(result.status, "REVIEW");
  assert.match(result.detail, /canonical Evidence contract/);
});

test("reviews when Evidence is also represented as a Feature inputContract", () => {
  const x = base();
  x.ui.inputContracts.INP_EVI_TROPHY = {};
  const result = proveFeatureEvidenceNonSharing(x.selection, x.observation, x.ui);
  assert.equal(result.status, "REVIEW");
  assert.match(result.detail, /Feature inputContract/);
});
