# Batch End-to-End Orchestrator v1

## Purpose

最大10機種について、Research → Selection → Machine の現在地を1つのレポートで確認する上位オーケストレーターです。

## Commands

状態確認のみ（デフォルト）:

```bash
npm run batch:e2e -- MACHINE_ID_OR_NAME_1 MACHINE_ID_OR_NAME_2
npm run batch:e2e -- --file batch.txt
```

安全に進められる工程だけ進行:

```bash
npm run batch:e2e -- --file batch.txt --advance
```

## Stages

- `RESEARCH_REQUIRED`: ResearchData未作成。Research Brief生成対象。
- `RESEARCH_REVIEW`: ResearchDataはValidation PASSだが警告・conflict・暫定表記あり。自動進行しない。
- `SELECTION_REQUIRED`: ResearchDataは確定、SelectionData未作成。Selection Brief生成対象。
- `SELECTION_REVIEW`: SelectionDataはValidation PASSだが警告あり。自動進行しない。
- `READY_FOR_MACHINE`: Research/Selectionが確定。Machine Batch `--check` 対象。
- `PUBLISHED`: catalog登録済みで現工程完了。
- `BLOCKED`: ID不明、Validation失敗、読取エラー等。自動進行しない。

## `--advance` safety

`--advance` は次だけを行います。

1. `RESEARCH_REQUIRED` → Batch Researchを呼びResearch作業票を生成。
2. `SELECTION_REQUIRED` → Batch Selectionを呼び統計レポート/Selection作業票を生成。
3. `READY_FOR_MACHINE` → Batch Machineを必ず `--check` で実行し、生成差分をロールバック。

以下は自動化しません。

- machineIdの推測
- 解析値・確率・分母の補完
- Feature採否、weight、入力mapping、difficultyExposureの意味判断
- REVIEW状態の自動通過
- Publish approve / catalog公開

## Unified report

デフォルト: `reports/batch-e2e-report.json`

主な内容:

- `overallStatus`
- stage別 `counts`
- `before` / `results`
- `actions`（呼び出した下位Batch CLI結果）
- 各機種の `nextAction`
- safety flags
