# 2026-09-03 Next 10-machine Batch — Selection / Gate B Final

Status: **PASS**
Prerequisite: Gate A PASS (`RESEARCH_GATE_A_FINAL.md`)
Policy: Selection Quality + Dependency / Double-counting Audit complete for the currently researched public evidence set.

## Gate B decision principles

- Prefer one statistically coherent representation of an observation family over multiplying correlated aggregate/component likelihoods.
- A candidate with a large setting ratio is not adopted if one-day exposure or its denominator is not practically observable.
- A frequent candidate with tiny separation may still be rejected if its expected information is negligible.
- Conditional candidates without a countable same-route denominator are not forced into numeric inference; they remain REFERENCE or Evidence.
- Evidence remains separate from numeric likelihood. One physical observation must map to one input surface downstream even if it has both Feature and Evidence meaning.

## Quantitative borderline check — いざ！番長

For the two per-game small roles, a simple Bernoulli KL separation between setting 1 and setting 6 over 7000 games gives an order-of-magnitude comparison:

| candidate | approx KL information over 7000G, S1→S6 | approx KL information over 7000G, S6→S1 | decision |
|---|---:|---:|---|
| weak cherry | 0.038 nats | 0.039 nats | REJECT numeric: negligible standalone separation |
| common bell A | 3.39 nats | 3.68 nats | ADOPT: materially informative if denominator provenance is clean |

This comparison is used only as a Selection-strength check; it does not alter the published probabilities or Observation semantics.

## Final per-machine Selection

### 211 `L_IZA_BANCHO_SB8` — いざ！番長

**ADOPT**
- `AT初当り` — headline initial-hit likelihood, provided Observation uses the exact published normal-game trial universe.
- `直撃BIG` — retain as a distinct direct-hit family only if its event definition is non-overlapping with the adopted AT initial-hit numerator. Observation must preserve the published event definition.
- `共通ベルA` — strong per-game candidate. Daitomo automatic count and manual count are separate acquisition routes; numerator/denominator must come from one proven-equivalent route.

**REJECT numeric**
- `弱チェリー` — frequent but setting separation is too small to add meaningful one-day information; keeping it would increase input/weight without useful discrimination.

**REFERENCE / Evidence**
- mode / prescribed-game / state-transition candidates without complete observable denominators.
- end screens, payout displays, trophy / lower-bound / exact-setting evidence.

Dependency note: direct BIG must not be multiplied with an AT family if the published AT initial-hit numerator already includes that same direct event. Observation mapping must verify the composition before implementation; if inclusion is confirmed, direct BIG is downgraded to REFERENCE rather than double-counted.

### 212 `L_ZETTAI_SHOGEKI_PLATONIC_HEART_TK`

**ADOPT**
- real-bonus rate.
- AT initial hit.

**REFERENCE**
- CZ numeric family and role→high-state / state-dependent draw families: public setting differences exist, but complete same-state trial denominators are not robustly observable from the currently verified routes.

**Evidence**
- Nami trophy and published negation / lower-bound / confirmed-setting presentations.

Dependency result: real bonus and AT are distinct headline event families; no aggregate total is additionally adopted.

### 213 `L_WATASHI_NO_SHIAWASE_NA_KEKKON_PN`

**ADOPT**
- bonus initial hit.
- AT initial hit.

**REFERENCE**
- CZ numeric family.
- bonus-through ceiling distribution: retain for display/research because the eligible-attempt denominator and practical sample count are not sufficiently clean for a default likelihood.

**Evidence**
- わた婚メドレー background / character presentations.
- AT-end Konami-command presentation.
- Aristo trophy.

Observation constraint: eSLOT+ is FOUND, but generic service capability must not be converted into guessed machine-specific counters. Numeric inputs remain manual/menu/service only when exact fields are verified.

### 214 `LB_TRIPLE_CROWN_SF4` — LBトリプルクラウン

**ADOPT**
- BIG count.
- REG count.
- cherry count.
- plum count.

