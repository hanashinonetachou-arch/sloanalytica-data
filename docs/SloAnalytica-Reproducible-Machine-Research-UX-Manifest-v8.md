# SloAnalytica Reproducible Machine Research & UX Construction Manifest v8.0

Status: DRAFT — Reference-machine validation required  
Date: 2026-09-21  
Supersedes as execution source: Machine Research & Construction Pipeline v1 and the active rules of MachineData・UX Construction Manifest v7.2.  
Preserves: applicable v7.2/v7.1/v6.15 UX knowledge, Core Policy, User-Verified UX Contract Policy, and established statistical invariants.

## 0. Purpose and acceptance criterion

This Manifest exists so that a different AI/session can receive only this Manifest plus the machine identity and source-access environment, execute research from zero, and reproduce machine data, UI, explanations, and inference behavior at equivalent quality.

The Manifest is not complete merely because artifacts exist. It is complete only after a reference machine can be rebuilt from zero without machine-specific patches and the expected semantics survive:

Research → Completeness → Trial Universe → Exposure → Dependency → Selection → Evidence → Linked Play Data → Predecessor Observation → Observation → HighLowDiscrimination → Machine Research Summary → Canonical UI → MachinePackage → App Renderer → Distribution → Real Device.

If the result is wrong, do NOT patch the reference machine to match an expected screenshot. Identify the missing/ambiguous Manifest rule, amend the Manifest, and restart the affected construction from Research. Machine-specific exceptions are prohibited unless they express a genuine machine-specific fact discovered by Research.

## 1. Normative language and no-guessing rule

MUST / MUST NOT are build requirements. SHOULD requires an explicit reason to deviate. MAY is optional.

REP-001: A downstream stage MUST NOT invent a semantic decision that belongs to an upstream stage.
REP-002: Missing required upstream information MUST become UNRESOLVED/BLOCK, not a heuristic default.
REP-003: Builder, Adapter, Materializer, Renderer and Distribution MUST translate/preserve contracts; they MUST NOT re-decide Selection, Observation, dependency, section grouping, labels, layout or evidence semantics.
REP-004: A green workflow is not Manifest compliance. Every applicable Gate rule must pass.
REP-005: A package-only or renderer-only correction that cannot be regenerated from canonical source is incomplete.
REP-006: A machine-specific fix that compensates for a general Manifest/pipeline defect is prohibited.

## 2. Required pipeline and artifacts

Ordered stages:
1. Research
2. Data Completeness
3. Denominator / Trial Universe
4. Exposure
5. Dependency
6. Selection
7. Evidence Research
8. Linked Play Data Research
9. Predecessor Observation Research (pure A-type standard; otherwise NOT_REQUIRED when justified)
10. Observation
11. HighLowDiscrimination
12. Machine Research Summary
13. Canonical UI
14. MachinePackage
15. Runtime Contract Verification
16. Distribution Verification
17. UI Preview Checkpoint (reference-machine validation only)
18. Distribution Verification
19. Real-device Verification
20. User-Verified UI Lock

Required machine artifacts:
- research-data.json
- selection-data.json
- observation-data.json
- high-low-discrimination-report.json
- machine-research-summary.json
- canonical-ui.json
- machine-package.json
- generation/verification reports sufficient to prove semantic preservation

Statuses are independent:
Research Complete ≠ Selection Complete ≠ Observation Complete ≠ HighLow Complete ≠ Summary Complete ≠ Canonical UI Complete ≠ UI Preview Accepted ≠ MachinePackage Complete ≠ Distribution Complete ≠ Real-device Complete.

Reference-machine validation intentionally introduces an early UI Preview Checkpoint. This checkpoint is for evaluating Manifest reproducibility, not for declaring the machine complete.

## 3. Research — public information first

RES-001: Research MUST seek the public setting-difference universe before deciding usefulness for inference.
RES-002: Every candidate MUST retain source/provenance, setting values or categorical constraints, observation event, known conditions and uncertainty.
RES-003: Research MUST NOT omit a public difference merely because it looks weak, inconvenient, dependent, or unlikely to be selected.
RES-004: Evidence is researched as evidence and is not forced through Numeric SelectionScore.
RES-005: Unknown values MUST remain unknown. No fabricated probabilities, exposure counts, trial counts, denominators or setting mappings.
RES-006: Research completeness and inference usefulness are separate dimensions.

## 4. Data Completeness

COMP-001: Every researched candidate receives a completeness state.
COMP-002: Published-but-incomplete information remains traceable even if unusable for inference.
COMP-003: Final user-facing research summary MUST distinguish researched/adopted/rejected/unresolved rather than treating Selection as the researched universe.
COMP-004: REJECT means “researched/evaluated but not used in inference”; it MUST NOT mean “delete knowledge that it exists.”

## 5. Denominator / Trial Universe

