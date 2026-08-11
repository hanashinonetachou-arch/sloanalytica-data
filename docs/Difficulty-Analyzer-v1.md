# Difficulty Analyzer v1

## 目的
MachineDataの数値Featureだけを使った「設定判別のしやすさ」を、1500G・3000G・7000Gなど任意のゲーム数で0〜100の整数スコアとして評価する。
Hard Evidenceは発生率が未公開であることが多いため、難易度スコアには含めない。

## スコア
各ターゲットGで、利用可能な全設定を一様事前確率としてモンテカルロ生成し、実際のベイズ尤度計算と同じ考え方で事後確率を求める。

Score = 100 × (0.45 × Information + 0.35 × ExactSkill + 0.20 × DistanceSkill)

- Information: `1 - H(posterior) / log(K)`。設定分布がどれだけ絞れたか。
- ExactSkill: 完全一致率をランダム正解率 `1/K` で補正。
- DistanceSkill: 推定設定順位と真の設定順位の平均距離をランダム推定時の期待距離で補正。
- 設定1・2・4・5・6のような欠番機種でも、数値ラベル差ではなく設定順位で評価する。

スコアは四捨五入して0〜100整数。高いほど数値設定判別が容易。

## difficultyExposure
ゲーム数から各Featureの試行数へ換算する定義をSelectionDataに明示する。Analyzerは推測しない。

```json
{
  "difficultyExposure": { "mode": "per_game", "factor": 1.0 }
}
```

対応モード:
- `per_game`: `targetGames × factor`
- `fixed_rate`: `targetGames × trialsPerGame`
- `setting_rate`: `targetGames × trialsPerGameBySetting[SET_x]`

AT終了回数、REG回数など、ゲーム数との関係が公開情報から確定できないFeatureはdifficultyExposureを付けない。その場合、機種スコアはPARTIAL/NOT_CONFIGUREDとなり不足Feature IDを報告する。

## Feature必要試行数
各Featureについて、利用可能設定の最低設定と最高設定を等事前の2仮説とし、「Bayes分類精度80%以上」を設計基準とする。
Bhattacharyya係数によるBayes誤り率上界 `Pe <= 0.5 * BC^n` が20%以下になるnを目安として表示する。
ユーザー表示は「設定1・6判別目安：約n試行」のようにし、保証値ではないことを明記する。

## Evidence
Hard Evidenceは難易度スコアから除外する。UIでは別途「設定確定・設定下限演出は判別スコアとは別に反映」と説明する。

## 実行
`npm run difficulty:evaluate -- research/<machine>/research-data.json research/<machine>/selection-data.json [output.json]`
