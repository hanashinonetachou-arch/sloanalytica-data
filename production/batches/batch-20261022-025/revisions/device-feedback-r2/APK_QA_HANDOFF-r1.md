# Batch025 — QA用APK生成完了

2026-10-22（日本時間）。ユーザーの明示指示で対象範囲を実装・配信・APK生成まで拡張した。

- Research → Candidate Contractの確定成果物を再利用。公開情報の再調査・元Researchの再生成なし。
- Observation Evidence → Canonical UI → MachineData → Runtime Policy → Runtime Projection → App Runtime → Distributionを10機種分正式受理。Researchから配信まで110ステージの正本SHA256・上流参照を検証済み。
- 実機QAは10機種ともHUMAN_REQUIRED。ユーザーのQA受理は記録していない。他Batchの既存QAは変更していない。

## 正本

- Data control: `production/v85-batch-025-contract-20261022`。今回の実装・配信スコープは `apk-scope-authorization.json`。
- Data distribution: `prototype-multi-machine` / `1f159719387fc132ea58ba97f3c4ad3c807cf78c`。
- App: `qa/batch025-device-qa-20261022` / `6626eb69b6bd63b070fca3c32cc918f1c6bad61d`。
- Data PR: https://github.com/hanashinonetachou-arch/sloanalytica-data/pull/473
- App PR: https://github.com/hanashinonetachou-arch/sloanalytica-app/pull/134
- APK build: https://github.com/hanashinonetachou-arch/sloanalytica-app/actions/runs/39742972052

## APK

- `SloAnalytica-Batch025-vc2002942338.apk` / 4,510,425 bytes。
- package: `com.sloanalytica.settingtool`。
- versionCode: `2002942338`。前回QA版 `2002932925` より新しい。
- SHA256: `f53d74d838eaf3279313c356bd240c126e6d537b3f12c24a6eb5721a52643e5e`。
- certificate SHA256: `1c01974fc54a2c351539147179944dbab5a5104d92b9447c36e04f50cbf45ea0`。前回Revue QA版と一致。
- persistent file ID: `libfile_b778792adb208191be9298772add7137`。
- APK内部の `assets/public/qa/batch025.json` を読んで、App commit・Data commit・CI run・全10機種のハッシュ・回帰250機種PASSを照合済み。

## 検証

- 今回10機種: 実際のAppで描画・タブ切替・入力・設定推測・確定制約・未知確率の記録のみ経路がPASS。
- v8.5既存機種を含む250機種の回帰: PASS、失敗0。
- 不採用説明: 193要素を47説明枠へ整理。対象名を1件ずつ箇条書きで保持。
- Dataの共有UI生成・App Runtime・Runtime Projection等の78回帰テスト: PASS。
- App: TypeScript、全テスト、prototype build、Android build、固定署名・versionCode検証がPASS。
- 配信Pages・機種同定・既存UX保護チェック: 最終Data commitですべて成功。
- 他263機種のパッケージ・カタログ項目は変更なし。差分は今回10パッケージとカタログのみ。

## 実装上の要点

- 設定Vを1・2・3・4・Vのまま扱い、5/6へ置換しない。BIG・REGは排他的な1モデル、その他は内部計算。公開合算値は二重加算しない。
- ハナビは総G入力に統一。ボーナス中・RT中の別母数と、ピース花火の1枚役回数条件は維持。
- 条件別の画面・JAC・カットイン等はタブ統合し、観測回数を別々に保持。
- サンダーVの保護済み着席時ゲーム数・BIG・REGのID、名称、順序、観測区間を維持。その他Gは自動計算し、不整合な内訳は推測へ使わない。
- 形式・表示の訂正履歴は `revisions/` に保存。未公表確率、数値衝突、未確認条件は元の除外・再開条件を保持。

## 再開地点

次はこのAPKでの実機QA。`device-qa/handoff.json`、各DEVICE_QA stage、action-requestsを正本とする。ユーザーのQA結果を受けて必要箇所だけ修正し、正式受理する。既存Batchを再初期化・Researchを再生成しない。
