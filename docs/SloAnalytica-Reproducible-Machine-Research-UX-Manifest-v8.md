# SloAnalytica Reproducible Machine Research & UX Construction Manifest v8.4

Status: DRAFT — v8.4 Exposure Reconstruction reference-machine validation required  
Date: 2026-09-23  
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
RES-005: Unknown Research facts MUST remain unknown. No fabricated probabilities, factual exposure counts, factual trial counts, denominators or setting mappings. Explicit benchmark-only exposure estimates permitted by EXP-009..EXP-016 are derived Selection artifacts, not replacements for unknown Research facts.
RES-006: Research completeness and inference usefulness are separate dimensions.

## 4. Data Completeness

COMP-001: Every researched candidate receives a completeness state.
COMP-002: Published-but-incomplete information remains traceable even if unusable for inference.
COMP-003: Final user-facing research summary MUST distinguish researched/adopted/rejected/unresolved rather than treating Selection as the researched universe.
COMP-004: REJECT means “researched/evaluated but not used in inference”; it MUST NOT mean “delete knowledge that it exists.”

## 5. Denominator / Trial Universe

DEN-001: Every Numeric candidate MUST define numerator, denominator/trial universe, unit, scope and applicable state.
DEN-002: When relevant, define exclusion states, reset boundary, shared denominator, conditional denominator and observation interval.
DEN-002A: Denominator semantics MUST be preserved exactly from the public source. Context such as “during AT”, “during CZ”, or “after event X” identifies an applicable state but MUST NOT by itself be reinterpreted as the denominator of a published “1/N”, percentage, or effective occurrence rate. A denominator may be relabeled only when the source explicitly defines it, when the Trial Universe Resolver in DEN-002B..DEN-002F establishes it from source-defined event mechanics, or when a reproducible mathematical derivation from source-defined denominators proves equivalence. Otherwise denominator semantics remain SOURCE_UNRESOLVED and any score requiring the relabeling is BLOCKED_UNRESOLVED.
DEN-002B: For every published Numeric rate, the pipeline MUST resolve the event's trial universe from the event mechanics before assigning an exposure counter. The resolver order is: observed event -> states in which that event is eligible to occur or be drawn -> trial universe -> player-countable denominator -> benchmark-exposure path. The lexical form “1/N” alone MUST NOT determine the trial universe.
DEN-002C: Canonical game-based trial universes include TOTAL_GAME_TRIAL when the event remains eligible across normal and bonus/AT/ART play, NORMAL_GAME_TRIAL when eligibility is restricted to normal play, and state-scoped game trials such as AT_GAME_TRIAL when eligibility is restricted to a source-defined state. Machines MAY require additional explicitly named universes when their mechanics cannot be represented by these classes. A machine MAY use different trial universes for different candidates.
DEN-002D: A published machine-level “initial-hit”, “occurrence”, or similar 1/N MAY be mapped to a game-based trial universe without a source sentence that literally names the denominator only when public mechanics establish the complete eligibility boundary: the event is eligible on each game in that universe, is not eligible outside it, and no narrower source-defined triggering event is the actual trial. If those conditions are not established, the denominator remains SOURCE_UNRESOLVED. Conventional terminology or table placement alone is insufficient.
DEN-002E: Event-conditioned values such as success rate, distribution, role-triggered hit rate, post-event probability, state-transition probability, or “when X occurs” percentage MUST retain the conditioning event/state as their trial universe. They MUST NOT be converted to TOTAL_GAME_TRIAL or NORMAL_GAME_TRIAL merely because an upstream event has a known game rate. Such conversion is permitted only as an explicit benchmark-exposure derivation under the Exposure rules and does not change the live likelihood denominator.
DEN-002F: When a source distinguishes multiple observables for the same underlying mechanism, such as internal winning probability versus displayed/realized bonus occurrence, each observable MUST retain its own numerator and trial-universe semantics. The pipeline MUST NOT merge them merely because both are expressed as 1/N or can ultimately be related to game exposure.
DEN-003: Different trial universes MUST NOT be merged for UI convenience.
DEN-004: Multiple features sharing the same real observation interval and denominator SHOULD use one shared denominator input when semantically valid. The user MUST NOT be asked to enter the same denominator repeatedly.
DEN-005: User-facing denominator labels MUST use natural, countable language corresponding to what the player can actually observe.
DEN-006: Builder MUST NOT manufacture generic denominator inputs such as “対応通常ゲーム” when Canonical UI has not explicitly contracted the denominator presentation.
DEN-007: Empty/unentered = unobserved. Numeric zero = observed and zero occurrences. This distinction MUST survive input, storage, inference and results.

## 6. Exposure

EXP-001: Exposure MUST represent realistic opportunities during play, not fabricated 7000G trials.
EXP-002: UNKNOWN factual exposure MUST NOT be presented as an observed or published trial count. For Selection benchmarking only, an explicitly qualified approximate exposure MAY be constructed under EXP-009..EXP-014; such an estimate is not Research fact and MUST NOT enter ProbabilityEngine likelihoods.
EXP-003: Exposure assumptions MUST be traceable to Research/Observation.
EXP-004: Input burden alone is not a Selection criterion.

