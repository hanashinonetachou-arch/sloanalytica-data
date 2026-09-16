# SloAnalytica M7 User Interaction & Execution Continuity Contract v1.0

Status: Normative execution contract
Applies to: Manifest v7.1 audit, migration, reconstruction, and subsequent batch work

## 1. Purpose

This contract makes low-user-burden execution and restartability mandatory. It does not relax any Manifest v7.1 semantic, proof, validation, or publication requirement.

## 2. Execution priority

For every task, use the first applicable path:

1. Execute directly through connected GitHub/repository tooling when possible.
2. Use Codex only when it materially enables work that cannot be completed reliably through the connected repository tooling. A Codex handoff must be consolidated into one paste-ready instruction whenever practical.
3. Request local PC/CMD/PowerShell execution only when neither repository tooling nor Codex can perform the required operation.
4. Request a human semantic decision only after the Human Question Gate in section 5 is exhausted.

Do not ask the user to relay logs or CI results that can be retrieved directly.

## 3. Batch execution rules

- A user instruction to proceed authorizes continuous execution through all non-semantic, reversible, contract-compliant steps until a defined stop condition is reached.
- Do not require approval between routine Research retrieval, audit generation, lineage reconstruction, validation, branch/commit/PR operations, CI inspection, or other mechanical steps already governed by the Manifest and Execution Contract.
- Default to one PR per coherent batch, not one PR per machine or evidence group.
- A blocked machine must not stop independent machines in the same batch. Move it to the appropriate pending queue and continue.
- Accumulate human questions and present them together rather than one at a time.
- Real-device verification is a separate queue and must never be claimed unless actually performed by the user.
- Do not touch public `main` during audit/reconstruction unless a later explicit publication contract authorizes it.

## 4. User Intervention Count (UIC)

Each batch records user burden separately from technical work.

Required metrics:
- `userInterventionCount`
- `userLocalCommandCount`
- `codexHandoffCount`
- `humanDecisionCount`
- `realDeviceVerificationRequestCount`
- `timeoutRecoveryCount`

Target:
- reconstruction pilot: UIC <= 1 excluding initial authorization and final report;
- routine reconstruction batches: UIC = 0 whenever repository evidence is sufficient.

UIC must never be reduced by silently making a semantic decision that belongs to the user.

## 5. Human Question Gate

Before asking the user a question, the executor must determine, in order:

1. Can the answer be obtained from GitHub or another already-connected authoritative source?
2. Is the answer already fixed by Manifest v7.1, the Execution Contract, Selection, or another authoritative repository artifact?
3. Can existing Research/Selection/Observation/canonical UI artifacts resolve it without changing prior semantics?
4. Can the affected item be safely deferred while independent work continues?
5. Can this question be combined with other pending human questions?

Only then may user intervention be requested.

Human approval is normally reserved for:
- application/product semantics changing;
- overturning an existing Selection decision;
- ambiguity not resolvable from repository evidence or authoritative external research;
- real-device-only verification;
- a change to the meaning of published data or user input.

When asking, include a recommended disposition when evidence supports one and allow a single approval to cover the consolidated set.

## 6. Timeout and interruption resilience

Large user-visible batches must be internally checkpointed.

- Prefer small repository operations and deterministic sub-batches over one oversized operation.
- Persist meaningful checkpoints to the audit branch before long downstream work.
- A timeout is not a batch failure.
- Work already represented by a verified checkpoint must not be repeated solely because a chat/tool execution timed out.
- Work not represented by a verified checkpoint is not considered complete and may be safely rerun.
- Targeted validators may be used during construction; full-fleet validation is reserved for appropriate batch/gate boundaries.
- Do not repeatedly fetch or recompute unchanged source material when a checkpointed audit/work queue already records it.

## 7. Execution State as restart authority

`reports/m7-execution-state.json` is the machine-readable restart authority for the active reconstruction program.

At every meaningful checkpoint it must identify at minimum:
- schema/version;
- governing Manifest/contract versions;
- active phase and strategy;
- integration branch and known base SHA;
- active work branch/PR when applicable;
- completed and pending populations or links to their authoritative reports;
- human decision queue;
- field/real-device verification queue;
- next action;
- checkpoint SHA when known;
- UIC metrics.

A new chat/session must read this state and the governing contracts before asking the user to reconstruct prior progress from memory.

If repository HEAD has advanced since `knownBaseSha`, inspect the drift. Timestamp/report-only drift may be rebased without semantic re-review; semantic source drift requires affected-scope revalidation.

## 8. Reporting contract

Normal completion reports should lead with a compact status such as:

`target N / completed N / pending N / CI status / main untouched / user actions N`

Detailed explanation is required only for blockers, semantic decisions, validation failures, publication decisions, or when requested.

Do not send step-by-step narration when no user action is required.

## 9. Reconstruction-specific rule

The preferred migration unit is a machine, not an isolated layer, when doing so avoids revisiting the same machine across Research -> Selection -> Observation -> canonical UI -> materialized MachineData -> App renderer/distribution gates.

Existing artifacts are inputs to reconstruction. Do not re-research externally merely because an artifact is legacy. External research is required only where current Manifest requirements cannot be established from authoritative existing artifacts.

## 10. Non-negotiable safety boundaries

This contract changes execution ergonomics only. It must not:
- weaken binary formal proof;
- treat labels/categories/names/appearance as proof;
- relax validators to make a batch pass;
- add proof-only fields to runtime MachineData;
- cause Builder to re-decide Selection;
- alter canonical UI/MachineData/runtime semantics merely to satisfy audit;
- claim CI, tests, publication, or real-device verification that did not occur.

## 11. Restart instruction

A future session should be able to resume from the following minimal instruction:

> Resume SloAnalytica work. Read the governing Manifest/Execution Contracts and `reports/m7-execution-state.json`; verify repository drift; continue from `nextAction`. Do not ask me to restate prior progress unless repository evidence is genuinely insufficient.
