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

PR #148 remains the stacked predecessor. Its production batch owns provisional IDs 181-190. Current registry also assigns ID 191 to test-only `S_REVUE_STARLIGHT_CX_TEST_V66`, therefore this production batch uses **192-201**. Registry validator requires provisional IDs to be unique.

## Gate status

Gate 0: `PASS_WITH_TRACKED_DISCOVERY_DEBT`.
Gate A / Research: **IN PROGRESS — 10/10 ResearchData materialized**.

Persistent artifacts:
- `reports/batch-20260901-gate-a-research-checkpoint.md`
- `reports/batch-20260901-gate-a-provenance-matrix.md`

## Machines / ResearchData

192 — `L_MAGIA_RECORD_RN` — `research/L_MAGIA_RECORD_RN/research-data.json`
193 — `L_GODZILLA_NS` — `research/L_GODZILLA_NS/research-data.json`
194 — `L_USHIO_TORA_HAKUMEN_VH` — `research/L_USHIO_TORA_HAKUMEN_VH/research-data.json`
195 — `L_AMAZING_LIVE_PD` — `research/L_AMAZING_LIVE_PD/research-data.json`
196 — `L_YOSHIMUNE_SC2` — `research/L_YOSHIMUNE_SC2/research-data.json`
197 — `L_MAHJONG_MONOGATARI_S2` — `research/L_MAHJONG_MONOGATARI_S2/research-data.json`
198 — `L_IDOLMASTER_MILLION_LIVE_HC` — `research/L_IDOLMASTER_MILLION_LIVE_HC/research-data.json`
199 — `L_YOUJITSU_DE` — `research/L_YOUJITSU_DE/research-data.json`
200 — `L_MIDORIDON_VIVA_REVIVAL_FY` — `research/L_MIDORIDON_VIVA_REVIVAL_FY/research-data.json`
201 — `L_GUNDAM_SEED_G` — `research/L_GUNDAM_SEED_G/research-data.json`

Machine IDs were collision-searched before materialization.

## Linked-service state

- Magia Record: **FOUND — UniMemo**. Universal official supported-machine list contains this machine; machine-specific analysis confirms weak-cherry counting. Full result-field inventory remains Observation field-list debt.
- Idolmaster: **FOUND — SloPla NEXT**. Official machine/result surface exposes total/normal games, initial hits, CZ, rare-role raw counts and many bonus/live counters. Removed rare-role probability display must not be reconstructed as official probability.
- Midoridon: **FOUND — UniMemo**. Universal official supported-machine list contains this machine; machine-specific analysis confirms weak cherry / weak wave / reach-eye replay counting candidates. Full result-field inventory remains Observation field-list debt.
- Other seven: **UNRESOLVED** unless machine-specific primary evidence proves CHECKED_NONE. General manufacturer apps, guides or simulators do not prove either support or absence.

## Research corrections completed after first materialization

- Amazing Live: added BIG+REG aggregate candidate so the Discovery candidate is not silently dropped.
- Mahjong Monogatari: added practical direct-AT and Kotei appearance candidates; preserved different definitions and overlap warnings.
- Youjitsu: added successful-CZ DAXEL flash with successful-CZ denominator.
- Ushio & Tora: added `246枚突破` as even-setting set Evidence (2/4/6 allowed; 1/3/5 denied), distinct from lower-bound Evidence.
- Magia / Midoridon: official UniMemo support moved to FOUND with official provenance.

## Semantic locks

- Amazing Live: settings 1/2/4/5/6 plus operational SET_L. Never synthesize SET_3. First-hit, BIG, REG and aggregate observations share information and require Selection dependency resolution.
- Mahjong: Bonus first-hit, AT first-hit and Bonus-or-AT aggregate overlap. Direct-AT analysis value and practical promotion-inclusive value have different definitions.
- Ushio & Tora: reset-only ceiling/mode distributions require known-reset trial populations.
- Youjitsu: CZ-type, DAXEL flash and red-button observations retain conditional event denominators.
- Midoridon: high-state transition and state-specific bonus lotteries use eligible trigger/state denominators, not total normal games.
- Gundam SEED: 100G-window distribution is per reset/ST-end opportunity, not per-game.
- Incomplete public setting tables remain incomplete; values are never interpolated or fabricated.

## Formal audit discovery

`tools/discovery-completeness-gate.mjs` was inspected. Formal Gate-0 transfer validation requires a `discoveryInventory` array inside each ResearchData. Every discovery candidate must map to an existing Research Feature/Evidence or be explicitly `UNRESOLVED` / `REFERENCE`.

The newly materialized 10 ResearchData files do not yet contain `discoveryInventory`; therefore the formal Discovery→Research gate cannot honestly be claimed PASS yet. This is now the principal Gate-A closure blocker.

`tools/validate-research-data.mjs` was also inspected. The current files were authored against its required schema, but the Node validator has **not yet been executed**: this stacked PR does not trigger the existing prototype-targeted research workflow, no Actions runs exist for this branch, and the working container cannot resolve GitHub for a clone. Do not report runtime validation as completed until an actual execution path succeeds.

## Remaining Gate-A closure work

1. Add exhaustive `discoveryInventory` to all 10 ResearchData files and map every known candidate.
2. Re-audit public distribution tables for candidate omissions before treating inventory as exhaustive.
3. Normalize remaining true Hard Evidence where exact public wording is sufficiently strong; leave tendency cues non-Evidence.
4. Execute `research:validate` and `research:gate0` through a real repository execution path.
5. Update Gate-A checkpoint and PR #149 with exact audit results and final head SHA.
6. Only then mark Gate A PASS and begin Selection.

No Selection decision has been made yet.
