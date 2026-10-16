# 最新確定状態（2026-10-17 08:06 JST）

ユーザー「QA問題なしでした。」を受け、防振りの修正後QAを既存経路で正式受理。Batch018の10機種は全12工程・120 stageがCOMPLETE。防振り以外9機種は元APK vc2002885170、防振りの表示修正はvc2002886741で確認済み。各受理の固定App/Data/QA参照は保持し、9機種を新APKで再検証済みとは扱わない。

正本は `completion-summary.json`、`device-qa/completion.json`、各機種stage、受理成果物。未解決のQA・表示修正はない。参考サイト名を画面へ出さない共通修正・量産規則は維持。次の新規作業は次のユーザー指示に従う。以下のQA待ち記述は過去時点の履歴で、この確定状態により上書きされる。

# 最新修正・受理状態（2026-10-17）

防振り以外9機種はユーザー確認により正式DEVICE_QA COMPLETE。防振りは画面文言修正の確認待ち。参考サイト名の画面表示はApp共通処理で除去し、Research出典記録は保持。修正版APK・CI結果は `device-qa/handoff.json`、対応詳細は `device-qa/SOURCE_NEUTRAL_COPY_FIX.md`。以下は初回配信時点の記録。

# Batch018 配信・APK完了 / 実機QA待ち

2026-10-17。対象10機種はResearchからDistributionまで正式COMPLETE（11工程×10機種）。DEVICE_QAは10機種ともHUMAN_REQUIRED。実機QAは未実施・未受理。

元99候補を保持して33候補追加、計132候補。Research findings88件・理由付きBLOCK44件。既存Evaluatorで63件評価（参考分布3件を含む）、数値Contract候補60件、Evidence候補25件。依存解決後の代表31件へRuntime Policyを適用し、ACTIVE数値特徴30件。これらの件数は同一意味の「採用数」ではない。

## 公開と検証

- Data作業正本: `production/v85-batch-018-research-20261017`。
- 配信コミット: `34f01c4e3be2381e25b44e79ceb58e74fc8ede90` (`prototype-multi-machine`)。
- App QAコミット: `db7992b31ececb0abdfab3f7d4dfb83ab01e9339` (`qa/batch018-v85-20261017`)。
- [Data Integration](https://github.com/hanashinonetachou-arch/sloanalytica-data/actions/runs/38937760438): SUCCESS。正式Validator、既存機種保護、カタログ順序、UX/機種同定監査、Pages、Distributionを実行。
- [App QA/APK](https://github.com/hanashinonetachou-arch/sloanalytica-app/actions/runs/38938096567): SUCCESS。lint/全Appテスト、対象10機種のRuntime・残余ゲーム数・描画検証、V8.5全180機種の互換性検証、署名ビルドを実行。
- 公開Pagesから10機種を再取得し、配信正本のSHA256・サイズ・データ版と全件一致。
- 対象外263機種のpackage/catalog変更は0件。
- 実際のApp出力レポートを用いた既存QA readiness Validator: 10/10 QA_READY。
- Runtime関連36回帰テストPASS。Appの理由文は内部候補IDを対応項目名へ置換し、安定IDメタデータを保持。

## 実装へ反映した観測条件

アオハルの白7／ピンク7狙いは別の対象ゲーム母数を使用。金文字REG→BIGの設定1否定は数値と同じ入力。防振りの終了画面は3G帯別タブ、サブ液晶とともに公開数値・確定制約を同一入力へ結合。紹介順依存の分布は参考経路を維持。中段チェリーの資料間矛盾はBLOCKのまま。シンフォギアの終了画面／隠しボイスは同じ観測機会の2タブ。

北斗無双では非ACTIVE特徴の母数から総ゲーム数ラベルを誤投影しないよう量産builder/validatorを修正。説明が入力ラベルそのものを重複しないようCanonical UI生成も修正。新しい採否式・閾値は導入していない。

## APKと次工程

APK: `SloAnalytica-Batch018-10Machine-vc2002885170.apk`。versionCode `2002885170`、versionName `1.0.1-batch018-10machine.vc2002885170+db7992b3`、4,508,976 bytes。

SHA256: `ea6107c323326b67945841c7941a6a69770ec0fcee0e2c9985919e6f78d46123`。

apksigner検証PASS、前回と同じ固定開発証明書。ActionsのAPK/アーカイブと保存バイトのハッシュ一致。APKの参照・固定コミット・検証結果は `device-qa/handoff.json`、端末確認は `device-qa/CHECKLIST.md`。ユーザーの実機結果を受けて既存DEVICE_QA受理経路で進む。ビルドや自動検証から端末受理を推定しない。

再開は `WORK_EXECUTION_PROMPT.md`。正本ブランチを取得し、各stage・入力参照・Validator証跡を再利用する。Researchを作り直さず、過去Batchの承認状態を変更しない。
