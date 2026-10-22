# Batch025 — Device feedback revision 2

APK: SloAnalytica-Batch025-vc2002942980.apk

- App: e161e1f352c4f2042550aee2bfdd04c7a1ed735e
- Distribution: de7fa72b2c184fdab14e1514971145743c36f5f8
- Successful workflow: 39759222247
- Version code: 2002942980 (greater than previous 2002942338)
- APK SHA256: b788ec88af44fa324e49d5db5993766290806258778805c2c719bd9a4e79175d
- Same signing certificate as previous QA APK: verified.
- Rendered UI/inference: 10 machines PASS; approved fleet: 250 PASS / 0 FAIL.
- Production: 110 authoritative stages verified; 78 unit tests PASS.

## Corrections

サンダーV: BIG前半の3連V狙いで、ベルBは下段ベル、ベルCは上段ベル、中段ベルはAであることを説明へ追記。通常時のベルBとは別分類。JAC・BT中を含めない。

クレアBT・マジハロBT: 公開ボーナス確率は有効。ベル1候補の固定採用では、ベル未観測時にもボーナスを利用できなかった。既存の優先順位付きフォールバックを使い、観測済み候補のうち正式スコアを基準とする最上位の1候補を使用する。BIG/REGのみの入力でも推測でき、同じ当選経路の二重評価は行わない。公開確率・設定集合・採用閾値は変更していない。厳密なjointモデルを新設したものではない。

## Recheck on device

- サンダーVのBIG前半の説明に、ベルB/Cの停止位置と対象区間が表示される。
- クレアBT・マジハロBTでベルを未入力にし、BIGまたはREGを入力すると推測に反映される。
- ベルも記録すると同じ依存グループのボーナスを重複加算しない。
- 0回と未入力を区別する。

実機QAは再確認待ち。今回のフィードバックを全10機種の合格承認とは扱わない。旧QA依頼は新版へ差し替え、旧成果物・依頼・履歴を保持する。
