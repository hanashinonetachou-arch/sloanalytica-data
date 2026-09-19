# M7 Selection Quality blocker clustering plan — 2026-09-19

## Scope

The current full-fleet audit reports 88 primary `SELECTION_QUALITY_BLOCKED` machines. This stage must not edit Selection decisions. It first partitions failures by the exact deterministic rules in `tools/selection-quality-gate.mjs`.

## Mechanical reason families

The gate has two severities.

### BLOCKED

- duplicate Feature decision
- unclassified Research Feature
- unclassified Research Evidence
- unmapped discovery candidate
- excluded-only input leaking into UI
- selected Feature missing `userReason`
- rejected Feature missing user-facing reason
- prohibited rejection basis based on input/manual-count burden
- rejected element missing name/reason

### REVIEW

- selected reason too generic/too short
- selected reason lacks concrete statistical/observational basis
- rejected reason too generic/too short
- rejected reason lacks concrete basis
- rejected element reason lacks concrete user-facing basis

## Batch policy

No REVIEW reason is to be rewritten automatically merely to satisfy wording heuristics. No missing Feature/Evidence decision is to be inferred from labels or neighboring machines.

Safe mechanical work is limited to defects whose intended value is already explicitly present in another authoritative field/artifact and can be copied without changing the Selection decision. Everything else remains a human/research-quality blocker.

## Next scan

Cluster all 88 machines by normalized blocker/review reason family, retaining counts and machine IDs. Prioritize exact structural BLOCKED causes before prose REVIEW causes. A batch is authorized only if its repair is deterministic and decision-preserving.
