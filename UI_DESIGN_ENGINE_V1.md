# UI Design Engine Specification v1

## Purpose
UI Design Engine converts Selection + Machine Observation into a user-facing input contract. It does not decide statistical inclusion and does not own visual styling such as colors, typography, spacing, or theme.

Pipeline:
Research -> Selection -> Machine Observation -> UI Design -> MachineData Builder -> UI Audit -> Field Verification -> UI Lock

## Inputs
- research/<machineId>/selection-data.json
- research/<machineId>/machine-observation-data.json (v1 compatible; v2 preferred)
- machine registry metadata
- optional existing user-verified-ui-lock.json used as a protected reference, never overwritten automatically

## Output
research/<machineId>/ui-design-data.json with schemaVersion ui-design-data-v1.

Required top-level fields:
- schemaVersion
- machineId
- status: DRAFT | PASS | PASS_WITH_UNRESOLVED | MANUAL_UI_REVIEW_REQUIRED | USER_VERIFIED
- generatedFrom.selection
- generatedFrom.observation
- sectionOrder[]
- sections{}
- inputContracts{}
- optional evidenceContracts{}
- unresolved[]
- auditNotes[]

A section always has inputIds[] and may also have evidenceIds[]. Evidence that Selection represents through evidenceUi is not forced into a fake input ID. Instead, evidenceContracts references the Selection evidence group by sourceEvidenceGroupId and normally inherits its options.

## Responsibilities
UI Design Engine decides:
- user-facing section grouping and order
- input labels based on observable machine terminology
- input mode: COUNTER, NUMBER, SELECT, EVIDENCE, DERIVED, READ_ONLY
- Evidence group placement and presentation while preserving Selection semantics
- directInput true/false
- compact counter suitability
- one/two-column semantic layout hint (gridSpan 12/6)
- derived inputs and source input IDs
- descriptions, observation timing, exclusions, and predecessor/own-play distinction
- grouping of suggestive and conclusive outcomes from the same observation event when appropriate

It must not:
- add/remove Selection features for convenience
- invent inputs or Evidence groups that do not exist in SelectionData
- alter probabilities, weights, denominators, Evidence meaning, or Difficulty
- perform web research as a substitute for missing Observation data
- overwrite USER_VERIFIED_UI_LOCKED contracts automatically
- encode app-wide colors/fonts/spacing

## Transformation principles
1. DIRECT_PLAY + MANUAL_COUNTER => COUNTER candidate.
2. END_EVENT/VISUAL_EVENT with mutually exclusive categories => compact COUNTER group; gridSpan 6 is preferred when labels remain readable.
3. AUDIO_EVENT or VISUAL_EVENT Evidence => label by what the player actually hears/sees, with setting meaning as secondary text.
4. Selection evidenceUi remains an Evidence contract; do not manufacture a normal input only to render it.
5. DERIVABLE => avoid duplicate manual entry; use DERIVED when all required source inputs exist.
6. COMBINABLE => allow multiple observations to construct one Selection statistic; explain source/period boundaries.
7. SEATED_STATE => dedicated predecessor/seat-time section and explicit result-label distinction from own-play statistics.
8. Excluded observation conditions must be surfaced in section/input description.
9. Same observation timing should normally be grouped into one section even when some outcomes are suggestive and others are Evidence.
10. Optional DATA_COUNTER or LINKED_SERVICE methods must never make a statistically valid manual feature unavailable.
11. UNRESOLVED Observation may produce PASS_WITH_UNRESOLVED or MANUAL_UI_REVIEW_REQUIRED; it does not reopen Research by itself.

## Selection linkage gate
Every inputContracts key must exist in SelectionData.inputs. Every evidenceContract.sourceEvidenceGroupId must exist in SelectionData.evidenceUi.groups and preserve selectionMode. This prevents UI Design from inventing statistical/evidence concepts.

## Gate
PASS: contract is structurally valid and all UI decisions are deterministic.
PASS_WITH_UNRESOLVED: usable UI exists but optional observation details remain unresolved.
MANUAL_UI_REVIEW_REQUIRED: UI decision materially affects correctness/interpretability and cannot be determined from Selection + Observation.

RESEARCH_REOPEN_REQUIRED belongs to Machine Observation, not UI Design.

## Reference machine
S_REVUE_STARLIGHT_CX is the v1 reference. Its user-verified-ui-lock.json is the golden UX contract. UI Design generation/audit must not mutate the lock. A reference audit compares section order, item membership, derived calculations, user-facing labels, directInput, compact, and gridSpan where the lock specifies them.

## Pilot coverage
- S_MY_JUGGLER_V_KD: simple A-type plus predecessor snapshot.
- LB_SLOT_GALFY_A4: BT/A+ pattern, optional predecessor inputs, manual role counters, and Selection evidenceUi.
- L_INITIAL_D_2ND: smart-slot AT pattern, linked-service statistics, special denominator exclusions, multinomial end-event counters, and multiple independent Evidence groups.

## Lock policy
If user-verified-ui-lock.json status is USER_VERIFIED_UI_LOCKED:
- automatic regeneration may create a proposed ui-design-data.json for comparison,
- publish/build automation must preserve the locked UI,
- differences are reported as LOCKED_UI_DRIFT and require an explicit machine-specific UI change plus renewed field verification.
