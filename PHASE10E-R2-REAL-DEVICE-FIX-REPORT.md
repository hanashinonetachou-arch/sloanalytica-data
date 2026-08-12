# Phase 10E-R2 Real Device Fix Report — Initial D 2nd

## 修正
- AT中LB終了画面Multinomialを、アプリで実機動作済みのimplicit-residual契約へ適合。
- デフォルト画面を暗黙の残差カテゴリに変更。
- 明示カテゴリは奇数示唆・偶数示唆・水着。
- 赤・金は従来どおり確定情報へ分離。
- sum_inputs_to_trialsの分母はデフォルト＋奇数＋偶数＋水着の4入力合計。
- Selection Schema/Validator/Builderに汎用 residualCategoryLabel を追加。
- MachineData versionを0.1.1へ更新。
- ベル分母はマイスロ通常ゲーム数と統合せず、LB確定画面の押し順ナビ区間・LB中除外をUIに明記。

## 理由
既存のコードギアスAT終了画面では、denominatorInputIdが残差カテゴリを表し、numeratorInputId + categoryInputIdsのみを明示確率としてProbabilityEngineへ渡す。頭文字D R1は4カテゴリすべてを明示していたため、この既存アプリ契約と不一致だった。

## 検証
- npm test: 114/114 PASS
- npm run audit: 10機種、警告0
