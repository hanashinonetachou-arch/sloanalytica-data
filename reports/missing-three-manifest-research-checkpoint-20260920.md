# Missing Three Machines — Manifest Research Checkpoint

Date: 2026-09-20
Branch: research/missing-three-manifest-20260920

## Scope

This checkpoint covers the three machines identified as missing from the current Research set:

1. スマスロ ゴブリンスレイヤー（初代・2023。ゴブリンスレイヤーIIとは別機種）
2. Lラブ嬢3 ～Wご指名はいかがですか？～
3. 回胴黙示録カイジ 狂宴

This is a research checkpoint, not yet canonical MachineData. Values are promoted only after denominator / trial-universe / exposure / dependency validation.

All three are non-pure-A-type machines, therefore Predecessor Observation Research is NOT_REQUIRED under Predecessor Observation Contract v1.0 unless a later machine-specific exception is explicitly opened.

## 1. スマスロ ゴブリンスレイヤー

### Complete public numeric candidates confirmed

- AT initial hit: settings 1–6 = 1/547.9, 1/538.4, 1/517.7, 1/492.3, 1/470.5, 1/435.7.
- Common bell: settings 1–6 = 1/102.4, 1/97.5, 1/93.1, 1/86.2, 1/81.9, 1/71.9.
- CZ by type:
  - GM = 1/327, 1/323, 1/309, 1/293, 1/281, 1/261.
  - GC = 1/833, 1/823, 1/804, 1/777, 1/757, 1/723.
  - GB = 1/6000, 1/5588, 1/5216, 1/4823, 1/4491, 1/4083.
- CZ combined = 1/226, 1/223, 1/215, 1/204, 1/196, 1/184.
- Replay 3-chain → CZ = 3.1%, 4.3%, 6.6%, 10.9%, 14.8%, 17.2%.
- 300G reach → CZ = 20.3%, 20.7%, 21.5%, 22.7%, 23.8%, 24.6%.
- 500G reach → CZ = 20.3%, 20.7%, 22.7%, 25.4%, 29.7%, 38.7%.
- 100G reach → CZ is 30.1% for all settings and therefore has no Selection value by itself.

### Denominator / dependency direction

- Common bell: GAME-family candidate. Trial universe must confirm whether published rate applies across all game states; source notes the role can be identified in normal play and AT.
- Replay 3-chain → CZ: CONDITIONAL; denominator is number of qualifying replay-3-chain opportunities, not games.
- 300G/500G → CZ: EVENT; denominator is number of times the corresponding regulated-game milestone is actually reached.
- CZ type/combined and AT initial-hit rates are game-normalized published rates. Before scoring, confirm the precise exposure universe and avoid treating downstream AT and its upstream CZ pathways as independent evidence.
- CZ combined must not be summed with its component CZ-type rates.

### Provisional information screen

Using 7000 direct trials only as a mathematical screen (not final Selection where exposure differs), common bell is clearly above the single-feature floor and AT initial hit is above it. Conditional/event candidates require real exposure counts before a valid score can be assigned.

## 2. Lラブ嬢3 ～Wご指名はいかがですか？～

### Complete public numeric candidates confirmed

- AT initial hit = 1/285.2, 1/278.0, 1/263.4, 1/242.7, 1/224.9, 1/210.4.
- LOVE ZONE = 1/181.7, 1/175.9, 1/161.2, 1/147.1, 1/134.1, 1/124.5.
- W LOVE RUSH = 1/1831.1, 1/1806.8, 1/1719.7, 1/1596.1, 1/1471.7, 1/1369.2.
- LOVE ZONE failure → revival AT = 0.4%, 0.4%, 0.4%, 0.8%, 1.2%, 1.6%.
- Reset / advantageous-section transition mode distribution is published for all settings.
- Internal-state transition after advantageous-section transition and after LOVE ZONE has setting-dependent published values; preserve as multinomial/conditional candidates rather than flattening into independent binomials.

