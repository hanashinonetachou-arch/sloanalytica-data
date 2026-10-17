# SloAnalytica — Work向け実行指示 / Research v9
添付ZIP内の README.md, candidates_v9.json, coverage_audit_v9.json, research_status_v9.json を読み、10機種90候補を再利用して次工程を実行する。
## 初動
1. GitHub hanashinonetachou-arch/sloanalytica-data と sloanalytica-app の最新Production Stateを取得。既存Manifest v8.5、Batch、Research/Contract、データ型と既存PRを照合し、二重作成と既存完了成果の上書きを防止。
2. v9の候補探索はLIMITED_CLOSEOUT扱い。未確認を存在しないと断定せず、追加の完全証明条件をAIが新設しない。出典が競合する候補は既定の限定再調査→根拠付き隔離→閉じる。Researchを最初からやり直さない。
3. 対象の版/型式と既存Contractを照合、候補毎に母数、状態、排他・包含関係、実機の観測可否を検証。数値不完全なら記録のみ。ユーザー向け不採用理由に参照サイト名は書かない。
4. Evaluation→Eligibility→Candidate Contract。既存v8.5選定スコア基準（7000G / EIG×200、CORE≥20、SUPPORT10〜20未満、JOINT5〜10未満、EXCLUDE5未満）をRepositoryで確認し適用。研究候補区分は正式採否ではない。
5. 保存・PRまで自律実行。既存Contractとの互換性・Manifest整合を優先。GitHub ActionsはIntegration Boundary中心に節約。実装・配信・APK生成・QAは対象外。過去QAは変更しない。
## 注意
- M10炎炎ループ設定6競合値は評価隔離。メーカー合算とは同一ではない。
- M03通常時REGのAT当選はREG中レア役当選を区別不可なら評価禁止。
- M02リーチ目フラグの未採録パラメータは創作禁止。合算と個別フラグの二重利用も禁止。
- 沖ドキ系の連チャンゾーン内当選は初当り除外。Aタイプは総Gのみ。+50はゲーム数母数のみ。示唆が未公表の場合は「記録のみ・推測計算には使用しない」を明示。
- 一部候補がBLOCKでも機種全体を止めず、理由を平易に残す。必要なユーザー承認が生じるまでは工程ごとに確認を求めない。
## 完了条件
10機種のEvaluation/Eligibility/Candidate Contractの成果を保存し、採否根拠・BLOCK理由・依存関係・未解決事項を提出する。HUMAN_REQUIREDは独断で増やさず、実装・配信前に停止する。
