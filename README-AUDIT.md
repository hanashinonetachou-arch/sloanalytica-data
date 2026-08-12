# Phase 9.4B-20C — Catalog / Kaguya / Evidence-dominant fixes

- Fixed I'm Juggler EX prototype packageUrl to the prototype-multi-machine raw URL.
- Built `L_KAGUYA_SAMA_JA` MachineData v0.1.0 from existing ResearchData/SelectionData using the generic MachineData Builder.
- Converted Kaguya Evidence into generic `evidenceUi` groups; no machine-specific App code was added.
- Mini Fujiwara costume options explicitly require the 「変身！」 route where applicable.
- Added Kaguya to catalog with `evidence`, `evidence_multi_select`, and `difficulty_display` capabilities.
- Added `EVIDENCE_DOMINANT` Difficulty display data with rejected numeric Features and required trial counts where computable.
- Fixed Numeric Inference Profile so generic `evidenceUi` options count as Hard Evidence.
- Synced Machine Registry: 9 machines included.
- Full npm test: 98/98 PASS.
- Public Data Audit: 9 machines, 0 errors, 0 warnings.
- Machine Registry validation: PASS.
