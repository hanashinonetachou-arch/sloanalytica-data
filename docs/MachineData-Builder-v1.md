# MachineData Builder v1

## 目的
ResearchData（公開事実）と SelectionData（採用判断・入力対応）から、MachineData の下書きをローカル生成する。

## 設計原則
- ResearchData だけから入力IDや入力共有関係を推測しない。
- AI/人間が確認する対象を SelectionData に縮小する。
- Builder は確率値・出典・機種情報を ResearchData からコピーし、定型JSONを生成する。
- EXCLUDE はMachineDataへ出力しない。
- Binomial / Poisson / Multinomialに対応する。
- EvidenceはSelectionDataで入力対応とtriggerを指定したものだけ生成する。
- UI文章、selectionRationale、特殊inputTransform、派生入力などはv1では自動推測しない。必要時は後段で追加する。

## 実行
`npm run machine:build -- research/<machine>/research-data.json research/<machine>/selection-data.json build/<machine>/machine-package.json`

## 今後の位置づけ
ResearchData -> Statistical Evaluator -> SelectionData -> MachineData Builder -> Auditor


## observed_ratio_to_trials
外部集計サービス（マイスロ等）が「観測回数」と「実測 1/○○」を表示する場合に、
`trialCountInputId × denominatorInputId` を四捨五入して内部試行数へ復元する。

これは、アプリ側で区間ゲーム数の定義を推測・再構成せず、外部集計側の実測分母を利用するための汎用変換である。

## Conditional multinomial categories

When published multinomial categories include hard-confirmation categories that are handled separately by Evidence, SelectionData may set `categoryExcludeLabels` on the multinomial feature. The Builder removes those published categories from numeric inputs and renormalizes the remaining published probabilities per setting. This avoids duplicate manual entry and preserves Hard Evidence as the authoritative path for confirmation categories. The original ResearchData distribution remains unchanged and auditable.
