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

## Remaining gates before publication

The batch is no longer blocked by Research / Selection / Observation / UI construction or batch-local MachineData validation. Remaining work is:

1. Resolve/confirm provisional registration metadata using the repository's formal registration process; do not invent IDs.
2. Exhaust any remaining web-solvable linked-service / machine-menu Observation debt.
3. Perform publish preparation and catalog/registry integration only after registration metadata is settled.
4. Bundle the genuinely field-only verification items into one real-device verification pass.
5. Keep PR #148 draft until publication and real-device gates are intentionally cleared.