DEN-001: Every Numeric candidate MUST define numerator, denominator/trial universe, unit, scope and applicable state.
DEN-002: When relevant, define exclusion states, reset boundary, shared denominator, conditional denominator and observation interval.
DEN-003: Different trial universes MUST NOT be merged for UI convenience.
DEN-004: Multiple features sharing the same real observation interval and denominator SHOULD use one shared denominator input when semantically valid. The user MUST NOT be asked to enter the same denominator repeatedly.
DEN-005: User-facing denominator labels MUST use natural, countable language corresponding to what the player can actually observe.
DEN-006: Builder MUST NOT manufacture generic denominator inputs such as “対応通常ゲーム” when Canonical UI has not explicitly contracted the denominator presentation.
DEN-007: Empty/unentered = unobserved. Numeric zero = observed and zero occurrences. This distinction MUST survive input, storage, inference and results.

## 6. Exposure

EXP-001: Exposure MUST represent realistic opportunities during play, not fabricated 7000G trials.
EXP-002: UNKNOWN exposure MUST NOT be converted into a guessed trial count.
EXP-003: Exposure assumptions MUST be traceable to Research/Observation.
EXP-004: Input burden alone is not a Selection criterion.

## 7. Dependency

DEP-001: Candidate relationships MUST be classified before Selection.
DEP-002: The contract MUST distinguish at least independent, primary, alternative/suppressed, conditional, derived and mutually-exclusive relationships when applicable.
DEP-003: Dependent observations MUST NOT be naively multiplied as independent likelihoods.
DEP-004: A selected alternative MUST retain the identity of the primary information that suppresses/replaces it.
DEP-005: If dependency affects what the player should input or how results should be interpreted, that relationship MUST propagate to Machine Research Summary and Canonical UI in user-facing language.
DEP-006: The UI MUST NOT present PRIMARY and ALTERNATIVE as two equal independent pieces of evidence when inference does not treat them that way.

## 8. Selection

SEL-001: SelectionScore = IG7000 × 200.
SEL-002: CORE >= 20; SUPPORT >= 10; JOINT_ELIGIBLE >= 5; below 5 = REJECT, subject to dependency/validity requirements.
SEL-003: Standalone Numeric feature requires IG7000 >= 0.05 bit. Joint participation requires >= 0.025 bit and the joint feature must reach >= 0.05 bit.
SEL-004: Selection MUST occur only after completeness, denominator, exposure and dependency are sufficiently resolved.
SEL-005: For every candidate preserve disposition, IG, SelectionScore, class, relevant trial/exposure basis, dependency and a concrete reason.
SEL-006: “推測計算に採用しています” is not an acceptable adoption reason. A reason MUST explain why the information is useful, including quantitative basis where available.
SEL-007: Rejection reasons MUST distinguish causes such as weak information, insufficient practical exposure, unavailable observation, incomplete public distribution, dependency/double counting, invalid denominator or unresolved semantics.
SEL-008: User-facing explanations MUST not expose internal tokens such as INCLUDE_PRIMARY, Gate names or schema IDs.
SEL-009: Detailed technical metrics may remain in research artifacts, but the user-facing reason must preserve the actual rationale rather than replacing it with a generic sentence.

## 9. Evidence Research

EVI-001: First determine whether adopted Evidence exists. No Evidence => NO_EVIDENCE; do not create an empty Evidence section.
EVI-002: Evidence is grouped by natural Observation Context, not by strength such as “設定示唆/確定”.
EVI-003: Surface classification uses END_SCREEN, TROPHY_STAMP, VOICE, PAYOUT_DISPLAY, LAMP_LED, CHARACTER_CARD, MUSIC_SOUND, TEXT_MESSAGE, SYMBOL_NAV_EFFECT, MENU_HISTORY, with OTHER only when none fits.
EVI-004: Evidence Group = same Surface + same natural Observation Context.
EVI-005: Observation Context MUST identify applicable surface/event/timing/interaction.
EVI-006: Same observation opportunity with multiple outcomes belongs to one group/options even when setting constraints differ.
EVI-007: If Surface/Context cannot be determined from Research, return UNRESOLVED; do not guess a group.
EVI-008: UI input records the observed fact; it MUST NOT ask the user to input the inferred setting constraint itself.
EVI-009: Evidence constraints and Numeric inference remain computationally separate even when colocated in UI.

## 10. Linked Play Data and Predecessor Observation

LINK-001: Linked play/service data is researched after Selection and is an Observation source for adopted information; availability MUST NOT retroactively make a statistically invalid feature valid.
LINK-002: Record machine-level linked-play capability/status and which adopted observations can actually be obtained.
LINK-003: Service labels and aggregation scope SHOULD be preserved when that prevents input ambiguity.
LINK-004: Linked-play availability is determined from the manufacturer's official linked-play/service machine support information. If the machine is listed, status = AVAILABLE; if it is not listed, status = NOT_AVAILABLE. Do not expand the search to unrelated secondary sources merely to overturn that official support result.
LINK-005: Use UNRESOLVED only when the official support information itself cannot be confirmed or is genuinely ambiguous. Only when status = AVAILABLE, map which selected Numeric Features/Evidence can be obtained from the linked service.
PRE-001: Predecessor/seated observations are researched only where relevant and MUST not be fabricated from missing historical UX.
PRE-002: Predecessor data may participate in live inference when statistically valid but MUST NOT automatically be treated as the standard HighLow benchmark play interval.

