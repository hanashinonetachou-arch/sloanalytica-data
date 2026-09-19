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


## Follow-up structural sample

A second sample across eight additional machines found all Selection Evidence items explicitly Research-linked:

- `L_GHOST_IN_THE_SHELL_ZS`: 11/11 items
- `L_GOBLIN_SLAYER_2_JZ`: 14/14
- `L_GODZILLA_NS`: 17/17
- `L_HANMA_BAKI_L5`: 14/14
- `L_MAGIA_RECORD_RN`: 16/16
- `L_SMASLO_TOKYO_REVENGERS_ZF`: 6/6
- `L_YOUJITSU_DE`: 13/13
- `L_ZENIGATA_5_L2`: 12/12

This sample also exposes two sub-shapes inside Research-linked Evidence: items with explicit allowed/denied setting sets, and items whose semantics are represented by a trigger value plus source Evidence references. These must remain separate until normalization equivalence is formally proven.

The current evidence therefore supports prioritizing the Research-linked population for the next mechanical proof scan, while retaining the published-machine-data population as a separate legacy-lineage class.
