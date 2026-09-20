# Runtime MachineData Adapter Gap — 2026-09-20

## Result
The new research pipeline is complete through MachinePackage, but the current runtime builder cannot consume the new artifacts directly.

## Confirmed incompatibilities
1. Current build-machine-data.mjs requires ResearchData features with researchFeatureId, candidateModel, settingValues/settingDistributions and sourceRefs.
2. Current SelectionData requires runtime inputs plus adoptionCategory and input bindings (numeratorInputId / denominatorInputId / categoryInputIds).
3. The new Selection artifacts intentionally store Selection decisions as disposition/scoreClass and do not yet encode runtime input bindings.
4. Current runtime Evidence materialization expects selection-evidence-v2 (or legacy evidenceUi/evidence) contracts; the new pipeline stores Evidence candidates and Canonical UI separately.
5. Current builder auto-creates UI sections from input categories. It does not consume canonical-ui.json, so publishing through it now would lose the Observation-Context Evidence UI that was just designed.
6. Current publish-machine-data.mjs itself is reusable once a runtime-compatible package has been generated and approved.

## Required adapter
Add a new adapter/build step:
research-data + selection-data + observation-data + canonical-ui
-> runtime-compatible builder input/package
-> existing approve/publish flow.

The adapter must:
- preserve Selection decisions without re-selecting;
- translate Observation denominators to runtime input bindings;
- translate multinomial observations correctly;
- compile Evidence candidates into selection-evidence-v2;
- materialize Canonical UI sections from canonical-ui.json instead of generic category titles;
- fail closed on UNKNOWN exposure or unresolved adopted observations;
- preserve existing publish SHA/audit/rollback safety.

## Pilot acceptance set
- L_GOBLIN_SLAYER_RD
- L_LOVEJOU3_M4
- L_SMASLO_KAIJI_KYOEN_FJ

Do not publish these three until the adapter passes package validation and the generated UI matches canonical-ui.json.
