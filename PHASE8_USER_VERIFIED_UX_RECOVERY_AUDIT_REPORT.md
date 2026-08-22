# Phase 8 — User-verified UX Recovery Audit

Date: 2026-08-22
Branch: `prototype-multi-machine`

## Goal

Recover and protect UX contracts that were previously verified through real-machine use, without reconstructing uncertain historical behavior by guesswork.

## Completed work

### 1. Strengthened the UX contract audit

`tools/audit-user-verified-ux-contracts.mjs` now supports both:

- `protectedInputs`: inputs and UI properties that must remain compatible.
- `forbiddenInputs`: inputs that must not reappear after a real-machine UX decision removed or rejected them.

Historical requirements whose exact old contract cannot be reconstructed remain `UNRESOLVED` and are reported as REVIEW rather than silently guessed.

### 2. Recovered verified contracts

The following contracts are now present under `ux-contracts/`:

- `S_CODE_GEASS_3_CC_FS` — protects RB後C.C.高確 +50G quickAdd; old seated-data section remains REVIEW because the exact historical field set is not safely reconstructible.
- `LB_THUNDER_V_HA` — protects seated-start games / BIG / REG inputs verified after real-machine correction.
- `LB_ISEKAI_QUARTET_KR` — protects seated total-games / initial-hit inputs and 赤7・青7 BIG合計; explicitly forbids generic current-games inputs that were rejected for this machine.
- `LB_TOBE_HAREM_ACE_CF` — protects seated games / BIG / REG, manual BT-games input, and bonus cherry-stop input.
- `LB_SLOT_GALFY_A4` — protects seated-start games, own normal-games input, and the verified small-role input structure.
- `LB_FUJIKO_M2` — protects seated TOTAL GAME / BIG / REG, disables generic session-difference substitution for linked-service normal games, and protects the 1G-only BIG technical-intervention voice input group.

### 3. Added regression tests

`test/user-verified-ux-contracts.test.mjs` verifies:

- all recovered contracts are included in the audit;
- protected contracts produce no ERROR against current generated machine packages;
- known unresolved Code Geass seated-data history remains REVIEW;
- Isekai Quartet continues to reject generic current-games inputs.

### 4. Added CI gate

`.github/workflows/user-verified-ux-contract-audit.yml` runs the contract audit and dedicated regression test whenever protected contracts, generated machine packages, the audit tool, or its tests change.

## Current audit assessment

Direct comparison of the recovered contracts with the current generated machine packages found no contract mismatch in the recovered scope.

Expected contract state at Phase 8 completion:

- audited contract machines: 6
- contract ERROR: 0
- known historical REVIEW: 1
  - `S_CODE_GEASS_3_CC_FS / C_CC_SEATED_DATA_SECTION`

The REVIEW is intentional. The existence of the old seated-data UX is known, but its exact historical field composition is not safely reconstructible from the available current evidence. It must not be recreated by inference.

## Completion criteria

Phase 8 is COMPLETE because:

1. Real-machine-verified UX can now be represented independently from statistical ResearchData.
2. Confirmed UX is protected against Builder / publish regeneration regressions.
3. Confirmed absence of machine-inappropriate inputs can be protected.
4. Unrecoverable historical UX is preserved as REVIEW rather than guessed.
5. Dedicated regression test and CI gate have been added.

No Phase 9 work is included in this phase.
