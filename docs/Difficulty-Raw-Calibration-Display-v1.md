# Difficulty Raw / Calibration / Display v1

1. Raw Score: Analyzer output。Calibration変更では再計算しない。
2. Calibration: Difficulty Catalogで一括管理。1500/3000/7000GごとにreferenceRawを持つ。
3. Display Score: `round(rawScore / referenceRaw * 100)`。App表示用。

現在は各時間軸の現行Universe最大Rawを100とする暫定Calibration。
基準変更時は `tools/recalibrate-difficulty-display.mjs` だけで全機種表示スコアを更新できる。
Analyzer自体を変更した場合だけRaw Score再計算が必要。
