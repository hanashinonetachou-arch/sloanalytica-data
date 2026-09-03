# 2026-09-03 Next 10-machine Batch — Machine Identity / Gate 0

Status: IN PROGRESS
Base: `prototype-multi-machine@a38288daa1055065dcf15c65bd8d49e246f32e82`
Policy: Core Policy v1.3 / Research-Selection-Observation Manifest v6.5 / MachineData UX Manifest v6.5

## Batch identity

The previous candidate duplicates `LBパチスロ ヱヴァンゲリヲン ～約束の扉～` and `アレックス ブライト` were removed before batch start. The replacements are the original 2022 `パチスロこの素晴らしい世界に祝福を！` and `パチスロ楽園追放`. `A-SLOT＋ この素晴らしい世界に祝福を！` is a different existing machine and is not treated as a duplicate.

| provisionalRegistrationId | provisional machineId | displayName | identity / release evidence | Gate 0 |
|---:|---|---|---|---|
| 211 | `L_IZA_BANCHO_SB8` | いざ！番長 | 型式 L/いざ番長/SB8; サボハニ; 2025-06-02 | OPEN |
| 212 | `L_ZETTAI_SHOGEKI_PLATONIC_HEART_TK` | L 絶対衝激～PLATONIC HEART～ | 型式 L絶対衝激TK; スパイキー; 2025-06-16 | OPEN |
| 213 | `L_WATASHI_NO_SHIAWASE_NA_KEKKON_PN` | わたしの幸せな結婚 | 型式 Lわたしの幸せな結婚PN; KPE製造 / コナミアミューズメント; 2025-07-07 | OPEN |
| 214 | `LB_TRIPLE_CROWN` | LBトリプルクラウン | OKAZAKI（岡崎産業）; 2025-07-07; BT | OPEN |
| 215 | `LB_MATADOR_3` | マタドールⅢ | 北電子; 2025-08; BT | OPEN |
| 216 | `L_TENSEI_SHITARA_KEN_DESHITA` | パチスロ 転生したら剣でした | コナミアミューズメント; 2025-08-04; スマスロAT | OPEN |
| 217 | `L_DARLING_IN_THE_FRANXX_SA` | L ダーリン・イン・ザ・フランキス | 型式 LダーリンインザフランキスSA; スパイキー; 2025-08-04 | OPEN |
| 218 | `L_SAKI_CHOJO_KESSEN_YR` | L咲-Saki- 頂上決戦 | 型式 L咲-Saki-頂上決戦YR; SANYO; 2025-08-04 | OPEN |
| 219 | `S_KONOSUBA_ZR` | パチスロこの素晴らしい世界に祝福を！ | 型式 S この素晴らしい世界に祝福を！ ZR; Sammy; 2022-04-04 | OPEN |
| 220 | `S_RAKUEN_TSUHO_FS` | パチスロ楽園追放 | 型式 S 楽園追放 FS; Sammy; 2021-09-06 | OPEN |

> IDs 211–220 are batch-local reservations chosen after the previous completed batch used registrations through 210. They are not committed to the shared registry until identity/discovery validation is complete.

## Manufacturer-linked service matrix

User real-machine/domain verification is treated as authoritative Observation input for service existence in this batch. Concrete obtainable fields still require machine-specific Research/Observation tracing.

| ID | machine | linked service | service existence state |
|---:|---|---|---|
| 211 | いざ！番長 | ダイトモ | FOUND |
| 212 | L 絶対衝激～PLATONIC HEART～ | none | CHECKED_NONE |
| 213 | わたしの幸せな結婚 | eSLOT+ | FOUND |
| 214 | LBトリプルクラウン | none | CHECKED_NONE |
| 215 | マタドールⅢ | none | CHECKED_NONE |
| 216 | パチスロ 転生したら剣でした | eSLOT+ | FOUND |
| 217 | L ダーリン・イン・ザ・フランキス | none | CHECKED_NONE |
| 218 | L咲-Saki- 頂上決戦 | none | CHECKED_NONE |
| 219 | パチスロこの素晴らしい世界に祝福を！ | マイスロ | FOUND |
| 220 | パチスロ楽園追放 | マイスロ | FOUND |

Important: `CHECKED_NONE` above means no manufacturer-linked service exists for the machine. External/manual web tools must not be promoted to manufacturer-linked service. Machine-menu existence is a separate Observation question and is not inferred from this matrix.

## Discovery Candidate Universe — seed inventory

This is intentionally broad. Nothing below is adopted/rejected at Gate 0. Research must trace every published setting-difference/evidence candidate and may add candidates found during red-team discovery.

### 211 いざ！番長
- AT初当り
- 直撃BIG
- CZ / ボーナス契機別の公開設定差
- モード・規定G・状態移行関連
- 終了画面 / 獲得枚数 / トロフィー等の設定示唆・確定情報
- ダイトモの機種別取得項目
- machine menu / seat-visible history

