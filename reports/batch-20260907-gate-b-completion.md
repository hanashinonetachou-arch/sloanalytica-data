# SloAnalytica 2026-09-07 Next10 — Gate B checkpoint

## Status

**Gate B / Statistical Selection + Dependency Audit: PASS**

- exact batch scope: 10/10
- Research Features evaluated: 38/38
- selected: 34
- rejected: 4
- Research Evidence dispositioned: 95/95
- strict batch ingest: READY_FOR_MACHINE 10 / REVIEW 0 / BLOCKED 0
- public main: unchanged

## Reconsideration from Gate C

LBトリプルクラウンセブンのプラムは、チェリーと同一の通常ゲーム分母上で排他的に成立する自然観測であることがGate Cで明確になったため、Selectionを再評価した。独立Binomialとしてチェリーと同時利用すると同じ通常ゲーム情報を二重に尤度化するため、プラムをEXCLUDEへ変更し、設定差がより大きいチェリーを代表Featureとして残した。Research候補自体は保持する。

その他の包含・因果依存Featureは既存suppression/Fallback契約を維持する。ヨルムンガンド終了画面はHard Evidenceカテゴリを数値Multinomialから除外し、同一観測の二重評価を防止する。
