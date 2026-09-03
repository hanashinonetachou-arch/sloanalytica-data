# 2026-09-03 Next 10-machine Batch — Selection / Gate B Pass 1

Status: IN PROGRESS
Prerequisite: Gate A PASS (`RESEARCH_GATE_A_FINAL.md`)
Policy: Selection may adopt/reject Research candidates, but must preserve concrete reasons, practical exposure, observation semantics, and dependency safety.

## Selection rules applied

- Large setting spread is not sufficient by itself; practical trial count and denominator observability are required.
- Tiny but frequent differences are not automatically useful; expected information is assessed.
- Aggregate/component families are not simultaneously adopted without an explicit dependency strategy.
- Conditional trials require a countable denominator from the same observation route.
- Evidence observations are kept separate from numeric likelihood unless their semantics support hard exclusion/lower-bound evidence.

## First-pass practical exposure anchors

The following 7000G counts are simple per-game opportunity anchors for candidates whose published denominator is a game. They are not substituted for conditional denominators.

| candidate | setting 1 expected events / 7000G | setting 6 expected events / 7000G | first-pass interpretation |
|---|---:|---:|---|
| いざ！番長 弱チェリー | 87.6 | 90.2 | very small separation despite high count; weak information candidate |
| いざ！番長 共通ベルA | 93.5 | 120.7 | frequent enough with meaningful spread; strong numeric candidate if denominator provenance is clean |
| 絶対衝激 リアルボーナス | 42.9 | 50.1 | moderate exposure; potentially useful |
| 絶対衝激 AT初当り | 20.8 | 26.4 | lower count but larger spread; potentially useful |
| ダリフラ ボーナス初当り | 30.5 | 38.8 | practical count and meaningful spread |
| 咲 頂上決戦 AT初当り | 17.6 | 24.6 | meaningful spread but limited count |
| 2022 このすば AT初当り | 26.8 | 32.3 | moderate spread and exposure |
| 楽園追放 共通ベル | 19.2 | 35.2 | strong spread and count, but only when My Slot eligibility is met |

`マタドールⅢ BT中1枚役` is intentionally excluded from this per-7000G table because its denominator is BT games, not total games. Even the theoretical all-7000G-in-BT upper-bound exposure ranges from only 0.85 events at setting 1 to 109.4 at setting 6; real exposure is necessarily lower and must use actual BT-game opportunities.

## Per-machine preliminary decisions

### 211 いざ！番長
- **ADOPT_CANDIDATE:** 共通ベルA. Rationale: meaningful setting spread with high expected sample count; Daitomo route can reduce manual-count burden. Must preserve Daitomo/manual acquisition provenance.
- **HOLD / likely REJECT:** 弱チェリー as standalone likelihood. Rationale: about 88–90 events at 7000G but only ~3% setting1-to-6 probability ratio; likely negligible incremental information compared with common bell A. Final decision requires information comparison and dependency check.
- **ADOPT_CANDIDATE:** AT初当り / 直撃BIG headline families, subject to exact denominator and overlap semantics.
- Evidence families remain Evidence; no numeric double-use.

### 212 L 絶対衝激～PLATONIC HEART～
- **ADOPT_CANDIDATE:** real-bonus rate.
- **ADOPT_CANDIDATE:** AT initial hit.
- **HOLD:** CZ and role->high-state conditional families until complete setting table + observable same-state denominator are confirmed.
- Nami trophy / lower-bound / negation / exact-setting patterns remain Evidence.

### 213 わたしの幸せな結婚
- **ADOPT_CANDIDATE:** bonus initial hit and AT initial hit, provided complete per-setting tables are carried into structured Selection.
- **HOLD:** CZ and bonus-through ceiling distribution pending full numeric table and countable eligible denominator.
- medley / AT-end command / Aristo trophy remain Evidence.
- eSLOT+ generic capability does not create an automatic numeric input until exact machine-specific fields are resolved.

### 214 LBトリプルクラウン
- **ADOPT_CANDIDATE:** BIG and REG components as the preferred base decomposition, pending formal dependency audit.
- **REJECT_AS_DUPLICATE_CANDIDATE:** bonus total if BIG+REG are adopted from the same play universe. Rationale: total is deterministic aggregate of the adopted components and would double-count the same bonus observations.
- **ADOPT_CANDIDATE / audit required:** cherry and plum small-role rates if direct counting is practically reliable.
- **HOLD:** role-specific bonus-overlap families. Rationale: they may reuse the same bonus and role observations as the base small-role/bonus families; only adopt under an explicit joint/conditional model.
- cabinet `ドラマチックスコア` remains an observation aid only; no denominator is inferred from its history display.

