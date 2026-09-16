# M7 Phase 2.2 Controlled lineage work queue — 2026-09-16

Base HEAD: `229dddde617efb4e0427f08a3d5b2b324ad18d20`. Diagnostic work queue only; no formalization or production artifact mutation.

## Summary

| Metric | Count |
|---|---:|
| Controlled-lineage groups | 238 |
| Affected machines | 120 |
| Unexpected exact machine-readable sets | 0 |
| Accidental mismatch-group absorption | 0 |

### Observation topology

| Topology | Count |
|---|---:|
| EXISTING_UNIQUE_OBSERVATION_CANDIDATE | 10 |
| NO_EXISTING_OBSERVATION_CANDIDATE | 228 |
| MULTIPLE_EXISTING_OBSERVATION_CANDIDATES | 0 |
| OBSERVATION_REFERENCE_INCONSISTENCY | 0 |

### Source-set subtype

| Subtype | Count |
|---|---:|
| SOURCE_SET_ABSENT | 0 |
| SOURCE_SET_PARTIAL | 0 |
| SOURCE_SET_SUPERSET | 0 |
| SOURCE_SET_DIFFERENT | 0 |
| SOURCE_SET_NOT_MACHINE_READABLE | 10 |
| EXACT_MACHINE_READABLE_SET_FOUND | 0 |
| NOT_APPLICABLE | 228 |

### Human decision type

| Decision | Count |
|---|---:|
| CONFIRM_EXISTING_OBSERVATION_EXACT_UNIVERSE | 10 |
| CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | 228 |
| SELECT_AMONG_MULTIPLE_OBSERVATIONS | 0 |
| RESOLVE_STRUCTURAL_REFERENCE_INCONSISTENCY | 0 |
| REVIEW_UNEXPECTED_EXACT_MACHINE_READABLE_SET | 0 |

## Machine-level queue

### L_ANOTHER_RINO_HEAVEN_CC

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `RINO_TROPHY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_ARIFURETA_JA

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `SETTING_EVIDENCE` | EXISTING_UNIQUE_OBSERVATION_CANDIDATE | SOURCE_SET_NOT_MACHINE_READABLE | CONFIRM_EXISTING_OBSERVATION_EXACT_UNIVERSE | `OBS_SETTING_EVIDENCE` | Stop until a human or authoritative artifact confirms that the unique Observation represents exactly the selected Research Evidence universe. |

### L_ASLOT_KONOSUBA_FX

Groups: 3; independent decisions: 3; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `KONOSUBA_BLESS_STAMP` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `KONOSUBA_REG_CHAR` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `KONOSUBA_TROPHY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_BAKI_L3

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `AT_END_SCREEN` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `AT_PAYOUT_DISPLAY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_BANDORI_S11

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `BANDORI_NAGI` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `BANDORI_PAYOUT` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_BASILISK_KIZUNA2_TENZEN_ZN

Groups: 3; independent decisions: 3; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `BC_RED_LED_NO_BT` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `GENNOSUKE_BC_KILLS` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `SONIN_START_SCREEN` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_BERSERK_MUSOU_EV

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `AT_END_SCREEN` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_BIG_DREAM_GOLDEN_PUSHER_KR

Groups: 5; independent decisions: 5; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EVI_GC_AWAKENED_6` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVI_GC_LOOKBACK_4PLUS` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVI_GC_STANDING_2PLUS` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVI_GC_THRONE_5PLUS` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVI_GC_TREASURE_4PLUS` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_BIOHAZARD_VENDETTA_FK

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `PAYOUT_DISPLAY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_BIOHAZARD_VILLAGE_XA

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `TROPHY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_BIOHAZARD5_ZE

Groups: 4; independent decisions: 4; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `AT_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `ENDING` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `PAYOUT` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `TROPHY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_BOFURI_FN

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `SETTING_EVIDENCE` | EXISTING_UNIQUE_OBSERVATION_CANDIDATE | SOURCE_SET_NOT_MACHINE_READABLE | CONFIRM_EXISTING_OBSERVATION_EXACT_UNIVERSE | `OBS_SETTING_EVIDENCE` | Stop until a human or authoritative artifact confirms that the unique Observation represents exactly the selected Research Evidence universe. |

