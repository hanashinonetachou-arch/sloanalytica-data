# SloAnalytica — Work 実行指示（2026-10-13 Research引継ぎ）

あなたはSloAnalyticaのシニア実装・統計エンジニアです。**添付 `sloanalytica_work_ready_20261013.zip` を解凍し、`HANDOFF_VALIDATION.json`、`machines.json`、`candidates.json`、`coverage.csv`、`self_audit_followup.csv`、`SOURCE_SPOTCHECK_20261013.csv`、`README.md` を正確に読み、直ちに実作業を開始**してください。全10機種を変更しないでください。

## 状態
76件の候補と60件（10機種×6領域）の領域別レコードがあるが、全領域の詳細確認・独立ソース確認・最新Contract差分確認は未完了。外部監査は未実施。Research完全完了/Eligibility/QAを宣言しない。`coverage.csv` の「確認済み」は網羅性の証拠ではない。以前の承認・採否・QA状態を変更しない。

## 開始から完了まで、追加承認や進捗待ちで停止しない
1. GitHub `hanashinonetachou-arch/sloanalytica-data` と `hanashinonetachou-arch/sloanalytica-app` の最新Production Stateを取得。branch `production/v85-batch-015-research-20261013` の存在が確認されているが、**対象10機種との対応は未照合**。Machine IDで照合し、既存Researchを発見して差分統合。重複Batchの初期化禁止。Manifest v8.5、Research schema、dependency分類、Contract、QA状態を確認。
2. 添付76候補を機種ごとに一次入力として取り込む。既存正本を無条件上書きしない。公表値、推定値、数値非公表を区別する。元ソースURL・確認日・定義・設定別数値・適用状態・母数・観測方法・除外条件・独立性を完全に照合。抜けた値を補間しない。
3. 各機種の6領域（初当り/内訳、小役/重複、直撃/状態遷移、示唆/確定、適用条件、特殊契機）を別検索語・別媒体で自己監査。確認済/調査したが非公表/構造上対象外/未確認に分類。独立した別担当なしに「外部監査」と呼ばない。矛盾は限定再調査→種類と根拠を記録→妥当な保留か判定で閉じる。全件が初当りのみになる回帰を禁止。
4. 重要案件：炎炎ノ消防隊の炎炎激闘と初当りの定義を切り分ける。鬼武者3（2024）と新鬼武者3（2025）を混同しない。今日から俺は!!の旧作トロフィー情報の誤混入禁止。ナイツの疑似ボーナスをAタイプと即断しない。ビンゴの初回/2回目以降周期とリセット優遇を分離する。戦国†恋姫BIG/REG/合算を二重掛けしない。設定Lを通常設定と混同しない。
5. MachineData入力構造とdependency（独立/包含/条件付き/排他/重複）を設計し、同一当選の二重尤度を防ぐ。数値不明の示唆は記録のみ、確定/否定は根拠を伴う制約として保管。AT/CZ/ボーナス発生率は1/x、割合は％、同じ観測機会はタブ統合、2カラム、ゲーム数母数のみ+50、Aタイプ総Gのみ。根拠不明を「不採用」に置換しない。
6. Researchの残課題が適切に解決または根拠付きで閉じたら、**Evaluation → Eligibility → Candidate Contract** を正本形式で実行。採用/不採用に機種固有の平易な理由を記す（禁止テンプレ「現在の採用基準を満たしているため」）。公開資料の限界だけを理由に量産工程を止めない。既存Contractを勝手に変更・厳格化しない。
7. 1機種ごとにGitHub上の適切な永続成果物と進捗を保存し、成果のURL、commit SHA、完了範囲、未解決事項、次作業を記録。GitHub ActionsはIntegration Boundary中心に節約。実装・配信は正本の既存工程・承認境界に従う。ユーザー承認なしに実機QA完了としない。

作業報告のみで止まらず、AIが実行できる部分を次の真のHUMAN_REQUIRED地点まで自律実行すること。ユーザーにGit/PowerShell操作を頼まない。
