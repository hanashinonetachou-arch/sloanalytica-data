#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { VERSION, read, legacyProjection, assertNoDuplicates } from "./lib/evidence-contract-m7.mjs";

const blocked = message => { throw new Error(`BLOCKED_INFORMATION_GAP: ${message}`); };
const nonEmptyStrings = value => Array.isArray(value) && value.length > 0 && value.every(x => typeof x === "string" && x.length > 0);

function resolveCanonicalPlacement(ui, inputId, groupId) {
  const direct = Object.entries(ui.sections ?? {}).filter(([, section]) => section.inputIds?.includes(inputId)).map(([name]) => name);
  const contractIds = Object.entries(ui.evidenceContracts ?? {}).filter(([, contract]) => contract?.sourceEvidenceGroupId === groupId).map(([id]) => id);
  const v2 = [];
  for (const evidenceId of contractIds) {
    const sections = Object.entries(ui.sections ?? {}).filter(([, section]) => section.evidenceIds?.includes(evidenceId)).map(([name]) => name);
    if (sections.length !== 1) blocked(`Evidence UI v2 placement is not unique for ${groupId}/${evidenceId}`);
    v2.push({ evidenceId, section: sections[0] });
  }
  if (direct.length > 1) blocked(`canonical UI placement is not unique for ${inputId}`);
  if (contractIds.length > 1 || v2.length > 1) blocked(`Evidence UI v2 contract is not unique for ${groupId}`);
  if (direct.length && v2.length) blocked(`canonical UI placement is ambiguous between direct input and Evidence UI v2 for ${groupId}`);
  if (direct.length === 1) return { inputId, section: direct[0] };
  if (v2.length === 1) return { inputId, section: v2[0].section, evidenceUiId: v2[0].evidenceId };
  blocked(`canonical UI placement is missing for ${inputId}/${groupId}`);
}

export function compileEvidenceContract({ selection, research, observation, ui, specification }) {
  if (selection.evidenceContract?.contractVersion === VERSION) return selection;
  if (!specification || specification.contractVersion !== VERSION || specification.machineId !== selection.machineId) blocked("machine-specific migration specification is missing or mismatched");
  const projection = legacyProjection(selection);
  if (!projection.items.length) blocked("no materialized Evidence");
  const specItems = new Map((specification.items ?? []).map(item => [`${item.groupId}/${item.value}`, item]));
  if (specItems.size !== projection.items.length) blocked("migration specification does not cover every Evidence item exactly once");
  const researchIds = new Set((research.evidenceCandidates ?? []).map(x => x.researchEvidenceId));
  const observationIds = new Set((observation.observations ?? []).map(x => x.observationId));
  const featureIds = new Set((selection.features ?? []).map(x => x.featureId));
  const groupByInput = new Map(projection.items.map(item => [item.inputId, item.groupId]));

  for (const input of projection.inputs) {
    resolveCanonicalPlacement(ui, input.id, groupByInput.get(input.id));
    input.defaultValue = input.type === "multi_enum" ? [] : "__UNSET__";
  }
  projection.items = projection.items.map(item => {
    const spec = specItems.get(`${item.groupId}/${item.triggerValue}`);
    if (!spec) blocked(`migration specification missing for ${item.evidenceId}`);
    if (!nonEmptyStrings(spec.sourceResearchEvidenceIds) || JSON.stringify(spec.sourceResearchEvidenceIds) !== JSON.stringify(item.sourceResearchEvidenceIds) || spec.sourceResearchEvidenceIds.some(id => !researchIds.has(id))) blocked(`Research lineage is missing or differs for ${item.evidenceId}`);
    if (typeof spec.settingFloorSemantics !== "string" || !spec.settingFloorSemantics) blocked(`settingFloorSemantics proof missing for ${item.evidenceId}`);
    if (typeof spec.normalizationSemantics !== "string" || !spec.normalizationSemantics) blocked(`normalizationSemantics proof missing for ${item.evidenceId}`);
    if (!nonEmptyStrings(spec.observationIds) || spec.observationIds.length !== 1 || spec.observationIds.some(id => !observationIds.has(id))) blocked(`Observation mapping is not unique for ${item.evidenceId}`);
    const placement = resolveCanonicalPlacement(ui, item.inputId, item.groupId);
    if (!spec.canonicalUi || spec.canonicalUi.inputId !== item.inputId || spec.canonicalUi.section !== placement.section || (placement.evidenceUiId && spec.canonicalUi.evidenceUiId !== placement.evidenceUiId) || (!placement.evidenceUiId && spec.canonicalUi.evidenceUiId)) blocked(`canonical UI proof missing for ${item.evidenceId}`);
    if (!spec.featureSharing || !Array.isArray(spec.sharedFeatureIds)) blocked(`Feature/Evidence sharing proof missing for ${item.evidenceId}`);
    if (spec.featureSharing === "NONE" && spec.sharedFeatureIds.length) blocked(`Feature/Evidence sharing proof conflicts for ${item.evidenceId}`);
    if (spec.featureSharing === "EXPLICIT" && (!spec.sharedFeatureIds.length || spec.sharedFeatureIds.some(id => !featureIds.has(id)))) blocked(`Feature/Evidence sharing proof is invalid for ${item.evidenceId}`);
    if (!["NONE", "EXPLICIT"].includes(spec.featureSharing)) blocked(`Feature/Evidence sharing proof missing for ${item.evidenceId}`);
    return { ...item, settingFloorSemantics: spec.settingFloorSemantics, normalizationSemantics: spec.normalizationSemantics, observationIds: spec.observationIds, canonicalUi: spec.canonicalUi, sharedFeatureIds: spec.sharedFeatureIds, featureSharing: spec.featureSharing, legacyMigrationProvenance: { source: "selection.evidenceUi.groups", groupId: item.groupId, specificationId: specification.specificationId } };
  });
  assertNoDuplicates(projection.items);
  return { ...selection, evidenceContract: { contractVersion: VERSION, inputs: projection.inputs, items: projection.items }, evidenceUi: undefined };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const id = process.argv[2], apply = process.argv.includes("--apply");
  const specArg = process.argv.find(x => x.startsWith("--spec="));
  if (!id || id.startsWith("-")) { console.error("Usage: node tools/migrate-selection-evidence-contract.mjs <machineId> [--spec=path] [--apply]"); process.exit(2); }
  const root = process.cwd(), selectionPath = path.join(root, "research", id, "selection-data.json");
  try {
    const selection = read(selectionPath);
    if (selection.evidenceContract?.contractVersion === VERSION) { console.log(`${id}: NO_OP_ALREADY_MIGRATED`); process.exit(0); }
    const specPath = specArg?.slice("--spec=".length) ?? path.join(root, "migration-specs", "evidence-contract-m7", `${id}.json`);
    const specification = fs.existsSync(specPath) ? read(specPath) : null;
    const migrated = compileEvidenceContract({ selection, specification, research: read(path.join(root, "research", id, "research-data.json")), observation: read(path.join(root, "research", id, "machine-observation-data.json")), ui: read(path.join(root, "research", id, "ui-design-data.json")) });
    if (apply) { fs.writeFileSync(selectionPath, JSON.stringify(migrated, null, 2) + "\n"); console.log(`${id}: APPLIED ${VERSION}`); }
    else console.log(`${id}: CHECK_OK ${VERSION} (${migrated.evidenceContract.items.length} Evidence); rerun with --apply`);
  } catch (error) { console.error(`${id}: ${error.message}`); process.exit(1); }
}
