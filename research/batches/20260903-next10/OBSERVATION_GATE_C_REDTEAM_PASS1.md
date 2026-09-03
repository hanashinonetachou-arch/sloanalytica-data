# 2026-09-03 Next 10-machine Batch — Observation Red-Team Pass 1

Status: IN PROGRESS
Prerequisite: `OBSERVATION_GATE_C_PASS1.md`

## Red-team target

Challenge every active Selection mapping for:
- numerator / denominator mismatch,
- guessed service fields,
- menu/service/cabinet-route confusion,
- duplicate Feature + Evidence input surfaces,
- hidden conditional denominators,
- user-facing wording that could imply stronger observability than is actually proven.

## Findings

### 211 いざ！番長
- `共通ベルA`: PASS as an active Observation candidate. Public analysis independently confirms Daitomo automatic counting / occurrence-rate calculation. Manual and Daitomo provenance must stay separate.
- `AT初当り`: PASS provisionally; exact user-facing denominator wording still needs the published normal-game universe.
- `直撃BIG`: BLOCKED as a separate numeric input until composition against AT initial-hit is proven. Do not expose a second Feature surface yet.

### 212 絶対衝激
- real bonus + AT headline mapping: PASS provisionally.
- conditional high-state/CZ families correctly remain REFERENCE; no denominator debt leaks into active UI.
- Evidence must keep trophy / setting-negation / lower-bound / exact-confirmed categories semantically distinct.

### 213 わた婚
- bonus initial + AT headline mapping: PASS provisionally.
- eSLOT+ machine-specific field list remains unresolved and must not be advertised as a usable automatic input route.
- Evidence categories can be mapped without duplicate numeric inputs.

### 214 LBトリプルクラウン
- menu absence and linked-service absence are both explicit CHECKED_NONE: PASS.
- `ドラマチックスコア` is correctly classified as seat-visible cabinet display, not machine menu: PASS.
- cherry/plum active mapping requires denominator = matching eligible game universe. The cabinet display history itself must not define that denominator.
- BIG/REG + total duplicate was removed at Selection: PASS.

### 215 マタドールⅢ
- menu absence and linked-service absence explicit: PASS.
- BB/RB active mapping is straightforward if same play-game denominator is used.
- BT one-coin role remains REFERENCE, preventing the common mistake of using total games as its denominator: PASS.

### 216 転剣
- AT-only representative numeric mapping removes upstream CZ/bonus double-count risk: PASS.
- eSLOT+ exact fields remain unresolved; no guessed service path: PASS.

### 217 ダリフラ
- bonus-initial-only mapping avoids state-qualified subset multiplication: PASS.
- bonus-high/CZ/level/transition families remain REFERENCE: PASS.

### 218 咲 頂上決戦
- AT-only representative numeric mapping avoids CZ pathway double-use: PASS.
- previous AT-end screen recovery through machine menu is classified as Evidence recovery only: PASS.
- AT-end screen input must be a single presentation surface whether entered live or recovered from menu.

### 219 2022 このすば
- AT initial active mapping: PASS provisionally.
- My Slot exact machine-specific counters unresolved; no guessed automatic input path: PASS.
- Evidence-heavy design needs one-observation/one-input grouping so the same screen/voice cannot be entered in multiple sections.

### 220 楽園追放
- aggregate initial-hit strategy removes RD/AT component double counting: PASS.
- common bell conditional route correctly requires My Counter Lv4 and cumulative eligibility; blank when unavailable: PASS.
- exact same-session denominator semantics remain a WEB_RESEARCH_CANDIDATE because the unlocked common-bell count alone does not prove which game-count field is the correct paired denominator.

## Shared Feature + Evidence audit — Pass 1

No active numeric candidate currently requires a second Evidence-only duplicate input by design. Downstream MachineData must enforce:
- one event input can feed both Feature and Evidence only when the same observation legitimately has both meanings;
- `sharedFeatureIds` may only reference real active Features;
- Evidence-only presentations must not receive synthetic numeric Feature IDs;
- live-entry and menu-recovered versions of the same presentation are acquisition routes to the same observation, not separate observations.

## Debt disposition

### Remain `WEB_RESEARCH_CANDIDATE`
1. いざ！番長 direct BIG vs AT initial-hit composition.
2. 楽園追放 My Slot same-session denominator pairing for common bell.
3. Any machine-specific linked-service field required for an active mapping, if reliable public/manual documentation exists.

### Downgrade to `MACHINE_REQUIRED` if web cannot resolve
- eSLOT+ exact machine-specific field lists for わた婚 / 転剣.
- 2022 このすば My Slot exact field list.
- machine-menu details for machines without reliable public documentation.

### `LOW_PRIORITY_HOLD`
- Gate-B REFERENCE-only conditional families not needed by active inference.

## Gate C red-team status

**OPEN.** No new Selection-level double-count defect found. Current blockers are narrowly scoped to active Observation provenance: direct-BIG composition for いざ！番長 and denominator pairing for 楽園追放 common bell. If public research cannot prove them, the safe fallback is to downgrade the affected active mapping rather than manufacture equivalence.
