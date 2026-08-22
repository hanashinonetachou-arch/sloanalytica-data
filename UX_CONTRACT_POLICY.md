# SloAnalytica User-Verified UX Contract Policy

Date: 2026-08-22

## Core rule

MachineData statistical regeneration must not silently remove or rewrite UX that was explicitly specified or verified through real-machine play unless the underlying Feature contract itself requires the UX change.

Research/Selection improvements may change probabilities, Feature membership, Evidence, weights, or Difficulty participation. Those changes do **not** authorize unrelated changes to input ergonomics.

This policy is Layer 3 of `THREE_LAYER_MACHINE_DATA_POLICY.md`.

## Protected UX

Examples of UX that can be protected by a user-verified contract include:

- seated/predecessor snapshot inputs (`PREDECESSOR_SNAPSHOT`)
- quick-add controls such as `+50G`
- input labels and ordering
- section grouping and folding behavior
- automatic/difference helpers
- direct-input/compact-counter behavior
- user-facing instructions that reflect real-machine operation

## Three-layer ownership

Machine data work is separated into three ownership layers:

1. **Statistical Research** — probabilities, Features, Evidence, weights, denominators and Difficulty participation.
2. **Machine Observation Research** — machine-menu/history availability, linked-service obtainable fields, seated/predecessor observations and self-session difference sources.
3. **User-Verified UX Contract** — verified input presence, ordering, quick-add, automatic calculations, labels and real-play ergonomics.

A Statistical Research rebuild must not delete Machine Observation facts or User-Verified UX merely because they are not regenerated from SelectionData. Machine Observation Research likewise does not automatically authorize a statistical Feature.

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

## Difficulty boundary

User-verified seated/predecessor UX may feed valid inference data, but it must not be confused with Difficulty benchmark game counts.

By default:
- `PREDECESSOR_SNAPSHOT` data may participate in live inference when statistically valid;
- predecessor data do not participate in Difficulty / setting-band benchmark game counts;
- Difficulty and setting-band discrimination G describe standard data collected during the user's own play;
- a displayed benchmark game count is not the trial count of every individual Feature.

The app's common Difficulty explanation must make this distinction visible to users.

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

The user also confirmed that a historical seated-data input section existed. Its exact old input set has not yet been recovered from repository history, so it is tracked as an unresolved Machine Observation / UX requirement rather than guessed.