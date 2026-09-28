# Phase 14 Orchestrator Minimum Executable Prototype
Repository-persisted control-plane prototype for Manifest v8.5. Repository files are durable truth; process memory, worker success, validator PASS, events, GitHub and Actions are not transition authority.

Run locally with Node 24: `npm test`. No external queue, DB, Redis or Actions are required. Prototype code lives entirely under `production/` and does not modify MachineData/runtime assets.

Implemented: stage transition enforcement, repository persistence, immutable attempts, lease generations/single-writer protection, renewal/expiry, WorkRequest/WorkResult contracts, mock worker/validator, stale and duplicate rejection, compare-and-commit revision checks, retry, WAIT_EXTERNAL/HUMAN_REQUIRED recovery, deterministic dispatch derivation/scheduling, append-only transition history, restart/resume and machine-isolation tests.
