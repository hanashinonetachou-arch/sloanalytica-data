# Batch 2026-08-31 Final Red Team Checkpoint

## Status

This checkpoint records the current final Web/GitHub-side review state after batch publication, Red Team corrections, field verification, and the consolidated 10-machine real-device UI smoke pass.

- Active field-only blockers for adopted inference/UI: **0**.
- Deferred supplemental field debt: **3**.
- Consolidated 10-machine real-device UI smoke test: **PASS (user quick pass; no obvious issues found)**.
- PR #148 remains Draft pending an intentional merge decision; the quick smoke pass must not be misrepresented as exhaustive per-control verification.

## Registration / publication state

- Batch publish APPLY completed for all 10 machines.
- Catalog entries are available at MachineData version 0.1.0 and Difficulty entries are SCORED.
- provisionalRegistrationId allocation is contiguous:
  - 181 L_BIOHAZARD5_ZE
  - 182 L_TIDADONDON_PA5
  - 183 L_SISTER_QUEST_CA
  - 184 L_KAMEN_RIDER_DEN_O_UD
  - 185 S_BIOHAZARD_RE2_XB
  - 186 S_WARAU4_KH
  - 187 S_BIG_SHIMAUTA_E2_30
  - 188 S_BOOWY_SV
  - 189 S_SUPER_RIO_ACE_CC
  - 190 S_PERSONA5_FR
- Machine Identity classification is complete for 190 production machines with one explicit test-only exclusion.
- The MachineData regeneration path preserves canonical `introductionDate`, `machineType`, and `gameType` via `machine-identity-metadata.json`; regression coverage is in place.

## Final Red Team / field conclusions

### パチスロペルソナ5

- The selected published 1/127.5 through 1/111.0 candidate is `PC＋AT 初当り合算`, not PC-only.
- AT first hit is a subset and remains excluded from independent likelihood multiplication.
- Red/purple PC ending cues are delayed conditional Hard Evidence only when revival denial and the next-PC AT non-hit condition are also confirmed.
- Direct-AT setting values are public but excluded because the required internal-state-specific game denominators are not safely observable.
- MySlot result scope/reset boundary remains deferred LOW debt and is not assumed.

### スーパーリオエース

- AT first hit remains primary.
- Bonus first hit and rare-role AT-draw candidates remain excluded under the finalized dependency/observation policy.
- Current スロプラNEXT Rio support for the separate 2026 machine is not projected onto the 2022 original.

### パチスロ BOØWY

- AT first hit remains the selected numeric Feature.
- Hard end-event Evidence and SET_L operational handling remain valid.
- SET_L is not an inference hypothesis.

### S BIG島唄30

- Non-chain bonus first hit remains selected.
- Real-device verification established **BIG後32G** as the chain region boundary used to exclude chain games from the denominator.
- The former HIGH field blocker is resolved.

### S笑ゥせぇるすまん4

- Bonus first hit remains primary.
- Real-device verification established that a CZ already successful at 審判ノ刻 entry cannot be reliably distinguished from self-success during CZ play.
- The entry-time immediate-success Feature is therefore EXCLUDE and its dedicated UI input surface has been removed.

### パチスロ バイオハザード RE:2

- AT first hit + Figure Evidence remain valid.
- Real-device verification confirms Figure Collection survives power OFF/ON and clears on setting change/reset.

### L 仮面ライダー電王

- Bonus first hit remains selected.
- `manufacturer: 京楽` is retained for repository convention consistency while public legal-manufacturer material may identify SUN SUN SUN.
- Official ぱちログweb support is confirmed; exact machine-specific result fields remain deferred MEDIUM debt and are not promoted to inference inputs.

### Sister Quest

- AT first hit remains primary.
- Monster ZONE stock and AT-ending multinomial remain valid support Features.
- SmartTALK is built-in machine-menu functionality, not an external linked-account service.
- SmartTALK history/reset persistence remains deferred LOW debt.

### てぃだどんどん

- Bonus first hit and BIG-entry 7-segment Evidence remain valid and do not depend on unresolved service behavior.

### スマスロ バイオハザード5

- AT first hit remains primary.
- Infection is used only as the conditional middle-line AT-initial-hit composition.
- Real-device verification confirms middle-line/diagonal AT initial symbol hits can be distinguished when watched and Infection entry/non-entry can be paired with the corresponding hit.
- The conditional Feature remains adopted.

## SET_L policy

- BOØWY, BIG島唄30, and 笑ゥ4 retain SET_L in `machine.settings` for identity/operational handling.
- `machine.inferenceSettings` explicitly excludes SET_L.
- No SET_L numeric probabilities are invented.

## Deferred field-only debt

The remaining three items are intentionally deferred and are **not blockers for the current batch**:

1. MEDIUM — L 仮面ライダー電王 — exact ぱちログweb machine-specific result fields.
2. LOW — パチスロペルソナ5 — MySlot result range/reset boundary.
3. LOW — Sister Quest — SmartTALK history retention/reset boundary.

These routes remain unresolved and must not be treated as verified or used as inference inputs until later field verification.

## Real-device UI smoke pass

A dedicated App test branch and isolated 10-machine catalog were used so the Data Draft PR did not need to be merged for device testing.

The initial device-test delivery path exposed two infrastructure issues that were corrected during the pass:

- GitHub Pages deployment does not publish arbitrary `device-test/**` paths from the prototype source.
- `vite.config.ts` hard-coded the prototype catalog URL, so `.env.prototype` overrides were ineffective.

The App test branch was corrected to use the isolated batch catalog at build time. After rebuilding and syncing Android, all 10 machines appeared in the catalog.

The user then performed a quick cross-machine visual/UI pass and reported no obvious issues. Record this as **10/10 real-device UI smoke PASS**, with the explicit limitation that it was a quick smoke pass rather than exhaustive per-control validation.

## Merge gate

- Web-solvable Red Team corrections: complete.
- Active field-only blockers for adopted inference/UI: 0.
- Remaining field debt: 3 intentionally deferred supplemental routes.
- 10-machine real-device UI smoke pass: PASS.
- No device finding currently requires reopening Selection / Observation / UI.
- PR #148 remains Draft until the merge is intentionally authorized; do not describe the quick smoke pass as a full exhaustive UI audit.
