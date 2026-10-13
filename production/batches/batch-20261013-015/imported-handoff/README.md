# SloAnalytica Research / design handoff — 2026-10-13

## Scope and integrity
Ten user-selected machines, unchanged. This is a **PARTIAL research and model-design artifact**, not a complete source audit or eligibility determination. No production edits, QA approval, formal score, or Candidate Contract creation are claimed.

Repository ownership / installed access was confirmed for both `hanashinonetachou-arch/sloanalytica-data` and `hanashinonetachou-arch/sloanalytica-app` (default branch `main`); production manifests, latest branch/Batch and Contracts were **not retrieved**. Thus all current-contract comparisons remain outstanding.

## Files
- `machines.json`: identity, URLs, stage
- `candidates.json`: structured observation candidates, subset of numeric values, dependency warnings
- `candidates.csv`: import-friendly flattened table
- `coverage.csv`: area-level findings; a found heading is NOT proof of full coverage

## Research methodology / self-audit
Web primary source for each machine is in candidate rows (mainly なな徹, one パチナビ). Secondary cross-source review performed for selected machines (鬼武者3 via 一撃; スーパービンゴ via independent listing on パチナビ). Other machine-specific secondary verification and full section extraction is outstanding. **External audit has not been performed**. Do not call this an independent external audit.

Key risks:
1. 炎炎ノ消防隊: its machine page describes 炎炎激闘初当り as 1/689..1/479 but page introduction elsewhere has 1/259.5..1/221.1; definitions must be resolved before evaluation.
2. 今日から俺は!!: initial-hit figures available for setting 1 only; some trophy information is explicitly about PREVIOUS machines and must not be imported as this machine's constraints.
3. 鬼武者3 (2024) must not be confused with 新鬼武者3 (2025).
4. パチスロナイツ is a pseudo-bonus machine with two mutually exclusive bonus types, not a generic pure A-type. Confirm valid denominator and bonus-branch classification.
5. 設定L in Bingo (and 炎炎) is distinct from ordinarily inferable settings.
6. All conditional successes must be counted against a correctly restricted opportunity count. A composite initial-hit rate and its constituent opportunity-success rate cannot be multiplied as independent observations from the same game history without a joint model.
7. Numeric value arrays have setting labels. Missing values mean unavailable, not zero or interpolated.

## Model schema
Event rates: Binomial/Poisson approximation on the appropriate game exposure ONLY after validating public definition and hazards. Conditional success: Binomial(successes, eligible trials, p_setting). Categorical outcomes: conditional Multinomial on exclusive outcomes. Exact setting constraints: mask impossible settings only when source substantiates certainty. Unquantified high/odd/even hints: record-only, never invented probabilities. Dependent evidence: partition events into disjoint routes, or evaluate just one higher-level summary until a joint likelihood is justified.

## UI principles
Plain Japanese item titles; detailed help contains denominator, explicit exclusion and observable instructions. Periodic one-time events use distinct start/restart trial groups. AT / CZ / bonus game-based figures use `1/x`; percentage only for categorical or conditionally successful trials. Same observation surface should be one tabbed section. +50 for game-count denominators only; no - control. Keep known-unknown events visible for record without likelihood. A-type uses total G only, but classify the pseudo-bonus Knights appropriately after source/Contract inspection.

## Remaining actions before claiming Research completion
Retrieve the complete original machine pages and other independent sources for all ten. Extract every numeric table and image-linked condition, check manufacturers, type codes, introductions, reset modifiers and all relevant categories. Record each published figure with origin URL and explicit definition. Self-audit each area as confirmed / searched-unpublished / structurally inapplicable / unverified. Reconcile source contradictions within a bounded recheck and close without invented values. Then validate repository schema and pass to formal statistical evaluation. Work must not treat `coverage.csv` current 'information confirmed' as exhaustive verification.


## 2026-10-13 continuation / self-audit delta
Additional 3 evidence candidates added for 戦国†恋姫 (BIG, REG, watermelon), total 76 candidates. Confirmed separate numeric definitions for 炎炎 bonus and 炎炎激闘, explicitly flag reset-period and opportunity-condition limitations. `self_audit_followup.csv` records 7 machine-specific findings and cited URLs. This is a further **partial** research result, not a claim of exhaustive independent audit. No repository content/Contract diff performed. GitHub branch discovery found `production/v85-batch-015-research-20261013`; the relevant batch must still be matched against actual machine IDs and persisted artifacts.
