# Batch 20260901 — Gate A Research Checkpoint

Updated: 2026-09-01
Branch: `batch/20260901-magia-gundamseed`
Stacked base: `batch/20260831-persona5-to-bio5` (PR #148)
Current PR: #149
Formal references: Core Policy v1.7 / RSO v6.9 / UX v6.9

## Status

Gate A / Research: IN PROGRESS.

Cross-source Research has been executed for all ten machines. This is Research only; no candidate is rejected merely because observation is difficult.

## Corrected provisional registration IDs

The initial 191-200 allocation was invalid because current `machine-registry.json` already assigns 191 to `S_REVUE_STARLIGHT_CX_TEST_V66`, and registry validation requires uniqueness. Correct batch allocation is:

192 — Magia Record
193 — L Godzilla
194 — L Ushio & Tora Hakumen Kessen
195 — Smart Okinawa Slot Amazing Live
196 — Yoshimune
197 — L Mahjong Monogatari
198 — Idolmaster Million Live! Next Prologue
199 — Classroom of the Elite
200 — Midoridon VIVA! REVIVAL
201 — Gundam SEED

No production ResearchData for this batch had been created under the invalid IDs.

## Research findings

Detailed numeric findings and source/semantic coverage are retained in `reports/batch-20260901-gate-a-provenance-matrix.md` and will be materialized into per-machine `research-data.json`.

Locked high-risk semantics:
- Amazing Live: settings 1/2/4/5/6 plus operational SET_L; do not invent SET_3 or use SET_L as posterior hypothesis. Bonus initial-hit vs BIG/REG appearance overlap.
- Mahjong Monogatari: Bonus, AT and aggregate first-hit rows overlap.
- Ushio & Tora: reset-only ceiling and Ushitora-mode tables require a known-reset trial population.
- Classroom: CZ type, DAXEL flash and red-button rows use conditional event denominators.
- Midoridon: high-state transition/state bonus lotteries require eligible-trigger/state denominators, not total normal games.
- Gundam SEED: reset/ST-end 100G window is an opportunity-level conditional observation, not per-game probability.
- Partial public tables remain partial; no interpolation/fabrication.

## Linked-service status

- Idolmaster: FOUND — official SloPla NEXT machine/result surface.
- Magia Record: machine-specific UniMemo counting evidence found; primary official support/field contract still debt.
- Midoridon: machine-specific UniMemo counting evidence found; exact official result fields still debt.
- Other seven: keep UNRESOLVED unless explicit machine-specific primary evidence supports CHECKED_NONE; manufacturer-family apps/guides/simulators do not qualify.

## Gate-A closure debt

- lock/collision-check final machine IDs;
- create 10 `research-data.json` files;
- source/provenance every Research row;
- normalize true Hard Evidence separately from tendencies;
- run `research:validate` equivalent and Discovery→Research coverage audit;
- update checkpoint/PR and only then mark Gate A PASS.
