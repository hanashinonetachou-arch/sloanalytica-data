# SloAnalytica 10機種 Research→Work 正式評価引き継ぎ（2026-10-18）

このファイルは実作業指示。対象は同梱した10機種、再選定禁止。ユーザー確認待ちで停止せず、Repositoryの最新Production Stateを正本として開始。

## 最初に行うこと
1. `hanashinonetachou-arch/sloanalytica-data` および `hanashinonetachou-arch/sloanalytica-app` のmain/latest production、manifest v8.5と最新Contractを取得し照合。ブランチ/Batch番号は実際のRepositoryから特定。重複Batch作成禁止。
2. ZIP内 machine01〜machine10 の研究成果・candidates/coverage/prior_candidates・出典URLを読み込み、旧候補は必ず保持。Research済み領域を最初から再検索しない。ただし具体的な矛盾や公表条件不足だけ限定照合。
3. Research取り込み・検証 → Evaluation(7000G、EIG×200) → Eligibility (CORE≥20 / SUPPORT 10–<20 / JOINT_ELIGIBLE 5–<10 / EXCLUDE <5) → Candidate Contract。採用基準を独断変更しない。
4. 依存関係によりAT/CZ/直撃/合算/内訳を二重尤度計算しない。内部状態が判別不能なら条件付き公表率を直接適用しない。設定確定/否定はExact Constraint、それ以外の確率不明示唆は記録のみ・推測計算には使用しない。
5. 個別機種のUI: Aタイプは総Gのみ; +50はG母数のみ; 頻度1/x; 割合は%; 同一観測機会のタブ統合; 不採用理由は平易で要素名を各行箇条書き、同じ理由をグループ化。サイト名をユーザー向け理由文に出さない。
6. GitHub ActionsはIntegration Boundaryで集約して節約。正式EvaluationとEligibilityが終わるまで実装/配信/QA完了を宣言しない。今回未実施の外部監査を実施済みと記述しない。

## 注意
- machine01〜09は個別チャットでResearch完了と報告済み。格納ファイルを無加工保存。個別成果物内の件数は独立カテゴリを含み、実際の統計独立候補数とは異なる。
- machine10は初代スマスロ とある魔術の禁書目録（2023/11/6）、2026年の2ではない。藤丸コインの扉ゾーン・フィアンマBATTLE後における全条件別分布の確率モデル利用は限定照合待ち。厳格に未確認部分だけ処理。
- 個別ZIPの既存出典や母数の信頼性は同等ではない。数値の公表性・観測可能性をContract取り込み時に検証し、疑義を残す場合は既定のResearch終了契約に従って根拠付きで閉じる。

停止は次のHUMAN_REQUIRED地点のみ。GitHubへの変更権限が使える場合は適切な作業ブランチ/PRと成果物を作成する。工程途中で『進めてください』を求めない。
