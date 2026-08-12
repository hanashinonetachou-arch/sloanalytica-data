# Phase 10E-R1 Initial D 2nd Real-device Fix Report

Date: 2026-08-12
Machine: L_INITIAL_D_2ND / スマスロ頭文字D 2nd

## Real-device findings
1. Empty `参考記録` section below `初当り`.
2. `AT中LB終了画面` inputs did not affect setting inference.

## Root causes and fixes
### Empty reference section
`INP_AT_INITIAL_COUNT` had category `DISPLAY_ONLY_INITIAL_HIT` while its parent `INP_MY_SAMMY_NORMAL_GAMES` belonged to `PRIMARY_INITIAL_HIT`. The app's input rendering left the generated reference section empty. The AT reference input now remains DISPLAY_ONLY for inference, but is grouped under `PRIMARY_INITIAL_HIT` so the generated UI contains no standalone empty reference section.

### AT-LB end-screen inference
The generated multinomial Feature had `inputTransform: sum_inputs_to_trials` but lacked the explicit denominator mapping used by the app FeatureEngine. Selection now declares `denominatorInputId` and `denominatorInputIds` for all four normal end-screen counters. Builder/Schema/Validator were generalized to preserve and validate `denominatorInputIds`.

## Generated Feature contract
`FEAT_AT_LB_END_SCREEN` now has:
- `probabilityEngineUsage: true`
- `modelType: multinomial`
- `inputTransform: sum_inputs_to_trials`
- `denominatorInputId: INP_AT_LB_END_DEFAULT_COUNT`
- `denominatorInputIds`: default / odd / even / swimsuit counters
- four conditioned category probabilities (red/gold remain Evidence)

## Verification
- Initial D + Builder focused tests: PASS
- Full test suite: 114 / 114 PASS
- `npm run audit`: 10 machines / 0 warnings
- Published package SHA-256: d4046ecd6dd50a3c669f058991f1d05ddb74222bbab3934ce64852884ada32b5
