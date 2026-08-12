# Phase 9.4B-19 — Difficulty Raw Score 横断監査

## 判定: PASS WITH CAUTION

| 機種 | 1500G | 3000G | 7000G | Confidence |
|---|---:|---:|---:|---|
| コードギアス3 C.C.&Kallen | 19 | 29 | 46 | LOW_MEDIUM |
| 東京喰種 | 13 | 20 | 32 | LOW |
| マイジャグラーV | 12 | 20 | 31 | MEDIUM_HIGH |
| レヴュースタァライト | 10 | 17 | 28 | MEDIUM |
| 化物語 | 9 | 16 | 27 | LOW |
| アイムジャグラーEX | 9 | 15 | 25 | HIGH |
| 無職転生 | 9 | 14 | 24 | MEDIUM |

## 監査所見
- 7機種すべてで1500G→3000G→7000GのRaw Scoreは単調増加しており、時間軸としての基本挙動は正常。
- コードギアス3が7000G=46で最大だがConfidenceはLOW_MEDIUM。現時点で「最も設定推測しやすい機種」と確定してはいけない。
- 東京喰種も32と高い一方Confidence LOW。推定分母とイベントExposureへの依存が強い。
- アイムジャグラーEXは25と中位だがConfidence HIGH。Raw Scoreとモデル信頼度は別概念として表示する設計が妥当。
- 現在の最大46を100へ正規化するのはまだ早い。機種数を増やした後に全体スケールを再調整する。
- ESTIMATED Exposureのrange/uncertaintyをMonte Carloへ伝播し、将来はScore Rangeも持てるようにするのが次の精度改善候補。

## 暫定7000G順位
1. コードギアス3 C.C.&Kallen — 46 (LOW_MEDIUM)
2. 東京喰種 — 32 (LOW)
3. マイジャグラーV — 31 (MEDIUM_HIGH)
4. レヴュースタァライト — 28 (MEDIUM)
5. 化物語 — 27 (LOW)
6. アイムジャグラーEX — 25 (HIGH)
7. 無職転生 — 24 (MEDIUM)