### Denominator / dependency direction

- LOVE ZONE failure → revival: CONDITIONAL; denominator is LOVE ZONE failures.
- Reset-mode transition: EVENT; denominator is qualifying reset/advantageous-section transition events.
- State transitions: EVENT/CONDITIONAL with mutually exclusive destinations; model as multinomial where complete destination probabilities are available.
- AT initial hit, LOVE ZONE and W LOVE RUSH are not automatically independent. Their pathway relationship must be resolved before final likelihood participation.

### Provisional information screen

A 7000-direct-trial screen gives:
- AT initial hit: IG≈0.215 bit / Score≈43.1.
- LOVE ZONE: IG≈0.450 bit / Score≈89.9.
- W LOVE RUSH: IG≈0.035 bit / Score≈7.1.

The first two clear the single-feature floor under the simplified screen. W LOVE RUSH is only JOINT_ELIGIBLE under that simplified screen and must not be promoted without correct exposure/dependency modeling.

## 3. 回胴黙示録カイジ 狂宴

### Complete public numeric candidates confirmed

- Bonus initial hit = 1/384.9, 1/376.0, 1/360.0, 1/324.6, 1/304.2, 1/290.6.
- CZ initial hit = 1/243.3, 1/237.6, 1/225.7, 1/199.4, 1/185.1, 1/176.8.
- CZ success = 62.3%, 62.7%, 63.0%, 63.6%, 64.1%, 64.6%.
- Weak cherry = 1/218.5, 1/211.4, 1/204.8, 1/198.6, 1/187.2, 1/182.0.
- Strong cherry = 1/528.5, 1/512.0, 1/496.5, 1/481.9, 1/468.1, 1/455.1.
- Watermelon = 1/79.9, 1/79.0, 1/78.0, 1/77.1, 1/75.3, 1/72.8.
- Weak chance = 1/84.0, 1/81.9, 1/79.9, 1/79.0, 1/78.0, 1/77.1.
- First BAR alignment in red-7 BIG → Tonegawa RUSH = 2.7%, 4.3%, 4.7%, 7.4%, 9.0%, 9.4%.
- Weak rare role → zawa-high transition is incomplete for all six settings in the checked public table and must remain Data Completeness INCOMPLETE.
- Post-chain mode transition has setting 2 missing in the checked table and remains Data Completeness INCOMPLETE.

### Denominator / dependency direction

- CZ success: ENTRY; denominator is CZ entries.
- Red-7 BIG first BAR → Tonegawa RUSH: CONDITIONAL; denominator is qualifying first BAR-alignment opportunities in red-7 BIG.
- Rare-role probabilities: GAME-family candidates; trial universe must match the published role probability.
- CZ initial hit and bonus initial hit are pathway-dependent. They must not be naively multiplied as independent likelihoods.
- Incomplete six-setting candidates do not enter the probability model merely because settings 1/6 show a difference.

### Provisional information screen

A 7000-direct-trial screen gives approximate scores before exposure/dependency correction:
- bonus initial hit: 30.6
- CZ initial hit: 59.0
- weak cherry: 19.6
- strong cherry: 5.3
- watermelon: 12.4
- weak chance: 10.3

These are screening values only. Final Selection Score requires the contract-correct exposure model and dependency treatment.

## Evidence

Evidence candidates are researched separately from numeric Selection and must retain their observation context. Confirmed public categories include machine-specific end screens / stamps or trophies / payout or voice indications where applicable. Canonical Evidence UI grouping is deferred until Observation Context is established.

## Next gates

1. Resolve exact denominator/trial universe for each candidate that can realistically participate.
2. Construct one shared Exposure Model for Selection and HighLowDiscrimination.
3. Build Dependency Map and eliminate duplicate likelihood participation.
4. Compute final IG7000 / Selection Score.
5. Run Linked Play Data Contract only after Selection Complete.
6. Build Observation.
7. Run HighLowDiscrimination at 1500G / 3000G / 7000G.
8. Build Canonical UI and Machine Research Summary.

