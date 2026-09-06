# SloAnalytica 2026-09-07 Next10 — Gate B Selection / Dependency Audit checkpoint

## Status

**Gate B / Statistical Selection: PASS**  
**Dependency Audit: PASS**

- exact batch scope: 10/10
- Research Features evaluated: 38/38
- selected Features: 35
- rejected Features: 3
- Research Evidence classified: 95/95
- strict batch ingest: READY_FOR_MACHINE 10 / REVIEW 0 / BLOCKED 0
- public `main`: unchanged

## Rejected numeric Features

1. `L_FIRE_FORCE_2 / RF_TRAP_SMALLV_CONVERT` — setting 2/3 individual likelihoods are unpublished, so a six-setting likelihood cannot be constructed on one consistent basis.
2. `L_FIRE_FORCE_2 / RF_TRAP_SMALLV_BONUS_AFTER_CONVERT` — same incomplete setting table, plus conditional dependence on the preceding cross-pattern conversion event.
3. `L_KABANERI_UNATO_KESSEN_XX / RF_SHUNJO_3000PT` — settings 2–5 share the same published rate and the rare conditional event contributes little middle-setting discrimination.

These rejections are based on statistical/information structure, not manual-input burden.

## Dependency / double-count controls

- Umineko2: `REG_INITIAL` is Fallback and suppressed by `BONUS_INITIAL` because REG is contained in total bonus incidence.
- Kabaneri: `ST_INITIAL` is Fallback and suppressed by `BONUS_INITIAL` to avoid reusing the same progression information as independent likelihood.
- Jormungand: `AT_INITIAL` is Fallback behind `CZ_INITIAL`. Bonus-end-screen numeric multinomial excludes `HANDGUN_SHELL`, `OLD_KOKO_TEAM`, `KASPER`, and `GOLDEN_SCARECROW`; those four observations are handled only as Hard Evidence.
- Shinuchi Yoshimune: `CZ_INITIAL` is Fallback behind `AT_INITIAL`.
- Kyokou Suiri: `BONUS_INITIAL` is Fallback behind `CZ_INITIAL`.
- Akudama Drive: `BONUS_INITIAL` is suppressed by `CZ_INITIAL`; `AT_INITIAL` is suppressed by both `CZ_INITIAL` and `BONUS_INITIAL`.
- Gundam Unicorn Kakusei DRIVE: `AT_INITIAL` is Fallback behind `CZ_INITIAL`.
- Route/state-conditioned Features keep their own eligible-attempt denominators; normal games are not substituted for conditional trials.
- Triple Crown cherry/plum remain selected at Gate B, but their mutually exclusive same-game structure is explicitly carried forward for Observation/MachineData re-audit. If the downstream model cannot preserve a safe common-denominator/category contract, one must be downgraded before publish.

## Evidence policy

All 95 verified Research Evidence candidates are explicitly carried into SelectionData. Repeated occurrences of the same Hard Evidence are not intended to multiply evidence strength; Observation/UI must preserve presence semantics unless a specific count/threshold contract exists.

Jormungand Kerotto trophy remains Research `REFERENCE`, not Hard Evidence, because the found public semantics are prediction-based rather than verified.

## Next gate

Gate C / Observation must now determine what can actually be observed and counted in real play, including denominator reconstruction, linked-service counters, route-specific eligible attempts, shared natural observations, blank-vs-zero semantics, and evidence input grouping. Selection decisions must not be rewritten merely for UI convenience.
