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

Next stage is **UI Design / MachineData / Gate D**.

## Machines / IDs

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

PR #149 remains intentionally stacked on PR #148 dependency. Do not retarget automatically.

## Gate A/B retained facts

Research: 172 discovered / 172 accounted / 0 missing; 64 Feature candidates / 100 Evidence candidates.
Selection: PRIMARY 13 / SUPPORT 11 / FALLBACK 15 / EXCLUDE 25; Evidence UI 90 / excluded 10; missing dispositions 0; reject-reason missing 0; input-burden-only reject 0; EXCLUDE-only leakage 0; unresolved HIGH_RISK double-counting 0.
Canonical Selection workspace: `selection-batch/SELECTION_20260901060029`; `SELECTION_20260901053510` is stale.

## Gate C completion

Result: **PASS_WITH_TRACKED_OBSERVATION_DEBT**.

- Machine Observation Data v2: 10/10
- Observation validator: PASS 10/10
- Selection ↔ Observation strict-v2 linkage: PASS
- adopted Feature route missing: 0
- major Selection contradiction: 0
- source-enrichment workflow run `33477244869`: SUCCESS / Node 22
- enriched Observation generation commit: `6c832af36759a78a81ec64890c0507d44c46e958`
- Gate C state commit before this final handoff write: `d541f1cf1b77ad927c2cd17572a25cfb05bd2e56`

Artifacts:
- `reports/batch-20260901-gate-c-observation-baseline.md`
- `reports/batch-20260901-observation-source-research.md`
- `reports/batch-20260901-gate-c-completion.md`
- `reports/current-batch-state.json`
- `reports/current-batch-handoff.md`

## Source coverage

Web-resolved:
- Magia Record — UniMemo; total/normal play, bonus/AT play, bonus count, small roles and CZ-related history examples confirmed.
- Idolmaster — SloPla NEXT; total/normal games, bonus first-hit, Grow Up Challenge and multiple role counters confirmed.
- Midoridon — UniMemo; weak cherry and weak wave counting confirmed.
- Godzilla — PUSH menu/current-day play-history area confirmed; exact numeric fields remain machine verification.
- Youjitsu — current-day menu history with total/normal games, CZ, AT and rare-role probabilities documented.
- Yoshimune — target identity fixed to 2025 `L／ヨシムネS／SC2`; simulator apps are not real-machine linked services.

Explicit unresolved after Web research:
- hall-specific DATA_COUNTER fields and semantics.
- SEATED_START snapshots / previous-player interval alignment.
- Godzilla menu-history exact numeric fields.
- Amazing Live first-hit boundary / consecutive-chain exclusion.
- machine-specific linked-service/QR for Godzilla, Ushio, Amazing Live, Yoshimune, Mahjong and Gundam SEED.
- menu/history field inventories not exposed publicly.

Every adopted Selection Feature nevertheless has a direct/manual Observation route; unresolved items above are optional acquisition improvements or field-verification debt.

## Semantic locks for Gate D

- Amazing Live: Bonus first-hit only active overlap representative; do not independently revive BIG/REG/aggregate. Keep SET_L; no SET_3.
- Mahjong: analysis direct AT excludes promotion; do not merge promotion-inclusive practical direct AT or overlapping aggregate outcomes.
- Ushio: reset-only populations require confirmed reset opportunities.
- Youjitsu: DAXEL flash denominator = successful CZ count; normal-cycle CZ type = normal-cycle CZ hits excluding rare-role promotion; red-button = successful target continuous演出 count.
- Midoridon: state×role Fallbacks keep eligible state/role/opportunity denominators and suppression against overlapping Bonus first-hit.
- Gundam SEED: reset/ST-end 100G = one opportunity per reset/ST-end; never per-game.
- Magia conditional Fallbacks retain true conditional populations.
- Hard Evidence and tendency cues remain distinct.
- empty = unobserved; zero = observed zero.

## Gate D entry

Use finalized SelectionData + Machine Observation Data v2 as formal inputs. Build `ui-design-data.json` and MachineData contracts without re-deciding Selection, exposing EXCLUDE-only inputs, fabricating unresolved machine fields, flattening conditional populations, or making optional source routes mandatory.

Difficulty exposure may only be resolved from actual Observation exposure semantics; do not invent per-game rates for state/opportunity Features.

STOP rule for next stage: complete UI Design / MachineData / Gate D, update checkpoint, then stop before Automated Quality Gate / Publish.
