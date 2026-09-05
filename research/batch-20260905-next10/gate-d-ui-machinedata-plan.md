# SloAnalytica 2026-09-05 Next10 — Gate D UI Design + MachineData Plan

Status: PASS
Date: 2026-09-05
Prerequisite: Gate C PASS

Gate D materialized the audited Observation contracts into the repository's current `machine-package.json` structure (`machine`, `inputs`, `features`, `evidence`, `ui`, `selectionSummary`, metadata/validation). This work remains on the dedicated research branch; it does not publish to prototype or public main.

## Schema/convention baseline

- One `machines/<machineId>/machine-package.json` package per machine.
- Machine schema `2.0.0`, package wrapper `schemaVersion: 1`.
- Statistical inputs use stable `INP_*` IDs and `defaultValue: ""`.
- Shared denominators are used only where the eligible population is truly identical.
- UI number/counter widgets carry `emptyMeansUnobserved: true` and `observedZeroAllowed: true`.
- Hard evidence uses `multi_enum` plus EvidenceEngine mappings from `inputId + triggerValue` to confirmed/denied settings.
- Missing setting stages are absent rather than interpolated.

## Final machine IDs

1. `L_AZURLANE_THE_ANIMATION_KN`
2. `L_DRUAGA_NO_TOU_ZA`
3. `L_SMASLO_TOKYO_REVENGERS_ZF`
4. `L_BABEL_BA`
5. `L_SHIN_ONIMUSHA_3_SA`
6. `L_ZENIGATA_5_L2`
7. `L_TOARU_KAGAKU_NO_RAILGUN_2_FV`
8. `L_ZETTAI_SHOGEKI_FORCE_FH`
9. `L_KAKUMEIKI_VALVRAVE_2_JF`
10. `L_NEO_PLANET_SLED`

All ten paths were checked for collision against the prototype baseline before creation.

## Materialization result

### Wave 1
- Druaga: BIG + REG shared denominator + REG BGM hard evidence.
- New Onimusha3: AT first-hit + hard evidence; common bell excluded from v1.
- Railgun2: AT first-hit + CZ total + hard evidence; type-specific CZs not simultaneously active.
- Absolute Impact IV: AT first-hit + hard evidence; bonus first-hit not simultaneously active.

### Wave 2
- Azur Lane: AT/bonus/common-bell/cherry/watermelon core. AT setting5 source conflict resolved to `1/496.4` using newer nana + current P-WORLD + HAZUSE consensus; older isolated `1/469.4` preserved as stale conflict, not averaged.
- Tokyo Revengers: AT first-hit + normal-play-only common bell + middle cherry. Gate-C conditional middle-cherry vector was resolved without interpolation after complete grouped values were confirmed.

### Wave 3
- Babel: BIG/REG + weak/strong cherry conditional hit pairs + scorpion 3rd/6th conditional hit pair.
- Zenigata5: initial hit + corrected Deka-me contract. Denominator is non-true-foreshadowing eligible normal games; numerator is Deka-me appearance/direct-hit events. It is not direct hits divided by Deka-me occurrences.
- Neo Planet: 1G-ren-excluded normal-play bonus-total initial hit + hard evidence. Mode-F high transition remains conditionally selected research material but is not active in v1 because a safe setting-change-only UI gate was not verified.

### Wave 4
- VVV2: five-stage initial-hit core + hard evidence only. BAR direct hit remains inactive; ordinary CZ/bonus end-screen distribution is not used as likelihood because hall customization can alter it.

## UI locks

- Do not duplicate a denominator input when the same audited population is used.
- Use separate denominator IDs where populations differ.
- Conditional sections explain exclusions next to the input.
- Evidence inputs contain hard lower-bound/exact/denial semantics only; ordinary weak/strong/parity hints are not promoted to EvidenceEngine certainty.
- Manual input works without linked services.
- Linked-service values may assist acquisition only when exact field/population/reset semantics match the manual contract.

## Gate D audit result

Final all-10-machine MachineData head `d9c67cc51f6f9cfc756da15184ddcd3e518779bc` completed:
- MachineData Statistical Audit: PASS
- MachineData User-facing Definitions Audit: PASS
- User-verified UX contract audit: PASS

Machine identity consistency remains FAIL for a pre-existing baseline-wide audit gap. Its log lists 29 already-cataloged machines missing identity-audit entries and does not identify the newly materialized Next10 package IDs as the cause. This baseline failure is preserved rather than hidden through unrelated prototype/main edits.

Detailed corrections and audit notes:
- `gate-d-source-resolution.md`
- `gate-d-observation-corrections.md`
- `gate-d-materialization-audit.md`

## Gate D verdict

**PASS** for Next10 UI Design + MachineData materialization.

Gate E may now begin on the dedicated research branch. Gate E must keep the baseline identity-workflow failure separated from batch-specific quality findings and must not mutate public `main`.