EXP-005: Benchmark exposure and live-observation exposure are separate contracts. Failure to derive a candidate's eligible trial count from 1500G/3000G/7000G MUST NOT by itself make the candidate invalid for live numeric inference.

EXP-006: A conditional Trial Universe MAY be used for live numeric inference when the player can directly and reproducibly observe the exact eligible denominator/opportunity count without estimation, and Research provides a complete setting-specific likelihood for the observed outcome(s). The directly observed denominator is authoritative for that live observation.

EXP-007: For EXHAUSTIVE categorical observations, the sum of mutually exclusive category counts MAY constitute the directly observed trial count when Research establishes that every eligible opportunity produces exactly one recorded category. No game-count-derived exposure is required for live inference in that case.

EXP-007A: When the statistical Trial Universe is valid but is not identical to a single raw player counter, the pipeline MUST attempt Exposure Reconstruction before declaring the live denominator unobservable. Reconstruction MUST preserve the exact eligibility boundary established by Denominator / Trial Universe Research.

EXP-007B: Live Exposure Reconstruction classes are:
- DIRECT: the eligible denominator itself is directly and exactly countable.
- DERIVED_EXACT: the eligible denominator is deterministically calculable from exact observed/source-defined counters without estimating an unobserved quantity.
- DIRECT_SUBTRACTION: an exact broader counter minus one or more exact directly countable ineligible intervals.
- DERIVED_SUBTRACTION: an exact broader counter minus one or more exact deterministically derivable ineligible intervals.
- HYBRID_EXACT: an exact algebraic reconstruction combining direct counters and deterministically derived counters/intervals.
- APPROXIMATED: at least one live component is estimated rather than exactly observed/derived.
- UNRESOLVED: no reproducible reconstruction is available.

EXP-007C: DIRECT, DERIVED_EXACT, DIRECT_SUBTRACTION, DERIVED_SUBTRACTION and HYBRID_EXACT MAY enter ProbabilityEngine as authoritative live exposure only when every term is exact, non-overlapping as required by the expression, shares the same observation/reset boundary, and the final expression is reproducible. APPROXIMATED live exposure MUST NOT enter ProbabilityEngine unless a future Manifest rule explicitly defines an inference model that propagates denominator uncertainty. Benchmark-only approximation rules do not authorize approximate live likelihood denominators.

EXP-007D: A reconstructed denominator MUST store its algebraic expression and provenance for every term. Canonical form SHOULD be explicit, e.g. eligibleTrials = broaderTrials - excludedIntervalA - excludedIntervalB. The pipeline MUST test for overlap, omission, double subtraction, reset mismatch and session-boundary leakage.

EXP-007E: A machine-specific state with variable duration is NOT by itself an observability blocker. If entry and exit are player-visible and each in-state game can be directly counted, its duration is DIRECT even when not predictable in advance. Fixed-duration states MAY be DERIVED_EXACT when Research proves the duration and occurrence count/reset boundary.

EXP-007F: Conditional manual counters are permitted when they are necessary to reconstruct an exact live denominator. Observation/UI MUST request only the irreducible directly observed term(s), derive all deterministic terms automatically, and explain in natural player language what to count. If an optional required term is omitted, only dependent likelihood features MUST be disabled; unrelated features remain active.

EXP-007G: If an ineligible interval is caused by an internally held event, the exclusion begins and ends at the source-proven eligibility boundaries, not merely at a later display/consumption event. Delayed realization MUST NOT be counted as fresh eligible exposure while the underlying lottery is disabled.

EXP-007H: Exposure Reconstruction changes only the mapping from play observations to the already-resolved Trial Universe. It MUST NOT change the candidate's likelihood, invent setting differences, convert a conditional probability into a game probability, or repair incomplete Research.

EXP-007I: Before using a reconstructed denominator for a candidate family, the executor MUST rerun Dependency analysis against the reconstruction terms. A counter used to reconstruct exposure MUST NOT also be added as independent setting evidence when doing so would count the same mechanism twice.

EXP-008: Difficulty/HighLow benchmark participation is independent from live inference eligibility. Before declaring benchmark exposure unresolved, the pipeline MUST attempt the deterministic benchmark-exposure hierarchy in EXP-009. If no permitted benchmark exposure can be constructed, HighLow/Difficulty for that feature/group MUST be marked excluded, unresolved, or otherwise non-participating while preserving a valid live-inference contract.

EXP-009: Benchmark exposure exists to estimate practical information opportunity at 1500G/3000G/7000G for Selection/HighLow, not to assert an exact future play count. The resolver MUST use the first applicable class in this priority order: DIRECT_PUBLISHED, DERIVED_EXACT, DERIVED_APPROXIMATED, DERIVED_BOUNDED, UNRESOLVED.

EXP-010: DIRECT_PUBLISHED uses a public opportunity rate/count whose Trial Universe matches the candidate. DERIVED_EXACT multiplies/divides only complete public rates whose scopes and conditioning form a reproducible path from benchmark games to the candidate Trial Universe. Both are benchmark-authoritative and MUST retain source lineage.

EXP-011: DERIVED_APPROXIMATED MAY be used when the candidate's live likelihood is complete but one or more upstream rates needed only to estimate benchmark opportunity frequency are incomplete across settings. A published rate for a subset of settings MAY be used as a common exposure assumption for the missing settings. The assumption MUST be applied uniformly rather than inventing a setting trend, and its source setting(s), value, transformation and affected path MUST be recorded.

