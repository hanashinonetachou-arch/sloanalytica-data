# Difficulty Display Contract v1

Appの入力・結果・履歴で共通の「この機種の設定推測について」モーダルを表示するためのデータ契約。

## MachineData.difficulty
- `status`: `SCORED` / `EVIDENCE_DOMINANT` / `NOT_CONFIGURED`
- `isProvisional`: 現在のRaw Scoreが暫定値か
- `scoreModelVersion`: Analyzer version
- `scores`: 1500G / 3000G / 7000G のRaw Score
- `scoreRange`: 将来の「スコアの目安」用。現時点はnull
- `confidence`: 内部用。v1 UIでは直接表示しない
- `profile`: `NUMERIC` / `EVIDENCE_DOMINANT` / `UNKNOWN`
- `uiPolicy`: 共通モーダルの表示方針

## 共通UI文言
共通説明文はMachineDataへ重複格納せず、Appの共通コンポーネントで管理する。

ボタン:
`この機種の設定推測について`

SCORED:
- `設定推測スコア（暫定）`
- 1500G / 3000G / 7000G
- `スコアが高いほど、実戦データから設定の違いを見分けやすいことを表します。`
- `※現在のスコアは開発中の評価基準による暫定値です。`

Range実装後:
- 項目名 `スコアの目安`
- `範囲が狭いほど、このスコアを安定して評価できます。`

EVIDENCE_DOMINANT:
- 数値スコアを0/1で表示しない
- `数値による設定推測が難しい機種です`
- 不採用理由＋算出可能な必要試行数を前面表示

History:
Difficultyは履歴保存時Snapshotへ固定しない。履歴画面のモーダルも最新MachineData.difficultyを参照する。
