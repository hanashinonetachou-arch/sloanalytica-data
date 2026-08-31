# Batch 2026-08-31 Field Verification Bundle

## Purpose

This file consolidates only the Observation questions that remain genuinely field/device dependent after the current public-source pass. It is not a request to re-check already web-resolved facts.

## Current bundle

| Priority | Machine | Verification | Exact question | Why field-only |
|---|---|---|---|---|
| HIGH | S BIG島唄30 | Chain boundary | Can the start/end of the chain region be identified consistently from the actual machine so that only non-chain normal games are accumulated? | The selected first-hit denominator explicitly excludes chain-region games; public numeric sources do not prove the operational boundary is unambiguous in play. |
| MEDIUM | S笑ゥせぇるすまん4 | CZ entry-success identification | Can the entry-time success draw for 審判ノ刻 be distinguished consistently from self-success during the CZ? | The selected conditional Feature requires these to be separate observations; public analysis describes the draw but cannot verify practical visual classification on every occurrence. |
| MEDIUM | L 仮面ライダー電王 | ぱちログweb result fields | Does the actual ぱちログweb result expose normal games, 電王BONUS first hits, or any other Selection-compatible counters? | Official support and QR-result viewing are confirmed, but the public official page does not enumerate machine-specific result fields. |
| MEDIUM | スマスロ バイオハザード5 | Middle/diagonal AT pairing | Can every AT initial symbol hit be classified reliably as middle-line vs diagonal and paired with subsequent Infection entry? | The selected conditional Feature uses middle-line initial hits as the denominator and excludes diagonal hits. |
| LOW | パチスロペルソナ5 | MySlot result scope | What range/reset boundary is used for the MySlot watermelon/result counters? | MySlot is publicly confirmed as a valid watermelon-count route, but the result-screen scope/reset boundary is not established publicly. |
| LOW | Sister Quest | SmartTALK history/reset | What question/answer history is retained in SmartTALK and where is the reset boundary? | SmartTALK operation and setting cues are public; session/history persistence is not. |
| LOW | パチスロ バイオハザード RE:2 | Figure Collection scope | What is the save scope (current day vs cumulative) and reset boundary of the sub-LCD Figure Collection? | Public material confirms the sub-LCD play-history and Figure Collection surfaces, so only persistence scope remains unresolved. |

## Machines with no current field-only Observation blocker

- スーパーリオエース: current スロプラNEXT Rio support belongs to the separate 2026 スマスロスーパーリオエース2; original 2022 linked-service coverage is CHECKED_NONE.
- パチスロ BOØWY: no current adopted numeric Feature requires unresolved machine-menu/service behavior; AT first hit and hard end-event Evidence are directly observable.
- てぃだどんどん: no current adopted numeric Feature requires unresolved machine-menu/service behavior; bonus first hit and BIG-entry 7-segment Evidence are directly observable.

## Verification policy

- Do not infer a service field from another machine in the same manufacturer family.
- Empty input means unobserved; entered 0 means observed zero.
- One natural observation must remain one input surface even when it feeds both Numeric and Evidence consumers.
- If a field-only check fails, reopen Observation/Selection rather than silently substituting a different denominator or event definition.
