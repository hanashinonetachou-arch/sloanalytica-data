# 出典名の画面表示を除去（2026-10-17）

ユーザー確認：「痛いのは嫌なので～の不採用理由に、”なな徹”というワードが入っていますが、このように参考にしたサイト名は一切出さないでください。他は大丈夫そうです」

防振り以外9機種は元APK vc2002885170の実機QA結果として既存の部分受理経路でCOMPLETE。防振りは表示修正の確認待ち。元の固定handoffは `handoff-vc2002885170.json` に保持。

App共通処理で採用・不採用理由、Canonical UIの説明・表示文から参考サイト名と出典URLを匿名化。資料間の異なる数値・観測条件・採否理由は保持し、実機上の「一撃獲得枚数」等の用語は置換しない。技術IDや元package、Researchの出典・監査履歴も変更しない。

単一機種の文言修正だけでなく、既存273機種の表示データを検証。元データでは12機種14理由と1機種説明に対象名が存在した。修正後の表示データで対象名0件。App lint・全テスト、実際のReact描画テスト、Rendered UI Validatorの回帰テストPASS。参考サイト名を画面に出さない規則をResearch Process Contractへ固定。

修正版APKは同じ既存QA Integration Boundaryで生成し、配信データ・数値・設定推測モデルは更新しない。最終APK・CI結果は最新 `handoff.json` を参照。

## 修正版成果物

App commit `7756b93942f5d434cbe2d027a18f6bea81c35163`。QA run `38975910280`: SUCCESS。対象10描画PASS、V8.5全180機種PASS、失敗0件。既存readiness Validatorも10/10 QA_READY。

APK `SloAnalytica-Batch018-10Machine-vc2002886741.apk` (4,509,520 bytes)。SHA256 `c7778487de6323359494d1bea9265f2804fb61abebf92a5a7fa9991853d3cd35`。Actions取得ZIP/APKのハッシュ一致、固定開発署名検証PASS。出典名除去は上書きAPKで反映される。配信package/確率/制約は変更なし。

次のユーザー確認は防振りの修正理由文のみ。既受理9機種は元APKの結果を保持し、新APKで再確認済みと書き換えない。次の部分受理は機種ID L_BOFURI_FNのみで、最新handoffのApp/QA/APKに固定する。部分受理記録のファイル名は日付と決定内容のハッシュを含み、同日に複数の受理があっても前の記録を上書きしない。
