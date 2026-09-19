# M7 Selection Quality blocker clustering plan — 2026-09-19

## Scope

The current full-fleet audit reports 88 primary `SELECTION_QUALITY_BLOCKED` machines. This stage must not edit Selection decisions. It first partitions failures by the exact deterministic rules in `tools/selection-quality-gate.mjs`.

## Mechanical reason families

The gate has two severities.

### BLOCKED

- duplicate Feature decision
- unclassified Research Feature
- unclassified Research Evidence
- unmapped discovery candidate
- excluded-only input leaking into UI
- selected Feature missing `userReason`
- rejected Feature missing user-facing reason
- prohibited rejection basis based on input/manual-count burden
- rejected element missing name/reason

### REVIEW

- selected reason too generic/too short
- selected reason lacks concrete statistical/observational basis
- rejected reason too generic/too short
- rejected reason lacks concrete basis
- rejected element reason lacks concrete user-facing basis

## Batch policy

No REVIEW reason is to be rewritten automatically merely to satisfy wording heuristics. No missing Feature/Evidence decision is to be inferred from labels or neighboring machines.

Safe mechanical work is limited to defects whose intended value is already explicitly present in another authoritative field/artifact and can be copied without changing the Selection decision. Everything else remains a human/research-quality blocker.

## Next scan

Cluster all 88 machines by normalized blocker/review reason family, retaining counts and machine IDs. Prioritize exact structural BLOCKED causes before prose REVIEW causes. A batch is authorized only if its repair is deterministic and decision-preserving.


## Fleet-audit interaction

Inspection of `audit-m7-full-fleet-migration.mjs` confirms Selection Quality is evaluated before the downstream M7 proof chain for legacy machines and is the highest-priority primary blocker. For zero-group/no-projection machines, a non-PASS Selection Quality result also overrides formal `NO_EVIDENCE` terminalization.

Therefore the 88-machine population may contain machines with no Evidence migration at all whose terminal status is currently masked by Selection Quality. The clustering must preserve this distinction:

1. Selection Quality non-PASS + Gate0 `NO_EVIDENCE`;
2. Selection Quality non-PASS + Gate0 Evidence/adoption;
3. Selection Quality non-PASS + legacy Evidence migration projection.

The first class is especially important: fixing or formally resolving Selection Quality could immediately move such machines to terminal `NOT_APPLICABLE_OR_EQUIVALENT`, without any Evidence migration.


## Exact fleet split

The current checked-in full-fleet report contains exactly 88 primary `SELECTION_QUALITY_BLOCKED` rows.

By migration disposition:

| Disposition | Machines |
|---|---:|
| `MIGRATION_REQUIRED` | 64 |
| `NOT_APPLICABLE_NO_EVIDENCE` | 19 |
| `BLOCKED_ADOPTION_OUTSIDE_LEGACY_GROUPS` | 5 |
| **Total** | **88** |

By Selection Quality status:

| Status | Machines |
|---|---:|
| `REVIEW` | 71 |
| `FAIL` | 17 |
| **Total** | **88** |

This confirms that **19 machines have no Evidence contract to migrate but are kept out of terminal classification solely because Selection Quality is non-PASS**. These 19 are the highest-value next subcluster to inspect because resolving Selection Quality would not require an Evidence migration.

The 64 migration-required and 5 adoption-outside machines remain separate; their Selection Quality resolution must not be conflated with downstream M7 migration authorization.
