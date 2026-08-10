# Publish Workflow v1

## 目的
レビュー済みMachineDataを、承認SHAで固定してから `machines/` と `catalog.json` へ安全に反映する。

## 手順
1. Phase 5で `READY_FOR_REVIEW`
2. 生成ドラフトへ必要な機種固有UI・Evidence・説明等を追加し、レビュー済みpackageを用意
3. `npm run machine:publish -- approve MACHINE_ID [reviewed-package-path]`
4. `npm run machine:publish -- publish MACHINE_ID`
   - DRY RUN
   - version / size / SHA / catalog変更内容を確認
5. `npm run machine:publish -- publish MACHINE_ID --apply`
   - `machines/MACHINE_ID/machine-package.json` 反映
   - catalog.json 更新
   - 最終Auditor
   - Auditor失敗時は自動ロールバック
6. Git差分確認 → commit → push

## 安全設計
- `publish` のデフォルトはDRY RUN。
- approved packageのSHAがapproval.jsonと一致しないと公開不可。
- 既存catalog項目の minimumAppVersionCode / packageUrl / requiredCapabilities / status は既存機種更新時に維持。
- 新規機種ではrequiredCapabilitiesをMachineDataから自動導出し、prototype-multi-machineの標準packageUrlを生成。
- 最終Auditor失敗時はMachineDataとcatalogを元へ戻す。
