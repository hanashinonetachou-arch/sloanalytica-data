# SloAnalytica 2026-09-07 Next10 — Gate 0 Machine Identity checkpoint

## Status

**Machine Identity: PASS**  
**Registry registration: PENDING_SAFE_MUTATION_PATH**  
**Research / Selection: NOT STARTED**

Canonical identity source: `research/batches/20260907-next10/gate0-machine-identity.json`

## Fixed batch scope

1. `L_FIRE_FORCE_2` — Lパチスロ 炎炎ノ消防隊2 — provisionalRegistrationId 250
2. `L_UMINEKO_2_A1` — Lパチスロうみねこのなく頃に2 — provisionalRegistrationId 251
3. `L_KABANERI_UNATO_KESSEN_XX` — スマスロ 甲鉄城のカバネリ 海門（うなと）決戦 — provisionalRegistrationId 252
4. `L_JORMUNGAND_ND01G` — スマスロヨルムンガンド — provisionalRegistrationId 253
5. `LB_TRIPLE_CROWN_SEVEN_FG` — LBトリプルクラウンセブン — provisionalRegistrationId 254
6. `L_SHINUCHI_YOSHIMUNE_A1` — 真打 吉宗 — provisionalRegistrationId 255
7. `L_KYOKOU_SUIRI_ST` — L虚構推理 — provisionalRegistrationId 256
8. `L_AKUDAMA_DRIVE_TP` — Lアクダマドライブ — provisionalRegistrationId 257
9. `L_MILLION_GOD_KISEKI_CX` — スマスロ ミリオンゴッド-神々の軌跡- — provisionalRegistrationId 258
10. `L_GUNDAM_UNICORN_KAKUSEI_DRIVE_2JA` — Lパチスロ 機動戦士ガンダムユニコーン 覚醒DRIVE — provisionalRegistrationId 259

## Gate 0 audit

- Target count: 10
- Existing prototype catalog display-name collisions: 0
- Existing prototype catalog machineId collisions: 0
- Current production provisionalRegistrationId tail: 249 (`L_GHOST_IN_THE_SHELL_ZS`)
- provisionalRegistrationId 250: unused before this batch
- Reserved IDs: 250–259, exact user-supplied order
- Series / similarly named-machine disambiguation: checked during identity verification
- Public `main`: unchanged
- Selection decisions: none

## Important identity notes

- `LB_TRIPLE_CROWN_SEVEN_FG` has four installed settings only: SET_1 / SET_2 / SET_5 / SET_6.
- `L_UMINEKO_2_A1` is classified `A_ART` because it combines real bonuses with ART.
- `LB_TRIPLE_CROWN_SEVEN_FG` is classified `BT`.
- The remaining eight machines are classified `AT`.
- `L_GUNDAM_UNICORN_KAKUSEI_DRIVE_2JA` uses the official SANKYO collection brand/manufacturer identity `ビスティ`; do not collapse it to SANKYO in canonical identity.
- `L_KABANERI_UNATO_KESSEN_XX` records market brand `サミー` and legal manufacturer `タイヨーエレック` together.

## Safe-mutation stop

An attempt to add a new batch-specific registry mutation script was blocked by the tool safety layer. The block was preserved; the audit was not weakened and no alternate direct registry mutation was performed. The existing registry remains unchanged at this checkpoint.

Gate A must not change the fixed 10-machine scope. Before any registry-dependent automated Research workflow, use an approved existing mutation path or explicitly validated equivalent and re-run duplicate checks against the then-current prototype state.
