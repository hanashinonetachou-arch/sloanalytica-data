# 最新UI更新 — 2026-10-25

BIG前半の停止形（ベルB／ベルC／15枚リーチ目）、小役別の同時当選（5役）をそれぞれ1枠のタブへ統合。既存の終了画面3タブを維持し、主入力枠を11→5へ整理しました。ベルC・15枚リーチ目の誤表記も修正しています。入力ID・母数・確率・優先順位・保存対象の定義は同一です。共通計算処理・他機種は変更していません。

最新版は8.5.7、QA APK versionCode 2002970207。全11タブ描画、27ケース・26優先/代替経路、既存V8.5 250機種の検証と署名ビルドに成功。詳細は `presentation-tabs-20261025/handoff.json` と同ディレクトリのCI証跡を参照。着席前の0回入力操作・上部ゲーム数の説明など、先のセルフチェックの別課題は未修正です。実機QAは未承認です。

---

# サンダーV — V8.5による機種単独の再構成

2026-10-24のユーザー指示により、全体変更を破棄して再構成した。旧App #135・Data #474は未マージで取り下げ。App QAブランチ上に先行して存在した監査対応も、復元コミット `625682a2fa7e0d07c45a323eca083b4855f8117b` で監査前 `e161e1f352c4f2042550aee2bfdd04c7a1ed735e` と同じツリーへ戻した。

Data起点は `eeb059c717a4d42ee34a7d806574270bd9cd56d0`。旧修正ブランチをマージ・cherry-pickせず、既存V8.5のbuilders・validators・Runtime Policyを変更せずに使用した。外部監査で記録された未入力0、観測母数、REG代替経路、残余再正規化、着席前必須項目、BIG前半集計条件の問題を再構成の参考にした。新たな外部監査合格を表すものではない。

## 最終仕様

| 区分 | 計算方法・対象 |
|---|---|
| 通常時 | ベルB → チェリーB → ベルA → REG → スイカA → スイカBの順で、観測できた1項目のみを二項分布で評価 |
| BIG単独 | EIG7000×200=1.3329で既存閾値5未満。公開値は保持するが単独推測には使用しない |
| 同時当選 | 通常時の上記要素が未観測の場合だけ、スイカB → チェリーB → リプレイ → スイカA → ベルAの順で1項目を代替評価。各役の全成立と当否を確認した区間だけを入力 |
| BIG前半 | ベルB → ベルC → 15枚リーチ目の順で観測できた1項目を二項分布で評価。BIG前半だけの実際の試行数を母数とし、条件付き試行の既存PER_ELIGIBLE_TRIAL_POWERを使用 |
| 着席前 | 同一区間のG・BIG・REGを全て確認した場合だけ、従来の公表確率と自動算出残余による完全な多項分布を使用 |
| 終了画面 | 通常BIG・1G連BIG・REGの3区分を維持。条件付きの設定2以上・設定5以上制約を既存方式で適用。デフォルトを未知の出現率で重み付けしない |
| 参考保存 | BIG前半ベルA、内部契機の全件分類が確認できない赤7BIG・VBIG・REG詳細23候補。REGリーチ目役の資料矛盾は従来のBLOCKを維持 |

通常時の順序は変更前と同じ公表確率の正規EIG7000スコアに基づく。条件付き要素は7000通常Gへ架空換算せず、各群内で既存の1試行あたり情報量を比較した。最大でも通常時1項目・BIG前半1項目・着席前1項目の3数値要素を使用する。新しい共同分布・独立性・丸め許容幅は導入していない。

## 観測・保存

- ゲーム数欄は対象通常区間を明示し、ボーナス・BT中を除く。小役は成立後も除き、回数と対象区間をそろえる。RIZIN ZONE中の通常抽選は含み、雷神ループのBIG前半再開を新たな初当りへ増算しない。公表資料の厳密な試行定義との同一性を新たな採用条件にしていない。
- 未入力は計算対象外、明示0回は観測済み。優先要素の明示0は、下位要素へ切り替える理由にならない。
- 通常時母数は新しい `INP_THUNDER_VERIFIED_G_*` へ分離。旧「総G」を確認済み対象通常Gへ自動移行しない。画面上は既存の共通ゲーム数欄から各Featureへ束ねる。
- 旧BIG内訳の保存値を、新しい二項分布の成功回数へ自動変換しない。元履歴は元の定義・スナップショットのまま保持する。
- 着席前の入力ID・意味・公表確率は維持。自動残余は既存の厳密なlinear_combinationで作り、これを倍率0の既存denominatorAdjustmentsへ指定する。G・BIG・REGのいずれかが未入力・不正・合計超過なら母数の有効性を満たさず、計算しない。共通エンジンの修正は不要。
- 従来の多項分布の残余再正規化経路は、BIG前半では使用しない。着席前では全カテゴリの確率和が1の完全分布だけを渡す。新たな0.985/1.015ルールは導入しない。

## 実行・検証

サンダーVだけの変更で無効となる10段階を既存Orchestratorで受理し、`stage-receipts.json` に実際のバリデータ結果と成果物ハッシュを保存した。途中の入力ID修正ではObservation以降だけを更新し、Researchや評価の全件再実行を避けた。旧正本は `previous/`、変更前Observation成果物は `before-observation-alias/` に保持。

- 監査前App e161e1fの実際のFeature/Probability/Evidence engineで、再構成後仕様の27ケースを検証。
- 全14の優先・代替候補について、単独使用と上位候補との抑制を計26経路確認。
- Python/SciPyによる27事後確率の独立計算と一致。最大絶対誤差は `independent-check.json` を参照。
- 7候補のEIG7000を独立再計算し一致。全40公表値、Evidence3群、既存BLOCKは変更なし。
- 共通builders・config・validators、他機種の正本・QA履歴を変更していない。旧全機種回帰のPASSを今回の修正版検証へ流用していない。

27ケースは新しい優先/代替仕様の検証であり、取り下げた共同モデルの期待結果をそのまま合格と呼び替えたものではない。特にBIGのみ入力時は既存採用閾値に従い中立、BIG前半Bのみは二項分布、未観測時は代替へ切り替える。

実行例（Dataのproductionディレクトリ）:

```sh
node --experimental-strip-types batches/batch-20261022-025/reconstruction/LB_THUNDER_V_HA/prepare.ts
node --experimental-strip-types batches/batch-20261022-025/reconstruction/LB_THUNDER_V_HA/execute.ts invalidate
node --experimental-strip-types batches/batch-20261022-025/reconstruction/LB_THUNDER_V_HA/execute.ts run
node --loader ./batches/batch-20261022-025/reconstruction/LB_THUNDER_V_HA/verify-loader.mjs ./batches/batch-20261022-025/reconstruction/LB_THUNDER_V_HA/verify.mjs APP_E161_SOURCE ./batches/batch-20261022-025/artifacts/LB_THUNDER_V_HA/app_runtime/result.json ./batches/batch-20261022-025/reconstruction/LB_THUNDER_V_HA/runtime-check.json
python batches/batch-20261022-025/reconstruction/LB_THUNDER_V_HA/oracle.py
```

準備・失効は監査前正本からの一度だけの操作。既に受理済みのブランチで繰り返さない。QA用パッケージはまだProduction配信済みとは扱わない。旧Distribution成果物は履歴として保持し、そのstageをREADYへ戻した。ユーザー実機QAは未承認。