## Sources checked

- P-WORLD: Lゴブリンスレイヤー — https://www.p-world.co.jp/machine/database/9812
- パチナビ: スマスロ ゴブリンスレイヤー 設定判別 — https://pachinavi.net/machines/smasloth-goblin-slayer/settei/
- なな徹: Lラブ嬢3 設定差 — https://nana-press.com/kaiseki/machine/651/18111/
- P-WORLD: Lラブ嬢3 — https://www.p-world.co.jp/machine/database/9928
- パチナビ: Lラブ嬢3 設定判別 — https://pachinavi.net/machines/smasloth-love-jou-3/settei/
- パチナビ: 回胴黙示録カイジ 狂宴 設定判別 — https://pachinavi.net/machines/kaiji-kyoen/settei/
- パチナビ: 回胴黙示録カイジ 狂宴 ゲーム性 — https://pachinavi.net/machines/kaiji-kyoen/uchikata/


## 2026-09-20 denominator / dependency correction

### Kaiji Kyoen

Cross-checking multiple public analysis sources resolves two important points.

1. CZ denominator / trial universe is now explicit enough for the next model stage: the published CZ rate is a normal-game rate. One source explicitly defines the relevant normal interval as the interval in which the machine menu's "通常総ゲーム" counter advances. Therefore:
   - family: GAME
   - target: CZ initial hit
   - includedStates: normal interval represented by 通常総ゲーム
   - excludedStates: CZ / bonus / AT intervals outside that counter
   - quality: DERIVED pending official/manual confirmation

2. The previously recorded "setting 2 missing" for post-chain mode transition was a source-coverage problem, not a public-data incompleteness conclusion. Another public source publishes setting 2 as A 57.8%, B 14.8%, C 22.7%, D 3.1%. This candidate is therefore restored to Data Completeness COMPLETE, subject to cross-source verification of rounding / residual probability.

3. Rare-role probabilities have all six setting values confirmed across multiple sources. Before using them together, they must be modeled as mutually exclusive outcomes of the same normal-game trial universe rather than four independent game denominators. Preferred dependency model: multinomial role-category observation (or an equivalent likelihood that preserves exclusivity).

4. CZ initial hit and bonus initial hit remain dependent pathways. The probability model must not multiply both as independent evidence unless a conditional decomposition proves non-overlap.

5. CZ success uses ENTRY-family denominator = CZ entries. It is conditionally downstream of CZ entry count and must be represented as a conditional observation.

### Status after correction

Kaiji:
- Data Completeness: numeric core COMPLETE for CZ, bonus initial hit, four rare roles, CZ success, and post-chain mode transition.
- Denominator / Trial Universe: materially resolved for CZ and rare roles; bonus-pathway exposure still requires exact observation definition.
- Dependency: explicit non-independent CZ→bonus relationship; rare roles share one mutually-exclusive game trial.
- Predecessor Observation: NOT_REQUIRED by contract because this is not a pure A-type machine.

The same standard will now be applied to Goblin Slayer and Love Jou 3 before final IG7000 is accepted.


## 2026-09-20 Goblin Slayer / Love Jou 3 denominator and dependency pass

### Goblin Slayer (2023)

Confirmed candidate contracts:

- Common bell
  - family: GAME
  - target: common-bell occurrences
  - trial universe: games in which the published common-bell probability applies
  - exposureQuality: DERIVED until state applicability is cross-checked
  - dependency: role observation; do not duplicate with any overlapping role aggregate.

- Replay 3-chain → CZ
  - family: CONDITIONAL
  - target: CZ wins caused by the qualifying replay-chain opportunity
  - denominator: number of replay-3-chain qualifying opportunities
  - 4+ replay chain is 100% across settings and therefore contributes no setting information as a standalone feature.
  - dependency: CZ-pathway observation; must not be independently double-counted with a CZ aggregate that already includes these wins.

