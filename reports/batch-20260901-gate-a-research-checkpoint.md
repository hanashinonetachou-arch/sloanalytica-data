# Batch 20260901 — Gate A Research Checkpoint

Updated: 2026-09-01
Branch: `batch/20260901-magia-gundamseed`
Stacked base: `batch/20260831-persona5-to-bio5` (PR #148)
Current PR: #149
Formal references rechecked at Gate A start: Core Policy v1.7 / RSO v6.9 / UX v6.9.

## Status

Gate A / Research: IN PROGRESS.

A cross-source Research sweep was executed for all ten machines after Gate 0. This checkpoint records the candidate universe and the semantic traps that must be preserved when converting the findings into `research-data.json`. It is intentionally not a Selection decision: no candidate is rejected here merely because it looks inconvenient to observe.

## Machines / provisional registration IDs

191 — Magia Record
192 — L Godzilla
193 — L Ushio & Tora Hakumen Kessen
194 — Smart Okinawa Slot Amazing Live
195 — Yoshimune
196 — L Mahjong Monogatari
197 — Idolmaster Million Live! Next Prologue
198 — Classroom of the Elite
199 — Midoridon VIVA! REVIVAL
200 — Gundam SEED

Exact machine IDs remain to be written with the ResearchData batch; do not infer an ID from this English shorthand without checking the repository naming convention/model number.

## 191 Magia Record

Confirmed numeric candidate families:
- Bonus first hit: SET1 1/240.6, SET2 1/236.1, SET3 1/222.8, SET4 1/208.5, SET5 1/195.1, SET6 1/184.3.
- AT Magia Rush first hit: 1/654.6, 1/633.4, 1/571.8, 1/516.6, 1/456.5, 1/416.7.
- Weak cherry: 1/60.0, 1/57.7, 1/55.5, 1/53.5, 1/51.7, 1/50.0.
- Non-Iroha mode selection has setting differences at advantageous-section transition / AT end and at bonus end.
- High-state transition lottery has setting differences.
- Watermelon-triggered Magia Challenge / Kuroe Challenge selection has setting differences; Sana-mode and promotion-during-forewarning semantics must be kept separate.
- Episode Bonus selection and Mitama Bonus reward/AT lottery contain setting differences.

Evidence / cue candidate families:
- BIG ending screen: odd/even bands, high-setting cues, 2+, 4+, 5+, 6.
- AT ending screen: 3/5/6 and 2/4/6 tendencies plus high-setting / hard lower-bound patterns.
- story order / character introduction and ending-card cues.

Observation note: public analysis explicitly recommends UniMemo for accurate weak-cherry counting. Linked-service existence/scope still needs formal FOUND/CHECKED_NONE/UNRESOLVED provenance before Gate A closes.

## 192 L Godzilla

Confirmed numeric candidate families:
- CZ: 1/306.9, 1/304.0, 1/303.0, 1/302.1, 1/299.6, 1/295.5.
- AT: 1/680.9, 1/662.6, 1/611.0, 1/511.3, 1/447.1, 1/420.4.
- Exploration Zone entry: SET1 1/91.3 vs SET6 1/72.5; middle settings unresolved publicly in checked sources.
- Replay-point-triggered CZ lottery: setting difference is reported, but only partial public values were found in the checked source set.
- Shurai Zone opponent multinomial:
  - SET1 41.4 / 36.6 / 16.8 / 5.0 / 0.1
  - SET2 39.6 / 37.0 / 17.9 / 5.4 / 0.1
  - SET3 38.0 / 37.2 / 18.7 / 5.9 / 0.1
  - SET4 35.8 / 36.4 / 20.9 / 6.7 / 0.1
  - SET5 33.9 / 35.1 / 23.3 / 7.5 / 0.1
  - SET6 32.2 / 34.5 / 25.1 / 8.1 / 0.1
  categories: Rodan / Gigan / Biollante / Destoroyah / King Ghidorah.
- ordinary small-role probabilities checked by Nana are common across settings; do not invent a small-role setting Feature.

Evidence / cue families:
- menu screen setting patterns including a setting-6 pattern.
- operator line setting patterns including setting 6.
- Godzilla/EX Bonus ending screens: odd/even, high-setting, 4+, 5+, 6.
- EX Bonus movie includes high-setting hard cues.
- Gin-chan trophy lower-bound evidence.

Semantic warning: menu screens also carry mode/G-point/opponent information. Only the explicitly setting-linked patterns belong in setting Research.

## 193 L Ushio & Tora Hakumen Kessen

Confirmed numeric candidate families:
- CZ: 1/178.0, 1/175.6, 1/169.7, 1/164.5, 1/161.9, 1/159.0.
- AT: 1/397.3, 1/389.6, 1/378.0, 1/365.6, 1/360.0, 1/356.1.
- reset-only AT-between-hit ceiling allocation: 2000G / 2250G / 2500G has full setting distributions.
- reset-time Ushitora-mode prescribed CZ-miss count has full setting multinomial distribution for 0–4 misses.
- role/state-specific CZ hit lottery is reported to have setting differences, but checked source exposes only SET1 detailed values; keep as incomplete Research candidate rather than fabricating other settings.

Evidence:
- payout milestones: 222 => 2+, 333 => 3+, 456 => 4+, 555 => 5+, 666 => 6; 246 is even-setting evidence rather than lower-bound evidence.
- Dynamite Trophy: bronze 2+, silver 3+, gold 4+, ladybug 5+, rainbow 6.

Semantic warning: reset-only distributions are conditional on a known setting-change/reset population and must not be modeled against ordinary ongoing-play denominators.

## 194 Smart Okinawa Slot Amazing Live

Confirmed machine settings are 1 / 2 / 4 / 5 / 6 plus operational SET_L (not an ordinary inference hypothesis).

Published numeric candidate families:
- Bonus first hit: 1/274.0, 1/259.6, 1/229.3, 1/206.9, 1/189.9 for settings 1/2/4/5/6.
- BIG: 1/213.0, 1/202.5, 1/181.6, 1/165.7, 1/153.4.
- REG: 1/370.0, 1/349.5, 1/310.2, 1/280.7, 1/258.0.
- BIG+REG appearance aggregate: 1/135.2, 1/128.2, 1/114.5, 1/104.2, 1/96.2.

No trustworthy setting-different small-role table was found in the checked major-source sweep; Nana still marks small roles under investigation. OneShot's current setting page likewise centers on bonus probabilities.

SET_L operational evidence: continuously flashing lower panel. Keep outside ordinary posterior settings.

Semantic warning: `bonus first hit` and overall BIG/REG appearance are not automatically independent observations; Selection must establish the chain/tenkoku denominator before multiplying any combination.

## 195 Yoshimune

Confirmed numeric candidate families:
- BIG/REG initial hit: 1/378.9, 1/369.6, 1/358.8, 1/335.1, 1/318.5, 1/292.4.
- common tawara: 1/819.2, 1/744.7, 1/682.7, 1/585.1, 1/512.0, 1/455.1.
- practical mode-transition / reach-eye observations are published as practical data and must not be silently promoted to official exact setting probabilities.

Evidence / cue families:
- bonus-ending hanafuda: high-setting weak/strong; 2+, 3+, 4+, 5+, 6 hard patterns.
- bonus-ending voices include mode and setting information; separate setting semantics from mode-only semantics during Research.

All ordinary cherry / matsu / chance-eye probabilities are published as setting-common in the checked source. Do not create setting Features from them.

Identity warning retained: this is 2025 `吉宗`, not `吉宗RISING`.

## 196 L Mahjong Monogatari

Confirmed numeric candidate families:
- normal-play Bonus first hit: 1/433.3, 1/431.8, 1/426.6, 1/420.2, 1/417.9, 1/416.5.
- AT total first hit: 1/615.2, 1/600.3, 1/580.5, 1/545.5, 1/537.9, 1/531.4.
- normal Bonus-or-AT initial hit aggregate: 1/354.1, 1/349.2, 1/342.1, 1/328.8, 1/326.0, 1/323.8.
- direct AT excluding forewarning promotion: 1/15142.4, 1/10716.9, 1/8351.0, 1/5164.8, 1/4886.1, 1/4631.9.
- practical direct AT including promotion: 1/7945.6, 1/6529.1, 1/5649.1, 1/4012.7, 1/3859.1, 1/3707.4.
- Kotei opponent appearance: 1/891.5, 1/887.0, 1/868.7, 1/808.1, 1/754.6, 1/747.9.
- Kotei battle win expectation and CZ enemy-defeat thresholds have setting differences but checked source gives only SET1 details; preserve as incomplete candidates.
- Mashirock seven-hit probability has setting difference but only SET1 detail in checked source.

Evidence / cue families:
- Bonus/AT ending illustrations and familiar `良/優/極` stamps (4+/5+/6).
- ending voices with high-setting tendencies.
- AT +66G = setting 6.
- payout milestone 666 is reported as setting-6-class cue; provenance wording needs hard-evidence verification before allowedSettings is locked.
- Last Judge Haruruna PUSH = 4+.
- hidden Nagi gold line = 6.

Dependency warning: Bonus first hit, AT first hit, and Bonus-or-AT aggregate overlap; Selection must not multiply all three as independent likelihoods.

## 197 Idolmaster Million Live! Next Prologue

Confirmed numeric candidate families:
- CZ: 1/428.0, 1/415.5, 1/378.4, 1/353.8, 1/322.7, 1/306.2.
- Bonus initial hit: 1/347.0, 1/337.4, 1/314.0, 1/280.6, 1/256.8, 1/242.0.
- direct-high transition frequency / stay length: setting-linked, full numeric table not resolved in checked major-source pages.
- heaven selection: high settings favored, full table unresolved in checked pages.
- 300G Bonus hit: high settings favored, full table unresolved in checked pages.

Evidence:
- Bonus ending screen odd/even weak/strong tendencies plus 2+, 3+, 4+, 5+, 6 hard screens.
- Kerot Trophy lower-bound family (at least 4+/5+/6 patterns publicly listed; exact complete color contract to be normalized from a primary/major source before Gate A closes).

Linked service: FOUND — official SloPla NEXT machine page exists. Public result fields include total games, normal games, Bonus first hits, Million Live, Million Seven Challenge, Grow Up Challenge, cherry, watermelon, chance bell, Duo A/B/C, Mirishita eye, four Bonus types, Bonus BAR hits, SSRush, live-type results and many additional counters. Official notice states the machine's rare-role probability display was removed because accurate calculation was difficult; therefore do not use SloPla-derived displayed rare-role probabilities as authoritative setting probabilities. Raw counters remain an Observation candidate subject to scope/reset semantics.

## 198 Classroom of the Elite

Confirmed numeric candidate families:
- CZ aggregate: 1/148.6, 1/143.8, 1/138.0, 1/130.3, 1/121.8, 1/115.5.
- AT: 1/329.9, 1/317.9, 1/302.8, 1/281.5, 1/260.0, 1/243.3.
- CZ-success DAXEL flash: 0.5%, 0.6%, 1.0%, 1.5%, 2.0%, 2.5% conditional on successful CZ.
- normal-cycle CZ type multinomial: Girls Challenge / Meritocracy Zone = 89.7/10.3, 87.8/12.2, 86.0/14.0, 84.8/15.2, 83.7/16.3, 82.7/17.3. This excludes rare-role promotion and applies to specified normal cycles only.
- successful continuous-performance red-button rate: 1.0%, 1.2%, 1.4%, 1.5%, 1.7%, 1.9%.
- mode-3 role-specific CZ lottery has setting differences and requires exact state/role denominators.

Evidence / cue families:
- Bonus character introductions and Bonus ending screens.
- AT ending screens.
- payout milestones.
- ending Merit Challenge success voices.

Dependency warning: CZ aggregate and normal-cycle CZ composition are related but not the same trial unit. Preserve the conditional denominator; do not flatten the latter into total games.

## 199 Midoridon VIVA! REVIVAL

Confirmed numeric candidate families:
- AT Amazon Game: 1/561.0, 1/555.7, 1/502.0, 1/464.4, 1/424.3, 1/400.8.
- weak cherry: 1/72.8, 1/72.0, 1/71.2, 1/70.5, 1/68.3, 1/66.9.
- weak nami: 1/109.2, 1/107.4, 1/105.7, 1/104.0, 1/102.4, 1/99.3.
- reach-eye replay: only odd settings publicly resolved in checked sources: SET1 1/2978.9, SET3 1/2520.6, SET5 1/2048.0. Keep incomplete rather than synthesizing even settings.
- high-state transition from non-cherry eligible triggers: SET1-4 0.4%, SET5-6 0.8%; exact eligible-event denominator must exclude cases where Bonus/AT/Billy Get Challenge already won as specified by the state-transition contract.
- state/role-specific normal Bonus hit probabilities have setting differences; requires exact table capture and state denominator.

Evidence / cue families:
- Bonus ending screen odd/even and 2+/4+/6 patterns.
- XR Challenge failure-screen touch voices include lower-bound patterns.
- ending YuKemuri Bonus trick memories include 4+/5+/6 patterns.

Semantic warning: high-state transitions and state-specific Bonus hits cannot use total normal games as denominator.

## 200 Gundam SEED

Confirmed numeric candidate families:
- CZ Strike Attack: 1/362.2, 1/377.3, 1/349.1, 1/309.7, 1/301.6, 1/266.9. Non-monotonic SET2 is intentional published data.
- AT initial hit: 1/460.1, 1/446.9, 1/411.8, 1/364.5, 1/355.6, 1/318.4.
- first CZ-or-Bonus within 100G after reset or ST end:
  - 0-49G: 4.28, 4.31, 4.47, 5.07, 5.39, 6.91%
  - 50-99G: 27.58, 27.73, 28.14, 29.73, 30.07, 32.08%
  - total: 31.86, 32.04, 32.61, 34.80, 35.45, 38.99%.
  This is conditional on reset/ST-end first-hit opportunities, not ordinary per-game probability.

Evidence / cue families:
- CZ/ST ending screens: odd/even/high-setting and hard-setting frames, including setting-6 gold.
- ending ending-screen hard-setting patterns including setting-6 gold.

Dependency warning: the 100G post-reset/ST-end candidate must not be represented as an ordinary 100-game binomial without respecting one-opportunity-per-reset/ST-end episode semantics and the published interval definition.

## Cross-batch Research risks to carry forward

1. Do not equate a public `設定差あり` statement with a complete numeric setting table. Partial candidates stay in Research with missing values explicit.
2. Do not copy practical/実戦値 into exact theoretical setting probabilities without provenance classification.
3. Initial-hit aggregate/subset families are a major double-counting risk: Amazing Live and Mahjong Monogatari are explicit examples.
4. Conditional state denominators are major risks: Magia CZ/state, Ushio CZ state, Idolmaster direct-high, Youjitsu mode 3, Midoridon high-state/Bonus hit.
5. Reset-only or post-end distributions are conditional populations and must not be mixed with ordinary session game denominators.
6. Hard Evidence requires exact semantics. `濃厚`, `示唆`, `期待度` and `！？` must not automatically become allowedSettings evidence.
7. SET_L is operational identity/evidence only unless formal policy explicitly says otherwise; do not synthesize likelihoods for SET_L.
8. Linked-service coverage remains open for 9/10 machines. Idolmaster SloPla NEXT is FOUND with concrete fields; all others require explicit FOUND/CHECKED_NONE/UNRESOLVED provenance before Gate A PASS.
9. Source sweep used current major-analysis pages; formal `research-data.json` must carry source URLs/check dates and cross-source status per candidate.

## Gate A closure conditions still open

- Resolve exact machine IDs/model-number naming for all 10 against the stacked repository state.
- Convert this checkpoint into 10 schema-valid `research-data.json` files.
- Complete cross-source numeric provenance and explicit missing-value status for partial candidate tables.
- Complete linked-service classification for all ten machines.
- Run Research validation / batch gate tooling from the current stacked branch.
- Confirm Discovery candidate transfer completeness = 0 missing before declaring Gate A PASS.
