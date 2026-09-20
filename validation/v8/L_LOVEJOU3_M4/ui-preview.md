# Love嬢3 — Manifest v8 UI Preview Checkpoint

> This preview is generated from `validation/v8/L_LOVEJOU3_M4/canonical-ui.json`. It is not a hand-designed replacement contract and is not a real-device PASS.

## Preview state

- Accordion: **single-open**
- Initially open: **通常時**
- Quick Input: **disabled**
- Distribution / APK / real-device: **blocked until UI Preview acceptance**

---

<details open>
<summary><strong>通常時</strong></summary>

通常時のゲーム数と、LOVE ZONEの突入回数を記録します。AT初当りはLOVE ZONEを数えられない場合の代替情報で、両方を独立した好材料として二重評価しません。液晶右上に緑文字の設定示唆が出た場合もここで記録します。

### 設定推測の主軸

| LOVE ZONE | |
|---|---|
| 回数［入力］ | |
| **通常時ゲーム数［入力］（全幅）** | |

### 代替データ

LOVE ZONEを数えている場合、AT初当りを独立加点しません。

| AT初当り | |
|---|---|
| 回数［入力］ | |

### 液晶右上ウインドウ

観測した緑文字を記録します。未確認と「該当表示なし」は区別します。

［数奇な運命］［偶然の出会い］［最後まで］［満足いただける］［上質な］［最高級の］

</details>

<details>
<summary><strong>AT中</strong></summary>

AT中に222・333・444・555・666枚OVERの表示が出たら、その表示を記録します。出なかった場合と、確認していない場合は区別します。

**獲得枚数表示**

［222枚］［333枚］［444枚］［555枚］［666枚］

</details>

<details>
<summary><strong>AT終了時</strong></summary>

AT終了時に画面とスタンプを確認します。**PUSHで確認**できるスタンプは設定下限・設定6確定のEvidenceです。キャスト構成による奇偶/高設定示唆も観測事実として記録します。

**終了画面**

［奇数図柄対応キャスト］［偶数図柄対応キャスト］［7・H・ヘルプ嬢］

**スタンプ — PUSHで確認**

［可］［吉］［良］［優］［極］

</details>

<details>
<summary><strong>この機種の設定推測について</strong></summary>

**主軸はLOVE ZONE。AT初当りは代替情報です。**

### 採用
- LOVE ZONE出現 — PRIMARY
- AT初当り — ALTERNATIVE（LOVE ZONEと独立乗算しない）

### 今回の推測入力に採用しない／保留
- W LOVE RUSH — 単独採用閾値未満
- 全キャストクリア — 実戦情報量が小さい
- 設定変更時モード／内部状態 — 通常の反復入力に不向き
- LOVE ZONEステージ — 公開分布が不完全
- LOVE ZONE失敗後復活 — Exposure未解決
- リラクの泉 — AT終了Exposure/依存関係を追加解決する必要あり

### LOW(設定1–2) / HIGH(設定5–6) 判別

| プレイ量 | Balanced Accuracy |
|---:|---:|
| 1500G | 69.19% |
| 3000G | 76.56% |
| 7000G | 85.94% |

</details>

## Preview-specific checks

- [x] Observation ContextでSection化
- [x] Accordion / single-open contract
- [x] Section description
- [x] PRIMARY / ALTERNATIVEをUI上で区別
- [x] 分母を曖昧な「対応通常ゲーム」にしない
- [x] EvidenceをAT中 / AT終了時 / 通常時に配置
- [x] AT終了時のObservation Actionを表示
- [x] 未観測と0回/該当なしを区別する契約
- [x] HighLowDiscriminationをSummaryに表示
- [x] 不採用/UNRESOLVED情報を消さない
- [x] Quick Inputに依存しない

## Known implementation gap discovered before device work

The current production adapter (`tools/adapt-research-pipeline-to-runtime.mjs`) only consumes legacy Canonical UI sections with `kind=NUMERIC/EVIDENCE` and flat `inputs/items`. It cannot faithfully consume the v8 `groups`, Accordion `singleOpen`, Summary section, or the full Evidence/description contract. Therefore package generation with that adapter is intentionally blocked at this checkpoint instead of degrading the v8 UI.
