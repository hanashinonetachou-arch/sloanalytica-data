# SloAnalytica 2026-09-07 Next10 — Gate B semantic decision matrix

Status: **PASS after Gate C reconsideration**  
Scope: exact 10 machines / 38 Research Features

## Final totals

- evaluated: 38
- selected: 34
- rejected: 4
- Research Evidence dispositioned: 95

## Final EXCLUDE set

- `L_FIRE_FORCE_2 / RF_TRAP_SMALLV_CONVERT` — settings 2/3 individual likelihoods are unpublished, so a full six-setting likelihood cannot be built.
- `L_FIRE_FORCE_2 / RF_TRAP_SMALLV_BONUS_AFTER_CONVERT` — settings 2/3 are unpublished and the event is conditional on the preceding conversion event.
- `L_KABANERI_UNATO_KESSEN_XX / RF_SHUNJO_3000PT` — settings 2–5 share the same public rate and useful middle-setting discrimination is limited.
- `LB_TRIPLE_CROWN_SEVEN_FG / RF_PLUM` — Gate C confirmed plum and cherry are mutually exclusive outcomes on the same normal-game denominator. Independent Binomial use of both would reuse the same normal-game information and overstate confidence. Cherry has the larger published setting gap and remains the representative small-role Feature; plum remains in Research but is excluded from inference.

## Dependency controls

- Umineko2 `RF_REG_INITIAL` is suppressed by `FEAT_BONUS_INITIAL`.
- Kabaneri `RF_ST_INITIAL` is suppressed by `FEAT_BONUS_INITIAL`.
- Jormungand `RF_AT_INITIAL` is suppressed by `FEAT_CZ_INITIAL`.
- Shinuchi Yoshimune `RF_CZ_INITIAL` is suppressed by `FEAT_AT_INITIAL`.
- Kyokou Suiri `RF_BONUS_INITIAL` is suppressed by `FEAT_CZ_INITIAL`.
- Akudama Drive `RF_BONUS_INITIAL` is suppressed by `FEAT_CZ_INITIAL`; `RF_AT_INITIAL` is suppressed by both `FEAT_CZ_INITIAL` and `FEAT_BONUS_INITIAL`.
- Gundam Unicorn `RF_AT_INITIAL` is suppressed by `FEAT_CZ_INITIAL`.

## Same-observation partition

Jormungand `RF_BONUS_END_SCREEN` keeps the non-hard numeric categories as a multinomial Feature. `HANDGUN_SHELL`, `OLD_KOKO_TEAM`, `KASPER`, and `GOLDEN_SCARECROW` are excluded from numeric likelihood and handled only as Hard Evidence so the same end-screen observation is not counted twice.

## Gate B contract

All 38 Research Features and all 95 verified Research Evidence candidates have an explicit disposition. Included Features preserve route/state-specific denominators, suppression relationships, and user-facing reasons. Excluded Research candidates remain in Research for traceability.