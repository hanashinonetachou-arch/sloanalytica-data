# 2026-09-03 Next 10-machine Batch — Research / Gate A Final

Status: PASS
Branch: `research/20260903-batch10-next`
Prerequisite: Gate 0 PASS
Policy: Core Policy v1.3 / Research-Selection-Observation Manifest v6.5

## Gate A decision

**PASS.** Every Discovery family from Gate 0 is traced into Research, and remaining unknowns are explicitly classified instead of being silently inferred. No Selection adoption/rejection decision is made in this document.

## Research invariants locked for downstream work

- Acquisition provenance stays separate for manual observation, seat-visible cabinet display, machine menu, Daitomo, eSLOT+, and My Slot.
- Numerator/denominator equivalence is never assumed across acquisition routes.
- BIG/REG/total, component/aggregate initial-hit families, role-specific overlap, and other correlated candidates remain in Research and are deferred to Selection dependency audit.
- Conditional candidates keep their actual trial universe: state-qualified draws, quest attempts, CZ level, bonus-through count, BT games, and mode-transition opportunities are not divided by generic total games.
- Suggestive Evidence stays distinct from lower-bound / exact-setting Evidence.

## Research debt resolution / classification

### 211 いざ！番長 — Daitomo
Public analysis confirms Daitomo automatic counting for setting-difference small roles including weak cherry and common bell A. No broader machine-specific Daitomo field list could be proven from authoritative public material in this pass. Therefore:
- weak cherry / common bell A automatic-count route = `RESOLVED_FOUND`
- other Daitomo machine-specific fields = `LOW_PRIORITY_HOLD` until Observation/UI work needs a concrete field
- no guessed field names are permitted

### 213 わたしの幸せな結婚 — eSLOT+
KONAMI officially confirms this title is linked to eSLOT+ and that eSLOT+ can expose play data such as game count and bonus count. Public material located in this pass does not prove a machine-specific field list. Therefore:
- linked-service existence = `FOUND`
- generic capability = `RESOLVED_FOUND`
- machine-specific field names = `WEB_RESEARCH_CANDIDATE` for Observation; do not block Gate A and do not infer them from generic capability

### 216 転生したら剣でした — eSLOT+
KONAMI officially confirms the title is linked to eSLOT+ and describes game-count / bonus-count class play-data capability. Exact machine-specific counters remain unproven publicly in this pass. Classification matches 213:
- linked-service existence = `FOUND`
- generic capability = `RESOLVED_FOUND`
- machine-specific field names = `WEB_RESEARCH_CANDIDATE` for Observation

### 219 2022 このすば — My Slot
Sammy officially confirms My Slot support for the original 2022 machine. Sammy's My Slot documentation establishes that machine-specific sites can contain latest result, play history, My Counter and cumulative-result classes of data, while a public machine-focused source reports that hidden-mode count becomes visible through My Counter after the relevant counter level is unlocked. Exact machine-specific counter inventory is not fully recoverable from authoritative public pages in this pass. Therefore:
- My Slot existence = `FOUND`
- hidden-mode My Counter route = `RESOLVED_FOUND`, with unlock-condition provenance retained
- other machine-specific numeric fields = `WEB_RESEARCH_CANDIDATE` for Observation

### 220 楽園追放 — My Slot
Independent public analysis confirms common bell is visually indistinguishable from push-order bell and that My Slot My Counter Lv4, reached at cumulative 15,000G, displays common-bell count. Sammy documentation also establishes the general My Counter / play-history data classes. Therefore:
- common-bell route = `RESOLVED_FOUND`
- eligibility = My Counter Lv4 / cumulative 15,000G
- any additional machine-specific numeric counters not separately proven = `WEB_RESEARCH_CANDIDATE` for Observation

## Conditional-trial semantics carried into Selection

