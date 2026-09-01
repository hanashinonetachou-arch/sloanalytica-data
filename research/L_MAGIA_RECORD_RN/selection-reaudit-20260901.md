# L_MAGIA_RECORD_RN Selection Re-audit — 2026-09-01

Status: SEMANTIC REOPEN / NOT READY FOR REPUBLISH

## Formal basis
- Core Policy v1.7
- Research / Selection / Observation Manifest v6.11 (v6.10 + Latent Internal State Observability Gate)
- MachineData / UX Construction Manifest v6.9

## Red-team findings

### 1. Magic-girl mode distributions are not directly observable
The six internal modes are real and setting-dependent, but published screen/cut-in behavior is probabilistic "suggestion", not a direct state readout. Published strong character eye-catches have only roughly 30–42% probability of the corresponding non-default mode, and dialogue can show a character that is not the current mode. Therefore treating inferred IROHA/YACHIYO/TSURUNO/SANA/FELICIA/KUROE as truth and feeding a six-category multinomial is invalid.

Decision:
- RF_MODE_AT_END: EXCLUDE
- RF_MODE_BONUS_END: EXCLUDE

Reason: latent-state Observation failure, not lack of setting difference.

### 2. Watermelon→CZ table has an unobservable conditional denominator
Published setting-dependent rates are explicitly for watermelon trials outside Sana mode. Sana mode has a different, all-setting-common CZ lottery. Because Sana residence is latent and only probabilistically suggested, the user cannot reliably decide whether each watermelon belongs in the published denominator. A latent-state marginalized model would require enough transition/emission information to reconstruct state prevalence at each trial; current public data is insufficient.

Decision:
- RF_WATERMELON_CZ: EXCLUDE (current model)
- Re-open only if a valid latent-state marginal/conditional model becomes constructible.

### 3. High-state 10/20/30G distributions are internal allocations
Published tables describe internal high-state guarantee-game allocations. Stage behavior is a high/premonition suggestion, guarantee games may be added by rare roles, and the initial +10/+20/+30 allocation is not a clean directly observable category on every trial.

Decision:
- RF_HIGH_TRANSITION_ADV_AT_END: EXCLUDE
- RF_HIGH_TRANSITION_BIG_END: EXCLUDE

### 4. Episode-bonus category is directly observable but denominator needs stricter exclusions
The five-category ordinary selection table is usable only when the ordinary setting-dependent category lottery occurred.

Mandatory exclusions:
- Kuroe Challenge route: Kuroe episode forced
- Doppel Mode: Iroha episode forced
- Long Freeze: Ui episode forced and not part of the five-category ordinary table
- Any future-discovered forced route that bypasses the ordinary setting-dependent episode selection lottery

Decision:
- RF_EPISODE_BONUS_TYPE: INCLUDE_SUPPORT
- Observation/UI must explicitly state the exclusions above.
- UI request: two vertical columns for the episode category counters (gridSpan 6 for each input).

### 5. Bonus first-hit and AT first-hit cannot safely be multiplied as independent marginals
Both rates are defined over normal-play exposure, while AT is a downstream aggregate reached through bonus-mediated routes plus direct/other routes. Public marginal first-hit rates alone do not identify the joint distribution or P(AT route | bonus, setting). Multiplying both independent Bernoulli likelihoods therefore risks overconfidence.

Per-game symmetric KL (setting 1 vs 6, nats/trial):
- Bonus first hit: ~0.000170
- AT first hit: ~0.000197
- Weak cherry: ~0.000310

Expected 1-vs-6 log-likelihood information at 7000 denominator games (approx.; before effective-normal-game adjustment):
- Bonus first hit: ~1.19 nats
- AT first hit: ~1.38 nats
- Weak cherry: ~2.17 nats

Decision:
- RF_AT_FIRST_HIT: INCLUDE_PRIMARY
- RF_BONUS_FIRST_HIT: INCLUDE_FALLBACK, suppressed when AT-first-hit is active
- RF_WEAK_CHERRY: INCLUDE_PRIMARY / independent upstream count retained

This keeps the valid bonus signal available when AT first-hit is not observed, while avoiding naive double multiplication.

### 6. Mitama Lv2/Lv3 rumor-development→AT trials are observable but downstream of AT first hit
The reward level, rumor-development reward, and subsequent AT result are observable. Per eligible trial, the setting 1-vs-6 contrast is strong, especially Lv2, but eligible trials are rare.