## 11. Observation

OBS-001: Every adopted Numeric Feature/Evidence MUST have an Observation Context or an explicit valid derived/no-input route.
OBS-002: Observation defines where, when and how the player obtains the value, including primary/fallback source where applicable.
OBS-003: Observation defines numerator/denominator acquisition together when both are needed.
OBS-004: Observation Action such as “PUSHで確認” is first-class data and MUST propagate to user-facing UI when useful.
OBS-005: Observation MUST determine natural section co-location; Canonical UI may not reconstruct it from feature type.
OBS-006: Unobserved and observed-zero semantics are explicit and testable.

## 12. HighLowDiscrimination

HLD-001: Evaluate LOW=settings 1–2 vs HIGH=settings 5–6 at 1500/3000/7000G. Settings 3–4 are excluded only from this benchmark, not from the inference engine.
HLD-002: Record the defined discrimination metric(s), including Balanced Accuracy when used by the adopted pipeline, assumptions and usable features.
HLD-003: HighLowDiscrimination is not merely an internal report. Machine Research Summary and MachinePackage MUST expose enough structured information for the app to show the player the machine’s discrimination quality by play length.
HLD-004: The legacy “判定信頼度” of a particular inference result MUST NOT be presented as a substitute for HighLowDiscrimination.
HLD-005: If a benchmark cannot be computed honestly, display/record unresolved or insufficient data rather than fabricate precision.

## 13. Machine Research Summary

SUM-001: Summary is constructed before Canonical UI so UI can consume it.
SUM-002: It MUST contain: research coverage/completeness, adopted Numeric information, rejected Numeric information, unresolved items, dependency relationships, observation guidance, adopted Evidence, linked-play status, HighLowDiscrimination and important practical notes.
SUM-003: Adopted/rejected counts MUST be based on the researched candidate universe, not only on already-selected runtime inputs.
SUM-004: Each adopted/rejected item MUST have a machine-specific reason derived from Selection/Research facts.
SUM-005: Summary MUST support the app section “この機種の設定推測について”; “latest data unavailable” while runtime features exist is not MachinePackage Complete.
SUM-006: Research completion and app completion are separate. Summary existence alone does not prove delivery to the app.

## 14. Canonical UI — authority

UI-001: Canonical UI consumes Selection + Observation + Machine Research Summary. It MUST NOT re-decide Selection.
UI-002: Canonical UI is the sole authority for section grouping/order/title/description, input placement, input grouping, grid span, compact/direct input mode, accordion behavior, Evidence placement and user-facing observation guidance.
UI-003: Every input section MUST have a meaningful description unless an explicit documented reason proves that a description would add no useful information. For reference-machine validation, descriptions are required.
UI-004: Common observation conditions, target states, exclusions and counting instructions belong in section description once; do not duplicate the same prose on every item.
UI-005: User-facing text MUST answer practical questions: what to enter, where to find it, when to observe it, which denominator/scope to use, and common mistakes where relevant.
UI-006: Internal schema vocabulary MUST NOT leak into user-facing text.
UI-007: Item labels SHOULD be minimal and non-redundant when the Section description already supplies common context. Do not repeat the same explanatory prose on each item.
UI-008: Existing User-Verified UX Contracts are protected inputs to Canonical UI. Canonical UI MUST NOT silently regress verified labels, order, grouping, folding behavior, direct/compact input behavior or other protected interaction semantics unless this Manifest explicitly supersedes that contract.

### 14.1 Two-column layout contract

COL-001: The standard numeric layout is two-column where physical/operational compatibility permits; it is not “make every item half width.”
COL-002: A short input is eligible for half-width only when it is in the same section, semantically independent, remains readable/tappable at half width, is not a parent/child or denominator/helper input, and horizontal placement cannot imply a false relationship.
COL-003: Typical small independent event counters (e.g. BIG/REG, CZ types, compact AT-related counts) SHOULD be considered for two-column layout.
COL-004: Full width is the default for cumulative game counts, total game counts, AT game counts, denominators, parent/child inputs, long labels, long free-form/complex/special controls, and controls whose operation becomes cramped at half width. A control requiring multiple quick-add actions such as +1/+50 is not half-width eligible while such actions exist.
COL-005: Input type alone (NUMBER/COUNTER/RATE/SELECT) MUST NOT determine width.
COL-006: When a two-column eligible sequence has an odd final item, leave the paired cell empty. MUST NOT pull an item from another section to fill the hole.
COL-007: Numerator/denominator semantic pairs MUST be designed as a meaningful feature/input group. Builder MUST NOT simply split them into unrelated cards.
COL-008: UI convenience MUST NOT merge different trial universes.
COL-009: Labels MUST remain natural Japanese. Mechanical shortening that leaves particles or changes meaning is prohibited.
COL-010: Width decisions are physical/operational compatibility decisions, not statistical importance decisions.
COL-011: When a historical/user-verified layout contract exists, regeneration MUST preserve it unless the current Manifest explicitly supersedes it. A statistical rebuild is not permission to erase verified grouping/folding/placement.

