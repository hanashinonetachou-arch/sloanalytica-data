# Evidence Contract M7 — CREA second atomic pilot

Date: 2026-09-16. Target: `LB_CREA_BONUS_TRIGGER_A2` only.

## Read-only preflight and formal proof

Both legacy groups use `selectionMode=multi` and `normalizationMode=ALLOWED_SETTINGS_INTERSECTION`. They materialize as separate `multi_enum` inputs with default `[]` in canonical section `設定確定情報`, and map uniquely to `OBS_CREA_EVIDENCE`. Selection Feature inputs do not use either Evidence input, so sharing is formally `NONE`.

| Group / input | Option value | Research lineage | Confirmed settings | Denied |
|---|---|---|---|---|
| `CREA_TROPHY` / `INP_EVI_CREA_TROPHY` | `BRONZE_2PLUS` | `RE_TROPHY_BRONZE_2PLUS` | 2,3,4,5,6 | none |
| same | `SILVER_3PLUS` | `RE_TROPHY_SILVER_3PLUS` | 3,4,5,6 | none |
| same | `GOLD_4PLUS` | `RE_TROPHY_GOLD_4PLUS` | 4,5,6 | none |
| same | `LIGHTNING_5PLUS` | `RE_TROPHY_LIGHTNING_5PLUS` | 5,6 | none |
| same | `RAINBOW_6` | `RE_TROPHY_RAINBOW_6` | 6 | none |
| `CREA_REG_CARD` / `INP_EVI_CREA_REG_CARD` | `RED_4PLUS` | `RE_REG_RED_4PLUS` | 4,5,6 | none |
| same | `SILVER_GOLD_ONLY_4PLUS` | `RE_REG_SILVER_GOLD_ONLY_4PLUS` | 4,5,6 | none |
| same | `RED_TWICE_6` | `RE_REG_RED_TWICE_6` | 6 | none |

Every option label, stored value, setting set, source Research ID, input ID/type/default, Observation link, and canonical placement was recovered without ambiguity. The reviewed machine-specific specification records these proofs; the generic compiler was not changed.

## Migration and equivalence

Dry-run returned `CHECK_OK selection-evidence-v2 (8 Evidence)` before apply. Apply removed `evidenceUi` and emitted two inputs and eight item contracts. The dedicated equivalence audit returned `EQUIVALENT: 8 Evidence`.

Independently generated legacy and migrated MachineData files are byte-identical. Therefore input IDs/types/defaults, option keys/values, Evidence IDs/order, triggers, confirmed/denied settings, source references, UI widgets/placement, and unset semantics are unchanged. Group-isolation tests prove two same-group values trigger exactly their two Evidence items, while a trophy plus REG-card value triggers exactly one item from each group.

## Scope and result

No generic M7 tool, Gate0 implementation, Hanabi file, Research, Observation, UI design, published MachineData, catalog, App, or other machine changed. Repository-wide Gate0 backlog remains out of scope and its legacy behavior regression remains green.

`CREA_M7_SECOND_PILOT_PASS: YES`. This proves the contract for two groups/eight Evidence, but does not authorize bulk migration.
