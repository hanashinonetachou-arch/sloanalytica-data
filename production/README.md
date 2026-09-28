# Phase 14 Orchestrator Minimum Executable Prototype
Repository-persisted control-plane prototype for Manifest v8.5. Repository files are durable truth; process memory, worker success, validator PASS, events, GitHub and Actions are not transition authority.

Run locally with Node 24: `npm test`. No external queue, DB, Redis or Actions are required. Prototype code lives entirely under `production/` and does not modify MachineData/runtime assets.

Implemented: stage transition enforcement, repository persistence, immutable attempts, lease generations/single-writer protection, renewal/expiry, WorkRequest/WorkResult contracts, mock worker/validator, stale and duplicate rejection, compare-and-commit revision checks, retry, WAIT_EXTERNAL/HUMAN_REQUIRED recovery, deterministic dispatch derivation/scheduling, append-only transition history, restart/resume and machine-isolation tests.


## GitHub-authoritative production state

For remote AI workers, the Batch branch is the single durable source of truth. A worker must read one branch HEAD, execute the existing Orchestrator against that snapshot, validate the result, and publish all resulting repository-state mutations as one Git commit whose parent is exactly the observed HEAD. The branch ref is then advanced with a non-force fast-forward update. If HEAD moved, publication is rejected as a remote CAS conflict and the worker must reload/reconcile before retrying.

This outer Git CAS complements, rather than replaces, the existing stage revision CAS, lease generation/single-writer fencing, compare-and-commit check, immutable attempts, stale-result handling, provenance, dependency promotion and HUMAN_REQUIRED/WAIT_EXTERNAL states.

Normal semantic/production stages do not require GitHub Actions or a user-PC daemon. Lease ownership exists only while a worker transaction is active. Long waits release the lease through the existing result states. GitHub Actions remain reserved for the Integration Boundary.

The remote publish protocol is:

1. Read Batch branch HEAD and materialize/read the production snapshot.
2. Capture the pre-transaction repository state.
3. Run the existing Orchestrator operation and deterministic validator.
4. Build a repository transaction with `planRepositoryTransaction`; deletion and out-of-scope writes are rejected.
5. Re-check the remote branch HEAD with `assertPublishableTransaction`.
6. Create blobs/tree/commit for all mutations with the observed HEAD as parent.
7. Advance the Batch branch ref non-force. A ref conflict is retryable after reload/reconcile.
8. Only after the ref update succeeds may the worker regard the transition as durably published.

Batch #001 migration rule: do not dispatch EVALUATION from the GitHub copy until the final local Research-completion state has been synchronized once to the Batch branch. This is a migration boundary, not a permanent operating step.
