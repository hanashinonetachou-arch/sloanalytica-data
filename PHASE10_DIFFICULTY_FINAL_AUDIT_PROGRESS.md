# Phase 10 — Difficulty / Setting-band Final Cross-machine Audit

Date: 2026-08-22
Branch: `prototype-multi-machine`

## Scope

Final cross-machine audit after Phase 9 feature dependency closure.

Targets:

- Difficulty display scores at 1500G / 3000G / 7000G
- Setting-band discrimination targets at 60% / 70% / 80%
- Missing values and monotonicity
- Fixed benchmark calibration (My Juggler V, 7000G = 80)
- Cross-machine extreme-value review

The game count means the user's own standard play exposure. Predecessor snapshot data is not added to targetGames.

## Implemented in this phase

1. Added `tools/audit-difficulty-phase10.mjs`.
   - validates 1500/3000/7000 score availability for SCORED machines;
   - validates monotonic scores;
   - rejects negative scores;
   - validates 60/70/80 setting-band values when COMPLETE;
   - validates setting-band monotonicity;
   - validates the fixed My Juggler V 7000G=80 benchmark;
   - extracts highest/lowest 7000G scores and fastest/slowest 80% discrimination candidates;
   - marks only extreme candidates as REVIEW rather than automatically treating them as wrong.

2. Added `.github/workflows/phase10-difficulty-final-audit.yml`.
   - recalculates every available `difficulty-report.json` from ResearchData + SelectionData;
   - recalculates all setting-band reports;
   - synchronizes `difficulty-catalog.json`;
   - runs the Phase 10 audit;
   - commits the recalculated reports when successful.

3. Confirmed existing catalog validation already enforces:
   - catalog coverage for every machine in `catalog.json`;
   - 1500/3000/7000 raw and display target presence for SCORED machines;
   - non-decreasing display scores;
   - non-negative scores;
   - fixed benchmark consistency.

4. Existing calibration remains:
   - method: `FIXED_BENCHMARK_RAW_SCALE`
   - reference machine: `S_MY_JUGGLER_V_KD`
   - reference games: 7000
   - reference raw: 31
   - display reference: 80
   - scores are not capped at 100.

## Execution status

The Phase 10 recalculation workflow is committed and a follow-up trigger commit has been made.

At the time of this progress record, the connector-originated commits have not produced the expected GitHub Actions result commit. Therefore Phase 10 is **not yet declared COMPLETE** from this chat alone: the final recalculation/audit output (`reports/phase10-difficulty-final-audit.json`) has not been observed yet.

This is an execution-status limitation, not a known statistical failure.

## Completion gate

Phase 10 may be declared COMPLETE only after the recalculation run produces a report and all of the following are reviewed:

- structural ERROR = 0;
- global benchmark ERROR = 0;
- all REVIEW outlier machines individually checked for plausibility;
- no unexplained score or setting-band inversion;
- final report committed to the branch.

Phase 11 must not begin before this gate is closed.
