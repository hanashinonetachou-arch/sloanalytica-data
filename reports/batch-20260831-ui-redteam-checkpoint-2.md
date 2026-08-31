# Batch 2026-08-31 UI / Red Team checkpoint 2

## Scope

Batch: Persona5 to Smart Biohazard5 (10 machines)

Current construction state:
- ResearchData: 10/10
- SelectionData: 10/10
- Machine Observation Data v2: 10/10
- UI Design Data v1: 10/10
- MachineData generation: 10/10 pipeline pass
- Catalog publication: pending
- Real-device verification: pending for field-only items

## Evidence / UI normalization status

All 10 machines now have structured UI Design Data. Legacy Evidence surfaces that previously blocked final UI construction have been normalized/decomposed so that hard confirmation/exclusion semantics are not mixed with soft suggestion semantics.

Important retained contracts:
- Persona5: manual watermelon and MySlot watermelon are alternate acquisition routes into one logical input; never sum both.
- Sister Quest: AT end screen is one mutually-exclusive observation shared by multinomial inference and hard Evidence behavior; no duplicate Evidence counter surface.
- Smart Biohazard5: middle-line AT initial hits are the explicit denominator for Infection-from-middle; diagonal hits are excluded.
- Super Rio Ace: blue/yellow ending hints remain soft suggestions and are not promoted to hard Evidence.
- BOØWY: hard setting-1 denial / setting-6 confirmation / setting-L handling are separated from soft even/high/5-6 suggestions.

## Batch-specific CI result

MachineData Pipeline reached:
- PASS=10
- REVIEW=0
- BLOCKED=0
- repository checks PASS

All 10 ResearchData and SelectionData passed their machine pipelines. Sister Quest retains only expected Research rounding warnings for the public AT-end multinomial, with Selection explicitly opting into bounded normalization.

Machine Observation Research Audit is passing for the batch after Sister Quest built-in SmartTALK was correctly represented as machine-menu functionality and linked-service coverage was set to CHECKED_NONE.

Machine identity, Feature Selection Policy v2, Research Provenance, MachineData Statistical, User-facing Definitions, non-default weight, user-verified UX contract, Observation migration-priority, and Phase 5 exposure/basis audits were green on the completed batch head before the final batch-pipeline infrastructure fix.

## Batch Machine Pipeline regression fix

A separate regression exposed two infrastructure issues while validating this batch:

1. Resolved ResearchData conflicts were incorrectly surfaced as REVIEW because the batch pipeline checked only the legacy free-text `resolution` field instead of the current `resolutionStatus: resolved` contract. The pipeline now honors the current schema while retaining legacy compatibility.

2. CHECK mode generated temporary MachineData before running repository-wide invariant tests. Those transient files could change a repo-wide selection-policy migration count during the test itself. CHECK mode now restores the pre-run generated-file snapshot before repository-wide tests/audits. WRITE mode continues to test the newly generated state.

The Batch Machine Pipeline Regression rerun completed successfully after this change. The five-machine regression still reports the deliberately provisional Hanabi machine as REVIEW, but BLOCKED=0; repository checks pass and check mode rolls back generated artifacts as intended.

The repository test suite in that regression completed 410/410 PASS, including the selection-policy migration invariant and the current-schema Research conflict tests.

## Registration metadata contract confirmed

The repository's formal registry flow was checked rather than assigning provisional IDs manually.

`sync-machine-registry.mjs` defines `provisionalRegistrationId` as an immutable development-time sequence. Existing assigned IDs are preserved; future catalog machines receive the current maximum + 1. The batch publish pipeline adds/updates every requested catalog entry first and then executes machine-registry sync once for the whole batch.

Therefore these 10 new machines should not receive guessed/manual provisional IDs before publication. Their IDs are allocated deterministically by the formal registry sync during an applied batch publish, after catalog insertion. `registrationId` remains separate and nullable.

## Observation web-debt follow-up

A further public-source pass was performed before sending anything to real-device verification.

- Persona5: the analysis source explicitly recommends counting the state-independent watermelon with MySlot. Public material still does not establish the exact result-screen range/reset boundary, so that boundary remains a field-only verification item; the same watermelon observation must not be double-counted through manual and MySlot paths.
- L 仮面ライダー電王: KYORAKU's official ぱちログweb page confirms this machine is supported and states that the machine QR code can be read to view the play result. The public page does not enumerate machine-specific result fields, so exact Selection-compatible counters remain unresolved instead of being guessed.
- スーパーリオエース (2022): the current official スロプラNEXT service started in 2024 and its Rio entry is the separate 2026 machine `スマスロスーパーリオエース2`. No support basis for the 2022 original machine was found. Its Observation `linkedService` coverage is therefore resolved to `CHECKED_NONE`; the 2026 service fields must not be projected backward.
- バイオハザード RE:2: the manufacturer official machine site was located, but no machine-specific linked-service result contract was established from the public material checked. Linked-service coverage remains unresolved rather than being inferred from manufacturer-family services.

## Remaining gates before publication

The batch is no longer blocked by Research / Selection / Observation / UI construction or batch-local MachineData validation. Remaining work is:

1. Continue resolving web-solvable machine-menu / linked-service Observation debt; keep only genuinely field-only items for real-device review.
2. Run batch publish preparation. On an applied publish, allow the formal registry sync to allocate immutable provisional registration IDs after catalog insertion; do not preassign them manually.
3. Bundle the genuinely field-only verification items into one real-device verification pass.
4. Keep PR #148 draft until publication and real-device gates are intentionally cleared.
