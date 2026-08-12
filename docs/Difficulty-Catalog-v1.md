# Difficulty Catalog v1

## Purpose
Difficulty Scoreは機種推測計算そのものではなく、スロアナリカ側の横断評価メタデータ。
MachineDataから分離し、全機種のスコアを一括再計算・一括公開できるようにする。

## Files
- `catalog.json`
  - `difficultyCatalogUrl`
  - `difficultyCatalogSchemaVersion`
- `difficulty-catalog.json`
  - 全機種のDifficulty表示情報

## Benefits
- 暫定→正式スコア切替時に各MachineDataを更新しない
- machineDataVersion / SHA / packageSizeをDifficultyだけの理由で更新しない
- Analyzer更新時にDifficulty Catalogだけ一括再生成可能
- scoreRange / confidence / rejectedFeaturesも同じ場所で管理

## User wording
内部語 `Hard Evidence` はユーザー表示しない。
`設定確定情報` を使用する。

## Backward compatibility
Appは当面、Standalone Difficulty Catalogを優先。
取得不能時だけ旧MachineData.difficultyへfallback可能な設計とする。