### 14.2 Accordion / menu contract

ACC-001: Adopted Numeric Feature/Evidence sections are based on natural Observation Context.
ACC-002: Input sections are normally collapsible Accordion Menu sections.
ACC-003: Accordion behavior is single-open: opening one section closes the previously open section.
ACC-004: single-open MUST be explicit in Canonical UI and propagate to MachinePackage; it is not an implicit Renderer preference.
ACC-005: Section title prioritizes “when/what is observed” in natural language. Generic strength labels MUST NOT merge different contexts.
ACC-006: Numeric and Evidence obtained in the same natural context MAY share a section, while inference remains separate.
ACC-007: defaultExpanded is explicit; user interaction must still preserve single-open.
ACC-008: Accordion conversion MUST NOT delete, duplicate or clone adopted inputs.
ACC-009: Section order follows real play observation flow; setting-confirmation-only sections are normally later unless co-location is more natural.
ACC-010: Section explanatory prose MUST be independently collapsible/expandable when it is longer than a short one-line operational cue. Collapsing explanation MUST NOT collapse or hide the section's inputs themselves.
ACC-011: Canonical UI MUST record explanation presentation separately from section accordion state (for example explanationCollapsible/defaultExplanationExpanded). Renderer MUST NOT force long descriptions permanently open.

### 14.3 Quick Input status

QI-001: Quick Input and Quick-Input-only sections/eligibility are suspended from the current required UI contract.
QI-002: Legacy quickAdd knowledge remains historical/protected knowledge but MUST NOT silently re-enter current generation or acceptance gates.
QI-003: Every adopted input MUST remain usable through the normal Accordion UI without Quick Input.
QI-004: Reintroduction requires a future explicit Manifest revision.
QI-005: Historical quickAdd details are not current generation requirements. If Quick Input is later reintroduced, its width/operation rules must be specified explicitly rather than inferred from old runtime defaults.

### 14.4 Repeated observations and categorical accumulation

REPINPUT-001: A Feature/Evidence whose observation opportunity can occur more than once in a session MUST NOT be represented as a single persistent SELECT that overwrites the previous observation.
REPINPUT-002: Research/Observation MUST classify each observable as one of SINGLE_SESSION_STATE, REPEATED_CATEGORICAL_EVENT, REPEATED_BINARY_EVENT, REPEATED_NUMERIC_EVENT, or EVIDENCE_OCCURRENCE before Canonical UI.
REPINPUT-003: REPEATED_CATEGORICAL_EVENT normally requires per-category counters or an “add observation” interaction that accumulates category counts. After one category is recorded, the next opportunity must be recordable without erasing the first.
REPINPUT-004: When inference needs category distribution, Canonical UI MUST preserve both category counts and the total opportunity count (explicitly or as an exact derivation). A one-shot dropdown is invalid.
REPINPUT-005: If only the latest state is meaningful, SINGLE_SESSION_STATE may use a select control, but Observation must explicitly justify why earlier observations are irrelevant.
REPINPUT-006: UI Preview MUST demonstrate the second-observation path for every repeated categorical input; a preview that only shows the first selection is incomplete.

## 15. Runtime translation / MachinePackage

PKG-001: Adapter/Builder is a translator, not a designer.
PKG-002: It MUST preserve Canonical UI section title/order/description, item grouping/placement, gridSpan, collapsible/defaultExpanded, accordion behavior, observation action, Evidence placement and summary/high-low data required by the app.
PKG-003: It MUST NOT generate a different section structure from runtime input categories.
PKG-004: It MUST NOT invent gridSpan, compactness, labels, denominator presentation or grouping when Canonical UI is missing them. Missing required contract => build failure.
PKG-005: Canonical UI and generated MachinePackage semantic equality is a Gate, not a best-effort check.
PKG-006: Generated and published packages are distinct states. Publishing stale package bytes after successful generation is failure.
PKG-007: Package update requires matching catalog sha256/packageSize/version metadata and verified distribution.
PKG-008: Visibility/hide semantics defined upstream MUST apply consistently across renderers; hidden/rejected-only inputs MUST NOT reappear through a fallback renderer.
PKG-009: Canonical selectionSummary / Machine Research Summary is the sole user-facing authority for adopted/rejected research explanations. Runtime materialization MUST NOT regenerate competing generic explanations.

## 16. App Renderer

APP-001: Renderer renders the package contract; it MUST NOT fallback into a layout that changes Observation Context, grouping or semantic relationships.
APP-002: If the current renderer cannot express a valid Canonical UI contract, fix/extend the generic renderer/schema. Do not degrade correct data to fit an old renderer.
APP-003: Section descriptions MUST be visible at the section level with line breaks preserved.
APP-004: Accordion single-open behavior MUST be implemented generically.
APP-005: Results MUST preserve unobserved vs observed-zero.
APP-006: Results MUST NOT present suppressed/alternative information as an equal independent contribution.
APP-007: Machine Research Summary, adoption/rejection explanations and HighLowDiscrimination MUST be renderable from package data.
APP-008: “判定信頼度” and HighLowDiscrimination are separate concepts and must remain separate in UI.

