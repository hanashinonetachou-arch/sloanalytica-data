# Machine Candidate Priority Phase 4

目的は「全現役機種を毎回AI調査しない」こと。

1. Presence Snapshotから市場スコアを機械計算。
2. `npm run machines:research-queue` で上位5機種だけ調査対象化。
3. 調査後に researchReadiness / platformFit / settingInferenceValue / estimatedWorkload を記録。
4. 全項目が埋まった候補だけ `npm run machines:score` で最終スコア化。

## 最終スコア
- 市場規模 35%
- 公開解析情報の充実度 25%
- 現Platform適合度 20%
- 設定推測価値 15%
- 工数の軽さ 5%

UNKNOWNを数値化しない。未調査を低評価と誤認せず、AI usageも無駄に消費しない。
