# Batch Observation v2 checkpoint 1 — 2026-08-31

Branch: `batch/20260831-persona5-to-bio5`

## Completed

Machine Observation Data v2 has been created for all 10 batch targets:

1. `S_PERSONA5_FR`
2. `S_SUPER_RIO_ACE_CC`
3. `S_BOOWY_SV`
4. `S_BIG_SHIMAUTA_E2_30`
5. `S_WARAU4_KH`
6. `S_BIOHAZARD_RE2_XB`
7. `L_KAMEN_RIDER_DEN_O_UD`
8. `L_SISTER_QUEST_CA`
9. `L_TIDADONDON_PA5`
10. `L_BIOHAZARD5_ZE`

All files use `schemaVersion: machine-observation-data-v2` and were constructed against the current validator contract in `tools/validate-machine-observation-data.mjs` and the current Selection linkage audit.

## Selection -> Observation linkage design

- Persona5: PC first hit = exact direct observation. Watermelon has one logical input with two alternative acquisition paths: direct manual count or MySlot result read; the two paths must never be added together.
- Super Rio Ace: AT first hit = exact direct observation.
- BOOWY: AT first hit = exact direct observation; SET_L panel state is operational Evidence only.
- BIG Shimauta 30: bonus first hit = exact only when both numerator and denominator exclude the chain/continuation region.
- Warau Salesman 4: bonus first hit = exact. CZ entry-success = conditional exact mapping with CZ entries as the denominator; self-success during CZ must not be counted as entry-success.
- Biohazard RE:2: AT first hit = exact. Heart-red replay candidate remains excluded and therefore is deliberately absent from the input/Observation surface.
- Den-O: Den-O BONUS first hit = exact direct observation. Pachilog web support is known, but result-field details remain unresolved and are not guessed.
- Sister Quest: AT first hit and Monster ZONE stock are exact; AT-end screen is one mutually-exclusive visual observation feeding the multinomial feature. SmartTALK is a built-in machine-menu Evidence route, not an external linked service.
- Tidadondon: bonus first hit = exact; BIG-entry 7-segment is Evidence only.
- Smart Biohazard 5: AT first hit = exact. Infection uses the middle-line AT-initial subset as an explicit conditional denominator; diagonal hits are excluded from this feature.

## Red-team / field-verification debt retained

The following items are deliberately left for real-device verification because they depend on actual UI/service behavior rather than public probability tables:

- Persona5: MySlot result-field range and reset boundary.
- BIG Shimauta 30: whether chain-region start/end can be identified consistently enough to maintain the non-chain denominator.
- Warau4: whether entry-time CZ success can be consistently distinguished from self-success during the CZ.
- Biohazard RE:2: figure-collection persistence / reset scope.
- Den-O: exact Pachilog web result fields usable by Selection.
- Sister Quest: SmartTALK history/reset boundary.
- Smart Biohazard 5: reliable pairing of middle-line AT initial hit with Infection entry.

These are represented as `WAITING_FOR_MACHINE` only where physical/service behavior is genuinely needed. Other unresolved source-coverage keys remain `UNRESOLVED`; they are not being misclassified as machine-required.

## Expected gate state before field verification

Because some source coverage and field-verification items remain unresolved, `observation:gate` is expected to report `PASS_WITH_UNRESOLVED` rather than `PASS` for at least part of this batch. No `RESEARCH_REOPEN_REQUIRED` request has been created in this checkpoint.

## Automated validation status

Repository-local commands have not been executed from this GitHub-only environment. The next executable validation set on a checked-out branch is:

- `npm run research:validate`
- `npm run research:gate0`
- `npm run selection:validate`
- `npm run observation:validate`
- `npm run observation:selection:audit -- --strict-v2`
- `npm run observation:gate`

The current GitHub work therefore establishes the 10/10 Observation v2 artifacts and manual linkage review, but does not claim a local validator PASS.