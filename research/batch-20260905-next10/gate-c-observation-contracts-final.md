# SloAnalytica 2026-09-05 Next10 — Gate C Observation Contracts Final

Status: FINAL / CANDIDATE FOR GATE C PASS
Date: 2026-09-05

This document converts Gate-B Selection into the concrete observation contract that Gate D must materialize. It follows the current `machine-package.json` convention: input IDs are stable machine-local identifiers; statistical features use explicit numerator/denominator inputs; hard setting evidence is kept in EvidenceEngine; UI must preserve `emptyMeansUnobserved=true` and `observedZeroAllowed=true`.

## Global locks

- Empty = not observed / not entered; the feature does not participate.
- Explicit 0 = observed zero within a known eligible population; it participates where mathematically valid.
- No SUPPORT item is silently activated as a likelihood feature.
- No aggregate and its component counts are multiplied simultaneously.
- EvidenceEngine hard confirmation/lower-bound observations are separate from ordinary probability multiplication.
- Indication-only outcomes without complete setting-conditioned distributions are not converted into synthetic likelihoods.
- Linked-service values may populate a manual field only after exact field identity, eligible population and reset/session semantics are shown equivalent.
- Missing setting stages are structural: Druaga `SET_1/2/5/6`; Zenigata5 `SET_2/3/4/5/6`; VVV2 `SET_1/2/4/5/6`; Neo Planet `SET_1/2/4/5/6`. No interpolation.

## 230 — L アズールレーン THE ANIMATION

Provisional machineId: `L_AZURLANE_THE_ANIMATION_KN`
Settings: `SET_1..SET_6`

Primary section `UI_NORMAL_PRIMARY`
- `INP_NORMAL_GAMES` — `通常ゲーム数` — integer/G — shared denominator for adopted normal-play features.
- `INP_AT_INITIAL_COUNT` — `AT初当り` — counter/回 — numerator over `INP_NORMAL_GAMES`.
- `INP_BONUS_INITIAL_COUNT` — `ボーナス初当り` — counter/回 — numerator over `INP_NORMAL_GAMES`.
- `INP_COMMON_BELL_COUNT` — `共通ベル` — counter/回 — numerator over the same eligible normal-play interval.
- `INP_CHERRY_COUNT` — `チェリー` — counter/回 — numerator over the same eligible normal-play interval.
- `INP_WATERMELON_COUNT` — `スイカ` — counter/回 — numerator over the same eligible normal-play interval.

Evidence inputs
- `INP_EVI_TAMACHAN_TROPHY` — hard trophy observations only. Semantic vocabulary: `SET_2_PLUS`, `SET_3_PLUS`, `SET_4_PLUS`, `SET_5_PLUS`, `SET_6_EXACT`; Gate D must attach only source-traceable visual labels.
- `INP_EVI_AZUR_END_HARD` — sea-battle-bonus failure / AT-end hard lower-bound outcomes only where the exact visual label is source-traceable. Indication-only screens remain reference/help, not hard EvidenceEngine entries.
- `INP_EVI_KAGA_HARD` — Kaga Battle hard `SET_5_PLUS` / `SET_6_EXACT` outcomes only when the exact source context is preserved.

Reference-only / omitted from v1 inference: Blue7 subset, bonus-count-conditioned AT expectation, Akashi parity observation, state/trigger-specific promotion rates.
Acquisition: manual first; `ぱちログ` may assist only after exact field/reset equivalence is verified.
Reset scope: current observation session / same setting interval.

## 231 — スマスロ ドルアーガの塔

Provisional machineId: `L_DRUAGA_NO_TOU_ZA`
Settings: `SET_1`, `SET_2`, `SET_5`, `SET_6`

Primary section `UI_NORMAL_BONUS`
- `INP_NORMAL_GAMES` — `通常ゲーム数` — integer/G — shared denominator.
- `INP_BIG_COUNT` — `BIG` — counter/回 — numerator over `INP_NORMAL_GAMES`.
- `INP_REG_COUNT` — `REG` — counter/回 — numerator over `INP_NORMAL_GAMES`.

Evidence
- `INP_EVI_REG_BGM` — multi_enum; option `ISHITAR_NO_FUKKATSU` label `イシターの復活` => `SET_2_PLUS`.