### L_D4DJ_KB

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `D4DJ_TROPHY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_DARLING_IN_THE_FRANXX_SA

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EVG_ENDING_HARD` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVG_NAMI_TROPHY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_DISCUP_ULTRA_REMIX_XR

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `SETTING_EVIDENCE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_DMC5_ST_XA

Groups: 4; independent decisions: 4; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EVG_DMC_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVG_ENTA_TROPHY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVG_PAYOUT` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVG_UPPER_ST_VOICE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_DUMBBELL_X

Groups: 3; independent decisions: 3; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EVID_CHEAT` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVID_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVID_PAYOUT` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_GEGEGE_NO_KITARO_KAKUSEI_JC

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `KITARO_CZ_VOICE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `KITARO_PAYOUT` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_GEN_CHOMUGEN_PH

Groups: 4; independent decisions: 4; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `ENDING_LAMP` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `GEN_WINDOW` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `PAYOUT_DISPLAY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `TROPHY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_GODZILLA_VS_EVANGELION_JA

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `AT_END_SCREEN` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `PAYOUT_DISPLAY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_GOLDEN_KAMUY_KR

Groups: 3; independent decisions: 3; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `GOLD_FRAME_PHOTO` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `PAYOUT_DISPLAY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `SAMMY_TROPHY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_GUILTY_CROWN_2_XF

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EVG_AT_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVG_BONUS_END_SUBLCD` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_HEY_ELITE_SALARYMAN_KAGAMI_PA4

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `BONUS_AT_END_SCREEN` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_HIGURASHI_GOU_SS

Groups: 5; independent decisions: 5; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `BONUS_END_SCREEN` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `CZ_END_VOICE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `NIPAA_EVENT` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `REG_CHARACTER` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `TROPHY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_HOKUTO_MUSOU_FS

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `SETTING_EVIDENCE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_INITIAL_D_2ND

Groups: 4; independent decisions: 4; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `INITIAL_D_LB_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `INITIAL_D_PAYOUT` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `INITIAL_D_PAYOUT_86_COUNT` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `INITIAL_D_TROPHY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_INUYASHA2_FK

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EVID_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVID_MISC` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_IZA_BANCHO_SB8

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EVG_AT_END_HARD` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_KAGUYA_SAMA_JA

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `KAGUYA_BONUS_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `KAGUYA_REG_SCENARIO` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_KAMEN_RIDER_7RIDERS_UJA

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `AREA_COORDINATE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `TROPHY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_KAMEN_RIDER_DEN_O_UD

Groups: 3; independent decisions: 3; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `AT_END_HARD` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `HIGH_AT_BONUS_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `TROPHY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_KARAKURI_CIRCUS_G

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `AT_END_SCREEN` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_KING_PULSAR_SLCC

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `BB_END_TROPHY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_KINNIKUMAN4_SLDC

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `ENDING_TROPHY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_KOMONCHAMA_TEN_L2

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EV_PAYOUT` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EV_STAMP` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_KYOUKARA_OREHA_FE

Groups: 3; independent decisions: 3; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EV_BIG_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EV_CZ_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EV_REG_CHAR` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_LOVEKYURE2_PS

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `ZETTAI_KUUIKI_END_VOICE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_MAHJONG_FIGHT_CLUB_KAKUSEI_KM

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `AT_END_VOICE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `BATTLE_END_SCREEN` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_MONKEY_TURN5_CE

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `AT_PAYOUT_DISPLAY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `WEAK_RARE_AT_DIRECT` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_MONSTER_HUNTER_RISE_XA

Groups: 4; independent decisions: 4; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `MH_CONFIRM` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `MH_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `MH_OMIKUJI` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `MH_VOICE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_NANATSU_NO_MAKEN_PU

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `SETTING_EVIDENCE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_NOGIZAKA46_UD

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `TAMA_TROPHY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_NYANKO_BIGBANG_MK

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `AT_END_SCREEN` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `TAMA_TROPHY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_NYANKO_DAISENSO_CHOSHINSOKU_KB

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `SETTING_EVIDENCE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_ONIMUSHA3_XA

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EV_BIG_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EV_REG_CHAR` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_PACHISLO_SENRAN_KAGURA2_L9

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `SENRAN_TROPHY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `SENRAN_YOMA_REMAIN` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_RING_NI_KAKERO1_FS

Groups: 3; independent decisions: 3; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `BIG_MUSIC` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `BIG_START_MUSIC` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `ST_END_SCREEN` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_SAEKANO_SA3

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `PETIT_HEROINE_BONUS_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_SAKI_CHOJO_KESSEN_YR

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EVG_KUJIRAKKI` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_SALARYMAN_KINTARO_ET

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `SETTING_EVIDENCE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_SEIYA_KAIOU_ED

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `SETTING_EVIDENCE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_SENGOKU_BASARA_GIGA_ZE

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `IKKIGAKE_RED_ICON_ADD` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_SENGOKU_OTOME4_S3

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `PAYOUT_DISPLAY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_SHAMANKING_SS

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `SETTING_EVIDENCE` | EXISTING_UNIQUE_OBSERVATION_CANDIDATE | SOURCE_SET_NOT_MACHINE_READABLE | CONFIRM_EXISTING_OBSERVATION_EXACT_UNIVERSE | `OBS_SETTING_EVIDENCE` | Stop until a human or authoritative artifact confirms that the unique Observation represents exactly the selected Research Evidence universe. |

