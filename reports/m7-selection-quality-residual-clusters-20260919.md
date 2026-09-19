# M7 residual Selection Quality clustering — 2026-09-19

After freezing the 19 masked NO_EVIDENCE cases, 69 primary Selection Quality blockers remain.

## Exact split

| Dimension | Class | Machines |
|---|---|---:|
| Migration disposition | MIGRATION_REQUIRED | 64 |
| Migration disposition | BLOCKED_ADOPTION_OUTSIDE_LEGACY_GROUPS | 5 |
| Selection Quality | REVIEW | 57 |
| Selection Quality | FAIL | 12 |

The next audit will isolate the structural FAIL subset before any prose REVIEW work. No Selection decision or rationale is changed by this report.


## Structural FAIL subset — exact 12 machines

### Unclassified Research Evidence / discovery — 4 machines
- `LB_FUJIKO_M2`: `RE_VOICE_FUJIKO`.
- `L_MADOKA_FORTE_UU`: `RE_VOICE_6` (also prohibited-burden rejection).
- `S_MHW_ICEBORNE_ZF`: `RE_HIGH_WEAK_SELIANA`.
- `S_MILKY_HOMES_GNB`: 8 unclassified Research Evidence candidates; the same 8 discovery candidates are consequently unmapped.

These are missing Selection Evidence decisions and are not auto-repairable from names or downstream contracts.

### Unclassified Research Feature — 1 machine
- `LB_KELLOT_5_ND05H`: `RF_BELL`, `RF_CHERRY`, `RF_PARALLEL_ORANGE`, `RF_DIAGONAL_ORANGE`.

This requires explicit Selection classification.

### Prohibited input/manual-count burden rejection basis — 5 machines
- `L_GOLDEN_KAMUY_KR`
- `L_HEY_ELITE_SALARYMAN_KAGAMI_PA4`
- `L_MADOKA_FORTE_UU`
- `L_MAGICAL_HALLOWEEN8_FE`
- `L_SHINOBIDAMASHII3_A3`
- `S_SHIN_TENKAFUBU_DD`

Note: six machines are listed because `L_MADOKA_FORTE_UU` overlaps the unclassified-Evidence family. These are rationale-policy failures; do not mechanically delete or rewrite the burden wording.

### Duplicate Feature decisions — 2 machines
- `S_REVUE_STARLIGHT_CX`: duplicate `RF_REVUE_CZ`.
- `S_REVUE_STARLIGHT_CX_TEST_V66`: duplicate `RF_REVUE_CZ` and `RF_REVUE_AT`.

Both are adoption-outside-legacy-groups machines. A duplicate Research Feature decision is structurally suspicious, but choosing which decision survives can change Selection semantics. It therefore requires direct identity/semantic comparison before any repair.

## Batch decision

No whole-family automatic repair is authorized from the blocker strings alone. The most promising deterministic candidates are the two Revue Starlight duplicate-decision cases: if duplicate entries are byte/semantically identical or one is demonstrably stale with authoritative lineage, deduplication may be decision-preserving. Audit those two next; freeze the other structural families pending authoritative Selection decisions/rationale.
