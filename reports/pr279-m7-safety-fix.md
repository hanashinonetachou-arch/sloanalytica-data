# PR279 M7 safety fix

The generic compiler no longer supplies semantic defaults. It accepts setting-floor, normalization, Observation, canonical UI, and Feature-sharing semantics only from a machine-specific reviewed specification, cross-checks that specification against Research, Selection, Observation, and canonical UI, and otherwise reports `BLOCKED_INFORMATION_GAP`.

`migration-specs/evidence-contract-m7/L_HANABI_KM.json` is the reviewed proof input for the already-approved Hanabi pilot. Machines without a specification, including the negative pilot, remain blocked. The Hanabi runtime projection is unchanged.

Gate0 still recognizes v2 items as upstream adoption data, but a v2 version marker or self-declared fields do not prove cross-layer gates. `materializerRoute`, `generatedPublishedSeparation`, `evidenceOptionSemantics`, and `sharedFeatureEvidence` remain unresolved without independent evidence. `evidencePropagation` applies the existing canonical stable-ID linkage rule and therefore fails when that linkage is absent. Legacy behavior is covered by an explicit regression and remains unchanged.

## V2 Gate proof status

| Gate | Result | Proof |
|---|---|---|
| materializerRoute | UNRESOLVED | A version marker does not prove which production route generated the package. |
| generatedPublishedSeparation | UNRESOLVED | Neither the contract nor its fields prove artifact separation. |
| evidenceOptionSemantics | UNRESOLVED | Selection declarations are not an independent comparison with canonical UI and published runtime semantics. |
| evidencePropagation | FAIL when canonical stable-ID linkage is absent | The existing propagation test requires Selection Evidence IDs to be present in canonical UI and the package; v2 self-declarations are not substituted. |
| sharedFeatureEvidence | UNRESOLVED | `featureSharing` is a Selection declaration, not independent proof that no implicit sharing exists. |

Hanabi legacy/new builds remain byte-identical with one Evidence, input `INP_EVI_HANABI_REG_END`, stored value `PEACE_2PLUS`, and default `[]`. No Research, adoption, Observation, UI, published MachineData, catalog, App, or other machine was changed.
