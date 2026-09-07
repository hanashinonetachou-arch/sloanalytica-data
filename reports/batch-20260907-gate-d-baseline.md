# 20260907 Gate D UI Design / MachineData baseline

- UI Design: generated 10/10 from finalized SelectionData + Machine Observation Data v2
- UI validation: PASS
- Selection linkage: PASS
- Observation linkage strict-v2: PASS
- Semantic UI assertions: PASS
- Four-layer gate: PASS (35 tracked field-verification items may remain)
- MachineData batch construction: PASS
- UI Design -> MachineData materialization: PASS / stable 10/10
- Blank vs observed zero, conditional denominators, suppression/fallback and Evidence separation are retained.
- Hard Evidence sections are kept after ordinary inference sections.
- Five user-confirmed no-linked-service machines do not expose LINKED_SERVICE UX.
- Triple Crown plum remains excluded from UI.
- Jormungand end-screen numeric multinomial conditions on the four non-Evidence categories; four Hard Evidence screens remain Evidence-only.
- Inherited prototype difficulty version-pointer drift was repaired only by syncing existing difficulty-catalog machineDataVersion pointers to catalog package versions: L_BURNING_EXPRESS_ZN 0.1.0 -> 0.1.1, L_PRISM_NANA 0.1.0 -> 0.1.3, and L_TEKKEN_6 0.1.0 -> 0.1.2. No difficulty scores/content or machine definitions were changed, and no difficulty entries were created.
- Difficulty exposure / repository tests / audits: PASS
- Gate E / Formal Publish: NOT RUN
- public main: unchanged
