# Machine Metadata ID Policy

## Purpose

SloAnalytica uses a development-time provisional ID to make range-based audits, CSV exports, and batch operations easy to request and reproduce.

## Fields

### `provisionalRegistrationId`

- Positive integer.
- Development-time **provisional registration ID** only.
- Assigned in research/registration order.
- Existing machines are initially backfilled from `catalog.json` `addedAt` order.
- Once assigned, it MUST NOT change because of MachineData rebuild, republish, catalog sorting, UI audit, or deletion of another machine.
- Deleted IDs are not reused.
- It is valid to use this ID for commands such as "audit provisional IDs 1 through 50".
- This is not the final public/official registration ID.

### `registrationId`

- Positive integer or `null`.
- `null` during the current research-expansion phase.
- A final registration ID will be assigned only after the target active/recent machine universe has been researched sufficiently.
- Final assignment MUST NOT overwrite or erase `provisionalRegistrationId`.

### `releaseDate`

- `YYYY-MM-DD` or `null`.
- Means the first date the machine actually began installation/operation in Japanese pachinko halls (hall introduction/start date), not announcement date, certification date, exhibition date, or research date.
- If reliable public evidence is insufficient, keep `null` and use `releaseDateStatus: "UNRESOLVED"`.

### `releaseDateStatus`

- `VERIFIED`: a reliable source supports `releaseDate`.
- `UNRESOLVED`: date has not yet been verified. This does not block Research/Selection/MachineData generation.

## Source of truth

`machine-registry.json` is the source of truth for these management fields. Generated catalogs, CSV reports, Observation reports, and UI Audit reports may copy them, but must not independently assign or renumber them.

## Future CSV / audit contract

Observation and UI audit exports should include at minimum:

- `provisionalRegistrationId`
- `registrationId`
- `machineId`
- `displayName`
- `releaseDate`
- `releaseDateStatus`

Range selection uses `provisionalRegistrationId` until final `registrationId` assignment is explicitly approved.