EXP-012: Values introduced solely by DERIVED_APPROXIMATED are exposure-only assumptions. They MUST NOT fill missing setting-specific likelihoods, complete an incomplete outcome distribution, alter Research facts, or enter ProbabilityEngine probabilities. Approximation of likelihood is prohibited even when approximation of benchmark opportunity frequency is permitted.

EXP-013: When several public values are valid candidates for a common exposure assumption, the resolver MUST use a deterministic rule declared by the implementation contract (for example an explicitly defined arithmetic mean of the available public setting values) and preserve the contributing values. The executor MUST NOT choose a convenient value by judgment. If scopes conflict or no deterministic rule is applicable, use DERIVED_BOUNDED or UNRESOLVED.

EXP-014: DERIVED_BOUNDED records a reproducible exposure interval when public information supports bounds but not a single deterministic estimate. It MAY produce a SelectionScore range/sensitivity result but MUST NOT silently collapse that range to a single factual exposure. UNRESOLVED is required when even a defensible approximate or bounded opportunity model cannot be constructed.

EXP-014A: A bounded exposure MUST distinguish DERIVED_LOWER_BOUNDED, DERIVED_UPPER_BOUNDED, and DERIVED_INTERVAL_BOUNDED. A lower bound MAY be derived from a publicly established containment/implication relation between observable events. If every occurrence of public event P necessarily creates at least one eligible observation opportunity O, then the benchmark resolver MAY assert ExpectedTrials(O) >= ExpectedCount(P). It MUST NOT assert equality unless Research proves equality.

EXP-014B: Guaranteed Minimum Exposure is the lower bound L produced by DERIVED_LOWER_BOUNDED. Its derivation MUST preserve: (a) the source-supported implication/containment relation, (b) exclusions that can invalidate the implication, (c) the public rate/count used for P, (d) benchmark games, and (e) the expression yielding L. Additional opportunities not quantified by public information MUST contribute zero to L; they MUST NOT be guessed.

EXP-014C: When the observation model's mutual information is monotone non-decreasing in the number of independent eligible trials under the same complete setting-specific likelihood, the pipeline MAY compute GuaranteedMinimumIG and GuaranteedMinimumSelectionScore from L. These are conservative lower-bound metrics, not point estimates of actual benchmark information. If monotonicity is not established for the implemented model, the guaranteed score MUST remain unresolved even when an exposure lower bound exists.

EXP-014D: GuaranteedMinimumSelectionScore = IG(L*) × 200. A candidate MAY satisfy a Selection threshold from this metric only when the lower-bound score itself meets that threshold. Crossing a threshold only at an unknown/favorable exposure above L* is insufficient. The technical artifact MUST label the metric as a guaranteed minimum and MUST NOT serialize it as an ordinary point-estimate SelectionScore.

EXP-014D1: Guaranteed-minimum benchmark construction MUST be deterministic. Let L_s be the source-supported expected lower-bound eligible-trial count at the benchmark for each declared setting s. Define the common guaranteed benchmark exposure as L* = min_s(L_s). The scoring model MUST use this same setting-independent L* for every setting so that setting differences in the upstream lower-bound event rate are not silently counted as additional evidence about the downstream observation.

EXP-014D2: Fractional L* MUST NOT be rounded, floored, or ceiled by machine-specific judgment. For an independent repeated Bernoulli/categorical/multinomial eligible-trial model, GuaranteedMinimumIG is the linear interpolation between the exact fixed-trial observation models at n=floor(L*) and n+1=ceil(L*): IG(L*)=(1-r)IG(n)+r IG(n+1), where r=L*-n. If L* is an integer, use the exact n-trial model. This interpolation is benchmark-only and MUST NOT be represented as a factual fractional runtime trial.

EXP-014D3: The rule in EXP-014D2 is a conservative deterministic benchmark convention, not a claim that a fractional number of trials occurs. A different observation family MAY use another fractional-exposure construction only when that construction is defined generically in the Manifest before machine execution. Otherwise the guaranteed score for that family remains BLOCKED_UNRESOLVED.

EXP-014E: DERIVED_LOWER_BOUNDED and its guaranteed-minimum score MUST NOT enter ProbabilityEngine as fabricated live exposure. Runtime inference continues to use only the player's actually observed eligible denominator/opportunities. A lower bound MUST NOT fill missing likelihoods, outcome probabilities, or setting mappings.

EXP-014F: Before classifying benchmark exposure UNRESOLVED, the resolver MUST test, in order, whether a DIRECT_PUBLISHED, DERIVED_EXACT, DERIVED_APPROXIMATED, or defensible bounded relation exists. In particular, if a broader observation opportunity necessarily contains a publicly quantified event class, failure to quantify the additional opportunities is not by itself sufficient for UNRESOLVED; preserve the supported lower bound.

EXP-015: Every benchmarked candidate MUST preserve exposureClass, benchmarkGames, expectedTrials (or bounds), derivation expression, source lineage, assumptions, and an exposureQuality flag. Approximate exposure MUST remain auditable downstream even when SelectionScore is a single number.

