# Difficulty Exposure Audit — Phase 9.4B-2

## 目的
Difficulty Analyzer の 1500G / 3000G / 7000G 比較に使う「ゲーム数→Feature試行数」の換算品質を監査する。

## 信頼区分
- **EXACT**: Feature分母が基準ゲーム数に直接一致し、換算に推定を含まない。
- **DERIVED**: 公開・確定済みの数値と明示式から一意に導出できる。
- **PROVISIONAL**: 暫定分母や未確定前提に依存する。探索用途には使えても最終校正には使わない。
- **UNRESOLVED**: イベント発生率など必要情報がなく、ゲーム数換算できない。推測で埋めない。

## Phase 9.4B-2 結論
コードギアス3ではチェリー・スイカのみEXACT。RB後C.C.高確対象GとAT終了画面はイベント発生率が未確定。
東京喰種ではAT初当り集計G自体がPROVISIONALであり、AT引き戻し・100G到達もゲーム数換算率が未確定。

したがって、4機種横断スコアをまだ算出・比較してはいけない。次はイベント型FeatureのExposureをResearchDataから導出できる構造と、PROVISIONALなゲーム基準を公開スコアに含めるかのルールを確定する。
