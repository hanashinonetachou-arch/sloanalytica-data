# M7 OTHER_BLOCKED cluster audit — 2026-09-19

The current fleet report contains **68 OTHER_BLOCKED machines**. They collapse into only three formal Gate0 dispositions:

| disposition | machines | interpretation |
|---|---:|---|
| NOT_APPLICABLE_NO_EVIDENCE | 29 | Selection Quality PASS and formal Gate0 `NO_EVIDENCE`; there is no Evidence contract to migrate. |
| BLOCKED_ADOPTION_OUTSIDE_LEGACY_GROUPS | 38 | Formal Evidence adoption exists outside legacy `evidenceUi.groups`; the current legacy migration projection cannot represent it. |
| BLOCKED_ORPHAN_DOWNSTREAM | 1 | Downstream Evidence exists without a Selection adoption contract. |

## Key finding

The 29 `NOT_APPLICABLE_NO_EVIDENCE` machines are not unresolved Evidence migrations. Their formal Gate0 disposition is PASS/NO_EVIDENCE and every Evidence-specific proof is correctly NOT_APPLICABLE. Keeping them under `OTHER_BLOCKED` conflates a terminal no-migration state with actual blockers.

This audit does **not** change their fleet classification automatically, because classification semantics are part of the fleet-audit contract. It records the distinction so a later classifier change can be made with a regression test rather than silently changing counts.

The 38 adoption-outside-legacy machines form the next substantive batch target. They have Selection Quality PASS but need their non-legacy formal Evidence adoption path represented before canonical UI and feature-sharing proof can pass.

The single orphan-downstream machine is `S_SUPER_BINGO_NEO_CLASSIC_HH1`; it must not be batch-repaired by inference because Selection currently has no corresponding adoption contract.

## Decision

1. Treat the 29 NO_EVIDENCE machines as a terminal non-migration class for planning purposes.
2. Cluster the 38 adoption-outside-legacy machines by the exact Selection adoption representation before proposing any migration.
3. Keep the orphan-downstream machine isolated for explicit Selection/downstream reconciliation.