| machine | candidate family | numerator | denominator / trial universe | provenance warning |
|---|---|---|---|---|
| いざ！番長 | weak cherry / common bell A | observed role count | games covered by the same counting route | manual and Daitomo routes must not be mixed without equivalence proof |
| 絶対衝激 | role -> high-state transition | qualifying transitions | occurrences of the triggering role in the specified source state | total games is invalid denominator |
| わた婚 | bonus-through ceiling distribution | observed ceiling category | eligible bonus-through sequences | not a per-game rate |
| トリプルクラウン | role-specific bonus overlap | bonus overlaps for role | occurrences of that same role | overlaps with aggregate bonus observations; Selection audit required |
| マタドールIII | BT one-coin role | one-coin events during BT | BT games only | total play games invalid; practical exposure must be estimated |
| 転剣 | weak chance role -> bonus by state | bonus hits after qualifying role | qualifying weak-chance-role occurrences in same state | normal/high/super-high remain separate |
| ダリフラ | CZ level-dependent success | bonus successes | CZ attempts that reached the specified level | CZ combined rate is a separate aggregate family |
| 咲 頂上決戦 | ending 和-lamp / screen distribution | category occurrences | eligible ending/screen opportunities | multinomial/evidence treatment; not per-game |
| このすば | quest-rank success / bath initial points | success or category count | attempts/entries at that rank or bath entry | generic total games invalid |
| 楽園追放 | state x role initial-hit draws | CZ/BB/etc hit | qualifying role occurrences in specified state | state-conditioned denominator mandatory |

## Numeric second-source reconciliation status

Primary headline rate families have at least one reliable detailed table and were cross-checked against independent public sources where available during Gate 0/Research passes. Where exact subfamily tables still have only one captured detailed source, the family remains Research-valid but carries source-density metadata into Selection. Missing a second table is not converted into a fabricated value or a Research rejection.

The most important cross-source consistency check in this pass is `S_RAKUEN_TSUHO_FS`: RD, AT, combined initial-hit, common-bell values and My Counter Lv4 condition are consistent across the HAZUSE machine pages retrieved independently.

## Evidence taxonomy lock

Downstream Selection/Observation must normalize each Evidence observation into one of the following semantics without strengthening it:

- `EXACT_SETTING`: exact setting confirmed
- `LOWER_BOUND`: setting N or higher
- `SETTING_NEGATION`: specified setting excluded
- `ODD_EVEN_TENDENCY`: odd/even tendency only
- `HIGH_SETTING_TENDENCY`: high-setting tendency only
- `LOW_SETTING_TENDENCY`: low-setting tendency only
- `OTHER_TENDENCY`: other non-hard hint

A tendency must never be converted into a hard exclusion. Multiple visual/voice/trophy categories that arise from the same single observation opportunity must be modeled as one observation surface with multinomial/category semantics where appropriate.

## Per-machine Gate A trace status

| ID | machine | numeric families traced | Evidence families traced | service/menu acquisition traced | Research status |
|---:|---|---|---|---|---|
| 211 | いざ！番長 | yes | yes | Daitomo + manual/seat routes | PASS |
| 212 | L 絶対衝激～PLATONIC HEART～ | yes | yes | linked service CHECKED_NONE | PASS |
| 213 | わたしの幸せな結婚 | yes | yes | eSLOT+ FOUND; exact fields debt | PASS |
| 214 | LBトリプルクラウン | yes | yes | linked service/menu CHECKED_NONE; cabinet display separate | PASS |
| 215 | マタドールⅢ | yes | yes | linked service/menu CHECKED_NONE | PASS |
| 216 | パチスロ 転生したら剣でした | yes | yes | eSLOT+ FOUND; exact fields debt | PASS |
| 217 | L ダーリン・イン・ザ・フランキス | yes | yes | linked service CHECKED_NONE | PASS |
| 218 | L咲-Saki- 頂上決戦 | yes | yes | linked service CHECKED_NONE; menu screen-recovery route | PASS |
| 219 | パチスロこの素晴らしい世界に祝福を！ | yes | yes | My Slot FOUND | PASS |
| 220 | パチスロ楽園追放 | yes | yes | My Slot FOUND; common bell route resolved | PASS |

## Gate A closure checklist

- [x] All Gate 0 candidate families traced into Research.
- [x] No candidate removed for weakness, rarity, burden, correlation, or Evidence-only status.
- [x] Headline numeric tables preserved where publicly available.
- [x] Conditional numerator/denominator universes explicitly defined at family level.
- [x] Acquisition provenance separated by method.
- [x] Linked-service existence states preserved from authoritative/user verification.
- [x] Unproven machine-specific linked-service fields remain explicit Observation research debt rather than guessed facts.
- [x] Evidence taxonomy normalized without strengthening hints.
- [x] Dependency-sensitive aggregate/component families retained for Gate B audit.

## Next gate

Proceed to **Selection -> Selection Quality -> Dependency / Double-counting Audit -> Gate B**. Selection must evaluate statistical usefulness, practical 7000G exposure, observability, complete setting values, and dependency. Research candidates may be rejected there, but only with a concrete reason and without deleting the Research record.
