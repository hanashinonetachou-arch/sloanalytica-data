# SloAnalytica 2026-09-07 Next10 Research Candidate Universe Re-audit

Status: **IN PROGRESS / isolated audit only**

Baseline: `prototype-multi-machine@8ac2535dfb323d9efedbab897df11e875776ee55`

Safety constraints:
- public `main` must not be changed.
- App PR #42 is real-device verification only and must not be merged by this audit.
- Canonical repair order is Discovery -> ResearchData -> SelectionData -> Observation -> UI Design -> MachineData.
- Numeric setting differences must not disappear merely because Discovery/Research transfer failed.

## Classification vocabulary

- `RESEARCH_FEATURE`: public setting-specific numeric distribution/probability exists and can enter Research.
- `HARD_EVIDENCE`: deterministic setting confirmation/denial semantics.
- `DISPLAY_ONLY`: useful observation/display but not a probability feature under current evidence.
- `NUMERIC_INSUFFICIENT`: setting tendency exists but required setting-specific numeric values are not sufficiently public.
- `OBSERVATION_DIFFICULT`: latent/conditional denominator cannot be reconstructed reliably in normal one-day play.
- `COMPLETE_DUPLICATE`: deterministic/fully contained by another selected feature; do not independently count likelihood.
- `CONDITIONALLY_DIFFICULT`: public numeric values exist but practical denominator/eligibility requires strict condition reconstruction.
- `NO_SETTING_DIFFERENCE`: current public analysis indicates the item itself is not setting-dependent.

## 1. L_FIRE_FORCE_2

Current Discovery has 10 candidates. Numeric Research currently covers bonus initial, Enen-loop initial, and two conditional Trap small-V conversions.

| Candidate | Current | Re-audit classification | Evidence / action |
|---|---|---|---|
| ボーナス初当り | RESOLVED | RESEARCH_FEATURE | keep |
| 炎炎ループ初当り | RESOLVED | RESEARCH_FEATURE | keep |
| 伝導者の罠・小Vリプレイ抽選 | RESOLVED | RESEARCH_FEATURE / CONDITIONALLY_DIFFICULT | keep; set 2/3 remain unpublished for the public banded values, so do not invent them |
| 有利区間リセット時の炎炎大戦/紅丸大戦優遇 | REFERENCE | NUMERIC_INSUFFICIENT | public sources say high settings are favored, but exact per-setting selection rates were not confirmed. Setting-change reset is excluded from this benefit. |
| ボーナス終了画面 | RESOLVED to hard evidence | HARD_EVIDENCE + probability-distribution recheck | hard-evidence patterns exist. Public secondary analysis reports non-hard patterns/default-rate setting differences; require authoritative/cross-source numeric confirmation before adding a probability feature. |
| REG中キャラ紹介 | RESOLVED | HARD_EVIDENCE + distribution already published | current evidence candidates retained; full scenario distribution should be checked for probabilistic treatment without double-counting hard evidence. |
| 獲得枚数表示 | RESOLVED | HARD_EVIDENCE | keep |
| エンディング中ミニキャラ | RESOLVED | HARD_EVIDENCE | keep |
| 小役確率 | REFERENCE | NO_SETTING_DIFFERENCE (current published base probabilities) | HAZUSE currently lists normal small-role probabilities as all-setting common. |
| 連動サービス/遊技履歴 | REFERENCE | DISPLAY_ONLY / unconfirmed | no machine-specific public export contract confirmed. |

Primary sources checked: NanaPress machine setting page; HAZUSE DATA.

## 2. L_UMINEKO_2_A1

Current Discovery has 17 candidates. Multiple transfer/universe gaps are confirmed.

