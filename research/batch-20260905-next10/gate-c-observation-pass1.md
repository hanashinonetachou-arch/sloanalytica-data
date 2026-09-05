# SloAnalytica 2026-09-05 Next10 — Gate C Observation pass 1

Status: IN PROGRESS
Started after Gate B PASS: 2026-09-05

Gate C converts final Selection decisions into concrete user-observable input contracts. Only Gate-B ADOPT + EVIDENCE items are materialized here. SUPPORT items remain non-inference references unless promoted by a later audited change.

## Observation contract rules

For every statistical input, define:
- label visible to the user;
- numerator;
- denominator;
- inclusion/exclusion scope;
- reset/session scope;
- acquisition method;
- empty vs entered-zero behavior;
- feasibility on real device.

For Evidence items, define:
- exact selectable outcome(s);
- whether the meaning is lower-bound / exact / denial / parity indication;
- context where the meaning is valid;
- whether history/reopen behavior is needed.

## 230 — L アズールレーン THE ANIMATION

Primary statistical section
- 通常ゲーム数: denominator for AT/bonus/small-role features; user-entered or linked-service value if machine-specific field is verified later.
- AT初当り回数: numerator = qualifying AT initial hits.
- ボーナス初当り回数: numerator = qualifying normal-play bonus initial hits.
- 共通ベル回数: normal-play eligible count only.
- チェリー回数: normal-play eligible count.
- スイカ回数: normal-play eligible count.

Evidence section
- Sea-battle bonus failure / AT-end screen evidence outcomes only where setting meaning is established.
- Kaga Battle evidence outcomes only; exclude fixed/non-setting scenarios.
- Payout/trophy lower-bound/exact observations.

Observation cautions
- Bonus-count-conditioned AT expectation and Blue7 subset are not inputs in v1 Observation.
- Empty means unobserved/not entered; explicit zero means observed zero for the applicable interval.

## 231 — スマスロ ドルアーガの塔

Primary statistical section
- 対象ゲーム数.
- BIG回数.
- REG回数.

Evidence section
- REG BGM `イシターの復活` = setting 2+ observation.

Observation cautions
- Do not add total bonus input to inference when BIG and REG are used.
- UniMemo result fields may later prefill counters only after exact machine-specific labels/reset semantics are verified.

## 232 — スマスロ 東京リベンジャーズ

Primary statistical section
- 通常ゲーム数.
- 東京卍RUSH初当り回数.
- 通常時共通ベル回数.
- 中段チェリー回数 only for published setting stages; if complete probability vector is unavailable for implementation, keep this field out of v1 inference rather than interpolate.

Evidence section
- Eligible TMC/AT end-screen outcomes.
- Ending top-lens evidence outcomes.

Observation cautions
- Common bell denominator is normal play only; AT games are excluded.
- My Counter/My Slot may be used as an acquisition aid where field identity is confirmed, but manual input remains valid.

## 233 — スマスロ バベル

Primary statistical section
- 対象ゲーム数.
- BIG回数.
- REG回数.
- 弱チェリー成立回数 + 弱チェリー同時当選回数.
- 強チェリー成立回数 + 強チェリー同時当選回数.
- サソリ3・6回目到達回数 + その契機でのボーナス当選回数.

Observation cautions
- Scorpion accumulated count may be checked on the sub display, but trials count only eligible 3rd/6th occurrences.
- 10th scorpion and common-probability other occurrences are not setting inputs.

## 234 — スマスロ 新鬼武者3

Primary statistical section
- 通常ゲーム数 / AT eligible denominator according to published initial-hit convention.
- 蒼剣RUSH AT初当り回数.

Evidence section
- AT終了画面.
- Entertrophy.
- Oni Bonus / all-cast lower-bound/exact outcomes where meaning is established.
- Ending rare-role voice evidence.

Observation cautions
- Common bell is intentionally absent from v1 inference.

## 235 — L主役は銭形5

Primary statistical section
- 通常ゲーム数 / bonus-AT first-hit denominator according to published convention.
- ボーナス/AT初当り回数.
- 非本前兆中デカ目成立機会数.
- 非本前兆中デカ目からの直撃回数.

Evidence section
- Payout exact/lower-bound numbers.
- Bonus-end Nagi stamp.
- 打-WIN LITE hidden Nagi voice.

Observation cautions
- Deka-me denominator must exclude true-foreshadowing periods.
- Deka Time end screen belongs to mode/reference UI, not setting evidence.

## 236 — スマスロ とある科学の超電磁砲2

Primary statistical section
- 通常ゲーム数.
- AT初当り回数.
- CZ合算回数.

Evidence section
- AT終了画面 setting-evidence outcomes only.
- Fujimaru Coin bronze/silver/gold/DANGER/rainbow outcomes.

Observation cautions
- Type-specific CZ counts may be displayed as reference counters later but must not enter the same v1 likelihood simultaneously with CZ total.

## 237 — L 絶対衝激Ⅳ

Primary statistical section
- 通常ゲーム数.
- Platonic Time AT初当り回数.

Evidence section
- Absolute Zone special move evidence.
- Platonic Bonus end screen.
- Payout display.
- Dynamite trophy.
- Ending rare-role evidence.

Observation cautions
- Bonus first-hit may be shown as reference/history but is not a simultaneous inference input in v1.

## 238 — Lパチスロ 革命機ヴァルヴレイヴ2

Primary statistical section
- 通常ゲーム数 / AT first-hit denominator according to published contract.
- AT初当り回数.
- BAR揃い契機対象回数 + BAR揃いAT直撃回数 only if the opportunity denominator is directly countable under the published definition.

Evidence section
- Purple/silver/gold lower-bound screens.
- AT/上位AT end exact-setting display/photo.
- AT-start +22/+44/+66G.
- Payout lower-bound/exact observations.

Reference-only conditional section
- Ordinary end-screen distribution may be retained as reference only when customization OFF is known; not a default inference input.

Observation cautions
- Customization state must never be assumed.

## 239 — スマスロネオプラネット

Primary statistical section
- 対象通常ゲーム数 with published 1G-ren exclusion.
- ボーナス合算初当り回数.
- Mode-F eligible non-rare-role game count only when reset/setting-change scope is known.
- Mode-F non-rare-role high-transition count.

Evidence section
- 101/301G touch constellation.
- Bonus-end screen.
- Kerotto trophy.
- Payout evidence.

Observation cautions
- BIG/REG may be collected for reference/history, but the v1 inference core uses total bonus only.
- Mode-F fields remain hidden/disabled unless reset/setting-change applicability is explicitly confirmed by the user/session context.

## Cross-machine UI/semantics locks

- Empty input = not observed / not entered and does not participate.
- Entered zero = observed zero within a known denominator and does participate where mathematically valid.
- Evidence observations do not require a statistical denominator.
- SUPPORT candidates are not silently materialized as active likelihood inputs.
- Any linked-service auto-fill or quick-input helper must preserve the same denominator/reset contract as manual input.
- User-facing help must explain exclusions that are easy to violate: Tokyo Revengers AT games, Zenigata5 true-foreshadowing periods, VVV2 customization state, Neo Planet reset-only Mode F.

## Gate C remaining work

1. map each observation to concrete MachineData section/input IDs and UI labels;
2. define exact Evidence option vocabulary for every machine;
3. decide which SUPPORT/reference counters are worth displaying without entering inference;
4. run observation-feasibility red-team audit, including empty/zero semantics and linked-service/manual equivalence;
5. only after Gate C PASS proceed to Gate D / UI Design + MachineData.
