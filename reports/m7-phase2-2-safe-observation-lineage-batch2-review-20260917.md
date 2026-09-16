# M7 Phase 2.2 Safe Observation Lineage Batch 2 Review

Date: 2026-09-17
Base: `a7ed9d386dbf84e09f6ecf8957513dd87370a113` (PR #300 merge)

## Policy

This is a diagnostic semantic review only. It performs no production Observation mutation and establishes no formal proof. Labels/categories/names/appearance are diagnostic only. No real-device verification is claimed.

The four remaining rows were previously classified `SAFE_CONSTRUCTION_CANDIDATE` by machine-readable topology. That classification means they were eligible for a separate construction review; it does not authorize blindly renaming an existing broad Observation.

## Results

| Machine | Evidence group | Existing END_EVENT Observation | Batch 2 classification | Reason | Next action |
| --- | --- | --- | --- | --- | --- |
| `L_HIGURASHI_GOU_SS` | `TROPHY` | `OBS_SETTING_EVIDENCE` | `OBSERVATION_SPLIT_OR_SEMANTIC_COMPLETION_REQUIRED` | Existing Observation is generic setting Evidence while Selection contains multiple independent Evidence groups. A TROPHY formal lineage cannot be established from the broad Observation ID alone. | Construct or split a TROPHY-specific Observation only after exact Research/Selection universe is preserved. |
| `L_KAMEN_RIDER_7RIDERS_UJA` | `TROPHY` | `OBS_RIDER_EVIDENCE` | `OBSERVATION_SPLIT_REQUIRED` | Existing Observation explicitly combines trophy and area Evidence. Selection has separate `TROPHY` and `AREA_COORDINATE` groups. Renaming the broad Observation to TROPHY would incorrectly absorb area lineage. | Split the broad Observation into group-specific Observations; preserve existing semantics until both universes are mapped. |
| `L_NOGIZAKA46_UD` | `TAMA_TROPHY` | `OBS_SETTING_EVIDENCE` | `OBSERVATION_SEMANTIC_COMPLETION_REQUIRED` | Existing Observation is generic setting Evidence. Selection has a specific `TAMA_TROPHY` group, but the generic Observation does not itself establish that exact lineage. | Construct a TAMA_TROPHY-specific Observation from exact Research/Selection semantics before formalization. |
| `L_NYANKO_BIGBANG_MK` | `TAMA_TROPHY` | `OBS_NYANKO_END_EVIDENCE` | `OBSERVATION_SPLIT_REQUIRED` | Existing Observation explicitly combines 玉ちゃんトロフィー and AT終了画面 Evidence. Selection separates `TAMA_TROPHY` and `AT_END_SCREEN`. Renaming would conflate two Evidence groups. | Split into TAMA_TROPHY and AT_END_SCREEN Observations while preserving exact source universes. |

## Summary

- Reviewed groups: 4
- Direct rename/formalization candidates: 0
- Observation split required: 2
- Observation semantic completion required: 1
- Split or semantic completion required: 1
- Production mutations: 0
- Formal proof established: 0
- Research reopen asserted: 0
- Real-device verification claimed: 0

## Decision

Batch 2 does **not** formalize any of the four remaining candidates by direct rename. The next controlled step is an exact-universe Observation split/construction plan. Production files remain unchanged in this review.