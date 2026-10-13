# Batch015 intake / corrected-draft (2026-10-13)

**State:** preliminary audit, NOT official Research completion, Evaluation, Eligibility, Candidate Contract, Runtime, or QA.

## Verified production reconciliation
Source batch selection: `production/batches/batch-20261013-014/next-ten-selected-20261013.json` on branch `production/v85-batch-015-research-20261013`. 10 machine IDs in `machine_mapping_verified.json` match those selected. `production/batches/batch-20261013-015/batch.json` was not found at preflight.

Production docs: `production/RESEARCH_PROCESS_CONTRACT.md`, `production/WORK_RECOVERY.md`.
Repository checkpoint: `production/research-inbox/batch015-preflight-20261013.md`, commit `293799b395fe6d6c70d00687e5e74103533126b9`.

## Changes versus original handoff
- The original input ZIP's files remain intact here.
- `candidates_corrected_draft.json`: corrected *draft* of M02-C01..04 physical setting keys 1/2/4/5/6; M03-C01 setting 3 AT initial hit added as 1/388.4 based on P-WORLD; every changed row tagged.
- `research_findings.json`: specific cross-source and dependency review concerns.
- `machine_mapping_verified.json`: canonical machine ID reconciliation.

Important: The corrected draft is not a valid final Research artifact. In particular, not all proposed rates and categorical hints were individually rechecked, conditional opportunities and observed counts have not been audited, and original production candidate contract schema has not been mapped. Do not mark stage COMPLETE or score these blindly. No 7000G score was generated since official calibration, per-machine real opportunity definition, and complete source review have not been established.

Sources and original candidate provenance are preserved. Missing numeric values were not interpolated, except the explicitly sourced published setting 3 rate for Onimusha 3.