### L_SHIN_EVANGELION

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `SETTING_EVIDENCE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_SHIN_IKKITOUSEN_V

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EV_MAGATAMA_GUIDE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EV_TROPHY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_SHINOBIDAMASHII3_A3

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `AT_END_SCREEN` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `AT_PAYOUT_DISPLAY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_SHIOKININ_KC

Groups: 3; independent decisions: 3; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `SHIOKININ_DOOR` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `SHIOKININ_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `SHIOKININ_PAYOUT` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_SISTER_QUEST_CA

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `GACHA` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `PAYOUT` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_STAR_HANAHANA_MX

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `SETTING_EVIDENCE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_STREET_FIGHTER5_ZD

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `SETTING_EVIDENCE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_SUPER_BINGO_NEO_SB5

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EVID_BC_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVID_PAYOUT` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_SUPER_BLACKJACK_SLDC

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `SETTING_EVIDENCE` | EXISTING_UNIQUE_OBSERVATION_CANDIDATE | SOURCE_SET_NOT_MACHINE_READABLE | CONFIRM_EXISTING_OBSERVATION_EXACT_UNIVERSE | `OBS_SETTING_EVIDENCE` | Stop until a human or authoritative artifact confirms that the unique Observation represents exactly the selected Research Evidence universe. |

### L_SYMPHOGEAR_SEIGI_JA

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `SETTING_EVIDENCE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_TENSURA_CD

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `AT_END_SCREEN_EVIDENCE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_TIDADONDON_PA5

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `BIG_SEGMENT` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_TOARU_ACCELERATOR_RZ

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EVID_COIN` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVID_END_SCREEN` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_TOARU_INDEX_JC

Groups: 3; independent decisions: 3; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `AT_END_SCREEN` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `AT_PAYOUT_DISPLAY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `FUJIMARU_COIN` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_TOLOVE_DARKNESS_S8

Groups: 3; independent decisions: 3; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EVG_DARWIN_HIDDEN_NAGI` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVG_PAYOUT` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVG_ST_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_ULTRAMAN_KE

Groups: 4; independent decisions: 4; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EVG_AT_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVG_PAYOUT` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVG_RED_ZONE_TIMER` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVG_TAMA_TROPHY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_URUSEI_YATSURA_EV

Groups: 6; independent decisions: 6; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `AT_END_SCREEN` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `ATARU_ESCAPE_EYECATCH` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `END_SCREEN_KOTATSUNEKO` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `END_SCREEN_SAKURANBO` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `END_SCREEN_TENCHAN` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `HEROINE_GROUP` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_VALVRAVE_D

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `CZ_BONUS_END_SCREEN` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_WATASHI_NO_SHIAWASE_NA_KEKKON_PN

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EVG_AT_END_COMMAND` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_YOSHIMUNE_RISING_SA2

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `AT_END_SCREEN` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_ZENIGATA4_L1

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `DWIN_LITE_1000G_VOICE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### L_ZETTAI_SHOGEKI_PLATONIC_HEART_TK

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EVG_SPECIAL_MOVE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### LB_1000CHAN_ALPHA_L3

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EVG_BB_END_VOICE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVG_CONFIRM_VOICE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### LB_EVA_PROMISE_DOOR_SR

Groups: 4; independent decisions: 4; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EVA_BT_MOVIE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVA_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVA_RARE_EVIDENCE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVA_REG_CHAR` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### LB_ISEKAI_QUARTET_KR

