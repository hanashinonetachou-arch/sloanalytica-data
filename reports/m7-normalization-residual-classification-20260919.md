# M7 residual Normalization blocker classification — 2026-09-19

## Scope

The current full-fleet audit contains 17 machines classified as `NORMALIZATION_BLOCKED`, covering 50 legacy Evidence groups and 174 Evidence options.

All 17 share: `MIGRATION_REQUIRED | Selection PASS | Normalization FAIL | Observation FAIL | Canonical UI FAIL | Feature sharing REVIEW | Input compatibility PASS`.

Machines: LB_MAGICAL_HALLOWEEN_GS, L_BIG_DREAM_GOLDEN_PUSHER_KR, L_DUMBBELL_X, L_KOMONCHAMA_TEN_L2, L_KYOUKARA_OREHA_FE, L_ONIMUSHA3_XA, L_SHIN_IKKITOUSEN_V, L_SUPER_BINGO_NEO_SB5, L_TOARU_ACCELERATOR_RZ, S_FAMISTA_KAIDO_FB, S_GRANBELM_ZX, S_HIDAN_NO_ARIA_II_JZ, S_NIGHTS_YTCC, S_ODANOBUNA_ZENKOKU_SNT, S_SENGOKU_KOIHIME_FC, S_SENGOKU_MUSOU3_ZYTCD, S_TATE_NO_YUSHA_KS.

## Structural findings

- Every group still lives in legacy `evidenceUi.groups`, so no formal M7 `normalizationSemantics` exists.
- Options carry explicit `allowedSettings`; most also carry `excludedSettings`.
- The population mixes single- and multi-option groups and includes non-monotonic allowed-setting sets.
- Therefore `ALLOWED_SETTINGS_INTERSECTION` cannot be authorized merely from field names or lower-bound-looking labels.

## Reconstruction precedent

`tools/materialize-gate-c-observation-v7.mjs` includes `L_BIG_DREAM_GOLDEN_PUSHER_KR` in its formal Gate-C population and deterministically creates `OBS_EVI_<clean(groupId)>` for every Selection Evidence group. Its current Observation artifact contains those formal IDs.

This establishes a historical Observation-identity reconstruction anchor for that machine. It does not by itself prove normalization semantics for the other 16 machines.

## Decision

Do not mass-assign normalization semantics from labels, apparent setting floors, or `allowedSettings` alone.

Next split:
1. formal reconstruction anchors;
2. lineage-complete candidates whose Research Evidence IDs, formal Observation IDs, canonical UI placement, and non-sharing are all independently established;
3. review-required residuals.

Only classes 1/2 may proceed to an M7 migration specification. Preserve exact legacy allowed/excluded sets, including non-monotonic sets.
