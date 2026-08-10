# MachineData 登録・更新ワークフロー

対象ブランチは `prototype-multi-machine` です。初回公開用の `main` は、この手順の対象外です。

## 0. 作業開始前

- [ ] GitHub Desktopで公開データリポジトリ `sloanalytica-data` を開く。
- [ ] 現在のブランチが `prototype-multi-machine` であることを確認する。
- [ ] 更新対象の機種IDと、更新か新規登録かを決める。
- [ ] 作業開始時点の変更一覧を確認し、無関係な変更を混ぜない。

## 1. 公開情報の調査

- [ ] 対象機種の正式名称、型式名、メーカー、設定一覧を確認する。
- [ ] 設定差のある解析値を出典URL・確認日とともに記録する。
- [ ] 数値が出典間で一致しない場合は、推測で補完せず保留または除外する。
- [ ] Evidenceは設定確定・設定否定・設定下限など、アプリ仕様に適合するものだけを記録する。

## 2. 統計的・実戦的な採否

- [ ] 少ない試行でも役立つか、長時間で意味があるかを評価する。
- [ ] 同じ観測を複数Featureで重複評価しない構造にする。
- [ ] 設定差が小さすぎる、または必要試行数が重すぎる要素は`DISPLAY_ONLY`または不採用にする。
- [ ] モデル種別（binomial / multinomial / poissonなど）と、対象となる通常時・AT中などの範囲を明確にする。

## 3. MachineData の作成・更新

- [ ] `machines/<machineId>/machine-package.json` を作成または更新する。
- [ ] `machine.machineId`、`machine.machineDataVersion`、`machine.settings`を確認する。
- [ ] 入力ID、Feature ID、Evidence IDが重複していないことを確認する。
- [ ] Feature・Evidence・UIが参照する入力IDを確認する。
- [ ] Featureの設定別確率、重み、モデル種別が有効な値であることを確認する。
- [ ] `DISPLAY_ONLY`は推測計算へ参加しない定義にする。
- [ ] auto accumulatorを使う場合は、選択入力・条件入力・除外値・選択範囲を定義する。

## 4. catalog.json の更新

- [ ] 対象機種の`machineDataVersion`をMachineDataと一致させる。
- [ ] 対象ファイルのSHA-256とバイト数を更新する。
- [ ] MachineDataが使う機能を`requiredCapabilities`へ宣言する。
- [ ] 新規機種なら`machines`へ1件だけ追加し、machineId重複がないことを確認する。
- [ ] `generatedAt`を更新する。

`requiredCapabilities`の例：

- binomial / multinomial / poisson：対応する確率モデルを使用
- conditional_partial_multinomial / conditional_partial_binomial / marginal_multinomial：拡張モデルを使用
- evidence：Evidenceがある
- reference_display：`DISPLAY_ONLY`または参考表示Featureがある
- auto_accumulator：UIに`auto_accumulator`がある

## 5. Commit前の自動監査

リポジトリ直下で、次を実行します。

```text
npm run audit
```

自動化・大量機種管理では、必要に応じて次も実行します。

```text
npm run audit:report
```

`reports/audit-report.json` を後続処理の入力にし、`PASS`なら人手確認を省略、`WARNING`/`ERROR`がある場合だけ対象項目を確認します。

- [ ] `OK: <機種数>機種を監査しました（警告 0件）`を確認する。
- [ ] `FAILED`が出た場合は、機種IDと表示内容に沿って修正し、再実行する。
- [ ] 監査ツール自体を変更した場合のみ、追加で`npm test`を実行する。

## 6. アプリでの確認

- [ ] カタログから追加できる。
- [ ] 入力画面の項目・補足・折りたたみが正しい。
- [ ] 計算結果が表示され、確率の合計が100%になる。
- [ ] Evidenceが正しく候補を絞り込む。
- [ ] 履歴保存・詳細表示・削除ができる。
- [ ] 更新通知と更新後の入力・履歴保持を確認する。
- [ ] ライト／ダークモードを確認する。

## 7. GitHub Desktop でのCommit

- [ ] GitHub Desktopで変更ファイルが今回の対象だけであることを確認する。
- [ ] Summaryに変更内容を簡潔に記入する。
- [ ] Commit後、必要なタイミングでPushする。

公開用の`main`へ反映する判断と操作は、試作ブランチでの監査・実機確認が完了してから別途行います。