Not materialized as simultaneous likelihood: bonus total, overlap-bonus subsets, role simultaneous-hit rates, DC treasure, AT-REG point add.
Acquisition: manual; UniMemo prefill is blocked until exact machine-specific field/reset semantics are verified.

## 232 — スマスロ 東京リベンジャーズ

Provisional machineId: `L_SMASLO_TOKYO_REVENGERS_ZF`
Settings: `SET_1..SET_6`

Primary section `UI_NORMAL_PRIMARY`
- `INP_NORMAL_GAMES` — `通常ゲーム数` — integer/G — **normal play only**.
- `INP_AT_INITIAL_COUNT` — `東京卍RUSH初当り` — counter/回 — numerator over eligible normal games.
- `INP_COMMON_BELL_COUNT` — `通常時共通ベル` — counter/回 — numerator over `INP_NORMAL_GAMES`; AT games are excluded because push-order navigation can create an indistinguishable bell.

`中段チェリー` is not materialized in v1 unless Gate D has a complete publication-grade probability vector for every implemented setting stage. No interpolation.

Evidence
- `INP_EVI_TMC_AT_END_HARD` — only lower-bound/exact outcomes whose ordinary end-screen context is source-traceable; fixed ending outcomes are excluded.
- `INP_EVI_ENDING_LENS_HARD` — exact hard outcome(s), including setting-6 exact only where source context is explicit.

Reference-only: first-hit total, MIDNIGHT MODE, Kisaki conspiracy, cycle/noise, REVENGE freeze, mode transitions.
Acquisition: manual or exact-equivalent My Counter/My Slot field. Reset scope must stay current-player/current-session equivalent.

## 233 — スマスロ バベル

Provisional machineId: `L_BABEL_BA`
Settings: `SET_1..SET_6`

Primary section `UI_NORMAL_BONUS`
- `INP_NORMAL_GAMES` — `通常ゲーム数` — integer/G.
- `INP_BIG_COUNT` — `BIG` — counter/回 — denominator `INP_NORMAL_GAMES`.
- `INP_REG_COUNT` — `REG` — counter/回 — denominator `INP_NORMAL_GAMES`.

Conditional sections
- `INP_WEAK_CHERRY_TRIALS` — `弱チェリー成立` — counter/回.
- `INP_WEAK_CHERRY_BONUS_HITS` — `弱チェリーからボーナス当選` — counter/回; denominator `INP_WEAK_CHERRY_TRIALS`.
- `INP_STRONG_CHERRY_TRIALS` — `強チェリー成立` — counter/回.
- `INP_STRONG_CHERRY_BONUS_HITS` — `強チェリーからボーナス当選` — counter/回; denominator `INP_STRONG_CHERRY_TRIALS`.
- `INP_SCORPION_36_TRIALS` — `サソリ3・6回目の成立機会` — counter/回; only eligible 3rd/6th occurrences.
- `INP_SCORPION_36_BONUS_HITS` — `サソリ3・6回目からボーナス当選` — counter/回; denominator `INP_SCORPION_36_TRIALS`.

Validation: hit count must not exceed its trial count. Scorpion 10th occurrence and other all-setting-common rates are not inference inputs. Bonus total is not simultaneous with BIG+REG.
Acquisition: manual/sub-display aid; UniMemo only after exact field equivalence.

## 234 — スマスロ 新鬼武者3

Provisional machineId: `L_SHIN_ONIMUSHA_3_SA`
Settings: `SET_1..SET_6`

Primary section
- `INP_NORMAL_GAMES` — `通常ゲーム数` — integer/G; eligible first-hit denominator.
- `INP_AT_INITIAL_COUNT` — `蒼剣RUSH初当り` — counter/回.

Hard Evidence vocabulary
- `INP_EVI_AT_END_HARD` — hard lower-bound/exact AT-end outcomes only.
- `INP_EVI_ENTERTROPHY` — `BRONZE=SET_2_PLUS`, `SILVER=SET_3_PLUS`, `GOLD=SET_4_PLUS`, `AUTUMN_RED=SET_5_PLUS`, `RAINBOW=SET_6_EXACT`.
- `INP_EVI_ONI_BONUS_HARD` — only source-confirmed hard lower-bound/exact character outcomes.
- `INP_EVI_ENDING_VOICE_HARD` — only denial/lower-bound/exact outcomes with exact source semantics; ordinary odd/even indications remain non-hard reference unless a complete probability model exists.

