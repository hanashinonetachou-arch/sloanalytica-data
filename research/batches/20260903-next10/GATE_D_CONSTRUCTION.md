# 2026-09-03 Next 10-machine Batch — Gate D Construction Contract

Status: IN PROGRESS
Prerequisite: Gate C PASS — REAUDITED
Branch: `research/20260903-batch10-next`

## Cross-PR / registry reconciliation

The current batch branch now contains the prior batch tooling/registrations through provisional registration 210 via merge reconciliation commit `684339a5c1d7b036ebbe857ec0e4cc14d4d008a3`.

Current `machine-registry.json` contains provisional registration 210 (`L_ULTRAMAN_KE`). Searches for provisional registrations 211 and 220 returned no matches before this construction contract was created. Therefore 211–220 remain available for this batch, subject to the normal registry audit when the entries are materialized.

Reserved mapping:

| provisional registration | machineId | displayName |
|---:|---|---|
| 211 | `L_IZA_BANCHO_SB8` | いざ！番長 |
| 212 | `L_ZETTAI_SHOGEKI_PLATONIC_HEART_TK` | L 絶対衝激～PLATONIC HEART～ |
| 213 | `L_WATASHI_NO_SHIAWASE_NA_KEKKON_PN` | わたしの幸せな結婚 |
| 214 | `LB_TRIPLE_CROWN_SF4` | LBトリプルクラウン |
| 215 | `LB_MATADOR_3_TT` | マタドールⅢ |
| 216 | `L_TENSEI_SHITARA_KEN_DESHITA_GT` | パチスロ 転生したら剣でした |
| 217 | `L_DARLING_IN_THE_FRANXX_SA` | L ダーリン・イン・ザ・フランキス |
| 218 | `L_SAKI_CHOJO_KESSEN_YR` | L咲-Saki- 頂上決戦 |
| 219 | `S_KONOSUBA_ZR` | パチスロこの素晴らしい世界に祝福を！ |
| 220 | `S_RAKUEN_TSUHO_FS` | パチスロ楽園追放 |

## Active numeric Feature contract

Only Gate-C active observations may become default likelihood Features.

### 211 いざ！番長
- `AT初当り`: active.
- `共通ベルA`: active; Daitomo automatic count and manual observation are acquisition routes whose provenance must not be silently mixed.
- `弱チェリー`: numeric rejected.
- `直撃BIG`: REFERENCE until composition against AT初当り is proven.

### 212 L 絶対衝激～PLATONIC HEART～
- `リアルボーナス`: active.
- `AT初当り`: active.
- CZ/state-qualified families: REFERENCE.

### 213 わたしの幸せな結婚
- `ボーナス初当り`: active with published denominators 1/290.8, 1/286.5, 1/277.3, 1/255.3, 1/251.4, 1/249.4 for settings 1–6.
- `AT初当り`: active with published denominators 1/594.3, 1/583.4, 1/558.8, 1/494.7, 1/484.3, 1/479.4 for settings 1–6.
- eSLOT+ existence is known, but machine-specific automatic fields must not be invented.

### 214 LBトリプルクラウン
- `BIG`: active (settings 1/2/5/6 = 1/276.5, 1/273.1, 1/251.1, 1/227.6).
- `REG`: active (1/414.8, 1/392.4, 1/346.8, 1/302.0).
- `チェリー`: active (1/49.9, 1/48.2, 1/45.6, 1/42.4).
- `プラム`: active (1/64.6, 1/63.0, 1/59.4, 1/54.9).
- ボーナス合算 and role-specific overlap likelihoods: not active.
- machine menu = CHECKED_NONE; linked service = CHECKED_NONE.
- `ドラマチックスコア` is a seat-visible aid, not a denominator source.

### 215 マタドールⅢ
- `BB`: active (1/278.9, 1/268.6, 1/260.1, 1/244.5, 1/231.6, 1/219.9).
- `RB`: active (1/434.0, 1/417.4, 1/402.1, 1/362.1, 1/334.4, 1/299.3).
- bonus total: rejected duplicate.
- BT中1枚役: REFERENCE.
- machine menu = CHECKED_NONE; linked service = CHECKED_NONE.