| Candidate | Current | Re-audit classification | Evidence / action |
|---|---|---|---|
| ロゴ発光小/大 | REFERENCE | **RESEARCH_FEATURE** | full setting distribution public: small/large = S1 29.2/70.8, S2 25.0/75.0, S3 31.3/68.8, S4 25.0/75.0, S5 33.3/66.7, S6 25.0/75.0. Stage-change observation condition must exclude forced flash after failed continuous演出. Promote to Research and Selection. |
| 周期天井到達時・真実ポイント振り分け | **MISSING FROM DISCOVERY** | **RESEARCH_FEATURE** | full 30/50/70/200pt setting distribution is public. Add to Discovery -> Research as complete multinomial and send to Selection. |
| 小役/ボーナス重複内訳 | REFERENCE | **RESEARCH_FEATURE(s)** | public setting-specific role / real-bonus probabilities exist (including common bell and independent/overlap bonus components). Split only where numerator/denominator is observable and avoid deterministic overlap with total bonus probability. |
| ボーナス合算 / aggregate derivatives | implicit | COMPLETE_DUPLICATE where deterministically derived | do not independently multiply likelihood when BB/RB/component counts already contain it. |
| 運命分岐モード即転落ボイス | REFERENCE | DISPLAY_ONLY / HARD_EVIDENCE recheck | retain until exact numeric distribution/confirmation semantics are cross-checked. |
| 超パー演出 | REFERENCE | DISPLAY_ONLY / HARD_EVIDENCE recheck | no numeric distribution confirmed in this pass. |
| Story collection全開放演出 | REFERENCE | DISPLAY_ONLY / HARD_EVIDENCE recheck | no numeric distribution confirmed in this pass. |

Primary cross-checks: NanaPress / 1geki / HAZUSE / P-WORLD.

## 3. L_KABANERI_UNATO_KESSEN_XX

Current Discovery has 15 candidates.

| Candidate | Current | Re-audit classification | Evidence / action |
|---|---|---|---|
| CZ当選率 | REFERENCE | NUMERIC_INSUFFICIENT | as of 2026-09-07 major analysis pages state high settings are favored but do not publish six-setting numeric rates. Do not fabricate. |
| 景之STループ | REFERENCE | NUMERIC_INSUFFICIENT | high settings favored, but exact per-setting values not confirmed. |
| キャラ紹介 | REFERENCE | HARD_EVIDENCE / DISPLAY_ONLY + MySlo observable | MySlo counts it; setting indication exists. Numeric appearance distributions require separate verification. |
| 青7サンド目ボイス | REFERENCE | HARD_EVIDENCE / DISPLAY_ONLY + MySlo observable | MySlo counts it; exact probability distribution not confirmed in this pass. |
| アイテム抽選 | REFERENCE | DISPLAY_ONLY / HARD_EVIDENCE depending pattern | MySlo countable; ordinary item draws also include non-setting state/cycle information, so setting-only semantics must be separated. |
| 獲得枚数表示 | REFERENCE | HARD_EVIDENCE | setting confirmation patterns exist; Research Evidence transfer required if not already represented elsewhere. |
| ST終了画面 | REFERENCE | HARD_EVIDENCE + DISPLAY_ONLY | `無名&菖蒲` = setting 6; its appearance rate changes by accumulated daily game band (0.2% / 5% / 25% / 0.2%), so it must not be modeled as a simple setting-only multinomial. Default/high-setting-indication ordinary pattern lacks a full per-setting distribution in current sources. |
| サミートロフィー | RESOLVED | HARD_EVIDENCE | keep |

Already-resolved numeric features (bonus/ST initial, lower bell, cycle3/4, Shunjo 3000pt) remain Research candidates. No promotion is justified for CZ or 景之 loop until numeric values are actually public.

Primary source: NanaPress, last update 2026-09-07 / 2026-09-04; 1geki cross-check.

## 4. L_JORMUNGAND_ND01G

Current Discovery has 13 candidates. Severe transfer and Discovery-universe gaps are confirmed.

