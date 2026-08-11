# Phase 9.4B — Cross-Machine Calibration

## 目的
Difficulty Analyzer v1.0 の 0〜100 設定判別スコアを、性質の異なる複数機種で横断校正する。
単一機種の結果に合わせて重みや尺度を調整しない。

## 校正対象
- マイジャグラーⅤ: 高頻度数値Feature型
- コードギアス3 C.C.&Kallen ver.: 複数Feature混合型
- 東京喰種: AT/CZ・低頻度Feature混合型
- Lパチスロ かぐや様は告らせたい: Evidence偏重・数値判別困難型

## Phase 9.4B-1 — Calibration Readiness
スコア比較の前に、全対象について以下を必須とする。
1. ResearchDataが存在する。
2. SelectionDataが存在する。
3. 採用中の全数値Featureに `difficultyExposure` が明示されている。
4. ゲーム数→試行数換算を推測で補完しない。
5. Hard Evidenceはスコアへ含めない。

`npm run difficulty:calibration:readiness` で readiness を確認する。
`READY` でない機種が1つでもある間は、4機種のスコアを横比較して校正判断をしない。

## Phase 9.4B-2 — Cross-Machine Scoring
全機種READY後、1500G / 3000G / 7000Gを同一Analyzer・同一Score Specificationで評価する。
比較項目:
- score
- normalizedInformation
- exactSettingAccuracy / exactSettingSkill
- meanRankDistance / rankDistanceSkill
- meanPosteriorOnTrueSetting
- Feature別必要試行数
- 1500→3000G、3000→7000Gのスコア改善量

## 校正時の禁止事項
- 「ジャグラーは簡単なはず」等の事前期待にスコアを合わせない。
- 不足するFeature exposureを実戦感覚だけで仮定しない。
- Evidence出現率が不明なのに難易度へ混ぜない。
- 1機種だけを見て重み45/35/20を変更しない。