## 17. UI Preview Checkpoint — reference-machine validation

PREVIEW-001: During Manifest reproducibility validation, stop after Canonical UI has been materialized far enough to render a faithful preview. Do NOT require full MachinePackage publish, catalog update, distribution, APK build or real-device installation before this checkpoint.
PREVIEW-002: The preview MUST be produced from the newly reconstructed Research → Selection → Observation → Summary → Canonical UI path. A hand-made mockup that bypasses canonical data does not validate reproducibility.
PREVIEW-003: The preview should show, at minimum, section titles/order/descriptions, Accordion structure, two-column/full-width choices, numerator/denominator grouping, Evidence grouping/actions, and the “この機種の設定推測について” information architecture.
PREVIEW-004: User review at this checkpoint is a design/reproducibility review, not Real-device PASS.
PREVIEW-005: If the preview is rejected because the Manifest is missing or ambiguous, amend the Manifest and rerun only the earliest affected stage forward. A full distribution/real-device cycle is NOT required.
PREVIEW-006: If the Manifest is clear but implementation loses the contract, fix the generic generator/adapter/preview renderer and regenerate from the earliest affected implementation stage. Do not redo Research unnecessarily.
PREVIEW-007: After the preview is accepted, proceed once through MachinePackage → runtime contract verification → distribution → real device for final end-to-end proof.
PREVIEW-008: Subsequent reference iterations MAY return to this preview checkpoint whenever a Manifest amendment changes UI semantics; they do not need to repeat APK/device verification until the preview is accepted again.

## 18. Distribution

DIST-001: Repo update is not Distribution Complete.
DIST-002: Verify catalog/package bytes, sha256, packageSize, version/update path and actual endpoint/resource consumed by the app.
DIST-003: Fresh-storage and update-path are separate verification paths.
DIST-004: A test build must prove which catalog/resource it actually consumes; do not infer from configuration intent.

## 19. Gates

Gate R — Research Complete:
- researched public candidate universe and Evidence universe are traceable
- no known unresolved item is silently dropped

Gate C — Completeness/Trial/Exposure/Dependency Complete:
- every candidate has sufficient denominator/trial/exposure/dependency state for Selection or explicit UNRESOLVED

Gate S — Selection Complete:
- every candidate has disposition, quantitative basis and concrete reason
- dependency/double-counting rules resolved

Gate O — Observation Complete:
- every adopted item has feasible observation/derived route
- numerator/denominator acquisition and Evidence Context/Action resolved

Gate H — HighLow Complete:
- 1500/3000/7000G LOW/HIGH benchmark exists or honest unresolved state exists

Gate M — Summary Complete:
- researched/adopted/rejected/unresolved, reasons, dependency, Evidence, observation, linked play and HighLow are represented

Gate D — Canonical UI Complete:
- every adopted observable item placed exactly once
- every reference-validation section has description
- two-column/full-width decision explicitly represented
- Accordion grouping/title/order/collapsible/defaultExpanded/single-open explicitly represented
- no generic Evidence regrouping
- no Quick Input dependency
- unobserved/zero semantics representable

Gate UI-P — UI Preview Accepted (reference-machine validation):
- faithful preview is generated from canonical source, not manually mocked
- user can inspect section descriptions, grouping, two-column decisions, Accordion behavior contract, Evidence contexts/actions and Summary presentation
- rejection routes back only to the earliest affected stage
- no distribution/APK/device work is required before acceptance

Gate E — MachinePackage Complete:
- Canonical UI → package semantic equality
- Summary and HighLow survive
- no adapter-generated semantic defaults
- no loss/duplication
- App validator/capability accepts the intended contract

Gate P — Distribution Complete:
- published bytes/catalog/version match generated package
- app fetch/update path verified

Gate RD — Real-device Complete:
- user verifies actual device behavior; AI MUST NOT self-declare this gate
- section titles/descriptions, accordion single-open, layout density, Evidence context/action, input semantics, results, summary, HighLow and update path are checked

Gate UV — User-Verified UI Lock:
- after explicit user confirmation, canonical source contract is protected against future regeneration regressions

## 20. Reference-machine reproducibility protocol

REF-001: First reference machine is L_LOVEJOU3_M4.
REF-002: Before the v8 reference run, do not modify Love嬢3 machine artifacts to pre-fit the desired result.
REF-003: Start Research from zero using this Manifest as the construction specification. Existing machine artifacts may be used only as regression comparison after independent reconstruction, not as authority for decisions.
REF-004: Run Research through Canonical UI in order, generate the UI Preview, and pause for the UI-P checkpoint. Only after UI-P acceptance continue through MachinePackage, Distribution and Real-device gates.
REF-005: Compare the generated result against the intended product qualities and real-device findings.
REF-006: If a mismatch is caused by missing/ambiguous general rules, revise this Manifest and restart from the earliest stage whose decisions are affected. Restart from Research only when the changed rule can alter Research or downstream facts. Do not patch Love嬢3.
REF-007: If the Manifest explicitly and unambiguously required the correct result but implementation lost it, fix the generic pipeline/adapter/renderer and rerun generation; do not alter machine semantics.
REF-008: Love嬢3 passing proves the first reference only, not fleet reproducibility. Additional structurally different reference machines are required before mass production.
REF-009: Mass-production readiness means a fresh AI/session can follow this Manifest without relying on hidden prior-chat decisions and reach equivalent-quality artifacts.

