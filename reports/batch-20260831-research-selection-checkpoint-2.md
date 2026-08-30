# Batch Research / Selection checkpoint 2 — 2026-08-31

Branch: `batch/20260831-persona5-to-bio5`

## Batch status

- ResearchData: 10 / 10
- SelectionData: 10 / 10
- Manual Discovery -> Research coverage: 0 missing candidates
- Repository-local validators: not yet executed in this GitHub-only environment

## Completed in this checkpoint

### Super Rio Ace
- Populated full setting tables for Bonus first-hit and Rio Rush AT first-hit.
- Split Bonus AT lottery into weak-role and strong-role conditional features with full setting probabilities.
- Decomposed Kerot trophy / payout / ending evidence into explicit setting constraints.
- Selection: AT first-hit adopted as primary. Bonus first-hit and bonus-role AT lotteries are excluded from the independent likelihood stack for now because of weaker incremental information and observation/dependency cost.

### BOØWY
- Selection created.
- AT first-hit is the sole numeric primary feature.
- AT-end screen remains Evidence; setting-L panel-off is retained as operational warning Evidence rather than an ordinary inference target.

### BIG Shimauta 30
- Selection created.
- Non-chain-section Bonus first-hit adopted as primary.
- Critical denominator requirement retained: chain/renchan section must not contaminate normal-game denominator.
- Trigger-specific BIG / Shisa BIG composition remains excluded pending Observation v2 separation of trigger-specific denominators.
- Internal-mode-conditioned hit rates excluded because mode A/B / heaven-prep A cannot be safely classified every trial in ordinary play.

### Warau Salesman 4
- Selection created.
- Bonus first-hit adopted as primary.
- CZ-entry immediate-success draw adopted as conditional support with CZ-entry count as denominator.
- Return-inclusive Bonus appearance explicitly excluded to prevent double counting with first-hit.
- REG icon / payout / ending line / lantern retained as Evidence.

### Biohazard RE:2
- Selection created.
- AT first-hit adopted as primary.
- Heart-red replay -> G-BATTLE is NOT adopted despite its large setting gap because the visible heart meter is not perfectly linked to the internal state and red->purple transitions can make exact numerator attribution unsafe.
- Direct AT / Tyrant-high remain incomplete; AT-level distribution remains excluded from ordinary numeric input because the actual level is not always exactly observable.

### Kamen Rider Den-O
- Populated full setting tables for Den-O Bonus, Ore Fever, Ore Climax and possession-point 100pt CZ lottery.
- Trophy Evidence decomposed into explicit 2+/4+/5+/6 constraints.
- Selection: Den-O Bonus first-hit adopted as primary.
- Ore Fever / Ore Climax excluded from the same independent likelihood stack because they are downstream outcomes sharing upstream processes.
- 100pt CZ success lottery excluded because 48.9% -> 50.0% provides very little practical information.

### Tidadondon
- Selection created.
- Bonus first-hit adopted as primary.
- BIG/REG composition and heaven-state behavior excluded until independent setting distributions / exact observation definitions are available.
- BIG-entry 7-segment remains Evidence.

## Cross-machine dependency policy applied

- Setting difference alone is not enough for adoption.
- Upstream and downstream outcomes are not automatically stacked as independent likelihoods.
- Part/whole statistics are not used together unless decomposed.
- A feature with a large published setting gap may still be rejected when the real-world numerator or denominator cannot be observed exactly.
- Evidence remains separate from numeric likelihood unless a full setting distribution supports a numeric model.

## Next formal work

1. Run Research / Selection schema and gate validators in an executable repo environment.
2. Fix any validator/schema issues surfaced by the real tooling.
3. Perform Selection dependency/quality audit and Gate B.
4. Construct Machine Observation Data v2 for all 10 machines.
5. Resolve linked/built-in service field coverage before moving web-solvable debt to MACHINE_REQUIRED.
