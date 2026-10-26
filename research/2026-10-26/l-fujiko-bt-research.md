# L不二子BT Research / Model Design — 2026-10-26
status: RESEARCH_CLOSED_WITH_LIMITATIONS
scope: Research, self-audit, proposed model only. No Evaluation/Eligibility/Contract.
identity: L不二子BT / LB不二子M2 / アムテックス / BT / introduced 2025-12-22
settings: [1,2,4,5,6]
sources:
- https://nana-press.com/kaiseki/machine/1070/
- https://nana-press.com/kaiseki/machine/1070/34193/
- https://nana-press.com/kaiseki/machine/1070/34202/
- https://1geki.jp/slot/lb_fj2/0/
- https://chonborista.com/slot/amute/246917/
- https://www.p-world.co.jp/machine/database/10383
- https://pachiseven.jp/articles/detail/25646
checked: 2026-10-26
## Six domains
1 bonus: confirmed. Normal SBIG 1/697.2 common; normal BIG [394.8,364.1,319.7,291.3,229.1], REG [321.3,304.8,278.9,252.1,227.6]; overall [141.2,134.0,122.7,113.2,98.1]. Separate BT from normal. Source tables have merged cells; do not fill from blank as 0.
2 roles/overlap: confirmed. Normal plum A [9.3,9.1,8.9,8.7,8.6], plum B [25.6,25.1,24.3,24.0,23.7], cherry [53.1,51.8,49.3,48.2,46.7]. Cherry+BIG [6553.6,5461.3,3120.8,2520.6,1560.4] and cherry+REG [2621.4,2184.5,1424.7,1170.3,978.1] per normal game. SBIG cherry overlap common-rate; track only if observable.
3 transitions: BT entered after SBIG; 2-coin play until next bonus; BT SBIG continues, BT BIG ends; setting-dependent conditional BT outcomes not fully published -> record, no invented likelihood.
4 screens/voices: confirmed. BIG/SBIG adjustment success voices 5 categories with probabilities depending on success at G1 vs G2+ (see sources). REG character scenario 1-12 with probability table groups and odd/even conditional; avoid multiplying grouping and breakdown likelihood. BIG/SBIG stamps [none,可,良,優,極] with estimated thresholds only, not confirmed constraints.
5 hard hints: パチンコジャッジ8 -> >=2; カードジャッジ ハルルナPUSH -> >=4; BIG adjustment 不二子 voice -> >=5 with published 0 probability settings 1,2,4; REG scenario 8-10 >=2, 11 >=4, 12 >=5 subject to table accuracy. 'スタンプ' is previous-machine inference, not strict constraint pending confirmation. 隠れ凪 meaning unknown => record only.
6 state/denominators: confirmed. Normal (3-coin) and BT (2-coin) distinctly denominated; no AT/CZ; no ceiling. Count normal-game G once; count BIG/SBIG game G separately for 斜めプラム [4.50,4.30,4.15,4.00,4.00].
## Proposed likelihood graph (not formally approved)
- Normal bonus categorical (SBIG,BIG,REG,none) over eligible normal spins; overall is derived only.
- Cherry count and cherry/bonus overlap are nested: use joint category by game where identifiable, otherwise choose either marginal cherry or joint conditioned counts; never double count overlap. Cherry+SBB settings common.
- Plum A/B and cherry marginal rates can be evaluated only after confirming exclusive flag categories and bonus overlap assumptions; avoid naive multiplication.
- BT bonus statistics only with BT-specific distributions, never use normal bonus rates.
- REG scenarios multinomial; group 1-3,4-6,7,8-10,11,12; detailed odd-even conditional counts only if established; avoid double counting.
- BIG voice multinomial split by first vs later successful adjustment; denominator is number of successful trials, not all BIGs. No success => excluded.
- Hard constraints and unknown-probability recording are separate.
## Proposed UI
Game count: one normal-games input, not total including BT; independent BIG/SBIG sampled spins for diagonal plum.
Sections: 通常時のボーナス(SBIG/BIG/REG); 通常時の小役(プラムA/B/チェリー); チェリー同時当選(BIG/REG, use counted cherry denominator only if likelihood is conditional); BIG中の斜めプラム; 枚数調整時ボイス (1G目 vs 2G目以降); REG中のキャラ紹介; BIG終了画面; その他設定示唆 (specific trigger only).
Do not ask for redundant totals; group common observation conditions. Unknown numeric hints label 記録のみ・推測計算には使用しない.
## Self audit / issues closed or scoped
- 1geki labels setting '3' in rows of voice / scenario tables: other sources explicitly label corresponding row as setting 4; transcribe 4 after source cross-check, preserve discrepancy.
- Stamps cited as old-generation analogical inference, therefore do not convert to hard constraints.
- '隠れ凪' documented but effect unknown; closed as no numeric likelihood.
- No external independent auditor engaged: self-audit only.
- P-town / manufacturer-site dedicated detailed checks not fully verified by this investigation: coverage limited, do not claim exhaustive site sweep.
- All rates here are published/display-rounded; likelihood needs consistency and normalization verification in Work.
Research closure means traceable scope, not validated statistical eligibility.
Next: LB スロット GALFY; Work after entire batch: verify repository baseline, ingest research, Evaluation -> Eligibility -> Candidate Contract.

