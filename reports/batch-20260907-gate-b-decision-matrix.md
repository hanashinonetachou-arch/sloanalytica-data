# SloAnalytica 2026-09-07 Next10 — Gate B semantic decision matrix

Status: **Selection design in progress**  
Source: Gate A PASS ResearchData + statistical evaluator v1.2  
Scope: exact 10 machines / 38 Research Features

This document fixes the semantic disposition before SelectionData materialization. Statistics do not auto-adopt features. Rejection is based on information structure, incomplete setting likelihoods, containment/dependency, or insufficient discriminative information — not on manual-input burden.

## 1. L_FIRE_FORCE_2

| Research Feature | Decision | Rationale / dependency |
|---|---|---|
| RF_BONUS_INITIAL | INCLUDE_SUPPORT | 全6設定の公開確率があり、通常Gを再現可能な分母として使える。単独判別力は弱いが長時間では基礎情報になる。 |
| RF_ENEN_LOOP_INITIAL | INCLUDE_PRIMARY | 全6設定で公開され、設定1→6の比率差がボーナス初当りより大きい。通常G基準で観測可能。 |
| RF_TRAP_SMALLV_CONVERT | EXCLUDE | 公開尤度が設定1と設定4以上のみで、設定2・3の個別確率が欠落するため6設定ベイズ尤度を構成できない。 |
| RF_TRAP_SMALLV_BONUS_AFTER_CONVERT | EXCLUDE | 同様に設定2・3の個別確率が欠落。さらに十字目変換成立後という前段条件付きで、前Featureとの二重評価リスクもある。 |

Dependency note: BONUS_INITIAL と ENEN_LOOP_INITIAL は同じ通常G分母でも事象定義が別。Gate Bでは直ちに包含と断定せず併用候補とするが、MachineData生成時に炎炎ループがボーナス初当りの厳密な部分集合と判明した場合は抑制へ降格する。

## 2. L_UMINEKO_2_A1

| Research Feature | Decision | Rationale / dependency |
|---|---|---|
| RF_BONUS_INITIAL | INCLUDE_PRIMARY | 全ボーナスを含む通常G基準の基礎Feature。 |
| RF_REG_INITIAL | INCLUDE_FALLBACK | REGはボーナス合算の部分集合なので同時尤度投入を避ける。ボーナス合算を使えない場合のみFallback。 |
| RF_REG_DIAG_BLUE7 | INCLUDE_SUPPORT | REG中ゲームという独立した条件付き分母で設定差が大きく、ボーナス発生頻度とは別の条件付き情報を持つ。 |
| RF_ART_MISS | INCLUDE_SUPPORT | ARTゲームを分母とする別状態の観測。全6設定値あり。 |
| RF_LV2_NAV_SAME_BIG | INCLUDE_SUPPORT | 同色BIG後CZの限定分母。全6設定分布があり、経路を区別すれば再現可能。 |
| RF_LV2_NAV_MIXED_BIG | INCLUDE_SUPPORT | 異色BIG後に限定した別経路。全6設定値あり。 |
| RF_LV2_NAV_OTHER | INCLUDE_SUPPORT | REG後/ART後/周期経由に限定した別経路。全6設定値あり。 |

Dependency note: RF_REG_INITIAL is suppressed by RF_BONUS_INITIAL. Three Lv2 navigation Features must never share denominator counts; route-specific trials are required.

## 3. L_KABANERI_UNATO_KESSEN_XX

| Research Feature | Decision | Rationale / dependency |
|---|---|---|
| RF_BONUS_INITIAL | INCLUDE_PRIMARY | 全6設定の通常G基準。設定1→6差が明瞭。 |
| RF_ST_INITIAL | INCLUDE_FALLBACK | ST到達はボーナス経路を内包し得る後段結果で、BONUS_INITIALとの因果重複が大きい。単独利用Fallbackとする。 |
| RF_LOWER_BELL | INCLUDE_SUPPORT | 通常/AT中に成立を直接観測でき、全6設定値あり。初当り系とは別の成立役情報。 |
| RF_CYCLE3_BONUS | INCLUDE_SUPPORT | 3周期到達という条件付き分母で設定差が大きい。 |
| RF_CYCLE4_BONUS | INCLUDE_SUPPORT | 4周期到達という別条件付き分母。3周期とは試行を混ぜない。 |
| RF_SHUNJO_3000PT | EXCLUDE | 設定2〜5が同率で、極端設定以外の識別情報が乏しい。稀な条件付き事象で実戦上の情報量も限定的。 |

Dependency note: RF_ST_INITIAL is suppressed by RF_BONUS_INITIAL. Cycle3 and Cycle4 are distinct attempts, not a pooled cycle denominator.

## 4. L_JORMUNGAND_ND01G

| Research Feature | Decision | Rationale / dependency |
|---|---|---|
| RF_CZ_INITIAL | INCLUDE_PRIMARY | 全6設定値があり通常G基準。 |
| RF_AT_INITIAL | INCLUDE_FALLBACK | CZ等の前段抽選を経た最終結果でCZ初当りと因果重複が強い。CZが利用できない場合のFallback。 |
| RF_BONUS_END_SCREEN | INCLUDE_SUPPORT | 8カテゴリの設定別分布が公開済み。ただしHard Evidenceカテゴリを同じ観測から二重投入しないよう分割が必須。 |

Dependency note: AT_INITIAL is suppressed by CZ_INITIAL. For RF_BONUS_END_SCREEN, exclude HANDGUN_SHELL / OLD_KOKO_TEAM / KASPER / GOLDEN_SCARECROW from numeric likelihood and handle those four as Evidence only. Numeric multinomial uses DEFAULT / EVENING / SLEEPING_VALMET / THREE_DOCTORS with appropriate residual/normalization contract.