- 300G / 500G milestone → CZ
  - family: EVENT
  - target: CZ wins at the corresponding milestone
  - denominator: number of times the exact milestone opportunity is reached
  - 100G milestone is 30.1% for every setting and is rejected for zero setting discrimination.
  - 300G and 500G must remain separate event opportunities unless a later model explicitly represents their conditional reach relationship.
  - dependency: downstream CZ-pathway observation.

- CZ type distribution after replay/bell-chain triggered CZ
  - family: CONDITIONAL
  - denominator: qualifying CZ wins from the relevant replay/bell-chain route
  - model: multinomial distribution across MISSION / CHANCE / BATTLE
  - dependency: conditional child of the triggering-route CZ win; never an independent game-rate feature.

- AT initial hit
  - published rate remains a candidate but is downstream of several upstream pathways.
  - final likelihood participation requires dependency decomposition; it must not be blindly multiplied with all upstream CZ observations.

Exposure rule: conditional/event features receive only the expected number of their real opportunities within 7000G. No 7000-direct-trial shortcut is permitted for replay-chain or milestone features.

### Love Jou 3

Confirmed candidate contracts:

- AT initial hit
  - GAME-normalized published rate candidate.
  - exact normal-game trial universe remains to be tied to an observable denominator before final score.

- LOVE ZONE initial hit
  - GAME-normalized published rate candidate.
  - dependency: upstream/downstream relationship with AT must be represented before joint likelihood use.

- W LOVE RUSH occurrence
  - rare GAME-normalized candidate.
  - provisional screen remains JOINT_ELIGIBLE only; final score awaits correct exposure and dependency.

- Advantageous-section transition initial internal state
  - family: EVENT
  - denominator: advantageous-section transition / reset opportunities.
  - destinations Normal / High / Super-high A / Super-high B are mutually exclusive.
  - model: multinomial.
  - complete all-setting destination probabilities are available.

- LOVE ZONE failure → internal-state destination
  - family: CONDITIONAL
  - denominator: LOVE ZONE failure events.
  - mutually exclusive destination states; model as multinomial.
  - most destination probabilities are setting-common or only weakly setting-dependent; evaluate as one multinomial feature, not multiple independent binomials.

- LOVE ZONE failure → AT revival
  - family: CONDITIONAL
  - denominator: LOVE ZONE failures
  - target: subsequent AT true-precursor transition / revival as defined by source
  - dependency: shares the same parent failure events with post-CZ state transition and must not be treated as an unrelated game-rate feature.

- Relaxation-spring transition
  - family: CONDITIONAL / EVENT depending on the exact precursor opportunity.
  - public tables separate fake and true precursor outcomes.
  - combined rows with missing settings are not used when the complete component representation is available.
  - observation feasibility must be proven before Selection participation.

Dependency rules:
- state-destination rows are one multinomial observation each, not four/five independent features;
- LOVE ZONE rate, LOVE ZONE failure observations, and AT initial hit share a causal pathway and require conditional modeling;
- reset-only events have very low expected exposure in a normal single-session 7000G model and must not receive 7000 direct trials.

### Gate status after this pass

Goblin Slayer:
- Data Completeness: major numeric candidates COMPLETE.
- Denominator/Trial Universe: COMPLETE at family/opportunity level; exact exposure rates still pending where opportunities are conditional.
- Dependency: pathway map established; final decomposition pending.
- Predecessor Observation: NOT_REQUIRED.

Love Jou 3:
- Data Completeness: major numeric candidates COMPLETE; incomplete aggregate rows are excluded where necessary.
- Denominator/Trial Universe: COMPLETE at family/opportunity level for the principal candidates.
- Dependency: multinomial and causal-pathway structure established.
- Predecessor Observation: NOT_REQUIRED.

Kaiji:
- remains at the previous corrected denominator/dependency state.

