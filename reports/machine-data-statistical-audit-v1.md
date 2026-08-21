# MachineData Statistical Audit — Phase 1

- Machines: 101
- PASS: 94
- REVIEW: 3
- HIGH_RISK: 4

## Statistical flag counts

- DIFFICULTY_EXPOSURE_MISSING: 3
- EVIDENCE_FEATURE_OVERLAP: 4
- LOW_FREQUENCY_7000G: 1
- OLD_RESEARCH_STANDARD: 1
- STATE_DEPENDENT_SIMPLE_MODEL: 2

## Priority ranking

| # | Machine | Status | Score | Statistical flags |
|---:|---|---|---:|---|
| 1 | パチスロ コードギアス 反逆のルルーシュ3 C.C.&Kallen ver. (S_CODE_GEASS_3_CC_FS) | HIGH_RISK | 21 | EVIDENCE_FEATURE_OVERLAP, EVIDENCE_FEATURE_OVERLAP, EVIDENCE_FEATURE_OVERLAP, EVIDENCE_FEATURE_OVERLAP |
| 2 | Lバキ 強くなりたくば喰らえ!!! (L_BAKI_L3) | HIGH_RISK | 9 | DIFFICULTY_EXPOSURE_MISSING, OLD_RESEARCH_STANDARD |
| 3 | スマスロ バイオハザード:ヴェンデッタ (L_BIOHAZARD_VENDETTA_FK) | HIGH_RISK | 8 | DIFFICULTY_EXPOSURE_MISSING |
| 4 | HEY！エリートサラリーマン鏡 (L_HEY_ELITE_SALARYMAN_KAGAMI_PA4) | HIGH_RISK | 8 | DIFFICULTY_EXPOSURE_MISSING |
| 5 | 沖ドキ！ゴージャス25Φ (S_OKIDOKI_GORGEOUS_GS) | REVIEW | 3 | STATE_DEPENDENT_SIMPLE_MODEL |
| 6 | スマスロリノヘブン (L_ANOTHER_RINO_HEAVEN_CC) | REVIEW | 2 | STATE_DEPENDENT_SIMPLE_MODEL |
| 7 | スマスロ真・北斗無双 (L_HOKUTO_MUSOU_FS) | REVIEW | 2 | LOW_FREQUENCY_7000G |

## Interpretation

- HIGH_RISK is a manual re-research priority, not an automatic assertion that the current MachineData is wrong.
- Estimated/derived difficulty exposures and UI wording signals are recorded as info but do not inflate Phase 1 risk ranking.
- No MachineData is modified by this audit.
