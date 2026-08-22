# SloAnalytica Three-Layer Machine Data Policy

Date: 2026-08-22

## Purpose

MachineData work is split into three independent layers so that statistical research, real-machine observation, and user-verified input ergonomics do not silently overwrite one another.

## Layer 1: Statistical Research

This layer answers what should participate in setting inference.

Scope:
- public setting-difference research
- probabilities and distributions
- numerator / denominator definitions
- Feature adoption / rejection
- Evidence semantics
- Feature dependency and conditional decomposition
- reliability weight
- Difficulty participation and exposure
- Feature Selection Policy v2

This layer must not infer machine-menu availability or rewrite previously verified UX unless the Feature contract itself changes.

## Layer 2: Machine Observation Research

This layer answers what can actually be observed from the machine or surrounding play environment.

Scope:
- machine menu / play-history screen contents
- visible cumulative game counts
- BIG / REG / AT / CZ counters and other displayed history
- linked-machine-service availability and concrete obtainable fields
- seated/predecessor snapshot availability
- whether current minus seated values can derive self-session trials
- whether predecessor observations are statistically compatible with a public Feature definition

Machine Observation Research is a data-source inventory, not automatic authorization to add a Feature. Data may be observable but statistically unsuitable.

If public information cannot establish an item, record it as UNRESOLVED rather than NOT_AVAILABLE.

## Layer 3: User-Verified UX Contract

This layer records how the user actually enters and operates verified information during play.

Scope:
- seated-data input presence and ordering
- quick-add controls
- automatic / difference calculations
- labels and instructions
- section placement and folding
- direct-input / compact-counter behavior
- other ergonomics confirmed through real-machine use

Once verified, this layer is protected by USER_VERIFIED_UX and must survive ordinary Research/Selection rebuilds. Statistical changes may alter only the UX necessary to represent the changed Feature contract.

## Integration rule

The three layers are merged only at MachineData build time.

1. Statistical Research decides inference semantics.
2. Machine Observation Research decides which real-world observations are available and how they map to self-session or predecessor data.
3. User-Verified UX Contract decides how verified observations are presented and entered.

No layer may silently manufacture or delete facts owned by another layer.

## Predecessor data and inference

Predecessor/seated data may participate in inference only when:
- numerator and denominator are both recoverable;
- their definitions match the published setting-specific probability;
- mode/reset/state dependence does not create a material bias;
- they do not double-count self-session data.

Observable predecessor data that fail these conditions remain observation/UX data and are not forced into inference.

## Difficulty and setting-band discrimination

Difficulty and setting-band discrimination are machine-performance benchmarks based on the user's own standard play data. They are not benchmarks of the combined amount of predecessor plus self-session information available during one real session.

Rules:
- PREDECESSOR_SNAPSHOT observations are excluded from Difficulty by default.
- A displayed 1500G / 3000G / 7000G Difficulty point refers to standard self-play game volume, not predecessor + self-play cumulative games.
- Setting-band discrimination G likewise represents the approximate self-play game volume required to reach the stated upper/lower-band accuracy under the benchmark model.
- Individual Features can use denominators different from the displayed benchmark game count. A 7000G benchmark does not mean every Feature received 7000 trials.
- If predecessor data are available in an actual session, the live inference result may narrow earlier than the Difficulty / setting-band benchmark. This does not change the benchmark itself.

### Required user-facing explanation

Difficulty / setting-band UI must communicate at least these points:

1. the benchmark is based on the user's own play data;
2. seated/predecessor data are not included in the benchmark game count;
3. individual Feature trial counts may differ from the benchmark game count;
4. predecessor data may still improve the actual live inference result when valid.

Recommended wording:

> Difficulty and setting-band discrimination G are benchmarks based on data collected during your own play. Seated/predecessor data are not included in these benchmark game counts. Each setting-inference Feature may use a different trial denominator, so a displayed 7000G does not mean every Feature has 7000 trials. When valid predecessor data are entered, the actual live inference may narrow sooner than this benchmark.

## Build and audit requirements

- Statistical changes must pass statistical/Feature/Difficulty audits.
- Machine Observation Research must preserve CHECKED / NOT_AVAILABLE / UNRESOLVED distinctions.
- User-verified UX must pass the UX contract regression audit.
- A rebuild must not delete Machine Observation or USER_VERIFIED_UX data merely because Statistical Research was regenerated.
- If an underlying Feature is removed or materially changed, only directly affected observation/UX contracts may change, with an explicit reason.

## C.C.&Kallen precedent

C.C.&Kallen demonstrated why the layers must be independent: statistical re-selection changed Feature structure while an unrelated +50G helper and previously verified seated-data UX had been lost during earlier regeneration. The +50G helper was restored and protected; the exact old seated-data field set remains an unresolved Machine Observation / UX recovery item rather than being guessed.