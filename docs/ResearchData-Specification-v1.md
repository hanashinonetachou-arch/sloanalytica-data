# ResearchData Specification v1

## 目的

ResearchDataは、Web調査で確認した公開事実をMachineData作成工程から分離して保存する中間データです。

目的は次の3点です。

1. 同じ機種について後工程のたびにWeb調査をやり直さない。
2. 長い調査報告書をAIへ繰り返し入力せず、必要な事実だけ再利用する。
3. 統計評価・MachineData生成・監査をローカル自動化できるようにする。

ResearchDataには**採用／不採用の最終判断、重み、必要試行数、MachineData固有UI定義を保存しません**。これらは後続工程の責務です。

## 保存場所

```text
research/<machineId>/research-data.json
```

ひな形は `research/_template/research-data.json` を使用します。

## 最小構造

- `schemaVersion`: `research-data-v1` 固定。
- `machine`: 機種認証情報。実在設定一覧と認証に用いた出典参照を保持。
- `researchedAt`: 調査日。
- `sources`: 出典を一度だけ登録し、Feature/EvidenceからID参照する。
- `features`: 設定差がある、または候補として検討する公開解析値。
- `evidenceCandidates`: 設定確定・否定・設定下限などの公開事実候補。
- `conflicts`: 出典間不一致や定義不明を明示的に保存する。

## 数値の保存原則

確率は後工程でそのまま計算できるよう `probability` を0～1の数値で保存します。元サイトが `1/128.5` のように掲載している場合は、監査可能性のため `rawDisplay` と必要に応じて `numerator` / `denominator` も保存します。

数値を推測で補完してはいけません。設定3だけ不明などの場合、その設定値を創作せず、`factStatus: pending` または `conflict` とし、必要なら `conflicts` に理由を記録します。

## 出典の扱い

同じURLを各Featureへ繰り返し書かず、`sources`へ一度登録して `sourceRefs` で参照します。これによりデータ量を減らし、URLや確認日の更新も一か所で済みます。

`crossSourceStatus` は次の4種類です。

- `single_source`: 1出典のみ確認。
- `matched`: 複数出典で一致。
- `rounded_match`: 表示桁の違いのみで実質一致。
- `conflict`: 実質的な不一致あり。

## Feature候補

`researchFeatureId` はResearchData内で安定したIDとし、MachineDataの最終Feature IDとは独立させます。

`candidateModel` は調査段階の候補で、`binomial` / `multinomial` / `poisson` / `unknown` のいずれかです。最終モデルの決定はStatistical Evaluator以降で行います。

`trialUnit`、`numeratorDefinition`、`denominatorDefinition` は必須です。確率だけを保存して分母の意味を失うことを防ぎます。

## Evidence候補

Evidenceは元サイトの表現を `sourceWording` に保持しつつ、有限設定集合として `allowedSettings` / `deniedSettings` に正規化します。

解析サイトが「濃厚!?」など断定を避ける表現をしている場合、その表現を改変せず記録します。最終的にHard Evidenceとして採用するかは後工程で判断します。

## ResearchDataに入れないもの

- Featureの採否
- Feature weight
- 必要試行回数
- 情報量・KL divergence等の評価値
- 短期／長期評価
- UI配置
- MachineData用inputId
- catalogのSHA-256 / size

これらを分離することで、統計評価ロジックを将来変更してもWeb調査を再実行せずResearchDataから再計算できます。

## ローカル検証

```text
npm run research:validate -- research/<machineId>/research-data.json
```

検証は、必須項目、ID重複、設定ID、確率範囲、出典参照、Evidenceの設定集合、競合参照などを確認します。

## 後続工程

```text
Web調査
  ↓
ResearchData
  ↓
Statistical Evaluator（Phase 3）
  ↓
SelectionData
  ↓
MachineData Builder（Phase 4）
  ↓
MachineData Auditor
```

通常はResearchData作成後に元の長文調査報告書をAIへ再投入しません。例外・競合・定義不足だけをAIまたは人間へ戻します。

## Multinomial候補の保存

`candidateModel: multinomial` のFeatureは、`categories` と `settingDistributions` を使用します。

```json
{
  "categories": ["基本", "偶数示唆", "高設定示唆"],
  "settingDistributions": {
    "SET_1": {"基本": 0.70, "偶数示唆": 0.20, "高設定示唆": 0.10},
    "SET_6": {"基本": 0.45, "偶数示唆": 0.20, "高設定示唆": 0.35}
  }
}
```

完全な分布として評価する場合、各設定の全カテゴリ確率合計は1でなければなりません。公開情報が一部カテゴリしか存在しない場合、不足確率を推測して補完してはいけません。その場合は警告を残し、Statistical Evaluatorは自動評価対象から外します。
