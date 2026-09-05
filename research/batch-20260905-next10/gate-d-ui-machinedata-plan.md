# SloAnalytica 2026-09-05 Next10 — Gate D UI Design + MachineData Plan

Status: STARTED
Date: 2026-09-05
Prerequisite: Gate C PASS

Gate D will materialize the audited Observation contracts into the repository's current `machine-package.json` structure (`machine`, `inputs`, `features`, `evidence`, `ui`, `selectionSummary`, metadata/validation). This file is an implementation plan; it does not publish to prototype or public main.

## Schema/convention baseline confirmed from current prototype

- One `machines/<machineId>/machine-package.json` package per machine.
- Machine schema `2.0.0`, package wrapper `schemaVersion: 1`.
- Statistical inputs use stable `INP_*` IDs and `defaultValue: ""`.
- Shared denominator patterns are allowed: multiple selected features can point to one `INP_NORMAL_GAMES` field when the eligible population is truly identical.
- UI number/counter widgets explicitly carry `emptyMeansUnobserved: true` and `observedZeroAllowed: true`.
- Hard evidence uses `multi_enum` plus EvidenceEngine entries mapping `inputId + triggerValue` to confirmed/denied settings.
- Selection summaries must state why deterministic aggregate/subset alternatives were rejected or retained as reference.

## Candidate machine IDs for Gate D packages

These remain implementation candidates until the registry/name audit immediately before package creation:

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

Before writing packages, compare these names against current `machine-registry.json` naming conventions and ensure no collision.

## Materialization order

### Wave 1 — simple/shared-denominator packages
- Druaga: normal games + BIG + REG + one hard BGM evidence input.
- New Onimusha3: normal games + AT first-hit + hard evidence.
- Railgun2: normal games + AT first-hit + CZ total + hard evidence.
- Absolute Impact IV: normal games + AT first-hit + hard evidence.

### Wave 2 — shared denominator + multiple role counters
- Azur Lane: AT/bonus/small-role core on the audited normal-play interval.
- Tokyo Revengers: AT first-hit + common bell with explicit normal-play-only UI help.

### Wave 3 — conditional denominator packages
- Babel: weak/strong cherry and scorpion 3rd/6th trial-hit pairs with validation.
- Zenigata5: Deka-me eligible-trial/direct-hit pair excluding true-foreshadowing periods.
- Neo Planet: 1G-ren-excluded bonus denominator + reset-only Mode-F gated section.

### Wave 4 — context-sensitive evidence package
- VVV2: AT first-hit core; hard evidence only. BAR direct-hit stays SUPPORT. Ordinary end-screen distribution remains reference/help unless customization OFF is explicitly represented.

## UI locks

- Do not duplicate a denominator input in multiple sections if the same audited population is used.
- When populations differ, use separate denominator IDs even if both are expressed in games.
- Conditional sections must explain exclusions next to the input.
- `参考` sections must be visually distinguishable and have no active likelihood feature.
- Evidence inputs should not mix hard confirmation with ordinary indication-only outcomes unless their semantics are represented separately.
- Missing setting stages must be absent from machine settings and probability tables; never add placeholder probabilities.
- Manual input must work without linked services.

## Gate D implementation checks per machine

1. package parses as JSON;
2. all `numeratorInputId` / `denominatorInputId` references resolve;
3. every active feature has probabilities only for actual settings;
4. no active SUPPORT/reference feature leaks into ProbabilityEngine;
5. evidence trigger values resolve to declared input options;
6. hard evidence confirmed/denied settings are subsets of machine settings;
7. conditional numerator <= denominator validation is available or covered by package validation/help contract;
8. UI has empty/zero semantics on every statistical control;
9. selectionSummary matches Gate-B final decisions;
10. sourceEvidenceRefs point only to attached source records.

## Current Gate D blockers

No user-side blocker at start.

AI-side prerequisites before package creation:
- final registry/naming-convention check;
- attach exact source rows/probability vectors for every active feature;
- materialize only hard evidence whose visual label/context is source-traceable;
- leave device-only service wording/history checks for isolated real-device verification rather than guessing.

Public `main` is not part of Gate D work.