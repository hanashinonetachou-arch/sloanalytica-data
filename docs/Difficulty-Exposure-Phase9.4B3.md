# Difficulty Exposure Phase 9.4B-3

## Purpose
Cross-machine difficulty scores at 1500G / 3000G / 7000G must not invent how often event-based features become observable.

## Exposure quality
Every `difficultyExposure` may declare `quality`:
- `EXACT`: direct structural mapping; no estimated event frequency.
- `DERIVED`: uniquely derived from an explicit source feature/event probability and a quality-usable source exposure.
- `PROVISIONAL`: depends on an unresolved or temporary denominator/basis assumption.

Final cross-machine calibration uses `EXACT` and `DERIVED` only. `PROVISIONAL` can be used only for exploratory analysis when explicitly enabled.

## Exposure modes
Existing modes remain supported:
- `per_game`
- `fixed_rate`
- `setting_rate`

New generic mode:

### `derived_event_rate`
Use when one feature's trial opportunity is caused by another observable event whose setting-specific probability is already represented in ResearchData.

Required relation:

`expected trials = source feature trials × source event probability × eventMultiplier`

Fields:
- `sourceFeatureId`: SelectionData feature that supplies the event-generating process.
- `sourceCategoryId`: optional; for a multinomial source, identifies the category whose occurrence creates a trial.
- `eventMultiplier`: optional, default 1.

This mode does **not** permit using an arbitrary estimated event frequency. If the source event itself cannot be mapped from the target game basis, the derived feature is also blocked.

## Target game basis
`difficultyAnalysis.targetGameBasis` explicitly describes what 1500/3000/7000G means. It carries:
- `basisId`
- `label`
- `quality`
- `crossMachineComparable`
- optional note

A final public cross-machine scale must use a semantically comparable basis. A machine with a provisional AT-nonresident denominator cannot silently be compared with a machine whose basis is total recorded play games.

## Policy
1. No machine-specific hardcoded event frequencies in the Analyzer.
2. No conversion from AT ends, REGs, 100G reaches, etc. unless the event exposure is exact/derived from explicit data.
3. Dependencies are recursive and cycle-safe.
4. If a dependency is missing, the feature is blocked and coverage is reduced.
5. Hard Evidence remains excluded from the numerical difficulty score.