No final IG7000 / Selection Score is accepted yet for conditional/event candidates. The next step is to construct realistic 7000G exposure for the three machines and compute Selection from those exposures rather than from nominal direct trials.


## 2026-09-20 Exposure gate — strict no-fabrication pass

The new contract requires Selection and HighLowDiscrimination to share an exposure model. This pass therefore separates features whose 7000G exposure can be derived from public rates from features whose opportunity exposure is not yet publicly derivable.

### Exposure status vocabulary

- EXACT: directly defined count/rate for the required trial universe.
- DERIVED: expected opportunities can be computed from a public rate with matching trial universe.
- ESTIMATED: requires an explicit approximation; not accepted for final Selection unless the approximation is documented and justified.
- UNKNOWN: opportunity count cannot currently be derived without inventing assumptions.

### Goblin Slayer

- AT initial hit: DERIVED from published game-normalized initial-hit rate, subject to final normal-game scope confirmation.
- Common bell: DERIVED if the published common-bell rate applies to the counted game universe; preserve scope check.
- CZ aggregate/type rates: DERIVED only for their published game-normalized occurrence view; component rates and aggregate are alternative representations, never additive.
- Replay-3-chain → CZ: UNKNOWN exposure until the qualifying replay-chain opportunity rate is established. The conditional win probability alone is insufficient.
- 300G/500G milestone → CZ: UNKNOWN exposure until the number of milestone reaches per 7000G can be derived. Do not substitute 7000 trials or a guessed reach rate.
- 100G milestone: REJECT before exposure because the published probability is setting-common.

Result: final Selection can proceed only for the directly observable/derivable rate candidates. Conditional milestone/replay candidates remain research-complete but Selection exposure-pending, without fabricated scores.

### Love Jou 3

- AT initial hit: DERIVED from published game-normalized rate, subject to matching observable game universe.
- LOVE ZONE occurrence: DERIVED from published game-normalized occurrence rate.
- W LOVE RUSH occurrence: DERIVED from published game-normalized occurrence rate.
- Setting-change / advantageous-section initial mode: UNKNOWN as a 7000G session exposure unless the number of qualifying transitions is established. A reset-table probability does not imply repeated trials.
- LOVE ZONE failure → revival/state: conditional exposure can be derived only after LOVE ZONE entry and failure opportunity counts are linked. Until the failure rate / exact qualifying count is available, exposure is UNKNOWN.
- Relaxation-spring transition: UNKNOWN until the precursor opportunity count and observation feasibility are both established.

Result: AT, LOVE ZONE, and W LOVE RUSH are eligible for formal rate-based scoring; reset/state conditional tables are not assigned invented 7000G trial counts.

### Kaiji Kyoen

- CZ initial hit: DERIVED from the published normal-game rate; the source explicitly defines normal time as the interval in which the machine-menu 通常総ゲーム counter advances.
- Bonus initial hit: DERIVED from published initial-hit rate, but dependency with CZ must be resolved before joint participation.
- Rare roles: DERIVED from published per-game probabilities. The four setting-differentiated roles share one game trial universe and are modeled as mutually exclusive categories.
- CZ success: DERIVED conditionally from expected CZ entries; do not use 7000 direct trials.
- Post-chain mode transition: UNKNOWN until the qualifying post-chain transition count in a 7000G session is derivable.
- Weak-role → zawa-high: remains excluded where the all-setting public table is incomplete.

### Selection consequence

The earlier nominal direct-trial screens remain diagnostic only. They are not final Selection Scores.

No conditional/event feature receives a final score while exposure is UNKNOWN. This is intentional and is not a research failure: it prevents false precision.