## 21. Mandatory anti-omission checklist

Before starting any machine Research, the operator/AI MUST confirm this Manifest explicitly covers:
- public-value completeness vs inference usefulness
- denominator/trial universe and shared denominator
- exposure
- dependency and double-counting
- quantitative adoption/rejection reasons
- Evidence Surface + Observation Context + Observation Action
- linked play capability using manufacturer-official support status
- predecessor observation where applicable
- unobserved vs zero
- HighLowDiscrimination 1500/3000/7000G
- Machine Research Summary
- section descriptions
- two-column eligibility and full-width exceptions
- feature-level numerator/denominator grouping
- explicit user-facing denominator definition and shared-denominator behavior
- repeated-observation accumulation semantics, including a demonstrated second-observation path
- independently collapsible long explanations
- physical/operational two-column compatibility rather than input-type heuristics
- preservation of User-Verified UX contracts
- Accordion + single-open
- Quick Input suspension
- Canonical UI authority
- Adapter/Builder no-redecision
- package semantic equality
- App rendering requirements
- generated vs published distinction
- distribution/update path
- early UI Preview checkpoint before MachinePackage/distribution/device work
- rejection returns to the earliest affected stage rather than automatically to Research
- real-device gate after preview acceptance
- user-verified canonical persistence

If any item is absent or ambiguous, machine Research MUST NOT begin.

## 22. Current validation state

v8.0 remains a DRAFT under reference-machine validation. The previous Love嬢3 UI-P preview was intentionally rejected after exposing generic UX contract gaps. The next permitted reference action is a fresh L_LOVEJOU3_M4 reconstruction under the amended Manifest, again stopping at UI-P before package publication/distribution/device work.
No existing Love嬢3 Canonical UI or preview may be patched as the design authority.

### 14.4A Repeated observation input strategy

- `REPINPUT-007`: `REPEATED_CATEGORICAL_EVENT` does not imply an Add Observation UI. Canonical UI MUST choose an interaction from the observation semantics before materialization.
- `REPINPUT-008`: When inference and Evidence only require accumulated category frequencies and event order has no meaning, the default interaction is `CATEGORY_COUNTERS`: one cumulative counter per mutually exclusive category. The UI MUST preserve the total opportunity count explicitly or derive it exactly from category counts.
- `REPINPUT-009`: `ADD_OBSERVATION` is reserved for cases where order/history, per-opportunity co-occurrence, later auditability, or another documented semantic requirement would be lost by category counters. ObservationData MUST state that requirement; the renderer MUST NOT choose it for visual preference.
- `REPINPUT-010`: Category counters follow the normal grid rules. Short, independent counters in the same observation context are normally eligible for two-column placement; an odd final counter leaves the paired cell empty.
- `REPINPUT-011`: For mutually exclusive categorical outcomes, incrementing one category records one observation opportunity. A separate total-opportunity input MUST NOT be requested when the total is exactly derivable from the category counters.
- `REPINPUT-012`: The UI Preview checkpoint MUST demonstrate repeated-entry behavior for the selected interaction. For `CATEGORY_COUNTERS`, incrementing the same or another category MUST accumulate without overwriting prior counts. For `ADD_OBSERVATION`, the second-observation path remains mandatory.

### 14.4B CATEGORY_COUNTERS canonical category contract

- **REPINPUT-013**: A Canonical UI node whose interaction is `CATEGORY_COUNTERS` MUST carry the complete ordered category definition required for rendering. Each category MUST have a stable `id`, a user-facing `label`, and the source outcome `meaning` when one exists. Downstream runtime materializers and renderers MUST NOT look back into ResearchData to reconstruct missing categories.
- **REPINPUT-014**: For Evidence-derived category counters, Canonical UI generation MUST propagate the published Research Evidence outcomes into `interaction.categories` without inventing, merging, renaming, or dropping outcome semantics. A missing, empty, duplicate, or semantically unmatched category list is a blocking Canonical UI error.
- **REPINPUT-015**: Each CATEGORY_COUNTERS category is an independent cumulative counter. The rendered total opportunity count is derived from the sum only when `totalOpportunities=DERIVE_FROM_CATEGORY_COUNTS`; the renderer MUST NOT create an additional editable total in that case.
- **REPINPUT-016**: Runtime materialization MUST preserve the ordered category array byte-for-semantic-value. UI Preview MUST visibly demonstrate at least two increments, including repeated increments of one category or increments across two categories, and show that prior counts are retained.

### 8.4 Machine-readable dependency contract

