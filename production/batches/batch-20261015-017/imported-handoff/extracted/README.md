# SloAnalytica — Evaluation extension (2026-10-16)

## Actual deliverable
- Recalculated 19 independent *candidate scalar records* with six published setting entries using the same six-setting uniform-prior binomial posterior-entropy formula as `tools/calculate-selection-ig-v8.mjs` on `prototype-multi-machine`.
- Trial scenarios at 10, 50, 100, 500, 1500, 3000 and 7000 event opportunities: 133 computed records.
- 12 input records excluded due to missing six-setting completeness or duplicate/derived categories. They remain retained upstream.
- 3 previously computed small-role 7000-normal-G scores reproduced within rounding.

## IMPORTANT: no Eligibility assigned
- These are *n-trial* scenarios, not 7000G exposed opportunities, unless a verified feature opportunity is actually one per target normal game.
- The 7000 trials column for REG/BIG ending screens, CZ, conditional high-state probabilities and AT does **not** describe 7000 actual games and must never be interpreted as a SelectionScore for the app.
- Even per-game small-role outcomes must be checked against target-game definitions and overlapping adopted features.
- Six-setting completeness is only a filter for this calculation; missing settings must not be invented, and a machine with five settings may be handled separately via correct priors and official machine contracts.
- Some input rows may be alternative/overlapping categories even when names differ: none of these IG values are summed or used for combined inference.
- If a success condition uses different states, the correct conditional denominator must be retained; probabilities cannot be treated as unconditional Bernoulli events.

## Reuse contract
Input: NUMERIC_MODEL_INPUTS_PRECHECK.json from Research_To_Evaluation_Inputs ZIP; the script accepts its path. This is standalone diagnostic reproduction; it does not assert Production orchestrator transition completion.

## Status
Research evidence and observation definitions need final per-candidate dispositions. Production Batch unknown. Official Selection/Eligibility and final Candidate Contracts NOT complete. GitHub untouched, Actions unused.
