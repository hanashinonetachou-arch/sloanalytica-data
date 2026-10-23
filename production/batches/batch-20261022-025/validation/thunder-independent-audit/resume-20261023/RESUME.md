# サンダーV監査是正：環境切断による保存地点

状態：未完了・監査合格ではありません。Productionへのマージ・配信、新APK生成、実機QA代行は実施していません。

## 保存済み

App PR #135: 071c7d095b9b66b268d26eb236b4c8d136f623ec。構造的確率0、無効分布、未観測カテゴリの表示、v3明示0の復元、厳密な派生合計、回帰テストを保存。

このDataブランチはcanonical eeb059c717a4d42ee34a7d806574270bd9cd56d0から分離した監査用Draftです。既存復旧b3ea742の統計モデル関連ソースと再開直前に変更した条件付き入力ラベル・版5のResearch入力を退避しました。これは正式受理済みの新Production Stateを意味しません。既存のStage記録は変更していません。

40候補の詳細対応は candidate-review-detailed.json。3 Evidence群とBLOCKを別枠で保持し、確率値・採用閾値は変更していません。7候補のEIG7000は切断前に独立再計算で一致しました。

## 切断前に実行した検証

- 復元されたケースは27件（17a/b/cを含む）。全件とPython独立計算が一致。最大絶対誤差6.730727086790012e-14。
- App全npm test、TypeScript、Vite buildに成功。
- 271機種・1800設定行の数値回帰、271機種のReact描画・未入力時推測に成功。
- Chromium 412×915で実画面を操作。REG22/BIG空欄、明示REG0、未確認への戻し、履歴保存、再読み込み後の0/空欄保持と推測一致を確認。
- Data関連23テスト成功。全体の最後に確認できた結果は457/472。過去Batch fixture不足が残り、全件成功ではありません。

実行ログの完全なローカルファイルは環境切断で未回収です。execution-receipt.jsonは会話のツール結果に基づく実行記録であり、失われたファイルを回収したものではありません。

## 未保存分：完了扱い禁止

ローカルではサンダーVだけのResearch修正版→Evaluation→Eligibility→Candidate Contract→App Runtimeまで10段階を正規バリデータで再受理し、8.5.5の9 Featureの確率表が既存修正版と一致することを検証しました。しかし新しいStage/Work ID/Lease/Provenance/成果物本体はコミット前に切断されました。GitHub上でこの受理は未完了です。失われたID・ハッシュを推測で作成しないでください。

8.5.5の新しいブラウザ検証と最終テストの一部は結果を回収できていません。成功扱いしないでください。

## 次の実行地点

1. App PR #135とこのDraftの現在HEADを再取得。071c7d0以降の追加差分はその検証状態を読む。
2. このResearch入力を使い、サンダーVだけの旧正本Stage/Artifactsをrevisionsへ保存してから必要な10段階を正式再受理。他9機種、既存Research根拠、DEVICE_QAを変更しない。
3. 既存 execute-batch025-contract.ts research LB_THUNDER_V_HA / downstream LB_THUNDER_V_HA と execute-batch025-runtime.ts 9を利用。COMPLETEからの変更は既存AUTHORITATIVE_OUTPUT_INVALIDATED経路を用いる。新Batchを初期化しない。
4. runtime-completion.jsonは既存216件を保持して追記する。既存Distribution attemptのwork-request wrk_9aebdd9cf2b54ae2は基準コミットで取得できなかったため、旧Distribution履歴は保存し、新しい配信済み扱いを作らない。
5. 27ケース、40候補、271機種回帰、App/関連Dataテスト、8.5.5実画面・入力・保存・復元を再現可能な証跡として保存。公開確率を変更しない。
6. EXHAUSTIVE_ROUNDEDの0.985/1.015は暫定防御。全体に妥当な丸め精度の契約は未確立。16個の非単位和行（4機種）を把握済みだが、無根拠な再正規化の正当化に使わない。これを解決するまで独立監査合格にしない。
7. 検証完了後に必要な固定署名QA APKを生成し、versionCode/SHA256/build URLを記録。旧APKを監査合格版にしない。人のQAを代行しない。
