# Phase 12 Required Trials UI

- Selection Summary now derives an 80% equal-prior Bayes discrimination trial-count estimate from public ResearchData probabilities.
- Estimates are Selection-aware. Multinomial category exclusions and conditional renormalization are applied before estimating required trials.
- ResearchData `trialUnit` is preserved so event counts are not mislabeled as games.
- `requiredTrials` remains available as an explicit Selection override, validated by Selection Schema.
- Initial D 2nd MachineData v0.1.3 publishes required-trial estimates for all calculable selected/rejected numeric Features.
- Data tests: 120/120 PASS.
- Public data audit: 10 machines, 0 warnings.