EXP-016: Benchmark exposure assumptions are allowed because SelectionScore is a practical ranking/screening measure. They MUST NOT be rendered to users as expected actual counts unless clearly identified as estimates. Real runtime inference always uses the player's directly observed eligible trials under Observation.

## 7. Dependency

DEP-001: Candidate relationships MUST be classified before Selection.
DEP-002: The contract MUST distinguish at least independent, primary, alternative/suppressed, conditional, derived and mutually-exclusive relationships when applicable.
DEP-003: Dependent observations MUST NOT be naively multiplied as independent likelihoods.
DEP-004: A selected alternative MUST retain the identity of the primary information that suppresses/replaces it.
DEP-005: If dependency affects what the player should input or how results should be interpreted, that relationship MUST propagate to Machine Research Summary and Canonical UI in user-facing language.
DEP-006: The UI MUST NOT present PRIMARY and ALTERNATIVE as two equal independent pieces of evidence when inference does not treat them that way.

## 8. Selection

SEL-001: SelectionScore = IG7000 × 200. Ordinary point-estimate IG7000 MAY use benchmark exposure classified DIRECT_PUBLISHED, DERIVED_EXACT, or DERIVED_APPROXIMATED under EXP-009..EXP-016. DERIVED_LOWER_BOUNDED MAY instead produce GuaranteedMinimumIG7000 / GuaranteedMinimumSelectionScore under EXP-014A..EXP-014F. These lower-bound metrics MAY prove that a threshold is met, but MUST NOT be relabeled as an ordinary point-estimate SelectionScore. All quantitative outputs MUST preserve their exposure class/quality; an approximate or bounded exposure does not become a Research fact.
SEL-002: For candidates with a resolved benchmark SelectionScore, CORE >= 20; SUPPORT >= 10; JOINT_ELIGIBLE >= 5; below 5 = REJECT, subject to dependency/validity requirements. A legitimate LIVE_CONDITIONAL path under SEL-008A is classified separately and MUST NOT be forced into these benchmark-score classes.
SEL-003: For candidates whose 7000G benchmark exposure is resolved or deterministically approximated under EXP-009..EXP-016, standalone Numeric feature requires IG7000 >= 0.05 bit. Joint participation requires >= 0.025 bit and the joint feature must reach >= 0.05 bit. A GuaranteedMinimumIG7000 from DERIVED_LOWER_BOUNDED MAY prove the same threshold conservatively when its lower-bound value itself reaches the threshold. These benchmark thresholds MUST NOT be applied as though resolved to a candidate whose benchmark exposure is legitimately BLOCKED_UNRESOLVED under EXP-008.
SEL-004: Selection MUST occur only after completeness, denominator, exposure and dependency are sufficiently resolved.
SEL-005: For every candidate preserve disposition, relevant trial/exposure basis, dependency and a concrete reason. Preserve IG, SelectionScore and benchmark class when computable; otherwise preserve their explicit BLOCKED_UNRESOLVED status and reason. Missing benchmark metrics MUST NOT be silently replaced by zero.

SEL-006: Selection MUST NOT reject a candidate solely because its conditional trial count cannot be derived from benchmark game count. Before rejection, Selection MUST test whether Observation can directly capture the exact conditional denominator/opportunity count and whether Research supplies a complete setting-specific likelihood over that Trial Universe.

SEL-007: When direct conditional observation satisfies EXP-006/EXP-007, Selection SHALL evaluate the candidate for live inference using the observed-trial likelihood. Selection MUST first attempt the permitted benchmark-exposure hierarchy in EXP-009. If benchmark IG7000/SelectionScore still cannot be computed, that score is BLOCKED_UNRESOLVED for benchmark scoring only; the candidate's live-inference disposition MUST be decided from statistical validity, dependency/double-counting, observation reproducibility, and available setting-specific likelihood rather than from the missing benchmark exposure alone.

SEL-008: CONDITIONAL_OBSERVATION is an Observation classification, not a Selection disposition. No rule may infer EXCLUDE, DISPLAY_ONLY, INCLUDE_SUPPORT, or INCLUDE_PRIMARY from CONDITIONAL_OBSERVATION alone.

SEL-008A: When benchmark exposure is legitimately BLOCKED_UNRESOLVED but EXP-006/EXP-007 is satisfied, Selection MAY authorize a separate LIVE_CONDITIONAL inference path only if all of the following are proven: (a) the exact eligible denominator is directly and reproducibly observable, (b) the outcome model is complete for every declared setting, (c) at least two declared settings have different likelihoods so the observation carries non-zero setting information, (d) dependency/double-counting is resolved, and (e) Observation can prevent guessed or ineligible opportunities from entering the likelihood. Failure of any item is REJECT or UNRESOLVED according to the actual deficiency.

SEL-008B: LIVE_CONDITIONAL is not a substitute benchmark score or a waiver of statistical validity. It authorizes ProbabilityEngine use only for the exact observed trials supplied at runtime. A LIVE_CONDITIONAL candidate MAY also have a benchmark SelectionScore when EXP-009..EXP-016 yield a permitted benchmark exposure. If no permitted exposure is available, preserve benchmarkScoreStatus=BLOCKED_UNRESOLVED and the separate liveInference authorization. A score derived from unrecorded/ad-hoc exposure remains prohibited.

