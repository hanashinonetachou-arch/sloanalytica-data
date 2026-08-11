# Evidence UI Normalization Phase 8.3

Evidence UIの共通原則:

- 初期状態は未選択
- 未選択 = Evidence情報なし
- `NONE` / 「確認なし」という明示選択肢は持たない
- 選択をクリアすると未選択へ戻る
- 全グループ未選択なら全設定が残り、EvidenceEngineへ除外情報を与えない

## 設定下限
- 設定2以上
- 設定3以上
- 設定4以上
- 設定5以上
- 設定6

## 否定設定
複数選択。0件ならEvidenceなし。

## 設定集合
偶数設定濃厚などを複数選択。0件ならEvidenceなし。

内部計算は全設定集合から始め、選択された `allowedSettings` を積集合し、
`excludedSettings` を差し引く。残存設定0件なら `EVIDENCE_CONTRADICTION`。

既存EvidenceEngineは変更しない。
