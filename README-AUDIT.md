# SloAnalytica Data Prototype Phase 9.4B-4

## Scope
Apply Difficulty Exposure definitions to existing Code Geass 3 C.C.&Kallen ver. and Tokyo Ghoul data, and strengthen final cross-machine calibration readiness rules.

## Applied exposure
### S_CODE_GEASS_3_CC_FS
- Target basis: NORMAL_AT_GAMES / 通常・ATゲーム数
- Basis quality: EXACT / cross-machine comparable
- FEAT_CHERRY_WATERMELON_MULTINOMIAL: EXACT per_game × 1.0
- FEAT_RB_INFINITE_AT_BINOMIAL: unresolved, not inferred
- FEAT_AT_END_SCREEN_MULTINOMIAL: unresolved, not inferred

### L_TOKYO_GHOUL
- Target basis: AT_INITIAL_TRIAL_GAMES_PROVISIONAL / AT初当り集計ゲーム数
- Basis quality: PROVISIONAL / not final cross-machine comparable
- FEAT_AT_INITIAL: PROVISIONAL per_game × 1.0
- FEAT_CZ_EXCLUSIVE: PROVISIONAL setting_rate derived from the current 8G/CZ denominator rule
- FEAT_AT_RETURN: unresolved
- FEAT_CZ_WITHIN_100: unresolved

## Readiness strengthening
Final calibration now requires:
- explicit exposure on all included numeric Features,
- exposure quality EXACT or DERIVED,
- target game basis quality EXACT or DERIVED,
- target game basis explicitly cross-machine comparable.

PROVISIONAL values never make a machine READY for the final public score scale.

## Diagnostic score outputs
These are NOT final cross-machine scores because coverage is incomplete/provisional.
- Code Geass partial (small-role only): 1500G=10, 3000G=16, 7000G=26; coverage 1/3.
- Tokyo Ghoul exploratory (PROVISIONAL AT initial + CZ only): 1500G=8, 3000G=14, 7000G=23; coverage 2/4.

## Tests
79/79 passed.