**REJECT numeric as duplicate / unsafe overlap**
- bonus total — deterministic aggregate of BIG+REG in the same game universe.
- role-specific bonus-overlap probabilities — overlap events reuse both the adopted role observation and bonus observation; a naive independent likelihood would double-count. No joint model is introduced in this batch.

**Evidence**
- BIG / REG indication patterns, including REG-end LED confirmed-setting families.

Observation constraints:
- manufacturer-linked service = CHECKED_NONE.
- machine menu = CHECKED_NONE.
- cabinet `ドラマチックスコア` is a seat-visible observation aid only; its history window must not be treated as a denominator unless separately verified.

### 215 `LB_MATADOR_3_TT` — マタドールⅢ

**ADOPT**
- BB count.
- RB count.

**REJECT numeric as duplicate**
- total bonus — deterministic aggregate of BB+RB from the same game universe.

**REFERENCE**
- BT one-coin role — enormous published setting spread, but the trial universe is BT games and practical one-day exposure is highly variable. The denominator is not total games, and reliable BT-game opportunity counting is not established strongly enough for default inference.
- normal-role / overlap candidates not backed by a complete dependency-safe table.

**Evidence**
- adjustment-time Condor lamp.
- bonus-end panel flash.

Observation constraints: linked service and machine menu are both CHECKED_NONE.

### 216 `L_TENSEI_SHITARA_KEN_DESHITA_GT`

**ADOPT**
- AT initial hit as the representative numeric initial-hit family.

**REJECT numeric for dependency safety**
- CZ initial hit.
- bonus initial hit.

Reason: both are upstream/pathway components that can contribute to the downstream AT result; multiplying them with AT as independent evidence risks overconfidence. In the absence of a proven joint model, AT is retained as the representative headline statistic.

**REFERENCE**
- state-qualified weak-chance-role→bonus probabilities and mode / prescribed-game families: conditional denominator not reliably countable in a one-session default workflow.

**Evidence**
- bonus / AT / ending setting-hint and confirmed-setting presentations.

eSLOT+ field names remain Observation debt unless machine-specific fields are verified.

### 217 `L_DARLING_IN_THE_FRANXX_SA`

**ADOPT**
- bonus initial hit.

**REJECT numeric / REFERENCE**
- bonus-high initial hit — state-qualified subset/composition risk relative to total bonus initial hit; no independent multiplication.
- CZ combined — weak/non-monotonic lower-setting separation and composition overlap risk; retained as REFERENCE.
- Connect Chance initial level / level-dependent success / Franxx-high transitions — conditional trial universes require exact denominators and complete tables; REFERENCE.

**Evidence**
- payout displays, bonus-high end screens, Nami trophy, ending evidence.

### 218 `L_SAKI_CHOJO_KESSEN_YR`

**ADOPT**
- AT initial hit as the representative headline likelihood.

**REJECT numeric for dependency safety**
- CZ initial hit — upstream pathway dependence with AT; no naive independent multiplication.

**REFERENCE**
- cycle / rival-mode / state transitions, CZ-through ceiling, 清澄トライアル: exact conditional trial counts are not sufficiently robust for the default inference path.

**Evidence / multinomial hint observation**
- AT-end screen.
- ending 和-lamp categories.
- payout / confirmed-setting presentations.

Observation note: previous AT-end screen recovery via machine menu is an Observation route, not a linked service and not a numeric denominator.

### 219 `S_KONOSUBA_ZR` — パチスロこの素晴らしい世界に祝福を！

**ADOPT**
- AT initial hit.

**REFERENCE**
- emergency-quest opponent distribution.
- quest-rank success.
- bath-zone initial-point distribution / entry.
- bonus 7-alignment.
- hidden-mode transition.

Reason: these have setting differences but use conditional attempts/categories whose denominators and practical one-day sample sizes are not uniformly observable. They remain available for future multinomial/conditional models rather than being discarded.

**Evidence**
- bonus-end screen, AT-end PUSH voice, AT navigation voice, debt-line presentation, payout display, illustration evidence, Sammy trophy.

My Slot remains FOUND; exact machine-specific counters are an Observation task and must not be guessed.

