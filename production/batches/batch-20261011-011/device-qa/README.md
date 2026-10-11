# Batch011 実機QA引き継ぎ

ResearchからDistributionまでの10機種は既存OrchestratorでCOMPLETE。Android実機QAは全10機種HUMAN_REQUIREDであり、PASSではありません。

- Data配信コミット: `4bb6f44edce84efa795be2dc845eef1e8dc6431c`
- App QAブランチ: `qa/batch011-v85-20261011`
- Appコミット: `9e5b682fd5002b09760c163ced1b852377546923`
- APK CI: https://github.com/hanashinonetachou-arch/sloanalytica-app/actions/runs/38127118771
- APK: `SloAnalytica-Batch011-10Machine-vc2002832727.apk`（versionCode 2002832727）
- 証明書SHA256: `1c01974fc54a2c351539147179944dbab5a5104d92b9447c36e04f50cbf45ea0`（前回と一致）
- APK SHA256: `d03a003644b543ef5a3ff66dc6f4324cc49a1115dd33a0020519e1165301c3ca`

Productionテスト392件PASS、既存6機種Golden PASS、10機種表示監査PASS、配信中V8.5全110機種のApp互換性PASS。カタログ273件のSHA256・サイズ・機種識別メタデータ整合性を確認。既存6機種の配信ファイルは変更前とバイト単位で一致。

## 実機で確認すること

`handoff.json` の `userDeviceChecks` に従い、上書きインストール、機種データ更新、タブ切替時の条件別入力保持、母数の区別、設定確定・否定反映、履歴復元と可読性を確認してください。結果は機種名・確認項目・PASS/問題・端末/Androidバージョンとともに記録してください。

Batch009・010の既存承認と未承認QAはそのまま保持しています。今回の自動検証だけで過去の未承認QAをCOMPLETEにしていません。

## 再開

Dataの `production/v85-batch-011-research-20261011` の最新HEADから `work-checkpoint.json`、`device-qa/handoff.json`、各機種のstageファイルとOPEN action requestsを読み、最後の有効な状態から再開します。APKやResearchを無条件に再生成する必要はありません。Workストリーム内部の復旧・タイムアウトは制御対象外です。
