# SloAnalytica Current Batch Handoff

Updated: 2026-09-01
Batch: `20260901-magia-gundamseed`
Working branch: `batch/20260901-magia-gundamseed`
Stacked base: `batch/20260831-persona5-to-bio5`
Draft PR: #149
Target integration: `prototype-multi-machine`

## Formal references

Library-confirmed standards at this checkpoint:
- `SloAnalytica_Core_Policy_v1_7.txt`
- `SloAnalytica_Research_Selection_Observation_Manifest_v6_9.txt`
- `SloAnalytica_MachineData_UX_Construction_Manifest_v6_9.txt`

Re-check Library at the next chat start and prefer a newer formal version if one exists.

## Gate status

- Gate 0: `PASS_WITH_TRACKED_DISCOVERY_DEBT`
- Gate A / Research: `PASS_WITH_TRACKED_RESEARCH_DEBT`
- Gate B / Selection: `PASS_WITH_TRACKED_SELECTION_DEBT`
- Gate C / Observation: **PASS_WITH_TRACKED_OBSERVATION_DEBT**
- Gate D / UI Design + MachineData: `NOT_STARTED`
- Gate E: `NOT_STARTED`

Next stage is **UI Design / MachineData / Gate D**. Do not skip or reinterpret the completed Selection/Observation contracts.

## Machines / production provisional IDs

192 `L_MAGIA_RECORD_RN`
193 `L_GODZILLA_NS`
194 `L_USHIO_TORA_HAKUMEN_VH`
195 `L_AMAZING_LIVE_PD`
196 `L_YOSHIMUNE_SC2`
197 `L_MAHJONG_MONOGATARI_S2`
198 `L_IDOLMASTER_MILLION_LIVE_HC`
199 `L_YOUJITSU_DE`
200 `L_MIDORIDON_VIVA_REVIVAL_FY`
201 `L_GUNDAM_SEED_G`

PR #148 still owns production provisional IDs 181-190; ID 191 is test-only. PR #149 remains intentionally stacked and must not be retargeted until predecessor dependency is reconciled.

## Gate A / B retained facts

- Research: 172 discovered / 172 transferred-accounted / 0 missing.
- Research candidates: 64 Features / 100 Evidence.
- Selection: 64/64 Feature dispositions — PRIMARY 13 / SUPPORT 11 / FALLBACK 15 / EXCLUDE 25.
- Evidence: 100/100 dispositions — UI 90 / explicit exclusion 10.
- missing disposition 0; missing reject reason 0; input-burden-only reject 0; EXCLUDE-only leakage 0; unresolved HIGH_RISK double-counting 0.
- Final strict Selection workspace: `selection-batch/SELECTION_20260901060029`.
- Stale workspace `SELECTION_20260901053510` must not be reused.

## Gate C completion

Gate C result: **PASS_WITH_TRACKED_OBSERVATION_DEBT**.

Automated results:
- Machine Observation Data v2: **10/10**
- Observation validator: **PASS 10/10**
- Selection ↔ Observation strict-v2 linkage: **PASS**
- adopted Selection Feature without Observation mapping: **0**
- major Selection contradiction discovered in Observation: **0**
- GitHub Actions source-enrichment run `33477244869`: **SUCCESS / Node 22**
- enriched Observation generation commit: `6c832af36759a78a81ec64890c0507d44c46e958`

Artifacts:
- `reports/batch-20260901-gate-c-observation-baseline.md`
- `reports/batch-20260901-observation-source-research.md`
- `reports/batch-20260901-gate-c-completion.md`
- `reports/current-batch-state.json`
- this handoff

## Observation source coverage

FOUND / Web-resolved:
- Magia Record — UniMemo. Public history examples expose total/normal play, bonus/AT play, bonus count, small roles and CZ-related data.
- Idolmaster — SloPla NEXT. Public history exposes total/normal games, bonus first-hit, Grow Up Challenge and multiple role counters.
- Midoridon — UniMemo. Weak cherry and weak wave counting confirmed.
- Godzilla — PUSH machine menu with current-day play-history area confirmed; exact numeric fields remain machine verification.
- Youjitsu — machine-menu current-day history with total/normal games, CZ, AT and rare-role probabilities documented.
- Yoshimune target identity locked to 2025 `L／ヨシムネS／SC2`; simulator apps are not treated as real-machine linked services.

Explicit unresolved after Web research:
- concrete DATA_COUNTER fields/semantics for all machines because these are hall-equipment dependent.
- SEATED_START snapshot values and previous-player interval alignment for all machines.
- Godzilla menu-history exact numeric fields.
- Amazing Live first-hit boundary / consecutive-chain exclusion in machine-visible history/counter.
- machine-specific linked-service/QR existence for Godzilla, Ushio, Amazing Live, Yoshimune, Mahjong and Gundam SEED.
- menu/history field inventories not exposed by public sources.

These are tracked acquisition improvements, not missing Selection routes. Every adopted Feature has a direct/manual Observation route.

## Semantic locks carried into Gate D

- Amazing Live: Bonus first-hit is the only active representative for first-hit/BIG/REG/aggregate overlap. Do not revive BIG/REG/aggregate as independent likelihoods. Keep SET_L; never synthesize SET_3.
- Mahjong: analysis direct AT excludes promotion; do not merge with promotion-inclusive practical direct AT or overlapping first-hit aggregates.
- Ushio: reset-only populations require confirmed-reset opportunities and are not flattened into ordinary sessions.
- Youjitsu: DAXEL flash denominator = successful CZ count; normal-cycle CZ type denominator = normal-cycle CZ hits excluding rare-role promotion; red-button denominator = successful target continuous演出 count.
- Midoridon: state×role Fallbacks keep eligible state/role/opportunity denominators and suppression against overlapping Bonus-first-hit information.
- Gundam SEED: reset/ST-end 100G is one opportunity per reset/ST-end; never convert to per-game probability.
- Magia conditional Fallbacks must retain their true conditional populations.
- Hard Evidence and tendency cues remain distinct.
- Empty = unobserved and 0 = observed zero remain distinct.

## Gate D entry rules

Gate D must use both finalized SelectionData and Machine Observation Data v2 as formal inputs. Builder/UI work may choose natural direct/derived/manual presentation but must not reinterpret statistical adoption, expose EXCLUDE-only inputs, fabricate unresolved machine fields, flatten conditional populations, or make optional linked-service/menu routes mandatory.

Difficulty exposure may only be resolved from actual Observation acquisition/exposure semantics. Do not invent per-game rates for state-dependent or opportunity-based Features.

## Next action

Start `UI Design / MachineData / Gate D` for all 10 machines. Build `ui-design-data.json` and MachineData contracts from Selection + Observation, run UI Design completeness/linkage and related audits, then STOP at Gate D checkpoint before Automated Quality Gate / Publish.