| Candidate | Current | Re-audit classification | Evidence / action |
|---|---|---|---|
| レア役別CZ当選 | REFERENCE | **RESEARCH_FEATURE** | numeric state+role conditional rates are public. Normal: chance 10.2->16.8%, strong cherry 25.0->35.2%. High state also has setting-specific weak-role/chance/strong-cherry rates. Promote with explicit state/role denominators; Selection must audit dependence with CZ initial. |
| 恥の世紀開始時成功抽選 | REFERENCE | **RESEARCH_FEATURE** | S1..S6 approx 16.0,16.4,16.8,25.0,46.9,57.4%. Promote; large LR despite limited daily opportunities. |
| 通常AT終了後・仮天井450G選択率 | **MISSING FROM DISCOVERY** | **RESEARCH_FEATURE** | S1..S6 33.59,40.23,45.31,49.22,49.61,50.00%. Setting-change and upper-CZ-failure paths force the short ceiling and must be excluded from the feature denominator. |
| 確定CZ / latent confirmed state | partially implicit | OBSERVATION_DIFFICULT / Research recheck | internal confirmation can become unobservable if independent success occurs first; do not blindly binomial-count latent events. |
| ボーナス終了画面振り分け | RESOLVED | RESEARCH_FEATURE + HARD_EVIDENCE | current complete multinomial is the correct structural pattern: ordinary distribution + zero-probability hard patterns in one natural observation, with Selection double-count audit. |
| ケロットトロフィー | REFERENCE | DISPLAY_ONLY / setting-indication, numeric-insufficient | current public pages confirm the system exists and high-setting expectation rises by color, but deterministic lower-bound semantics are not established by the checked source. Do not convert to Hard Evidence by convention. |

Primary sources: NanaPress / HAZUSE / P-WORLD / current public setting tools.

## 5. LB_TRIPLE_CROWN_SEVEN_FG

Current Discovery has 12 candidates.

| Candidate | Current | Re-audit classification | Evidence / action |
|---|---|---|---|
| BB/RB probabilities | RESOLVED | RESEARCH_FEATURE | keep |
| チェリー | RESOLVED | RESEARCH_FEATURE | keep |
| プラム | RESOLVED in Research | Selection EXCLUDE per prior dependency/quality decision | retain Research history; do not silently remove evaluation history. |
| ボーナス合算 | REFERENCE | COMPLETE_DUPLICATE | deterministic aggregate of BB/RB; never independently multiply likelihood when components are used. |
| 小役重複ボーナス内訳 | REFERENCE | **RESEARCH_FEATURE(s)** | current P-WORLD public tables expose full setting-specific standalone/replay-overlap bonus probabilities. Promote observable components to Research, then Selection audits containment with BB/RB totals. |
| RB終了時クラウン/パネルLED | REFERENCE | **RESEARCH_FEATURE + HARD_EVIDENCE mix** | full no-effect / crown+panel / blue-bat distributions are public for settings 1/2/5/6. Promote as complete distribution if observation contract is exact; hard patterns must not be double-counted. |
| BGMによる示唆 | REFERENCE | **RESEARCH_FEATURE** | full four-setting distributions are public (琉球 BB and 安里屋 RB appearance rates differ by setting). Promote separately by eligible bonus type. |
| BT中MB入賞時 Specialトロフィー方向点灯 | **MISSING / under-specified** | **RESEARCH_FEATURE** | directional lighting distribution is public: lower->upper / upper->lower differs by S1/S2/S5/S6. Add explicit Discovery candidate instead of hiding it behind generic trophy evidence. |

Primary source: P-WORLD current machine database; cross-check major analysis where available.

## 6. L_SHINUCHI_YOSHIMUNE_A1

Current Research has only AT initial and CZ initial while Discovery has 12 candidates.

