# M7 Observation largest-cluster lineage scan — 2026-09-19

## Scope

The current largest `OBSERVATION_BLOCKED` cluster contains 32 machines, 32 Evidence groups, and 222 Evidence items. Each machine has exactly one missing formal `OBS_EVI_<clean(groupId)>` Observation and no diagnostic exact-label candidate in the full-fleet audit.

## Formal lineage scan

All 32 machines were checked against the same non-diagnostic fields used by `audit-m7-observation-contract-completion.mjs`:

- Observation `sourceRefs`
- `notes`
- `semanticNote`
- `definitionEquality`

For each machine, every `sourceEvidenceId` from the sole Selection Evidence group was required to occur in one Observation's non-diagnostic lineage text.

Result:

- machines checked: **32**
- machines with exactly one explicit Research-Evidence lineage match: **0**
- machines with multiple explicit matches: **0**
- machines with no explicit match: **32**

## Decision

This cluster is **not an automatic Observation-completion batch**.

Several machines contain generic or machine-specific Evidence-looking Observations such as `OBS_SETTING_EVIDENCE`, `OBS_HARD_EVIDENCE_EVENTS`, or other visual-event records. Those are not sufficient proof because their relationship to the Selection Evidence group is not encoded through the formal Research Evidence IDs, group ID, canonical Evidence input ID, or another accepted non-diagnostic equality contract.

The following are therefore explicitly rejected as migration proof:

- a machine having only one Selection Evidence group;
- a machine having only one Evidence-looking Observation;
- label/category similarity;
- notes that merely say the Observation records Selection Evidence without explicit lineage identifiers;
- human inference that an Evidence-looking Observation is “obviously” the corresponding group.

## Consequence

The 32-machine class should remain `OBSERVATION_BLOCKED` until formal lineage is added from an authoritative Observation/Research reconstruction or another accepted contract artifact. No Observation IDs should be renamed by this audit.

The next batch search should move to other blocker classes and only return here when a formal source can establish the missing relationships without semantic inference.