SEL-008C: For LIVE_CONDITIONAL, Selection MUST always record deterministic per-observed-trial information under the same equal-setting prior used by SELDEP-001 as `IGPerEligibleTrial` in bits. A zero-information observation is REJECT. When a permitted benchmark exposure exists, practical usefulness is evaluated by combining that per-trial information with the benchmark opportunity model; when it does not, `IGPerEligibleTrial` remains quantitative diagnostic metadata and MUST NOT be converted to SelectionScore, multiplied by an assumed opportunity count, or alone justify CORE/PRIMARY or an importance tier.
SEL-009: “推測計算に採用しています” is not an acceptable adoption reason. A reason MUST explain why the information is useful, including quantitative basis where available.
SEL-010: Rejection reasons MUST distinguish causes such as weak information, insufficient practical exposure, unavailable observation, incomplete public distribution, dependency/double counting, invalid denominator or unresolved semantics.
SEL-011: User-facing explanations MUST not expose internal tokens such as INCLUDE_PRIMARY, Gate names or schema IDs.
SEL-012: Detailed technical metrics may remain in research artifacts, but the user-facing reason must preserve the actual rationale rather than replacing it with a generic sentence.

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
LINK-004: Linked-play availability is determined from the manufacturer's official linked-play/service machine support information. If the machine is explicitly listed, status = AVAILABLE. If the official support information explicitly identifies the applicable machine universe/list and the machine is absent from that complete applicable list, status = NOT_AVAILABLE. Mere failure to find a machine name, a generic service page, or an incomplete/unknown support list is insufficient for NOT_AVAILABLE and remains UNRESOLVED. Do not expand the search to unrelated secondary sources merely to overturn a conclusive official support result.
LINK-005: Use UNRESOLVED only when the official support information itself cannot be confirmed or is genuinely ambiguous. Only when status = AVAILABLE, map which selected Numeric Features/Evidence can be obtained from the linked service.
PRE-001: Predecessor/seated observations are researched only where relevant and MUST not be fabricated from missing historical UX.
PRE-002: Predecessor data may participate in live inference when statistically valid but MUST NOT automatically be treated as the standard HighLow benchmark play interval.

### 10.1 V8 provenance and linked-play persistence

PROV-001: A machine reconstructed from zero through this Manifest MUST carry machine-readable provenance identifying the governing Manifest version and generation path.
PROV-002: `generationPath = V8_RESEARCH_PIPELINE` is permitted only when the machine was reconstructed from Research under Manifest v8; converting or adapting Legacy MachineData into a V8-shaped artifact MUST NOT receive this provenance.
PROV-003: At minimum preserve `manifestVersion`, `generationPath`, and `researchOrigin` through Machine Research Summary → Canonical UI → MachinePackage → Distribution. Translation/materialization MUST NOT drop or rewrite them.
PROV-004: For zero-base public reconstruction under this Manifest, `researchOrigin = ZERO_BASE_PUBLIC_RESEARCH`. If a future permitted origin is introduced it MUST be explicitly defined by the governing Manifest rather than inferred downstream.
PROV-005: Validation MUST BLOCK a package claiming `V8_RESEARCH_PIPELINE` when the required V8 upstream artifacts/provenance chain are absent, and MUST BLOCK a valid V8 upstream path when provenance is lost before MachinePackage/Distribution.

LINK-006: Linked-play research is a mandatory post-Selection stage for every machine. Its machine-level status MUST be one of AVAILABLE, NOT_AVAILABLE, or UNRESOLVED according to LINK-004/LINK-005; absence of research is not equivalent to NOT_AVAILABLE.
LINK-007: The linked-play result MUST persist through Machine Research Summary → Canonical UI → MachinePackage → Distribution as machine-readable status. When AVAILABLE, preserve the official service name and mappings from adopted observations to obtainable linked-play data when publicly verifiable.
LINK-008: Linked-play capability/status is provenance of observation acquisition, not a Selection criterion and not proof that the app itself performs automatic import. Any future automatic-import capability MUST be represented separately from service availability.

## 11. Observation

OBS-001: Every adopted Numeric Feature/Evidence MUST have an Observation Context or an explicit valid derived/no-input route.
OBS-002: Observation defines where, when and how the player obtains the value, including primary/fallback source where applicable.
OBS-003: Observation defines numerator/denominator acquisition together when both are needed.
OBS-004: Observation Action such as “PUSHで確認” is first-class data and MUST propagate to user-facing UI when useful.
OBS-005: Observation MUST determine natural section co-location; Canonical UI may not reconstruct it from feature type.
OBS-006: Unobserved and observed-zero semantics are explicit and testable.
OBS-007: Selection disposition and Observation disposition are independent. A researched Numeric candidate rejected from inference MAY remain observable when the player can record its exact conditional trial universe without guessing.
OBS-008: Such a candidate MUST be marked as CONDITIONAL_OBSERVATION and MUST remain computationally excluded unless Selection is explicitly re-run and adopts it. Observation or UI availability MUST NOT promote a rejected feature into inference.

OBS-009: CONDITIONAL_OBSERVATION MAY belong to an adopted Numeric Feature. Its Observation contract MUST define the eligible Trial Universe, exact denominator acquisition, outcome acquisition, exclusions, and state semantics sufficiently to prevent guessed opportunities from entering inference.

