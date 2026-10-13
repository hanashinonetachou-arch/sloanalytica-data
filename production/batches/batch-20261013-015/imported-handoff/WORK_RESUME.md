# SloAnalytica Batch015 — Work自律実行・再開指示

あなたはSloAnalyticaの実装・統計評価担当です。**この指示を読んだら質問・工程ごとの承認待ちを挟まず、実作業を開始**してください。添付の `sloanalytica_batch015_preflight_audit_20261013.zip` を展開し、元の `WORK_EXECUTION_PROMPT.md` と修正前の一次候補76件、修正ドラフト、監査結果を確認してください。

## 正本と開始地点

- GitHub Data: `hanashinonetachou-arch/sloanalytica-data`、App: `hanashinonetachou-arch/sloanalytica-app`
- Batch branch: `production/v85-batch-015-research-20261013`。作業開始時に最新HEAD・既存Batch・stage状態・ブロッカー・commitを必ず再取得。会話内SHAを現在HEADと決めつけない。
- Batch014の `production/batches/batch-20261013-014/next-ten-selected-20261013.json` の10機種・Machine IDを固定。Batch014の実機QA結果を変更しない。
- 保存済み監査チェックポイント: `production/research-inbox/batch015-preflight-20261013.md` (コミット `293799b395fe6d6c70d00687e5e74103533126b9`)。これは事前監査であり、Research COMPLETEではない。
- `production/RESEARCH_PROCESS_CONTRACT.md`、`production/WORK_RECOVERY.md`、現行Manifest v8.5・既存Orchestrator/Validator/Contractを正本とし、新規の厳格な完了条件を追加しない。

## 残作業

1. 前回の修正ドラフトと原文を比較して候補の重複生成を回避。炎炎ノ消防隊の設定キー（設定3なし→1/2/4/5/6）の修正、鬼武者3（2024）の設定3数値の機種同定、戦国†恋姫のAT区分、ナイツの擬似ボーナス構造、BIG/REG/合算重複、ビンゴの初回周期と2回目以降を元資料と独立資料で照合。
2. 10機種×6領域の自己監査を行い、一次候補76件の追加・削除を理由付き記録。各候補の全設定値・母数・入力観測条件・除外条件・ソース・依存関係を明記。公表されない数値を推定や補間で捏造しない。調査範囲内で非公表だった項目は既存ルールで根拠付きで閉じる。候補1件だけに縮小する回帰を防止。
3. Research検証を通して正本へ保存し、既存Orchestratorに従って **Evaluation → Eligibility → Candidate Contract** を順次生成。EIG×200／基準7000G等の既存Manifestルールを変更しない。代表/代替の優先順位・排他関係・観測単位・記録のみEvidence・Exact Constraintを反映する。
4. 機種ごとのstage成果物、Validator出力、入力fingerprint、commit SHA、完了範囲をBatchへ保存。既存Run/OutputやQAを誤って上書きしない。通常commitは `[skip ci]`、GitHub ActionsはIntegration Boundaryのみ。
5. 契約生成後も、既存工程上の次のAI実行可能ステージまで自律的に進める。真に人間の実機作業が必要な時だけHUMAN_REQUIREDへ。ユーザーにGit/PowerShell操作を求めない。

## 停止・再開

タイムアウトや接続障害後は最新GitHub HEADとcheckpoint・stageを再取得。完了済みの機種やステージを再生成せず、未完了の次ステージから続行。公開情報と正本の衝突は限定再調査と記録で閉じ、恣意的な完了判定やQA承認をしない。最終報告には実際のCommit URLと生成物、残課題を明記。
