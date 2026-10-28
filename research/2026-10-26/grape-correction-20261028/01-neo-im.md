# ネオアイムジャグラーEX 通常時ブドウ Research訂正（2026-10-28）

Machine ID: `S_NEO_IM_JUGGLER_EX_KK`。2026-10-26 Batch026の既存Researchに対する追補。既存候補ID・Contractは**変更しない**。Research参照用でありProduction package/QAは未変更。

## 掲載確認・採用方針
- juggler7：当該機種の設定別通常時ブドウ表を本文で確認。https://juggler7.com/neo-aimex/kaiseki.html
- 一撃：https://1geki.jp/slot/s_nijex/0/。旧機種アプリ参照表 https://1geki.jp/slot/s_nijex/4/。同一サイト内の重複記事や同じ実戦報告は１票のみ。
- DMMぱちタウン：https://p-town.dmm.com/specials/4486 （ネオアイム指定開始点）。403で本文確認不能。対象機種別DMM表を確認済みと誤記しない。全設定の本算定にDMMは未加算。
- 出典の独立性：juggler7は「ガリぞう氏引用」値、 一撃は独自アプリ/実戦。転載元一致が後に確認されれば票数を再評価する。同一掲載をURL数で増やさない。
- 対象：通常時3枚掛けのブドウ成立/入賞回数の実質合算確率。単独/共通の区分を個別に採用せず、1枚掛けブドウ抜きは母数・分子から除く。実戦値の成立・入賞定義が統一されていることは完全検証できておらず、評価時の不確実性として記録。
- 由来：一撃設定1–5は旧「アイムジャグラーEX(6号機)」の実機シミュレーションアプリ実戦値（全設定合計600万G）。対象機種ネオアイムの参照表として掲載。前作由来を明示した暫定採用であり、新機種の実測と同一視しない。設定6は新機種の独自実戦1500/8638を代表とし、旧アプリ設定6（1/5.80）を同サイト内で二重計上しない。

## 設定別採用候補（出現確率を等重み平均、表示のみ分母丸め）
| 設定 | 出典原値 | サイト数 | p_mean（未丸め計算結果の表示12桁） | 参考表示分母 |
|---:|---|---:|---:|---:|
| 1 | 1/6.02 juggler7 + 1/6.06 一撃（前作アプリ） | 2 | 0.165564729230 | 1/6.03993 |
| 2 | 1/6.02 juggler7 + 1/6.04 一撃（前作アプリ） | 2 | 0.165837935359 | 1/6.02998 |
| 3 | 1/6.02 juggler7 + 1/6.04 一撃（前作アプリ） | 2 | 0.165837935359 | 1/6.02998 |
| 4 | 1/6.02 juggler7 + 1/6.04 一撃（前作アプリ） | 2 | 0.165837935359 | 1/6.02998 |
| 5 | 1/6.02 juggler7 + 1/6.02 一撃（前作アプリ） | 2 | 0.166112956811 | 1/6.02000 |
| 6 | 1/5.78 juggler7 + 1500/8638 一撃（当該機種実戦） | 2 | 0.173330844398 | 1/5.76931 |

**再計算式:** `p_mean = sum(1/denominator or hits/normal_eligible_games) / distinct_source_count; d_display=1/p_mean`。内部では各原値から倍精度で計算し、先に分母を丸めない。上記の「未算出」はゼロ確率を意味しない。

## 原数値（CSV形式。欠測設定は掲載しない）
```csv
setting,source,reciprocal_denominator,hits_over_games,url,verification
1,juggler7,6.02,,https://juggler7.com/neo-aimex/kaiseki.html,直接確認
1,一撃アプリ,6.06,,https://1geki.jp/slot/s_nijex/4/,直接確認・旧機種参照
2,juggler7,6.02,,https://juggler7.com/neo-aimex/kaiseki.html,直接確認
2,一撃アプリ,6.04,,https://1geki.jp/slot/s_nijex/4/,直接確認・旧機種参照
3,juggler7,6.02,,https://juggler7.com/neo-aimex/kaiseki.html,直接確認
3,一撃アプリ,6.04,,https://1geki.jp/slot/s_nijex/4/,直接確認・旧機種参照
4,juggler7,6.02,,https://juggler7.com/neo-aimex/kaiseki.html,直接確認
4,一撃アプリ,6.04,,https://1geki.jp/slot/s_nijex/4/,直接確認・旧機種参照
5,juggler7,6.02,,https://juggler7.com/neo-aimex/kaiseki.html,直接確認
5,一撃アプリ,6.02,,https://1geki.jp/slot/s_nijex/4/,直接確認・旧機種参照
6,juggler7,5.78,,https://juggler7.com/neo-aimex/kaiseki.html,直接確認
6,一撃実戦,,1500/8638,https://1geki.jp/slot/s_nijex/0/,直接確認
```

## 前回Researchの是正・Workへの契約
- **訂正前**：「当該機種の全設定ブドウデータがないため記録専用」。**訂正後**：「参照サイトの設定別参考表が存在する機種では、由来を注記して出現確率を等重み平均し、v8.5正式評価の候補へ」。メーカー非公表/推定/前作由来だけで排除しない。
- 候補IDは既存台帳と照合して再使用し、新規Batch番号を生成しない。既存BIG/REG・依存排他設定は保持。Selection Score=7000G基準期待情報量bit×200、CORE>=20/SUPPORT>=10/JOINT_ELIGIBLE>=5/EXCLUDE<5、PER_ELIGIBLE_TRIAL_POWERと既存Runtime Policyを変更しない。
- **未完了**：Production Candidate Contractの最新固有候補ID、実配信Packageの最新SHA、正式Selection Score/Eligibilityは本書では未検証・未計算。平均値を入れたことだけでACTIVE確定としない。
- Observation：通常時の正確な対象G（ボーナス内部G・1枚掛けを含めない）とブドウ回数。総G表示からの利用可能な変換は既存Contractに合わせて検証。入力 `null`=未入力、`0`=実測0回を厳密に区別し、部分観測は観測区間Gを明記。G未入力なのにブドウ回数だけで計算しない。
- BIG/REGは現行の3カテゴリ（BIG、REG、その他）モデルを保持。ブドウとボーナスの同一ゲーム/成立後の重なりを無根拠に独立掛算しない。必要なら同一試行の排反カテゴリ・条件付きモデル、または相互排他のEvalを検討。ボーナス推測を消さない。
- DMM本文未確認・転載関係未確定のため、これは**部分照合済みの暫定平均**。DMMの設定別原表を照合して各設定の最終平均を更新するまで「全指定サイト確認完了」と記載しない。
