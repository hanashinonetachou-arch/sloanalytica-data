# 2026-09-03 Next 10-machine Batch — Observation / Gate C Final

Status: PASS — REAUDITED 2026-09-04
Prerequisite: Gate B PASS / Observation Red-Team Pass 1
Policy: Observation v2 must close active WEB_RESEARCH_CANDIDATE debt before Gate C. If public evidence cannot prove active numerator/denominator or composition semantics, the affected numeric mapping is downgraded rather than guessed. Real-device evidence may reopen and reclose the gate when it resolves an Observation debt.

## Final blocker disposition

### 211 いざ！番長 — 直撃BIG vs AT初当り

Public analysis states that normal initial hits basically award AT, while a direct BB is announced instead of AT and then flows into AT after the BB. This proves that direct-BB is an alternate normal initial-hit path that subsequently enters AT, but the published headline `AT初当り` table does not by itself prove whether its denominator/numerator convention excludes or includes direct-BB-derived AT entry.

Therefore:
- `AT初当り`: remain active numeric Feature.
- `直撃BIG`: downgrade from active numeric candidate to `REFERENCE` until the published composition against AT初当り is explicitly proven.
- Do not expose a second numeric input surface for direct BIG in MachineData.
- Direct-BIG-related presentation may remain descriptive/reference information, but must not affect likelihood.

This closes the active double-count/composition blocker without inventing equivalence.

### 220 パチスロ楽園追放 — 共通ベル

Initial public-web review proved that the common-bell count becomes visible in My Slot / My Counter Lv4 but did not prove the exact paired denominator, so the first Gate-C close conservatively downgraded the Feature to REFERENCE.

User-provided real My Slot result-screen evidence on 2026-09-04 resolves this denominator exactly. The screen shows:
- `ゲーム数 9538G`
- `通常ゲーム数 6078G`
- `共通ベル成立回数 33回 (1/289.04)`

Arithmetic verification:
- `9538 / 33 = 289.03...`, matching the displayed `1/289.04` after display rounding.
- `6078 / 33 = 184.18...`, which does not match.

The same screen proves that other normal-state event rows use `通常ゲーム数`, e.g. `6078 / 24 = 253.25` for `通常時BB突入回数 24回 (1/253.25)`. Therefore the app must not assume one denominator for all My Slot counters; the displayed common-bell row specifically pairs with total `ゲーム数`.

Therefore, after real-device reverification:
- `BB/RD/AT初当り合成`: remain active representative numeric Feature.
- `共通ベル`: **reactivated as an active conditional numeric Feature**.
- Numerator: My Slot `共通ベル成立回数`.
- Denominator: My Slot result-screen `ゲーム数` from the same result screen/session.
- Do not pair common bell with `通常ゲーム数`.
- If My Slot eligibility/unlock conditions are unmet and the common-bell counter is unavailable, the observation is blank/unobserved, not zero.
- Preserve the My Counter Lv4 / cumulative eligibility guidance in MachineData.

Durable field-verification note: `FIELD_REVERIFICATION_RAKUEN_MY_SLOT.md`.

## Active Observation mapping after red-team and field reverification

| machine | active numeric observation(s) | acquisition notes |
|---|---|---|
| 211 いざ！番長 | AT初当り, 共通ベルA | 共通ベルA may use Daitomo auto count; manual and Daitomo provenance remain distinct. 直撃BIG is REFERENCE. |
| 212 絶対衝激 | real bonus, AT初当り | no manufacturer-linked service. Evidence separate. |
| 213 わたしの幸せな結婚 | bonus初当り, AT初当り | eSLOT+ exists but exact machine-specific fields are not assumed. |
| 214 LBトリプルクラウン | BIG, REG, cherry, plum | machine menu CHECKED_NONE; linked service CHECKED_NONE; ドラマチックスコア is seat-visible aid only. |
| 215 マタドールⅢ | BB, RB | machine menu CHECKED_NONE; linked service CHECKED_NONE; BT中1枚役 is REFERENCE. |
| 216 転生したら剣でした | AT初当り | eSLOT+ exists; exact field list not assumed. |
| 217 ダーリン・イン・ザ・フランキス | bonus初当り | conditional/state-qualified families are REFERENCE. |
| 218 咲-Saki- 頂上決戦 | AT初当り | previous AT-end screen menu recovery is Evidence route, not numeric denominator source. |
| 219 2022 このすば | AT初当り | My Slot exists; exact machine-specific counters not assumed. |
| 220 楽園追放 | BB/RD/AT初当り合成, 共通ベル | common bell uses same-screen My Slot `ゲーム数` denominator; requires verified My Slot counter availability. |

## Observation debt classification

### WEB_RESEARCH_CANDIDATE
- **0 active blockers.**

### MACHINE_REQUIRED
- わたしの幸せな結婚: eSLOT+ exact machine-specific field list, if needed for future automatic acquisition.
- 転生したら剣でした: eSLOT+ exact machine-specific field list.
- 2022 このすば: My Slot exact machine-specific field list.
- いざ！番長: explicit direct-BIG vs AT初当り composition if future adoption is desired.

Resolved 2026-09-04:
- 楽園追放: My Slot common-bell counter accumulation universe / same-session denominator pairing — **RESOLVED by real-device My Slot screen**. Denominator is same-screen `ゲーム数`.

### LOW_PRIORITY_HOLD
- Gate-B REFERENCE conditional families not required by current inference.

## Shared Feature + Evidence final audit

- No active numeric observation requires a duplicate Evidence-only input surface.
- Live observation and menu/service recovery of the same presentation are acquisition routes to one observation, not separate observations.
- `sharedFeatureIds` downstream may only reference active Features.
- Evidence-only screens/voices/trophies must not be given synthetic numeric likelihood IDs.
- Blank means unobserved; observed zero remains distinct.
- My Slot rows with different displayed denominator semantics must remain separate Observation definitions; do not infer a common denominator from proximity on the same screen.

## Gate C decision

**PASS — REAUDITED 2026-09-04.** Observation red-team has 0 unresolved active WEB_RESEARCH_CANDIDATE. The user-provided real My Slot screen resolves the previously machine-required denominator ambiguity for 楽園追放 common bell, so that Feature is active again with the exact same-screen `ゲーム数` denominator. Proceed to UI Design / MachineData Gate D. Any future attempt to reactivate いざ！番長 direct BIG must reopen Research → Selection → Observation for composition proof.
