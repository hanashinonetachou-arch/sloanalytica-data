# 公開データ監査

MachineDataまたは`catalog.json`を変更したら、Commit前に次を実行します。

```text
npm run audit
npm test
```

`npm run audit`は読み取り専用です。`catalog.json`を更新したり、MachineDataを書き換えたりしません。

- `OK`：エラーなし。警告は内容を確認してからCommitしてください。
- `FAILED`：エラーあり。表示された機種ID・ファイル・内容を直してから再実行してください。

主な検査対象は、catalogのJSON/必須項目/重複、ローカルMachineDataとのID・バージョン・SHA-256・サイズ一致、入力・Feature・Evidenceの参照整合、確率と設定ID、auto accumulator、アプリ能力宣言です。

監査でチェックサムまたはサイズ不一致が出たときは、MachineDataを意図して変更した後に`catalog.json`の`machineDataVersion`、`sha256`、`packageSizeBytes`を更新し、もう一度監査します。監査ツールは自動修正しません。
