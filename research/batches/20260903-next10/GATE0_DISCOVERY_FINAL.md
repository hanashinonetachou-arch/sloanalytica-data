# 2026-09-03 Next 10-machine Batch — Gate 0 Discovery Final

Status: PASS
Branch: `research/20260903-batch10-next`
Base at batch start: `prototype-multi-machine@a38288daa1055065dcf15c65bd8d49e246f32e82`
Policy: Core Policy v1.3 / Research-Selection-Observation Manifest v6.5 / MachineData UX Manifest v6.5

## Identity lock

| reserved registration | machineId | displayName | verified type/model |
|---:|---|---|---|
| 211 | `L_IZA_BANCHO_SB8` | いざ！番長 | L/いざ番長/SB8 |
| 212 | `L_ZETTAI_SHOGEKI_PLATONIC_HEART_TK` | L 絶対衝激～PLATONIC HEART～ | L絶対衝激TK |
| 213 | `L_WATASHI_NO_SHIAWASE_NA_KEKKON_PN` | わたしの幸せな結婚 | Lわたしの幸せな結婚PN |
| 214 | `LB_TRIPLE_CROWN_SF4` | LBトリプルクラウン | LBTCSF4 |
| 215 | `LB_MATADOR_3_TT` | マタドールⅢ | LBマタドールⅢTT |
| 216 | `L_TENSEI_SHITARA_KEN_DESHITA_GT` | パチスロ 転生したら剣でした | L転生したら剣でしたGT |
| 217 | `L_DARLING_IN_THE_FRANXX_SA` | L ダーリン・イン・ザ・フランキス | LダーリンインザフランキスSA |
| 218 | `L_SAKI_CHOJO_KESSEN_YR` | L咲-Saki- 頂上決戦 | L咲-Saki-頂上決戦YR |
| 219 | `S_KONOSUBA_ZR` | パチスロこの素晴らしい世界に祝福を！ | S この素晴らしい世界に祝福を！ ZR |
| 220 | `S_RAKUEN_TSUHO_FS` | パチスロ楽園追放 | S 楽園追放 FS |

The shared registry is not mutated yet. Reservations 211–220 remain cross-PR reservations because the current prototype base predates the previous batch PR that used registrations through 210.

## Manufacturer-linked services

User real-machine/domain verification is authoritative for service existence.

| ID | linked service | state | Gate 0 handling |
|---:|---|---|---|
| 211 | ダイトモ | FOUND | Research concrete obtainable fields; public analysis confirms automatic counting of setting-difference small roles including common-bell A / weak cherry |
| 212 | none | CHECKED_NONE | no manufacturer-linked-service research debt |
| 213 | eSLOT+ | FOUND | official KONAMI service capability confirmed; machine-specific field map remains Research debt |
| 214 | none | CHECKED_NONE | no manufacturer-linked-service research debt |
| 215 | none | CHECKED_NONE | no manufacturer-linked-service research debt |
| 216 | eSLOT+ | FOUND | official KONAMI service capability confirmed; machine-specific field map remains Research debt |
| 217 | none | CHECKED_NONE | no manufacturer-linked-service research debt |
| 218 | none | CHECKED_NONE | no manufacturer-linked-service research debt |
| 219 | マイスロ | FOUND | Research concrete machine-specific counters/evidence-history availability |
| 220 | マイスロ | FOUND | common-bell counter route is conditionally available at My Counter Lv4 / cumulative 15,000G |

External strategy-site calculators and manual tools are not manufacturer-linked services.

## Machine-menu observations known at Gate 0

- LBトリプルクラウン: machine menu `CHECKED_NONE` by user real-machine verification.
- マタドールⅢ: machine menu `CHECKED_NONE` by user real-machine verification.
- L咲-Saki- 頂上決戦: public analysis reports a machine-menu route for checking the previous AT-end screen; treat this as a machine-menu observation route, not a manufacturer-linked service.
- Other machine-menu details remain Observation-layer work unless already verified by reliable public/manual evidence.

## Discovery Red-Team result

The candidate universe has been deliberately kept broader than eventual Selection. No candidate was removed for weak setting spread, rarity, correlation, input burden, or Evidence-only status.

### 211 いざ！番長
Retain AT initial hit, direct BIG, common-bell A, weak cherry, CZ/bonus-trigger families, mode/prescribed-G/state transitions, end screens, payout displays, trophy/confirmed evidence, Daitomo acquisition, seat-visible/history routes. Common-bell A must preserve acquisition provenance because manual visual counting and Daitomo automatic counting do not have identical practical observability.

