# Manifest v8.5 Research: 公開資料の矛盾に関する標準処理

**適用範囲:** 全Batch・全機種のResearch。既存の `RESEARCH → EVALUATION → ELIGIBILITY → CANDIDATE_CONTRACT → ...` を変更しない。

## 候補ごとの確定手順

1. 正規Researchの中で公開値・メーカー・主要解析サイトを調査し、資料の数値・機種同定・条件を記録する。
2. 重大な矛盾があれば、根拠の優先順位を確認し、**追加照合を最大1回**実施する（1回は一つの追加入手・検証ラウンド）。
3. 正しい資料が確認できたら、その根拠で採用候補を構成する。メーカー資料を含め、いずれも無条件に優先しない。発表日時・訂正情報・対象条件を確認する。
4. 矛盾が残る場合、**その候補のみ** `SOURCE_CONFLICT_UNRESOLVED` で確定不採用。`blockedItems` に数値の不一致・出典・わかりやすい不採用理由・再評価条件を残す。`candidateLedger` は `BLOCKED` を指す。数値の `findings` には残さない。
5. 同じ出典の再検索はしない。新しい具体的な資料が発見された場合だけ、閉じた記録を保持したうえで新しいResearchレビューを実施する。
6. **一候補の矛盾を理由に機種・Batch全体を停止しない。** ほかの採用候補・Evidence候補は通常の評価に進める。

### 必須データ例（`blockedItems[]` 内）

```json
{
  "blockId": "cz-conflict",
  "disposition": "SOURCE_CONFLICT_UNRESOLVED",
  "label": "CZ初当たり",
  "reason": "公開資料ごとに設定別数値が異なり、正しい値を確定できないため採用しません。",
  "reevaluationCondition": "メーカーによる具体的な訂正情報が公表された場合。",
  "sourceIds": ["source-a", "source-b", "source-extra"],
  "sourceConflictResolution": {
    "schemaVersion": "source-conflict-v1",
    "status": "SOURCE_CONFLICT_UNRESOLVED",
    "candidateId": "cz",
    "conflictingClaim": "設定1のCZ初当たり確率",
    "checkedAt": "2026-10-12",
    "initialSourceIds": ["source-a", "source-b"],
    "additionalCheckSourceIds": ["source-extra"],
    "additionalChecksUsed": 1,
    "repeatPublicSearch": false,
    "runtimeUse": "DISABLED",
    "reopenPolicy": "NEW_CONCRETE_SOURCE_ONLY"
  }
}
```

初期出典は異なるサイトを参照し、追加照合1回分を記録する。各sourceIdは同じResearchの`sources[]`に実在し、候補台帳でBLOCKEDに結び付くこと。

## 停止条件と例外

- 出典がなく判断できない、観測母数が確定できないなどの一般的不採用は既存の `blockedItems` と理由・再評価条件で記録。資料矛盾の専用コードに無理に分類しない。
- 未調査の領域を `CHECKED` と記録しない。実在しない設定別確率、確定示唆、観測可能性を補完しない。
- 機種同定不能、正式Researchの欠損、Validator違反、承認済み機種への回帰は従来どおり停止する。
- **この契約は「未調査でも合格」とするものではなく、確認済みの資料矛盾が永久にResearchを妨げることを防ぐもの。**

## 実装

`production/src/source-conflict-standard.ts` に判定と検証を定義し、`research-process-contract.ts` の通常の検証経路から呼び出す。別の監査工程・専用中間成果物・無制限再調査は追加しない。
