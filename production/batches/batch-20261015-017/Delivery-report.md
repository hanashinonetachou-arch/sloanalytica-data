# Batch017 正式評価・量産結果

10機種すべて Research → Evaluation → Eligibility → Candidate Contract → Observation/Evidence → Canonical UI → MachineData → Runtime Policy → Runtime Projection → App Runtime → Distribution 完了。

- 元候補102件を全件追跡。数値評価37モデル、EIG7000算出26モデル。
- 7000G評価：CORE 16 / SUPPORT 5 / JOINT_ELIGIBLE 3 / EXCLUDE 2。
- 7000Gへ換算できないモデルは既存の試行単位規約で評価。条件付きスコアを7000Gへ転用していません。
- 出力Runtimeの数値モデル30件（フォールバックを含む）。設定制約カテゴリ102件。
- 正式Candidate Contract 10件、MachineData 10件、App Runtime 10件。
- Production回帰テスト444件、アプリ既存テスト・型チェック・10機種の描画検証・実際の推測計算がPASS。
- 以前の19系列・133シナリオを保持し、診断曲線は再計算していません。

| 機種 | Runtime数値モデル | 設定制約カテゴリ |
|---|---:|---:|
| パチスロ琉神−30 スイカバージョン | 1 | 0 |
| Lワンパンマン | 3 | 25 |
| スマスロ ゴッドイーター リザレクション | 2 | 13 |
| 賞金首Angel | 4 | 6 |
| スロット ゾンビランドサガ | 4 | 13 |
| L アカメが斬る！2 | 1 | 12 |
| パチスロ ファイヤードリフト | 2 | 9 |
| パチスロ武装神姫 | 1 | 0 |
| ワードオブライツⅡ | 8 | 7 |
| パチスロ ガメラ2 | 4 | 17 |

## 102候補の最終処理

| 処理 | 件数 |
|---|---:|
| 数値モデル・フォールバック | 30 |
| 単一カテゴリモデルに統合した内訳 | 2 |
| 派生表示 | 2 |
| 根拠を残してResearch不採用確定 | 29 |
| 観測ルール | 2 |
| 依存関係による代表外 | 4 |
| 制約・記録 | 24 |
| 記録のみ | 4 |
| 既存候補へ統合 | 2 |
| Runtime閾値未満 | 1 |
| 同じ終了画面の制約へ統合 | 2 |

## 観測上の確定事項

- 琉神は連チャン外ゲーム数とBIG・REGの単一カテゴリモデル。合算の独立乗算なし。
- ワンパンマンは弱チェリー・スイカを単一カテゴリモデルへ統合。ロゴ抽選の母数は非レア役成立のボーナス終了画面。
- 武装神姫は9回目強制成功を通常成功率と混ぜない。未公表成功率をAT率/CZ率から作らない。
- ワードオブライツⅡは4設定。CTレベル3が確定した後のメインCTのみを条件付き計数。レベル1・2の潜在状態は公開値を保持して数値不採用。
- ガメラ2のBIGとREG画面を分離。REG表の欠測セルをゼロ補完せず、怪獣集合・You are No1は明示制約として同一入力から適用。
- ゾンビランドサガの設定4・CZ高確中SAGA直撃期待度は公開表1.12%を確認。ただし内部状態を確定できない混合入力へ転用しない。
- 試行単位の評価にゲーム数を捏造せず、設定別数値・対象条件不足の29候補を理由付きで閉じた。

## 検証・再開

- 全正本出力のSHA256と既存の各stage validator：validation/authority-validators.json
- アプリ実コードによる入力・推測・制約：validation/app-runtime-smoke.json
- 描画検証：validation/rendered-ui/
- 元候補全件の根拠：candidate-final-dispositions.csv / .json
- 観測母数と数値：evaluation-summary.json / research-drafts/
- 公開資料の限定照合であり、独立した外部監査者による監査は未実施。
- 10機種の配信と公開カタログ・全パッケージのサイズ/SHA256照合はPASS。既存263機種は変更ゼロ。固定署名QA APK完成（versionCode 2002875209）。前回と同じ署名、今回10機種描画10/10・V8.5全170機種170/170の互換性検証がPASS。残りはユーザーの実機QA。

## Repository

- Production: `production/v85-batch-017-evaluation-20261016`
- 正式評価コミット: `2dd4ef0c3ba21d647e21d1e76b64f9f8ff3503c9`
- Distribution: `4dc806e6048771a3148383ea449cbdf5129ed664`
- PR: https://github.com/hanashinonetachou-arch/sloanalytica-data/pull/470
- Integration: https://github.com/hanashinonetachou-arch/sloanalytica-data/actions/runs/38776469577
- QA build: https://github.com/hanashinonetachou-arch/sloanalytica-app/actions/runs/38776679000

## 実機QA用APK

- ファイル: `SloAnalytica-Batch017-10Machine-vc2002875209.apk`
- SHA256: `e1a79ab5f34542e67040673b920e7e31496ae82089d7f987b4e1e7294443746e`
- 署名証明書SHA256: `1c01974fc54a2c351539147179944dbab5a5104d92b9447c36e04f50cbf45ea0`
- 既存263機種の変更ゼロ、公開配信10/10、描画10/10、全体互換性170/170。
- 修正前版は9機種についてユーザー確認済み。変更のない6機種の承認を保持し、4機種の修正差分は再確認待ちです。

## 2026-10-16 実機QA修正・配信

SAGA高確は見抜けないというユーザー確認に基づき、通常時SAGA揃いの数値推測と入力を削除。公表値は不採用理由とともに保持。ゴッドイーター、賞金首Angel、ゾンビランドサガ、アカメが斬る！2の計5セクションに、全項目の設定別出現率が未確認であり記録のみである旨を明記しました。設定確定・否定の反映は維持しています。

- 4機種は `8.5.2-batch-20261015-017`。他6機種は内容・版を保持。既存263機種のパッケージ・カタログ変更ゼロ。
- Productionテスト444/444、正式成果物整合性10/10、実アプリ推測計算10/10、変更4機種の描画4/4、公開サイズ・SHA256照合10/10がPASS。
- Distribution: `0f6dd00054c242fefac958141fbbead42f2f3791`
- Integration: https://github.com/hanashinonetachou-arch/sloanalytica-data/actions/runs/38818655303
- APK変更なし。機種データ更新で確認可能。変更後の4機種はユーザー再確認待ち、変更なし6機種は承認を保持。
