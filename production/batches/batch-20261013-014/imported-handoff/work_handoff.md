# Work 実行指示：SloAnalytica 10機種 Research継続

対象はこの成果物の `candidates.json` に列挙された10機種のみ。再選定禁止。

**最重要：この成果物は暫定で、Research/自己監査とも未完了。Workは不完全な候補をそのままContract化しない。**

1. GitHub `hanashinonetachou-arch/sloanalytica-data` および `.../sloanalytica-app` の最新Production Stateを照合する。Batch番号、Manifest v8.5仕様、Research形式、既存Candidate Contract、既存ブランチ、今回対象の重複を確認する。過去BatchのQA状態を変更しない。
2. まず `README.md`・`candidates.json`・`coverage.csv` を読み、部分調査の各欠落を原典Web資料で補完する。6領域すべてを検索し、設定別数値・適用状態・除外条件・分母・出典・確認日・確度・非搭載設定を埋める。新たに公開された候補も追記、過去候補の否定や除外も履歴保持。
3. 情報源を変えて自己監査し、矛盾と転載系列を検査。独立した外部監査を別途実施していなければ「外部監査済み」と記載しない。監査チェックに未確認が残る場合、理由と次の作業を記録する。
4. 観測可能な依存関係と条件付き分解を確定し、初当り・CZ・AT・内訳の二重計測を排除。未公表の示唆は重み付けせず記録のみ。確定制約は条件を満たす事象のみ。UIラベルは短く説明は詳細に。
5. **正本確認 → Research取り込み・検証 → Evaluation → Eligibility → Candidate Contract** の順で進む。統計スコア・採否は正式評価以後に初めて確定。必要ならRuntime Policy等の後続は別工程として記録する。
6. 1機種ごとに成果を永続保存し、中断可能にする。GitHub ActionsはIntegration Boundaryに制限。HUMAN_REQUIREDとなる製品判断以外は自律継続。

停止条件：機種同定不能、再現不能な原典矛盾で致命的な推測誤りが予想される、Repository形式と既存契約が一致せず安全に取り込めない、またはユーザーの製品判断が不可欠。これ以外は欠落を記録して次機種へ。QA承認・配信完了を勝手に記録しない。