- **DEP-010**: Any adopted Selection feature that is not independent MUST carry a structured `dependencyContract`; prose `dependency` or `reason` alone is insufficient.
- **DEP-011**: `dependencyContract` MUST declare `relationship` (for example `ALTERNATIVE`, `CONDITIONAL`, `DERIVED`, or `EXCLUSIVE`), the related canonical `featureIds`, and an explicit `combinationPolicy`. For an alternative that would double-count shared evidence, `combinationPolicy` MUST be `DO_NOT_MULTIPLY` and the contract MUST state the preferred primary feature.
- **DEP-012**: Selection validation MUST BLOCK an `ADOPT_ALTERNATIVE`, `ADOPT_CONDITIONAL`, or other non-independent adopted disposition when its structured dependency contract is absent, references unknown features, or contradicts the prose rationale.
- **DEP-013**: Probability/runtime adapters MUST consume this structured contract. Machine-ID-specific suppressor maps or renderer-side inference are forbidden for Manifest v8 packages. Legacy compatibility maps MAY remain only for pre-v8 packages and MUST NOT be consulted by a v8 package.
- **DEP-014**: Canonical UI and Machine Research Summary MUST preserve the user-facing rationale, while MachinePackage MUST preserve the structured dependency contract required by the inference engine. Presentation text is not a substitute for engine semantics.


### 14.4C CATEGORY_COUNTERS coverage and opportunity semantics

- **REPINPUT-017**: Every `CATEGORY_COUNTERS` interaction MUST declare `categoryCoverage` as `EXHAUSTIVE` or `NON_EXHAUSTIVE`. Downstream code MUST NOT infer exhaustiveness from the number, names, or meanings of categories.
- **REPINPUT-018**: `totalOpportunities: "DERIVE_FROM_CATEGORY_COUNTS"` is valid only when `categoryCoverage: "EXHAUSTIVE"`, the categories are mutually exclusive, and every observation opportunity produces exactly one listed category.
- **REPINPUT-019**: Published Evidence outcomes that enumerate only special, hinted, confirmed, or otherwise positive outcomes MUST NOT be presumed exhaustive. Unless the source explicitly defines every possible outcome, their canonical coverage is `NON_EXHAUSTIVE`.
- **REPINPUT-020**: A `NON_EXHAUSTIVE` interaction MUST declare `opportunityTracking`. When absence has semantics or the product must distinguish “checked and no listed outcome” from “not checked”, `opportunityTracking.type` MUST be `SEPARATE_COUNTER` with a stable `inputId` and natural user-facing `label`. Category counts remain occurrence counts and MUST NOT be treated as the opportunity denominator.
- **REPINPUT-021**: A source-defined NONE / no-special-outcome category MAY make an interaction exhaustive only when that outcome is explicitly supported by the source semantics. The research, canonical builder, adapter, or renderer MUST NOT invent a NONE category merely to simplify input.
- **REPINPUT-022**: Empty/unentered opportunity state means `UNOBSERVED`; numeric zero means `OBSERVED_ZERO`. Renderers MUST preserve that distinction and MUST NOT coerce an absent value to displayed or stored zero.
- **REPINPUT-023**: For `SEPARATE_COUNTER`, the UI MUST make the observation opportunity understandable in natural language (for example “AT終了画面を確認した回数”). Incrementing a listed category MUST NOT silently fabricate an opportunity count unless Canonical explicitly declares an atomic paired-entry interaction.
- **REPINPUT-024**: Canonical validation MUST BLOCK: missing `categoryCoverage`; derived totals on non-exhaustive categories; non-exhaustive absence-sensitive Evidence without opportunity tracking; duplicate or semantically unmatched categories; and any contract that cannot preserve UNOBSERVED versus OBSERVED_ZERO.
- **REPINPUT-025**: Runtime materialization MUST preserve `categoryCoverage` and `opportunityTracking` without reinterpretation. The faithful UI Preview MUST demonstrate both repeated category accumulation and the checked-zero versus unobserved distinction whenever `SEPARATE_COUNTER` is used.


## 23. Reference-preview UX corrections — mandatory generic rules

These rules were discovered at the Love嬢3 reference UI-P checkpoint. They are generic product rules, not Love嬢3 exceptions. A fresh AI/session MUST apply them without access to prior-chat context.

### 23.1 Section header interaction
- **ACC-012**: For a collapsible observation section, the section title/header itself is the primary expand/collapse control. A separate generic action button such as 「編集」 MUST NOT be required to open the section.
- **ACC-013**: The complete section header hit area SHOULD be interactive where the renderer permits it, with an accessible expanded/collapsed state and a visual disclosure affordance. The user-facing action MUST mean expand/collapse, not “edit”.
- **ACC-014**: accordion.singleOpen=true remains authoritative: opening one collapsible section closes the previously open collapsible section.
- **ACC-015**: Section expansion and explanatory-text expansion are two independent layers. Opening a section MUST NOT automatically expand a collapsible explanation unless descriptionPresentation.defaultExpanded=true.