| Candidate | Current | Re-audit classification | Evidence / action |
|---|---|---|---|
| 抜刀メーターMAX時・抜刀チャンス当選率 | current Discovery says `博徒メーターMAX時抽選` REFERENCE | **RESEARCH_FEATURE** | current public canonical terminology is `抜刀メーターMAX`. S1..S6 = 20.31,22.27,22.27,24.22,24.22,25.78%. Exclude the first opportunity after AT end and the 5th cycle as specified. Rename/repair Discovery identity; do not assume old `博徒` label was exact. |
| CZ当選時・柳生選択率 | REFERENCE | **RESEARCH_FEATURE** | S1..S6 = 3.70,3.90,4.70,6.20,7.81,8.70%. Denominator = eligible CZ wins; numerator = 柳生 selected. |
| AT終了画面 | RESOLVED only to first hard evidence | **RESEARCH_FEATURE complete multinomial + HARD_EVIDENCE** | full distribution is public. S1 [93,5,2,0,0,0,0], S2 [87.5,7.5,3,2,0,0,0], S3 [86.5,7.5,4,2,0,0,0], S4 [81,10,6,2,1,0,0], S5 [78,10,8,2,1,1,0], S6 [75,10,10,2,1,1,1] for 月なし/三日月/満月/大岡/柳生/大奥/吉宗. Promote as complete multinomial and preserve hard evidence separately with natural-observation dedupe. |
| 共通ベル | REFERENCE | NUMERIC_INSUFFICIENT | reliable major sources currently state a difference/measurement target but a complete six-setting public table was not confirmed. A secondary page gives only S1/S6 theoretical values; do not manufacture S2-S5. |
| 御白洲ビジョン / 真BIG中ボイス / メニュー画面 | REFERENCE | HARD_EVIDENCE / DISPLAY_ONLY, numeric-insufficient for ordinary distribution | keep deterministic indication semantics where source supports them; no probability feature without published distribution. |

Primary sources: NanaPress setting page, HAZUSE, cross-check analysis pages.

## 7. L_KYOKOU_SUIRI_ST

Current Discovery has 10 candidates but omits several now-public setting-difference categories.

| Candidate | Current | Re-audit classification | Evidence / action |
|---|---|---|---|
| ボーナス直撃 | REFERENCE | **RESEARCH_FEATURE** | actual rates S1..S6 = 1/6684.1, 1/5311.3, 1/5058.6, 1/3441.4, 1/2853.8, 1/2427.4. Promote and Selection-evaluate as rare event. |
| 共通ベル時 CZ/ボーナス当選率 + 実質確率 | **MISSING FROM DISCOVERY** | **RESEARCH_FEATURE(s)** | common bell itself is all-setting 1/21; conditional CZ and bonus direct-hit rates differ by setting. CZ/AT本前兆中 is excluded. Promote conditional event probabilities, not the all-setting bell frequency. |
| 初回エピソード振り分け | **MISSING FROM DISCOVERY** | **RESEARCH_FEATURE complete multinomial + HARD_EVIDENCE** | ordinary first-CZ distribution differs strongly by setting. **Exclude setting-change and 虚構連 mode run-through-after cases**, whose distributions are all-setting common. EP4/EP5 include lower-bound/setting6 hard evidence. |
| 各エピソード開始時クリア当選率 | **MISSING FROM DISCOVERY** | **RESEARCH_FEATURE** | S1..S6 = 36.6,36.7,38.0,41.2,44.5,46.4%. Promote. |
| 虚構推理ボーナス終了画面 | RESOLVED only to hard evidence | **RESEARCH_FEATURE complete multinomial + HARD_EVIDENCE** | ordinary rates are public: 九郎&琴子 43.0/41.7/40.8/31.3/31.3/31.1; 九郎 27/18/27/18/27/18; 琴子 18/27/18/27/18/27; 琴子&紗季 10/10/10/15/15/15; 六花 2/2/2/6/6/6; hard-setting-screen aggregate 0/1.3/2.2/2.7/2.7/2.9. Individual hard-screen probabilities must be represented only when source-level split is known. |
| 弱レア役からの高確移行 / 低確中CZ抽選 | **MISSING FROM DISCOVERY** | RESEARCH_FEATURE candidate | current setting pages publish setting-specific values; full tables need canonical extraction before edit. Add to candidate universe now; do not leave unrepresented. |

