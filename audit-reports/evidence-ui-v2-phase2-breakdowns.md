# Evidence UI v2 Phase 2 fixed breakdowns

- Research reopen: 93 inputs / 86 machines
- Legacy migration: 88 interactive inputs / 81 machines
- Special-behavior Research reopen (non-Legacy): 1 input / 1 machine
- Feature/Evidence sharing candidates: 6 machines / 25 inputs
- Unclassified actual observation contexts: 0 inputs
- Resolved observation groups with group-unit layout decision: 287

## Invariants

- **PASS** RESEARCH_REOPEN_INPUTS: expected 93, actual 93
- **PASS** LEGACY_INTERACTIVE_MIGRATION_INPUTS: expected 88, actual 88
- **PASS** SPECIAL_BEHAVIOR_REOPEN_INPUTS: expected 1, actual 1
- **PASS** FEATURE_EVIDENCE_SHARING_MACHINES: expected 6, actual 6
- **PASS** UNCLASSIFIED_ACTUAL_OBSERVATION_INPUTS: expected 0, actual 0

## Special-behavior reopen separated from Legacy

- **LB_1000CHAN_ALPHA_L3** LBパチスロ1000ちゃんA: INP_RE_SET_H_COUNT / 設定H特殊挙動

## Feature / Evidence sharing candidates

- **L_DISCUP_ULTRA_REMIX_XR** A-SLOT+ ディスクアップ ULTRAREMIX: INP_REG_HINT_2PLUS, INP_REG_HINT_5PLUS, INP_REG_HINT_6
- **L_SHIN_EVANGELION** L パチスロ シン・エヴァンゲリオン: INP_REI_PIC_MOON, INP_REI_PIC_LONG_HAIR, INP_BONUS_END_PURPLE1, INP_BONUS_END_PURPLE2, INP_BONUS_END_PURPLE3, INP_BONUS_END_SILVER, INP_BONUS_END_GOLD, INP_BONUS_END_RAINBOW
- **L_INUYASHA2_FK** Ｌ 犬夜叉2: INP_RF_WHITE_BIG_END_SESSHOMARU, INP_RF_WHITE_BIG_END_PAIR, INP_RF_BLUE_BIG_END_INUYASHA, INP_RF_BLUE_BIG_END_PAIR
- **L_KAGUYA_SAMA_JA** Lパチスロ かぐや様は告らせたい: INP_KAGUYA_END_PURPLE, INP_KAGUYA_END_SILVER, INP_KAGUYA_END_GOLD
- **S_MHW_ICEBORNE_ZF** パチスロ モンスターハンターワールド：アイスボーンTM: INP_CONFIRM_MORA
- **S_MILKY_HOMES_GNB** パチスロ 探偵オペラ ミルキィホームズR 大収穫祭!!!!: INP_END_COPPER, INP_END_GOLD, INP_END_STAR, INP_END_RAINBOW, INP_MMB_PANEL_RED, INP_MMB_PANEL_RAINBOW

## Research reopen reasons

- GENERIC_EVIDENCE_NEEDS_OBSERVATION_CONTEXT: 4
- LEGACY_ABSTRACTION_NEEDS_OBSERVATION_CONTEXT: 88
- SPECIAL_BEHAVIOR_NEEDS_OBSERVATION_CONTEXT: 1

## Layout policy

- Resolved inputs are grouped by observationContext.
- The longest normalized title in the whole group determines ONE_COLUMN vs TWO_COLUMN_ELIGIBLE.
- Research-reopen / unclassified contexts are intentionally left undecided.
