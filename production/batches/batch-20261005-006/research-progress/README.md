# Batch #006 — Research / App Runtime checkpoint

Manifest 8.5 / 2026-10-05 / status: IN_PROGRESS

## Repository正本と選定

- Production復旧アンカー: `30598f4564f912a2aa86e0a6805d77873a36bd5d`
- 再開ブランチ: `production/v85-batch-006-foundation-20261005`
- Batch初期化commit: `992d41432d9b5883a6388cdb2acebb600aa8f4b4`
- Distribution照合HEAD: `84780f55d33a8f901faa7706ed9344e0ab11f851`
- 選定ソース: Distributionの `machine-identity-metadata.json` / blob `1d520303506b2738f0e8f92ee5f25e066647c8e4`
- 保存済み配列順を保持。Batch #005の全10機種DISTRIBUTION COMPLETEとユーザー実機QA了承を確認し、完了カーソルを `L_NEO_PLANET_SLED` へ整合。
- 選定済みをResearch完了とは扱わない。完了カーソルはBatch #006の末尾まで進めない。

|順|機種ID|機種|
|---|---|---|
|1|L_IZA_BANCHO_SB8|いざ！番長|
|2|L_ZETTAI_SHOGEKI_PLATONIC_HEART_TK|L 絶対衝激～PLATONIC HEART～|
|3|L_WATASHI_NO_SHIAWASE_NA_KEKKON_PN|わたしの幸せな結婚|
|4|LB_TRIPLE_CROWN_SF4|LBトリプルクラウン|
|5|LB_MATADOR_3_TT|マタドールⅢ|
|6|L_TENSEI_SHITARA_KEN_DESHITA_GT|パチスロ 転生したら剣でした|
|7|L_DARLING_IN_THE_FRANXX_SA|L ダーリン・イン・ザ・フランキス|
|8|L_SAKI_CHOJO_KESSEN_YR|L咲-Saki- 頂上決戦|
|9|S_KONOSUBA_ZR|パチスロこの素晴らしい世界に祝福を！|
|10|S_RAKUEN_TSUHO_FS|パチスロ楽園追放|

## 調査途中データの意味

各機種JSONは現在の公開解析を再読して保存した発見候補である。旧DistributionのResearchは出典位置を探すためだけに参照し、旧採用判定や旧Runtimeを正解として流用していない。

数値候補60件の設定別原分布、出典URL、観測条件に関する留保、当選経路重複の暫定分類を保存した。20領域の確認・候補台帳・完全な設定示唆カテゴリ・型式照合・観測範囲の最終確定は未完了。`researchCompleteness`を完成したように記載していない。

`audit.json`は継承したEvaluation / dependency gateに対する発見候補の検査結果で、ProductionのEVALUATION成果物ではない。暫定スコアは観測範囲確定前の計算値であり採用を意味しない。全候補は `NOT_AUTHORIZED_SCOPE_AND_COMPLETENESS_PENDING`。

咲の和ランプは弱・強レア役を分けた全5色の公開分布、このすばのAT終了PUSHボイスは全9カテゴリの公開分布を保存済み。確定条件と数値出現率を後工程で同じ観測へbindingし、入力を二重化しない。楽園追放の終了画面はゲーム数帯・復活有無による分布があるため、条件を省略して合算しない。

絶対衝激の必殺技はボーナス当選の有無で意味が変わる。わた婚はコナミコマンド入力後の終了画面が対象。一部のトロフィーの説明は「他機種を参考」とされているため留保を保存し、本機で検証済みの確定条件と混同しない。

公式の遊技履歴連動対応を再確認した機種は、わた婚・転剣（コナミ対応一覧）、このすば2022年・楽園追放（マイスロ公式お知らせ）。対応の確認と、個別回数・母数の取得確認は別であり、取得可能と推測していない。

## 検証と責任工程

- 継承したProduction全体のテスト189件PASS。
- dependency / 東京リベンジャーズ関連8件を再実行しPASS。
- source blob・配列順・10機種・60候補の検査PASS。
- 同じ母数だけで共通ベルAと弱チェリーをdependency groupへ入れないことを検査。
- 明示した直撃合算とAT初当りの経路重複は保持。
- Production stageのRESEARCH COMPLETEは0件。leaseやvalidatorを迂回していない。
- GitHub Actionsは起動していない。App / Distribution / APKを今回の発見候補で更新していない。

発見候補検査の再現:

```bash
cd production
node --experimental-strip-types src/batch006-research-discovery-audit.ts --identity-source=/path/to/canonical-distribution/machine-identity-metadata.json
```

## 次の責任工程

1. 各JSONのpendingWorkを消化し、機種別20領域・候補台帳・示唆カテゴリを完成。
2. wave-1の `research-drafts/wave-1/<machineId>.json` をresearch-v1として作成。未公開値は補完しない。
3. `materialize-research-drafts.ts` の正規orchestrator / validatorを通してResearchを確定。
4. 継承したgeneratorでEvaluation以降を生成し、semantic auditを実行。途中成果物を直接修正しない。
5. wave gateを守り、Integration BoundaryでまとめてDistribution・App QA・固定署名APKへ進む。

Batch初期化を重複実行しない。再開時はこのブランチの最新HEAD、stage状態、この調査途中データを読み、既存候補を上書きで失わずに調査を続ける。

## 2026-10-05 現在地点（上記は発見時点の履歴）

Researchは10機種すべて正規validatorでCOMPLETE。EvaluationからAPP_RUNTIMEまで上流から再生成済み。Distributionはwave-1が全10機種の統合を待つWAIT_EXTERNAL、wave-2がREADY。DEVICE_QAは未実施。完了カーソルは進めていない。

Research正本はresearch-draftsとRESEARCH authoritativeOutputRef。research-progress各JSONとaudit.jsonは初期発見の履歴であり、現在の採用結果ではない。楽園追放の終了画面構図・累積G条件・400枚エピソード名の資料矛盾は保留理由と再評価条件を保存。未確認の画像名を生成していない。

追加修正：Evidenceの構図名とmeaningを分離して確定条件を判定。categoricalのSOURCE_EXHAUSTIVEを既存categoryModel.residualPolicyへ正しくbinding。長い分母説明を入力名へ出さず、説明に残す。元の全設定値は保存。

次は10機種のパッケージ／catalog統合、App rendered UI QA、60機種whiteout互換性、固定署名APKのIntegration Boundary。Actions未実行。
