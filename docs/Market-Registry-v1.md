# Market Registry v1

## 目的
市場側の公開機種一覧と、スロアナリカ内部Machine Registryを安全に突合する。

## 重要原則
- 市場サイトの機種名だけから内部`machineId`を推測生成しない。
- `market-snapshot.json` は外部市場観測。`machine-registry.json` は内部管理台帳。
- 未紐付け機種は `machines:status -- --missing` で確認できるが、正式machineIdはResearch開始時に確定する。
- 初期Snapshotは `RECENT_RELEASE_SEED` であり、日本の稼働中機種全体を網羅したものではない。

## コマンド
- `npm run market:validate`
- `npm run market:merge`
- `npm run machines:status -- --market`
- `npm run machines:status -- --missing`

## 次段階
P-WORLD設置状況・過去導入月を使ってSnapshotのカバレッジを拡張し、差分更新へ移行する。
