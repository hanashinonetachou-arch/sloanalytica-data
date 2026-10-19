# Batch024 — 候補契約までの引継ぎ

対象は添付 `SloAnalytica_Research_10Machines_Work_Handoff_20261019 (2).zip` の10機種。Batch023とは別バッチ。元の制限付きResearch記録12ファイルを `imported-handoff/` にそのまま保存した。

## 実施範囲

各機種を次の順で正式受理した後、次の機種へ進めた。

`RESEARCH → EVALUATION → ELIGIBILITY → CANDIDATE_CONTRACT`

Manifest v8.5、既存の正式builder・validator・orchestratorを使用。候補ごとの情報量・設定識別力を既存実装で計算し、適格性と候補契約を生成した。`runtimeInferenceAllowed` は候補契約上の条件であり、配信済み・最終採用済みを意味しない。実装時には選択スコア、依存関係、母数条件を引き続き適用する。

元の調査は制限付き終了であり、今回も全サイトを再調査したとは主張しない。必要な原表の数値・設定区分・条件だけを限定照合した。未確認の数値、観測できない内部状態、競合する資料は保留理由と元パラメータを残した。外部の独立監査は実施していない。

## 対象と順序

| 順番 | 機種 | Machine ID |
|---|---|---|
| 1 | 防空少女ラブキューレ2〜極限の共鳴〜 | L_LOVEKYURE2_PS |
| 2 | スマスロ バイオハザード:ヴェンデッタ | L_BIOHAZARD_VENDETTA_FK |
| 3 | パチスロ からくりサーカス | L_KARAKURI_CIRCUS_G |
| 4 | ぱちスロ にゃんこ大戦争 BIGBANG | L_NYANKO_BIGBANG_MK |
| 5 | L ベルセルク無双 | L_BERSERK_MUSOU_EV |
| 6 | スロット ソードアート・オンライン | L_SAO_B2 |
| 7 | L主役は銭形4 | L_ZENIGATA4_L1 |
| 8 | スマスロ北斗の拳 | L_HOKUTO_AD_XR |
| 9 | HEY！エリートサラリーマン鏡 | L_HEY_ELITE_SALARYMAN_KAGAMI_PA4 |
| 10 | パチスロ 革命機ヴァルヴレイヴ | L_VALVRAVE_D |

## 主な整理

- 初当りとその内訳、同じ当選経路、同じ画面の数値分布と確定示唆を重ねて計算しない。
- 試行母数、観測条件、当日ゲーム数帯、リセット・初回条件を機種別に記録した。
- にゃんこBIGBANGの設定区分誤記疑いは、設定4を明示する別の原表で限定照合した。
- 北斗のユリアボイスは原表の「設定5以上期待大」と説明文の濃厚表記が競合するため、確定制約として扱わない。
- ヴァルヴレイヴの終了画面は公表概数による近似分布として扱い、精密な公表確率とは表現しない。
- 既存パッケージを `repository-baseline/` に保存し、全既存候補を `legacyReconciliation` で追跡した。
- 最終検証でカテゴリ区切りを既存パーサーの正式形式へ修正し、旧36成果物を `immutable-revisions/` に保存して、対象9機種を順番に再受理した。候補や数値はこの修正で削除していない。

## 正本と検証

- 最新の正式成果物: `../../batches/batch-20261019-024/artifacts/<machineId>/<stage>/result.json`
- 正式状態・入力参照・受理履歴: 同バッチの `machines/`、`work-requests/`、`transitions/`、`provenance/`
- `reviewed/`: 出典主張、候補台帳、保留理由、既存候補との対応を含む整形済みResearch
- `formal-summary.json`: 機種別の候補契約集計
- `verification.json`: 最新40成果物・入力参照・旧成果物のハッシュ照合、工程状態、順序、変更範囲の検証結果
- `existing-tests.log`: 関連する既存テスト47件の実行結果（全件成功）

再確認は `production/` から `python research-inbox/batch024/verify-checkpoint.py` を実行する。統計評価は既存validatorを通して各正式受理時に検証済み。

## 未実施

`OBSERVATION_EVIDENCE` 以降の実装、UI生成、ランタイム変更、配信、APK生成、実機QAは未実施。GitHub Actions実行なし。既存配信とBatch023のQA記録を今回のQAへ流用していない。

次工程は、この候補契約から始める実装・統合工程。新たな根拠がない限り元Research全体を繰り返したり候補を初期化したりしない。
