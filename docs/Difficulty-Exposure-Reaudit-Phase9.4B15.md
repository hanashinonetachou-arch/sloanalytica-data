# Phase 9.4B-15 — 全8機種 Difficulty Exposure再監査

## 結論
従来の「EXACT/DERIVEDでなければ原則スコアから除外」は厳しすぎる。
今後は `EXACT / DERIVED / ESTIMATED / UNRESOLVED` の4段階とし、
透明な推定モデルを構築できるFeatureは `ESTIMATED` としてDifficulty Scoreへ参加させる。
Score本体とScore Confidenceは分離する。

これにより、8機種中7機種は数値Difficulty Scoreを出す方向へ進められる。
かぐや様のみ、実用的な採用数値Featureがないため `EVIDENCE_DOMINANT` を維持する。

## 機種別の再監査
| 機種 | 推奨Confidence | 方針 |
|---|---|---|
| マイジャグラーV | HIGH | 現状維持。着席前データは機種固有Difficultyから除外 |
| コードギアス3 C.C.&Kallen | MEDIUM | RB後50GとAT終了画面をESTIMATEDで復帰 |
| 東京喰種 | LOW | Phase9.3暫定分母を明示したうえで4Featureとも推定参加 |
| かぐや様 | N/A | EVIDENCE_DOMINANT。スコアを無理に付けない |
| レヴュースタァライト | MEDIUM | 6Featureを原則すべて参加。契機判別率とCZランプはESTIMATED |
| アイムジャグラーEX | HIGH | 現状維持 |
| 無職転生 | MEDIUM_HIGH | シーローンを平均ステージ滞在GからESTIMATEDで復帰 |
| 化物語 | LOW_MEDIUM | AT初当り・200G到達をrenewal modelでESTIMATED |

## 特に有望な推定Exposure
- コードギアス RB後C.C.高確: RB発生率と「RB後50G」からモデル化可能。別ボーナスによる中断を考慮する。
- 無職転生 シーローン: 公開される1ステージ平均53Gと、既存の有効ステチェン除外ルールから有効試行数をレンジ推定可能。
- 東京喰種 AT引き戻し: AT初当り率と引き戻し率からAT終了試行数をrenewal近似できる。
- レヴュースタァライト CZランプ: CZ率とランプ色別CZ期待度からランプ試行頻度を逆算する推定モデルを構築できる。

## 実装上の重要変更
1. `ESTIMATED` を正式なExposure品質として追加する。
2. `ESTIMATED` はDifficulty Scoreへ参加できる。
3. Scoreとは別にConfidenceを保持・表示する。
4. 推定Exposureは必ず式・根拠・仮定をMachineData/SelectionDataに保持する。
5. 可能なら単一点ではなくrange/uncertaintyを保持する。
6. `UNRESOLVED`だけを数値スコアから除外する。
7. Hard Evidenceは引き続きDifficulty Scoreへ混ぜない。

## 実装順
最初にレヴュースタァライトと無職転生でESTIMATED実装を検証する。
この2機種は公開情報から推定Exposureを比較的明瞭に構築できる。
次にコードギアス、東京喰種。
化物語は通常/AT時間配分と200G到達のrenewal modelが必要なため最後に行う。

このPhaseではAnalyzer/MachineDataの計算実装は変更しない。監査結果と次Phase仕様だけを追加する。
