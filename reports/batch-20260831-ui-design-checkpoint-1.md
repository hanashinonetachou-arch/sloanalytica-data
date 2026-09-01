# Batch 2026-08-31 UI Design checkpoint 1

Branch: `batch/20260831-persona5-to-bio5`

## Completion

- ResearchData: 10/10
- SelectionData: 10/10
- Machine Observation Data v2: 10/10
- UI Design Data v1: 10/10

## Evidence normalization completed in this checkpoint

- BOØWY: AT end hard evidence split from soft hints; setting-L panel retained as operational evidence.
- BIG島唄30: setting-L panel normalized.
- 笑ゥせぇるすまん4: payout hard evidence and REG-end 笑 icon hard evidence normalized. Soft/unstructured ending hints remain intentionally outside inference UI.
- バイオハザード RE:2: figure No.17–24 hard deny/lower-bound/setting-6 evidence normalized. Figure collection is treated as a re-check observation route, not duplicate evidence.
- 仮面ライダー電王: 玉ちゃんトロフィー, 俺FEVER end-screen hard conditions, and 俺CLIMAX bonus-end hard conditions normalized. Soft mini-character/bonus hints are not forced into hard evidence.
- てぃだどんどん: BIG entry 7-segment yellow/green/green+red hard evidence normalized; white/red defaults omitted from evidence input.

## Research validator hardening

Incomplete distribution candidates must not declare `candidateModel: multinomial` until categories and complete setting distributions are recorded. Corrected:

- `L_SISTER_QUEST_CA/RF_AT_CEILING_DISTRIBUTION`
- `L_SISTER_QUEST_CA/RF_MONSTER_COMPOSITION`
- `S_BIOHAZARD_RE2_XB/RF_AT_LEVEL`
- `L_TIDADONDON_PA5/RF_BIG_REG_COMPOSITION`

They remain in Research as pending candidates rather than being dropped.

## UI unresolved / field verification debt

- BIG島唄30: exact chain-boundary counting remains high-priority real-device verification.
- 笑ゥ4: distinguish CZ entry-success draw from success earned during CZ.
- RE:2: figure collection retention/reset boundary.
- 電王: exact ぱちログweb result fields.
- Persona5: MySlot result-field range/reset boundary.
- Sister Quest: SmartTALK history/reset boundary.
- Biohazard5: middle-line AT hit -> Infection classification consistency.

These are retained as unresolved where appropriate; no web-solvable item was intentionally moved to machine verification merely for convenience.

## CI note

Draft PR #148 was opened to exercise repository GitHub Actions. The repository-wide Machine Observation Research Audit currently fails on pre-existing legacy Observation vocabulary across many older machines, so that failure must not be treated as a batch-local 10-machine failure. Changed-machine Research/Selection/UI pipeline results remain the relevant signal for this batch.

## Next

1. Observe current PR CI after the latest Research fixes and UI 10/10 materialization.
2. Fix only batch-local validator/pipeline failures.
3. Run/inspect UI Design Selection linkage and UI Design Observation linkage through available CI paths.
4. Proceed to MachineData generation only after batch-local gates are clean enough to avoid encoding unresolved observation semantics into the package.
