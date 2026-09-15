# Evidence Contract M7 pilot report

Date: 2026-09-15. Data base: `d6e2ed0`. App repository was not present in this workspace, so no App source or tests were changed.

## Read-only preflight

| machine | legacy groups / options | Research lineage | generated input contract | setting semantics | Observation | canonical UI | sharing | result |
|---|---|---|---|---|---|---|---|---|
| `L_HANABI_KM` | `HANABI_REG_END` / `PEACE_2PLUS` | `RE_REG_END_PEACE_2PLUS` | `INP_EVI_HANABI_REG_END`, `multi_enum`, value `PEACE_2PLUS`, default `[]` | confirmed `SET_2,SET_5,SET_6`; no denial; exact allowed-settings floor | `OBS_SETTING_EVIDENCE` | `設定確定情報`, `multi_select` | none | PASS; migrated |
| `LB_CREA_BONUS_TRIGGER_A2` | `CREA_TROPHY` (5), `CREA_REG_CARD` (3) | one explicit Research ID per option | two stable `INP_EVI_*` multi-enums; stored values unchanged | `ALLOWED_SETTINGS_INTERSECTION` | `OBS_CREA_EVIDENCE` | `設定確定情報` | none found | PASS preflight; not run after first-pilot scope |
| `L_DMC5_ST_XA` | four groups / 20 options | explicit, but several options intentionally share a candidate | four generated multi-enums | confirmations plus `SET_3`/`SET_2` denials | `OBS_HARD_EVIDENCE_EVENTS` | Evidence placement absent from `ui-design-data` | none found | BLOCKED: canonical placement is not uniquely represented |
| `L_ULTRAMAN_KE` | four groups / 18 options | explicit, with shared candidates inside groups | four generated multi-enums | confirmations plus `SET_1`/`SET_2`/`SET_4` denials | `OBS_HARD_EVIDENCE_EVENTS` | Evidence placement absent from `ui-design-data` | none found | BLOCKED: canonical placement is not uniquely represented |
| `LB_MAGICAL_HALLOWEEN_GS` | `MAGIHALLO_MINI_CHARACTER` / 2 | explicit | one generated multi-enum | allowed settings exist, but group normalization metadata is absent | `OBS_MINI_CHARACTER_EVIDENCE` | `設定確定情報` | none found | EXPECTED BLOCK (`BLOCKED_INFORMATION_GAP`) |

The detailed option values, triggers and setting arrays remain in the source Selection files and published packages; the migration compiler reads them rather than maintaining a second hand-written mapping.

## Destination and cutover

`selection-evidence-v2` contains explicit `inputs` and item-level `items`. Each item carries `evidenceId`, display name, multiple `sourceResearchEvidenceIds`, stable input/trigger, confirmed and denied settings, `settingFloorSemantics`, `normalizationSemantics`, Observation IDs, canonical UI placement, Feature-sharing declaration, runtime type, and legacy provenance.

The builder selects this contract only when `contractVersion` is exactly `selection-evidence-v2`. A v2 Selection containing legacy groups fails. Unmigrated machines continue through the legacy materializer. Thus legacy and destination Evidence cannot be materialized together for a migrated machine.

## Equivalence proof — `L_HANABI_KM`

The checked-in legacy fixture is the before image. The dedicated audit reports one Evidence and `EQUIVALENT`. Independently building MachineData from the before fixture and migrated Selection produces byte-identical JSON. Consequently the input ID/type/default/options, trigger, Evidence ID/order/settings/source reference, UI input/widget/placement, and unset `[]` semantics are preserved. Duplicate IDs and duplicate semantic keys both fail closed.

No published MachineData artifact changed because the newly built projection is byte-identical. No Research, Observation, canonical UI, App runtime, Session, or History schema was edited.

## Gates

| Gate | Result | Evidence |
|---|---|---|
| M7-0..M7-6 | PASS for Hanabi | complete unique mapping, byte-identical runtime build, duplicate guard |
| M7-7 | PASS by contract proof | persisted key/value is still `INP_EVI_HANABI_REG_END` / `PEACE_2PLUS`; unset stays `[]` |
| M7-8 | PASS by contract proof | before and after packages accept the identical key and stored value |
| M7-9 | PASS with baseline limitation separated | repository suite passes except the pre-existing Phase 12 check cannot fetch its pinned commit because this checkout has no `origin`; the repository-wide Gate0 also retains its existing unresolved backlog |

## Result

`PILOT_RESULT: PASS` for the first atomic pilot. `BULK_MIGRATION_READY: NO`: App regression execution is unavailable, two later candidates have canonical UI metadata gaps, and the negative pilot correctly remains blocked. Next: add/verify canonical Evidence placement for the blocked candidates, run the App compatibility suite in the App repository, then migrate CREA as the second atomic pilot.
