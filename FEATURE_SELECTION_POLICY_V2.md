# SloAnalytica Feature Selection Policy v2

Date: 2026-08-22

## Core principle

`requiredTrials` is **not** a hard INCLUDE / EXCLUDE threshold. It is one indicator of standalone information efficiency.

A Feature is selected in this order:

1. **Observability** — numerator and denominator can be obtained reliably in actual play.
2. **Denominator validity** — the user's trial count matches the published probability definition.
3. **Dependence / double-count review** — shared events, subset relations, causal chains and aggregate+detail overlap are resolved before likelihoods are multiplied.
4. **Modelability** — the relationship can be represented by an available exact or defensible conditional model.
5. **Input burden** — additional manual work and misclassification risk are proportionate to the information gained.
6. **Practical marginal information** — compare the existing Feature set with the candidate at representative play volumes, especially 1500G / 3000G / 7000G.
7. **Standalone requiredTrials** — use as supporting context, not a veto.

## requiredTrials interpretation

- `<= 10,000` trials/G: an EXCLUDE decision whose only rationale is "too many trials" requires review.
- `10,001–15,000`: review when trial volume is the only exclusion rationale; end-of-day marginal value may still be meaningful.
- `> 15,000`: adoption requires stronger justification, but low frequency alone does not automatically exclude a Feature.
- A low-frequency Feature may remain useful when it is automatically observed, has a large likelihood ratio when it occurs, or contributes independent information to the combined inference.

These bands are **review triggers**, not adoption thresholds.

## Dependence rule

Never estimate candidate value by simply multiplying likelihoods when the candidate and an adopted Feature share underlying events.

Examples:
- total bonus + bonus breakdown
- total cherry count + cherry-triggered RB treated as an unconditional per-game Feature
- AT initial hit + trigger-specific AT events
- CZ total + CZ type breakdown

For dependent information, use one of:

1. **Conditional factorization** — e.g. `P(cherry) × P(RB | cherry)`.
2. **Mutually exclusive joint Multinomial** — categories form a true partition of one trial space.
3. **Replacement comparison** — compare candidate against the overlapping existing Feature when no safe joint model is available.
4. **EXCLUDE** — when no defensible model can be built.

A naive Baseline+Candidate simulation that ignores dependence may be retained only as an upper-bound diagnostic and must not be used as the adoption estimate.

## Marginal-value review

When a candidate is safely modelable, compare:

- current Baseline
- Baseline + Candidate (or a dependence-safe equivalent)

at 1500G / 3000G / 7000G and, where appropriate, 60% / 70% / 80% setting-band discrimination thresholds.

A candidate can be useful even when its standalone 80% requiredTrials exceeds 7000G. The deciding question is whether it adds meaningful, correctly modeled information to the combined inference at realistic play volumes.

## Input burden

Marginal statistical gain is evaluated together with practical cost:

- automatic / machine-linked observation: low burden
- simple event counter with clear trigger: moderate burden
- stop-form discrimination, state tracking, or easily missed trigger classification: high burden

A small statistical gain can justify low-burden input but may not justify high-risk manual classification.

## Difficulty participation

Inference adoption and Difficulty participation are separate decisions.

A Feature may be valid for inference but excluded from game-based Difficulty when its opportunity count cannot be safely converted from the machine's target game basis.

## C.C.&Kallen precedent

The original bonus-detail Feature had `requiredTrials=8619G` and was excluded only as "too many trials". Cross-machine audit found this to be the only practical-range trial-only exclusion among current requiredTrials-tagged Features.

A naive addition substantially improved simulated discrimination but was invalid because `cherry+RB` shares events with the adopted cherry count. The safe response is not to discard the information and not to multiply both unconditional likelihoods. Instead, SloAnalytica uses the conditionally factored `P(RB | cherry)` component, which can coexist with `P(cherry)` without counting the cherry occurrence twice.

## CI / audit requirement

Future Selection reviews must flag:

- practical-range EXCLUDE Features whose only reason is trial volume
- aggregate/detail or subset relations that may be double-counted
- candidate simulations that add correlated Features without a dependence-safe model
- adopted high-requiredTrials Features so their rationale remains explainable

User feedback that reveals a policy inconsistency must be generalized into this policy and automated audit where feasible.