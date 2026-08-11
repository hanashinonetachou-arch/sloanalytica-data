# Market Presence Phase 3

Phase 2の「直近導入機種」に加えて、現在の設置規模を根拠に優先順位を付ける。

- `market-snapshot.json`: 導入・導入予定候補
- `market-presence-snapshot.json`: 現在設置規模の上位候補
- `machine-registry.json`: スロアナリカ内部台帳

Presence Snapshot掲載だけでは新規machineIdを自動生成しない。既存RegistryへのACTIVE反映は `registryMachineId` が明示された機種だけ。

`npm run machines:status -- --priority` で、設置台数上位かつ未収録を市場規模の一次優先度として表示する。

優先度: 1〜10位 HIGH / 11〜20位 MEDIUM / 21〜25位 LOW。
この優先度はMachineData作成難易度・設定推測価値をまだ加味しない。
