# Selection Policy UI / Reference Input Policy Pilot

## Scope
- Initial D 2nd pilot migration from DISPLAY_ONLY reference input to selected/rejected policy.
- Automatic `selectionSummary` generation from SelectionData.
- App modal presentation for evaluated / selected / rejected Features.
- Settings-page explanation of SloAnalytica selection policy.

## Data changes
- L_INITIAL_D_2ND MachineData v0.1.2.
- Removed `INP_AT_INITIAL_COUNT` from input UI.
- RF_AT_INITIAL is now EXCLUDE with user-facing reason `LB初当りと重複。`.
- Builder emits `selectionSummary` with counts and concise reasons.
- Selection schema accepts `userReason`.
- Publish CLI now derives `requiredCapabilities` from the current package instead of retaining stale capabilities from the previous catalog entry.
- Difficulty Catalog machineDataVersion is checked against catalog machineDataVersion.

## App changes
- `MachineDifficultyModal` shows evaluated count, selected/rejected counts, a compact summary, and two foldouts for details.
- MachineData package type and validator support optional `selectionSummary`.
- Settings page shows `スロアナリカの設定推測について` policy disclosure.
- The user-facing toggle for default display of reference inputs is removed. Legacy DISPLAY_ONLY handling remains internally for backward compatibility with old MachineData.

## Verification
- Data full automated test suite: PASS.
- `npm run audit`: 10 machines, 0 warnings.
- App dependency installation could not complete in the execution environment because required npm tarballs were not cached and network installation timed out.
- Global TypeScript static check found no errors attributable to the changed files after excluding missing dependency/type-package errors.