### 216 パチスロ 転生したら剣でした
- `AT初当り`: active (1/403.8, 1/396.0, 1/373.4, 1/340.7, 1/325.9, 1/312.8).
- CZ/bonus initial and state-qualified weak-chance-role families: not active likelihood Features.
- eSLOT+ exact machine fields must not be guessed.

### 217 L ダーリン・イン・ザ・フランキス
- `ボーナス初当り`: active (1/229.8, 1/224.1, 1/214.9, 1/207.3, 1/190.3, 1/180.3).
- bonus-high/CZ/Connect Chance/Franxx-high conditional families: REFERENCE.

### 218 L咲-Saki- 頂上決戦
- `AT初当り`: active (1/398.4, 1/386.4, 1/365.5, 1/336.3, 1/304.2, 1/284.0).
- CZ/pathway families: not active likelihood Features.
- previous AT-end screen recovery from machine menu is an Evidence acquisition route only.

### 219 パチスロこの素晴らしい世界に祝福を！ (2022)
- `AT初当り`: active (1/261.5, 1/251.6, 1/247.5, 1/233.5, 1/230.8, 1/216.9).
- conditional distributions remain REFERENCE.
- My Slot exists; unverified machine-specific counters must not be advertised as automatic inputs.

### 220 パチスロ楽園追放
- `BB/RD/AT初当り合成`: active (1/164.5, 1/160.1, 1/147.9, 1/134.0, 1/121.3, 1/111.1).
- `共通ベル`: active after real-device My Slot re-verification (1/364.1, 1/344.9, 1/327.7, 1/273.1, 1/230.0, 1/198.6).
- RD / AT component initial hits are not separately active to avoid double counting with the aggregate.

## Rakuen My Slot denominator lock

Real-device screenshot verified the following single result screen values:
- `ゲーム数` = 9538G
- `通常ゲーム数` = 6078G
- `共通ベル成立回数` = 33回, displayed `1/289.04`
- `通常時BB突入回数` = 24回, displayed `1/253.25`
- `NAH覚醒チャレンジ突入回数` = 16回, displayed `1/379.88`

Consistency check:
- 9538 / 33 ≈ 289.03, matching the displayed common-bell rate.
- 6078 / 33 ≈ 184.18, not matching.
- 6078 / 24 = 253.25 and 6078 / 16 = 379.875, matching those normal-play entries.

Therefore the common-bell MachineData contract is:
- numerator: `共通ベル成立回数`
- denominator: same My Slot result screen `ゲーム数`
- never pair with `通常ゲーム数`
- blank = not observed / unavailable; zero = observed zero.

## UI construction rules

- User-facing sections use natural pachislot terminology only. Do not show internal terms such as `Feature`, `Evidence`, `ADOPT`, `REFERENCE`, `sharedFeatureIds`, `自動生成`, or `AI生成` as section labels.
- Denominator copy must explain what one trial means. Avoid generic labels like only `ゲーム数` when a narrower universe is required.
- Manufacturer-linked-service names are shown only where verified: ダイトモ / eSLOT+ / マイスロ. External strategy tools are not linked services.
- Evidence sections should be named `設定示唆・確定情報` or another natural equivalent and remain distinguishable/collapsible.
- A screen/voice/trophy observation is entered once even if it can drive both a hint display and hard lower-bound/exact-setting Evidence.
- Live observation and menu/service recovery of the same event are acquisition paths to one input surface.
- Empty input means unobserved; entered zero means observed zero.

## Gate D implementation sequence

1. Materialize registry entries 211–220 on this reconciled branch only.
2. Build structured `research-data.json`, `selection-data.json`, and `machine-observation-data.json` for each machine from the closed Gate A/B/C contracts.
3. Generate UI field contracts / MachineData using the reconciled prior-batch tooling; do not fabricate unsupported linked-service fields.
4. Run per-machine build with draft allowance where required.
5. Run selection, dependency/double-count, Observation, shared Feature/Evidence, registry, MachineData, and user-facing service-name audits.
6. Regenerate catalog/difficulty only after all ten MachineData builds pass.
7. Gate D remains OPEN until generated artifacts and audits pass.

No public-main mutation is authorized by this contract.