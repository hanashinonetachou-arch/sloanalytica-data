# Batch Selection Pipeline v1

Batch Research Pipeline と Batch Machine Pipeline の間をつなぐ Selection オーケストレーター。

- 最大10機種
- ResearchData は必須。存在しない機種を推測して作らない
- 客観統計評価は自動生成するが、Feature採否・weight・入力mapping・difficultyExposureは自動決定しない
- 既存 SelectionData は validate-selection-data.mjs で検証して READY_FOR_MACHINE / REVIEW / BLOCKED に分類
- SelectionData がない機種は SELECTION_REQUIRED とし、selection-brief.json と statistical-report.json を作る
- --ingest では workspace 内の selection-data.json を ResearchData と突合し、BLOCKED でないものだけ research/<MACHINE_ID>/selection-data.json へ取り込む
- Research conflict または Selection warning は REVIEW
- invalid ResearchData / invalid SelectionData / identity mismatch は BLOCKED
