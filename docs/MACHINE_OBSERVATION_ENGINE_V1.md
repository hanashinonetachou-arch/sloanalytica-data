# Machine Observation Engine Specification v1

## Position in pipeline

Research Engine -> Selection Engine -> **Machine Observation Engine** -> UI Design Engine -> UI Audit Engine -> MachineData -> field test -> USER_VERIFIED_UI_LOCKED.

The Observation Engine answers: **How can the statistical information selected by Selection be obtained or constructed during real play?** It does not decide whether a feature has statistical value.

## Required source coverage

Every v2 file records one status for each source domain:

- `machineMenu` — cabinet menu / play history
- `dataCounter` — store data counter; optional and store-dependent
- `linkedService` — machine-linked services
- `directPlay` — roles, CZ, bonus and other direct play observations
- `endEvent` — end screens, lamps, voices, payout displays
- `seatedState` — information/state visible when sitting down

Statuses: `FOUND`, `CHECKED_NONE`, `UNRESOLVED`, `VERIFIED_ON_MACHINE`.

`UNRESOLVED` does not block the batch. It remains an internal field-verification item and can be exported to CSV.

## Observation methods

A feature may have multiple collection methods. Supported methods are:

- `MANUAL_COUNTER`
- `MENU_READ`
- `DATA_COUNTER_READ`
- `LINKED_SERVICE_READ`
- `DERIVED`
- `VISUAL_EVENT`
- `AUDIO_EVENT`

Use of linked services is the user's choice. A statistically meaningful all-day feature is not rejected merely because some users will not use the linked service.

## Feature mappings

Observation data does not need to exactly equal the Selection feature. The engine records how the required statistic can be constructed:

- `EXACT`
- `DERIVABLE`
- `COMBINABLE`
- `OPTIONAL_SOURCE`
- `INCOMPATIBLE`
- `UNRESOLVED`

Examples: current games minus seated games is `DERIVABLE`; CZ count from the machine menu plus games from a store counter can be `COMBINABLE` when the statistical meaning remains valid.

## Research reopen

If the Observation Engine discovers an observable item that may matter to setting inference but is absent from Research/Selection, it creates a `RESEARCH_REOPEN_REQUIRED` request. This blocks only that machine, not the rest of a ten-machine batch.

## Gate

- `PASS` — ready for UI Design Engine.
- `PASS_WITH_UNRESOLVED` — ready for UI Design Engine, with field-test items retained.
- `RESEARCH_REOPEN_REQUIRED` — return this machine to Research before UI generation.

## Field verification

Items that cannot be resolved publicly are recorded in `fieldVerificationItems` with `WAITING_FOR_MACHINE`. After physical verification they become `VERIFIED_ON_MACHINE`. UI verification is a later, separate step; only after that can a machine become `USER_VERIFIED_UI_LOCKED`.

## Registration metadata

Observation output carries the machine's immutable development-time `provisionalRegistrationId`, nullable future `registrationId`, and `releaseDate`. Range-based operations use provisional IDs until formal IDs are assigned.

## CSV contract

`npm run observation:unresolved:csv` writes `reports/observation-unresolved.csv` by default. `--from-id=N` and `--to-id=N` filter by provisional registration ID. The common columns include provisional/formal IDs, machine ID/name, release date/status, source type, observation/verification ID, status, question, priority, UI impact and notes.

## v1 compatibility

Existing `machine-observation-data-v1` files remain valid. There is no forced bulk migration. A machine moves to v2 when it is next researched/reviewed or when Observation/UI work requires the richer contract.
