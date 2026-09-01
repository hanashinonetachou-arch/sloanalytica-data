# Batch 2026-08-31 Field Verification Bundle

## Purpose

This file consolidates only the Observation questions that remain genuinely field/device dependent after the current public-source pass and the user-provided real-device findings. It is not a request to re-check already web-resolved or field-resolved facts.

## Resolved in current field pass

- S BIG島唄30 — Chain boundary: **RESOLVED / OBSERVABLE**. The user confirmed that the chain region is BIG後32G. Non-chain normal games and first hits can therefore be collected while excluding BIG後32G.
- S笑ゥせぇるすまん4 — CZ entry-success identification: **RESOLVED / NOT OBSERVABLE FOR INFERENCE**. The user confirmed that a case already successful at CZ entry cannot be reliably distinguished from a success achieved during CZ play. The conditional entry-success Feature is therefore excluded and its input surface removed.
- スマスロ バイオハザード5 — Middle/diagonal AT pairing: **RESOLVED / OBSERVABLE**. The user confirmed that middle-line and diagonal AT initial symbol hits can be reliably distinguished when watched, and subsequent Infection entry/non-entry can be paired with the hit. The conditional Feature remains adopted.
- パチスロ バイオハザード RE:2 — Figure Collection scope: **RESOLVED**. Power OFF/ON retains the collection; setting change/reset clears it. The persistence boundary is therefore setting-change/reset based.

## Deferred field-only items

The following three checks remain unresolved but are explicitly deferred because they are difficult to verify in the near term. They are not blockers for continuing the current batch workflow; their dependent optional observation routes must remain unresolved and must not be assumed or fabricated.

| Priority | Machine | Verification | Deferred question |
|---|---|---|---|
| MEDIUM | L 仮面ライダー電王 | ぱちログweb result fields | Does the actual ぱちログweb result expose normal games, 電王BONUS first hits, or any other Selection-compatible counters? |
| LOW | パチスロペルソナ5 | MySlot result scope | What range/reset boundary is used for the MySlot watermelon/result counters? |
| LOW | Sister Quest | SmartTALK history/reset | What question/answer history is retained in SmartTALK and where is the reset boundary? |

## Machines with no current field-only blocker for adopted inference

- S BIG島唄30: BIG後32G is verified as the chain region, so the adopted non-chain first-hit denominator is operationally observable.
- スーパーリオエース: current スロプラNEXT Rio support belongs to the separate 2026 スマスロスーパーリオエース2; original 2022 linked-service coverage is CHECKED_NONE.
- パチスロ BOØWY: no current adopted numeric Feature requires unresolved machine-menu/service behavior; AT first hit and hard end-event Evidence are directly observable.
- てぃだどんどん: no current adopted numeric Feature requires unresolved machine-menu/service behavior; bonus first hit and BIG-entry 7-segment Evidence are directly observable.
- S笑ゥせぇるすまん4: the unobservable CZ entry-success Feature has been removed from inference/UI; remaining adopted elements have no field-only blocker.
- スマスロ バイオハザード5: middle/diagonal classification and Infection pairing are verified on machine.
- パチスロ バイオハザード RE:2: Figure Collection persistence/reset boundary is verified on machine.
- L 仮面ライダー電王 / パチスロペルソナ5 / Sister Quest: the deferred checks concern supplemental service/menu observation routes; unresolved fields must not be promoted to verified inputs until a later field check resolves them.

## Verification policy

- Do not infer a service field from another machine in the same manufacturer family.
- Empty input means unobserved; entered 0 means observed zero.
- One natural observation must remain one input surface even when it feeds both Numeric and Evidence consumers.
- If a field-only check fails, reopen Observation/Selection rather than silently substituting a different denominator or event definition.
- Deferred means intentionally unresolved, not verified and not assumed.