Groups: 4; independent decisions: 4; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `ISEKARU_BIG_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `ISEKARU_PAYOUT` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `ISEKARU_REG_CHAR` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `ISEKARU_TROPHY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### LB_KELLOT_5_ND05H

Groups: 4; independent decisions: 4; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `KELLOT_BIG_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `KELLOT_FREEZE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `KELLOT_REG_CUTIN` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `KELLOT_TROPHY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### LB_MAGICAL_HALLOWEEN_GS

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `MAGIHALLO_MINI_CHARACTER` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### LB_SHAKE_BONUS_TRIGGER_A1

Groups: 3; independent decisions: 3; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `SHAKE_BIG_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `SHAKE_REG_VOICE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `SHAKE_TROPHY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### LB_SLOT_GALFY_A4

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `GALFY_SIDE_LAMP` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### LB_THUNDER_V_HA

Groups: 3; independent decisions: 3; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `THUNDER_1G_BIG_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `THUNDER_BIG_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `THUNDER_REG_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### LB_TOBE_HAREM_ACE_CF

Groups: 3; independent decisions: 3; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `HAREM_BAR_STOP` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `HAREM_END_SCREEN` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `HAREM_TECH_VOICE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### LB_TRIPLE_CROWN_SF4

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EVG_REG_END_LED` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### S_ANOTHER_GOD_HADES_SL

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `HADES_ANOTHER_LEGEND_START` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### S_AOHARU_MISAO_A2

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `SETTING_EVIDENCE` | EXISTING_UNIQUE_OBSERVATION_CANDIDATE | SOURCE_SET_NOT_MACHINE_READABLE | CONFIRM_EXISTING_OBSERVATION_EXACT_UNIVERSE | `OBS_SETTING_EVIDENCE` | Stop until a human or authoritative artifact confirms that the unique Observation represents exactly the selected Research Evidence universe. |

### S_BIG_SHIMAUTA_E2_30

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `SETTING_L_WARNING` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### S_BIOHAZARD_RE2_XB

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `FIGURE_HARD` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### S_BOOWY_SV

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `AT_END_HARD` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `SETTING_L_WARNING` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### S_DANMACHI_GAIDEN_XR

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `SETTING_EVIDENCE` | EXISTING_UNIQUE_OBSERVATION_CANDIDATE | SOURCE_SET_NOT_MACHINE_READABLE | CONFIRM_EXISTING_OBSERVATION_EXACT_UNIVERSE | `OBS_SETTING_EVIDENCE` | Stop until a human or authoritative artifact confirms that the unique Observation represents exactly the selected Research Evidence universe. |

### S_DANMACHI2_XZ

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `SETTING_EVIDENCE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### S_ENENN_SHOUBOUTAI_JS

Groups: 3; independent decisions: 3; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `ENEN_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `ENEN_JAC` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `ENEN_REG` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### S_FAMISTA_KAIDO_FB

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EV_BIG_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EV_REG_BGM` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### S_GRANBELM_ZX

Groups: 3; independent decisions: 3; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EV_END_SCREEN` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EV_NAKAMIMIERU` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EV_TROPHY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### S_GUNDAM_UNICORN_SF

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `UNICORN_ED_NTD` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `UNICORN_ED_STRONG_RARE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### S_HAIYORE_NYARUKO_SAN_Y

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `SETTING_EVIDENCE` | EXISTING_UNIQUE_OBSERVATION_CANDIDATE | SOURCE_SET_NOT_MACHINE_READABLE | CONFIRM_EXISTING_OBSERVATION_EXACT_UNIVERSE | `OBS_SETTING_EVIDENCE` | Stop until a human or authoritative artifact confirms that the unique Observation represents exactly the selected Research Evidence universe. |

### S_HIDAN_NO_ARIA_II_JZ

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EVID_AT_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVID_PREMIUM_AT` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### S_KACHO_KUMADA_GZA

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `KUMADA_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `KUMADA_PAYOUT` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### S_KIZUMONOGATARI_FS

Groups: 3; independent decisions: 3; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `KIZU_AT_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `KIZU_ED_PANEL` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `KIZU_PAYOUT` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### S_KONOSUBA_ZR

