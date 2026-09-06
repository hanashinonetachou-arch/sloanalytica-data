# SloAnalytica 2026-09-07 Next10 — Gate 0 Machine Identity checkpoint

## Status

**Machine Identity: PASS**  
**Registry registration: PASS — 10/10**  
**Exact scope audit: PASS — 10/10**  
**Discovery: SEEDED — Gate A transfer pending**  
**Selection: NOT STARTED**

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
- Existing prototype catalog display-name collisions before registration: 0
- Existing prototype catalog machineId collisions before registration: 0
- Existing registry machineId collisions before registration: 0
- Existing registry provisionalRegistrationId collisions before registration: 0
- Previous production provisionalRegistrationId tail: 249 (`L_GHOST_IN_THE_SHELL_ZS`)
- Registered IDs: 250–259, exact user-supplied order
- Registry appStatus: `RESEARCHING` for all 10
- Registry researchStatus: `NOT_RESEARCHED` for all 10 at Gate 0 registration
- Series / similarly named-machine disambiguation: checked during identity verification
- Public `main`: unchanged
- Selection decisions: none

## Registration execution

The previous batch's already-proven Gate 0 registrar/workflow was temporarily retargeted on this working branch only. It preserved the same duplicate checks and registry validation contract, with the exact 2026-09-07 scope and provisional IDs changed to 250–259.

- GitHub Actions run: `34047683664`
- Workflow conclusion: `SUCCESS`
- Generated registration commit: `a678014a0461a2805ddaddca44fb281c67775952`
- Exact membership assertion: 10/10
- Registry validator: PASS

After successful registration, the temporary retargeting of the shared registrar and workflow was restored byte-for-byte to the `prototype-multi-machine` versions. They are not part of the final PR diff.

## Important identity notes

- `LB_TRIPLE_CROWN_SEVEN_FG` has four installed settings only: SET_1 / SET_2 / SET_5 / SET_6.
- `L_UMINEKO_2_A1` is classified `A_ART` because it combines real bonuses with ART.
- `LB_TRIPLE_CROWN_SEVEN_FG` is classified `BT`.
- The remaining eight machines are classified `AT`.
- `L_GUNDAM_UNICORN_KAKUSEI_DRIVE_2JA` uses the official SANKYO collection brand/manufacturer identity `ビスティ`; do not collapse it to SANKYO in canonical identity.
- `L_KABANERI_UNATO_KESSEN_XX` records market brand `サミー` and legal manufacturer `タイヨーエレック` together.

## Gate 0 conclusion

Gate 0 Machine Identity and registry registration are complete for the exact 10-machine scope. Gate A may now materialize the exhaustive Candidate Universe and ResearchData. Gate A must not change this machine set or make Selection decisions.
