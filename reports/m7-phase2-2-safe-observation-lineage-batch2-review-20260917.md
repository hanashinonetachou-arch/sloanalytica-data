# M7 Phase 2.2 Safe Observation Lineage Batch 2 Review

Date: 2026-09-17
Original branch base: `a7ed9d386dbf84e09f6ecf8957513dd87370a113` (PR #300 merge)
Current `prototype-multi-machine` delta reviewed: one bot-only refresh of `reports/machine-observation-migration-plan.json`; no Research / Selection / Observation semantic files changed.

## Policy

This is a diagnostic semantic review only. It performs no production Observation mutation and establishes no formal proof. Labels/categories/names/appearance are diagnostic only. No real-device verification is claimed.

The four remaining rows were previously classified `SAFE_CONSTRUCTION_CANDIDATE` by machine-readable topology. That classification means they were eligible for a separate construction review; it does not authorize blindly renaming an existing broad Observation.

## Results

| Machine | Evidence group | Existing END_EVENT Observation | Batch 2 classification | Reason | Next action |
| --- | --- | --- | --- | --- | --- |
| `L_HIGURASHI_GOU_SS` | `TROPHY` | `OBS_SETTING_EVIDENCE` | `EXACT_UNIVERSE_CONSTRUCTIBLE` | Research has a distinct trophy scope and Selection's TROPHY group selects exactly the four trophy Evidence IDs. Existing generic Observation is broader, so it must not be renamed. | Add a new TROPHY-specific formal Observation; preserve the generic Observation until the other Evidence groups are independently migrated. |
| `L_KAMEN_RIDER_7RIDERS_UJA` | `TROPHY` | `OBS_RIDER_EVIDENCE` | `EXACT_UNIVERSE_CONSTRUCTIBLE_WITH_SPLIT` | Research separates area-coordinate Evidence from trophy Evidence and Selection separately groups `AREA_COORDINATE` and `TROPHY`. | Add group-specific formal Observations for TROPHY and AREA_COORDINATE, then retire/replace the broad Observation only after both universes are represented. |
| `L_NOGIZAKA46_UD` | `TAMA_TROPHY` | `OBS_SETTING_EVIDENCE` | `EXACT_UNIVERSE_CONSTRUCTIBLE` | Research contains only the four selected trophy Evidence candidates, all observed at AT end; Selection maps exactly those four IDs to TAMA_TROPHY. | Add a new TAMA_TROPHY-specific formal Observation; preserve semantics and do not infer any additional Evidence universe. |
| `L_NYANKO_BIGBANG_MK` | `TAMA_TROPHY` | `OBS_NYANKO_END_EVIDENCE` | `EXACT_UNIVERSE_CONSTRUCTIBLE_WITH_SPLIT` | Research contains six AT-end Evidence candidates: four trophy IDs and two God end-screen IDs. Selection explicitly partitions them into `TAMA_TROPHY` and `AT_END_SCREEN`. | Add two group-specific formal Observations using the exact Selection partitions; retire/replace the broad Observation only after both are represented. |

## Exact-universe construction plan

### L_HIGURASHI_GOU_SS / TROPHY

Proposed formal ID: `OBS_EVI_TROPHY`

Exact `sourceEvidenceIds`:
- `RE_TROPHY_2PLUS`
- `RE_TROPHY_4PLUS`
- `RE_TROPHY_5PLUS`
- `RE_TROPHY_6`

Construction basis: Research `observationScope = トロフィー` for all four IDs plus exact Selection TROPHY membership. Do not absorb にぱー演出, CZ終了時セリフ, ボーナス終了画面, or REGキャラ紹介 Evidence.

### L_KAMEN_RIDER_7RIDERS_UJA / TROPHY + AREA_COORDINATE

Proposed formal IDs:
- `OBS_EVI_TROPHY`
- `OBS_EVI_AREA_COORDINATE`

TROPHY exact `sourceEvidenceIds`:
- `RE_TROPHY_2PLUS`
- `RE_TROPHY_4PLUS`
- `RE_TROPHY_5PLUS`
- `RE_TROPHY_6`

AREA_COORDINATE exact `sourceEvidenceIds`:
- `RE_AREA_4PLUS`
- `RE_AREA_6`

Construction basis: Research scopes and Selection groups independently partition these six Evidence IDs. No linked-machine-service or machine-menu assumptions are introduced.

### L_NOGIZAKA46_UD / TAMA_TROPHY

Proposed formal ID: `OBS_EVI_TAMA_TROPHY`

Exact `sourceEvidenceIds`:
- `RE_TROPHY_2PLUS`
- `RE_TROPHY_4PLUS`
- `RE_TROPHY_5PLUS`
- `RE_TROPHY_6`

Construction basis: Research contains exactly these four Evidence candidates and Selection TAMA_TROPHY maps exactly the same four IDs. Observation timing remains AT end; no real-device claim is added.

### L_NYANKO_BIGBANG_MK / TAMA_TROPHY + AT_END_SCREEN

Proposed formal IDs:
- `OBS_EVI_TAMA_TROPHY`
- `OBS_EVI_AT_END_SCREEN`

TAMA_TROPHY exact `sourceEvidenceIds`:
- `RE_TROPHY_BRONZE_2PLUS`
- `RE_TROPHY_SILVER_4PLUS`
- `RE_TROPHY_ZEBRA_5PLUS`
- `RE_TROPHY_RAINBOW_6`

AT_END_SCREEN exact `sourceEvidenceIds`:
- `RE_END_GOD_AWAKENED_4PLUS`
- `RE_END_GOD_KIRA_6`

Construction basis: Research uses the same AT-end observation scope for both families, while Selection provides the authoritative semantic partition. The two groups must remain separate despite sharing timing/surface.

## Summary

- Reviewed original candidate groups: 4
- Direct rename candidates: 0
- Exact-universe constructible without broad-observation retirement: 2
- Exact-universe constructible with explicit split: 2
- Planned formal group Observations: 6
- Production mutations in this review: 0
- Formal proof established in this review: 0
- Research reopen asserted: 0
- Real-device verification claimed: 0

## Decision

All four original candidates now have an exact Research + Selection construction route, but none is authorized as a blind rename. The next controlled production step is to add the six group-specific formal Observations with the exact source Evidence sets above, preserve unrelated feature mappings, validate the complete fleet, and only then decide whether each broad legacy Observation can be removed without losing unmigrated semantics.