## 2026-10-26 additional source audit / non-negotiable dependency correction
Direct original source: https://nana-press.com/kaiseki/machine/1070/34202/
REG character scenario selection is NOT simply one unconditional multinomial: **first REG and every 5th REG** increase hint probability. Preserve ordinal REG count or group categories for distribution modeling; only use unconditional published overall distributions when source explicitly says 全状態の合算. This is a source-confirmed condition missed in earlier draft; model must not ignore it.
Source shows red-character aggregated categories across five settings, but visual text extraction conflates different colored/red-background scenario names, so do NOT map the aggregated rows to 1–12 and do NOT infer exact scenario likelihood from table without confirming display labels. '銭形出現' distribution [37.5%,62.5%,62.5%,37.5%,62.5%] for settings [1,2,4,5,6] is an aggregated observation over REG; it overlaps scenario classification and cannot be multiplied independently. Treat as alternative coarse likelihood ONLY if count is reliably observed and no scenario likelihood used.
https://chonborista.com/slot/amute/246917/ reports cherry+REG setting1 1/2624.4 whereas https://nana-press.com/kaiseki/machine/1070/32970/ says 1/2621.4; preserve disputed setting1 denominator and exclude from numeric contract until resolved. This is an actual publication conflict, not innocent decimal rounding (difference 3 games).
Site coverage this pass: Nana, 1geki, Chonborista, Pachi7 substantive; DMM search targeted but no verified machine-specific record retrieved; Sammy/SANKYO/Spiky manufacturer sources not applicable to Amtex. Full standard verification not yet attained. Do not certify exhaustive Research completion.
Production README read: prototype control-plane only, production source is canonical for orchestration; existing candidate inventory & schemas not yet reconciled. No formal model eligibility.

## User decision: 2026-10-26
REG キャラ紹介 is ONE section with two tabs: 「初回・5の倍数回目」 and 「それ以外」. Twelve scenario options in each tab; inputs are separated by REG opportunity type, without duplication. Use ordinal REG count: 1,5,10,15... belong to first tab, others to second. Source scenario distributions are all-states aggregates, not condition-specific rates: do NOT plug the same rates into two tab-specific likelihoods. Record-only pending verified conditional vectors; apply exact constraints where independently established.
Cherry+REG setting1 conflicted value: ADOPT 1/2621.4 as majority-supported, not 1/2624.4. Sources showing 2621.4: nana-press https://nana-press.com/kaiseki/machine/1070/32970/ ; P-WORLD https://www.p-world.co.jp/machine/database/10383 ; slomiru https://slomiru.com/fujiko_bt ; pachinavi https://pachinavi.net/machines/smasloth-fujiko-bt/settei/ . Conflict recorded: Chonborista https://chonborista.com/slot/amute/246917/ lists 1/2624.4. Do not count syndicated copies as independent publications; rationale is majority of located displays including two established sources; provenance uncertainty remains. 2026-10-26.
Only these two issues are resolved; full standard site coverage and baseline reconciliation still open. Do not advance to next machine before the full Research closure conditions.

## 2026-10-26 continued single-machine source & repository check
Repository cross-check completed for accessible data repository locations: production/specs/batch-20260928-001.json is an older 10-machine Wave prototype (Manifest v8.5), with no L Fujiko entry; catalog.json currently lists only S_IM_JUGGLER_EX_TP; published machines/ directory likewise. Therefore absence of Fujiko in public deployment is not proof that app repository has no candidate/contracts. DO NOT claim full source-of-truth comparison: private app repository still must be inspected, especially its current Production State. Existing 9 other provisional machines left untouched.
Standard source confirmation: Nana https://nana-press.com/kaiseki/machine/1070/32970/ ; 1geki https://1geki.jp/slot/lb_fj2/0/ ; Chonborista https://chonborista.com/slot/amute/246917/ . Targeted DMM and Pachi7 site searches found no machine-specific setting model page to verify in this pass; record as scope limitation (not guaranteed absence). Manufacturer Sammy/SANKYO/Spiky unrelated to Amtex. Do not broaden search merely to fill result counts.
Important identity/source warning: independent derivative https://pachinavi.net/machines/smasloth-fujiko-bt/settei/ INCORRECTLY lists setting 3 and asserts SBB varying by setting; manufacturer-facing/repeated principal analyses clearly show settings 1/2/4/5/6 and SBB common 1/697.2. Do NOT count pachinavi as a valid majority ballot for disputed setting1 cherry REG; use primary editorial pages, preserve 2621.4 as user choice with conflicting 2624.4 explicitly traceable.
REG scenarios page https://nana-press.com/kaiseki/machine/1070/34202/ explicitly notes frequency boost at first and every 5th REG, not confirmed per-condition full multinomial. Tab design stays, record-only probabilities until context-stratified data exists; constraints apply by scenario, no arbitrary likelihood.
Two hard constraints need unambiguous scenario-to-number verification; current Research note scenario 8–10/11/12 mapping is NOT authoritative without verifying exact colors/patterns on source page. Use human-readable full sequence as UI label and explicit setting upper/lower bound only after direct verification.
Status: Research closure under strict all-eight-site evidence standard not proved; no formal statistical evaluation; do not mark unconditionally complete. Single-machine working scope remains L不二子BT.

