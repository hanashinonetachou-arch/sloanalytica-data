# Source Update Watch v1

既存機種のResearchDataに登録された公開URLだけを定期確認し、前回取得時との差分がある出典だけを再調査候補にする。

## コマンド
`npm run sources:watch -- check`
`npm run sources:watch -- status`

## 保存
- `update-watch/state.json`: URL単位の前回スナップショット
- `update-watch/report.json`: 今回の差分結果

## 判定
- NEW: 初回取得
- UNCHANGED: 前回と一致
- CHANGED: ETag / Last-Modified / 本文SHA / HTTP status のいずれかが変化
- CHECK_FAILED: 取得不能

## usage節約方針
AIへ渡すのは `changed` と `failed` のみ。UNCHANGEDの機種は再調査しない。

## 注意
Webページでは広告・日時・動的HTMLだけでも本文SHAが変わる可能性がある。そのためCHANGEDは「解析値が変わった」という意味ではなく、「AI/人間が差分確認すべき候補」である。
