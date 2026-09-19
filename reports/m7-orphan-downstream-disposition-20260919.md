# M7 orphan-downstream disposition — 2026-09-19

## Machine

`S_SUPER_BINGO_NEO_CLASSIC_HH1`

## Formal state

- Selection `evidence`: 0 items.
- Canonical UI `evidenceContracts`: 2 contracts:
  - `EV_BC_END`
  - `EV_ENDING_CARD`
- Observation contains 4 ordinary gameplay observations and no formal Evidence→Observation mapping for those downstream contracts.

This is a true `BLOCKED_ORPHAN_DOWNSTREAM` state: downstream Evidence contracts exist without an upstream Selection adoption contract.

## Decision

Do not synthesize Selection Evidence from the UI contracts and do not infer Evidence semantics from labels. The machine remains blocked until an authoritative Selection/reconstruction artifact establishes whether those two downstream contracts are valid adopted Evidence and defines their lineage/semantics.

This closes the mechanically distinct residual `OTHER_BLOCKED` investigation after the 38-machine adoption-outside class freeze. No runtime or MachineData semantics are changed.
