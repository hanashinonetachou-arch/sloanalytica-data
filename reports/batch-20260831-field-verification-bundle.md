# Batch 2026-08-31 Field Verification Bundle

## Purpose

This file consolidates only the Observation questions that remain genuinely field/device dependent after the current public-source pass and the user-provided real-device findings. It is not a request to re-check already web-resolved or field-resolved facts.

## Resolved in current field pass

- S笑ゥせぇるすまん4 — CZ entry-success identification: **RESOLVED / NOT OBSERVABLE FOR INFERENCE**. The user confirmed that a case already successful at CZ entry cannot be reliably distinguished from a success achieved during CZ play. The conditional entry-success Feature is therefore excluded and its input surface removed.
- スマスロ バイオハザード5 — Middle/diagonal AT pairing: **RESOLVED / OBSERVABLE**. The user confirmed that middle-line and diagonal AT initial symbol hits can be reliably distinguished when watched, and subsequent Infection entry/non-entry can be paired with the hit. The conditional Feature remains adopted.
- パチスロ バイオハザード RE:2 — Figure Collection scope: **RESOLVED**. Power OFF/ON retains the collection; setting change/reset clears it. The persistence boundary is therefore setting-change/reset based.

## Current remaining bundle

| Priority | Machine | Verification | Exact question | Why field-only |
|---|---|---|---|---|
| HIGH | S BIG島唄30 | Chain boundary | Can the start/end of the chain region be identified consistently from the actual machine so that only non-chain normal games are accumulated? | The selected first-hit denominator explicitly excludes chain-region games; public numeric sources do not prove the operational boundary is unambiguous in play. |
| MEDIUM | L 仮面ライダー電王 | ぱちログweb result fields | Does the actual ぱちログweb result expose normal games, 電王BONUS first hits, or any other Selection-compatible counters? | Official support and QR-result viewing are confirmed, but the public official page does not enumerate machine-specific result fields. |
| LOW | パチスロペルソナ5 | MySlot result scope | What range/reset boundary is used for the MySlot watermelon/result counters? | MySlot is publicly confirmed as a valid watermelon-count route, but the result-screen scope/reset boundary is not established publicly. |
| LOW | Sister Quest | SmartTALK history/reset | What question/answer history is retained in SmartTALK and where is the reset boundary? | SmartTALK operation and setting cues are public; session/history persistence is not. |

## Machines with no current field-only Observation blocker

- スーパーリオエース: current スロプラNEXT Rio support belongs to the separate 2026 スマスロスーパーリオエース2; original 2022 linked-service coverage is CHECKED_NONE.
- パチスロ BOØWY: no current adopted numeric Feature requires unresolved machine-menu/service behavior; AT first hit and hard end-event Evidence are directly observable.
- てぃだどんどん: no current adopted numeric Feature requires unresolved machine-menu/service behavior; bonus first hit and BIG-entry 7-segment Evidence are directly observable.
- S笑ゥせぇるすまん4: the unobservable CZ entry-success Feature has been removed from inference/UI; remaining adopted elements have no field-only blocker.
- スマスロ バイオハザード5: middle/diagonal classification and Infection pairing are verified on machine.
- パチスロ バイオハザード RE:2: Figure Collection persistence/reset boundary is verified on machine.

## Verification policy

- Do not infer a service field from another machine in the same manufacturer family.
- Empty input means unobserved; entered 0 means observed zero.
- One natural observation must remain one input surface even when it feeds both Numeric and Evidence consumers.
- If a field-only check fails, reopen Observation/Selection rather than silently substituting a different denominator or event definition.
