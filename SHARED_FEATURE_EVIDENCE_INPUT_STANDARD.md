# SloAnalytica Shared Feature / Evidence Input Standard v1

## Purpose

When one naturally observed event is both:

1. a numeric setting-inference Feature with a published setting-specific distribution, and
2. a setting confirmation / lower-bound / denial Evidence,

the user MUST NOT be asked to enter the same observation twice.

Examples include bonus-end screens, AT-end screens, CZ-success screens, voice/category distributions, and similar mutually-exclusive result surfaces.

## Core contract

### One observation, one input surface

All mutually-exclusive categories belonging to the same real-world observation surface are placed together in the same UI section.

A category is entered once only.

### One input may feed two consumers

The same inputId may be referenced by:

- a probabilistic Feature (binomial / multinomial / etc.), and
- EvidenceEngine.

For counter inputs, EvidenceEngine already treats a numeric value > 0 with no triggerValue as observed Evidence.

This is not duplicate user input and is not prohibited double counting. The numeric model contributes relative likelihood among still-possible settings; Evidence contributes a logical allowed/denied setting constraint.

### Do not reject the numeric Feature merely because some categories are Evidence

If the full setting-specific distribution is valid and the observation is modelable, the existence of confirmation/denial categories is not by itself a rejection reason.

Reject only for an independent statistical, observational, denominator, dependency, or modelability reason.

### UI placement

Evidence-capable categories stay inside their natural event section.

Do not duplicate those categories in a distant generic Evidence section.

Only Evidence that has no natural shared numeric observation surface should remain in the generic Evidence section.

### Labels

Internal category identifiers such as `TWO_CHOICE`, `FULL_NAV`, `PURPLE1` must never be user-facing labels. User-facing Japanese labels are mandatory.

### Empty vs zero

Blank = unobserved.

0 = observed zero occurrences.

The shared-input contract must preserve this distinction for both Feature inference and Evidence evaluation.

## Reference implementation

`L_SHIN_EVANGELION` v0.1.1 is the first reference implementation:

- Rei Chance navigation: 4択ナビ / 2択ナビ / 全ナビ
- Rei Chance success screen: one counter group; 月背景 and ロングヘア also feed Evidence
- Bonus end screen: one counter group; 紫A/B/C, 銀, 金, 虹 also feed Evidence

## Pipeline requirement

Research -> Selection -> Observation -> UI Design -> MachinePackage must preserve the shared inputIds.

A later compile stage must not split one shared observation into duplicate Feature/Evidence inputs.
