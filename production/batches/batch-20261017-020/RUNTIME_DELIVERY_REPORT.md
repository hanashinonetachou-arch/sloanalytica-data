# Batch020 — 配信・QA用APK準備完了

10機種すべて、確定済みCandidate ContractからObservation/Evidence、Canonical UI、MachineData、Runtime Policy、Runtime Projection、App Runtime、Distributionまで正式COMPLETEです。実機QAは未実施で、10機種ともREADYを維持しています。

- 元の86候補と、分割・補充後135件の採否履歴を維持。採用基準・数値モデル・閾値は変更していません。
- 同じ観測面はセクション内タブに統合。数値入力と設定確定・否定は同じカウントを使用します。
- 番長4・忍魂参の当日履歴不明時は専用の記録タブへ。数値推測から分け、設定確定・否定は保持します。
- 番長4の富士山既出履歴は設定制約として扱い、履歴の出現率を追加加算しません。通常条件と7000G超の最初の特殊画面は別タブです。
- 忍魂参の役別ボーナス6条件も1セクション内タブに集約し、契約済みの優先・代替関係によって同時加算を防止します。
- ゲーム数ベースは逆数表示、割合系は％表示。Aタイプの総Gのみ、沖スロの除外G、ゲーム数母数だけの+50を保持。
- ユーザー向け文言から参照サイト名と禁止された汎用採用理由を検出していません。

検証：Production回帰461件成功、今回の追加4件成功、全110工程成果物のSHA一致。10機種の実アプリ計算・公開パッケージのUI検証成功。V8.5の200機種で互換性検証成功、失敗0。既存263機種の配信データ・カタログ項目に変更なし。更新順の先頭10件も確認済み。

配信コミット：`8ec2779ac9b33af026c714f310b714be1090bd05`（`prototype-multi-machine`）

QA用APK：`SloAnalytica-Batch020-10Machine-vc2002891828.apk`、versionCode `2002891828`。固定開発署名の検証済み。APKのSHA・署名・CI参照は `qa-apk-receipt.json` に記録しています。

[データ統合検証](https://github.com/hanashinonetachou-arch/sloanalytica-data/actions/runs/39008755096)・[配信先更新](https://github.com/hanashinonetachou-arch/sloanalytica-data/actions/runs/39008808693)・[APK生成と全機種検証](https://github.com/hanashinonetachou-arch/sloanalytica-app/actions/runs/39008620565)はすべて成功です。Actionsは今回の統合境界の3実行のみです。

端末へのインストール・端末上の動作・ユーザー承認はこの報告の検証に含めていません。実機QA完了にはユーザーの明示判断が必要です。
