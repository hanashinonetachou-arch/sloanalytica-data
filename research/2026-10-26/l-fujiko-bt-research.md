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
