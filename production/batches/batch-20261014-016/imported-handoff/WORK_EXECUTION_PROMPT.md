# SloAnalytica — Work実行指示（10機種 Research仕上げ→Candidate Contract）

**このZIPの HANDOFF_STATUS.md、validation_summary.json、candidates_enriched.csv、coverage.csv、machine_index.json を必ず先に読んで、直ちに実作業を始めること。確認返信だけで止まらない。**

対象は記載済み10機種に厳密固定。現在の成果は「94候補を挙げた一次調査＋一部定量抽出」であり、全機種のResearch完了ではない。`research_complete=false` を無断で上書き禁止。過去Batch QA、公開配信状態を変更禁止。

## 0. 正本再取得と衝突回避
GitHub `hanashinonetachou-arch/sloanalytica-data` と `hanashinonetachou-arch/sloanalytica-app` の最新main＋生きた作業branch、Production State、Manifest v8.5、schema、既存Research/Contract、選定Batch/機種IDを取得。Batch番号・branchを推測しない。すでに存在する候補・成果物を二重生成しない。制御面の遷移はRepository正本と既存Orchestrator契約に従う。

## 1. Research仕上げ（10機種すべて）
添付94候補を原版を残して検証。対象名称・型式・導入時期・タイプ、設定集合を確定。同じ2022/2024このすばなど混同を排除。元URLへ直接照合し、項目ごとに設定別値（欠測は欠測）、母数、対象ゲーム/状態、除外、観測UI、データ種別、公開日/確認日、出典間の関係、発生条件を記入。単純な初当り項目だけで終了禁止。

## 2. 網羅性自己監査→推測モデル設計
AT/CZ/ボーナス、小役/重複、直撃/移行/振分、終了画面/ボイス/トロフィー、確定否定、区間・リセットの全領域を、異なる検索語と一次・二次情報源で再点検。未発見は「調査したが公開確認できず」であり「存在しない」ではない。矛盾は限定再検索・分類・根拠を残して閉じ、保留を無制限増殖させない。今回の二次検索は**自己監査**であり、外部監査済みと呼ばない。

候補ごとに事象、試行母数、条件、モデル種別、他候補との包含/排他/従属、履歴や表示用入力、理由を定義。AT初当りとCZ、BIG/REGと合算、ボーナス重複契機とボーナスを無条件に同時尤度加算しない。沖スロ系では連チャン内Gと当選を分離。示唆の未知出現率は記録のみ、明確な確定・否定はExact Constraint候補として出典で精査。

## 3. Research gate確認後に正式評価
**正本確認 → Research取込み・検証 → Evaluation → Eligibility → Candidate Contract** を連続実行。Manifest v8.5 7000G/EIG×200、CORE≥20、SUPPORT10〜<20、JOINT5〜<10、EXCLUDE<5などは最新正本の閾値と照合し勝手に変更しない。PER_ELIGIBLE_TRIAL_POWER等の既存方式を保つ。ソース不足を理由に完了基準を勝手に厳格化せず、候補不足を初期Researchで検出し、調査範囲と根拠を残して閉じる。初当りのみ採用となる量産工程退行を再発させない。

## 4. 永続化・後続工程
機種ごとに調査・自己監査・モデル設計・検証結果をRepositoryに永続化。作業再開時に既存完了分を読む。再開可能な状態と未解決を更新。Aタイプ総Gのみ、+50はG数母数のみ、確率は1/N、同一観測機会はタブ統合、簡潔な項目名/詳しい説明、通常Gと総G分離、Evidence常時表示。採用/不採用理由を具体化し禁止テンプレを使わない。GitHub ActionsはIntegration Boundaryで節約。

今回の引継ぎで必須なのは正式な Candidate Contract まで。実装・配信・APK・実機QAを無断で完了扱いにしない。

HUMAN_REQUIRED は機種同定に解決不能な衝突、不可逆な製品判断、安全に進められない契約不整合の場合に限定。公開情報の不足は出典と限界を残して閉じ、他機種処理を止めない。途中経過の承認待ちで停止しない。
