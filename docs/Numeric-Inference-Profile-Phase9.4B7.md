# Numeric Inference Profile — Phase 9.4B-7

## Purpose
MachineDataごとに「数値Featureがどの程度存在するか」を構造的に分類し、
数値推測が成立しない機種では不採用Featureの理由・必要試行数を前面表示できるようにする。

## Profiles
- `NORMAL`: 採用数値Featureが2件以上。
- `LIMITED`: 採用数値Featureが1件。
- `EVIDENCE_DOMINANT`: 採用数値Featureが0件でHard Evidenceが1件以上。
- `NO_NUMERIC_INFERENCE`: 採用数値FeatureもHard Evidenceも0件。

## UI policy
`EVIDENCE_DOMINANT` / `NO_NUMERIC_INFERENCE` は `REJECTED_FEATURES_FIRST` 相当の表示を優先する。
不採用理由は短文のまま保持し、統計的に算出できる場合だけ `requiredTrials80` を別情報として表示する。

例:
- BONUS初当り
- 不採用理由: `設定差が小さい。`
- 80%識別目安: `約423,584G`

算出不能なFeatureは `NOT_COMPUTABLE` とし、推測で数値を作らない。

## Calibration
採用数値Featureが0件の機種はDifficulty Scoreの横断校正について `NOT_APPLICABLE`。
これは未完成・エラーではなく、数値判別対象が存在しないという機種特性である。
その機種を横断校正全体のブロッカーにしない。

## Separation
Hard Evidenceの出現率をDifficulty Scoreへ再混入させない。
Evidenceは設定集合のHard Mask、Difficultyは数値尤度による判別性能として分離する。
