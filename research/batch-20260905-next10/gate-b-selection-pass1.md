# SloAnalytica 2026-09-05 Next10 — Gate B Selection pass 1

Status: IN PROGRESS
Started after Gate A PASS: 2026-09-05

Selection decisions below are provisional until dependency audit and observation feasibility are complete. Evidence-only items remain separate from statistical likelihood features.

## Selection principles

- prefer publication-grade, directly observable, well-defined denominators;
- reject or defer empirical-only / hidden-state-only / service-gated items when they cannot be observed reliably;
- avoid aggregate + subset double counting;
- keep exact/lower-bound evidence in EvidenceEngine rather than frequency likelihoods;
- when two candidates represent the same causal information, keep the cleaner / more directly observable one unless a dependency-safe decomposition is available.

## 230 — L アズールレーン THE ANIMATION

PROVISIONAL ADOPT:
- AT first-hit / normal games
- bonus first-hit / normal games
- common bell
- cherry
- watermelon
- Evidence: qualifying lower-bound/exact screens, payout/trophy

PROVISIONAL SUPPORT / NOT YET PRIMARY:
- blue7 bonus: subset of bonus total; retain only if dependency-safe decomposition is useful
- bonus-count-conditioned AT expectation: support/diagnostic candidate; overlaps strongly with AT first-hit path
- state/trigger-specific bonus-hit rates: support unless Observation can cleanly capture state and role opportunities
- Akashi odd/even: evidence/support due restrictive condition

## 231 — スマスロ ドルアーガの塔

PROVISIONAL ADOPT:
- BIG
- REG
- Evidence: REG BGM 2+

DO NOT SIMULTANEOUSLY ADOPT:
- total bonus together with BIG+REG

PROVISIONAL SUPPORT:
- exact overlap bonuses (parallel/diagonal watermelon + BIG; cherry + REG), because they are subsets
- role simultaneous-hit rates, DC treasure, AT-REG point add pending Observation burden

## 232 — スマスロ 東京リベンジャーズ

PROVISIONAL ADOPT:
- AT first-hit / normal games
- common bell / normal games only
- middle cherry only where published setting points are explicit; missing stages must remain missing
- Evidence: eligible end screens / lens evidence

PROVISIONAL SUPPORT:
- first-hit total: overlaps AT/CZ causal family
- MIDNIGHT MODE / Kisaki conspiracy
- cycle/noise and REVENGE-freeze conditionals
- mode-transition distributions

Dependency intent: AT first-hit + common bell should form the primary frequency core unless later analysis shows first-hit total adds independent information safely.

## 233 — スマスロ バベル

PROVISIONAL ADOPT:
- BIG
- REG
- weak-cherry bonus hit
- strong-cherry bonus hit
- scorpion 3rd/6th bonus hit

REJECT AS SETTING FEATURE:
- scorpion 10th hit: 100% all settings
- other scorpion hit: 0.4% all settings

PROVISIONAL SUPPORT:
- scorpion→heaven-prep transition
- Normal-B residence/transition
- urban-legend transition

DO NOT SIMULTANEOUSLY ADOPT:
- total bonus together with BIG+REG

## 234 — スマスロ 新鬼武者3

PROVISIONAL ADOPT:
- AT first-hit
- Evidence: AT-end / Entertrophy / Oni Bonus / ending-voice lower-bound/exact observations

DEFER / REJECT FOR NOW:
- common bell: EMPIRICAL / publication-grade table unavailable

PROVISIONAL SUPPORT:
- reach-eye/direct-hit-related role
- weak-role→Onigiri Charge, pending exact full-table publication + Observation feasibility

## 235 — L主役は銭形5

PROVISIONAL ADOPT:
- bonus first-hit
- Deka-me direct hit, with strict non-true-foreshadowing denominator
- Evidence: payout numbers, Nagi stamp, hidden Nagi voice when observable

CAUTION:
- hidden voice is service-gated evidence and may require real-device verification for history/reopen behavior, but that does not block Evidence semantics.

## 236 — スマスロ とある科学の超電磁砲2

PROVISIONAL ADOPT:
- AT first-hit
- CZ total
- Evidence: AT-end / Fujimaru Coin lower-bound/exact observations

DO NOT SIMULTANEOUSLY ADOPT WITHOUT DECOMPOSITION:
- CZ total + all type-specific CZs

PROVISIONAL SUPPORT:
- type-specific GJ / upper CZ
- episode direct hit
- state→coin-prep→coin→CZ-success chain
- AT-start stage distribution

## 237 — L 絶対衝激Ⅳ

PROVISIONAL ADOPT:
- AT first-hit
- Evidence: Absolute Zone special-move, end screen, payout, Dynamite trophy, ending voice

PROVISIONAL SUPPORT / ALTERNATIVE:
- bonus first-hit, because bonus→AZ→AT is strongly dependent on AT first-hit; do not naively multiply both
- night / black-high transitions
- direct bonus

Primary Selection preference: AT first-hit over simultaneous AT+bonus likelihood unless a dependency-safe model is explicitly constructed.

## 238 — Lパチスロ 革命機ヴァルヴレイヴ2

PROVISIONAL ADOPT:
- AT first-hit
- BAR-align AT direct-hit rate
- Evidence: purple/silver/gold screens, +22/+44/+66G, payout / exact-setting displays

PROVISIONAL SUPPORT:
- special-table selection due hidden-state inference burden
- ordinary end-screen distribution only if customization OFF can be verified
- round-start / Magius / sub-monitor distributions where context is reliable

REJECT WHEN CONTEXT UNKNOWN:
- probabilistic ordinary end-screen distribution if hall-side customization state is unknown

## 239 — スマスロネオプラネット

PROVISIONAL ADOPT:
- bonus total first-hit / normal games, with 1G-ren excluded according to published contract
- Mode-F non-rare-role high transition **only when setting-change/reset scope is known**
- Evidence: 101/301G constellation, bonus-end screen, Kerotto trophy, payout

ALTERNATIVE, NOT SIMULTANEOUS CORE:
- BIG + REG instead of total bonus. Gate B dependency scoring will choose aggregate vs components; do not use total and both components together.

## Dependency audit tasks before Gate B PASS

1. choose parent-vs-component representation for Druaga, Babel, Railgun2 and Neo Planet;
2. choose primary-vs-support representation for Azur Lane AT/bonus-count family, Tokyo Revengers first-hit/CZ family and Zettai Shogeki IV bonus/AT family;
3. verify whether role-triggered conditional rates can be observed without denominator contamination;
4. separate EvidenceEngine items from likelihood features in final Selection schema;
5. estimate information value vs counting burden for each support candidate;
6. produce final ADOPT / SUPPORT / REJECT table with explicit reasons.
