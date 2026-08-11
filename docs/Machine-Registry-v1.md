# Machine Registry v1

市場に存在する機種とスロアナリカ収録状況を分離して管理する唯一の台帳。

## 三層構造
Machine Registry → ResearchData → catalog.json

## コマンド
- `npm run registry:validate`
- `npm run registry:sync` catalog収録機種をRegistryへ同期（市場情報・実機状態は上書きしない）
- `npm run machines:status`
- `npm run machines:status -- --missing` 稼働中/稼働候補なのに未収録の機種
- `npm run machines:status -- --active`
- `npm run machines:status -- --included`

## 原則
市場状態は公開情報で確認してから更新する。catalog収録だけを根拠にACTIVEとはしない。
