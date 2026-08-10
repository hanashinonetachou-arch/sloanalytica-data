# Statistical Evaluator v1

Phase 3 の目的は、ResearchData に含まれる公開事実から、AIを使わず再現可能な統計指標を計算することです。

## 境界
Evaluator は採用/不採用、重み、実戦上の価値を決定しません。それらは後段の SelectionData で扱います。

## v1 自動計算
- 設定別確率の最小/最大
- 最大絶対差
- 設定ペアごとの確率比
- Bernoulli Jensen-Shannon divergence
- 2比率の正規近似による95%分離試行数の目安
- 隣接設定のうち最も厳しいペア

試行数は設計比較用の近似値であり、「この回数なら設定を断定できる」という保証値ではありません。

## 対応
v1 の自動試行数評価は binomial / poisson 候補を対象にします。multinomial は後続拡張でカテゴリ確率ベクトルをResearchDataに保持できるようにしてから対応します。

## 実行
`npm run stats:evaluate -- research/<machine>/research-data.json reports/<machine>-statistics.json`