### 220 `S_RAKUEN_TSUHO_FS` — パチスロ楽園追放

**ADOPT**
- `BB/RD/AT combined initial hit` as the single representative initial-hit likelihood family.
- `common bell` **conditionally**: only when My Slot My Counter Lv4 eligibility is satisfied and the numerator and denominator correspond to the same valid observation session/trial universe.

**REJECT numeric as dependent components**
- RD initial hit separately.
- AT initial hit separately.

Reason: adopting aggregate initial hit plus constituent pathway components would double-count. The aggregate is selected as the default representative statistic because a complete dependency-safe joint decomposition is not implemented in this batch.

**REFERENCE**
- normal/high-state role-dependent draws, NAH high transition/challenge and other conditional families whose eligible denominators are not robustly countable.

**Evidence**
- RD-end screen, AT-end screen, episode/payout and confirmed-setting presentations.

Observation constraint: common bell is not visually distinguishable by stop form; its count requires the verified My Slot condition. If that condition is unmet, the field is unobserved, not zero.

## Dependency / Double-counting Audit — closure

| overlap family | final strategy | status |
|---|---|---|
| BIG + REG + total bonus | adopt components, reject aggregate | PASS |
| BB + RB + total bonus | adopt components, reject aggregate | PASS |
| role rate + role-specific bonus overlap | adopt base role/bonus families, reject overlap likelihood unless future joint model | PASS |
| CZ + downstream AT | choose representative AT for machines with unresolved pathway dependence | PASS |
| bonus total + bonus-high subset | choose total bonus initial hit, keep state-qualified subset as REFERENCE | PASS |
| combined CZ + subtype/level outcome | no naive multiplication; conditional/subtype families REFERENCE | PASS |
| aggregate initial hit + RD/AT components (楽園追放) | adopt aggregate, reject component likelihoods | PASS |
| Feature + Evidence from same occurrence | downstream one-observation/one-input contract required | PASS |

No adopted numeric pair knowingly reuses the same physical occurrence as independent evidence under the current Selection plan.

## Selection Quality checks

- [x] Every Research candidate is classified as ADOPT, REJECT numeric, REFERENCE, or Evidence.
- [x] Rejection reasons are concrete and user-explainable.
- [x] Input burden alone is not used as a rejection reason.
- [x] Rare/conditional candidates were evaluated by practical trial opportunity, not setting ratio alone.
- [x] Tiny frequent differences were checked for actual information contribution.
- [x] Aggregate/component double counting is explicitly resolved.
- [x] Conditional denominators are not replaced with total games without proof.
- [x] Linked-service generic capability is not promoted to machine-specific observation capability.
- [x] Evidence remains separate from numeric likelihood and is ready for shared Feature/Evidence audit downstream.

## Observation handoff / debt

Gate B does not require every REFERENCE item to become an input. Observation v2 must now determine acquisition semantics only for the active ADOPT and Evidence mappings, while retaining documented REFERENCE items in machine explanation data.

Priority Observation work:
1. Verify exact Daitomo same-session counter semantics for いざ！番長 common bell A / direct BIG handling.
2. Confirm whether いざ！番長 direct BIG is included inside the adopted AT initial-hit numerator; if yes, direct BIG becomes REFERENCE to avoid overlap.
3. Verify per-machine eSLOT+ fields for わた婚 / 転剣 only where public or real-device evidence supports them.
4. Define direct/manual denominators for Triple Crown cherry/plum and preserve `ドラマチックスコア` as an aid, not a denominator source.
5. Keep Matador BT one-coin role as REFERENCE unless a reliable BT-game denominator route is discovered.
6. Verify My Slot same-session denominator/eligibility semantics for 楽園追放 common bell.
7. Map every Evidence observation to one input surface and distinguish hard lower-bound/exact evidence from soft tendency hints.

## Gate B decision

**PASS.** Proceed to Observation v2 / Observation Red-Team / Gate C.

No public-main mutation is authorized by this gate. Shared registry reservations 211–220 remain untouched until the cross-PR reservation/rebase issue is reconciled before MachineData registry mutation.
