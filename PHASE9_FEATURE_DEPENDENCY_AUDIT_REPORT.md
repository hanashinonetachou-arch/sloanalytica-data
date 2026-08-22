# Phase 9 — INCLUDE Feature Dependency / Double-counting Audit

Date: 2026-08-22
Branch: `prototype-multi-machine`

## Goal

Audit all currently active probability Features for dependency and double counting, especially:

- aggregate + subtype Features;
- bonus total + bonus composition;
- CZ / AT total + trigger-specific outcomes;
- small-role occurrence + outcome conditioned on that role;
- Evidence + probability Feature reuse of the same input.

Where two useful Features are related, prefer a mathematically valid factorization such as `P(parent) × P(child | parent)` instead of deleting one Feature or reducing weight arbitrarily.

## Implementation

Added `tools/audit-feature-dependency-phase9.mjs`.

The audit distinguishes:

- `DUPLICATE_EVENT`: the same observed event is independently reused by multiple active likelihoods;
- `DUPLICATE_BINOMIAL_CONTRACT`: identical numerator / denominator contracts;
- `EVIDENCE_FEATURE_OVERLAP`: the same input is evaluated by both Evidence and probability Feature;
- `HIERARCHICAL_CONDITIONAL`: parent event occurrence plus child composition conditioned on that parent.

The last category is safe when the child denominator is the parent event itself, corresponding to a joint factorization such as `P(REG) × P(REG subtype | REG)`.

Residual multinomial categories are also recognized. For example, if `single REG = total REG - cherry REG`, the total REG input is a residual base / denominator and is not treated as an independently duplicated event.

## Initial audit

The first pass reported:

- PASS: 98
- REVIEW: 2
- HIGH_RISK: 1

The HIGH_RISK candidate was My Juggler V. Manual inspection showed it was a false positive in the first audit implementation: `FEAT_SELF_NORMAL_OUTCOME` models REG occurrence per game, while `FEAT_SINGLE_REG_COMPOSITION` models cherry-overlap vs single composition conditional on total REG. This is the intended `P(REG) × P(composition | REG)` decomposition.

The audit was refined to understand residual category bases and general parent-event / child-denominator relationships.

## Final audit

Final `reports/phase9-feature-dependency-audit.json` result:

- machines: 101
- PASS: 101
- REVIEW: 0
- HIGH_RISK: 0
- safe hierarchical conditional relationships: 14

No active Feature pair currently requires removal, arbitrary weight reduction, or additional conditional reconstruction for double-counting safety.

## Regression protection

Added `test/feature-dependency-phase9.test.mjs` to require:

- machineCount = 101;
- HIGH_RISK = 0;
- REVIEW = 0;
- PASS = 101.

Added `.github/workflows/phase9-feature-dependency-audit.yml` as a CI gate. It refreshes the report, executes the regression test, and fails if the audit returns a non-zero result.

## Phase 9 completion decision

Phase 9 is COMPLETE.

Current active Feature structure has no unresolved double-counting candidate under the implemented audit rules. Existing hierarchical relationships are retained because they represent valid conditional decompositions rather than duplicated independent evidence.

No Phase 10 work is included here.
