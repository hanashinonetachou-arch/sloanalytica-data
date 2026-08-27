# 10-machine Selection regeneration audit — 2026-08-27

## Scope

ResearchData再監査後の10機種について、`selection-batch/SELECTION_20260827025519` でSelectionDataを再作成し、`research/<machineId>/selection-data.json` へ正式反映した。

対象:

- L_CHIBARIYO2_PLUS_ZC
- L_DUMBBELL_X
- L_INUYASHA2_FK
- L_SUPER_BINGO_NEO_SB5
- L_TOARU_ACCELERATOR_RZ
- S_HIDAN_NO_ARIA_II_JZ
- S_MHW_ICEBORNE_ZF
- S_MILKY_HOMES_GNB
- S_SENGOKU_MUSOU3_ZYTCD
- S_TATE_NO_YUSHA_KS

## Selection policy applied

- 統計値だけでFeatureを自動採用しない。
- 同一分母、親子事象、因果チェーン上の上流/下流を同時採用して同じ引きを二重評価しない。
- 観測条件・分母定義が実機で曖昧なFeatureはResearchに保持してもSelection本体では保守的に不採用とする。
- ResearchDataのEvidenceCandidateは黙って落とさず、`evidenceUi.options[].sourceEvidenceIds` へ接続するか `evidenceReview.exclusions` で明示的に除外する。
- 今回採用したEvidenceCandidateはすべてUIへ接続し、Evidenceの意図的な除外はなし。

## Primary numeric selections

| machineId | selected numeric Feature(s) |
|---|---|
| L_CHIBARIYO2_PLUS_ZC | RF_BONUS_TOTAL |
| L_DUMBBELL_X | RF_AT_INITIAL |
| L_INUYASHA2_FK | RF_AT_INITIAL |
| L_SUPER_BINGO_NEO_SB5 | RF_AT_INITIAL |
| L_TOARU_ACCELERATOR_RZ | RF_CZ_TOTAL |
| S_HIDAN_NO_ARIA_II_JZ | RF_AT_INITIAL, RF_COMMON_BELL (Difficulty除外) |
| S_MHW_ICEBORNE_ZF | RF_CZ_TOTAL |
| S_MILKY_HOMES_GNB | RF_BONUS_TOTAL, RF_WEAK_WATER, RF_PUSH_NAV |
| S_SENGOKU_MUSOU3_ZYTCD | RF_BONUS_TOTAL |
| S_TATE_NO_YUSHA_KS | RF_AT_INITIAL |

## Formal reflection status

All 10 SelectionData files have been written to `research/<machineId>/selection-data.json` on `prototype-multi-machine`.

## Validation status

Static contract review was performed against the current SelectionData validator and batch evidence-coverage contract while constructing the files.

The repository executable validation commands have **not** been executed in this connector session. Therefore this report does not claim an `npm run selection:validate` or `npm run selection:batch -- --ingest ... --check` PASS.

Recommended executable validation before proceeding to Observation/MachineData generation:

```cmd
npm run selection:batch -- --ingest selection-batch/SELECTION_20260827025519 --check
```

If this check passes, the Selection layer can be treated as executable-gate verified and the workflow can proceed to Observation / UI Design / MachineData generation.
