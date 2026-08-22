# SloAnalytica User-Verified UX Contract Policy

Date: 2026-08-22

## Core rule

MachineData statistical regeneration must not silently remove or rewrite UX that was explicitly specified or verified through real-machine play unless the underlying Feature contract itself requires the UX change.

Research/Selection improvements may change probabilities, Feature membership, Evidence, weights, or Difficulty participation. Those changes do **not** authorize unrelated changes to input ergonomics.

## Protected UX

Examples of UX that can be protected by a user-verified contract include:

- seated/predecessor snapshot inputs (`PREDECESSOR_SNAPSHOT`)
- quick-add controls such as `+50G`
- input labels and ordering
- section grouping and folding behavior
- automatic/difference helpers
- direct-input/compact-counter behavior
- user-facing instructions that reflect real-machine operation

## Statistical contract vs UX contract

Treat these as separate contracts.

### Statistical contract

- Feature adoption
- probability model
- numerator/denominator
- Evidence semantics
- reliability weight
- Difficulty participation/exposure

### UX contract

- input presence for real-play operation
- observation scope
- UI section placement
- quick-add / compact / direct-input configuration
- display order
- labels/instructions

A statistical change should modify only the UX that is necessary to represent that change.

## USER_VERIFIED_UX

A contract under `ux-contracts/<machineId>.json` records UX that must survive MachineData rebuilds.

The contract is intentionally explicit and narrow. Do not infer or fabricate historical UX fields that cannot be recovered. A known historical requirement whose exact details are unavailable must be recorded as `UNRESOLVED` until it can be reconstructed from source history or renewed real-machine confirmation.

## Build/audit requirement

After MachineData generation, `tools/audit-user-verified-ux-contracts.mjs` must verify protected UX against the generated package. A protected value disappearing or changing is a build failure.

Unresolved historical requirements are reported as REVIEW, not silently treated as absent and not fabricated.

## Contract changes

Changing or deleting protected UX requires an explicit contract update and a reason tied to one of:

1. the underlying Feature was removed or materially changed;
2. real-machine verification corrected the previous UX;
3. the app-wide UI contract changed and equivalent usability is preserved.

Routine Research/Selection regeneration is not sufficient justification.

## C.C.&Kallen precedent

The C.C.&Kallen MachineData retained the RB-after infinite-AT Feature while a previously user-specified `+50G` helper disappeared during regeneration. The loss was unrelated to the Feature contract and therefore is a UX regression. The builder must preserve a Selection-level quick-add contract so the helper survives future rebuilds.

The user also confirmed that a historical seated-data input section existed. Its exact old input set has not yet been recovered from repository history, so it is tracked as an unresolved historical UX requirement rather than guessed.