For the next calculation pass, final IG7000 is restricted to candidates with DERIVED/EXACT exposure and an acceptable dependency representation:
- Goblin Slayer: common bell; AT initial hit if scope validation passes; alternative published CZ-rate representation where observation compatibility passes.
- Love Jou 3: AT initial hit; LOVE ZONE occurrence; W LOVE RUSH occurrence.
- Kaiji: rare-role multinomial; CZ initial hit; bonus initial hit as an alternative/dependent pathway candidate; CZ success conditionally after CZ exposure.

Conditional/event candidates with UNKNOWN exposure remain documented Research candidates but cannot cross the Selection adoption gate yet.


## 2026-09-20 Formal Selection pass — observable derived-exposure candidates

SelectionScore = IG7000 × 200. Classes: CORE >=20; SUPPORT >=10; JOINT_ELIGIBLE >=5; REJECT <5.

This pass accepts only candidates whose 7000G exposure can be represented without inventing conditional/event opportunity counts. Equal prior across settings is used for the information-gain calculation. Scores are stored as Selection rationale, not as inference-engine weights.

### Love Jou 3

Using the complete six-setting published game-normalized rates:

- AT initial hit: IG7000 ≈ 0.2155 bit; SelectionScore ≈ 43.1; CORE.
- LOVE ZONE occurrence: IG7000 ≈ 0.4496 bit; SelectionScore ≈ 89.9; CORE.
- W LOVE RUSH occurrence: IG7000 ≈ 0.0354 bit; SelectionScore ≈ 7.1; JOINT_ELIGIBLE.

Dependency rule remains active: AT and LOVE ZONE cannot both be treated as independent if the observation pathways overlap. W LOVE RUSH does not qualify for standalone adoption and may participate only in a valid Joint Feature whose joint IG7000 reaches the adoption floor.

### Kaiji Kyoen

Published normal-game rates and role probabilities are complete for all six settings.

Direct-rate diagnostic scores:
- CZ initial hit: IG7000 ≈ 0.295 bit; SelectionScore ≈ 59.0; CORE.
- Bonus initial hit: IG7000 ≈ 0.153 bit; SelectionScore ≈ 30.6; CORE.
- Weak cherry: IG7000 ≈ 0.098 bit; SelectionScore ≈ 19.6; SUPPORT.
- Strong cherry: IG7000 ≈ 0.0265 bit; SelectionScore ≈ 5.3; JOINT_ELIGIBLE.
- Watermelon: IG7000 ≈ 0.062 bit; SelectionScore ≈ 12.4; SUPPORT.
- Weak chance: IG7000 ≈ 0.0515 bit; SelectionScore ≈ 10.3; SUPPORT.

The four rare roles share the same game trial and are not adopted as four independent likelihood terms. Their final implementation is one multinomial role observation (plus residual OTHER category) or an equivalent mutually-exclusive likelihood.

CZ initial hit and bonus initial hit both clear the numeric floor, but their causal overlap means both cannot automatically participate independently. Selection records both as useful candidates; Dependency decides the final likelihood representation.

CZ success is conditional on CZ entries. It is not scored as 7000 direct trials. Its conditional exposure is derived from expected CZ entries and will be evaluated as a child observation.

### Goblin Slayer

The complete published rates establish:
- AT initial hit: all six settings complete.
- Common bell: all six settings complete.
- CZ aggregate and type-specific occurrence rates: all six settings complete.

AT initial hit, common bell, and published CZ occurrence rates are eligible for the same formal direct-rate calculation after the exact counted-game scope is locked. The common-bell source explicitly states that the role is identifiable both in normal play and during AT; therefore its trial universe must not silently be reduced to normal games.

Conditional replay-chain and milestone-CZ features remain exposure-pending and receive no fabricated score.

### Selection gate outcome

Formal classifications now exist for Love Jou 3 and the directly observable Kaiji candidates. Goblin Slayer is held one step earlier solely to prevent a trial-universe mismatch for common bell / published occurrence rates.

This is not a generic HOLD state: Research and Data Completeness are complete; only the exact exposure denominator required by the Selection formula remains to be locked.

