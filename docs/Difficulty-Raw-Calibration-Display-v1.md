# Difficulty Raw / Calibration / Display v2

1. Raw Score: Analyzer output。Calibration変更では再計算しない。
2. Calibration: Difficulty Catalogで一括管理し、全ゲーム数で共通のreferenceRawを使う。
3. Display Score: `round(rawScore / referenceRaw * 100)`。App表示用。

1500/3000/7000Gで同じ尺度を使うため、Raw Scoreが増える限りDisplay Scoreも下がらない。
現在は現行Universeの全targetGames中の最大Rawを100とする暫定Calibration。
基準変更時は `tools/recalibrate-difficulty-display.mjs` だけで全機種表示スコアを更新できる。
Analyzer自体を変更した場合だけRaw Score再計算が必要。
