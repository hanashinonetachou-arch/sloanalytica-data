# 2026-09-03 Next 10-machine Batch — Gate 0 Discovery Red-Team Pass 1

Status: IN PROGRESS
Branch: `research/20260903-batch10-next`
Scope: broaden Discovery Candidate Universe without Selection decisions.

## User-verified Observation constraints

- `LBトリプルクラウン`: manufacturer-linked service = `CHECKED_NONE`; machine menu = `CHECKED_NONE`.
- `マタドールⅢ`: manufacturer-linked service = `CHECKED_NONE`; machine menu = `CHECKED_NONE`.
- For these two machines, downstream Observation must not assume recovery of counters/history from an in-machine menu. Candidate inputs must be based on seat-visible data-counter information, direct manual observation, or other independently verified acquisition methods.

## Red-team findings added / strengthened

### 211 いざ！番長
- Setting-difference candidates include overall initial hit, weak cherry, and especially common bell A.
- Public analysis gives common bell A as a per-game small-role probability with a much larger setting spread than weak cherry.
- `ダイトモ` can automatically count small roles; this creates a distinct acquisition route from direct visual/manual counting and must keep its own denominator/provenance.
- Candidate family retained: initial hit / direct BIG / small roles / mode-state-transition candidates / setting evidence.

### 212 L 絶対衝激～PLATONIC HEART～
- Retain numeric candidates already discovered: real-bonus / AT initial hit / state-dependent high-state transition / CZ family.
- Evidence family is broader than trophies: special-move names during the relevant bonus situation include setting denial / lower-bound / confirmed-setting patterns.
- `ナミちゃんトロフィー` is also retained as Evidence; occurrence timing/condition must be represented explicitly rather than as an unrestricted event.
- Manufacturer-linked service remains `CHECKED_NONE` from user verification.

### 213 わたしの幸せな結婚
- KONAMI officially confirms `e-slot+` integration and describes the service as allowing linked machines to expose game count / bonus count and other play data on smartphone.
- Machine-specific concrete field list is not yet proven from the public official material found in this pass; therefore do not infer that every desired numerator/denominator is obtainable.
- Retain initial hit / CZ / mode-G allocation / bonus-through ceiling / ending and trophy Evidence candidates.

### 214 LBトリプルクラウン
- Confirmed setting-difference numeric families: BIG, REG, combined bonus rate, cherry, plum, and role-specific bonus overlap / practical bonus classes.
- Important dependency risk: BIG/REG/combined and role-specific overlap are not independent families by default. Research must preserve all published candidates, while later Selection must prevent duplicate likelihood counting.
- Evidence: REG-end LED patterns include strong lower-bound/confirmed-setting indications. Special trophy / bonus-end indications and music-change candidates remain in Discovery until fully traced.
- Machine menu = `CHECKED_NONE`; manufacturer-linked service = `CHECKED_NONE`.

### 215 マタドールⅢ
- Confirmed numeric families: BIG, REG, combined bonus rate and BT-phase one-yen-role event.
- BT one-yen-role probability has a very large setting spread and must remain in Research despite conditional/limited trial opportunities; practical exposure is a Selection-stage question.
- Evidence: count-adjustment-success `コンドルランプ` color and bonus-end panel flash.
- Machine menu = `CHECKED_NONE`; manufacturer-linked service = `CHECKED_NONE`.

### 216 パチスロ 転生したら剣でした
- KONAMI officially confirms `e-slot+` integration and describes linked-service access to game count / bonus count and other play data.
- Machine-specific concrete field list remains unresolved in this pass; no numerator/denominator will be auto-mapped from generic e-slot+ capability alone.
- Retain CZ / bonus / AT initial hit, mode-state / prescribed-game candidates, CZ success/type, and all bonus/AT/ending Evidence families.

### 217 L ダーリン・イン・ザ・フランキス
- Numeric candidate universe is broader than simple initial hits: bonus initial hit, bonus-high-probability initial hit, total Franxx-high transition, cherry-triggered transition, chance-role-triggered transition, CZ initial level distributions, and final CZ level / bonus-win relationship.
- Evidence families include ending cards, ending illustrations, bonus-high-probability end screens, payout-over displays, and `ナミちゃんトロフィー`.
- These conditional numerators require explicit trial universes; e.g. role-triggered high-state transitions cannot share a generic normal-game denominator.
- Manufacturer-linked service = `CHECKED_NONE`.

### 218 L咲-Saki- 頂上決戦
- Confirmed numeric families: CZ initial hit, AT initial hit, mode migration, CZ-through ceiling allocation, and `清澄トライアル` transition/result-related setting difference.
- Evidence: AT-end odd/even illustrations, `クジラッキー` lower-bound/setting-confirmed patterns, and ending `和ランプ` color distributions conditioned on rare-role class.
- Public analysis states prior AT-end screen can be checked from the machine menu until the relevant later point. This is a seat/menu Observation route and must not be confused with a manufacturer-linked service; linked service remains `CHECKED_NONE`.

### 219 パチスロこの素晴らしい世界に祝福を！
- Confirmed numeric families: AT initial hit; emergency-quest opponent distribution; bath-zone initial points; bonus/AT 7-alignment rates; hidden-mode transition; and other published conditional rates.
- Evidence universe includes Sammy trophy, bonus end screen, AT-end PUSH voice, AT navigation voice, non-active-section debt amount voice, payout-over displays, and victory illustration.
- Public sources publish AT-end voice occurrence rates and multiple lower-bound / confirmed-setting Evidence patterns. Research must not collapse all of these into a single generic Evidence flag.
- `マイスロ` = FOUND from user verification. Concrete machine-specific obtainable field list still needs dedicated trace; no generic My Slot assumption is used here.

### 220 パチスロ楽園追放
- Confirmed numeric families: RD rate, AT initial hit, combined initial hit, common bell, normal/high-state role-dependent hit draws, and NAH-high / awakening-related candidates.
- Common bell is visually indistinguishable from push-order bell. Public analysis states My Slot counter Lv4 (after the stated cumulative play requirement) exposes its count. This is an acquisition-condition constraint and not a reason to drop the candidate.
- Evidence families retained: RD end screen, AT end screen, special episode, payout/other setting evidence.
- `マイスロ` = FOUND from user verification.

## Dependency / denominator red-team flags to carry into Research

1. `BIG`, `REG`, `合算` and role-specific overlap rates must all be documented in Research, but later likelihood adoption must avoid exact/subset double counting.
2. Conditional transition rates require the denominator to be the number of eligible trigger-role opportunities in the stated state, not generic game count.
3. Menu/service-reported counters and direct visual counters are separate acquisition methods until trial-universe equivalence is proven.
4. Evidence occurrence conditions (ending-only, bonus-end, rare-role + PUSH, etc.) must be encoded per observation. Do not treat every Evidence item as having the same trial count.
5. Blank = unobserved remains distinct from observed zero for manually counted optional observations.

## Gate 0 remaining work after Pass 1

- Finish two-source cross-check / provenance for remaining numeric families on all 10 machines.
- Resolve machine-specific concrete linked-service fields for ダイトモ / e-slot+ / マイスロ where public evidence permits.
- Finish machine-menu observability for machines other than the two user-confirmed `CHECKED_NONE` cases and the public Saki menu finding.
- Run final omission red-team for evidence-only candidates and conditional setting-difference families.

Gate 0 remains OPEN after this pass. No Selection adoption/rejection has been made.
