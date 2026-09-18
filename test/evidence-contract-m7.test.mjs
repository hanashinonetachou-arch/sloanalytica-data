import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";import {legacyProjection,assertNoDuplicates,resolveHistoricalEvidenceGroup} from "../tools/lib/evidence-contract-m7.mjs";import {buildMachineData} from "../tools/build-machine-data.mjs";import {compileEvidenceContract} from "../tools/migrate-selection-evidence-contract.mjs";
test("legacy projection preserves IDs, values and unset defaults",()=>{const p=legacyProjection({evidenceUi:{groups:[{groupId:"G",label:"G",selectionMode:"multi",options:[{value:"V",label:"V",allowedSettings:["SET_2"],sourceEvidenceIds:["RE"]}]}]}});assert.equal(p.inputs[0].id,"INP_EVI_G");assert.equal(p.inputs[0].type,"multi_enum");assert.equal(p.items[0].triggerValue,"V");});
test("semantic duplicates fail closed",()=>{const e={evidenceId:"A",sourceResearchEvidenceIds:["RE"],inputId:"I",triggerValue:"V",confirmedSettings:["S"],deniedSettings:[],settingFloorSemantics:"EXACT_ALLOWED_SETTINGS"};assert.throws(()=>assertNoDuplicates([e,{...e,evidenceId:"B"}]),/DUPLICATE_SEMANTIC/);});
test("Hanabi before and after runtime projections are byte-equivalent",()=>{const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));const research=read("../research/L_HANABI_KM/research-data.json"),legacy=read("fixtures/evidence-contract-m7/L_HANABI_KM-selection-legacy.json"),migrated=read("../research/L_HANABI_KM/selection-data.json"),stats=read("../research/L_HANABI_KM/statistics-report.json");assert.deepEqual(buildMachineData(research,migrated,stats),buildMachineData(research,legacy,stats));});
test("v2 plus legacy groups cannot materialize simultaneously",()=>{const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));const research=read("../research/L_HANABI_KM/research-data.json"),migrated=read("../research/L_HANABI_KM/selection-data.json");migrated.evidenceUi={groups:[{groupId:"DUP",options:[]}]};assert.throws(()=>buildMachineData(research,migrated),/atomic cutover/);});
const migrationFixture=()=>{const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));return{selection:read("fixtures/evidence-contract-m7/L_HANABI_KM-selection-legacy.json"),research:read("../research/L_HANABI_KM/research-data.json"),observation:read("../research/L_HANABI_KM/machine-observation-data.json"),ui:read("../research/L_HANABI_KM/ui-design-data.json"),specification:read("../migration-specs/evidence-contract-m7/L_HANABI_KM.json")};};
for(const [name,mutate,pattern] of [["missing normalization proof",x=>delete x.specification.items[0].normalizationSemantics,/normalizationSemantics proof missing/],["missing setting-floor proof",x=>delete x.specification.items[0].settingFloorSemantics,/settingFloorSemantics proof missing/],["ambiguous Observation proof",x=>x.specification.items[0].observationIds.push("OBS_BONUS_OUTCOME"),/Observation mapping is not unique/],["ambiguous canonical UI placement",x=>x.ui.sections.DUPLICATE={inputIds:["INP_EVI_HANABI_REG_END"]},/canonical UI placement is not unique/],["unproven Feature sharing",x=>delete x.specification.items[0].featureSharing,/Feature\/Evidence sharing proof missing/]])test(name,()=>{const x=migrationFixture();mutate(x);assert.throws(()=>compileEvidenceContract(x),pattern);});
const creaFixture=()=>{const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));return{selection:read("fixtures/evidence-contract-m7/LB_CREA_BONUS_TRIGGER_A2-selection-legacy.json"),research:read("../research/LB_CREA_BONUS_TRIGGER_A2/research-data.json"),observation:read("../research/LB_CREA_BONUS_TRIGGER_A2/machine-observation-data.json"),ui:read("../research/LB_CREA_BONUS_TRIGGER_A2/ui-design-data.json"),specification:read("../migration-specs/evidence-contract-m7/LB_CREA_BONUS_TRIGGER_A2.json")};};
test("CREA two-group eight-Evidence migration is byte-equivalent",()=>{const x=creaFixture(),migrated=compileEvidenceContract(x),stats=JSON.parse(fs.readFileSync(new URL("../research/LB_CREA_BONUS_TRIGGER_A2/statistics-report.json",import.meta.url)));assert.equal(x.selection.evidenceUi.groups.length,2);assert.equal(migrated.evidenceContract.inputs.length,2);assert.equal(migrated.evidenceContract.items.length,8);assert.deepEqual(buildMachineData(x.research,migrated,stats),buildMachineData(x.research,x.selection,stats));});
test("CREA groups remain isolated for multi- and cross-group selections",()=>{const items=compileEvidenceContract(creaFixture()).evidenceContract.items,apply=values=>items.filter(e=>(values[e.inputId]??[]).some(v=>String(v)===String(e.triggerValue))).map(e=>e.evidenceId);assert.deepEqual(apply({INP_EVI_CREA_TROPHY:["BRONZE_2PLUS","GOLD_4PLUS"]}),["EVI_CREA_TROPHY_BRONZE_2PLUS","EVI_CREA_TROPHY_GOLD_4PLUS"]);assert.deepEqual(apply({INP_EVI_CREA_TROPHY:["RAINBOW_6"],INP_EVI_CREA_REG_CARD:["RED_4PLUS"]}),["EVI_CREA_TROPHY_RAINBOW_6","EVI_CREA_REG_CARD_RED_4PLUS"]);});
for(const [name,mutate,pattern] of [["CREA missing lineage",x=>delete x.specification.items[0].sourceResearchEvidenceIds,/Research lineage/],["CREA missing floor",x=>delete x.specification.items[0].settingFloorSemantics,/settingFloorSemantics/],["CREA missing normalization",x=>delete x.specification.items[0].normalizationSemantics,/normalizationSemantics/],["CREA ambiguous Observation",x=>x.specification.items[0].observationIds.push("OBS_BONUS_OUTCOME"),/Observation mapping is not unique/],["CREA missing canonical UI",x=>delete x.specification.items[0].canonicalUi,/canonical UI proof missing/],["CREA missing sharing",x=>delete x.specification.items[0].featureSharing,/Feature\/Evidence sharing proof missing/],["CREA missing one Evidence specification",x=>x.specification.items.pop(),/does not cover every Evidence item/]])test(name,()=>{const x=creaFixture();mutate(x);assert.throws(()=>compileEvidenceContract(x),pattern);});
test("CREA semantic duplicate fails",()=>{const items=compileEvidenceContract(creaFixture()).evidenceContract.items;assert.throws(()=>assertNoDuplicates([...items,{...items[0],evidenceId:"EVI_DUPLICATE"}]),/DUPLICATE_SEMANTIC_EVIDENCE/);});
test("CREA legacy plus v2 fails atomic cutover",()=>{const x=creaFixture(),migrated=compileEvidenceContract(x);migrated.evidenceUi=x.selection.evidenceUi;assert.throws(()=>buildMachineData(x.research,migrated),/atomic cutover/);});

