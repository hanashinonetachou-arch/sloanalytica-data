# 01 Lバキ 強くなりたくば喰らえ!!! — Chat Research終了記録

判定日: 2026-10-22 / Manifest v8.5
判定: **CHAT_RESEARCH_CLOSED**（公開情報調査・6領域自己監査・モデル設計の終了。正式GitHubステージCOMPLETEではない）

全候補と詳細設計は `01_L_BAKI.md` を参照。

## 標準調査ソース別結果
- なな徹: 設定値と示唆確認済
- DMMぱちタウン: 同定・機種照合、設定差追加値未確認
- ちょんぼりすた: 設定値・役分類と矛盾確認済
- 一撃: 機種概要確認済
- パチ7: 検索済み。設定別解析追加値は指定範囲で確認できず
- メーカー系3サイト: 本機メーカー対象外

## 6領域確認結果
- initial_hit: 確認済: CZ・AT・直撃、重複モデルに注意
- small_roles: 確認済: 公表小役は設定共通、高確移行は観測困難
- transitions: 確認済: メーターMAX CZ、内部昇格は記録のみ
- screens: 確認済: CZ/AT終了画面
- constraints: 確認済: 設定2+/3+/4+/5+/6の制約
- conditions: 確認済: 通常G、CZスルー、モード・リセット

## 情報不足・矛盾として閉じる事項
- 強喰の設定5出現率で1/6146.1と1/6046.1の不一致。尤度利用なし
- 確定強喰の昇格・成立役分類に表記差。直接観測性も不明のため尤度利用なし
- 弱チェリー高確移行の丸め差・状態観測困難。記録/後続判断
- ATとCZと直撃の独立積算禁止

## ソースURL
- https://nana-press.com/kaiseki/machine/461/12659/
- https://1geki.jp/slot/s_baki_tk/0/
- https://chonborista.com/slot/orinpia-slot/175097/
- https://p-town.dmm.com/machines/4242/shops?prefecture=37
- https://pachiseven.jp/columns/column_detail/22783

## 後続工程に渡す境界
- 自己監査のみ。独立外部監査は実施していない。
- 正式な評価、Eligibility、Candidate Contractの確定は未実施。
- RepoへのResearch COMPLETE状態遷移、batch/machine/work IDの照合は後続Workに依頼。
- この機種のChat調査は新しい具体的根拠・誤りが発見された場合以外再開しない。
- 欠落を推定で埋めず、記録・制約の候補を保持する。