Next:
1. lock Goblin Slayer counted-game exposure;
2. calculate its formal IG7000;
3. calculate Kaiji rare-role multinomial joint IG and CZ-success conditional IG;
4. resolve pathway participation for Kaiji CZ/bonus and Love Jou LOVE ZONE/AT;
5. emit per-machine Selection artifacts rather than keeping the result only in this checkpoint report.


## 2026-09-20 Selection integrity correction and dependency resolution

A fresh source cross-check was performed before promoting provisional scores.

### Kaiji Kyoen — source integrity

All six setting values for the four rare roles are independently confirmed by Hisshobon / Hazuse:
- weak cherry: 1/218.5, 1/211.4, 1/204.8, 1/198.6, 1/187.2, 1/182.0
- strong cherry: 1/528.5, 1/512.0, 1/496.5, 1/481.9, 1/468.1, 1/455.1
- watermelon: 1/79.9, 1/79.0, 1/78.0, 1/77.1, 1/75.3, 1/72.8
- weak chance: 1/84.0, 1/81.9, 1/79.9, 1/79.0, 1/78.0, 1/77.1

The public source also confirms all-six-setting CZ rate, CZ success probability, bonus initial-hit rate, and post-chain mode transition. Therefore these are Data Completeness COMPLETE.

Important correction to the earlier checkpoint: one secondary source displayed only settings 1 and 6 for rare roles, but the all-setting table exists in stronger cross-check sources. The research record must preserve the complete table and source hierarchy.

### Kaiji rare-role dependency representation

The four roles are mutually exclusive outcomes of the same game trial. Final likelihood representation:
- model: multinomial
- categories: WEAK_CHERRY / STRONG_CHERRY / WATERMELON / WEAK_CHANCE / OTHER
- denominator: eligible normal games in the published role-probability universe
- OTHER probability: 1 - sum(four role probabilities)

Individual diagnostic scores remain useful for rationale, but the inference engine receives the joint multinomial observation, not four independent binomials.

### Kaiji CZ success exposure

CZ success is a child of CZ entries:
- family: ENTRY
- denominator: observed CZ entries
- numerator: successful CZ entries

At 7000G, expected CZ-entry exposure is derived from the setting-specific CZ occurrence rate, not fixed at 7000. Final information evaluation therefore integrates entry-count exposure with the conditional success probabilities. This prevents the previous direct-trial overstatement.

### Kaiji CZ vs bonus initial hit

Both are useful public statistics, but bonus initial hit is causally downstream of CZ and other routes. Until the full route decomposition is observable, the safe Selection representation is:
- retain both in Research with their numeric rationale;
- use CZ initial hit as the primary pathway-rate candidate;
- do not independently multiply bonus initial-hit likelihood with CZ likelihood;
- bonus initial hit remains an alternative aggregate observation route when CZ observation is unavailable or when a later conditional decomposition proves non-overlap.

This is a dependency decision, not a claim that bonus initial hit has no setting information.

### Love Jou 3 AT vs LOVE ZONE

Both rates are Data Completeness COMPLETE and individually informative. LOVE ZONE is an upstream opportunity/pathway related to AT. Without a public decomposition proving independence:
- retain both Research/Selection rationale;
- do not naively multiply their likelihoods;
- prefer the more information-rich observable route where both cover overlapping play;
- AT initial hit remains an aggregate alternative observation.

W LOVE RUSH remains JOINT_ELIGIBLE only and is not independently adopted.

### Evidence / Observation reminder

The new Manifest requires Evidence to be researched independently from numeric Selection and grouped later by natural Observation Context. This pass does not convert trophy/stamp/end-screen evidence into numeric Selection Score.

### Promotion readiness

Kaiji and Love Jou now have dependency-safe candidate representations suitable for creation of machine-level Selection artifacts.

Goblin Slayer still needs the exact counted-game universe locked before its common-bell / occurrence-rate formal score is promoted. No fabricated denominator will be introduced to force completion.