Symmetric KL per eligible trial (setting 1 vs 6):
- Lv2: ~0.0823 nats (about 28 eligible trials for expected BF10)
- Lv3: ~0.0362 nats (about 64 eligible trials for expected BF10)

Because the successful outcomes are contained in aggregate AT first-hit, combining both as independent likelihoods would double-evaluate part of the same AT information.

Decision:
- RF_MITAMA_LEVEL2_AT: INCLUDE_FALLBACK, suppressed by AT first-hit
- RF_MITAMA_LEVEL3_AT: INCLUDE_FALLBACK, suppressed by AT first-hit

### 7. Episode multinomial information is strong per eligible observation but opportunity count is low
Symmetric KL per eligible episode trial:
- setting 1 vs 6: ~0.200 nats (~12 eligible trials for expected BF10)
- 1 vs 2: ~0.008 nats (~296 trials)
- 2 vs 3: ~0.048 nats (~48 trials)
- 3 vs 4: ~0.076 nats (~30 trials)
- 4 vs 5: ~0.093 nats (~25 trials)
- 5 vs 6: ~0.045 nats (~51 trials)

Interpretation: useful category-composition information when episodes occur, but not enough opportunities should be expected in ordinary short sessions to make it a primary feature.

## Direct-feature expected counts
Approximate expected event counts using the published per-game rates (effective normal-game denominators may be lower than total play G):

| Feature | 1500G S1→S6 | 3000G S1→S6 | 7000G S1→S6 | 8000G S1→S6 |
|---|---:|---:|---:|---:|
| Bonus first hit | 6.2→8.1 | 12.5→16.3 | 29.1→38.0 | 33.3→43.4 |
| AT first hit | 2.3→3.6 | 4.6→7.2 | 10.7→16.8 | 12.2→19.2 |
| Weak cherry | 25→30 | 50→60 | 116.7→140 | 133.3→160 |

## Dependency map

Normal-play exposure
→ rare-role generation (weak cherry etc.)
→ internal high state / latent magic-girl mode
→ CZ / bonus lottery
→ bonus first hit
→ bonus-specific AT lottery / conditional Mitama route
→ AT first hit

Parallel/conditional branch:
episode-trigger opportunity → ordinary episode-type lottery → visible episode category

Rules:
- weak-cherry occurrence is an upstream count and remains numerically usable;
- latent mode/high-state allocations are not observed and cannot be entered as truth;
- watermelon-CZ denominator depends on latent Sana state and therefore fails the current Observation contract;
- bonus and AT first-hit marginals are not simultaneously multiplied;
- Mitama conditional AT features remain fallback while aggregate AT first-hit is active;
- episode category composition can add conditional information without reusing episode occurrence frequency, provided forced routes are excluded.

## Required data/UI changes before republish
1. Remove mode-at-end and mode-bonus-end inference inputs from active UI.
2. Remove high-transition +10/+20/+30/NONE inference inputs from active UI.
3. Remove current Sana-excluded watermelon→CZ inference inputs from active UI.
4. Change bonus first-hit from PRIMARY to FALLBACK suppressed by AT first-hit.
5. Retain AT first-hit as PRIMARY; retain weak cherry as active primary/support numeric evidence.
6. Retain Mitama Lv2/Lv3 as fallback suppressed by AT first-hit.
7. Keep episode selection as support, rename labels to Japanese character names, render each category gridSpan=6, and show the forced-route exclusion note.
8. Re-open Observation entries that were previously marked FOUND solely from generic manual-counter assumptions; mode/high/watermelon entries must terminate as observationally incompatible for the current model.
9. Re-run machine pipeline, dependency audit, full tests, MachineData audit, reports, catalog/package generation, and real-device semantic verification before republish.

## Public research sources checked
- https://nana-press.com/kaiseki/machine/914/28434/ — magic-girl mode distributions and probabilistic suggestions
- https://nana-press.com/kaiseki/machine/914/28425/ — setting-difference tables
- https://nana-press.com/kaiseki/machine/914/28444/ — episode selection and forced paths
- https://nana-press.com/kaiseki/machine/914/28431/ — normal-play flow / internal state
- https://nana-press.com/kaiseki/machine/914/28443/ — Mitama conditional AT lottery
- https://1geki.jp/slot/l_magireco/99/ — independent public calculator observation surface
- https://1geki.jp/slot/l_magireco/0/ — cross-check of public setting-difference tables

## Semantic lock for this re-audit
Do not restore any excluded latent-state input merely because a public setting-difference table exists. Re-adoption requires direct categorical observation or a formally specified latent/emission model with sufficient public probabilities.