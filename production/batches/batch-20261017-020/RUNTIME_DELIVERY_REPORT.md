# Batch020 — QA指摘修正 R2 完了

番長4の共通ベルの誤った一括除外を解除し、既存の採用基準で再判定した結果、採用へ変更しました。小役の出現回数とAT直撃の当選回数を「同じ当選情報」として扱う根拠が不足していました。同じ母数の使用だけでは重複としない既存の規則を適用し、完全な統計的独立が証明されたとは主張していません。

- 共通ベルの全6設定の公表確率は変更なし。正式な7000Gスコアは捏造せず、既存の1回あたり評価・Runtime Policyを維持。
- 共通ベルの母数は「実戦総G−エンブレム・ED中G」を自動使用。この区間のベルも数えません。AT直撃は従来の通常Gを使用します。
- 番長4の機種データは `8.5.2-batch-20261017-020`。他272機種の配信パッケージ・カタログ項目は変更していません。
- 不採用理由が完全一致する項目はアプリ共通で1つの枠へ集約。全項目名・個別スコア等を残し、理由は1回だけ表示。部分一致・近い意味・空白違いによる統合は行いません。保存された採否データは項目別のまま保持します。

Production回帰467件成功。完全一致／非一致の表示テスト、母数の自動計算、番長4の採用・設定値・依存関係の回帰テストが成功。10機種のUI・実アプリ計算と、V8.5全200機種の互換性検証も成功。110工程成果物のSHA一致を確認しました。

配信：`078b34f52c18b4e2709a7a9aacf96590ea1450a3`。

修正版APK：`SloAnalytica-Batch020-R2-10Machine-vc2002892148.apk`。固定開発署名とSHAを検証済み。詳細は `qa-apk-receipt.json`、今回の再判定根拠は `qa-revisions/reason-group-r2/common-bell-review.json` に記録しています。

[データ統合](https://github.com/hanashinonetachou-arch/sloanalytica-data/actions/runs/39012691469)・[配信先更新](https://github.com/hanashinonetachou-arch/sloanalytica-data/actions/runs/39012746993)・[アプリ検証とAPK生成](https://github.com/hanashinonetachou-arch/sloanalytica-app/actions/runs/39012576891)は成功しました。Actionsは修正の統合境界での3実行です。

実機QAは未実施です。ユーザーによる完了・承認としては扱っていません。
