# 2026-09-03 Next 10-machine Batch — Gate D Final

Status: PASS
Date: 2026-09-04
Branch: `research/20260903-batch10-next`
Prerequisite: Gate C PASS — REAUDITED

## Result

The isolated atomic 10-machine Gate D runner completed successfully on input head `30548cb7eca1b868b193a89e20984d20cd9205f0` (workflow run `33780449089`). The runner materialized the generated Gate D artifacts and committed them back as `c2a04f84319df173f2baff4f7553763bc08b997c`.

The successful runner covered:
- REFERENCE / EXCLUDE materialization
- source-backed Hard Evidence materialization
- Research / Selection / Observation validation
- strict Selection↔Observation linkage
- UI Design validation
- Selection↔UI and UI↔Observation linkage
- four-layer pipeline gate
- semantic guards including Rakuen common-bell denominator lock
- atomic 10-machine MachineData build
- UI contract materialization stability
- registry validation
- UI/service-name audits
- repository tests

Generated runner report: `reports/batch-20260904-next10-gate-d-runner.md`.

## Gate D decisions retained

- `L_IZA_BANCHO_SB8`: direct BIG remains REFERENCE; it is not promoted into an independent numeric likelihood without proven non-overlap against AT initial hit.
- `S_RAKUEN_TSUHO_FS`: common-bell denominator is the game count shown on the same result screen as the common-bell count. The user-facing denominator wording is service-neutral; `通常ゲーム数` is not used for this feature.
- Matador tendency-only hints are not promoted into Hard Evidence.
- One physical Evidence observation is not duplicated into a second input surface.
- Manufacturer-linked-service names are not invented for unresolved machine-specific fields.

## Cross-PR / registry note

The stacked branch includes the prior batch reconciliation through provisional registration 210. Registrations 211–220 are materialized for this batch and the Gate D registry validation passed. The PR is still Draft and must remain isolated from public `main` until later gates and explicit publish authorization.

## Next stage

Proceed to Automated Quality Gate / Gate E. Formal Publish is not authorized by this Gate D PASS.

Public `main`: untouched.
