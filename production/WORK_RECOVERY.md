# Work recovery protocol

Use the existing Orchestrator stage files, attempts, provenance and repository CAS. This protocol adds no transition authority and cannot control Work stream recovery.

1. Read the Batch branch HEAD and `batch.json`, then reconcile expired leases with `reconcile-batch`. Check authoritative output references and hashes before reuse. Read presentation overlays before touching previously audited Runtime.
2. Perform one responsibility-stage transaction. Persist artifacts, actual validator output and the Orchestrator state together. An unfinished survey is preliminary Research, never accepted Research.
3. Before publishing, reread the branch HEAD. Publish a commit with the observed HEAD as parent; advance the ref with `expected_sha` and `force: false`. On conflict, reload and reconcile. Never retry a ref mutation blindly.
4. Checkpoints live under the existing Batch directory as `work-checkpoint.json`. They record the observed HEAD, machine/stage states, validation references, blockers, next operation and human actions. They describe state; they do not override stage files.
5. External reads use at most two attempts and a per-attempt 120-second deadline. On an error, retain successful reads, record the failed source and move to another independent source. A search failure is not evidence that values do not exist.
6. Tests run against an isolated snapshot with a 15-minute deadline. Save stdout and exit status. Timeout means NOT_COMPLETED, never PASS. Build and Actions waits use a 30-minute deadline, poll at intervals no longer than 60 seconds, and inspect the existing run/artifact before any retry. Do not cancel a live publish or build merely because a poll failed.
7. On a lost mutation response, reread HEAD and the affected artifact before retrying. Check whether the desired commit is already published. Unknown publication status remains unresolved until observed.
8. End each completed responsibility stage by publishing its checkpoint. A new Work resumes from the last published valid state, without regenerating outputs or marking device QA complete.

Normal commits include `[skip ci]`. Integration Boundary is the only normal Actions trigger. HUMAN_REQUIRED stays reserved for actual human work; read failures remain recorded external blockers.
