# SloAnalytica Manifest v8.5 — Work execution handoff — 2026-10-19

You are SloAnalytica implementation architect/statistical evaluation engineer. This is an execution order, not a conversation recap. Continue without repeatedly asking the user or stopping between phases.

## Highest priority

Process EXACTLY these 10 machines in order, using JSON files `01_`…`10_` and `PROGRESS.md` in this archive. Their **public-source research/self-audit/model-design have been closed** within recorded source scope. Existing Repository Production state is authoritative. Do not reopen completed research solely because the independent auditor has not checked it, an unpublished numeric parameter is unavailable, or a candidate count is low. Retain existing candidates, absent or unsupported parameters, sources, user-facing descriptions, domain labels, constraints and dependencies.

## Execution pipeline

1. Read latest **hanashinonetachou-arch/sloanalytica-data** and **hanashinonetachou-arch/sloanalytica-app** Production State, Manifest v8.5, Research closure contract, candidate schema, batch IDs/branches and latest MachineData. Do not guess batch numbers/branches. Inspect for already imported or evaluated candidates and avoid duplicate initialization.
2. Import or reconcile research JSON for each machine while preserving previously recorded candidates (never delete existing data simply to make a simpler result). Make the heterogeneous JSON key shapes consistent with the repository's actual contract.
3. Check six domains and source information per machine. The JSONs do not constitute proof that all six nominated standard sites were individually exhaustively visited. Where the repository's closure contract requires specific missing site checks, perform *bounded verification only* and document '指定範囲で公開情報未確認' when absent. No research quota, no repeated expanding searches. All 10 machines have model and source artifacts, but **the official production repository has not yet been reconciled**.
4. Specific limited issue: `07_otome4.json` has conflicting reported AT initial and direct rates across sources. Compare precisely the conflicting definitions and preserve the dispute if unresolved; do not rewrite unrelated rows.
5. Specific limited issue: `10_nogizaka46.json` includes unique setting 0 and lacks transcribed full MAP1–16 per-setting categorical table, though links include the published table. Transcribe/check the full 16-cell categorical vectors before use; verify whether the current runtime setting model supports {0,1,2,4,5,6}. If a source appears to call this machine a 6.5号機 despite it being marketed as smart slot, confirm official type before MachineData identity.
6. Proceed with formal **Evaluation → Eligibility → Candidate Contract** for the ten machines, one machine to a complete formal handoff record before the next. Use Manifest v8.5 Selection Score baseline 7000G, EIG x200 and existing CORE/SUPPORT/JOINT/EXCLUDE thresholds from the repository. Do not invent new rules or force adoption.
7. Expose correct denominators (通常G/総G/AT中識別G/実際の観測回数), observation states and exclusions. Avoid independence double-counting, especially CZ/AT outcomes, and overlapping sub-events. Exact settings 0/constraint handling must be explicit. No inferred probabilities for suggestive pictures/voices.
8. User-facing text: simple short labels, detailed explanations; no reference site names or internal code terms in UI. In reference-only sections state 「記録のみ・推測計算には使用しない」. Group same-context events as section tabs, group same-reason exclusions in a single box with **each affected event separately bulleted**. A-type only total games; +50 only game denominators; automatic remainder counts where possible; inverse 1/X for rates, percentages for distributions.
9. Record all machine-level completion and provenance, immutable attempts, unresolved issues, QA NOT performed. Do not mark existing QA more complete than it is. Integration-boundary GitHub Actions only, avoid expensive runs and unnecessary user Git operations.

## Stop conditions

Only stop if an actual HUMAN_REQUIRED decision exists, or the repository schema rejects a necessary fundamental change which cannot be safely resolved by AI. If a single machine has a genuine blocker, save it precisely, proceed to another machine where allowed, and report blocker separately. Never label independent audit complete without independent personnel.

## Scope boundary

This handoff calls for Evaluation, Eligibility, Candidate Contract and source reconciliation, **not implementation, publication, APK production or physical QA**. Final deliverables must distinguish research closure, official evaluation, deployment and QA.
