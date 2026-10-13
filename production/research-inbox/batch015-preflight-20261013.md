# Batch015 Research intake preflight — 2026-10-13

Status: **PARTIAL / NOT OFFICIALLY ACCEPTED**. This document is a non-authoritative research intake checkpoint, not an Orchestrator stage transition, Evaluation, Eligibility or Candidate Contract.

Repository identity: selected ten machines are recorded in `production/batches/batch-20261013-014/next-ten-selected-20261013.json`. The provided ZIP contains 76 candidates and 60 coverage entries. The batch-20261013-015/batch.json path was not present at review; do not initialize a duplicate batch without repository traversal and reconciliation.

## Confirmed critical intake issues

1. **S_ENENN_SHOUBOUTAI_JS**: M02-C01/C02/C03/C04 map numeric-key order 1/2/3/4/5 to physical settings 1/2/4/5/6. Fix the keys before computing any setting-indexed score. Source: https://nana-press.com/kaiseki/machine/526/14735/
2. **L_ONIMUSHA3_XA**: M03-C01 has missing setting-3 rate, independently listed as 1/388.4 for 2024 Onimusha 3 by P-WORLD: https://www.p-world.co.jp/machine/database/10104 . Never substitute 2025 Shin Onimusha 3.
3. **S_SENGOKU_KOIHIME_FC**: ZIP characterizes the machine as 'ボーナスタイプ', while canonical selected registry and HAZUSE identify it as AT. Treat BIG/REG as exclusive and don't multiply their composite separately. https://data.hazuse.com/?genre=208&machine_code=3S0259
4. **S_NIGHTS_YTCC**: Hyper BIG and Challenge BIG are exclusive outcomes; a combined rate cannot be multiplied in addition. https://pachinavi.net/machines/knights/
5. **S_SUPER_BINGO_NEO_CLASSIC_HH1**: first vs subsequent cycle and reset-enhanced cycle conditions require separate denominators: https://nana-press.com/kaiseki/machine/589/16085/

## Scope and outstanding work

The source archive candidates.json still requires source-by-source claim verification and six-area audit. No all-machine independent audit, formal 7000G EIG evaluation, Eligibility or valid schema Candidate Contracts have been produced. The above source checks do not justify marking Research COMPLETE. Follow `production/RESEARCH_PROCESS_CONTRACT.md`, `production/WORK_RECOVERY.md`, batch stage schema, and the existing CAS publish protocol before a stage transition. Preserve prior QA and do not invoke Actions outside Integration Boundary. Use existing Work handoff ZIP and its original candidate IDs; never silently overwrite authentic evidence.

This is an additive preflight record, not a change to published MachineData or active QA state.