Primary sources: current setting tool (updated 2026-09-04), JugglersNet, major analysis cross-checks.

## 8. L_AKUDAMA_DRIVE_TP

Current Discovery has 16 candidates.

| Candidate | Current | Re-audit classification | Evidence / action |
|---|---|---|---|
| 初当り/CZ/AT/0pt analyze/episode upgrade | RESOLVED | RESEARCH_FEATURE | keep existing numeric items. |
| フェーズアップ抽選 | REFERENCE | NUMERIC_INSUFFICIENT | current public analysis explicitly says setting differences in phase transition rates are still under investigation. Do not promote. |
| CZモード移行/選択 | REFERENCE | DISPLAY_ONLY / numeric-insufficient | current checked public pages expose mode indication but not a setting-specific transition table suitable for inference. |
| CZ終了時ボイス | REFERENCE | **NO_SETTING_DIFFERENCE for setting inference / DISPLAY_ONLY for mode** | voices indicate CZ mode B/C expectations, not setting. Do not show as a rejected *setting-difference* feature; classify as non-setting gameplay hint. |
| ラウンド開始画面 | REFERENCE | **NO_SETTING_DIFFERENCE for setting inference / DISPLAY_ONLY for SKB ceiling** | indicates next execution-division battle ceiling, not setting. |
| ST終了画面 | REFERENCE + one no-change hard evidence resolved | HARD_EVIDENCE + DISPLAY_ONLY; numeric distribution not confirmed | ordinary screens give odd/even/high-setting tendencies; several screens are SKB timing hints whose contradiction becomes setting4+ evidence. Keep semantics separated; do not invent per-setting occurrence rates. |
| 小役確率 | REFERENCE | NO_SETTING_DIFFERENCE (current public table) | current listed base role probabilities are all-setting common. |

Primary sources: NanaPress / current analysis summaries.

## 9. L_MILLION_GOD_KISEKI_CX

Current Discovery has 12 candidates.

| Candidate | Current | Re-audit classification | Evidence / action |
|---|---|---|---|
| GG初当り | RESOLVED | RESEARCH_FEATURE | keep |
| 非ガイアGG後Z-ZONE | RESOLVED | RESEARCH_FEATURE | keep six-setting 1.2/1.0/4.2/1.0/11.6/1.0% table. |
| 青7 3連/4連 | REFERENCE | NUMERIC_INSUFFICIENT for six-setting model | public values exist only for S1/S2 (3連 1.2/10.2%, 4連 33.2/50.0%); S3-S6 remain unpublished. Do not extrapolate. |
| 青7 5連以上 | REFERENCE | NO_SETTING_DIFFERENCE for known published values | 100% for published S1/S2 and described as guaranteed; no inference value. |
| レア役以外からのGG当選率（モード別） | **MISSING FROM DISCOVERY** | **RESEARCH_FEATURE / CONDITIONALLY_DIFFICULT** | full six-setting rates public for lowA/B+天国準備 and normal states. Low-group: S1 .01, S2 .01, S3 .01, S4 .02, S5 .01, S6 .04%; Normal: .01,.02,.01,.03,.01,.04%. Effective mystery-GG rates are also public. Promote candidate; Selection must assess whether state classification is reproducible enough or whether observed `謎GG` should use an effective model instead. |
| high-state / common role GG rates | current generalized state candidate | NO_SETTING_DIFFERENCE where table is all-setting common | do not accidentally convert internal-mode differences into setting differences. |

Primary sources: HAZUSE / NanaPress / 必勝本 / 1geki / recent setting aggregators.

## 10. L_GUNDAM_UNICORN_KAKUSEI_DRIVE_2JA

Current Research has only CZ initial and AT initial; Discovery has 14 candidates.

