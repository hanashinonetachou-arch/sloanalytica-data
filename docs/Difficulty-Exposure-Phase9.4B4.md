# Difficulty Exposure Phase 9.4B-4

## Purpose
Apply the Phase 9.4B-3 exposure model to real existing machines without inventing event frequencies.

## S_CODE_GEASS_3_CC_FS
- Target game basis: `NORMAL_AT_GAMES` / 通常・ATゲーム数.
- Quality: `EXACT`, cross-machine comparable.
- `FEAT_CHERRY_WATERMELON_MULTINOMIAL`: `per_game × 1.0`, `EXACT`.
- `FEAT_RB_INFINITE_AT_BINOMIAL`: unresolved. Current ResearchData does not define qualifying RB-after C.C.-high games per analysis game.
- `FEAT_AT_END_SCREEN_MULTINOMIAL`: unresolved. Current ResearchData does not define AT-end observations per analysis game.

Therefore Code Geass has one final-calibration-usable numeric feature, but machine-level coverage is still partial.

## L_TOKYO_GHOUL
- Target game basis: `AT_INITIAL_TRIAL_GAMES_PROVISIONAL` / AT初当り集計ゲーム数.
- Quality: `PROVISIONAL`, not cross-machine comparable for the final public scale.
- `FEAT_AT_INITIAL`: `per_game × 1.0`, `PROVISIONAL`.
- `FEAT_CZ_EXCLUSIVE`: provisional setting-rate exposure. If `B` is provisional AT-initial trial games, `D` is CZ-lottery-eligible games, and `r` is the published CZ probability per eligible game, the expected relationship from the current 8G/CZ subtraction rule is `B = D(1 + 8r)`, hence `D/B = 1/(1+8r)`. This is mathematically derived but inherits the provisional base definition, so its quality remains `PROVISIONAL`.
- `FEAT_AT_RETURN`: unresolved.
- `FEAT_CZ_WITHIN_100`: unresolved.

Tokyo Ghoul may be used only for explicitly labelled exploratory scoring until its base game definition becomes final and the remaining event exposures are established.

## Readiness rule strengthened
Final cross-machine calibration now requires all of the following:
1. ResearchData and SelectionData exist.
2. Included numeric features have explicit exposure.
3. Exposure quality is `EXACT` or `DERIVED`.
4. Target game basis quality is `EXACT` or `DERIVED`.
5. Target game basis is explicitly marked cross-machine comparable.

`PROVISIONAL` data can never become READY merely because a numeric rate was filled in.
