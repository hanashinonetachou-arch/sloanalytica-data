# BATCH_20260901_USER_SELECTED_10 — Identity / Discovery Ledger

Status: IN PROGRESS

Formal baseline: Core Policy v1.7 + RSO Manifest v6.9 + MachineData/UX Manifest v6.9.

This ledger is pre-Gate-0 working evidence. Candidate IDs below are provisional until duplicate/model-number checks and ResearchData validation are complete. No candidate listed here is implicitly selected for inference.

## 1. Machine Identity

| # | Display name | Model number | Manufacturer | Introduction | Settings | machineType | gameType | provisional machineId |
|---|---|---|---|---|---|---|---|---|
| 1 | スマスロ マギアレコード 魔法少女まどか☆マギカ外伝 | L／スマスロマギアレコード／RN | MIZUHO | 2025-04-07 | 1,2,3,4,5,6 | SMART_SLOT | AT | L_MAGIA_RECORD_RN |
| 2 | Lゴジラ | LゴジラNS | ニューギン | 2025-04-07 | 1,2,3,4,5,6 | SMART_SLOT | AT | L_GODZILLA_NS |
| 3 | Lうしおととら 白面決戦 | Lうしおととら白面決戦VH | アイドル / Daiichi | 2025-04-07 | 1,2,3,4,5,6 | SMART_SLOT | AT | L_USHIO_TORA_HAKUMEN_VH |
| 4 | スマート沖スロ アメイジングライブ | LアメイジングライブPD | パイオニア | 2025-04-07 | 1,2,4,5,6 | SMART_SLOT | AT | L_AMAZING_LIVE_PD |
| 5 | 吉宗 | L／ヨシムネS／SC2 | サボハニ | 2025-04-21 | 1,2,3,4,5,6 | SMART_SLOT | AT | L_YOSHIMUNE_SC2 |
| 6 | L麻雀物語 | L麻雀物語S2 | オリンピアエステート | 2025-04-21 | 1,2,3,4,5,6 | SMART_SLOT | AT | L_MAHJONG_MONOGATARI_S2 |
| 7 | スマスロ アイドルマスター ミリオンライブ！ ネクストプロローグ | LパチスロアイドルマスターミリオンライブHC | 山佐 | 2025-04-21 | 1,2,3,4,5,6 | SMART_SLOT | A_AT | L_IDOLMASTER_MILLION_LIVE_HC |
| 8 | スマスロ ようこそ実力至上主義の教室へ | Lようこそ実力至上主義の教室へDE | DAXEL | 2025-05-07 | 1,2,3,4,5,6 | SMART_SLOT | AT | L_YOUJITSU_DE |
| 9 | スマスロ 緑ドン VIVA!情熱南米編 REVIVAL | L／緑ドン5／FY | ユニバーサルブロス | 2025-05-07 | 1,2,3,4,5,6 | SMART_SLOT | AT | L_MIDORI_DON_5_FY |
| 10 | Lパチスロ 機動戦士ガンダムSEED | L機動戦士ガンダムSEED G | ビスティ | 2025-05-07 | 1,2,3,4,5,6 | SMART_SLOT | AT | L_GUNDAM_SEED_G |

Identity note: `吉宗` in this batch is the 2025-04-21 machine, not `吉宗RISING` from an older batch.

## 2. Discovery Candidate Universe — first exhaustive pass

### L_MAGIA_RECORD_RN
Numeric/distribution candidates:
- Bonus first-hit probability.
- AT first-hit probability.
- Weak cherry probability.
- Magical-girl-mode distribution at advantageous-section transition / AT end.
- Magical-girl-mode distribution after non-AT bonus end.
- High-state transition distribution at reset/advantageous-section transition and AT end.
- High-state transition distribution after BIG end.
- Watermelon -> Magia Challenge probability outside Sana mode.
- Watermelon -> Kuroe Challenge probability outside Sana mode.
- Episode Bonus character distribution excluding Kuroe-Challenge-forced Kuroe.
- Mitama Bonus reward level 2 rumor-development -> AT probability.
- Mitama Bonus reward level 3 rumor-development -> AT probability.
Evidence/reference candidates:
- Story start episode/order odd/even, setting-denial, 5-or-6 patterns.
- Story character-introduction scenarios.
- BIG end screens including setting 5+ / 6 patterns.
- AT end screens including setting 6 pattern.
- Ending cards including setting 4+ pattern.
Observation/service candidate: UniMemo is supported; concrete obtainable fields remain under item-level verification.
Sources: https://nana-press.com/kaiseki/machine/914/28425/ ; https://1geki.jp/slot/l_magireco/99/ ; https://www.universal-777.com/fun/unimemo/

### L_GODZILLA_NS
Numeric/distribution candidates:
- CZ first-hit probability.
- AT first-hit probability.
- Replay-point CZ hit probability.
- CZ Shurai Zone opponent/monster distribution (multinomial; do not collapse to a generic hint).
Evidence/reference candidates:
- Menu-screen character/vehicle patterns.
- Operator dialogue.
- Godzilla Bonus / EX Bonus end screens.
- EX Bonus movie patterns.
- Gin-chan trophy.
Sources: https://nana-press.com/kaiseki/machine/919/28861/ ; https://1geki.jp/slot/l_godzilla/0/