| Candidate | Current | Re-audit classification | Evidence / action |
|---|---|---|---|
| スタンバイ状態移行時のキャラ | current label `AT待機画面キャラ男女` REFERENCE | **RESEARCH_FEATURE** | current sources define it as the character shown when entering **STANDBY state at the required-point transition**, not generic AT waiting. Male/female distribution: odd settings S1/S3/S5 = 60/40%; even S2/S4/S6 = 40/60%. Rename Discovery precisely and promote as complete 2-category distribution. |
| AT終了画面 | RESOLVED only to hard evidence | probability-distribution recheck + HARD_EVIDENCE | hard evidence retained; ordinary distribution needs source verification before promotion. |
| CZ裏ボタン / MSジャッジ board / ending indications | REFERENCE | HARD_EVIDENCE / DISPLAY_ONLY recheck | no probability distribution confirmed in this pass. |
| CZ/ATゲーム数ウインドウ | REFERENCE | DISPLAY_ONLY unless setting-specific numeric sampling exists | gameplay/status display alone is not a setting feature. |
| ボーナス内部振り分け / AT引き戻し | REFERENCE | Research recheck | require exact setting-specific values and observable denominator before promotion. |

Primary sources: current major setting pages; SANKYO/Bisty official machine identity page.

---

## Confirmed defect classes from this audit

### Discovery-universe omissions (confirmed)
- `L_UMINEKO_2_A1`: 周期天井到達時・真実ポイント振り分け.
- `L_JORMUNGAND_ND01G`: 通常AT終了後の450G仮天井選択率.
- `LB_TRIPLE_CROWN_SEVEN_FG`: BT中MB/Specialトロフィー方向点灯 distribution as an explicit probabilistic candidate.
- `L_KYOKOU_SUIRI_ST`: 共通ベル時当選, 初回episode distribution, episode-start clear, low/high-state conditional candidates.
- `L_MILLION_GOD_KISEKI_CX`: レア役以外からのモード別GG抽選.

### Discovery -> Research transfer failures (confirmed)
- `L_UMINEKO_2_A1`: ロゴ発光小/大; public overlap breakdown candidates.
- `L_JORMUNGAND_ND01G`: rare-role CZ and 恥の世紀 start success.
- `LB_TRIPLE_CROWN_SEVEN_FG`: overlap bonus breakdown, RB-end LED, BGM distributions.
- `L_SHINUCHI_YOSHIMUNE_A1`: 抜刀meter MAX, 柳生 selection, AT-end ordinary distribution.
- `L_KYOKOU_SUIRI_ST`: bonus direct hit; end-screen ordinary distribution.
- `L_GUNDAM_UNICORN_KAKUSEI_DRIVE_2JA`: STANDBY character distribution.

### False/overbroad `RESOLVED` representation (confirmed pattern)
Several `AT/bonus end screen` Discovery entries are marked RESOLVED because one hard-evidence pattern was linked, while the same natural observation has published ordinary setting-dependent distributions. A Discovery candidate is not fully resolved merely because its first Hard Evidence child is represented.

## Canonical repair rules to apply next

1. Every public numeric setting-difference candidate above is added to Discovery and Research before Selection.
2. Every Research numeric candidate receives a Selection decision (`INCLUDE_*` or `EXCLUDE`) with a user-facing reason.
3. Complete screen/episode distributions use multinomial semantics where the full category distribution is known.
4. Hard Evidence children of the same natural observation remain evidence, but probability + evidence must be deduplicated at Selection/inference use so one observation is not counted twice.
5. Conditional features must encode exact eligible opportunities (reset exclusions, mode/path exclusions,前兆 exclusions, cycle exclusions) in Observation denominator contracts.
6. Partial public tables must remain partial/insufficient; no interpolation or guessed setting values.
7. Deterministic aggregates/contained totals are evaluated but excluded from independent likelihood when selected components already account for the same information.
