# Batch025 — ResearchからCandidate Contractまで

追記: ユーザーの対象範囲拡張により、実装・配信・QA用APK生成まで完了。現在地点は `APK_QA_HANDOFF.md` と `device-qa/handoff.json`。以下はContract確定時の記録。

基準: Manifest v8.5。元の37ファイルは `production/research-inbox/batch025/original/` に変更せず保存。

## 完了状態

- 10機種を指定順に1機種ずつResearch正式受理。最初の10機種すべての受理後にEvaluationを開始。
- Research / Evaluation / Eligibility / Candidate Contractの40ステージは正式バリデータで受理。設定Vの形式対応後も全40正本を再検証済み。
- 既存Repositoryの候補・確定表示106件を新しい候補台帳264件へ照合。消去なし。
- Research検証形式は、SOURCE_DERIVEDでSET_Vが明示された場合に限り数値キーVを許可。評価器・採否閾値・設定0の扱いは変更なし。
- App・配信パッケージ・既存QAは変更なし。Actionsの起動操作なし。

## 設定Vの形式対応と正式再受理

**ニューキングハナハナV:** 設定1/2/3/4/Vの公表値を変更せず、数値ResearchのV識別子制限を解消。旧成果物・検証・stageを `revisions/native-v-format-r2/` に保持してから正本を正式失効・再受理した。Research → Evaluation → Eligibility → Candidate Contractの4工程を新Work IDと検証証跡で完了。Vを5/6へ置換せず、スマート沖スロ版を維持した。公開情報の再調査なし。

正式EIG7000×200はBIG=12.55591577883857（SUPPORT）、REG=22.780284456735725（CORE）。両者は同じ試行の排他的結果としてBIG・REG・残余の1モデルへ統合し、REGの独立二重加算を抑止。その他は総GからBIG・REGを引いて自動算出する契約とし、合算の公表丸め値は参考保存のみ。契約上の経路許可は実装・Runtime Policy採用の完了を意味しない。

設定Vに関する工程保留・HUMAN_REQUIREDはなし。通常時小役の未公表値や、着席前区間の未確認観測条件は候補別の除外として保持し、完了扱いへ変更していない。

## 争点と経路

- バキ: 強喰設定5の値相違、内部昇格・高確移行の観測制約を候補別に閉鎖。
- リノヘブン: 設定3なし。32G連チャンを除外する初当りと通常ベルの母数を区別。連チャン込み合算は参考表示のみ。
- ハナビ: ピース花火は同一REG内の1枚役回数条件別。条件不明時は確定制約と記録だけ。
- アレックス: リーチ目はBIG小役ゲームとJACに分離。壁画調は率差であり6確定ではない。
- クレア: 旧正本のBT純ハズレ対JACIN条件付き確率をそのまま保持。生ゲーム確率の未転記設定値は補間しない。
- マジハロ: 紫台座の設定1否定を保持。虹アリストロフィーは旧機種類推のため確定化しない。
- SHAKE: JAC3分類を排他化し継続率は派生。スイカ＋ナディアBIG設定6の公表値衝突を候補別に閉鎖。
- サンダーV: 通常BIG・1G連BIGの画面を分離。REGリーチ目役名対応の表記衝突は詳細モデルだけ閉鎖。
- ケロット5BT: 通常REG金帯の番号だけでは制約を付けず絵柄で区別。小役全設定値と既存のBIG終了・トロフィー制約を正本・本機記事へ照合。
- BIG小役の丸められた残余A確率で排他和が100%超となる場合は、そのA公表値を参考保存。観測できる他カテゴリと残余を使い、公表値の正規化や改変はしない。

## 監査の範囲

指定5サイトと該当メーカー3系列に限定。対象10機種はメーカー3系列の管轄外。既存の閲覧・検索結果を再利用し、不足URLだけ照合した。直接取得403、検索抜粋、機種ページ未掲載、確認済みを区別して保存。独立外部監査は実施していない。

## 機種別件数

| 機種 | 台帳 | 旧候補照合 | 数値評価行 | 制約・参考セクション |
|---|---:|---:|---:|---:|
| Lバキ 強くなりたくば喰らえ!!! | 15 | 12 | 4 | 3 |
| スマスロリノヘブン | 9 | 7 | 3 | 2 |
| スマスロ ハナビ | 49 | 10 | 47 | 1 |
| アレックス ブライト | 40 | 8 | 38 | 0 |
| クレアの秘宝伝 〜はじまりの扉と太陽の石〜 ボーナストリガーver. | 24 | 13 | 19 | 3 |
| マジカルハロウィン ボーナストリガー | 26 | 9 | 19 | 4 |
| SHAKE BONUS TRIGGER | 23 | 12 | 15 | 3 |
| スマート沖スロ ニューキングハナハナV | 11 | 7 | 3 | 5 |
| スマスロ サンダーV | 45 | 8 | 40 | 3 |
| スマスロケロット5BT | 22 | 20 | 12 | 8 |

数値評価行には参考分布を含む。`runtimeInferenceAllowed` は重複解決後の契約上の許可で、Runtime Policyによる採用確定や実装・配信を意味しない。

## 正本・検証

- Data基準コミット: `e6c5b1a8cc872ca804f2b857bdacc518cea1a1e4`（Batch024とRevue QA受理・Batch025選定済み）
- 配信データ参照: `d711c44083bcce806058abbeab36b697357940c8`
- App参照: `qa/revue-ui-20261021` / `934c6871f6d42d551c233ebf0e3c15631f06ff67`（読取のみ）
- 検証: `node --experimental-strip-types src/verify-batch025-contract.ts`
- 回帰検証: `node --experimental-strip-types --test test/batch025-native-setting-v.test.ts test/batch023-setting-zero.test.ts test/dependency-gate.test.ts test/evaluation-validator.test.ts`（14件PASS）
- 結果: `validation/final-contract-verification.json`。上流成果物のSHA256、40正式ステージ、候補照合、依存経路、確定制約、境界を検証。

現在の正本は `artifacts/*/{research,evaluation,eligibility,candidate_contract}/result.json` と各stageのauthoritativeOutputRef。curation scriptsとrevisionsは監査・再現用の履歴。review08.pyは形式対応前、resolve-native-v.pyは今回の一度だけの訂正記録。既存Batchで再初期化・調査再生成を実行しない。今回の指定範囲はCandidate Contractで完了し、以降の実装工程は開始していない。
