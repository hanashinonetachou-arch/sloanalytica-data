# Phase 11C Selection Policy Rollout Report

Date: 2026-08-13

## Result
- Selection Policy Migration: PASS 10 / REVIEW 0 / BLOCKED 0
- Automated tests: 130 / 130 PASS
- Public data audit: 10 machines / 0 warnings
- All 10 published MachineData packages contain `selectionSummary`.
- Catalog and Difficulty Catalog `machineDataVersion` values match for all 10 machines.
- `reference_display` capability remains on 0 machines.

## Migrated machine versions
- L_INITIAL_D_2ND: 0.1.3 (already migrated)
- L_KAGUYA_SAMA_JA: 0.1.1
- L_MUSHOKU_TENSEI_NM: 0.2.4
- L_SMASLO_BAKEMONOGATARI_KH: 0.1.5
- L_TOKYO_GHOUL: 0.2.2
- S_CODE_GEASS_3_CC_FS: 0.1.6
- S_EUREKA_SEVEN_HIEVO_XS: 0.1.3
- S_IM_JUGGLER_EX_TP: 1.0.2
- S_MY_JUGGLER_V_KD: 0.3.3
- S_REVUE_STARLIGHT_CX: 0.1.2

## Generic platform improvements
- Builder preserves `denominatorInputIds` for multinomial trial construction.
- Builder supports approved legacy Evidence contracts copied from already-published MachineData without inventing source facts.
- Builder stores Selection weights in `reliabilityProfile.weight`, matching the app FeatureEngine contract.
- Builder supports `marginal_multinomial` model preservation and `optionalCategoryInputIds`.
- Migration Audit compares effective weight (`reliabilityProfile.weight` first) rather than only a top-level `weight` field.
- Legacy DISPLAY_ONLY Features are eliminated from Selection migration while inputs that are dependencies of adopted Features remain.
- Existing runtime input metadata (observation scope, aggregation behavior, Evidence input options, etc.) was preserved when required for compatibility.

## Safety notes
- Published inference contracts were compared against Builder-regenerated contracts before rollout.
- No machine remained in REVIEW or BLOCKED state before publish.
- Publish CLI audit/rollback protection was used for each of the nine updated machines.
