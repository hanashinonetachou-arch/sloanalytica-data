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
- BIG end screens including setting 2+ / 4+ / 5+ / 6 patterns.
- AT end screens including setting 6 pattern.
- Ending cards including setting 4+ pattern.
Observation/service: UniMemo support and machine-specific play-history use verified; Research/Observation still must distinguish which counters correspond exactly to each selected denominator.
Sources: nana-press setting/mode/state/BIG/Mitama pages; 1geki setting/tool pages; Universal UniMemo official page.

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
Sources: nana-press and 1geki setting pages.

### L_USHIO_TORA_HAKUMEN_VH
Numeric candidates:
- CZ first-hit probability.
- AT first-hit probability.
- Role/state-specific CZ lottery probabilities where public values are setting-dependent.
- Setting-change AT ceiling distribution.
- Ushitora mode distribution.
Evidence candidates:
- Dynamite trophy (2+/3+/4+/5+/6).
- Payout-count displays (222, 246, 333, 456, 555, 666 etc.).
Sources: 1geki and nana-press setting/reset/mode/payout pages.

### L_AMAZING_LIVE_PD
Numeric candidates:
- Bonus combined first-hit probability with its verified normal-game denominator.
- Published BB rate and RB rate as separate Research candidates while their public denominator / interval semantics remain unresolved.
Dependency rule:
- Do NOT model BB/RB/no-bonus as one per-normal-game multinomial unless a later source proves the BB and RB published rates use the same normal-game event population as the combined first-hit table. The current public numbers are numerically incompatible with that assumption.
Evidence/reference candidates:
- Continue checking public pages for any setting-specific lamp/end-screen/voice distributions; none promoted to verified candidate yet.
Sources: 1geki Amazing Live machine/setting pages and other machine-specific public analysis.

### L_YOSHIMUNE_SC2
Numeric candidates:
- Bonus/AT initial-hit probability as defined by the machine's public initial-hit table.
- Common tawara probability.
- Normal-time reach-pattern probability (public practical/field value; source-quality tag required).
- Mode transition rate (public practical/field value; source-quality tag required).
Evidence/reference candidates:
- Bonus-end hanafuda patterns.
- Bonus-end voice patterns are mode/天国/鷹狩り/1G連 hints and are REFERENCE rather than setting Evidence.
Observation/service: Daito-mo machine-specific analysis confirms small-role probabilities and initial-hit triggers/history can be checked, but an exact official machine-specific obtainable-item inventory remains unresolved.

### L_MAHJONG_MONOGATARI_S2
Numeric candidates:
- Normal bonus first-hit probability.
- AT total first-hit probability.
- Bonus-or-AT combined first-hit probability.
- Koutei appearance probability.
- Direct AT probability excluding precursor promotion.
- Effective direct AT probability including precursor promotion; alternate overlapping definition requiring dependency resolution.
- Mahjong Ranbu kill-count bonus-hit probability if complete setting table becomes public.
- Mashirock seven-align probability if complete setting table becomes public.
Evidence/reference candidates:
- End-screen stamps 2+/4+/5+/6.
- Last Judge HaruLuna PUSH 4+.
- AT add 44G=4+, 55G=5+, 66G=6, excluding after-add displays.
- End voices are qualitative high-setting hints only (REFERENCE).
- Payout-count mappings are prediction-based (REFERENCE).
Observation/service: 打-WIN LITE QR linkage and hidden-Nagi 1000G update cadence are machine-specific; hidden-Nagi setting mappings remain prediction/reference, not hard Evidence.

### L_IDOLMASTER_MILLION_LIVE_HC
Numeric candidates:
- CZ first-hit probability.
- Bonus first-hit probability.
- Direct-high-state transition probability (qualitative-only if no full setting table).
- Direct-high-state dwell-game distribution/expectation (qualitative-only if no full table).
- Heaven-mode selection probability (qualitative-only if no full table).
- 300G bonus-hit probability (qualitative-only if no full table).
Evidence candidates:
- Bonus-end screen / frame hard patterns.
- Kerot trophy mapping where source confidence permits; prediction-based mappings remain REFERENCE.
Observation/service: SloPla NEXT support verified with concrete play-information items including total/normal games, bonus first hits, CZ/live counts, cherry, watermelon, chance bell, Duo A/B/C, Mirishita-eye and bonus/live outcomes.

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
Sources: nana-press, 1geki, and machine-specific DAXEL/攻略 pages.

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
- Bonus-end hard screens.
- XR Challenge failure/end hard voice patterns.
- Ending/Yukemuri Bonus trick-introduction hard patterns.
Observation/service: UniMemo support is official. Machine-specific public material confirms weak cherry and weak wave are automatically counted; public play reports also confirm UniMemo session use. Full machine-specific counter inventory is not yet recovered, so item-detail status remains partial rather than falsely complete.
Sources: nana-press setting page; Universal official product/UniMemo pages; machine-specific public analysis/実戦 reports.

### L_GUNDAM_SEED_G
Numeric candidates:
- CZ first-hit probability.
- AT first-hit probability.
- Reset/ST-end 0-49G CZ-or-bonus hit probability.
- Reset/ST-end 50-99G CZ-or-bonus hit probability.
Dependency note: early-zone hit outcomes are downstream/subset-related to aggregate CZ/AT/bonus outcomes and must not be naively independent.
Evidence candidates:
- CZ/ST end screens: hard even-setting, setting1 denial, setting2 denial, setting3 denial, setting4+, setting6 constraints separated from soft odd/even/high-setting hints.
- Ending end screen setting6.
Sources: nana-press and 1geki setting pages.

## 3. Gate-0 blockers / remaining discovery work

- Explicit Web-to-Discovery exhaustiveness review still needs to be closed across all 10 after the latest transfers.
- Machine-linked services still UNRESOLVED for Lゴジラ / Lうしおととら / アメイジングライブ / 吉宗 exact Daito-mo item inventory / よう実 / ガンダムSEED. Lack of a search hit is not CHECKED_NONE.
- 緑ドン UniMemo is FOUND with weakチェリー/弱波 automatic counters confirmed, but complete machine-specific counter inventory is still only partially resolved.
- L麻雀物語: complete setting tables for Mahjong Ranbu kill-count bonus and Mashirock seven-align remain unresolved; checked public pages expose insufficient full-setting numeric data.
- Lゴジラ replay-point CZ and Lうしおととら role/state CZ remain public-numeric-incomplete.
- Gate 0 is NOT PASS yet. Required condition remains: Discovery candidate missing from Research = 0 plus explicit Web-to-Discovery exhaustiveness review.