## 2026-10-26 continuing audit — source-confirmed exact REG mapping and app HEAD
Source https://nana-press.com/kaiseki/machine/1070/34202/ directly confirms exact scenarios:
- 1 odd hint, 2 and 3 even hints, 4 odd+weak higher, 5 and 6 even+weak higher, 7 strong higher.
- 8 odd+setting>=2, 9 and 10 even+setting>=2, 11 odd+setting>=4, 12 even+setting>=5.
These are source-confirmed 12 scenario semantic labels and exact constraints; earlier caveat about scenario 8–12 unverified can now be superseded. Red-colored and plain characters in duplicated displayed character sequences MUST still be distinguished in UI labels (display issue in HTML parsing).
Same source publishes two marginal probability distributions: group of red character presentation, and '銭形出現' marginal with settingwise [37.5%,62.5%,62.5%,37.5%,62.5%]. The red group table is '全状態の合算', not per 5th-REG class. If all REG observations are summed, one may use the marginal of 銭形 appearance alone as a binomial/complemented partition, but DO NOT also multiply likelihood from red presentation or full 12 scenario sequence over same REG observations. If only condition-specific tabbed counts and corresponding exposure are recorded, show separate tabs but compute an all-REG aggregate solely where mathematically legitimate for the published marginal. No invented per-condition probabilities.
App repository main tree GET /git/trees/main?recursive=1 returned 234 files and no file names with fujiko/research/manifest/candidate/contract; that is not exhaustive content search (possible data embedded in other filenames). Hence full Production State reconciliation against private app remains limited; report it honestly instead of assuming no candidates.
Manufacturer three research sites (Sammy, SANKYO, Spiky) do not cover Amtex brand; record not applicable, not unchecked. For DMM and Pachi7 targeted searches did not provide a machine-specific confirmed numerical reference within this pass; mark searched without confirmed relevant machine-specific source. Do not repeat search indefinitely.
### Status decision
Pending: confirm original candidate IDs and numeric content in latest authoritative Production assets; current data repo production specs are old orchestrator prototype and cannot certify absence in private app. Research model itself permits closing undisclosed conditional REG rates as unknown and formal Evaluation to assess aggregate observable marginal. Do not imply verified end-to-end when this pending check remains.

## One-machine closure disposition 2026-10-26
Research decision: CLOSED — source-bounded v8.5, with expressly scoped limitations. This is not formal model approval or full external independent audit.
All 6 topic domains visited. Data repo production/specs/batch-20260928-001.json and published catalog and app main tree (234 entries) have no Fujiko dedicated MachineData or candidate contract. This is a path-based check limited to those two verified HEAD trees; no guarantee about unpublished branches or remote artifacts. No prior candidate was deleted or reset.
Domain 1 normal bonus: verified; model independent outcomes via single categorical partition, combined derived only.
Domain 2 small roles/overlap: source parameters documented; conflicting cherry+REG setting1 resolved by user to 1/2621.4, original alternative preserved.
Domain 3 BT states: normal vs BT separated; unpublished BT conditional distribution is closed as information not confirmed.
Domain 4 voice/scenario/screen: scenario 1–12 semantic condition verified. Normal REG ordinal vs first/5th separated in ONE UI section via tabs. Numeric red-character probabilities published only as all-condition aggregate; conditional distributions missing -> record only for respective tabs; source-grounded exact setting constraints may apply. Zenigata aggregate probability is an optional coarse derived candidate ONLY when source-matched counts pooled and no finer scenario model used. Numeric voice distributions need proper on-success/ordinal eligibility, not general BIG count. Screen stamp inference from prior versions is not a firm exact constraint.
Domain 5 setting exact signals: scenario 8-10 >=2; 11 >=4; 12 >=5; voice Fujiko >=5; pachinko 8 >=2; halruna PUSH >=4. Unconfirmed hints remain records.
Domain 6 state/denominator: 3coin normal and 2coin BT separate; 1st/5th REG ordinal must be preserved. Input duplicates forbidden.
Site boundaries: Nana, 1geki, Chonborista examined; Pachi7 and DMM targeted without independently verified detailed model figures, classified 'searched/public detailed data unconfirmed', not 'unvisited'. Manufacturer Sammy/SANKYO/Spiky inapplicable to Amtex. A separate third-party independent audit was not carried out, clearly marked self-audit. Research closes per user's bounded-scope contract even though not every rate becomes numeric.
Final assessment of Model: PROPOSED. Work must validate confidence of any exact constraint against 0-probability semantics and compare all group likelihoods before official Evaluation/Eligibility. No formal statistical score/Contract generated.
Next machine in order: LB スロット GALFY. Do not reopen this machine absent new source or concrete error.
