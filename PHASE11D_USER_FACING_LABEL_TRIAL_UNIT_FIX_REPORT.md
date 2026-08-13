# Phase 11D — User-facing labels / Required-trial unit fix

## Real-device findings addressed
- Input section titles exposed internal category identifiers such as `PREDECESSOR`, `SELF_PLAY`, `PRIMARY_*`.
- Selection Summary required-trial units were concatenated as source/internal strings, producing displays such as `約250REG1回` and `約12,703既存MachineData定義`.

## Data-side changes
- Added/filled `uiCategoryLabels` for all current machines so generated UI sections use user-facing Japanese labels.
- Builder now rejects known internal category-title patterns when they would be exposed as UI titles.
- Builder now rejects migration placeholder required-trial units such as `既存MachineData定義` from Selection Summary.
- Eureka and Code Geass migrated placeholder trial units were replaced with explicit observable trial units.
- Removed Eureka pure legacy reference-only inputs that no longer have inference/evidence dependencies.
- Cleared obsolete input mappings from EXCLUDE features because rejected features no longer need runtime input contracts.
- Patch-versioned and republished all 10 prototype MachineData packages; Catalog and Difficulty Catalog versions remain aligned.

## App-side changes
- Required-trial presentation now distinguishes game exposure from event opportunities.
- Examples:
  - `REG1回` + 250 -> `約250回（REG）`
  - `ART初当り対象ゲーム` + 12,703 -> `約12,703G（ART初当り対象）`
  - `共通7枚ベル集計対象ゲーム` + 5,814 -> `約5,814G（共通7枚ベル集計対象）`
- Migration placeholder units are never shown to users.

## Verification
- Data tests: 133 / 133 PASS
- `npm run audit`: 10 machines / 0 warnings
- Selection Policy Migration: PASS 10 / REVIEW 0 / BLOCKED 0
- Selection Summary Readiness: READY 10 / REVIEW 0 / BLOCKED 0
- Catalog / Difficulty Catalog machineDataVersion: all 10 match
- App formatter: standalone TypeScript compile + representative output assertions PASS
- Full app npm test suite was not executed in the container because app dependencies/node_modules are not installed there.
