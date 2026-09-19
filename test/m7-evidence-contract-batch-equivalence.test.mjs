import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { legacyProjection, stable, VERSION } from "../tools/lib/evidence-contract-m7.mjs";

const ids = [
  "L_AKAME_GA_KILL_2",
  "L_BOUNTY_ANGEL",
  "L_GIRLS_UND_PANZER_FINALE_H1",
  "L_GOD_EATER_RESURRECTION",
  "L_KAMEN_RIDER_7RIDERS_UJA",
  "L_ULTRAMAN_TIGA_KA",
  "S_FIRE_DRIFT",
  "S_KABANERI_ZR"
];

const read = p => JSON.parse(fs.readFileSync(p, "utf8"));
const evidenceSemantics = item => ({
  inputId: item.inputId,
  triggerValue: item.triggerValue,
  confirmedSettings: item.confirmedSettings,
  deniedSettings: item.deniedSettings,
  sourceResearchEvidenceIds: item.sourceResearchEvidenceIds
});
const stripEvidenceMigration = value => {
  const cloned = structuredClone(value);
  delete cloned.evidenceUi;
  delete cloned.evidenceContract;
  return cloned;
};

test("canonical UI batch preserves legacy Evidence semantics and non-Evidence Selection fields", () => {
  let totalEvidence = 0;

  for (const id of ids) {
    const legacy = read(`test/fixtures/evidence-contract-m7/${id}-selection-legacy.json`);
    const current = read(`research/${id}/selection-data.json`);

    assert.equal(current.evidenceContract?.contractVersion, VERSION, `${id}: M7 contract version`);
    assert.equal(current.evidenceUi, undefined, `${id}: legacy evidenceUi removed`);

    const before = legacyProjection(legacy).items.map(evidenceSemantics);
    const after = (current.evidenceContract?.items ?? []).map(evidenceSemantics);

    assert.deepEqual(stable(after), stable(before), `${id}: Evidence semantics changed`);
    assert.deepEqual(
      stripEvidenceMigration(current),
      stripEvidenceMigration(legacy),
      `${id}: non-Evidence Selection fields changed`
    );

    totalEvidence += after.length;
  }

  assert.equal(totalEvidence, 58);
});

const normalizationBatchIds = [
  "L_BIRDIE_WING_BC","L_DARK_HAIBI_SB","L_LOTIS_TN","L_NANGOKU_SPECIAL_M1",
  "L_SENGOKU_COLLECTION6_KS","L_TOARU_INDEX2_FA","L_TONDEMO_SKILL_KM",
  "L_ULTRAMAN_FINAL_BATTLE_ME","L_WORLD_DAI_STAR_PA3","L_YAJIKITA_MAIRU_BG"
];

test("normalization batch preserves legacy Evidence semantics and non-Evidence Selection fields", () => {
  let totalEvidence = 0;
  for (const id of normalizationBatchIds) {
    const legacy = read(`test/fixtures/evidence-contract-m7/${id}-selection-legacy.json`);
    const current = read(`research/${id}/selection-data.json`);
    assert.equal(current.evidenceContract?.contractVersion, VERSION, `${id}: M7 contract version`);
    assert.equal(current.evidenceUi, undefined, `${id}: legacy evidenceUi removed`);
    const before = legacyProjection(legacy).items.map(evidenceSemantics);
    const after = (current.evidenceContract?.items ?? []).map(evidenceSemantics);
    assert.deepEqual(stable(after), stable(before), `${id}: Evidence semantics changed`);
    assert.deepEqual(stripEvidenceMigration(current), stripEvidenceMigration(legacy), `${id}: non-Evidence Selection fields changed`);
    totalEvidence += after.length;
  }
  assert.equal(totalEvidence, 66);
});


test("Madoka Forte migration preserves legacy Evidence semantics and non-Evidence Selection fields", () => {
  const id = "L_MADOKA_FORTE_UU";
  const legacy = read(`test/fixtures/evidence-contract-m7/${id}-selection-legacy.json`);
  const current = read(`research/${id}/selection-data.json`);
  assert.equal(current.evidenceContract?.contractVersion, VERSION, `${id}: M7 contract version`);
  assert.equal(current.evidenceUi, undefined, `${id}: legacy evidenceUi removed`);
  const before = legacyProjection(legacy).items.map(evidenceSemantics);
  const after = (current.evidenceContract?.items ?? []).map(evidenceSemantics);
  assert.deepEqual(stable(after), stable(before), `${id}: Evidence semantics changed`);
  assert.deepEqual(stripEvidenceMigration(current), stripEvidenceMigration(legacy), `${id}: non-Evidence Selection fields changed`);
  assert.equal(after.length, 10);
});
