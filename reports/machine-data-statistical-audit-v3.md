# MachineData Statistical Audit — Phase 1 v3

- Machines: 101
- PASS: 94
- REVIEW: 1
- HIGH_RISK: 6

## Statistical flag counts

- DIFFICULTY_EXPOSURE_MISSING: 3
- EVIDENCE_FEATURE_OVERLAP: 4
- LOW_FREQUENCY_7000G: 1
- OLD_RESEARCH_STANDARD: 1
- RESEARCH_RESOLUTION_DRIFT: 5

## Priority ranking

| # | Machine | Status | Score | Statistical flags |
|---:|---|---|---:|---|
| 1 | パチスロ コードギアス 反逆のルルーシュ3 C.C.&Kallen ver. (S_CODE_GEASS_3_CC_FS) | HIGH_RISK | 31 | EVIDENCE_FEATURE_OVERLAP, EVIDENCE_FEATURE_OVERLAP, EVIDENCE_FEATURE_OVERLAP, EVIDENCE_FEATURE_OVERLAP, RESEARCH_RESOLUTION_DRIFT, RESEARCH_RESOLUTION_DRIFT |
| 2 | L 東京喰種 (L_TOKYO_GHOUL) | HIGH_RISK | 10 | RESEARCH_RESOLUTION_DRIFT, RESEARCH_RESOLUTION_DRIFT |
| 3 | Lバキ 強くなりたくば喰らえ!!! (L_BAKI_L3) | HIGH_RISK | 9 | DIFFICULTY_EXPOSURE_MISSING, OLD_RESEARCH_STANDARD |
| 4 | スマスロ バイオハザード:ヴェンデッタ (L_BIOHAZARD_VENDETTA_FK) | HIGH_RISK | 8 | DIFFICULTY_EXPOSURE_MISSING |
| 5 | HEY！エリートサラリーマン鏡 (L_HEY_ELITE_SALARYMAN_KAGAMI_PA4) | HIGH_RISK | 8 | DIFFICULTY_EXPOSURE_MISSING |
| 6 | L 無職転生 ～異世界行ったら本気だす～ (L_MUSHOKU_TENSEI_NM) | HIGH_RISK | 7 | RESEARCH_RESOLUTION_DRIFT |
| 7 | スマスロ真・北斗無双 (L_HOKUTO_MUSOU_FS) | REVIEW | 2 | LOW_FREQUENCY_7000G |

## Interpretation

- HIGH_RISK/REVIEWは再調査優先度であり、自動的にMachineDataが誤りという意味ではありません。
- Research conflictは同一targetの最後のresolved記録を現行方針として評価します。
- UI説明・非標準weight・ESTIMATED exposureは後続Phase用infoとして保持し、Phase 1順位を膨らませません。
- この監査はMachineDataを変更しません。
