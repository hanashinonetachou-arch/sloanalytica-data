# Love嬢3 — Manifest v8 UI Preview Checkpoint / Revision 2

Generated from the revised Canonical UI after the generic denominator, explanation-folding and repeated-observation rules were added to Manifest v8.

## Global behavior
- Accordion: single-open.
- Long explanations: separately foldable; folding the explanation never hides inputs.
- Quick Input: disabled.
- Repeated categorical observations: accumulated; selecting/recording a second event never overwrites the first.

<details open>
<summary><strong>通常時</strong></summary>

<details><summary>入力方法</summary>
通常時のゲーム数とLOVE ZONEを記録します。AT初当りはLOVE ZONEを数えられない場合の代替情報で、両方を独立加点しません。液晶右上の示唆は発生するたびに追加記録します。
</details>

### 通常時ゲーム数
<details><summary>母数に含める範囲</summary>
通常時として実際に回したゲーム数を入力します。AT中など通常時ではない区間は含めません。この値をLOVE ZONE出現率の母数として使います。AT初当りを代替利用する場合も同じ通常時ゲーム数を参照し、同じ値を二重入力させません。
</details>

**通常時ゲーム数**　［　　　　　　G］

### 設定推測の主軸
| LOVE ZONE | |
|---|---|
| −　0　＋ | |

### 代替データ
<details><summary>代替データについて</summary>LOVE ZONEを数えている場合、AT初当りを独立加点しません。</details>

| AT初当り | |
|---|---|
| −　0　＋ | |

### 液晶右上ウインドウ
［＋ 観測を追加］

累積: 数奇な運命 0 / 偶然の出会い 0 / 最後まで 0 / 満足いただける 0 / 上質な 0 / 最高級の 0

**2回目以降:** ［＋ 観測を追加］を再度押して今回の表示を選択。既存件数は残り、該当カテゴリだけ +1。

</details>

<details>
<summary><strong>AT中</strong></summary>
<details><summary>説明</summary>ゾロ目獲得枚数表示が出た都度記録します。未確認と、確認したが該当表示なしは区別します。</details>

**獲得枚数表示**　［＋ 観測を追加］  
累積: 222枚 0 / 333枚 0 / 444枚 0 / 555枚 0 / 666枚 0

2回目以降も追加記録し、前回を上書きしません。
</details>

<details>
<summary><strong>AT終了時</strong></summary>
<details><summary>説明</summary>AT終了ごとに終了画面を確認し、PUSHでスタンプを確認します。</details>

**終了画面**　［＋ 観測を追加］  
累積: 奇数対応 0 / 偶数対応 0 / 高設定示唆 0

**スタンプ — PUSHで確認**　［＋ 観測を追加］  
累積: 可 0 / 吉 0 / 良 0 / 優 0 / 極 0

次のAT終了時も同じ［＋ 観測を追加］から記録し、過去の観測を保持します。
</details>

<details>
<summary><strong>この機種の設定推測について</strong></summary>
<details><summary>説明</summary>公開値の調査範囲、採否理由、依存関係、判別力を表示します。</details>

主軸: LOVE ZONE / 代替: AT初当り（独立乗算しない）

1500G: 69.19% / 3000G: 76.56% / 7000G: 85.94%

不採用・UNRESOLVED項目も理由付きで表示。
</details>

## Revision-2 gate
- [x] Denominator says what value to enter.
- [x] Shared denominator is entered once.
- [x] Long explanation is independently collapsible.
- [x] Repeated categorical input has an explicit second-observation path.
- [x] Previous categorical observations are preserved and accumulated.
- [x] Two-column baseline retained where operationally compatible.
