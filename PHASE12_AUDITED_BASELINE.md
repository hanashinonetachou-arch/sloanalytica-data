# Phase 12 — Audited 101-Machine Baseline

Status: ACTIVE BASELINE

Baseline commit before Phase 12 hardening: `cfac75b0e42f8bacfd08d34a6663a652bd6a7385`.

This baseline means the 101-machine prototype catalog has completed the cross-machine audit sequence through Phase 11.

## Required architecture for all new machines

1. Statistical Research
   - Feature Selection Policy v2.
   - correct observation denominator before requiredTrials.
   - dependencies must be factorized safely where possible (conditional Binomial / exclusive Multinomial) rather than double-counted.

2. Machine Observation Research
   - normal on-machine menu/history screen.
   - linked service / machine-linked counting function when present.
   - concrete obtainable fields.
   - seated/predecessor observations.
   - self-play denominator derivation.
   - unknown facts remain UNRESOLVED; absence is never inferred from missing documentation.

3. User-Verified UX Contract
   - real-device verified quickAdd, section/order, labels/descriptions, automatic calculations, seated inputs, compact/direct input, and verified forbidden inputs are protected from later rebuilds.

## Required downstream gates

- Research Completeness v2 / Machine Observation gate.
- Selection evidence coverage and Feature Selection Policy v2 validation.
- User-Verified UX contract regression protection.
- Feature-dependency / double-counting audit.
- Difficulty exposure and setting-band calculation checks.
- User-facing explanation audit.
- repository-wide tests and public-data audit before publish.

## Difficulty semantics

- 1500G / 3000G / 7000G mean the user's own standard self-play data volume.
- predecessor data is not included in those reference game counts.
- each Feature keeps its own denominator/exposure contract.
- 7000G does not mean every Feature received 7000 trials.
- predecessor information may still improve actual inference earlier than the reference Difficulty suggests.

## Batch policy

- Up to 10 machines per batch.
- The end-to-end orchestrator must route Research through the strict Research Completeness v2 pipeline and Selection through the strict evidence-coverage pipeline.
- REVIEW/BLOCKED items must not auto-advance.
- publish/approve remains a separate explicit step.

This document is the reference point for returning to new-machine batch production after the one-time 101-machine audit.
