# SloAnalytica Batch 20260901 — Gate E Completion

Status: **PASS_WITH_TRACKED_OBSERVATION_DEBT**

Batch: `20260901-magia-gundamseed`
Branch: `batch/20260901-magia-gundamseed`
Draft PR: #149
Formal standards: Core Policy v1.7 / RSO Manifest v6.9 / MachineData-UX Manifest v6.9

Gate E validated work-product HEAD: `0d137539a6cf38b6cc1c58b5e1f1c1a0e1239687`
Final Automated Quality Gate workflow: `33482322177` — **SUCCESS**
Publish: **NOT RUN**

## Automated Quality Gate result

The current repository CLI contracts were inspected before execution. Validators requiring explicit file arguments were invoked with explicit paths; no required-argument validator was run blindly without arguments.

### Cross-layer validation

- Research validation: PASS 10/10.
  - Rounded multinomial warnings remain in Research where published rounded category values do not sum exactly to 1.000; they are tracked Research warnings, not Selection failures.
- Selection validation: PASS 10/10, warnings 0.
- Selection Quality strict: PASS 10 / REVIEW 0 / BLOCKED 0.
- Feature dependency / duplicate-suppression regression: PASS through strict Selection Quality and repository-wide dependency/suppression tests.
- Observation v2 validation: PASS 10/10, compatibility warnings 0.
- Selection ↔ Observation strict-v2 linkage: PASS 10/10, warnings 0.
- UI Design validation: PASS.
- Selection ↔ UI linkage: PASS 10/10, warnings 0.
- UI ↔ Observation strict-v2 linkage: PASS 10/10, warnings 0.
- Four-layer Pipeline Gate: PASS 10/10 with tracked UNRESOLVED acquisition debt preserved.
- MachineData / UI Design materialization: PASS 10/10.
- Materialization stability: PASS; `--require-unchanged` reported all 10 unchanged / `changed=0`.

### Denominator / Evidence / UX semantics

- No standalone `denominator-resolution*.json` files exist for this batch, so `denominator:validate` was not incorrectly invoked without its required path argument. Denominator correctness is covered by Selection definitions, Observation v2, strict linkage, four-layer validation, semantic locks, and repository regression tests.
- No standalone `evidence-ui.json` files exist for these 10 machines. Evidence coverage is carried through Selection evidence decisions, UI Design mapping, materialized MachineData, and repository/UI regression tests rather than a nonexistent standalone contract.
- Evidence remains separate from normal likelihood Features: PASS.
- Hard Evidence and tendency cues remain distinct: PASS.
- Quick Input contract: PASS through materialized UI contracts and UI/repository regression tests.
- Empty = unobserved / numeric 0 = observed-zero: PASS.
- Derived/manual separation: PASS; no duplicate manual entry for explicit derived values.
- Predecessor/self interval separation: PASS; unresolved SEATED_START did not fabricate seated inputs.
- User-facing service-name audit: PASS, approved exceptions 0.
- User-Verified UX contract audit: completed with ERROR 0. One historical REVIEW remains for `S_CODE_GEASS_3_CC_FS/C_CC_SEATED_DATA_SECTION`; it is outside this 10-machine batch and is not a Gate E blocker for this batch.

### Difficulty

- UI Design / Observation linkage and four-layer checks show no fabricated acquisition route for Difficulty exposure in the 10-machine batch.
- Difficulty event-exposure regression tests: PASS 3/3.
- Repository Difficulty exposure audit: PASS. The current dedicated audit covers its configured reference machines, so it is not overstated here as a direct 10-machine-specific audit.

### Repository-wide consistency

- Registry validation: PASS, warnings 0.
- Repository-wide tests: **415 / 415 PASS**, failures 0.
- Public-data audit: PASS with **10 expected pre-Publish warnings**: each new batch MachineData exists but is not yet registered in `catalog.json`.
- Catalog registration is therefore intentionally **NOT YET DONE**; this is a Publish-stage action, not a Gate E defect.
- Schema/version consistency: PASS through validators and repository tests.
- Generated-artifact drift: PASS after excluding only the known timestamp-only rewrite of legacy `reports/v64-observation-debt-classification.json` produced by repo-wide audit/tests. Batch UI materialization itself remained unchanged and the final drift check was clean.
- Historical stale selection workspace `selection-batch/SELECTION_20260901053510` remains tracked but is not an active Gate D/E build input.

## Semantic locks re-confirmed

- Amazing Live: Bonus first-hit remains the sole active overlap-family representative. BIG, REG and BIG+REG aggregate are not revived. `SET_L` remains and no `SET_3` is generated.
- Mahjong: analysis direct-AT excludes promotion. Promotion-inclusive practical direct-AT and overlapping aggregates remain suppressed.
- Ushio: reset-only populations remain gated by confirmed-reset opportunity.
- Youjitsu: DAXEL flash / normal-cycle CZ-type / red-button denominators remain conditional and are not flattened to total normal games.
- Midoridon: state × role × opportunity semantics and Bonus-first-hit overlap suppression remain exact.
- Gundam SEED: the 100G window remains one opportunity per reset/ST-end, never a per-game probability.
- Magia Record: conditional Fallback populations remain conditional; UniMemo / linked-service values still require denominator agreement.
- EXCLUDE-only inputs were not revived.

## Tracked Observation / field-verification debt

The following remain intentionally unresolved and were not fabricated into FOUND state by Gate E:

- hall-specific DATA_COUNTER fields / denominator semantics
- SEATED_START snapshot and predecessor-interval alignment
- `L_GODZILLA_NS` PUSH menu `当日の遊技履歴` exact numeric fields
- `L_AMAZING_LIVE_PD` Bonus-first-hit boundary / chain exclusion / obtainable display
- machine-specific linked-service / QR remains UNRESOLVED for Godzilla, Ushio, Amazing Live, Yoshimune, Mahjong and Gundam SEED

These remain acquisition/source-coverage debts, not adopted-Feature route gaps. All adopted Features retain direct/manual Observation routes.

## Dependency / Publish blockers

PR #149 remains intentionally stacked on PR #148 / `batch/20260831-persona5-to-bio5`. Do not retarget automatically.

Publish has not been started. Before Publish, re-check:

1. stacked dependency state / PR #148 integration status,
2. Gate E checkpoint and exact current branch HEAD,
3. intended registration of provisional IDs 192-201 into catalog/registry/public artifacts,
4. the 10 expected pre-Publish catalog warnings are resolved only by the formal Publish flow, not by ad-hoc Gate E edits.

## Gate E decision

**PASS_WITH_TRACKED_OBSERVATION_DEBT**

Gate E is complete. Stop here before Publish and hand off to the next chat / Publish gate.
