# Batch 2026-08-31 UI / Red Team checkpoint 1

## Scope

Batch: Persona5 to Smart Biohazard5 (10 machines)

Current construction state:
- ResearchData: 10/10
- SelectionData: 10/10
- Machine Observation Data v2: 10/10
- UI Design Data: 3/10

UI Design Data created in this checkpoint:
- S_PERSONA5_FR
- L_SISTER_QUEST_CA
- L_BIOHAZARD5_ZE

## Contract review

Current UI Design validator requires ui-design-data-v1, status, ordered sections, inputContracts, optional evidenceContracts, unresolved, and auditNotes. Input contracts may only use supported UI modes. DERIVED contracts require explicit sources.

Selection linkage audit rejects UI input IDs not present in SelectionData and rejects evidence contracts referencing an unknown Selection evidenceUi group.

Observation linkage audit requires generatedFrom.observation to point at the machine's Observation file and checks each section's observationRole against a FOUND / VERIFIED_ON_MACHINE Observation source.

## Red Team findings

### 1. Do not create phantom Evidence UI from legacy Selection evidence arrays

Seven current SelectionData files still primarily use the legacy top-level `evidence` array rather than structured `evidenceUi.groups`:
- S_SUPER_RIO_ACE_CC
- S_BOOWY_SV
- S_BIG_SHIMAUTA_E2_30
- S_WARAU4_KH
- S_BIOHAZARD_RE2_XB
- L_KAMEN_RIDER_DEN_O_UD
- L_TIDADONDON_PA5

The UI linkage contract can validate structured evidence only through Selection `evidenceUi.groups`. Therefore these seven should be normalized/decomposed before their final Evidence UI contracts are created. This is a construction debt, not a reason to omit their Evidence from the finished UI.

### 2. BOOWY AT-end evidence requires semantic decomposition before normalization

Research currently stores `RE_AT_END_SCREEN` as one candidate whose note mixes:
- setting 1 denial,
- soft even-setting suggestion,
- soft high-setting suggestion,
- soft setting 5/6 suggestion,
- hard setting 6 confirmation.

These must not be represented as one hard Evidence option. Hard exclusion/confirmation and soft suggestion must be separated before evidenceUi normalization. Setting L panel remains an operational warning / hard L identification item, not a normal numeric setting-likelihood feature.

### 3. Persona5 shared observation is one logical input

Manual watermelon count and MySlot watermelon result are alternate acquisition paths for one logical `INP_WATERMELON`. The UI must never add both together.

### 4. Sister Quest AT-end screen must remain one input surface

AT end screen categories are a single mutually-exclusive observation. Multinomial inference and impossible-setting behavior reuse that one observation; separate duplicate Evidence counters are not created.

### 5. Smart Biohazard5 conditional denominator must be explicit

`INP_AT_MIDDLE_LINE` is the denominator for `INP_INFECTION_FROM_MIDDLE`. Diagonal AT-symbol hits are excluded. The UI text states this directly to prevent total-AT denominator substitution.

## UI status

All three new UI contracts are intentionally `PASS_WITH_UNRESOLVED`, not USER_VERIFIED.

Remaining unresolved items are limited to actual machine/service behavior that cannot be safely inferred from public data:
- Persona5 MySlot result range/reset boundary
- Sister Quest SmartTALK history/reset boundary
- Biohazard5 reliable middle/diagonal classification and infection correspondence

## CI / automated gate status

A draft PR was opened against `prototype-multi-machine` to expose the branch to repository CI without merging it.

At the first check immediately after opening the PR, no pull-request workflow run was yet associated with the current head commit. Therefore no automated validator PASS is claimed by this report.

## Next

1. Decompose/normalize Evidence semantics for the remaining seven SelectionData files.
2. Create UI Design Data for those seven without dropping Evidence or leaking REJECT inputs.
3. Re-check PR workflow status; if repository CI does not run these local validators, defer one consolidated CMD validation run until the web/GitHub-solvable construction work is complete.
4. Only after UI linkage is stable, proceed to MachineData build/publish preparation.
