# M7 adoption-outside-legacy-groups cluster — 2026-09-19

## Scope

This audit follows PR #319 and targets the 38 machines whose full-fleet disposition is `BLOCKED_ADOPTION_OUTSIDE_LEGACY_GROUPS` with Selection Quality PASS.

## Formal structural finding

The common condition is not missing Evidence. These machines already adopt Evidence in Selection outside the legacy `selection.evidenceUi.groups` surface. The Gate0 implementation explicitly treats `selection.evidence` and `selection.evidenceContract.items` as upstream Evidence adoption, while `evidenceUi.groups` is only the auditable legacy adoption contract when newer item-level Selection Evidence is absent.

Therefore this population must not be routed through the legacy-group migration path merely because `evidenceUi.groups` is empty.

## Verified representation clusters

A sample spanning the population shows at least two materially different item-level representations:

1. **Research-linked item Evidence** — examples `LB_TRIPLE_CROWN_SEVEN_FG`, `L_AKUDAMA_DRIVE_TP`, and `L_FIRE_FORCE_2`. Items carry `researchEvidenceId`, `evidenceId`, `inputId`, and allowed/denied setting semantics.
2. **Published-machine-data legacy contract Evidence** — examples `S_CODE_GEASS_3_CC_FS` and `S_EUREKA_SEVEN_HIEVO_XS`. Items carry `legacyContractSource: published_machine_data`, stable Evidence/input IDs, trigger values where applicable, and confirmed/denied setting semantics.

These representations are not interchangeable proof. In particular, `legacyContractSource: published_machine_data` is not Research lineage.

## Decision

Do not auto-convert these 38 machines into `selection-evidence-v2` as one batch yet. The safe next split is by exact Selection Evidence representation and formal lineage source, then by availability of Observation/canonical-UI propagation proof. No label/category similarity may be used to bridge missing lineage.

This is an audit-only classification step; it changes no Selection, Observation, MachineData, or runtime semantics.
