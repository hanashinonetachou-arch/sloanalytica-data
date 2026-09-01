# Batch 20260901 Selection Decision Sheet

## L_MAGIA_RECORD_RN — スマスロ マギアレコード 魔法少女まどか☆マギカ外伝
Features 12 / Evidence 13 / Conflicts 0
### Features
- RF_BONUS_FIRST_HIT | verified | binomial | ボーナス初当り | trial=有効通常ゲーム | den=ボーナス初当りを観測可能な有効通常ゲーム数 | ratio=1.305
- RF_AT_FIRST_HIT | verified | binomial | マギアラッシュ初当り | trial=有効通常ゲーム | den=AT初当りを観測可能な有効通常ゲーム数 | ratio=1.571
- RF_WEAK_CHERRY | verified | binomial | 弱チェリー | trial=ゲーム | den=弱チェリーを同条件で観測可能なゲーム数 | ratio=1.200 | note=機種別解析はユニメモでの正確なカウントを推奨。公式ユニメモ対応機種一覧でも対象機種を確認。
- RF_MODE_AT_END | verified | multinomial | 有利区間移行・AT終了時 魔法少女モード振り分け | trial=有利区間移行またはAT終了1回 | den=有利区間移行またはAT終了後にモード選択が行われた回数 | ratio=- | note=公開値は丸めを含む。Research原値を保持し、採用時のみ正規化可否を判断する。
- RF_OTHER_CONDITIONAL_LOTTERIES | pending | unknown | ボーナス終了時モード・高確移行・スイカCZ・エピソード/みたま条件付き抽選 | trial=各公開条件を満たす契機1回 | den=各抽選の対象状態・対象契機成立回数 | ratio=- | note=Discovery候補をResearchへ移送済み。各表を状態/契機別に分解するまで通常G率へ平坦化しない。
- RF_MODE_BONUS_END | verified | multinomial | ボーナス終了時 魔法少女モード振り分け | trial=ボーナス終了時いろはモード1回 | den=ボーナス終了時にいろはモードから昇格抽選が行われた回数 | ratio=- | note=ボーナス終了時かついろはモードの条件付き分布。AT終了/有利区間移行時のRF_MODE_AT_ENDとは別試行。公開丸め値を保持。
- RF_EPISODE_BONUS_TYPE | verified | multinomial | エピソードボーナス選択率 | trial=通常条件のエピソードボーナス当選1回 | den=黒江チャレンジ経由を除く通常条件のエピソードボーナス当選回数 | ratio=- | note=黒江チャレンジ経由は必ず黒江のため除外。公開丸め値をResearch原値として保持。
- RF_HIGH_TRANSITION_ADV_AT_END | verified | multinomial | 有利区間移行・AT終了時 高確G数振り分け | trial=有利区間移行またはAT終了1回 | den=有利区間移行またはAT終了後に高確移行抽選を受けた回数 | ratio=- | note=公開トータル25.0～33.7%と整合。
- RF_HIGH_TRANSITION_BIG_END | verified | multinomial | BIG終了時 高確G数振り分け | trial=AT非当選BIG終了1回 | den=AT非当選BIG終了後に高確移行抽選を受けた回数 | ratio=- | note=AT非当選BIG終了という条件を維持。公開トータル33.7～50.0%と整合。
- RF_WATERMELON_CZ | verified | multinomial | さなモード以外 スイカ成立時CZ当選種別 | trial=さなモード以外でスイカ成立1回 | den=さなモード以外でスイカが成立した回数 | ratio=- | note=さなモードは抽選契約が異なるため除外。
- RF_MITAMA_LEVEL2_AT | verified | binomial | みたま報酬Lv2 ウワサ発展後AT当選 | trial=報酬レベル2でウワサ発展1回 | den=みたまボーナス報酬レベル2でウワサ発展した回数 | ratio=9.750
- RF_MITAMA_LEVEL3_AT | verified | binomial | みたま報酬Lv3 ウワサ発展後AT当選 | trial=報酬レベル3でウワサ発展1回 | den=みたまボーナス報酬レベル3でウワサ発展した回数 | ratio=2.451
### Evidence
- RE_CUE_FAMILY | pending | semantic=- | BIG/AT終了画面・ストーリー・キャラ紹介・エンディングカード設定示唆群 | allowed=[] | excluded=null | lower=- | upper=- | note=奇偶/高設定示唆と下限・否定Evidenceを混在させず、Selection前に個別条件へ分解する。
- RE_BIG_END_2PLUS | verified | semantic=- | BIG終了 水着みかづき荘 | allowed=["SET_2","SET_3","SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_BIG_END_4PLUS | verified | semantic=- | BIG終了 2nd Seasonキービジュアル | allowed=["SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_BIG_END_5PLUS | verified | semantic=- | BIG終了 1st Seasonキービジュアル | allowed=["SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_BIG_END_6 | verified | semantic=- | BIG終了 小さいキュゥべえ | allowed=["SET_6"] | excluded=null | lower=- | upper=-
- RE_AT_END_6 | verified | semantic=- | AT終了 まどか＆いろは | allowed=["SET_6"] | excluded=null | lower=- | upper=-
- RE_STORY_5PLUS | verified | semantic=- | ストーリーキャラ紹介 シナリオ⑨（小さいキュゥべえ） | allowed=["SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_END_CARD_4PLUS | verified | semantic=- | エンディングカード 舞台装置の魔女 | allowed=["SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_END_CARD_DENY1 | verified | semantic=- | エンディングカード 委員長の魔女 | allowed=["SET_2","SET_3","SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=- | note=否定Evidenceに高設定示唆も併記されるがHard部分は設定否定のみ。
- RE_END_CARD_DENY2 | verified | semantic=- | エンディングカード 石中魚の魔女 | allowed=["SET_1","SET_3","SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_END_CARD_DENY3 | verified | semantic=- | エンディングカード 立ち耳の魔女 | allowed=["SET_1","SET_2","SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_END_CARD_DENY4_PENDULUM | verified | semantic=- | エンディングカード 振子の魔女 | allowed=["SET_1","SET_2","SET_3","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_END_CARD_DENY4_NIGHTJAR | verified | semantic=- | エンディングカード ヨダカの魔女 | allowed=["SET_1","SET_2","SET_3","SET_5","SET_6"] | excluded=null | lower=- | upper=- | note=否定Evidenceに高設定示唆も併記されるがHard部分は設定否定のみ。

## L_GODZILLA_NS — Lゴジラ
Features 5 / Evidence 18 / Conflicts 0
### Features
- RF_CZ_FIRST_HIT | verified | binomial | CZ初当り | trial=有効通常ゲーム | den=CZ初当りを観測可能な有効通常ゲーム数 | ratio=1.039
- RF_AT_FIRST_HIT | verified | binomial | G-RUSH DESTRUCTION初当り | trial=有効通常ゲーム | den=AT初当りを観測可能な有効通常ゲーム数 | ratio=1.620
- RF_SHURAI_OPPONENT | verified | multinomial | 襲来ZONE対戦怪獣振り分け | trial=襲来ZONE突入1回 | den=襲来ZONE突入回数 | ratio=- | note=公開丸め値をResearch原値として保持。
- RF_EXPLORATION_ZONE | pending | binomial | 探索ZONE突入率 | trial=有効通常ゲーム | den=探索ZONE抽選の有効通常ゲーム数 | ratio=1.259 | note=SET2-5は公開確認範囲で未解決。補間しない。
- RF_REPLAY_POINT_CZ | pending | unknown | リプレイポイント契機CZ抽選 | trial=対象ポイント抽選機会1回 | den=公開条件を満たすリプレイポイント抽選機会数 | ratio=- | note=設定差報告あり。完全表未解決。
### Evidence
- RE_SETTING_CUES | pending | semantic=- | メニュー・オペレーター・Bonus/EX Bonus終了・ムービー・ギンちゃんトロフィー設定示唆群 | allowed=[] | excluded=null | lower=- | upper=- | note=モード/Gポイント等の非設定情報と設定Evidenceを分離して個別化する。
- RE_MENU_2PLUS | verified | semantic=- | メニュー 轟天号 | allowed=["SET_2","SET_3","SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_MENU_4PLUS | verified | semantic=- | メニュー スーパーXⅢ | allowed=["SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_MENU_6 | verified | semantic=- | メニュー 3式機龍 | allowed=["SET_6"] | excluded=null | lower=- | upper=-
- RE_OPERATOR_2PLUS | verified | semantic=- | オペレーター 設定2以上セリフ群 | allowed=["SET_2","SET_3","SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_OPERATOR_3PLUS | verified | semantic=- | オペレーター 設定3以上セリフ群 | allowed=["SET_3","SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_OPERATOR_4PLUS | verified | semantic=- | オペレーター 設定4以上セリフ群 | allowed=["SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_OPERATOR_5PLUS | verified | semantic=- | オペレーター 設定5以上セリフ群 | allowed=["SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_OPERATOR_6 | verified | semantic=- | オペレーター 設定6セリフ群 | allowed=["SET_6"] | excluded=null | lower=- | upper=-
- RE_BONUS_END_4PLUS | verified | semantic=- | ボーナス終了 キングギドラ | allowed=["SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_BONUS_END_5PLUS | verified | semantic=- | ボーナス終了 ゴジラ（赤） | allowed=["SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_BONUS_END_6 | verified | semantic=- | ボーナス終了 ゴジラ（白黒） | allowed=["SET_6"] | excluded=null | lower=- | upper=-
- RE_EX_MOVIE_5PLUS | verified | semantic=- | EXボーナス ムービー5 | allowed=["SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_TROPHY_2PLUS | verified | semantic=- | ギンちゃんトロフィー 銅 | allowed=["SET_2","SET_3","SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_TROPHY_3PLUS | verified | semantic=- | ギンちゃんトロフィー 銀 | allowed=["SET_3","SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_TROPHY_4PLUS | verified | semantic=- | ギンちゃんトロフィー 金 | allowed=["SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_TROPHY_5PLUS | verified | semantic=- | ギンちゃんトロフィー トラ柄 | allowed=["SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_TROPHY_6 | verified | semantic=- | ギンちゃんトロフィー 虹 | allowed=["SET_6"] | excluded=null | lower=- | upper=-

## L_USHIO_TORA_HAKUMEN_VH — Lうしおととら 白面決戦
Features 5 / Evidence 12 / Conflicts 0
### Features
- RF_CZ_FIRST_HIT | verified | binomial | CZ初当り | trial=有効通常ゲーム | den=CZ初当りを観測可能な有効通常ゲーム数 | ratio=1.119
- RF_AT_FIRST_HIT | verified | binomial | AT初当り | trial=有効通常ゲーム | den=AT初当りを観測可能な有効通常ゲーム数 | ratio=1.116
- RF_RESET_CEILING | pending | multinomial | 設定変更時 AT間天井振り分け | trial=設定変更確認1回 | den=設定変更が確定している試行回数 | ratio=- | note=完全公開表の構造化待ち。通常セッションと混合禁止。
- RF_RESET_USHITORA_MODE | pending | multinomial | 設定変更時 うしとらモード規定CZ失敗回数 | trial=設定変更確認1回 | den=設定変更が確定している試行回数 | ratio=- | note=完全公開表の構造化待ち。
- RF_STATE_ROLE_CZ | pending | unknown | 内部状態・成立役別CZ当選 | trial=対象状態で対象役成立1回 | den=状態別・成立役別の抽選機会数 | ratio=- | note=設定1詳細のみ確認済み。他設定を推定しない。
### Evidence
- RE_PAYOUT_2PLUS | verified | semantic=- | 222枚突破 | allowed=["SET_2","SET_3","SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_PAYOUT_EVEN | verified | semantic=- | 246枚突破 | allowed=["SET_2","SET_4","SET_6"] | excluded=null | lower=- | upper=- | note=偶数設定濃厚の設定集合Evidence。下限Evidenceではない。
- RE_PAYOUT_3PLUS | verified | semantic=- | 333枚突破 | allowed=["SET_3","SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_PAYOUT_4PLUS | verified | semantic=- | 456枚突破 | allowed=["SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_PAYOUT_5PLUS | verified | semantic=- | 555枚突破 | allowed=["SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_PAYOUT_6 | verified | semantic=- | 666枚突破 | allowed=["SET_6"] | excluded=null | lower=- | upper=-
- RE_DYNAMITE_TROPHY | pending | semantic=- | ダイナマイトトロフィー下限示唆群 | allowed=[] | excluded=null | lower=- | upper=- | note=銅2+/銀3+/金4+/てんとう虫5+/虹6を個別Evidenceへ分解予定。
- RE_TROPHY_2PLUS | verified | semantic=- | ダイナマイトトロフィー 銅 | allowed=["SET_2","SET_3","SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_TROPHY_3PLUS | verified | semantic=- | ダイナマイトトロフィー 銀 | allowed=["SET_3","SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_TROPHY_4PLUS | verified | semantic=- | ダイナマイトトロフィー 金 | allowed=["SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_TROPHY_5PLUS | verified | semantic=- | ダイナマイトトロフィー てんとう虫 | allowed=["SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_TROPHY_6 | verified | semantic=- | ダイナマイトトロフィー 虹 | allowed=["SET_6"] | excluded=null | lower=- | upper=-

## L_AMAZING_LIVE_PD — スマート沖スロ アメイジングライブ
Features 5 / Evidence 1 / Conflicts 0
### Features
- RF_BONUS_FIRST_HIT | verified | binomial | ボーナス初当り | trial=初当り抽選対象ゲーム | den=ボーナス初当り抽選の対象となるゲーム数 | ratio=1.443 | note=SET_Lは通常推測仮説外。初当りの正確な連チャン境界はObservationで確定が必要。
- RF_BIG_APPEARANCE | verified | binomial | BIG出現率 | trial=ゲーム | den=公開BIG出現率と同じ集計範囲のゲーム数 | ratio=1.389
- RF_REG_APPEARANCE | verified | binomial | REG出現率 | trial=ゲーム | den=公開REG出現率と同じ集計範囲のゲーム数 | ratio=1.434
- RF_BIG_REG_AGGREGATE | verified | binomial | BIG+REG出現率合算 | trial=ゲーム | den=公開BIG+REG合算出現率と同じ集計範囲のゲーム数 | ratio=1.405 | note=BIG/REG個別および初当りと情報重複。Researchでは保持しSelectionで依存解決する。
- RF_SMALL_ROLES | pending | unknown | 設定差小役候補 | trial=ゲーム | den=同条件ゲーム数 | ratio=- | note=確認範囲では設定差表未公開。値を作らない。
### Evidence
- RE_SET_L_PANEL | verified | semantic=- | 設定L 下パネル常時点滅 | allowed=["SET_L"] | excluded=null | lower=- | upper=- | note=運用上のSET_L識別。通常posterior設定候補には含めない。

## L_YOSHIMUNE_SC2 — 吉宗
Features 3 / Evidence 6 / Conflicts 0
### Features
- RF_BONUS_FIRST_HIT | verified | binomial | BIG/REG初当り | trial=有効通常ゲーム | den=初当りを観測可能な有効通常ゲーム数 | ratio=1.296
- RF_COMMON_TAWARA | verified | binomial | 共通俵 | trial=ゲーム | den=共通俵を同条件で観測可能なゲーム数 | ratio=1.800
- RF_PRACTICAL_MODE_ZONE | pending | unknown | モード移行・ゾーン実戦候補 | trial=各実戦集計条件の試行1回 | den=公開実戦データと同一条件の試行数 | ratio=- | note=実戦値をメーカー公式確率へ昇格させない。
### Evidence
- RE_HANAFUDA_2PLUS | verified | semantic=- | ボーナス終了花札 銅枠 | allowed=["SET_2","SET_3","SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_HANAFUDA_3PLUS | verified | semantic=- | ボーナス終了花札 銀枠 | allowed=["SET_3","SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_HANAFUDA_4PLUS | verified | semantic=- | ボーナス終了花札 金枠 | allowed=["SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_HANAFUDA_5PLUS | verified | semantic=- | ボーナス終了花札 紫枠 | allowed=["SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_HANAFUDA_6 | verified | semantic=- | ボーナス終了花札 虹枠 | allowed=["SET_6"] | excluded=null | lower=- | upper=-
- RE_VOICE_FAMILY | pending | semantic=- | ボーナス終了ボイス設定示唆群 | allowed=[] | excluded=null | lower=- | upper=- | note=モード示唆のみのボイスと設定示唆を分離してから個別化する。

## L_MAHJONG_MONOGATARI_S2 — L麻雀物語
Features 7 / Evidence 11 / Conflicts 0
### Features
- RF_BONUS_FIRST_HIT | verified | binomial | 通常時ボーナス初当り | trial=有効通常ゲーム | den=通常時ボーナス初当りを観測可能な有効通常ゲーム数 | ratio=1.040
- RF_AT_FIRST_HIT | verified | binomial | AT初当りトータル | trial=有効通常ゲーム | den=AT初当りを観測可能な有効通常ゲーム数 | ratio=1.158
- RF_BONUS_OR_AT_FIRST_HIT | verified | binomial | 通常時ボーナスorAT初当り合算 | trial=有効通常ゲーム | den=両初当りを同一条件で観測可能な有効通常ゲーム数 | ratio=1.094 | note=BONUS/AT個別Featureを内包。Selectionで同時採用禁止候補。
- RF_DIRECT_AT | verified | binomial | AT直撃（前兆昇格除外） | trial=公開直撃抽選対象ゲーム | den=公開直撃率と同じ抽選対象ゲーム数 | ratio=3.269
- RF_DIRECT_AT_PRACTICAL | verified | binomial | AT直撃 実戦集計（前兆昇格込み） | trial=実戦集計通常ゲーム | den=公開実戦集計と同一条件の通常ゲーム数 | ratio=2.143 | note=解析上の直撃値とは定義が異なる実戦値。Selectionで同一Feature扱いしない。
- RF_KOTEI_APPEARANCE | verified | binomial | 煌帝出現率 | trial=公開集計対象ゲーム | den=公開出現率と同一条件の対象ゲーム数 | ratio=1.192
- RF_OTHER_PARTIAL | pending | unknown | 煌帝バトル・CZ撃破閾値・Mashirock等 | trial=各公開条件の試行1回 | den=各公開条件と一致する試行数 | ratio=- | note=設定差報告ありだが完全表未解決。
### Evidence
- RE_STAMP_4PLUS | verified | semantic=- | 終了画面 良スタンプ | allowed=["SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_STAMP_5PLUS | verified | semantic=- | 終了画面 優スタンプ | allowed=["SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_STAMP_6 | verified | semantic=- | 終了画面 極スタンプ | allowed=["SET_6"] | excluded=null | lower=- | upper=-
- RE_SPECIAL_FAMILY | pending | semantic=- | AT+66G・666枚・ハルルナPUSH・隠しナギ等特殊示唆群 | allowed=[] | excluded=null | lower=- | upper=- | note=公開文言を個別再確認してHard Evidenceへ分解する。
- RE_STAMP_2PLUS | verified | semantic=- | 終了画面 可スタンプ | allowed=["SET_2","SET_3","SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_ADD_44_4PLUS | verified | semantic=- | AT上乗せ +44G | allowed=["SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_ADD_55_5PLUS | verified | semantic=- | AT上乗せ +55G | allowed=["SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_ADD_66_6 | verified | semantic=- | AT上乗せ +66G | allowed=["SET_6"] | excluded=null | lower=- | upper=-
- RE_HARURUNA_PUSH_4PLUS | verified | semantic=- | Last Judge ハルルナPUSH | allowed=["SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_HIDDEN_NAGI_GOLD_6 | verified | semantic=- | 隠しナギ 金 | allowed=["SET_6"] | excluded=null | lower=- | upper=-
- RE_PAYOUT_REFERENCE_UNRESOLVED | pending | semantic=- | 222/333/444/555/666枚突破 | allowed=[] | excluded=null | lower=- | upper=- | note=なな徹は従来機種参考・!?として掲載。別ソースの濃厚表記と強度が一致しないためHard Evidence化せずConflict/追加確認対象。

## L_IDOLMASTER_MILLION_LIVE_HC — スマスロ アイドルマスター ミリオンライブ！ ネクストプロローグ
Features 3 / Evidence 8 / Conflicts 0
### Features
- RF_CZ_FIRST_HIT | verified | binomial | CZ合算 | trial=有効通常ゲーム | den=CZ初当りを観測可能な有効通常ゲーム数 | ratio=1.398
- RF_BONUS_FIRST_HIT | verified | binomial | ボーナス初当り | trial=有効通常ゲーム | den=ボーナス初当りを観測可能な有効通常ゲーム数 | ratio=1.434
- RF_HIGH_HEAVEN_300 | pending | unknown | 直高確移行・天国選択・300Gボーナス当選候補 | trial=各公開条件の機会1回 | den=各公開条件に合致する機会数 | ratio=- | note=設定差あり報告をResearchへ移送。完全設定表未解決。
### Evidence
- RE_BONUS_END_FAMILY | pending | semantic=- | ボーナス終了画面 設定示唆群 | allowed=[] | excluded=null | lower=- | upper=- | note=奇偶傾向と2+/3+/4+/5+/6のHard Evidenceを個別化する。
- RE_KEROT_TROPHY | pending | semantic=- | ケロットトロフィー下限示唆群 | allowed=[] | excluded=null | lower=- | upper=- | note=完全な色→下限契約を個別Evidenceへ正規化する。
- RE_BONUS_END_RED_2PLUS | verified | semantic=- | ボーナス終了 赤枠 | allowed=["SET_2","SET_3","SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_BONUS_END_PURPLE_2PLUS | verified | semantic=- | ボーナス終了 紫枠 | allowed=["SET_2","SET_3","SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=- | note=高設定示唆も併記されるがHard部分は設定2以上。
- RE_BONUS_END_SILVER_3PLUS | verified | semantic=- | ボーナス終了 銀枠 | allowed=["SET_3","SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_BONUS_END_GOLD4_4PLUS | verified | semantic=- | ボーナス終了 金枠（指が4） | allowed=["SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_BONUS_END_GOLD5_5PLUS | verified | semantic=- | ボーナス終了 金枠（ケーキ5） | allowed=["SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_BONUS_END_RAINBOW_6 | verified | semantic=- | ボーナス終了 虹枠 | allowed=["SET_6"] | excluded=null | lower=- | upper=-

## L_YOUJITSU_DE — スマスロ ようこそ実力至上主義の教室へ
Features 7 / Evidence 14 / Conflicts 0
### Features
- RF_CZ_FIRST_HIT | verified | binomial | CZ出現率 | trial=有効通常ゲーム | den=CZ初当りを観測可能な有効通常ゲーム数 | ratio=1.287
- RF_AT_FIRST_HIT | verified | binomial | よう実チャンスAT初当り | trial=有効通常ゲーム | den=AT初当りを観測可能な有効通常ゲーム数 | ratio=1.356
- RF_DAXEL_FLASH | verified | binomial | CZ成功時ダクセルフラッシュ | trial=CZ成功1回 | den=CZ成功回数 | ratio=5.000 | note=総CZ回数ではなく成功CZ回数が分母。
- RF_NORMAL_CYCLE_CZ_TYPE | verified | multinomial | 通常周期CZ種別振り分け | trial=通常周期でCZ当選1回 | den=レア役昇格を除く通常周期CZ当選回数 | ratio=-
- RF_RED_BUTTON | verified | binomial | 連続演出成功時赤ボタン | trial=対象連続演出成功1回 | den=対象連続演出成功回数 | ratio=1.900
- RF_MODE3_ROLE_CZ | pending | unknown | モード3成立役別CZ抽選 | trial=モード3で対象役成立1回 | den=モード3で対象役が成立した回数 | ratio=- | note=内部モード判別と成立役別分母を保持。完全表未解決。
- RF_BONUS_END_SCREEN | verified | multinomial | よう実BONUS終了画面振り分け | trial=よう実BONUS終了1回 | den=よう実BONUS終了画面を確認した回数 | ratio=- | note=櫛田は高設定示唆。公開全設定分布をnumeric Researchとして保持。
### Evidence
- RE_SETTING_CUES | pending | semantic=- | ボーナスキャラ紹介/終了画面・AT終了画面・獲得枚数・エンディングボイス設定示唆群 | allowed=[] | excluded=null | lower=- | upper=- | note=傾向示唆とHard Evidenceを個別化する。
- RE_PAYOUT_EVEN | verified | semantic=- | 246枚OVER | allowed=["SET_2","SET_4","SET_6"] | excluded=null | lower=- | upper=-
- RE_PAYOUT_4PLUS | verified | semantic=- | 456枚OVER | allowed=["SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_PAYOUT_6 | verified | semantic=- | 666枚OVER | allowed=["SET_6"] | excluded=null | lower=- | upper=-
- RE_AT_END_2PLUS | verified | semantic=- | AT終了 堀北鈴音（特殊） | allowed=["SET_2","SET_3","SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_AT_END_4PLUS | verified | semantic=- | AT終了 坂柳有栖（特殊） | allowed=["SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_AT_END_5PLUS | verified | semantic=- | AT終了 龍園翔（特殊） | allowed=["SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_AT_END_6 | verified | semantic=- | AT終了 龍園翔VS綾小路清隆 | allowed=["SET_6"] | excluded=null | lower=- | upper=-
- RE_INTRO_DENY1 | verified | semantic=- | キャラ紹介 綾小路→堀北鈴音 | allowed=["SET_2","SET_3","SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_INTRO_DENY2 | verified | semantic=- | キャラ紹介 綾小路→櫛田桔梗 | allowed=["SET_1","SET_3","SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_INTRO_DENY3 | verified | semantic=- | キャラ紹介 綾小路→佐倉愛里 | allowed=["SET_1","SET_2","SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_INTRO_DENY4 | verified | semantic=- | キャラ紹介 綾小路→軽井沢恵 | allowed=["SET_1","SET_2","SET_3","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_INTRO_4PLUS | verified | semantic=- | キャラ紹介 堀北鈴音→堀北学 | allowed=["SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_INTRO_6 | verified | semantic=- | キャラ紹介 綾小路→龍園翔 | allowed=["SET_6"] | excluded=null | lower=- | upper=-

## L_MIDORIDON_VIVA_REVIVAL_FY — スマスロ 緑ドン VIVA!情熱南米編 REVIVAL
Features 13 / Evidence 12 / Conflicts 0
### Features
- RF_AT_FIRST_HIT | verified | binomial | アマゾンゲーム初当り | trial=有効通常ゲーム | den=AT初当りを観測可能な有効通常ゲーム数 | ratio=1.400
- RF_WEAK_CHERRY | verified | binomial | 弱チェリー | trial=ゲーム | den=同条件で観測可能なゲーム数 | ratio=1.088
- RF_WEAK_WAVE | verified | binomial | 弱波 | trial=ゲーム | den=同条件で観測可能なゲーム数 | ratio=1.100
- RF_REACH_REPLAY | pending | binomial | リーチ目リプレイ | trial=ゲーム | den=同条件で観測可能なゲーム数 | ratio=1.455 | note=偶数設定値は公開確認範囲で未解決。補間しない。
- RF_HIGH_TRANSITION | verified | binomial | チェリー以外契機の高確移行 | trial=他当選を除外した対象契機1回 | den=Bonus/AT/Billy Get Challenge等の他当選を除外した高確移行抽選対象契機回数 | ratio=2.000 | note=総通常Gを分母にしない。
- RF_STATE_ROLE_BONUS | pending | unknown | 状態・成立役別通常時ボーナス当選 | trial=対象状態で対象役成立1回 | den=状態別・役別の抽選対象成立回数 | ratio=- | note=完全公開表を個別Featureへ分解済み。設定差なしの役/状態組合せはREFERENCE扱い。
- RF_BONUS_FIRST_HIT | verified | binomial | ボーナス初当り合算 | trial=有効通常ゲーム | den=ボーナス初当りを観測可能な有効通常ゲーム数 | ratio=1.233
- RF_NORMAL_BONUS_WEAK_CHERRY | verified | binomial | 通常滞在 弱チェリー→ボーナス | trial=通常滞在中の弱チェリー成立1回 | den=通常滞在中に弱チェリーが成立した回数 | ratio=2.000 | note=内部状態・成立役別の条件付き抽選。総通常Gを分母にしない。
- RF_NORMAL_BONUS_WEAK_WAVE | verified | binomial | 通常滞在 弱波→ボーナス | trial=通常滞在中の弱波成立1回 | den=通常滞在中に弱波が成立した回数 | ratio=1.438 | note=内部状態・成立役別の条件付き抽選。総通常Gを分母にしない。
- RF_NORMAL_BONUS_CHANCE | verified | binomial | 通常滞在 チャンス目→ボーナス | trial=通常滞在中のチャンス目成立1回 | den=通常滞在中にチャンス目が成立した回数 | ratio=1.255 | note=内部状態・成立役別の条件付き抽選。総通常Gを分母にしない。
- RF_NORMAL_BONUS_STRONG_CHERRY | verified | binomial | 通常滞在 強チェリー→ボーナス | trial=通常滞在中の強チェリー成立1回 | den=通常滞在中に強チェリーが成立した回数 | ratio=1.256 | note=内部状態・成立役別の条件付き抽選。総通常Gを分母にしない。
- RF_NORMAL_BONUS_STRONG_WAVE | verified | binomial | 通常滞在 強波→ボーナス | trial=通常滞在中の強波成立1回 | den=通常滞在中に強波が成立した回数 | ratio=1.248 | note=内部状態・成立役別の条件付き抽選。総通常Gを分母にしない。
- RF_HIGH_BONUS_WEAK_WAVE | verified | binomial | 高確滞在 弱波→ボーナス | trial=高確滞在中の弱波成立1回 | den=高確滞在中に弱波が成立した回数 | ratio=1.645 | note=内部状態・成立役別の条件付き抽選。総通常Gを分母にしない。
### Evidence
- RE_SETTING_CUES | pending | semantic=- | ボーナス終了画面・XR失敗タッチボイス・エンディング中トリック設定示唆群 | allowed=[] | excluded=null | lower=- | upper=- | note=奇偶傾向と2+/4+/5+/6 Hard Evidenceを個別化する。
- RE_BONUS_END_2PLUS | verified | semantic=- | ボーナス終了 女の子 | allowed=["SET_2","SET_3","SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_BONUS_END_4PLUS | verified | semantic=- | ボーナス終了 全員集合 | allowed=["SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_BONUS_END_6 | verified | semantic=- | ボーナス終了 実写ビリー | allowed=["SET_6"] | excluded=null | lower=- | upper=-
- RE_END_TRICK_2PLUS | verified | semantic=- | エンディングトリック マリア/グウカワ | allowed=["SET_2","SET_3","SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_END_TRICK_4PLUS | verified | semantic=- | エンディングトリック ゼンインシュウゴウ | allowed=["SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_END_TRICK_5PLUS | verified | semantic=- | エンディングトリック オヤジ | allowed=["SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_END_TRICK_6 | verified | semantic=- | エンディングトリック アオドン | allowed=["SET_6"] | excluded=null | lower=- | upper=-
- RE_XR_VOICE_2PLUS | verified | semantic=- | XR失敗ボイス ファビオ「ニヤついてんじゃねー」 | allowed=["SET_2","SET_3","SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_XR_VOICE_4PLUS | verified | semantic=- | XR失敗ボイス マリア「おにいちゃんだ～いすき」 | allowed=["SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_XR_VOICE_5PLUS | verified | semantic=- | XR失敗ボイス 葉月「ぽぽぽぽ～ん」 | allowed=["SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_XR_VOICE_6 | verified | semantic=- | XR失敗ボイス ドン「オイラが世界一の花火師でぃ」 | allowed=["SET_6"] | excluded=null | lower=- | upper=-

## L_GUNDAM_SEED_G — Lパチスロ 機動戦士ガンダムSEED
Features 4 / Evidence 5 / Conflicts 0
### Features
- RF_CZ_FIRST_HIT | verified | binomial | CZ Strike Attack初当り | trial=有効通常ゲーム | den=CZ初当りを観測可能な有効通常ゲーム数 | ratio=1.414 | note=SET2の非単調値は公開値どおり保持。
- RF_AT_FIRST_HIT | verified | binomial | AT初当り | trial=有効通常ゲーム | den=AT初当りを観測可能な有効通常ゲーム数 | ratio=1.445
- RF_POST_RESET_ST_100G | verified | multinomial | リセット後・ST終了後100G以内 CZ or ボーナス初回当選 | trial=設定変更またはST終了1回 | den=設定変更またはST終了後に初回CZ or ボーナスまで追跡した機会数 | ratio=- | note=通常G確率ではなくリセット/ST終了ごとの初回事象分布。0-49と50-99は公開トータルと整合。
- RF_OTHER_ROUTE_LOTTERIES | pending | unknown | CZ・ボーナス・ST・上位AT経路別抽選候補 | trial=各経路の公開条件を満たす機会1回 | den=経路/状態別の抽選機会数 | ratio=- | note=nested routeを通常Gへ平坦化しない。Discovery候補をResearchへ移送済み。
### Evidence
- RE_CZ_ST_END_4PLUS | verified | semantic=- | CZ・ST終了画面 銀枠 アスラン＆キラ | allowed=["SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-
- RE_CZ_ST_END_6 | verified | semantic=- | CZ・ST終了画面 金枠 | allowed=["SET_6"] | excluded=null | lower=- | upper=-
- RE_ENDING_END_6 | verified | semantic=- | エンディング終了画面 金枠 | allowed=["SET_6"] | excluded=null | lower=- | upper=-
- RE_CZ_ST_DENY3 | verified | semantic=- | CZ・ST終了画面 紫枠 クルーゼ＆ムウ | allowed=["SET_1","SET_2","SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=- | note=設定3否定かつ高設定示唆。Hard部分はSET3否定のみ。
- RE_CZ_ST_DENY2 | verified | semantic=- | CZ・ST終了画面 紫枠 マリュー＆ムウ | allowed=["SET_1","SET_3","SET_4","SET_5","SET_6"] | excluded=null | lower=- | upper=-