OBS-010: For an adopted conditional feature, Canonical UI/runtime recording and ProbabilityEngine binding MUST remain distinct responsibilities: the UI records the exact observations defined by Observation, while inference participation is authorized only by Selection. Conditional status itself MUST NOT suppress an adopted feature, and UI recordability itself MUST NOT promote a rejected feature.
OBS-011: CONDITIONAL_OBSERVATION MUST define the observable opportunity/denominator, outcome input(s), applicable/excluded states, and user-facing counting instruction. If the conditional opportunity itself cannot be identified reliably in play, the observation remains UNRESOLVED and MUST NOT be materialized as an input.
OBS-012: Canonical UI SHOULD render conditional observations with generic denominator/opportunity plus outcome controls. Machine-specific renderer branches are prohibited when the interaction can be expressed by the common conditional-observation contract.

## 12. HighLowDiscrimination

HLD-001: Evaluate LOW=settings 1–2 vs HIGH=settings 5–6 at 1500/3000/7000G. Settings 3–4 are excluded only from this benchmark, not from the inference engine.
HLD-002: Record the defined discrimination metric(s), including Balanced Accuracy when used by the adopted pipeline, assumptions and usable features.
HLD-003: HighLowDiscrimination is not merely an internal report. Machine Research Summary and MachinePackage MUST expose enough structured information for the app to show the player the machine’s discrimination quality by play length.
HLD-004: The legacy “判定信頼度” of a particular inference result MUST NOT be presented as a substitute for HighLowDiscrimination.

HLD-005: A feature may be valid for live inference yet non-participating in 1500G/3000G/7000G HighLow simulation when no permitted benchmark opportunity model can be constructed. HighLow SHALL accept DIRECT_PUBLISHED and DERIVED_EXACT exposure and MAY use DERIVED_APPROXIMATED exposure when the simulation records that quality/assumption explicitly. It MUST NOT invent unrecorded opportunity rates, and lack of benchmark exposure MUST NOT retroactively invalidate Selection when SEL-006/SEL-007 are satisfied.
HLD-006: If a benchmark cannot be computed honestly, display/record unresolved or insufficient data rather than fabricate precision.

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
- benchmark scoring status and live-inference authorization are independently explicit for every conditional Numeric candidate
- no CONDITIONAL_OBSERVATION classification is used as a Selection disposition
- LIVE_CONDITIONAL, when used, satisfies SEL-008A/SEL-008B/SEL-008C; any benchmark exposure is classified and reproducible under EXP-009..EXP-016, with no unrecorded/ad-hoc opportunity assumption
- every candidate has disposition, quantitative basis and concrete reason
- dependency/double-counting rules resolved

Gate O — Observation Complete:
- every adopted item has feasible observation/derived route
- numerator/denominator acquisition and Evidence Context/Action resolved

Gate H — HighLow Complete:
- every live-inference feature lacking realistic benchmark exposure is explicitly non-participating/unresolved for HighLow rather than assigned a fabricated opportunity rate
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

## 20A. User-Verified UX contracts during zero-base reconstruction

UVX-001: A prior User-Verified UI Lock is empirical real-device UX evidence, not a Research/Selection/Observation semantic oracle. Zero-base Research MUST NOT read it to decide machine facts, probabilities, feature adoption, dependency, or Evidence meaning.
UVX-002: After an independent Canonical UI has been materialized, Runtime Contract Verification MUST compare it with any existing User-Verified UI Lock before that lock is replaced or declared obsolete.
UVX-003: A mismatch with a User-Verified UI Lock is a real-device re-verification requirement, not permission to copy the legacy layout into the new Canonical UI. The zero-base Canonical UI remains authoritative when it is reproducible from current upstream contracts.
UVX-004: CI MUST distinguish a pending re-verification mismatch from semantic corruption. A historical lock MAY remain as the previous verified baseline while the new Canonical UI is marked pending real-device verification; it MUST NOT silently block or rewrite the new canonical contract.
UVX-005: Only a successful real-device verification may supersede the prior lock. The replacement lock MUST be regenerated from the verified current Canonical UI/package and record its verification date/version/provenance.
UVX-006: If real-device verification rejects the new UI, return to the earliest affected Manifest/Canonical rule per PREVIEW-005/006; do not restore legacy machine semantics as an oracle.

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
- 「この機種の設定推測について」 uses fixed order: 高低判別精度 → 採用 → 不採用 → 未解決
- user-facing SelectionScore label is fixed as 「設定判別スコア」 and score-caused decisions explicitly show it
- every adopted element has canonical importance label 「必須／重要／補助／微小」 with deterministic Manifest mapping
- internal inference roles are not exposed as generic UI headings
- section title/header is the expand/collapse control; no generic 「編集」 opener
- section expansion and in-section 「説明」 expansion remain independent
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
- faithful preview interaction proof (header toggle, single-open, independent explanation, repeated accumulation, unobserved/zero, complete summary)
- no visible escaped/control-character artifacts in preview
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


### 23.8 Setting-inference summary ordering, score label, and importance

