# M7 Research-linked adoption proof scan — 2026-09-19

## Purpose

Follow-up to the adoption-outside-legacy-groups audit. This scan narrows the next migration candidate class to Selection Evidence with explicit Research lineage, without treating that lineage alone as migration authorization.

## Proven constraints

Research-linked item-level Evidence is a stronger lineage state than `legacyContractSource: published_machine_data`, but Research lineage does not by itself prove M7 normalization, Observation mapping, canonical UI propagation, feature-sharing safety, or runtime equivalence.

Two semantic representations have already been observed inside the Research-linked class:

- explicit `allowedSettings` / `deniedSettings`
- `triggerValue` plus source Evidence references

These representations must not be normalized into one contract by convention. Each requires a formal semantic-equivalence rule or a checked-in reconstruction artifact.

## Candidate policy

A Research-linked adoption machine may enter a mechanical migration batch only when all of the following are machine-readable and exact:

1. every adopted Evidence item has explicit Research lineage;
2. Evidence setting semantics can be projected without inference;
3. Observation mapping is formally identified;
4. canonical UI placement/propagation is formally identified;
5. shared Feature/Evidence use is formally proven safe;
6. non-Evidence Selection identity and runtime semantics remain unchanged.

Any missing proof keeps the machine blocked. Labels, names, categories, and apparent setting-floor patterns are diagnostic only.

## Next scan

The next mechanical scan should partition the Research-linked population by exact semantic representation and count how many satisfy each of the six requirements. Only a fully proven partition is eligible for a migration batch.
