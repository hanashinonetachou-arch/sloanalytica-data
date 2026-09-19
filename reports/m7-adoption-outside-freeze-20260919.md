# M7 adoption-outside legacy groups freeze — 2026-09-19

## Scope

Follow-up to PRs #320 and #321 for the 38 Selection Quality PASS machines classified as `BLOCKED_ADOPTION_OUTSIDE_LEGACY_GROUPS`.

## Result

The class contains item-level Selection Evidence outside legacy `evidenceUi.groups`. At least two lineage families are present:

- explicit Research-linked Evidence;
- `legacyContractSource: published_machine_data` Evidence.

The Research-linked family was sampled through Observation. Existing Observation records were present, but the sampled machines had zero formal M7 `OBS_EVI_` Evidence mapping IDs. Repository search also found no authoritative reconstruction/materialization artifact that can mechanically establish Evidence→Observation lineage for this class.

## Freeze decision

Do not perform per-machine inferred mapping and do not auto-migrate this class from labels, categories, names, trigger similarity, or apparent setting semantics.

The 38-machine class remains blocked pending an authoritative formal lineage/reconstruction artifact. This is a class-level freeze, not a statement that the Evidence is invalid.

The separate orphan-downstream machine `S_SUPER_BINGO_NEO_CLASSIC_HH1` remains outside this freeze and should be handled as its own Gate0 orphan case.

## Next work

With the 38-machine adoption-outside class frozen, the remaining mechanically distinct `OTHER_BLOCKED` work is the single orphan-downstream case. After that, active automated work should move to a blocker class with a provable batch route rather than reopening frozen Observation/Normalization/Selection-quality populations.

No Selection, Observation, MachineData, or runtime semantics are changed by this report.
