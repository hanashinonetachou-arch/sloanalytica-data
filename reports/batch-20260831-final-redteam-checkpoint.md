# Batch 2026-08-31 Final Red Team Checkpoint

## Status

This checkpoint records the final Web/GitHub-side review state after batch publish generation and before the remaining field/device verification bundle. PR #148 must remain Draft until the field-only checks and resulting real-device/UI lock are intentionally completed.

## Registration / publication state

- Batch publish APPLY completed for all 10 machines.
- Catalog entries are available at MachineData version 0.1.0 and Difficulty entries are SCORED.
- Formal provisionalRegistrationId allocation completed as one contiguous registry sequence:
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
- Machine Identity classification is complete for 190 production machines with one explicit test-only machine excluded.
- Generated MachineData was refreshed after the final Persona5 source-layer correction before this checkpoint commit.
- A regeneration-order defect was found and fixed: rebuilding a published MachineData package could previously drop the formal `introductionDate`, `machineType`, and `gameType` fields that had been applied after publication. `machine-pipeline.mjs` now merges the canonical entry from `machine-identity-metadata.json` into each generated package before writing/syncing it. Pre-publication machines without an identity-metadata entry remain buildable. A regression test locks both behaviors.

## Red Team conclusions

### パチスロペルソナ5

- Corrected a semantic defect in the initial-hit candidate: the published 1/127.5 through 1/111.0 values are PERSONA CHANCE + AT combined initial-hit rates, not PERSONA CHANCE-only rates.
- Research, Selection, Observation, UI Design, and generated MachineData now use `PC＋AT 初当り合算` consistently.
- AT first hit is a subset of that selected combined observation and is therefore not independently multiplied into the likelihood.
- PC ending-screen red/purple cues were decomposed instead of being discarded as an undifferentiated hint:
  - red + revival denied + next PC does not hit AT => setting 2 or higher;
  - purple + revival denied + next PC does not hit AT => setting 4 or higher.
- Color appearance alone is explicitly not Hard Evidence.
- Direct-AT setting values are publicly known. They remain excluded from numeric inference because low-state and high/super-high probabilities require separate internal-state game denominators that cannot be safely and exactly observed during normal play. The exclusion is not based on missing public numbers.
- Remaining field-only item is limited to MySlot result scope/reset boundary.

### スーパーリオエース

- AT first hit remains the primary numeric Feature.
- Bonus first hit is intentionally not multiplied alongside AT first hit because it gives weaker incremental separation within the same outcome process.
- Rare-role AT-draw candidates remain excluded because a defensible practical observation contract was not established.
- The current スロプラNEXT Rio support applies to the separate 2026 スマスロスーパーリオエース2 and is not projected onto the original 2022 machine.

### Sister Quest

- AT first hit remains primary.
- CZ first hit is not independently combined with AT first hit because of causal/downstream overlap.
- Monster ZONE stock remains a conditional support Feature.
- AT-ending screen is retained as the full multinomial observation with explicit bounded normalization for published rounding only.
- SmartTALK is a built-in machine-menu function rather than an external linked-account service; only history/reset persistence remains field-only.

### スマスロ バイオハザード5

- AT first hit remains primary.
- Panic Zone / total CZ rates are not independently stacked with AT first hit.
- Infection entry is used only as the conditional middle-line AT-initial-hit composition.
- Total Infection rate is not separately multiplied because it would reuse the same starting observation and mix the diagonal component.
- Practical middle-line/diagonal classification and pairing remains field-only.

### S笑ゥせぇるすまん4

- Bonus first hit remains primary.
- Return-inclusive appearance probability is not separately multiplied.
- 審判ノ刻 entry-time immediate-success draw remains conditional support rather than a second copy of CZ/bonus outcome information.
- Practical discrimination of entry-time success versus self-success remains field-only.

### Setting L machines

- パチスロ BOØWY, S BIG島唄30, and S笑ゥせぇるすまん4 retain SET_L in `machine.settings` for identity/operational handling.
- `machine.inferenceSettings` explicitly excludes SET_L.
- No SET_L numeric probabilities are invented or synthesized.
- SET_L-only visual/operational cues remain Evidence/operational information and must not appear as an ordinary posterior hypothesis.

### L 仮面ライダー電王 manufacturer convention

- Public material can distinguish the 京楽 brand from the legal manufacturing entity SUN SUN SUN.
- The current SloAnalytica catalog convention already uses 京楽 / 京楽産業． for multiple machines in this manufacturer family, including other recent KYORAKU-branded slots.
- Therefore `manufacturer: 京楽` is retained for Den-O for repository consistency; this does not assert that SUN SUN SUN is not the legal manufacturing entity.
- Official ぱちログweb support is confirmed, while the exact machine-specific result fields remain field-only.

### Other batch machines

- パチスロ バイオハザード RE:2: AT first hit + Figure Evidence remain valid; Figure Collection surface is publicly confirmed and only persistence/reset scope remains field-only.
- S BIG島唄30: non-chain bonus first hit remains selected; reliable operational identification of the chain-region boundary is still the highest-priority field check.
- パチスロ BOØWY: adopted AT first hit and hard end-event Evidence do not depend on unresolved machine-menu/service behavior.
- てぃだどんどん: adopted bonus first hit and BIG-entry 7-segment Evidence do not depend on unresolved machine-menu/service behavior.

## Remaining field-only verification bundle

Seven items remain and should be verified as one consolidated real-device pass rather than piecemeal:

1. HIGH — S BIG島唄30 — chain-region start/end boundary.
2. MEDIUM — S笑ゥせぇるすまん4 — 審判ノ刻 entry-success versus self-success identification.
3. MEDIUM — L 仮面ライダー電王 — actual ぱちログweb machine-specific result fields.
4. MEDIUM — スマスロ バイオハザード5 — middle-line/diagonal AT-initial-hit classification and Infection pairing.
5. LOW — パチスロペルソナ5 — MySlot result range/reset boundary.
6. LOW — Sister Quest — SmartTALK history retention/reset boundary.
7. LOW — パチスロ バイオハザード RE:2 — Figure Collection persistence/reset scope.

## Merge gate

- Web-solvable Red Team corrections identified in this pass have been applied.
- The MachineData regeneration path now preserves formal Machine Identity instead of requiring a manual post-generation identity re-apply.
- This checkpoint does not authorize merge.
- Keep PR #148 Draft until the seven field-only checks are resolved/reclassified, the generated artifacts are refreshed if any finding changes Selection/Observation/UI, CI is green on the stable final head, and the user-verified UI lock is completed.