- **SUMUI-008**: The fixed display order inside 「この機種の設定推測について」 is: (1) 高低判別精度, (2) 採用した設定推測要素, (3) 採用しなかった要素, (4) 未解決の要素. A block with no applicable entries MAY be omitted, but the remaining blocks MUST preserve this relative order.
- **SUMUI-009**: The user-facing name of internal SelectionScore is fixed as 「設定判別スコア」. User-facing machine-summary UI MUST NOT expose “SelectionScore” or substitute another label.
- **SUMUI-010**: When an adoption or rejection reason is caused wholly or partly by the setting-discrimination score / quantitative Selection threshold, the user-facing reason MUST explicitly state that fact and MUST show the applicable 「設定判別スコア」 value. A generic adoption/rejection sentence without the score is insufficient in that case.
- **SUMUI-011**: When adoption/rejection is determined for another reason (for example dependency/double-counting, unusable denominator, insufficient public data, unresolved exposure, or runtime inapplicability), the UI MUST state that concrete reason and MUST NOT falsely attribute the decision to the score.
- **SUMUI-012**: Every adopted setting-inference element MUST additionally carry a user-facing qualitative importance label in natural Japanese. The canonical label vocabulary is fixed as: 「必須」「重要」「補助」「微小」. Runtime renderers MUST display the canonical label and MUST NOT derive or rename it independently.
- **SUMUI-013**: Importance is distinct from adoption disposition and from setting-discrimination score. The construction stage MUST assign it by a Manifest-defined deterministic mapping from quantitative usefulness/role; machine-specific freehand importance labeling is prohibited.
- **SUMUI-014**: Until a deterministic boundary mapping for 「最重要」「重要」「補助」「微小」 is explicitly defined in this Manifest, Canonical UI generation MUST BLOCK rather than guess an importance label. The reference-machine rerun MUST therefore resolve this mapping before Canonical UI is accepted.
- **SUMUI-015**: The explanation of what 「設定判別スコア」 means, its formula, and general threshold education are NOT part of the per-machine 「この機種の設定推測について」 surface at this stage. That explanatory content is reserved for a separate app-level settings/help surface. Per-machine UI may show the label/value where required by SUMUI-010 without explaining the metric itself.


## 24. 実機入力の操作性 — 母数入力・未観測表示・ラベル重複

### INPUTUX-001 — 母数・ゲーム数は直接数値入力を基本とする
通常時ゲーム数、総ゲーム数、対応ゲーム数など、実戦で数百〜数千単位になり得る母数入力を +1 / -1 のみで操作させてはならない。Canonical UI はこの種の入力を数値直接入力可能として表現し、Renderer はキーボード等による直接入力を提供する。

### INPUTUX-002 — 補助加算は直接入力を置き換えない
母数・ゲーム数には +50 等の QuickAdd を補助として提供してよいが、直接数値入力を失ってはならない。Quick Input 全体機能の停止とは別に、個別数値入力の補助操作として扱う。

### INPUTUX-003 — 発生回数カウンターとの操作を分離する
LOVE ZONE、AT初当り、Evidenceカテゴリ等の低〜中頻度の発生回数は +/- カウンターを使用できる。母数入力と発生回数入力を同一操作方式へ機械的に統一してはならない。

### INPUTUX-004 — 未観測と観測ゼロは意味を保ちつつ簡潔に表示する
内部値では null/unentered = UNOBSERVED、0 = OBSERVED_ZERO を厳密に維持する。未観測の主表示は原則「—」等の簡潔な表示とし、各カードで「未入力」を強調表示し続けない。

### INPUTUX-005 — 未観測へ戻す操作は入力後のみ表示する
「未確認に戻す」等のリセット操作は観測値が存在するときのみ表示する。未観測状態で同じ意味の文言を重複表示してはならない。

### INPUTUX-006 — 同一ラベルの重複を避ける
グループ見出し、入力カード見出し、入力コントロール内で同じ自然言語ラベルを反復してはならない。文脈を失わない範囲で1つの入力対象につき主ラベルは1回を原則とする。グループ説明や母数範囲の説明は独立した説明UIに保持する。

### ASSERT-UI-007 — 実機入力操作性の fail-closed 検証
Preview / Runtime Contract Verification は、(a) 大きな母数が直接入力可能、(b) UNOBSERVED と OBSERVED_ZERO が区別される、(c) 未観測表示が重複しない、(d) 同一入力ラベルが不必要に反復されないことを確認する。違反時は機種固有UIで補正せず、Canonical規則または汎用Rendererを修正する。


## 25. Dependency-safe quantitative selection — deterministic joint and conditional scoring

These rules close a reproducibility gap discovered by the Kaiji zero-base rerun. They are generic rules for every machine. They do not authorize machine-specific probability assumptions.

### 25.1 General information-gain target
- **SELDEP-001**: The target variable for quantitative Selection scoring is the actual setting with an equal prior over the machine's declared settings unless a future Manifest version explicitly changes the prior.
- **SELDEP-002**: For any fully specified observation model at the 7000G benchmark, `IG7000` means mutual information in bits between the setting and the complete observation generated by that model. `SelectionScore = IG7000 × 200`.
- **SELDEP-003**: A score MUST NOT be computed from fabricated exposure, fabricated residual categories, interpolated setting probabilities, or an independence assumption contradicted by Dependency Research. If the joint/conditional likelihood cannot be constructed from public facts plus Manifest-defined exposure rules, quantitative Selection for that candidate/group is `BLOCKED_UNRESOLVED`.