const evaMiraiFixture=()=>{const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));return{selection:read("fixtures/evidence-contract-m7/L_EVANGELION_MIRAI_JF-selection-legacy.json"),research:read("../research/L_EVANGELION_MIRAI_JF/research-data.json"),observation:read("../research/L_EVANGELION_MIRAI_JF/machine-observation-data.json"),ui:read("../research/L_EVANGELION_MIRAI_JF/ui-design-data.json"),specification:read("../migration-specs/evidence-contract-m7/L_EVANGELION_MIRAI_JF.json")};};
test("EVA MIRAI Evidence UI v2 migration is byte-equivalent",()=>{const x=evaMiraiFixture(),m=compileEvidenceContract(x),stats=JSON.parse(fs.readFileSync(new URL("../research/L_EVANGELION_MIRAI_JF/statistics-report.json",import.meta.url)));assert.equal(m.evidenceContract.inputs[0].id,"INP_EVI_E_FREEZE_END");assert.equal(m.evidenceContract.inputs[0].type,"enum");assert.equal(m.evidenceContract.inputs[0].defaultValue,"__UNSET__");assert.equal(m.evidenceContract.items.length,2);assert.deepEqual(m.evidenceContract.items.map(e=>e.sharedFeatureIds),[[],[]]);assert.deepEqual(buildMachineData(x.research,m,stats),buildMachineData(x.research,x.selection,stats));});
for(const [name,mutate,pattern] of [["EVA MIRAI missing lineage",x=>delete x.specification.items[0].sourceResearchEvidenceIds,/Research lineage/],["EVA MIRAI missing Observation",x=>delete x.specification.items[0].observationIds,/Observation mapping/],["EVA MIRAI missing normalization",x=>delete x.specification.items[0].normalizationSemantics,/normalizationSemantics/],["EVA MIRAI missing sharing",x=>delete x.specification.items[0].featureSharing,/Feature\/Evidence sharing proof missing/],["EVA MIRAI duplicate Evidence UI section",x=>x.ui.sections.DUP={evidenceIds:["EVI_UI_E_FREEZE_END"]},/Evidence UI v2 placement is not unique/],["EVA MIRAI direct and v2 placement conflict",x=>x.ui.sections.DIRECT={inputIds:["INP_EVI_E_FREEZE_END"]},/ambiguous between direct input and Evidence UI v2/]])test(name,()=>{const x=evaMiraiFixture();mutate(x);assert.throws(()=>compileEvidenceContract(x),pattern);});
test("EVA MIRAI legacy plus v2 fails atomic cutover",()=>{const x=evaMiraiFixture(),m=compileEvidenceContract(x);m.evidenceUi=x.selection.evidenceUi;assert.throws(()=>buildMachineData(x.research,m),/atomic cutover/);});test("EVA MIRAI historical group resolves through formal M7 cutover lineage",()=>{
  const x=evaMiraiFixture();
  const historicalGroup=x.selection.evidenceUi.groups[0];
  const migrated=compileEvidenceContract(x);
  const resolved=resolveHistoricalEvidenceGroup(migrated,historicalGroup);
  assert.equal(resolved.mode,"M7_CUTOVER");
  assert.equal(resolved.groupId,"E_FREEZE_END");
  assert.equal(resolved.items.length,2);
});

