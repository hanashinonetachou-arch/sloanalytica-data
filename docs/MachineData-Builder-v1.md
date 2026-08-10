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
