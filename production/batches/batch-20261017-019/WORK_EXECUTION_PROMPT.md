# Batch019 — 配信完了・実機QA待ち

正本はhanashinonetachou-arch/sloanalytica-dataのproduction/v85-batch-019-contract-20261017、PR #471。最新HEADを再取得して正式stageとFINAL_DELIVERY_REPORT.md、device-qa/handoff.json、validationを読む。二重生成・二重配信・Integration再起動をしない。

10件はDistributionまで正式COMPLETE。配信SHA=2432039c4d206abedaec462e7a0e797899c76604、カバネリ8.5.2-batch-20261017-019、他9件8.5.1-batch-20261017-019。今回10件の実アプリ検証、V8.5全190件の互換性、対象外263件の不変、公開raw/Pages各10件のサイズ・SHA検証はPASS。App本体は7756b939のまま、前回固定署名APKを再利用。

ユーザーの「他はOKです」に基づき他9件は正式DEVICE_QA COMPLETE。カバネリだけキャラ紹介の同名カウントを「男性・女性の合計回数」「男性キャラ出現回数」に修正し、HUMAN_REQUIREDで再確認待ち。ユーザーが結果を示したら実際の対象・APKを照合して既存record-device-qa-acceptance.tsの手順で受理。不具合報告なら該当範囲を修正し、既存確認済みの範囲を独断で取り消さない。前BatchのQAは変更しない。

元90候補＋内訳・制約9件を保持。LIMITED_CLOSEOUT、内部状態の観測不能候補や公開資料競合の候補別クローズ、未知率の記録専用説明、確定・否定の反映、出典名の画面非表示、共通ゲーム数と連チャン除外、同一観測機会のタブ統合を維持。科学モデル・閾値・完了条件を独断で変更しない。

ActionsはIntegration Boundary中心、通常コミットは[skip ci]。今回の実機QA承認なしに次の機種選定や全完了扱いへ進めない。ただしユーザーから出先QA不可等の次工程指示があれば、その指示に従う。
