# Batch010 3機種 UI・推測要素再点検（2026-10-11）

## 作業の位置づけ
ユーザー実機QA指摘による修正。既存の設定別公表値、featureId、Exact Constraint、母数の分離と因果依存は維持し、Researchを正本としてAPP_RUNTIME・Distributionへ再生成した。
対象: S_DANMACHI_GAIDEN_XR / S_MAHOIKU_NB / S_TOARU_RAILGUN_FB。
3機種のpackageRevision=2、配信版 8.5.2-batch-20261010-010。

## ダンまち外伝
- 「設定別の公開出現率で評価」は各カテゴリの意味を説明しないため、PROBABILITY_BACKEDの同文反復をCanonical UI生成時に削減。
- ミアハ・ヘファイストスなどの名称と記録回数はそのまま。設定確定・否定につながるカテゴリの意味だけ明示的に残す。
- 青／緑ログインプレゼントとAT差枚1000枚は出現母数・分布が異なるため計算と観測は統合しない。UIタブだけ共通見出し「エンブレム（獲得した場面別）」の下にまとめる。
- 7個の推測Featureと記録用Evidenceを全て保持。

## 魔法少女育成計画
- 公表上、設定6はボーナス合算1/252（設定1〜5は約1/183〜1/189）、押し順ベル1/8.8（設定1〜5は約1/4.1〜1/4.4）と傾向が異なる。通常の「高設定ほど当たりやすい」前提で一律除外してはならない。
- 一方、レア役単独確率の1〜5の差は小さく、無条件に主要入力とすべきでない。判別に回す要素は既存のSELECTION_SCORE / PER_ELIGIBLE_TRIAL_POWERと因果依存ゲートの選択に従う。
- Research finding全53件 ≠ 53件を同時に判別すること。現在のAPP_RUNTIMEの推測用featureは33件。ボーナス・初当たり・役重複・入賞ボーナスの同一因果経路はPREFERRED_WITH_FALLBACKで重複加点せず、未観測の場合に順序付き代替を使う。
- ボーナス中・ART中・CZ中は別母数。目押しの成功率に左右されるCZ終了画面の技術介入ランクは5条件を保持、ランク不明はそのままEvidence記録のみ。誤ったランクへ振り分けない。
- ボーナス終了は通常時／ART中、REGキャラは通常前半／ART前半／共通後半、スマTALKは3質問、CZ終了は技術介入ランク5段階＋不明、レア役重複・入賞種別は4種類ずつにまとめ、UIは計6タブグループ。
- 条件付き数値項目の試行回数と成功回数に同じ項目名が出ないよう、denominatorSemantics先頭で機会／成功を明記。
- 稀な抽選やレア役種別の出現件数が実戦で少ない場合、強い結論を出さない。公表率と観測機会が合致しなければ推測に足さない。

## とある科学の超電磁砲
- 当日消化G帯、同一ATのボーナス回数帯で出現率が変わる条件を一括集計しない。
- 白7ボイスは3帯、BATTLE終了は3帯、MISSION終了は2帯。ボーナス開始画面は5〜30回目の節目＋36回目以降の7区分。特定の設定示唆やExact Constraintを維持。
- 画面の反復表示を減らすため、ポイント・CZ演出・白7・BATTLE・MISSION・BONUS・AT終了の計7タブグループに再編。
- ポイント獲得時の初春と真剣抽選Tの入力母数名と成功名を分離し、同じ「回数」連打を防ぐ。
- 35回目の特定演出は設定6確定扱いに変更しない（既存Researchの説明を保持）。

## 共通QA・変更禁止事項
- 数値確率・カテゴリ結果の分布・featureId・evidenceId・Exact Constraint・ユーザー入力保存キーを改変しない。
- Research → Evaluation → Eligibility → Candidate Contract → Runtime Policy → Runtime Projection → APP_RUNTIME → Distribution の公式経路で再生成。
- 10機種一括実機QAのうち元々承認済みの他機種を変更しない。今回3機種は新revisionにつき再QAが必要。過去の承認記録は改竄しない。
- 新テスト production/test/batch010-three-machine-contextual-ui.test.ts でfeature件数・Evidence件数・タブと必須入力を検証。
- 公開確認資料: https://www.p-world.co.jp/machine/database/9707 、https://nana-press.com/kaiseki/machine/441/11856/ 、Researchのsources[]。
