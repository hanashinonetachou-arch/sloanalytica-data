# Batch 2026-08-31 Machine Generation Checkpoint

Branch: `batch/20260831-persona5-to-bio5`
Base: `prototype-multi-machine`

## MachineData generation

GitHub Actions MachineData Pipeline run 595 completed successfully on source head `a9a85ad7414f9b74814598d70ab723d1816e0726`.

- ResearchData validation: 10/10 passed.
- SelectionData validation: 10/10 passed.
- MachineData generation: 10/10 completed.
- Setting-band reports: 10/10 completed.
- Repository test suite: 408 passed, 0 failed.
- Public-data audit: passed with 10 expected warnings because these new MachineData files are not yet registered in `catalog.json`.
- User-facing machine-linked service-name audit: passed with 0 approved exceptions.
- Batch result: `REVIEW` (`PASS=9`, `REVIEW=1`, `BLOCKED=0`).
- Atomic rollback: no.

The workflow committed generated artifacts as `49f8aafbfd29b729d7173229123a34d8fe7c0bee` (`chore: refresh generated MachineData artifacts`).

## Generated machine packages

- `L_BIOHAZARD5_ZE`
- `L_KAMEN_RIDER_DEN_O_UD`
- `L_SISTER_QUEST_CA`
- `L_TIDADONDON_PA5`
- `S_BIG_SHIMAUTA_E2_30`
- `S_BIOHAZARD_RE2_XB`
- `S_BOOWY_SV`
- `S_PERSONA5_FR`
- `S_SUPER_RIO_ACE_CC`
- `S_WARAU4_KH`

## Known non-blocking warning

`L_SISTER_QUEST_CA` ResearchData preserves published AT-end-screen category probabilities whose rounded totals are 1.001 for SET_1, SET_2, SET_5 and SET_6. Selection explicitly opts into bounded normalization with `normalizeRoundedCategoryProbabilities: true`; the raw published Research values remain unchanged.

## Repository-wide Observation audit caveat

The standalone Machine Observation Research Audit currently fails before its research audit phase because it validates all legacy Observation files in the repository and encounters old vocabulary in many pre-v2 files. This is existing repository migration debt and is not evidence of a batch-local failure in these ten new v2 Observation files.

## Remaining gates before publish / real-device verification

1. Identify and resolve or explicitly accept the single remaining batch `REVIEW` reason.
2. Re-run branch checks from a non-bot commit so generated MachineData is covered by identity / UX / statistical workflows.
3. Complete Red Team review for dependence and feature-choice decisions.
4. Resolve remaining web-solvable Observation / linked-service debt.
5. Lock machine identity and provisional registration metadata without guessing IDs.
6. Publish only after prepublish gates are satisfied; real-device verification remains a separate final gate.
