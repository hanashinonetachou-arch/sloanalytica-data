# SloAnalytica Current Batch Handoff

Updated: 2026-09-01
Batch: 20260901 Magia Record → Gundam SEED
Working branch: `batch/20260901-magia-gundamseed`
Stacked base: `batch/20260831-persona5-to-bio5` @ `9b8f7f05fb1d72f5d0b177f1adf00220adb2f136`
Current Draft PR: #149
Target integration branch: `prototype-multi-machine`

## Formal references

Latest Library-confirmed standards at this Gate:
- `SloAnalytica_Core_Policy_v1_7.txt`
- `SloAnalytica_Research_Selection_Observation_Manifest_v6_9.txt`
- `SloAnalytica_MachineData_UX_Construction_Manifest_v6_9.txt`

Core constraints remain Discovery completeness, Research→Selection→Observation→UI ordering, exact numerator/denominator semantics, no duplicate likelihood, empty != observed zero, and linked-service FOUND/CHECKED_NONE/UNRESOLVED classification.

## Dependency / registration correction

PR #148 owns provisionalRegistrationId 181-190 and remains the stacked predecessor for this batch.

The initial Gate-0 checkpoint incorrectly reserved 191-200. Current `machine-registry.json` already assigns provisionalRegistrationId `191` to `S_REVUE_STARLIGHT_CX_TEST_V66`. Registry validation requires provisional IDs to be unique, so this batch is corrected to the next contiguous range **192-201**. No production artifact for this batch was created with the invalid range before this correction.

## Machines / locked identity / corrected provisional IDs

| ID | Machine | Manufacturer / brand | Type name | Introduction |
|---|---|---|---|---|
| 192 | スマスロ マギアレコード 魔法少女まどか☆マギカ外伝 | ミズホ | L／スマスロマギアレコード／RN | 2025-04-07 |
| 193 | Lゴジラ | ニューギン | LゴジラNS | 2025-04-07 |
| 194 | Lうしおととら 白面決戦 | Daiichi / 製造: アイドル | Lうしおととら白面決戦VH | 2025-04-07 |
| 195 | スマート沖スロ アメイジングライブ | パイオニア | LアメイジングライブPD | 2025-04-07 |
| 196 | 吉宗 | サボハニ | L／ヨシムネS／SC2 | 2025-04-21 |
| 197 | L麻雀物語 | オリンピアエステート | L麻雀物語S2 | 2025-04-21 |
| 198 | スマスロ アイドルマスター ミリオンライブ！ ネクストプロローグ | 山佐 | LパチスロアイドルマスターミリオンライブHC | 2025-04-21 |
| 199 | スマスロ ようこそ実力至上主義の教室へ | DAXEL | Lようこそ実力至上主義の教室へDE | 2025-05-07 |
| 200 | スマスロ 緑ドン VIVA!情熱南米編 REVIVAL | ユニバーサルブロス | L／緑ドン5／FY | 2025-05-07 |
| 201 | Lパチスロ 機動戦士ガンダムSEED | ビスティ | L機動戦士ガンダムSEED G | 2025-05-07 |

## Gate status

Gate 0: `PASS_WITH_TRACKED_DISCOVERY_DEBT`.
Gate A / Research: **IN PROGRESS**.

Persistent Gate-A artifacts:
- `reports/batch-20260901-gate-a-research-checkpoint.md`
- `reports/batch-20260901-gate-a-provenance-matrix.md`

Cross-source Research sweep is complete for all ten machines. Numeric candidate families, partial tables, evidence/cue families, denominator traps and dependency risks are recorded. Missing settings in partial public tables must remain unresolved; they are never interpolated or fabricated.

## Linked-service state

- Magia Record: machine-specific analysis indicates UniMemo counting; primary official support/field contract remains to close.
- Idolmaster: `FOUND` — official SloPla NEXT machine page/result surface; raw counters are usable Observation candidates subject to scope/reset semantics.
- Midoridon: machine-specific analysis indicates UniMemo support/count categories; official result-field contract remains debt.
- Other seven machines: no machine-specific linked telemetry has been proven in the current sweep; keep `UNRESOLVED` unless explicit manufacturer evidence supports `CHECKED_NONE`. General manufacturer apps/guides/simulators are not sufficient.

## Research semantic locks

- Amazing Live: settings 1/2/4/5/6; SET_L is operational only, not a posterior hypothesis. Bonus first-hit and BIG/REG appearance observations overlap and cannot be blindly multiplied.
- Mahjong Monogatari: Bonus first-hit, AT first-hit and Bonus-or-AT aggregate overlap.
- Ushio & Tora: reset-only ceiling/mode distributions remain conditional on a known reset population.
- Classroom: CZ-type and DAXEL/red-button rows retain their conditional trial units.
- Midoridon: high-state transitions/state-specific bonus lotteries cannot use total normal games as denominator.
- Gundam SEED: 100G-window values are per reset/ST-end opportunity, not per-game probabilities.

## Remaining Gate-A closure work

1. Lock final machineId strings and collision-check them.
2. Materialize ten `research/<machineId>/research-data.json` files with provenance.
3. Normalize public hard-evidence rows without promoting mere tendencies to Evidence.
4. Resolve linked-service status as far as public primary evidence permits.
5. Run ResearchData validation and Discovery→Research completeness audit; untransferred known candidates must be zero.
6. Update this checkpoint and PR #149 before Gate A is marked PASS.

No Selection decision has been made yet.