Common bell is intentionally absent from v1 inference (`EMPIRICAL`). Weak-role/Onigiri Charge stays SUPPORT.

## 235 — L主役は銭形5

Provisional machineId: `L_ZENIGATA_5_L2`
Settings: `SET_2`, `SET_3`, `SET_4`, `SET_5`, `SET_6`

Primary section
- `INP_NORMAL_GAMES` — `通常ゲーム数` — integer/G.
- `INP_INITIAL_COUNT` — `ボーナス／AT初当り` — counter/回 — denominator according to the published normal-play first-hit contract.

Conditional Deka-me section
- `INP_DEKAME_ELIGIBLE_TRIALS` — `非本前兆中デカ目成立` — counter/回; **true-foreshadowing periods excluded**.
- `INP_DEKAME_DIRECT_HITS` — `非本前兆中デカ目からの直撃` — counter/回; denominator `INP_DEKAME_ELIGIBLE_TRIALS`.

Hard Evidence
- `INP_EVI_PAYOUT` options: `333`, `1333` => `SET_3_PLUS`; `444`, `1444` => `SET_4_PLUS`; `555`, `1555` => `SET_5_PLUS`; `666`, `1666` => `SET_6_EXACT`.
- `INP_EVI_NAGI_STAMP` — only source-traceable hard stamp meanings; visual wording fixed at Gate D from source.
- `INP_EVI_HIDDEN_NAGI_VOICE` semantic options: `SET_2_PLUS`, `SET_3_PLUS`, `SET_4_PLUS`, `SET_5_PLUS`, `SET_6_EXACT`, gated by 打-WIN LITE observation. Exact device wording/history behavior remains real-device verification, not guessed.

Deka Time end screen is reference/mode information, not setting evidence.

## 236 — スマスロ とある科学の超電磁砲2

Provisional machineId: `L_TOARU_KAGAKU_NO_RAILGUN_2_FV`
Settings: `SET_1..SET_6`

Primary section
- `INP_NORMAL_GAMES` — `通常ゲーム数` — integer/G.
- `INP_AT_INITIAL_COUNT` — `AT初当り` — counter/回.
- `INP_CZ_TOTAL_COUNT` — `CZ合算` — counter/回.

Hard Evidence
- `INP_EVI_AT_END_HARD` — lower-bound/exact setting outcomes only; the non-setting return/引き戻し screen is excluded.
- `INP_EVI_FUJIMARU_COIN` options: `BRONZE=SET_2_PLUS`, `SILVER=SET_3_PLUS`, `GOLD=SET_4_PLUS`, `DANGER=SET_5_PLUS`, `RAINBOW=SET_6_EXACT`.

Type-specific CZs, Episode direct hit, state→coin-prep→coin→CZ chain and AT-start stage remain SUPPORT/reference; they do not multiply with CZ total in v1.

## 237 — L 絶対衝激Ⅳ

Provisional machineId: `L_ZETTAI_SHOGEKI_FORCE_FH`
Settings: `SET_1..SET_6`

Primary section
- `INP_NORMAL_GAMES` — `通常ゲーム数` — integer/G.
- `INP_AT_INITIAL_COUNT` — `Platonic Time初当り` — counter/回.

Hard Evidence
- `INP_EVI_AZ_SPECIAL_MOVE` — only source-confirmed hard special-move outcomes.
- `INP_EVI_PB_END_HARD` — only hard PB-end outcomes.
- `INP_EVI_PAYOUT` — only source-confirmed lower-bound/exact numbers.
- `INP_EVI_DYNAMITE_TROPHY` options: `BRONZE=SET_2_PLUS`, `SILVER=SET_3_PLUS`, `GOLD=SET_4_PLUS`, `LADYBUG=SET_5_PLUS`, `RAINBOW=SET_6_EXACT`.
- `INP_EVI_ENDING_HARD` — hard ending rare-role outcome(s) only.

