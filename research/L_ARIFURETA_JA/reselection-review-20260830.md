# L_ARIFURETA_JA 再Selection監査 2026-08-30

## 結論

現行主軸 `RF_COMBINED_FIRST_HIT` は維持する。

高確・引鉄高確系4候補は、実機所見により「観測不能」を不採用理由にしない。公開値上は十分な設定差があり、とくに `RF_TRIGGER_HIGH_SUIKA` は強い。しかし、これらは初当りへ至る状態遷移経路の一部で、現行の周辺尤度 `P(初当り|設定)` と独立に掛けると同じ因果経路を重ねて評価する危険があるため、現行Engineでは数値推測に採用しない。

将来、経路依存Featureを joint/conditional model で扱えるCapabilityを実装した場合は再評価する。

## 高確系の再評価

| Research Feature | 公開設定差 SET1→SET6 | 観測性 | 現行Selection |
|---|---:|---|---|
| RF_HIGH_TRANSITION | 13%→23% | 実戦上観測可能。設定変更機会は据え置き不明時を除外する必要あり | EXCLUDE: 初当り経路との依存 |
| RF_TRIGGER_HIGH_SUIKA | 55%→85% | 高確対応ステージ中のスイカと引鉄高確移行を観測可能 | EXCLUDE: 初当り経路との依存 |
| RF_TRIGGER_HIGH_WEAK_CHERRY | 21%→28% | 引鉄高確移行を実戦上観測可能 | EXCLUDE: 初当り経路との依存 |
| RF_TRIGGER_HIGH_WEAK_CHANCE | 40%→50% | 引鉄高確移行を実戦上観測可能 | EXCLUDE: 初当り経路との依存 |

単独Featureとしての設定1対6の1試行あたり情報量は、高確中スイカ→引鉄高確が最大。これは「有用でない」ことを意味せず、現行Engineで独立尤度として併用することだけを避ける判断である。

## ミュウボーナス中キャラ紹介

公開解析には8シナリオの設定別振り分けが存在する。現行Researchはこれを `RE_MYU_SCENARIO` の示唆Evidence候補としてしか保持しておらず、数値分布を落としている。これは Web→Discovery/Research のcoverage debt。

数値Featureとしては、ミュウボーナス1回をtrial、8シナリオを排他的カテゴリとする multinomial 候補。ボーナス発生回数の尤度とシナリオ条件付き分布は `P(N bonus|設定) × P(scenario|bonus,設定)` と分解できるため、初当り合算との単純な二重計上とは異なる。ただしAT当選時の特殊キャラ置換・ミニキャラムービー等、通常シナリオ観測から除外すべき条件をObservationで固定してから採用する。

## AT終了画面

大迷宮RUSH終了画面は総ゲーム数帯で設定別振り分けが変わる。公開帯は `1999G以下 / 2000～5999G / 6000G以上`。

実機確認により筐体メニューで総ゲーム数を取得できるため、Observation上の条件値取得は可能。UI候補は総ゲーム数帯タブ + 画面カテゴリカウンター。

ただし1999G以下の高設定確定系カテゴリは「1%未満」としか公開されず完全な厳密multinomialを構成できない。2000G以降は公開表を使えるが、現行Research/Selection schema と Engine はゲーム数帯依存分布を正式表現していないため、conditional/banded multinomial Capability追加前に無理に既存multinomialへ押し込まない。

確定画面（ハジメ4+、ユエ5+、レミア・ミュウ・ユエ6）は従来どおりEvidenceとして利用可能。

## 次の実装条件

1. Researchにミュウシナリオ設定別完全分布を数値Featureとして移管する。
2. Observationで通常シナリオの有効trial条件を確定する。
3. conditional/banded multinomialをResearch/Selection/Engine/UIで表現する最小Capabilityを設計する。
4. AT終了画面は総G帯タブを使用し、各帯のカテゴリカウントを別々に保持する。
5. 高確系は現行では不採用理由を「観測不能」から「初当り経路との依存」に変更し、将来joint model対象として保持する。

## Sources

- なな徹: 設定判別 / 高確・引鉄高確移行率
- なな徹: AT終了画面による設定示唆
- なな徹: ミュウボーナス中キャラ紹介による設定示唆
- ユーザー実機確認: 筐体メニューに総ゲーム数表示あり、高確/引鉄高確は対応ステージ移行から実戦上判別しやすい
