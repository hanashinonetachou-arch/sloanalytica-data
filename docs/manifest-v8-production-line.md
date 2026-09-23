# Manifest v8 production line

Phase 6 promotes the proven Manifest v8 path from a single-machine pilot to the standard machine path.

## Responsibility boundary

Manifest -> Research -> Selection -> Observation -> Evidence -> Canonical UI -> V8 Compiler -> MachinePackage -> Distribution -> Validator -> Renderer -> Runtime -> Engine -> APK/device.

The compiler and app must not reconsider Selection decisions. Existing production MachinePackages are not build inputs, fallback sources, expected values, or semantic oracles.

## Human decisions

Research completeness and interpretation, Selection inclusion/exclusion and dependency decisions, Evidence semantics, and Canonical UI/UX decisions remain reviewable human decisions.

## Deterministic machine path

For MACHINE_ID whose upstream contracts live under repro-v8/MACHINE_ID:

1. `npm run machine:v8 -- MACHINE_ID` builds and validates an upstream-only package.
2. `npm run machine:v8:publish -- MACHINE_ID` additionally publishes it, validates catalog size/SHA/version/URL, and refreshes the registry.
3. `npm run test:v8-production-line` runs cross-machine production-line regression plus the proven Kaiji integration contracts.
4. `Manifest V8 Production Line` is the shared CI entry point. Its workflow_dispatch publish option commits only catalog, registry, and the selected published package.

## Fixed contracts

The line fails closed on missing upstream contracts, machineId mismatch, non-upstream provenance, non-Canonical runtime UI, unresolved/internal Feature display names, invalid SemVer, catalog packageSizeBytes/SHA mismatch, or invalid package URL.

Canonical UI owns nesting and interaction semantics. Observation owns runtime numeric binding including shared denominators. Evidence owns Hard Evidence vs DISPLAY_ONLY and opportunity tracking. Selection owns dependency/suppression and joint-multinomial decisions. Runtime preserves UNOBSERVED distinct from OBSERVED_ZERO.

Machine-specific integration tests are allowed as fixtures/regressions; machine-specific branches in production compiler/runtime code are not.
