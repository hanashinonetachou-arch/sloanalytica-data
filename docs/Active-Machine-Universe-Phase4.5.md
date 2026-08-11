# Active Machine Universe Phase 4.5

## 目的
設置台数ランキング外の機種も情報取得・MachineData候補から落とさない。

## 原則
- `active-machine-universe.json` が候補母集団。
- TOP25 PresenceはUniverseへの参加条件ではない。
- Presence順位は市場Scoreの材料の一つ。
- 新台スケジュール由来機種はランキング外でもUniverseへ残す。
- 将来は月次スケジュール、設置状況、追加ソースを同じUniverseへ差分マージする。
- RETIREDは即削除せず状態として保持する。

## コマンド
`npm run universe:build`
`npm run universe:validate`
`npm run universe:status`
`npm run universe:status -- --outside-ranking`
`npm run universe:status -- --missing`
