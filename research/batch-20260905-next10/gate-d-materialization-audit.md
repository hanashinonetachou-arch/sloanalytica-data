# SloAnalytica 2026-09-05 Next10 — Gate D Materialization Audit

Status: MATERIALIZED — CI FINALIZATION IN PROGRESS
Date: 2026-09-05

All ten Gate-B/Gate-C machine candidates now have initial `machines/<machineId>/machine-package.json` materialized on the dedicated research branch. Public main and prototype base remain untouched.

## Materialized packages

1. `L_AZURLANE_THE_ANIMATION_KN`
   - active: AT initial, bonus initial, common bell, cherry, watermelon
   - AT setting-5 source conflict resolved to `1/496.4` using newer nana + current P-WORLD + HAZUSE consensus; isolated older 1geki `1/469.4` not averaged
   - hard evidence: machine-specific end screens; Kaga Battle win back-button 5+/6 with context lock
   - trophy/payout inferred-from-other-KYORAKU semantics intentionally not materialized

2. `L_DRUAGA_NO_TOU_ZA`
   - settings: 1/2/5/6 only
   - active: BIG, REG sharing one normal-game denominator
   - total bonus excluded from simultaneous inference
   - hard evidence: REG BGM `イシターの復活` = 2+

3. `L_SMASLO_TOKYO_REVENGERS_ZF`
   - active: Tokyo Manji RUSH initial, normal-play common bell, middle cherry
   - common bell strictly normal-play only
   - Gate-C middle-cherry condition resolved after complete grouped vector was confirmed: settings 1-3 `1/16384`, 4-5 `1/13107.2`, 6 `1/10922.7`; no interpolation
   - end-screen hard evidence locked to ordinary TMC/AT-end context; ending-fixed gold does not qualify

4. `L_BABEL_BA`
   - active: BIG, REG, weak-cherry conditional bonus hit, strong-cherry conditional bonus hit, scorpion 3rd/6th conditional bonus hit
   - total bonus excluded with BIG+REG
   - scorpion 10th occurrence excluded because 100% all settings
   - condition-pair UI keeps event trials separate from hits

5. `L_SHIN_ONIMUSHA_3_SA`
   - active: Soken RUSH AT initial only
   - common bell remains excluded because publication-grade complete vector was not established
   - hard AT-end / Entertrophy / Oni Bonus special-character / ending voice lower-bound and denial evidence materialized

6. `L_ZENIGATA_5_L2`
   - settings: 2/3/4/5/6 only
   - active: first-hit, non-true-foreshadowing Deka-me direct-hit rate
   - Gate-D denominator correction: Deka-me table is per eligible non-true-foreshadowing normal game, not direct hits per Deka-me opportunity
   - ST Deka-me and true-foreshadowing population excluded
   - hard payout and bonus-end stamp evidence materialized
   - service-gated hidden Nagi voice deferred until exact display/history semantics are verified

7. `L_TOARU_KAGAKU_NO_RAILGUN_2_FV`
   - active: AT initial + CZ total
   - type-specific CZs remain support/reference to avoid aggregate/subset double count
   - hard AT-end and Fujimaru Coin lower-bound evidence materialized

8. `L_ZETTAI_SHOGEKI_FORCE_FH`
   - active: Platonic Time AT initial
   - bonus initial remains support/reference due causal overlap
   - hard special-move, Platonic Bonus end, payout and Dynamite trophy evidence materialized
   - payout condition uses current source values including 1225, not stale 1250 note

9. `L_KAKUMEIKI_VALVRAVE_2_JF`
   - settings: 1/2/4/5/6 only; no setting3
   - active: initial-hit total only
   - BAR direct-hit not active because a safe setting-specific opportunity contract is not fixed
   - ordinary end-screen distribution not active because hall-side customization can alter it
   - hard purple/silver/gold lower-bound screens, +22/+44/+66, AT-end display/photo 6, and 456/555/666 payout evidence materialized

10. `L_NEO_PLANET_SLED`
    - settings: 1/2/4/5/6 only; no setting3
    - active: bonus total initial, explicitly excluding 1G-ren and counting normal-play initial SBB/BB/REG total
    - BIG/REG not simultaneously active
    - Mode-F high-transition remains Gate-B conditional ADOPT but is not materialized as an active feature because current MachineData/UI condition-gating support was not verified; this prevents reset-only values from being applied to ordinary sessions
    - hard 101/301G TOUCH constellations, bonus-end, Kerotto trophy and payout evidence materialized

## Cross-machine locks verified in materialization

- Empty input remains unobserved/not entered.
- Explicit zero remains observed zero when denominator/population is known.
- Missing setting stages are structural and never interpolated.
- Aggregate/subset alternatives are not simultaneously multiplied.
- Conditional hit features use explicit eligible-trials and hits input pairs.
- EvidenceEngine entries contain only hard lower-bound/exact/denial semantics; ordinary weak/strong/parity indications are not converted into hard evidence.
- Linked-service values may only assist acquisition if their field population/reset semantics exactly match the manual contract.

## CI status

Wave-1 head had these successful workflows:
- MachineData Statistical Audit: PASS
- MachineData User-facing Definitions Audit: PASS
- User-verified UX contract audit: PASS

Wave-1 Machine identity consistency failed for a baseline-wide reason: the verifier reported 29 already-cataloged machines missing identity-audit entries, rather than any of the four new Wave-1 package IDs. The failure is preserved and must not be hidden by unrelated prototype/main edits.

A new full-10-machine CI cycle was triggered after final Wave-4 materialization. Gate D is not marked final PASS until the statistical/user-facing/UX audits for the final head are read and any package-specific failures are corrected.

## Gate D exit criteria

- all ten packages present and parseable;
- active feature input/source/settings references consistent;
- statistical/user-facing/UX workflows pass on final head;
- any baseline-only identity failure explicitly isolated from current batch;
- no public-main mutation;
- then mark Gate D PASS and start Gate E automated quality work on the research branch.