### 215 マタドールⅢ
- **ADOPT_CANDIDATE:** BB and RB as preferred bonus decomposition.
- **REJECT_AS_DUPLICATE_CANDIDATE:** total bonus if BB+RB are adopted from identical total-game universe.
- **HOLD:** BT one-coin role despite enormous spread. Rationale: denominator is BT games and setting1 expected frequency is extremely low; practical one-day information depends strongly on BT exposure and whether BT-game denominator can be observed accurately.
- Condor lamp / panel flash remain Evidence.

### 216 パチスロ 転生したら剣でした
- **ADOPT_CANDIDATE:** AT initial hit.
- **HOLD pending dependency:** CZ and bonus initial hit because the game flow can make aggregate initial-hit families causally/structurally related; audit exact event composition before simultaneous adoption.
- **HOLD:** state-qualified weak-chance-role -> bonus probabilities until same-state role opportunity denominator is demonstrably countable.
- eSLOT+ fields are not guessed.

### 217 L ダーリン・イン・ザ・フランキス
- **ADOPT_CANDIDATE:** bonus initial hit.
- **HOLD:** bonus-high initial and CZ combined until overlap/composition is resolved. CZ combined is also non-monotonic in lower settings and may add little independent information.
- **HOLD:** Connect Chance level / success and Franxx-high transition families until denominator observability and complete tables are proven.
- trophy/end/payout families remain Evidence.

### 218 L咲-Saki- 頂上決戦
- **ADOPT_CANDIDATE:** AT initial hit.
- **HOLD:** CZ initial hit until its overlap with AT path and incremental information are quantified.
- **HOLD:** cycle/rival-mode/CZ-through/清澄トライアル numeric families pending exact trial definitions and complete tables.
- AT-end / ending 和-lamp / payout categories remain Evidence or multinomial hint observations.

### 219 パチスロこの素晴らしい世界に祝福を！
- **ADOPT_CANDIDATE:** AT initial hit.
- **HOLD:** emergency-quest opponent distribution, rank success, bath initial points, bonus 7-alignment and hidden-mode transition until exact denominators and practical occurrence counts are established.
- My Slot hidden-mode counter can support observation if eligibility is met, but unlock-level dependence must remain visible to the user.
- all screen/voice/debt/payout/trophy families remain Evidence.

### 220 パチスロ楽園追放
- **ADOPT_CANDIDATE:** RD initial hit and AT initial hit as component families, subject to BB treatment in final dependency audit.
- **REJECT_AS_DUPLICATE_CANDIDATE:** BB/RD/AT combined initial hit if all constituent initial-hit components are adopted from the same denominator.
- **ADOPT_CANDIDATE_CONDITIONAL:** common bell, but only when My Slot My Counter Lv4 eligibility is satisfied and the same-session denominator is available. It has strong separation (~19 vs ~35 expected events per 7000G at settings 1 vs 6).
- **HOLD:** state x role draw families and NAH families until exact conditional denominators are countable.
- RD/AT-end / episode / payout remain Evidence.

## Dependency / double-count red flags for Pass 2

1. BIG + REG + total bonus: total cannot be used alongside both components from the same trial universe.
2. RD/AT/BB combined initial hit + components: aggregate cannot coexist with complete component decomposition without a joint model.
3. Small-role rate + role-specific bonus overlap: overlap event is a subset of the role observation and also contributes to bonus count; simultaneous naive likelihood multiplication risks double use.
4. CZ initial + AT initial: not automatically duplicates, but causal pathway dependence must be assessed machine by machine.
5. Bonus initial + bonus-high initial: determine whether one is a state-qualified subset / decomposition of the other.
6. Combined CZ + subtype/level outcomes: combined rate and conditional success/category distributions must use separate trial semantics or a multinomial/conditional model.
7. Evidence presentation and numeric trigger derived from the same observation must share one input surface and must not count the same occurrence twice.

## Gate B remaining work

- quantify incremental information for borderline candidates, especially いざ！番長 weak cherry and non-monotonic/low-spread aggregates;
- close the exact aggregate/component dependency strategy per machine;
- classify each HOLD as ADOPT / REJECT / REFERENCE with concrete reason;
- verify complete per-setting tables for any conditional candidate proposed for adoption;
- complete Selection Quality and Dependency Audit before Gate B PASS.