Groups: 3; independent decisions: 3; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EVG_AT_END_VOICE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVG_BONUS_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVG_DEBT_LINE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### S_MADE_IN_ABYSS_EN

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `ABYSS_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### S_MAHOIKU_NB

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `SETTING_EVIDENCE` | EXISTING_UNIQUE_OBSERVATION_CANDIDATE | SOURCE_SET_NOT_MACHINE_READABLE | CONFIRM_EXISTING_OBSERVATION_EXACT_UNIVERSE | `OBS_SETTING_EVIDENCE` | Stop until a human or authoritative artifact confirms that the unique Observation represents exactly the selected Research Evidence universe. |

### S_MHW_ICEBORNE_ZF

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EVID_CONFIRM_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVID_SPECIAL` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### S_MILKY_HOMES_GNB

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EVID_MMB_ROULETTE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVID_TOUCH` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### S_MOMOKYUN_SWORD_DX

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `SETTING_EVIDENCE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### S_MY_FLOWER_II_EE_30

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `MYFLOWER_PANEL` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### S_NIGHTS_YTCC

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EV_END_COMBO` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EV_TROPHY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### S_RAKUEN_TSUHO_FS

Groups: 3; independent decisions: 3; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EVG_AT_END_HARD` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVG_CZ_END_HARD` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVG_PAYOUT` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### S_SENGOKU_KOIHIME_FC

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EV_BIG_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EV_REG_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### S_SENGOKU_MUSOU3_ZYTCD

Groups: 4; independent decisions: 4; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EVID_AT` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVID_BONUS_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVID_REG` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVID_TROPHY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### S_SHIN_ORE_NO_SORA_ST

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `SETTING_EVIDENCE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### S_SHIN_TENKAFUBU_DD

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `TENKA_END_LAMP` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `TENKAFUBU_TROPHY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### S_SUHANA_RISING_PC30

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `SUHANA_7SEG` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `SUHANA_FEATHER` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### S_SUPER_RIO_ACE_CC

Groups: 3; independent decisions: 3; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `ENDING` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `KEROTTO_TROPHY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `PAYOUT` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### S_TATE_NO_YUSHA_KS

Groups: 5; independent decisions: 5; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `EVID_AT_END` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVID_AT_VOICE` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVID_EXP` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVID_PAYOUT` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `EVID_TROPHY` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### S_TEKKEN4_ULTIMATE_DEVIL_TCD

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `SETTING_EVIDENCE` | EXISTING_UNIQUE_OBSERVATION_CANDIDATE | SOURCE_SET_NOT_MACHINE_READABLE | CONFIRM_EXISTING_OBSERVATION_EXACT_UNIVERSE | `OBS_SETTING_EVIDENCE` | Stop until a human or authoritative artifact confirms that the unique Observation represents exactly the selected Research Evidence universe. |

### S_WARAU4_KH

Groups: 2; independent decisions: 2; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `PAYOUT` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |
| `REG_END_HARD` | NO_EXISTING_OBSERVATION_CANDIDATE | NOT_APPLICABLE | CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED | - | Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories. |

### S_YOUJO_SENKI_ZR

Groups: 1; independent decisions: 1; one-session review: yes.

| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |
|---|---|---|---|---|---|
| `SETTING_EVIDENCE` | EXISTING_UNIQUE_OBSERVATION_CANDIDATE | SOURCE_SET_NOT_MACHINE_READABLE | CONFIRM_EXISTING_OBSERVATION_EXACT_UNIVERSE | `OBS_SETTING_EVIDENCE` | Stop until a human or authoritative artifact confirms that the unique Observation represents exactly the selected Research Evidence universe. |
