# SloAnalytica — 正本照合・限定争点監査（2026-10-22）

## 実際にGitHubから照合できた事項
- data repo `hanashinonetachou-arch/sloanalytica-data`: public、default branch `main`。
- app repo `hanashinonetachou-arch/sloanalytica-app`: private、default branch `main`。コネクタからメタデータを取得できた。
- `production/config/orchestrator.json`: manifestVersion `8.5`; `repositoryStateIsSourceOfTruth: true`; `deleteAllowed: false`; semanticSlots 2、productionSlots 2、validationSlots 2、integrationSlots 1。
- `production/package.json`: `complete-research`、`dispatch`、`ingest-result` 等の既存CLIを確認。
- 既存Research個別候補、Batch番号、Production State一式の照合は**まだ未完了**。上記をもって10機種の正式終了を宣言してはならない。

## 限定争点の精査: 10 スマスロケロット5BT
2026-10-22確認。
- なな徹個別ページ `https://nana-press.com/kaiseki/machine/1170/37889/`: **通常REG** 金帯②=設定4以上。フタバBONUSの金帯②=設定5以上。
- なな徹機種トップ `https://nana-press.com/kaiseki/machine/1170/`: **通常REG** 金帯②=設定5以上。フタバBONUSの金帯②=設定5以上。
- P-WORLD `https://www.p-world.co.jp/machine/database/10479`: 通常REGの金帯は絵柄別、フタバ&ケロルン&ヒマワリ=設定4以上、山佐キャラ=設定5以上と記載。フタバBONUSでも同様に絵柄別。
### 結論
番号（①/②）だけを根拠に正確な設定下限制約とみなせない。表示絵柄を確認できる入力は「フタバ&ケロルン&ヒマワリ」=4以上、「山佐キャラ」=5以上の**候補**を維持。絵柄が判別できない金帯②は記録のみで制約非適用。独立したメーカー一次確認は未実施。資料間矛盾は監査証跡として保持したまま局所的に閉じる。後続契約で必ず実機画像・表示カテゴリー照合する。

## 限定争点の精査: 06 マジハロBT
- `https://nana-press.com/kaiseki/machine/1013/31870/` に虹アリストロフィー=設定6との表があるが明示的な脚注『従来機種の示唆内容を参考』がある。
- 本機の虹=設定6 Exact Constraintには変換しない。実戦目撃/メーカー確認情報が加わるまで参考記録のみ。

## 次の機種別処理
01→10の順に、各ファイルの未照合部分と正本の既存候補/依存関係を一機種ずつ照合し、Research終了状態を確定して記録する。Repository APIでディレクトリ列挙ができていないため機種IDと最新Batch確定を推測しない。元の10件のMarkdownはいずれも保存済み、正式Evaluation/Eligibility/Contractは未実施。

## 監査の性質
既存成果物および公開資料の**自己監査**。独立外部監査は実施していない。UI説明文には参考サイト名を記載しない。