### L_USHIO_TORA_HAKUMEN_VH
Numeric candidates:
- CZ first-hit probability.
- AT first-hit probability.
- Role/state-specific CZ lottery probabilities where public values are setting-dependent.
- Setting-change AT ceiling shortening (reference/context candidate, not automatically inference).
Evidence candidates:
- Dynamite trophy (2+/3+/4+/5+/6).
- Payout-count displays (222, 246, 333, 456, 555, 666 etc.).
Sources: https://1geki.jp/slot/l_ushiototora/0/ ; https://nana-press.com/kaiseki/machine/918/

### L_AMAZING_LIVE_PD
Numeric candidates:
- Bonus outcome as BB/RB/no-bonus multinomial per game.
- Bonus combined first-hit probability only as a dependency/fallback view; it reuses the same BB/RB events and must not be independent evidence.
Evidence/reference candidates:
- Continue checking public pages for any setting-specific lamp/end-screen/voice distributions; none promoted to verified candidate yet.
Sources: https://1geki.jp/slot/l_amazinglive/ ; https://1geki.jp/slot/l_amazinglive/0/

### L_YOSHIMUNE_SC2
Numeric candidates:
- Bonus/AT initial-hit probability as defined by the machine's public initial-hit table.
- Common tawara probability.
- Normal-time reach-pattern probability (public practical/field value; source-quality tag required).
- Mode transition rate (public practical/field value; source-quality tag required).
Evidence/reference candidates:
- Bonus-end hanafuda patterns (4+/5+/6 etc.).
- Bonus-end voice patterns.
Sources: https://nana-press.com/kaiseki/machine/920/29003/ ; https://nana-press.com/kaiseki/machine/920/

### L_MAHJONG_MONOGATARI_S2
Numeric candidates:
- Main initial-hit probability / AT-related first hit as publicly defined.
- Koutei Kessen appearance probability.
- Direct AT probability.
- Direct bonus probability.
- Direct-AT probability including and excluding precursor/promotion where both public definitions exist; these are alternate definitions of overlapping event structure and require dependency resolution before Selection.
Evidence/reference candidates:
- Mahjong Bonus end screen.
- Payout-count displays.
- End voice patterns.
Sources to cross-check: 1geki / nana-press / P-WORLD machine pages for L麻雀物語.

### L_IDOLMASTER_MILLION_LIVE_HC
Numeric candidates:
- CZ first-hit probability.
- Bonus first-hit probability.
- Direct-high-state transition probability.
- Direct-high-state dwell-game distribution/expectation if setting-specific public values are available.
- Heaven-mode selection probability.
- 300G bonus-hit probability.
Evidence candidates:
- Bonus-end screen / frame patterns.
- Kerot trophy.
Observation/service: SLOT+NEXT / スロプラNEXT machine support verified; concrete play-information fields are being enumerated before FOUND item-level completion.
Sources: https://nana-press.com/kaiseki/machine/921/29067/ ; https://1geki.jp/slot/l_idlmst_mlnp/0/ ; https://www.yamasa-next.co.jp/slp/model/01

### L_YOUJITSU_DE
Numeric/distribution candidates:
- CZ first-hit probability.
- AT first-hit probability.
- CZ hit probability while in CZ mode 3.
- Red-button appearance probability in consecutive performance.
- Periodic-CZ type distribution excluding fixed/special cycles where required by source definition.
- DAXEL flash appearance probability.
Evidence candidates:
- Payout-count displays.
- Youjitsu BONUS character-introduction distributions/patterns.
- Youjitsu BONUS end screens.
- AT end screens.
- Ending Bonus eye-stop-success voice / setting-hint voice.
Sources: https://nana-press.com/kaiseki/machine/935/29484/ ; https://1geki.jp/slot/l_youjitsu/0/

### L_MIDORI_DON_5_FY
Numeric candidates:
- Bonus first-hit probability.
- AT first-hit probability.
- Weak-wave probability.
- Weak-cherry probability.
- Reach-pattern replay probability.
- High-state transition probability from non-replay/non-push-order-bell group, with setting grouping.
- Role x normal/high-state bonus-hit probabilities where setting-dependent.
Evidence candidates:
- Bonus-end screens.
- XR Challenge failure/end voice patterns.
- Ending/Yukemuri Bonus trick-introduction patterns.
Observation/service: UniMemo support verified; concrete counters must be enumerated before Selection/Observation lock.
Sources: https://nana-press.com/kaiseki/machine/936/29335/ ; https://1geki.jp/slot/l_mdn/0/ ; https://www.universal-777.com/fun/unimemo/

### L_GUNDAM_SEED_G
Numeric candidates:
- CZ first-hit probability.
- AT first-hit probability.
- Reset/ST-end 0-49G CZ-or-bonus hit probability.
- Reset/ST-end 50-99G CZ-or-bonus hit probability.
Dependency note: early-zone hit outcomes are downstream/subset-related to aggregate CZ/AT/bonus outcomes and must not be naively independent.
Evidence candidates:
- CZ end screens.
- ST end screens.
- Ending end screens.
Sources: https://nana-press.com/kaiseki/machine/930/29292/ ; 1geki machine setting page.

## 3. Gate-0 blockers / remaining discovery work

- Cross-source numeric transcription is not yet complete for all candidates.
- Machine-linked service status must be resolved per machine to FOUND / CHECKED_NONE / UNRESOLVED, with concrete obtainable items for FOUND.
- L麻雀物語 and アメイジングライブ need another targeted source sweep to ensure no numeric or evidence candidate is missed.
- Identity model-number/manufacturer strings must be checked against registry/catalog naming before final machineId assignment.
- Gate 0 is NOT PASS yet. Required condition remains: Discovery candidate missing from Research = 0.
