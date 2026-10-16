# Research current-state cleanup — 2026-10-17

- Existing 10 machines / 99 candidates retained, with findings + blocked preserving candidate routes.
- Archived 21 unreferenced source-claim strings separately; removed **only from active `sources[].claims`**, because they were no longer linked in `candidateLedger.sourceClaims`. Nothing deleted from historical audit archive.
- Verified active source claim and ledger source-claim equivalence for all 10 machines; no references dangling.
- All 10 machines still lack `researchCompleteness.domains` and at least 3 documented machine-specific queries. **Do not fabricate these**; collect actual per-domain review observations and actual query logs in bounded public surveys.
- Machine identities remain placeholders (`PENDING_CANONICAL_BATCH`, `RESEARCH_Mxx_PENDING_CANONICAL_ID`); no formal promotion or official validator pass should be claimed.
- Existing candidate dispositions stay unchanged; no wholesale exclusions or new adoption thresholds.
- This package contains a machine-readable active dataset and historical orphaned claims audit. No GitHub writes, CI Actions, or app release.
