# M7 Observation blocker clusters — 2026-09-19

This is a mechanical re-clustering of the current full-fleet audit. Labels/categories remain diagnostic only and never establish Observation lineage.

## Summary

- OBSERVATION_BLOCKED: 70
- Clusters: 12
- No diagnostic label candidate: 52
- With diagnostic label candidate: 18
- Duplicate formal Observation ID: 0

## Clusters

| Machines | Groups | Items | Signature |
|---:|---:|---:|---|
| 32 | 32 | 222 | `MIGRATION_REQUIRED|PASS|PASS|FAIL|FAIL|REVIEW|PASS|missing=1|labelCandidates=NO|duplicateFormal=NO` |
| 7 | 14 | 48 | `MIGRATION_REQUIRED|PASS|PASS|FAIL|FAIL|REVIEW|PASS|missing=2|labelCandidates=NO|duplicateFormal=NO` |
| 7 | 14 | 52 | `MIGRATION_REQUIRED|PASS|PASS|FAIL|FAIL|REVIEW|PASS|missing=2|labelCandidates=YES|duplicateFormal=NO` |
| 7 | 21 | 76 | `MIGRATION_REQUIRED|PASS|PASS|FAIL|FAIL|REVIEW|PASS|missing=3|labelCandidates=NO|duplicateFormal=NO` |
| 4 | 4 | 22 | `MIGRATION_REQUIRED|PASS|PASS|FAIL|FAIL|REVIEW|PASS|missing=1|labelCandidates=YES|duplicateFormal=NO` |
| 4 | 16 | 66 | `MIGRATION_REQUIRED|PASS|PASS|FAIL|FAIL|REVIEW|PASS|missing=4|labelCandidates=NO|duplicateFormal=NO` |
| 2 | 2 | 6 | `MIGRATION_REQUIRED|PASS|PASS|FAIL|FAIL|PASS|PASS|missing=1|labelCandidates=NO|duplicateFormal=NO` |
| 2 | 6 | 22 | `MIGRATION_REQUIRED|PASS|PASS|FAIL|FAIL|REVIEW|PASS|missing=3|labelCandidates=YES|duplicateFormal=NO` |
| 2 | 10 | 35 | `MIGRATION_REQUIRED|PASS|PASS|FAIL|FAIL|REVIEW|PASS|missing=5|labelCandidates=YES|duplicateFormal=NO` |
| 1 | 4 | 10 | `MIGRATION_REQUIRED|PASS|PASS|FAIL|FAIL|PASS|PASS|missing=4|labelCandidates=YES|duplicateFormal=NO` |
| 1 | 4 | 15 | `MIGRATION_REQUIRED|PASS|PASS|FAIL|FAIL|REVIEW|PASS|missing=4|labelCandidates=YES|duplicateFormal=NO` |
| 1 | 6 | 24 | `MIGRATION_REQUIRED|PASS|PASS|FAIL|FAIL|REVIEW|PASS|missing=6|labelCandidates=YES|duplicateFormal=NO` |

## Safety conclusion

A cluster is not a migration allow-list. Formal Observation completion still requires an explicit unique non-diagnostic relationship between each Selection Evidence group and its Observation artifact. A generic Evidence Observation, a similar label, or a single-group/single-candidate shape alone is insufficient.
