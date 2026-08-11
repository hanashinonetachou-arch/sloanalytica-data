# Research Dispatch Phase 6

## 目的
PreflightでGOになった候補を、1機種ずつ本格Researchへ投入する。

## 原則
- 同時本調査は最大1機種。
- READY候補の総合score最上位を選ぶ。
- dispatch時点ではmachineIdを生成しない。
- 正式機種認証後にmachineIdを確定する。
- Preflight数値は本調査の確定データとして流用しない。
- ResearchData完成・Validator PASS後にMachineData Builderへ進む。

## コマンド
`npm run research:dispatch`
`npm run research:dispatch:status`
`npm run research:dispatch:validate`
`npm run research:dispatch:complete -- MACHINE_ID`

現在の初回対象は L 東京喰種。
