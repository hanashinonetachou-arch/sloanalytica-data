# SloAnalytica Batch018 — Candidate Contract完了からの再開

2026-10-17。Repository正本を再取得し、確認だけで止まらず、ユーザーが次に指定した工程を実行すること。

- Data: `hanashinonetachou-arch/sloanalytica-data`
- 正本作業ブランチ: `production/v85-batch-018-research-20261017`
- Batch: `batch-20261016-018`
- App最新確認: `qa/batch017-v85-20261016` (`474fdf2221b3b920b90df9ac615dbd07b0c65fb3`)、prototype (`c58cb84f7c172b013272abe6fb23a0ead2252dfe`)。Appへは今回書き込んでいない。

## 完了状態

`completion-summary.json` と各機種 `machines/<ID>/stages/*.json` が正本。10機種すべてResearch/Evaluation/Eligibility/Candidate Contractが正式COMPLETE。work/attempt/leaseとSHA256、既存Validator証跡を保持。未実施工程を完了扱いしない。

元99候補のIDをすべて保持。調査により33候補追加、計132候補。Research findings88件・理由付きBLOCK44件。findingsのうち数値評価63件（参考分布3件を含む）、数値Contract候補60件、Evidence候補25件。

数値Contract候補は最終採用数ではない。依存解決後に使用可能とされた代表31件にもRuntime Policyが未適用。正式Selection ScoreのEXCLUDEと、条件付き試行のスコア未算出・PER_ELIGIBLE_TRIAL_POWER経路を混同しない。

## 次工程

今回の依頼範囲はCandidate Contractまで。Observation/Evidence・Canonical UI・Runtime・配信・APK・実機QAは今回未実施。次回ユーザーが実装を指示した場合は、既存 `deterministic-production-worker.ts` と各Validatorを用いてObservation/Evidence以降へ進む。Researchを再作成・再選定しない。具体的な新出典がある場合に限り該当候補だけ再確認する。

## 必須の設計条件

- バハマは2024アムテックス製Sバハマ30。擬似ノーマルATであり、通常GからAT消化Gを除外。3枚チェリー・スイカ・ロングフリーズ保持。1998オリンピア機の資料は使わない。
- 防振り中段チェリーM09-C03はSOURCE_CONFLICT_UNRESOLVED。なな徹と必勝本で設定3/4が異なる。一撃への追加確認1回を実施済み。数値は両方保持、尤度無効、新しい具体的な訂正資料以外で繰り返し調査しない。
- 防振りの終了画面は当日G帯別3条件。EPBB/天使/暴虐経由の固定画面を除外。サブ液晶はEPBB以外の4つ目コメント。数値と確定制約は `EXPLICIT_CATEGORY_LINK_V1` で同じ入力に結合し二重カウントしない。
- 防振りのキャラ紹介は紹介順による依存がある。公開3G帯分布はreference_distributionに保持し、紹介全回を独立試行としない。設定否定・確定はEvidenceで維持。
- アオハル操の金文字/通常文字のBIG告知は別母数。金文字のREG告知→BIG昇格は設定1否定。数値N06とEvidence N09は同じ入力を共有。
- アオハル操のベルAは白7狙い、ハズレBは正確なピンク7狙いの区間のみ。BAR狙い・目押し不確実な区間は対象外。小役のラベルだけで全Gと結合しない。
- 忍者じゃじゃ丸C06は外から見える「表示維持」9.4～12.5%。81.3～75.0%の内部クリアを消灯率として使わない。
- 忍者じゃじゃ丸/沖ドキBLACKの初当たりは32G連チャンゾーンの当選と消化Gを除外。確率の公表母数との同一性はNOT_ASSERTEDのまま既存ユーザー定義を使う。
- 金のかぼちゃは通常/収穫祭STで別抽選。Lの確率を設定1～6へ補間しない。
- 内部モード識別不可の直撃/CZ/最終決戦率は公開値をBLOCKに保持。設定確定演出は別経路で維持。
- 初当たり/合算/内訳/契機の重複はCandidate Contractの代表選択に従う。独立加算しない。採否閾値を変えない。
- 全カテゴリの出現率が未知の参考入力は、セクション内に「このセクションの全項目は設定別出現率が公表・確認されていないため、記録のみです。設定推測の計算には使用しません。」を必ず表示。Exact Constraintを含むセクションを全体として記録のみと説明しない。
- AT/CZ/初当たりは1/形式、振分・割合は%。同一観測機会は既存のタブ統合Contractを守る。

## 再現

Node24。`production/` で関連テスト:

```
node --experimental-strip-types --test test/batch018-research.test.ts test/complete-research.test.ts test/evaluation-builder.test.ts test/evaluation-validator.test.ts test/candidate-contract.test.ts
```

Review再構築は `src/curate-batch018-research.py`。入力は `research-inbox/batch018/imported-handoff/` に保存。正式出力を直接上書きせず、変更時は既存Orchestratorの無効化・再受理を使用する。

通常の5+5 waveは第1wave配信後に第2waveResearchを解放する。今回は配信が対象外のため、Batch specを10機種の単一waveにした。Concurrency2と全Validator・段階依存は変更していない。`research-scope.json` 参照。

GitHub Actionsは起動していない。通常commitは[skip ci]、Integration Boundaryでのみまとめて実行。過去Batch/配信/QAの状態を巻き戻さない。ユーザー承認待ちは工程ごとに設けない。