Bonus first-hit, night/black-high transitions and direct bonus remain SUPPORT/reference and are not simultaneous likelihood inputs.

## 238 — Lパチスロ 革命機ヴァルヴレイヴ2

Provisional machineId: `L_KAKUMEIKI_VALVRAVE_2_JF`
Settings: `SET_1`, `SET_2`, `SET_4`, `SET_5`, `SET_6`

Primary section
- `INP_NORMAL_GAMES` — `通常ゲーム数` — integer/G; published AT first-hit eligible population.
- `INP_AT_INITIAL_COUNT` — `AT初当り` — counter/回.

BAR-alignment direct-hit is **not materialized as active v1 inference** until the exact opportunity denominator is directly observable and publication-defined. It remains SUPPORT, preventing a guessed denominator.

Hard Evidence
- `INP_EVI_END_HARD` — purple/silver/gold and exact setting end-display/photo outcomes only with source-traceable semantics.
- `INP_EVI_AT_START_ADD` options: `PLUS_22=SET_2_PLUS`, `PLUS_44=SET_4_PLUS`, `PLUS_66=SET_6_EXACT`.
- `INP_EVI_PAYOUT` — only source-confirmed hard payout outcomes.

Ordinary end-screen distribution is reference-only and must stay disabled unless hall-side customization is explicitly known OFF. Customization is never inferred from absence/presence of a screen.

## 239 — スマスロネオプラネット

Provisional machineId: `L_NEO_PLANET_SLED`
Settings: `SET_1`, `SET_2`, `SET_4`, `SET_5`, `SET_6`

Primary bonus section
- `INP_NORMAL_GAMES_EXCL_1GREN` — `対象通常ゲーム数（1G連除外）` — integer/G.
- `INP_BONUS_INITIAL_COUNT` — `ボーナス合算初当り` — counter/回; denominator `INP_NORMAL_GAMES_EXCL_1GREN`.

Conditional reset-only Mode F section
- `INP_MODE_F_ELIGIBLE_GAMES` — `Mode F対象ゲーム` — integer/G; enabled only after explicit `setting-change/reset applicable` session flag.
- `INP_MODE_F_HIGH_TRANSITIONS` — `非レア役から高確移行` — counter/回; denominator `INP_MODE_F_ELIGIBLE_GAMES`.

Hard Evidence
- `INP_EVI_TOUCH_CONSTELLATION` — `RINO=SET_4_PLUS`, `KEROTTO_KERORUN=SET_6_EXACT` for the published 101/301G touch context only.
- `INP_EVI_BONUS_END_HARD` — hard bonus-end outcomes only, including source-confirmed 2+/6 outcomes.
- `INP_EVI_KEROTTO_TROPHY` options: `BRONZE=SET_2_PLUS`, `GOLD=SET_4_PLUS`, `KEROTTO_PATTERN=SET_5_PLUS`, `RAINBOW=SET_6_EXACT`.
- `INP_EVI_PAYOUT` — source-confirmed hard payout numbers only.

BIG/REG are optional reference/history counters only in v1; they do not enter likelihood together with total bonus.
SloPla NEXT autofill is blocked until the exact Neo Planet machine-specific result field/reset semantics are verified.

## UI materialization rules for Gate D

- Shared denominators appear once per section, following current bonus-machine convention.
- Counter widgets: quickAdd `[1]`; denominator number widgets: direct input + quickAdd `[50]` where suitable.
- All statistical widgets: `emptyMeansUnobserved=true`, `observedZeroAllowed=true`.
- Conditional numerator > denominator is a validation error.
- Conditional sections must include plain-Japanese exclusion help directly in the section, not only metadata.
- Hard Evidence inputs should be `multi_enum` unless the source semantics are mutually exclusive and a single choice is guaranteed.
- Reference-only items must be visually marked `参考` and must have no probabilityEngine usage.
- Service-gated inputs must not imply that the service is required; manual input remains the canonical observation path.

## Gate C conclusion candidate

All Gate-B ADOPT statistical features now have a concrete observable input contract or have been deliberately deferred when the denominator could not be observed safely. Hard Evidence vocabulary is restricted to source-supported semantics; indication-only or context-ambiguous outcomes are not promoted. This contract is ready for Observation Red-Team audit.