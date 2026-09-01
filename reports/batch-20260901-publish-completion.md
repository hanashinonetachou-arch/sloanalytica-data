# SloAnalytica 2026-09-01 Batch — Publish Completion

Status: **PASS_WITH_TRACKED_OBSERVATION_DEBT**

## Formal standards
- Core Policy v1.7
- Research / Selection / Observation Manifest v6.9
- MachineData / UX Construction Manifest v6.9

## Dependency resolution
PR #148 / batch/20260831-persona5-to-bio5 was integrated before this Publish. Integration commit: `915c6c1904021ad27aa494fda5b7861e3014cec3`. The normalized stacked-base head used for this batch is `9b7ab872f0328b1b58f9cc57497c4313213c931a`.

## Formal Publish result
- Workflow: `33485719583` — SUCCESS
- Published work-product HEAD: `7161e96acd628219c36e8147ebb2801ddafd12d0`
- Batch Publish APPLY: PASS 10 / 10
- Catalog registration: PASS 10 / 10, status=available
- Production provisionalRegistrationId: 192–201 in the approved machine order
- Difficulty/catalog machineDataVersion linkage: PASS 10 / 10
- Registry validation: PASS, warnings 0
- Public-data audit: PASS, 201 machines, warnings 0
- User-facing service-name audit: PASS
- Repository regression: 415 / 415 PASS
- Publish mutation allowlist: catalog.json / difficulty-catalog.json / machine-registry.json only

## Strict Publish findings repaired before publication
The initial APPLY was safely rolled back by the batch pipeline when strict public-data audit detected a likelihood-domain mismatch for Amazing Live SET_L and rounded multinomial sums for Magia Record. The audit was not relaxed. Amazing Live now retains SET_L for machine identity/operational semantics while excluding SET_L from numeric inferenceSettings where the adopted Bonus-first-hit likelihood has no SET_L probability. Magia Record uses the existing bounded rounded-category normalization contract for the three affected public multinomial tables. Both affected MachineData packages were rebuilt and the repository regression passed.

A second APPLY was intentionally stopped before commit by the custom provisional-ID guard because normal publish order would have reversed IDs 192–201. The final Publish used reverse insertion order so the final newest-first catalog order preserves the approved mapping exactly.

## Approved ID mapping
192 L_MAGIA_RECORD_RN
193 L_GODZILLA_NS
194 L_USHIO_TORA_HAKUMEN_VH
195 L_AMAZING_LIVE_PD
196 L_YOSHIMUNE_SC2
197 L_MAHJONG_MONOGATARI_S2
198 L_IDOLMASTER_MILLION_LIVE_HC
199 L_YOUJITSU_DE
200 L_MIDORIDON_VIVA_REVIVAL_FY
201 L_GUNDAM_SEED_G

## Semantic locks
All Gate E semantic locks remain active: overlap suppression, conditional/opportunity denominators, reset-only population handling, Evidence/tendency separation, EXCLUDE-only input exclusion, empty-vs-zero semantics, derived/manual separation and predecessor/self interval separation were not relaxed by Publish.

## Remaining Observation / field-verification debt
The following remain unresolved and are not promoted to FOUND by automated PASS: hall-specific DATA_COUNTER fields/semantics; SEATED_START snapshot/predecessor alignment; Godzilla PUSH current-day-history exact numeric fields; Amazing Live Bonus-first-hit boundary/chain exclusion/obtainable display; linked-service/QR inventory for Godzilla, Ushio, Amazing Live, Yoshimune, Mahjong and Gundam SEED. All adopted Features still retain direct/manual Observation routes.

## Next stage
**Publish complete → Real-device Verification / next Gate.** Stop at this checkpoint; do not enter the next Gate automatically.
