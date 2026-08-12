# Phase 9.4B-21C — Eureka TYPE-ART Difficulty再監査

## 原因
`NOT_CONFIGURED` の理由は設定推測Feature不足ではなく、SelectionDataに `difficultyAnalysis` / `difficultyExposure` が未設定だったため。

## 採用
- ART初当り: ESTIMATED / LOW_MEDIUM
- 共通7枚ベル: ESTIMATED / MEDIUM_HIGH

両FeatureともProbabilityEngineでは既に採用済み。Difficultyでは公開分母範囲の完全一致が未確認なためEXACTへ昇格させず、共通の推定ゲーム基準で参加させる。

## 不採用
通常時0pt終了REG→ARTストックはDifficultyへ追加しない。ART初当りとの重複を避ける既存方針を維持。

## Result
Raw Score:
- 1500G: 15
- 3000G: 23
- 7000G: 34

現行暫定CalibrationによるDisplay Score:
- 1500G: 79
- 3000G: 79
- 7000G: 74

Score Confidence: LOW_MEDIUM