### 212 L 絶対衝激～PLATONIC HEART～
Retain real-bonus rate, AT initial hit, CZ, role-to-high-state transitions such as watermelon-derived transition families, state-dependent draws, Nami trophy and other hint/confirmed evidence, direct manual-count candidates. Linked service is CHECKED_NONE.

### 213 わたしの幸せな結婚
Retain bonus initial hit, AT initial hit, CZ, bonus-through ceiling distribution, わた婚メドレー background/character evidence, AT-end Konami-command evidence, Aristo trophy, eSLOT+ acquisition route. Do not infer exact eSLOT+ field names from the generic service description.

### 214 LBトリプルクラウン
Retain BIG, REG, total bonus rate, cherry/plum and other published small-role differences, role-specific bonus overlap, BIG evidence, REG evidence, BT-related observations. Machine menu and manufacturer-linked service are both CHECKED_NONE. BIG/REG/total and role-overlap families are explicitly deferred to dependency/double-count audit rather than discarded now.

### 215 マタドールⅢ
Retain BIG, REG, total bonus rate, BT one-coin role, Condor-lamp evidence during adjustment, bonus-end panel flash, published normal-role/overlap candidates. Machine menu and manufacturer-linked service are both CHECKED_NONE. BT one-coin role has a very large published setting spread but few practical trials, so it must later be judged by expected 7000G exposure rather than spread alone.

### 216 パチスロ 転生したら剣でした
Retain CZ, bonus initial hit, AT initial hit, prescribed-G/mode/state transitions, CZ type/success families, bonus/AT/ending evidence, eSLOT+ acquisition. Exact type is locked to `L転生したら剣でしたGT`; manufacturer display and actual manufacturing entity must remain distinguishable where documented.

### 217 L ダーリン・イン・ザ・フランキス
Retain CZ/Connect Chance, bonus initial hit, bonus-high initial hit, Connect Chance initial level, level-dependent bonus success, Franxx-high transitions by role/total, payout evidence, bonus-high end screens, Nami trophy, ending evidence. Linked service is CHECKED_NONE.

### 218 L咲-Saki- 頂上決戦
Retain CZ initial hit, AT initial hit, cycle/rival-mode/state transitions, CZ-through ceiling, 清澄トライアル, AT-end screen, other setting screens, payout/confirmed evidence, ending/和ランプ evidence. Linked service is CHECKED_NONE; previous AT-end screen recovery is a separate machine-menu route.

### 219 パチスロこの素晴らしい世界に祝福を！
Retain AT initial hit, emergency-quest type, quest-rank success, bath-zone initial points/entry, bonus 7-alignment, hidden-mode transition, bonus-end screen, AT-end PUSH voice, AT navigation voice, non-active-section debt line, special payout displays, 布盗会 illustration/evidence, Sammy trophy, My Slot fields. This is the 2022 original and must not be conflated with the existing A-SLOT+ machine.

### 220 パチスロ楽園追放
Retain RD, AT initial hit, BB/RD/AT combined initial-hit family, common bell, normal/high-state role-dependent draws, NAH high transition/challenge, RD-end screen, AT-end screen, episode/payout evidence, My Slot fields and level conditions. Common bell is visually indistinguishable from push-order bell but is conditionally observable via My Slot My Counter Lv4 after cumulative 15,000G; this is an Observation constraint, not a Research rejection reason.

## Gate 0 closure checklist

- [x] Exact type/model identity established for all 10 machines.
- [x] Provisional machine IDs revised to verified suffixes where earlier placeholders lacked them (`SF4`, `TT`, `GT`).
- [x] Duplicate/collision intent established, including original 2022 このすば versus existing A-SLOT+ model.
- [x] Numeric candidate families cross-checked with multiple public sources where available; official/manufacturer/public-regulatory evidence preferred for identity.
- [x] Evidence-only families retained rather than filtered.
- [x] Manufacturer-linked service existence classified: 5 FOUND / 5 CHECKED_NONE.
- [x] External tools kept separate from manufacturer-linked services.
- [x] User-verified machine-menu absence recorded for LBトリプルクラウン and マタドールⅢ.
- [x] Acquisition-method differences retained for later numerator/denominator provenance work.
- [x] Rare / conditional candidates retained for later 7000G practical-exposure evaluation.
- [x] No obvious omitted setting-difference/evidence family found in final Discovery Red-Team pass.

## Gate 0 decision

**PASS.** Proceed to Research / Gate A. Research must trace every candidate above into structured ResearchData or explicitly record unresolved Research debt. Research must not make Selection decisions and must not manufacture denominator equivalence between manual, menu, Daitomo, eSLOT+, or My Slot acquisition routes.