### 212 L 絶対衝激～PLATONIC HEART～
- リアルボーナス確率
- AT初当り
- スイカ等成立役からの高確移行・状態依存抽選
- CZ関連
- ナミちゃんトロフィーほか設定示唆・確定情報
- manufacturer-linked service: CHECKED_NONE
- machine menu / direct manual count

### 213 わたしの幸せな結婚
- ボーナス初当り
- AT初当り
- CZ関連
- ボーナススルー天井振り分け
- わた婚メドレー背景色 / キャラ紹介
- AT終了画面（コナミコマンド）
- アリストロフィー
- eSLOT+の機種別取得項目
- machine menu / seat-visible history

### 214 LBトリプルクラウン
- BIG / REG / ボーナス合算
- 小役 / ボーナス同時当選
- BIG中設定示唆
- REG中設定示唆
- BT中を含む観測可能項目
- manufacturer-linked service: CHECKED_NONE
- machine menu / direct manual count

### 215 マタドールⅢ
- BIG / REG / ボーナス合算
- BT中1枚役
- 枚数調整時コンドルランプ
- ボーナス終了時パネルフラッシュ
- 通常時小役 / 同時当選の公開設定差
- manufacturer-linked service: CHECKED_NONE
- machine menu / direct manual count

### 216 パチスロ 転生したら剣でした
- CZ初当り
- ボーナス初当り
- AT初当り
- 規定G / モード / 状態移行
- CZ種別・成功関連
- ボーナス / AT / エンディング等の設定示唆・確定情報
- eSLOT+の機種別取得項目
- machine menu / direct manual count

### 217 L ダーリン・イン・ザ・フランキス
- CZ（コネクトチャンス等）
- ボーナス初当り
- ボーナス高確初当り
- コネクトチャンス初期レベル
- CZ終了レベル別ボーナス当選率
- フランクス高確移行率（成立役別 / total）
- 獲得枚数示唆
- ボーナス高確終了画面
- ナミちゃんトロフィー
- エンディング示唆
- manufacturer-linked service: CHECKED_NONE
- machine menu / direct manual count

### 218 L咲-Saki- 頂上決戦
- CZ初当り
- AT初当り
- 周期 / ライバルモード / 状態関連の公開設定差
- 終了画面・設定示唆画面
- 獲得枚数 / 確定情報
- manufacturer-linked service: CHECKED_NONE
- machine menu / direct manual count

### 219 パチスロこの素晴らしい世界に祝福を！
- AT初当り
- 緊急クエスト種別（デュラハン / デストロイヤー）
- クエストランク別成功率
- お風呂ゾーン初期pt / 突入関連
- ボーナス中7揃い
- 裏モード移行
- このすばボーナス終了画面
- AT終了PUSHセリフ
- AT中ナビボイス
- 非有利区間の借金額セリフ
- 特殊獲得枚数表示
- サミートロフィー
- マイスロの機種別取得項目

### 220 パチスロ楽園追放
- RD突入率
- AT初当り
- BB / RD / AT初当り合成
- 共通ベル（目視不可、マイスロ条件付き取得）
- 通常 / 高確の成立役別初当り抽選
- NAH高確移行 / NAH覚醒チャレンジ関連
- RD終了画面
- AT終了画面
- 特殊エピソード / 獲得枚数等の示唆・確定情報
- マイスロの具体的取得項目とレベル条件

## Gate 0 red-team checklist

- [ ] Exact model / type-name collision audit across current prototype and previous batch reservations
- [ ] At least two independent sources for numeric candidates where available
- [ ] Manufacturer / official source preferred for identity and linked-service facts
- [ ] No candidate dropped because effect is weak, rare, correlated, burdensome, or Evidence-only
- [ ] Every discovered candidate traced into ResearchData or explicitly retained as unresolved discovery debt
- [ ] Numerator / denominator / condition / trial universe recorded per acquisition method
- [x] Linked-service existence classified: 5 FOUND / 5 CHECKED_NONE; external manual tools kept separate
- [ ] Practical 7000G exposure considered later in Selection, not used to delete Discovery candidates
- [ ] Gate 0 only closes after discovery red-team finds no obvious omitted setting-difference/evidence family

## Initial source anchors

- DMM / P-WORLD / 1geki / なな徹 / HAZUSE / パチスロサミット / manufacturer official pages are being cross-checked per machine.
- Official KONAMI pages confirm the identity/game flow of `わたしの幸せな結婚` and `転生したら剣でした`.
- Official 北電子 product information confirms `マタドールⅢ` and its setting-specific BB/RB/合算 table.
- `パチスロ楽園追放` public analysis explicitly states common-bell visual indistinguishability and My Slot counter availability only after the relevant counter level; this is an Observation constraint, not a reason to omit the candidate from Research.
- Linked-service existence matrix above incorporates user real-machine/domain verification and must not be overwritten by ambiguous web-tool references.

## Next action

Continue multi-pass web discovery for all 10 machines, expand candidate families, verify concrete linked-service fields and machine-menu observability, then close Gate 0 only after Discovery Red-Team. No Selection decision is made in this file.
