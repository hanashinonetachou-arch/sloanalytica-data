# Batch017 正式評価・量産結果

10機種すべて Research → Evaluation → Eligibility → Candidate Contract → Observation/Evidence → Canonical UI → MachineData → Runtime Policy → Runtime Projection → App Runtime → Distribution 完了。

- 元候補102件を全件追跡。数値評価38モデル、EIG7000算出26モデル。
- 7000G評価：CORE 16 / SUPPORT 5 / JOINT_ELIGIBLE 3 / EXCLUDE 2。
- 7000Gへ換算できないモデルは既存の試行単位規約で評価。条件付きスコアを7000Gへ転用していません。
- 出力Runtimeの数値モデル31件（フォールバックを含む）。設定制約カテゴリ102件。
- 正式Candidate Contract 10件、MachineData 10件、App Runtime 10件。
- 既存Productionテスト436件、今回固有回帰6件、アプリ既存テスト・型チェック・10機種の描画検証・実際の推測計算がPASS。
- 以前の19系列・133シナリオを保持し、診断曲線は再計算していません。

| 機種 | Runtime数値モデル | 設定制約カテゴリ |
|---|---:|---:|
| パチスロ琉神−30 スイカバージョン | 1 | 0 |
| Lワンパンマン | 3 | 25 |
| スマスロ ゴッドイーター リザレクション | 2 | 13 |
| 賞金首Angel | 4 | 6 |
| スロット ゾンビランドサガ | 5 | 13 |
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
- 10機種の配信と公開カタログ・全パッケージのサイズ/SHA256照合はPASS。既存263機種は変更ゼロ。固定署名のQA APKはActions実行中。実機QAは未実施。

## Repository

- Production: `production/v85-batch-017-evaluation-20261016`
- 正式評価コミット: `2dd4ef0c3ba21d647e21d1e76b64f9f8ff3503c9`
- Distribution: `4dc806e6048771a3148383ea449cbdf5129ed664`
- PR: https://github.com/hanashinonetachou-arch/sloanalytica-data/pull/470
- Integration: https://github.com/hanashinonetachou-arch/sloanalytica-data/actions/runs/38776469577
- QA build: https://github.com/hanashinonetachou-arch/sloanalytica-app/actions/runs/38776679000
