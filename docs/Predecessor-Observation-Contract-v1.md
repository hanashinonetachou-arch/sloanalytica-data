# Predecessor Observation Contract v1.0

Date: 2026-09-20
Status: Active specification candidate

## 1. Purpose

This contract defines when data accumulated before the current user sits down may be used as setting-inference Observation in SloAnalytica.

The initial standard scope is intentionally limited to pure A-type machines. Other machine types are not part of routine predecessor-data research and may be added only by explicit machine-specific research when a concrete need is identified.

The purpose of this limitation is to avoid creating unresolved research work across machines whose historical numerator, denominator, trial universe, or state cannot be reconstructed reliably.

## 2. Governing principle

> 着席前データは、純Aタイプでは標準的に活用を検討する。
> 純Aタイプ以外では標準調査を行わず、必要な機種だけ後から個別調査する。

"Not routinely researched" is not UNRESOLVED and is not a defect.

## 3. Standard eligibility

### Pure A-type machines

Pure A-type machines are in the standard scope of predecessor Observation research.

After Selection, inspect only adopted Features for which an accumulated same-day Observation may be reconstructed from data available at seating time.

A predecessor value may be used only when it represents the same statistical quantity required by the adopted Feature. Numerator, denominator, and applicable trial universe must remain semantically compatible with the Feature contract.

Typical candidates include same-day accumulated game count and bonus counts when those quantities match the adopted Feature definitions.

Being a pure A-type machine does not automatically make every historical value valid.

### Other machine types

AT, ART, CZ-based, and other non-pure-A-type machines are outside the standard predecessor Observation research scope.

For these machines:

- do not routinely investigate predecessor-data availability;
- do not create UNRESOLVED solely because predecessor data were not researched;
- do not block Research, Selection, Observation, HighLowDiscrimination, Canonical UI, or MachinePackage for this reason;
- add predecessor-data support only through explicit machine-specific research when a concrete product or inference need is identified.

A later machine-specific exception must demonstrate that the required historical Observation can be reconstructed with sufficient semantic compatibility.

## 4. Research timing

Predecessor Observation research runs only after Selection has determined the adopted Features.

Do not investigate predecessor-data support for rejected Features.

For pure A-type machines, the logical sequence is:

```text
Selection Complete
→ Predecessor Observation Research
→ Observation construction
```

This contract concerns Observation availability. It must not influence Selection Score or Feature adoption.

## 5. Observation sources

Two seating-time sources are distinguished.

### MACHINE_MENU

Data shown by the machine's own menu, history, or built-in information screen.

For pure A-type machines, MACHINE_MENU is a formal machine-specific Observation Source and may be researched by SloAnalytica.

Research should determine only whether values required by adopted Features can be obtained. Do not inventory unrelated menu information.

When confirmed, Observation may use:

```text
source: MACHINE_MENU
```

### DATA_COUNTER

Data shown by a hall/store-installed data counter.

DATA_COUNTER is not treated as a machine-specific guaranteed source because displayed fields, aggregation rules, reset behavior, and definitions may differ by store or equipment.

SloAnalytica does not attempt to research or guarantee every store's data-counter semantics.

DATA_COUNTER input is therefore user-confirmed input.

The application may state which statistical value is required, but the user is responsible for confirming that the displayed counter value represents the same quantity.

When used:

```text
source: DATA_COUNTER
verification: USER_CONFIRMED
```

User responsibility does not mean arbitrary values are statistically acceptable. The entered value must still represent the Observation requested by the adopted Feature.

## 6. Statistical compatibility rule

Predecessor data must not be merged merely because a similar-looking number is available.

It may participate in inference only when the historical value is compatible with the adopted Feature's required statistical meaning.

At minimum, confirm compatibility of the relevant:

- numerator;
- denominator;
- trial universe;
- counting definition.

If the required denominator or trial universe cannot be reconstructed, do not treat an available numerator as a complete historical Observation.

Do not invent conversion factors or correction coefficients for ambiguous data-counter values.

## 7. Combining predecessor and current-session observations

When predecessor and current-session observations represent the same Feature under compatible counting definitions and trial universe, they may be combined as cumulative Observation for inference.

When they are not compatible, keep them separate or exclude the predecessor portion as required by the inference contract.

Predecessor data are Observation, not a prior probability adjustment.

## 8. UI boundary

This contract does not define the final input UI.

It determines only whether a valid predecessor Observation path exists and which source may supply it.

Canonical UI later decides:

- whether a seating-time input is shown;
- input grouping and labels;
- source guidance;
- warnings for DATA_COUNTER;
- how predecessor and current-session values are presented.

Do not create UI merely because a historical value exists.

## 9. Completion rules

For a pure A-type machine, predecessor Observation research is complete when adopted Features have been checked for relevant seating-time Observation paths needed by the product.

For a non-pure-A-type machine, standard predecessor Observation research is NOT_REQUIRED unless a machine-specific exception has explicitly been opened.

NOT_REQUIRED is a completed scope decision. It is not UNRESOLVED.

## 10. Machine-specific exceptions

A non-pure-A-type machine may opt in later when there is a concrete reason to support predecessor data.

Such research must be narrow and machine-specific. It should examine only the adopted Feature(s) for which predecessor support is desired.

Do not generalize one machine's exception into a requirement to research all machines of the same broad type.

## 11. Machine Research Summary

For pure A-type machines, Machine Research Summary may report whether predecessor Observation is supported for adopted Features and identify confirmed source types.

For non-pure-A-type machines without an explicit exception, represent the stage as NOT_REQUIRED rather than UNRESOLVED.

## 12. Initial operational rule

The first implementation target is:

- standard predecessor-data support for pure A-type machines;
- MACHINE_MENU researched as a formal source where relevant;
- DATA_COUNTER accepted only as user-confirmed input whose semantics the user verifies;
- all other machine types excluded from routine predecessor-data research until a specific machine requires it.
