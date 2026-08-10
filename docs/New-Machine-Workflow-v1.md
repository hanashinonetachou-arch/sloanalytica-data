# 新機種追加CLI / Management Flow v1

## 目的
Phase 2〜4で分離した処理を、公開データを壊さない1つの管理フローにまとめる。

## 基本フロー
1. `npm run machine:new -- init MACHINE_ID`
2. `research/MACHINE_ID/research-data.json` をWeb調査結果で完成させる
3. `npm run machine:new -- run MACHINE_ID`
   - ResearchData検証
   - Statistical Evaluator
   - SelectionData検証
   - MachineData Builder
   - 既存機種ならセクション単位の差分要約
4. `build/MACHINE_ID/workflow-report.json` が `READY_FOR_REVIEW` なら人間/AIが例外部分のみレビュー
5. 公開反映は別工程。v1 CLIは `machines/` と `catalog.json` を変更しない。

## usage節約
正常な定型処理はローカルのみで完結する。AIへ渡すのはResearchData作成、SelectionDataの判断、またはworkflow-reportのFAIL/差分だけ。

## 状態確認
`npm run machine:new -- status MACHINE_ID`

## 出力
- `build/MACHINE_ID/statistics-report.json`
- `build/MACHINE_ID/machine-package.generated.json`
- `build/MACHINE_ID/workflow-report.json`

## 安全原則
- 途中失敗で即停止する。
- 公開データを自動上書きしない。
- catalog.jsonを自動変更しない。
- 生成ドラフトのSHA-256をレポートへ記録する。
