# SloAnalytica 2026-09-05 Next10 — Gate C Observation Red-Team Final

Status: PASS
Date: 2026-09-05

Scope: `gate-c-observation-pass1.md` + `gate-c-observation-contracts-final.md` against Gate-B final Selection and current MachineData/UI conventions.

## Audit assertions

### 1. ADOPT-only likelihood boundary — PASS
Every active v1 likelihood input maps to a Gate-B ADOPT item. SUPPORT candidates are either omitted or explicitly reference-only. No linked-service-only field is promoted merely because a service exists.

### 2. Aggregate/component duplication — PASS
- Druaga: BIG + REG; total not simultaneous.
- Babel: BIG + REG; total not simultaneous.
- Railgun2: CZ total is parent; type-specific CZs are SUPPORT/reference.
- Neo Planet: total bonus is parent; BIG/REG are reference/history only.
- Absolute Impact IV: AT first-hit is primary; bonus first-hit is SUPPORT/reference.
No parent and deterministic/overlapping child are independently multiplied by default.

### 3. Conditional denominator integrity — PASS
- Tokyo Revengers common bell: normal play only; AT excluded.
- Babel weak/strong cherry: role-specific trial counts.
- Babel scorpion: only eligible 3rd/6th occurrences.
- Zenigata5 Deka-me: true-foreshadowing periods excluded.
- VVV2 BAR direct hit: deferred because the exact opportunity denominator is not safely countable yet.
- Neo Planet Mode F: reset/setting-change applicability required before the fields are enabled.
- Neo Planet total bonus: published 1G-ren exclusion preserved.
No hidden-state/conditional statistic is allowed to use total games as a convenience denominator when that population is wrong.

### 4. Empty versus entered zero — PASS
All Gate-D statistical controls are required to materialize `emptyMeansUnobserved=true` and `observedZeroAllowed=true`.
- empty: no observation, no likelihood participation;
- explicit 0 with a known eligible denominator: observed zero and valid likelihood participation;
- numerator 0 without an observed denominator does not create a trial population.

### 5. EvidenceEngine boundary — PASS
Hard lower-bound, exact-setting and source-supported denial observations are separated from frequency likelihoods. Indication-only screens/voices without complete setting-conditioned distributions are not converted into synthetic probabilities.

Context-fixed/non-setting outcomes are explicitly excluded where known:
- Tokyo Revengers fixed ending outcomes;
- Railgun2 return/引き戻し-only screen;
- Zenigata5 Deka Time next-mode screen;
- VVV2 ordinary end-screen probability when customization state is unknown.

### 6. Evidence option wording / source discipline — PASS WITH MATERIALIZATION LOCK
Where exact visual wording is already known, Gate C records it (e.g. Druaga `イシターの復活`, Onimusha3 Entertrophy colors, Railgun2 Fujimaru Coin classes, VVV2 +22/+44/+66G, Neo Planet trophy/constellation semantics, Zenigata5 payout numbers).

Where only the semantic meaning is currently locked but the exact visual label is not sufficiently source-traceable, Gate D must not invent a visual label. Such outcomes may be materialized only after source traceability is attached; otherwise they remain help/reference text. This is a safety lock, not a Gate-C blocker.

### 7. Missing setting stages — PASS
No synthetic setting stage is permitted:
- Druaga: no SET_3/SET_4.
- Zenigata5: no SET_1.
- VVV2: no SET_3.
- Neo Planet: no SET_3.
Features must contain probabilities only for actual machine settings.

### 8. Linked-service equivalence — PASS
`ぱちログ`, UniMemo, My Slot/My Counter, 打-WIN LITE and SloPla NEXT are acquisition aids only. A service value may prefill a manual field only after exact machine-specific field identity, population, timing and reset scope match the manual observation contract. No service is required for basic manual inference.

### 9. Session/reset contamination — PASS
Observation contracts are current-session/current-setting-interval by default. Previous-player or prior-power-cycle values are not automatically merged. Reset-only features require explicit applicability.

### 10. UI feasibility — PASS
The selected core can be represented using existing `counter`, `integer/number`, and `multi_enum` conventions already present in prototype MachineData. Shared denominators can be displayed once per section. Conditional numerator/trial pairs are representable and can enforce numerator <= trials.

## High-risk items intentionally deferred

- Tokyo Revengers middle cherry: not active until a complete publication-grade vector is available for implemented settings.
- Onimusha3 common bell: empirical-only; absent from v1 inference.
- VVV2 BAR-alignment direct-hit feature: denominator not safely locked; SUPPORT only.
- Exact linked-service result fields/reset semantics for several titles: manual contract remains canonical.
- Context-ambiguous indication-only screens: not hard evidence until exact source wording/context is attached.

## Red-Team verdict

**PASS**.

Gate C has a safe, implementable observation contract for all ten machines. Every unresolved item is either non-core, reference-only, device-verification material, or deliberately deferred; none requires fabricating a denominator, setting stage, probability, service field, or visual evidence label.

Gate D / UI Design + MachineData may begin on the research branch. Public `main` remains out of scope.