test("EVA MIRAI historical group resolves directly while legacy group remains",()=>{
  const x=evaMiraiFixture();
  const historicalGroup=x.selection.evidenceUi.groups[0];
  const resolved=resolveHistoricalEvidenceGroup(x.selection,historicalGroup);
  assert.equal(resolved.mode,"LEGACY");
  assert.equal(resolved.groupId,"E_FREEZE_END");
  assert.equal(resolved.legacyGroup,historicalGroup);
});

test("EVA MIRAI M7 cutover rejects changed Research lineage",()=>{
  const x=evaMiraiFixture();
  const historicalGroup=x.selection.evidenceUi.groups[0];
  const migrated=compileEvidenceContract(x);
  migrated.evidenceContract.items[0].sourceResearchEvidenceIds=["RE_TAMPERED"];
  assert.throws(
    ()=>resolveHistoricalEvidenceGroup(migrated,historicalGroup),
    /M7_CUTOVER_LINEAGE_MISMATCH/
  );
});

test("EVA MIRAI M7 cutover rejects unrelated historical group",()=>{
  const x=evaMiraiFixture();
  const historicalGroup={
    ...x.selection.evidenceUi.groups[0],
    groupId:"UNRELATED_GROUP"
  };
  const migrated=compileEvidenceContract(x);
  assert.throws(
    ()=>resolveHistoricalEvidenceGroup(migrated,historicalGroup),
    /M7_CUTOVER_GROUP_MISSING/
  );
});
test("EVA MIRAI M7 cutover rejects broken legacy migration provenance",()=>{
  const x=evaMiraiFixture();
  const historicalGroup=x.selection.evidenceUi.groups[0];
  const migrated=compileEvidenceContract(x);
  migrated.evidenceContract.items[0].legacyMigrationProvenance.groupId="WRONG_GROUP";
  assert.throws(
    ()=>resolveHistoricalEvidenceGroup(migrated,historicalGroup),
    /M7_CUTOVER_PROVENANCE_MISMATCH/
  );
});
test("Rino Heaven before and after runtime projections are byte-equivalent",()=>{const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));const research=read("../research/L_ANOTHER_RINO_HEAVEN_CC/research-data.json"),legacy=read("fixtures/evidence-contract-m7/L_ANOTHER_RINO_HEAVEN_CC-selection-legacy.json"),migrated=read("../research/L_ANOTHER_RINO_HEAVEN_CC/selection-data.json"),stats=read("../research/L_ANOTHER_RINO_HEAVEN_CC/statistics-report.json");assert.deepEqual(buildMachineData(research,migrated,stats),buildMachineData(research,legacy,stats));});
test("Animal Slot Docchi before and after runtime projections are byte-equivalent",()=>{const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));const research=read("../research/L_ANIMAL_SLOT_DOCCHI_ZT/research-data.json"),legacy=read("fixtures/evidence-contract-m7/L_ANIMAL_SLOT_DOCCHI_ZT-selection-legacy.json"),migrated=read("../research/L_ANIMAL_SLOT_DOCCHI_ZT/selection-data.json"),stats=read("../research/L_ANIMAL_SLOT_DOCCHI_ZT/statistics-report.json");assert.deepEqual(buildMachineData(research,migrated,stats),buildMachineData(research,legacy,stats));});
test("Hyper Rush before and after runtime projections are byte-equivalent",()=>{const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));const research=read("../research/S_HYPER_RUSH_SLC8/research-data.json"),legacy=read("fixtures/evidence-contract-m7/S_HYPER_RUSH_SLC8-selection-legacy.json"),migrated=read("../research/S_HYPER_RUSH_SLC8/selection-data.json"),stats=read("../research/S_HYPER_RUSH_SLC8/statistics-report.json");assert.deepEqual(buildMachineData(research,migrated,stats),buildMachineData(research,legacy,stats));});
test("Ninja Jajamaru before and after runtime projections are byte-equivalent",()=>{const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));const research=read("../research/S_NINJA_JAJAMARU/research-data.json"),legacy=read("fixtures/evidence-contract-m7/S_NINJA_JAJAMARU-selection-legacy.json"),migrated=read("../research/S_NINJA_JAJAMARU/selection-data.json"),stats=read("../research/S_NINJA_JAJAMARU/statistics-report.json");assert.deepEqual(buildMachineData(research,migrated,stats),buildMachineData(research,legacy,stats));});
