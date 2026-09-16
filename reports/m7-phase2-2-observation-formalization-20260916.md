# M7 Phase 2.2 Observation formalization — 2026-09-16

Base: `prototype-multi-machine` @ `04be83ec8d7b1eff04573c172e6b4b11ae714b39`.

This change formalizes existing Evidence Observation relationships only where repository semantics already make the relationship explicit. It does not infer from label equality alone.

## L_AKAME_GA_KILL_2

- `AT_END_SCREEN` → `OBS_EVI_AT_END_SCREEN`
- `NAMI_PANEL` → `OBS_EVI_NAMI_PANEL`

The existing Observation notes explicitly identify the corresponding Research Evidence IDs, and the Selection groups contain those same Evidence IDs.

## L_BOUNTY_ANGEL

- `BONUS_CONFIRM_SCREEN` → `OBS_EVI_BONUS_CONFIRM_SCREEN`
- `COSPLAY_CHALLENGE` → `OBS_EVI_COSPLAY_CHALLENGE`
- `ENDING_VOICE` → `OBS_EVI_ENDING_VOICE`

The existing Observation notes explicitly identify the corresponding Research Evidence IDs, and the Selection groups contain those same Evidence IDs.

No Feature mapping IDs are changed. No Evidence setting semantics, options, labels, input IDs, canonical UI, MachineData, or runtime files are changed.

The checked-in full-fleet report is intentionally not regenerated in this commit because the repository execution environment must perform the deterministic audit after these source changes. Integration remains blocked until exact-head validation confirms the regenerated audit state or demonstrates that the report is not part of the invoked CI surface.