### 25.2 Mutually exclusive outcomes sharing one trial universe
- **SELDEP-004**: When two or more candidate outcomes are mutually exclusive outcomes of the same trial and share the same denominator, they MUST be evaluated as one categorical/multinomial observation model rather than as independent Bernoulli models.
- **SELDEP-005**: The joint categories are the source-supported mutually exclusive outcomes. If the listed setting-difference outcomes do not exhaust the trial, a residual `OTHER` probability MAY be derived only as `1 - sum(source-supported outcome probabilities)` when the source semantics establish that exactly one outcome occurs per trial and the listed probabilities are unconditional probabilities on that same trial universe. This mathematical residual is an inference category, not a fabricated user-facing observed event; Canonical UI MAY represent it implicitly through the shared denominator.
- **SELDEP-006**: If the source does not establish mutual exclusivity, common denominator, or exhaustive one-outcome-per-trial semantics, a residual category MUST NOT be invented and the joint score remains blocked.
- **SELDEP-007**: The Selection decision is attached to the joint feature/group. Member outcomes MUST NOT each receive a standalone score and then be multiplied as if independent. Machine Research Summary may explain which observed outcomes contribute, but the inference contract preserves one joint likelihood.

### 25.3 Conditional / hierarchical observations
- **SELDEP-008**: For a child event observed only after a parent event, the child is scored jointly with the parent only when the complete hierarchical likelihood is public and the 7000G parent exposure is deterministically available. For each setting, the per-root-trial categorical probabilities are constructed from the public parent probability and public conditional child probabilities (for example: no parent, parent+child, parent+no-child).
- **SELDEP-009**: When the child denominator is itself an observed parent count, runtime inference MUST use the conditional likelihood given that observed denominator and MUST NOT also treat the same parent realization as an independent second copy of evidence.
- **SELDEP-010**: If the parent probability/exposure or any required conditional probability is incomplete for any setting, the child cannot receive a quantitative SelectionScore. It remains researched and is rejected or unresolved for numeric inference according to the actual deficiency; no interpolation is allowed.
- **SELDEP-011**: A conditional child MAY replace or augment a parent only through an explicit `dependencyContract`. If both are retained, `combinationPolicy` MUST specify a single coherent joint/hierarchical likelihood. `DO_NOT_MULTIPLY` is required when such a likelihood is not implemented.

### 25.4 Alternative observations of the same downstream phenomenon
- **SELDEP-012**: When two observable statistics substantially encode the same downstream process and Dependency Research classifies them as ALTERNATIVE, each may be scored for usefulness, but only one is the preferred inference path unless a complete joint likelihood is available.
- **SELDEP-013**: Preferred primary is chosen deterministically by: (1) valid complete likelihood, (2) resolved practical exposure, (3) larger valid IG7000, then (4) simpler/directer observation denominator if still tied. The alternative retains its score for explanation but has `DO_NOT_MULTIPLY`.
- **SELDEP-014**: Dependency suppression overrides a standalone threshold result. A high score does not authorize double counting.

### 25.5 Deterministic user-facing importance
- **SUMUI-014A**: SUMUI-014 is resolved by the following canonical mapping. The valid label vocabulary remains SUMUI-012: 「必須」「重要」「補助」「微小」; the word 「最重要」 in the earlier SUMUI-014 sentence is superseded as a drafting inconsistency.
- **SUMUI-014B**: For an adopted inference element, importance is assigned deterministically from its final dependency-safe quantitative role:
  - 「必須」: preferred primary with `SelectionScore >= 20`;
  - 「重要」: non-suppressed adopted element with `SelectionScore >= 10`, or a preferred primary whose score is 10–<20;
  - 「補助」: non-suppressed adopted/joint-eligible element with `SelectionScore >= 5` and <10;
  - 「微小」: an adopted element below 5 only when a separate Manifest rule explicitly permits retention despite the normal numeric rejection threshold. Otherwise a below-5 numeric candidate is REJECT and receives no adopted importance label.
- **SUMUI-014C**: An ALTERNATIVE/FALLBACK element suppressed by `DO_NOT_MULTIPLY` does not become 「必須」 merely because its standalone score is high. If it is retained as an actual user-observable fallback inference path, its importance is one tier below the importance its score would otherwise produce, with a floor of 「微小」. If it is not an active inference path, it is not an adopted element and receives no importance label.
- **SUMUI-014D**: Evidence constraints are not assigned these numeric importance labels unless a future Manifest rule defines an Evidence-specific quantitative usefulness measure. They remain Evidence, computationally separate from numeric Selection.
- **SUMUI-014E**: An adopted LIVE_CONDITIONAL element follows the ordinary score-derived importance rule when a permitted single-value benchmark exposure (DIRECT_PUBLISHED, DERIVED_EXACT, or DERIVED_APPROXIMATED) yields SelectionScore, while preserving exposure quality in technical provenance. If benchmarkScoreStatus=BLOCKED_UNRESOLVED, it receives the user-facing importance 「補助」 while exposure remains unresolved. A DERIVED_BOUNDED score range that crosses importance thresholds MUST use the lower supported tier or remain explicitly unresolved; it MUST NOT be upgraded from the favorable bound alone.