## 5. LB_TRIPLE_CROWN_SEVEN_FG

| Research Feature | Decision | Rationale / dependency |
|---|---|---|
| RF_BB_INITIAL | INCLUDE_PRIMARY | 全4設定のBB確率を通常G基準で観測可能。 |
| RF_RB_INITIAL | INCLUDE_SUPPORT | BBとは別ボーナス種別で全4設定値あり。 |
| RF_CHERRY | INCLUDE_SUPPORT | 小役成立率に全4設定差があり、ボーナス初当りとは別の成立役情報。 |
| RF_PLUM | INCLUDE_SUPPORT | 小役成立率に全4設定差があり、チェリーとは別カテゴリ。 |

Dependency note: cherry/plum are mutually exclusive same-game outcomes. Independent-binomial近似で過信しないよう、Observation/MachineData段階で同一通常G分母を共有するカテゴリ構造として扱えるか再監査する。厳密なjoint modelが組めない場合は片方をFallbackへ降格する。

## 6. L_SHINUCHI_YOSHIMUNE_A1

| Research Feature | Decision | Rationale / dependency |
|---|---|---|
| RF_AT_INITIAL | INCLUDE_PRIMARY | 最終AT初当りとして全6設定値あり。 |
| RF_CZ_INITIAL | INCLUDE_FALLBACK | CZはATへ至る主要前段で、AT初当りと同時利用すると同じ設定差を重複評価しやすい。 |

Dependency note: CZ_INITIAL is suppressed by AT_INITIAL.

## 7. L_KYOKOU_SUIRI_ST

| Research Feature | Decision | Rationale / dependency |
|---|---|---|
| RF_CZ_INITIAL | INCLUDE_PRIMARY | 高頻度で全6設定差があり、通常G基準で安定して観測可能。 |
| RF_BONUS_INITIAL | INCLUDE_FALLBACK | CZ経由を含む後段結果でCZ初当りとの因果重複があるため同時利用を避ける。 |
| RF_CZ_ONE_SHOT_SUCCESS | INCLUDE_SUPPORT | CZ有効機会を分母とする条件付き成功抽選。CZ発生頻度とは異なる条件付き確率情報を持つ。 |

Dependency note: BONUS_INITIAL is suppressed by CZ_INITIAL. One-shot success uses only eligible CZ opportunities, never total normal games.

## 8. L_AKUDAMA_DRIVE_TP

| Research Feature | Decision | Rationale / dependency |
|---|---|---|
| RF_CZ_INITIAL | INCLUDE_PRIMARY | 通常G基準の前段初当り。 |
| RF_BONUS_INITIAL | INCLUDE_FALLBACK | CZ/通常抽選を経た中間結果でCZ初当りと依存するため同時利用を避ける。 |
| RF_AT_INITIAL | INCLUDE_FALLBACK | さらに後段の最終結果でCZ/ボーナスとの因果重複が大きい。 |
| RF_ANALYZE_0PT | INCLUDE_SUPPORT | 0pt抽選有効機会に限定した条件付き抽選で、設定差が大きい。 |
| RF_EPISODE_UPGRADE | INCLUDE_SUPPORT | ボーナス当選を分母とする別の条件付き昇格抽選。全6設定値あり。 |

Dependency note: BONUS_INITIAL and AT_INITIAL are suppressed by CZ_INITIAL; AT_INITIAL is also suppressed when BONUS_INITIAL is active. Conditional Features require eligible-attempt denominators and are not approximated with normal games.

## 9. L_MILLION_GOD_KISEKI_CX

| Research Feature | Decision | Rationale / dependency |
|---|---|---|
| RF_GG_INITIAL | INCLUDE_PRIMARY | 全6設定GG初当り。設定順は単調ではないが各設定固有尤度として利用可能。 |
| RF_NON_GAIA_ZZONE | INCLUDE_SUPPORT | 非ガイアステージでGG当選した機会に限定する条件付きFeature。奇数/偶数で大きな分布差を持つ。 |

Dependency note: Z-ZONE FeatureはGG当選後の条件付き試行であり、通常Gを分母にしない。GG_INITIALとの因果関係はあるが条件付き確率として別情報を持つため採用候補とする。

## 10. L_GUNDAM_UNICORN_KAKUSEI_DRIVE_2JA

| Research Feature | Decision | Rationale / dependency |
|---|---|---|
| RF_CZ_INITIAL | INCLUDE_PRIMARY | 全6設定の通常G基準で設定差あり。 |
| RF_AT_INITIAL | INCLUDE_FALLBACK | CZを経由する後段結果で因果重複が大きく、CZと同時尤度投入を避ける。 |

Dependency note: AT_INITIAL is suppressed by CZ_INITIAL.

## Evidence policy for SelectionData materialization

All 95 verified Research Evidence candidates must receive an explicit Selection disposition. Hard lower-bound / exact-setting / denial candidates are retained unless the same natural observation is already consumed numerically in a way that would double count it.

Special case: Jormungand bonus-end-screen numeric Feature and its four hard categories come from the same natural observation. The numeric Feature must exclude the four hard categories; those categories remain Evidence. This is a partition, not duplicate inference.

Jormungand Kerotto trophy remains a Research REFERENCE and is not Evidence because the available semantics are prediction-based rather than verified.

## Next materialization contract

SelectionData must:
- classify all 38 Research Features exactly once;
- classify all 95 Research Evidence candidates explicitly;
- provide concrete user-facing reasons for every INCLUDE and EXCLUDE;
- encode the suppression relationships above;
- preserve route/state-specific denominators;
- avoid exposing excluded-only inputs;
- pass `selection:validate`, strict evidence coverage, Selection Quality Gate, and exact 10-machine scope audit.
