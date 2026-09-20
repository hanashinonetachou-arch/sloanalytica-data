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
