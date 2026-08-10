# Statistical Evaluator v1.1

Phase 3はResearchDataの公開事実から、AIを使わず再現可能な統計指標を計算します。採用/不採用、重み、実戦上の価値は決定しません。

## Binomial / Poisson候補
- 設定別確率範囲・最大差
- 設定ペアごとの確率比
- Bernoulli Jensen-Shannon divergence
- 2比率の正規近似による95%分離試行数の目安
- 最も厳しい隣接設定ペア

## Multinomial候補
完全なカテゴリ確率分布が2設定以上ある場合に以下を計算します。
- Jensen-Shannon divergence
- Total Variation Distance
- Hellinger squared distance
- Bhattacharyya coefficient
- Bhattacharyya上界に基づき、等事前確率の2設定識別でBayes error上界が5%以下になる試行数の目安
- 最も厳しい隣接設定ペア

Multinomialのカテゴリが欠損している、または合計が1にならない場合は推測補完せず評価しません。

## 注意
試行数は設計比較用の近似・上界ベースの目安であり、その回数で設定を断定できる保証ではありません。また「1試行」が何ゲームで得られるかはFeatureごとに異なるため、ゲーム数換算は後続工程で扱います。

## 実行
`npm run stats:evaluate -- research/<machine>/research-data.json reports/<machine>-statistics.json`
