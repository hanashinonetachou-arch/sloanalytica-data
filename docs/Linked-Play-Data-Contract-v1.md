# Linked Play Data Contract v1.0

Date: 2026-09-20
Status: Active specification candidate

## 1. Purpose

This contract defines the independent research stage for real-machine linked-play services used by SloAnalytica.

Linked-play research does not discover or select setting-inference Features. Its only responsibilities are:

1. determine whether the target machine is listed as supported by the manufacturer's official linked-play service; and
2. after Selection is complete, determine whether the linked-play service can provide the observations required by adopted Numeric Features or Evidence.

Do not build an exhaustive inventory of every value exposed by the service.

## 2. Pipeline position and start condition

Run this contract only after Selection Complete.

```text
Research
→ Data Completeness
→ Denominator / Trial Universe
→ Exposure
→ Dependency
→ Selection
→ Linked Play Data Research
→ Observation
→ HighLowDiscrimination
→ Canonical UI
→ MachinePackage
→ Machine Research Summary
```

Linked Play Data Research is an independent stage between Selection and Observation.

It must not be used to decide whether a candidate Feature is statistically useful. It must not block Research Complete or Selection Complete.

## 3. Scope

The research target is limited to:

- existence of linked-play support for the target machine; and
- support for observations required by already-adopted Features / Evidence.

Out of scope:

- exhaustive service capability inventories;
- collection of unrelated statistics;
- service lifecycle / termination tracking;
- searching indefinitely for an unlisted or hypothetical service;
- using linked-play availability as a Selection criterion.

## 4. Machine-level status

```text
linkedPlayData:
  status: AVAILABLE | NOT_AVAILABLE | UNRESOLVED
  serviceName: <optional string>
```

### AVAILABLE

The target machine is listed in the manufacturer's official linked-play service supported-machine information.

### NOT_AVAILABLE

The target machine is not listed in the manufacturer's official linked-play service supported-machine information.

This means only that the machine was not confirmed as supported by the prescribed official source. It is not a claim that nonexistence has been proven universally.

NOT_AVAILABLE is a normal completed research result, not a blocker or deficiency.

### UNRESOLVED

Use only when the prescribed official supported-machine information cannot be checked or the target machine cannot be identified reliably in it.

Do not use UNRESOLVED merely because additional searches might conceivably find another service.

## 5. Authoritative source and stop rule

For existence determination, the authoritative source is only:

> the manufacturer's official linked-play service supported-machine information.

Decision rule:

```text
target machine listed
  → AVAILABLE

target machine not listed
  → NOT_AVAILABLE
  → stop existence research

official supported-machine information cannot be checked
or machine identity cannot be resolved
  → UNRESOLVED
```

When NOT_AVAILABLE is reached, do not perform additional negative searches using search engines, third-party sites, QR keywords, app keywords, or speculative service names.

The purpose of this stop rule is to prevent unbounded research attempting to prove that a nonexistent linked-play function does not exist.

## 6. Research after AVAILABLE

Only when status is AVAILABLE, inspect whether the linked-play service provides observations required by adopted Features / Evidence.

Research only what the adopted set requires.

Examples:

- numerator required by an adopted Numeric Feature;
- denominator required by an adopted Numeric Feature;
- an adopted Evidence observation.

Do not enumerate unrelated values merely because the service exposes them.

Partial support is valid. For example, a numerator may be available from linked-play data while its denominator must be observed by another method.

## 7. Handoff to Observation

Linked-play data is an Observation Source, not a separate denominator family or inference model.

When usable, Observation may reference:

```text
source: LINKED_PLAY_DATA
```

Example:

```text
numerator:
  source: LINKED_PLAY_DATA
  quality: EXACT

denominator:
  source: LINKED_PLAY_DATA
  quality: EXACT
```

A Feature may mix sources:

```text
numerator:
  source: LINKED_PLAY_DATA
  quality: EXACT

denominator:
  source: MANUAL_COUNT
  quality: EXACT
```

Evidence may likewise use LINKED_PLAY_DATA when the adopted Evidence can be observed through the linked-play service.

Do not duplicate derived Feature-support counts in the machine-level linkedPlayData object. Coverage should be computed from Observation data.

## 8. Completion and blocking rules

Linked Play Data Research is complete when:

- machine-level status has been determined under the official-source rule; and
- if AVAILABLE, the linked-play usability of observations required by adopted Features / Evidence has been determined sufficiently for Observation construction.

NOT_AVAILABLE completes this stage immediately.

UNRESOLVED does not retroactively invalidate Research Complete or Selection Complete.

An unresolved linked-play question may block only the Observation item whose completion actually depends on that answer. Unrelated Features and stages must continue.

## 9. Machine Research Summary

Machine Research Summary should expose at minimum:

```text
実機連動: <service name> | なし | 未確認
```

When AVAILABLE, linked-play coverage of adopted Features / Evidence may be derived from Observation data for the summary.

Do not store that derived coverage redundantly in linkedPlayData.

## 10. Governing principle

> 実機連動機能は設定推測要素を探すための情報源ではない。
> Selectionで採用された設定推測要素を、実戦でどう観測できるかを確認する独立工程である。

The contract therefore runs after Selection and before Observation, uses the manufacturer's official linked-service supported-machine information as the sole existence check, and stops immediately when the target machine is not listed.
