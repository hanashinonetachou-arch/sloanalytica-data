# Batch 20260901 — Gate A Completion

Date: 2026-09-01
Branch: `batch/20260901-magia-gundamseed`
PR: #149 (stacked on PR #148)
Formal standards: Core Policy v1.7 / RSO v6.9 / UX v6.9

## Result

**Gate A — Statistical Research Completeness: PASS_WITH_TRACKED_RESEARCH_DEBT**

This result means the known public setting-difference candidate universe has been reviewed and transferred into Research for all 10 machines. It does **not** mean every public source exposes a complete all-setting numeric table, and it does not make any Selection decision.

## Runtime validation

GitHub Actions run `33473996001` executed on Node 22 and completed successfully.

- ResearchData validation: PASS — 10/10
- Discovery → Research completeness: PASS
- discovered candidates: 85
- transferred candidates: 85
- missing: 0
- generated runtime report: `reports/batch-20260901-gate-a-runtime-audit.json`
- generated ResearchData/inventory commit: `899a1acc`

Expected Research warnings only:
- Magia `RF_MODE_AT_END`: four `MULTINOMIAL_ROUNDED_SUM` warnings caused by published rounded category percentages.
- L Godzilla `RF_SHURAI_OPPONENT`: four `MULTINOMIAL_ROUNDED_SUM` warnings caused by published rounded category percentages.
- No ResearchData validation errors.

Research preserves those published rounded values unchanged. Any normalization decision belongs to Selection/MachineData and may occur only under the manifest normalization contract.

## Web → Discovery exhaustiveness review

A separate cross-source sweep was performed before materialization. The review covered identity/official pages and major analysis pages and explicitly searched for setting-specific:
- initial-hit / appearance rates;
- small-role rates;
- selection/allocation rates;
- state/role conditional lotteries;
- mode distributions;
- reset-only / post-ST distributions;
- screen / character / voice / card / trophy / payout cues;
- linked-service support and machine-specific counters.

Known incomplete public tables are present in Research as `pending` candidates rather than being silently omitted or interpolated. Therefore:
- Unreviewed statistical categories = 0 for the current discovered universe.
- Discovery candidate missing from Research = 0.
- Web → Discovery exhaustiveness review = completed for Gate A.

This is an exhaustiveness review of the public sources checked in this batch, not a claim that no future source can publish additional data. Later discoveries must reopen the affected Research layer.

## Linked services

FOUND:
- Magia Record — UniMemo. Official Universal supported-machine list confirms support; machine-specific analysis confirms weak-cherry counting. Full result-field inventory remains downstream field-list debt.
- Idolmaster Million Live! Next Prologue — SloPla NEXT. Official machine/result surface exposes total/normal games, initial-hit/CZ, rare-role raw counts and multiple bonus/live counters.
- Midoridon VIVA REVIVAL — UniMemo. Official Universal supported-machine list confirms support; machine-specific analysis supports weak-cherry / weak-wave / reach-eye replay counting. Full result-field inventory remains downstream field-list debt.

UNRESOLVED:
- L Godzilla
- L Ushio & Tora Hakumen Kessen
- Amazing Live
- Yoshimune
- L Mahjong Monogatari
- Classroom of the Elite
- Gundam SEED

These seven are not promoted to CHECKED_NONE without machine-specific primary evidence proving absence. General manufacturer apps, simulators, QR/member services, or family-level services are insufficient.

## Tracked Research debt carried into Selection/Observation

- Magia: several state/trigger conditional tables are represented as pending grouped candidates; do not flatten to normal-game rates.
- Godzilla: Exploration Zone middle-setting values and replay-point CZ full table remain incomplete publicly in the checked sources.
- Ushio: reset distributions are conditional on known reset; state/role CZ full all-setting table remains incomplete.
- Amazing Live: setting-different small-role table remains unresolved; settings are 1/2/4/5/6 plus operational SET_L only.
- Yoshimune: practical mode/zone observations are not promoted to official exact probabilities; setting vs mode voice semantics require separation.
- Mahjong: partial conditional tables remain unresolved; Bonus/AT/aggregate and direct/practical-direct dependencies are explicit.
- Idolmaster: direct-high/heaven/300G full tables unresolved in checked sources; SloPla raw counters remain Observation candidates.
- Youjitsu: mode-3 role-specific CZ table remains conditional/incomplete.
- Midoridon: reach-eye even-setting values and state/role bonus complete table remain unresolved; exact eligible denominators preserved.
- Gundam SEED: nested route-specific lottery tables remain pending; 100G distribution is opportunity-level, not per-game.

## Registration

Correct production provisional IDs for this batch are 192-201. ID 191 is already occupied by test-only `S_REVUE_STARLIGHT_CX_TEST_V66`; no production artifact was written using the invalid earlier 191-200 allocation.

## Next stage

Proceed to Selection / Gate B. Every Research Feature and Evidence candidate must receive an explicit disposition. Dependency/high-risk overlap resolution is especially required for Amazing Live and Mahjong Monogatari, and conditional denominators must be preserved for Ushio, Youjitsu, Midoridon and Gundam SEED.
