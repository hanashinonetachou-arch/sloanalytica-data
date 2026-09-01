# SloAnalytica Current Batch Handoff

Updated: 2026-09-01
Batch: 20260901 Magia Record → Gundam SEED
Working branch: `batch/20260901-magia-gundamseed`
Stacked base: `batch/20260831-persona5-to-bio5` @ `9b8f7f05fb1d72f5d0b177f1adf00220adb2f136`
Current Draft PR: #149
Target integration branch: `prototype-multi-machine`

## Formal references

Latest Library-confirmed standards:
- `SloAnalytica_Core_Policy_v1_7.txt`
- `SloAnalytica_Research_Selection_Observation_Manifest_v6_9.txt`
- `SloAnalytica_MachineData_UX_Construction_Manifest_v6_9.txt`

## Dependency / registration

PR #148 remains the stacked predecessor. Its production batch owns provisional IDs 181-190. Registry ID 191 is already assigned to test-only `S_REVUE_STARLIGHT_CX_TEST_V66`; this production batch therefore uses **192-201**.

## Gate status

Gate 0: `PASS_WITH_TRACKED_DISCOVERY_DEBT`.
Gate A / Research: **PASS_WITH_TRACKED_RESEARCH_DEBT**.
Next stage: Selection / Gate B.

## Machines / ResearchData

192 — `L_MAGIA_RECORD_RN`
193 — `L_GODZILLA_NS`
194 — `L_USHIO_TORA_HAKUMEN_VH`
195 — `L_AMAZING_LIVE_PD`
196 — `L_YOSHIMUNE_SC2`
197 — `L_MAHJONG_MONOGATARI_S2`
198 — `L_IDOLMASTER_MILLION_LIVE_HC`
199 — `L_YOUJITSU_DE`
200 — `L_MIDORIDON_VIVA_REVIVAL_FY`
201 — `L_GUNDAM_SEED_G`

All ten have `research/<machineId>/research-data.json` and an explicit `discoveryInventory`.

## Gate A runtime audit

GitHub Actions run `33473996001` completed successfully on Node 22.

- ResearchData validation: PASS 10/10.
- Discovery → Research completeness: PASS.
- Discovery candidates: 85.
- Transferred/accounted: 85.
- Missing: 0.
- Runtime audit: `reports/batch-20260901-gate-a-runtime-audit.json`.
- Actions-generated inventory/validation commit: `899a1acc`.
- Gate A completion record: `reports/batch-20260901-gate-a-completion.md`.

Expected warnings only:
- Magia `RF_MODE_AT_END`: 4 `MULTINOMIAL_ROUNDED_SUM` warnings from published rounded category percentages.
- L Godzilla `RF_SHURAI_OPPONENT`: 4 `MULTINOMIAL_ROUNDED_SUM` warnings from published rounded category percentages.
Research raw published values remain unchanged; Selection must decide normalization only under the formal normalization contract.

## Web → Discovery exhaustiveness

Cross-source distribution-table sweep completed for the current public source universe. Setting-specific initial-hit/appearance rates, small-role rates, allocations/selections, conditional state/role lotteries, mode/reset/post-ST distributions, screens/characters/voices/cards/trophies/payouts, and linked-service surfaces were reviewed. Known incomplete tables remain explicit `pending` Research candidates rather than being interpolated or dropped.

Gate-A interpretation:
- Unreviewed statistical categories = 0 for the current discovered universe.
- Discovery candidate missing from Research = 0.
- Future newly published/publicly discovered data reopens the affected Research layer.

## Linked-service state

FOUND:
- Magia Record — UniMemo. Official Universal supported-machine list + machine-specific weak-cherry counting evidence.
- Idolmaster — SloPla NEXT. Official machine/result surface with total/normal games, initial-hit/CZ, raw rare-role and bonus/live counters.
- Midoridon — UniMemo. Official Universal supported-machine list + machine-specific weak-cherry/weak-wave/reach-eye counting evidence.

UNRESOLVED:
- L Godzilla
- L Ushio & Tora Hakumen Kessen
- Amazing Live
- Yoshimune
- L Mahjong Monogatari
- Classroom of the Elite
- Gundam SEED

Do not promote these seven to CHECKED_NONE without machine-specific primary evidence. General manufacturer apps, simulators, QR/member services, or family-level services are insufficient.

## Selection-critical semantic locks

- Amazing Live: settings 1/2/4/5/6 plus operational SET_L only; never synthesize SET_3. Bonus first-hit, BIG, REG and BIG+REG aggregate share information.
- Mahjong: Bonus first-hit, AT first-hit and Bonus-or-AT aggregate overlap. Analysis direct-AT and practical promotion-inclusive direct-AT have different definitions.
- Ushio: reset-only ceiling/mode distributions require a known-reset population. `246枚突破` is even-setting set Evidence, not lower-bound Evidence.
- Youjitsu: CZ-type, DAXEL flash and red-button observations retain their conditional event denominators.
- Midoridon: high-state transition/state-specific bonus lotteries use eligible trigger/state denominators, not total normal games.
- Gundam SEED: 100G-window distribution is per reset/ST-end opportunity, not per-game.
- Missing settings in partial public tables remain unresolved; never interpolate or fabricate.

## Next action — Selection / Gate B

For every Research Feature and Evidence candidate, assign an explicit Selection disposition. Resolve dependency/high-risk overlap before any likelihood combination. Preserve correct trial units. Do not reject solely due input burden. Keep unresolved-public-table candidates explicit. After 10/10 Selection, run Selection validation and Quality/Dependency audit, update checkpoint, then decide whether context still safely fits Observation / Gate C.
