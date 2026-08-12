# Phase 10E Publish Report — スマスロ頭文字D 2nd

- machineId: `L_INITIAL_D_2ND`
- branch target: `prototype-multi-machine`
- machineDataVersion: `0.1.0`
- publish status: `PUBLISHED_AND_AUDITED`
- published package SHA-256: `a136464e48a186e1570eaa9517187d8dc68a33aa53597e4cae2d7a78206f2df4`
- published package size: 24527 bytes
- catalog machines after publish: 10
- audit: PASS / warnings 0
- tests: 111 / 111 PASS

## Numeric inference Features

1. 通常時レジェンドバトル初当り — inference
2. 通常時ベル — inference（押し順ナビ区間を分母から除外）
3. AT中LB終了画面 — inference / multinomial（デフォルト・奇数示唆・偶数示唆・水着）
4. AT初当り — display only

赤・金のAT中LB終了画面は確定情報側で処理し、数値Feature側には重複させない。

## Difficulty

- raw: 1500G=12 / 3000G=20 / 7000G=30
- display: 1500G=63 / 3000G=69 / 7000G=65
- confidence: MEDIUM
- AT中LB終了画面は1Gあたり表示機会率未確定のためtargetGames換算スコアから除外。

## Practical device-test focus

- カタログから「スマスロ頭文字D 2nd」を追加できる
- 通常ゲーム数 / LB初当り / AT初当り（参考）が入力できる
- ベル集計対象Gに「押し順ナビ区間を除外」の説明が見える
- AT中LB終了画面4種を入力でき、赤・金は確定情報として別入力になっている
- 86枚OVER回数が単一選択になっている
- 計算結果・履歴保存・再読込・機種削除/再追加が正常