### 23.2 Explanation behavior inside an opened section
- **DESC-001**: When a section has a collapsible descriptionPresentation, its explanation control is rendered inside that section after the section is opened.
- **DESC-002**: A user-facing label such as 「説明」 remains available for that control when specified by Canonical UI. The renderer MUST NOT replace this with always-visible prose merely because the parent section is open.
- **DESC-003**: Closing/reopening a section MUST NOT conflate section state with explanation state.

### 23.3 Do not expose inference-role scaffolding as UI grouping
- **UI-013**: Internal inference roles such as PRIMARY, ALTERNATIVE, SUPPORT, REJECT, dependency relationship, or selection disposition are semantic metadata. They MUST NOT automatically become user-facing group headings.
- **UI-014**: Generic headings that merely expose internal classification — including 「設定推測の主軸」 and 「代替データ」 — MUST NOT be generated unless Research/Observation establishes that the heading itself is necessary natural-language guidance for the user’s observation task.
- **UI-015**: Dependency semantics MUST still survive for inference and explanation. Removing an internal-role heading MUST NOT remove dependencyContract, double-counting prevention, or the machine-specific explanation of why an item is primary/alternative.
- **UI-016**: When multiple ordinary inputs belong to the same natural Observation Context and no natural operational subgroup is required, Canonical UI SHOULD place them directly in that section/context rather than wrapping each inference role in a visible subgroup.
- **UI-017**: Canonical UI validation MUST distinguish an operational/natural-language group from an inference-role-only group. A group whose only justification is Selection metadata is invalid for user-facing rendering.

### 23.4 「この機種の設定推測について」 is a required rendered summary surface
- **SUMUI-001**: Canonical UI MUST include a user-facing section titled 「この機種の設定推測について」 (or an explicitly product-approved equivalent) when Machine Research Summary exists.
- **SUMUI-002**: Opening this section MUST render the Machine Research Summary content; an empty shell or description-only section is a blocking preview/runtime error.
- **SUMUI-003**: At minimum the rendered summary MUST expose: adopted setting-inference elements and their concrete adoption reasons; rejected elements and their concrete rejection reasons; unresolved elements when present and why unresolved; relevant dependency/double-counting rationale; and HighLowDiscrimination for 1500G / 3000G / 7000G when resolved.
- **SUMUI-004**: The summary MUST use machine-specific user-facing reasons preserved from Research/Selection/Summary. Generic text such as 「推測計算に採用しています」 is insufficient.
- **SUMUI-005**: HighLowDiscrimination is displayed as setting-discrimination reference information and MUST remain separate from runtime 「判定信頼度」.
- **SUMUI-006**: Internal tokens, IDs, dispositions, scores, or dependency enum names MUST NOT be shown as the primary user-facing explanation. Rendered copy must be natural Japanese.
- **SUMUI-007**: Runtime materialization and the App renderer MUST preserve/render the summary payload generically. A renderer that ignores canonical content / summary data fails UI-P even if ordinary input sections render correctly.

### 23.5 Faithful-preview interaction proof
- **PREVIEW-009**: UI-P review MUST use the actual generic App renderer and product CSS/layout path. Image-generation mockups may aid design discussion but cannot satisfy UI-P.
- **PREVIEW-010**: The faithful preview MUST visibly or mechanically verify: title/header section toggling; single-open behavior; explanation control remaining independently available inside an opened section; ordinary counter/denominator rendering; Evidence repeated accumulation; UNOBSERVED versus OBSERVED_ZERO; and complete Research Summary rendering.
- **PREVIEW-011**: The preview MUST NOT be accepted while visible implementation artifacts (for example escaped control characters such as literal backslash-n) remain.
- **PREVIEW-012**: A preview failure caused by one of these generic rules MUST be corrected in Manifest/generic generation/rendering and then regenerated. Machine-specific visual compensation is prohibited.

### 23.6 Mandatory construction assertions before Canonical UI is accepted
The Canonical UI builder/validator MUST fail closed when any of the following is true:
- **ASSERT-UI-001**: a visible group is justified only by inference-role metadata rather than a natural observation/operation context;
- **ASSERT-UI-002**: a collapsible section requires a generic 「編集」 action instead of title/header expansion;
- **ASSERT-UI-003**: section explanation behavior cannot be represented independently from section expansion;
- **ASSERT-UI-004**: a Machine Research Summary exists but the 「この機種の設定推測について」 section cannot render adopted/rejected/unresolved reasons and HighLowDiscrimination;
- **ASSERT-UI-005**: renderer/materializer drops canonical summary content;
- **ASSERT-UI-006**: a preview cannot demonstrate the interaction semantics required by PREVIEW-010.

### 23.7 Anti-omission restart instruction
After any amendment to this section, a reference-machine rerun MUST NOT copy the prior Canonical UI as its design authority. The fresh run uses Research facts and this Manifest to reconstruct downstream artifacts. Prior artifacts are comparison evidence only. If the amendment affects presentation semantics but not public machine facts, Research may be re-executed as a reproducibility exercise without treating prior Research output as authority; quantitative/source facts may converge to the same values when independently recovered.
