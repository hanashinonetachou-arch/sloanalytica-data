# 2026-09-03 Next 10-machine Batch — Observation v2 / Gate C Pass 1

Status: IN PROGRESS
Prerequisite: Gate B PASS (`SELECTION_GATE_B_FINAL.md`)
Policy: map active Selection/Evidence to real acquisition routes; no guessed counters, no cross-route denominator synthesis.

## Batch-wide Observation contracts

- `blank` = not observed / unavailable. `0` = observed and zero.
- One physical observation should have one input surface even if it supports both Feature and Evidence semantics.
- A linked service may be `FOUND` while an exact machine-specific field is still `UNRESOLVED`; generic service capability is never enough to invent a counter.
- `CHECKED_NONE` is final for the verified absence of a linked service or machine menu and is not Observation debt.
- A cabinet display / data counter / machine menu / direct manual count / linked service are separate acquisition methods until equivalence is proven.
- Numeric denominators must state what one trial means in user-facing Japanese.

## 211 `L_IZA_BANCHO_SB8` — いざ！番長

### Active numeric observations

1. `AT初当り`
   - numerator: adopted AT initial-hit events under the published definition.
   - denominator: published normal-game trial universe; exact UI wording must avoid vague `ゲーム数` if exclusions exist.
   - acquisition candidates: direct/manual + seat-visible history where semantically equivalent; machine-menu route remains to verify.

2. `共通ベルA`
   - numerator: common bell A occurrences.
   - denominator: games eligible under the published small-role probability.
   - direct/manual route: visually identifiable as the published common-bell-A stop/presentation, including the published qualifying navigation/presentation cases.
   - Daitomo route: public analysis explicitly states Daitomo can automatically count common bell A and weak cherry / calculate their occurrence rate.
   - Observation requirement: Daitomo numerator and denominator must be taken from the same Daitomo play-data universe unless equivalence to manual total games is proven.

3. `直撃BIG`
   - status: ACTIVE-CONDITIONAL pending composition check from Gate B.
   - Observation red flag: verify whether the published AT initial-hit numerator already contains the same direct-BIG event. If included, do not create a second numeric input; downgrade this path to REFERENCE.

### Evidence
- end screens / payout displays / trophy / lower-bound / exact-setting patterns: map one presentation event to one Evidence input surface.

### Linked service
- ダイトモ: `FOUND`.
- verified machine-specific field: common-bell-A / weak-cherry automatic small-role counting or occurrence-rate calculation.
- other exact fields: `UNRESOLVED`, non-blocking unless needed by an active Selection feature.

## 212 `L_ZETTAI_SHOGEKI_PLATONIC_HEART_TK`

### Active numeric observations
- real bonus count / eligible game denominator.
- AT initial-hit count / exact published normal-game denominator.

### Reference only
- CZ and role→high-state/state-dependent numeric families are not default inputs in this batch.

### Evidence
- Nami trophy and published setting-negation / lower-bound / confirmed-setting presentations.
- one presentation = one Evidence input; do not duplicate the same occurrence across generic trophy and exact-setting sections.

### Service/menu
- manufacturer-linked service: `CHECKED_NONE`.
- machine-menu existence: still separate Observation debt unless verified; direct/manual paths remain valid.

## 213 `L_WATASHI_NO_SHIAWASE_NA_KEKKON_PN`

### Active numeric observations
- bonus initial hit.
- AT initial hit.

Exact denominator semantics must follow the source definition for each headline rate; no automatic use of eSLOT+ `ゲーム数` is allowed until equivalence is established.

### Evidence
- わた婚メドレー background / character presentation.
- AT-end Konami-command presentation.
- Aristo trophy.

### Linked service
- eSLOT+: `FOUND`.
- generic official service capability: game count / bonus count and other play data.
- machine-specific field list for this title: `UNRESOLVED`.
- Gate C handling: keep the active numeric fields manually observable by default; do not expose an `eSLOT+から入力` path until exact fields are verified.

## 214 `LB_TRIPLE_CROWN_SF4` — LBトリプルクラウン

### Active numeric observations
- BIG count.
- REG count.
- cherry count.
- plum count.

### Denominator/acquisition rules
- BIG/REG: use the same verified game universe as the published probabilities.
- cherry/plum: direct/manual counting is valid only with a matching game denominator.
- `ドラマチックスコア`: seat-visible cabinet display may aid small-role/bonus-history observation, but its history window is not a denominator unless independently verified.

### Explicit absence
- manufacturer-linked service: `CHECKED_NONE`.
- machine menu: `CHECKED_NONE` by user real-machine verification.

### Evidence
- BIG/REG indication patterns including REG-end LED setting-confirmation families.

No UI path should imply a machine menu exists.

## 215 `LB_MATADOR_3_TT` — マタドールⅢ

### Active numeric observations
- BB count.
- RB count.

### Reference only
- BT one-coin role is not a default numeric input. If shown in machine explanation, state that the relevant denominator is BT games, not total games.

### Explicit absence
- manufacturer-linked service: `CHECKED_NONE`.
- machine menu: `CHECKED_NONE` by user real-machine verification.

### Evidence
- adjustment-time Condor lamp.
- bonus-end panel flash.

No UI path should imply a machine menu exists.

## 216 `L_TENSEI_SHITARA_KEN_DESHITA_GT`

### Active numeric observation
- AT initial hit only.

CZ / bonus initial hit are not separate numeric inputs in this batch because Gate B selected AT as the representative dependency-safe family.

### Reference only
- state-qualified weak-chance-role→bonus and mode/prescribed-game candidates.

### Evidence
- bonus / AT / ending setting-hint and confirmed-setting presentations.

### Linked service
- eSLOT+: `FOUND`.
- generic official service capability confirmed, exact machine-specific fields: `UNRESOLVED`.
- do not create an automatic counter import/input path until machine-specific field mapping is proven.

## 217 `L_DARLING_IN_THE_FRANXX_SA`

### Active numeric observation
- bonus initial hit.

### Reference only
- bonus-high initial, combined CZ, Connect Chance level/success, Franxx-high transition families.

### Evidence
- payout display, bonus-high end screen, Nami trophy, ending evidence.

### Service
- manufacturer-linked service: `CHECKED_NONE`.

Machine-menu existence remains separate debt unless verified.

## 218 `L_SAKI_CHOJO_KESSEN_YR`

### Active numeric observation
- AT initial hit.

### Reference only
- CZ initial hit and conditional cycle/rival-mode/CZ-through/清澄トライアル families.

### Evidence
- AT-end screen.
- ending 和-lamp categories.
- payout / confirmed-setting presentations.

### Observation routes
- manufacturer-linked service: `CHECKED_NONE`.
- public analysis reports a machine-menu route for recovery of the previous AT-end screen.
- this menu route is Evidence recovery only; it does not define a numeric denominator.

## 219 `S_KONOSUBA_ZR` — パチスロこの素晴らしい世界に祝福を！

### Active numeric observation
- AT initial hit.

### Reference only
- emergency-quest opponent distribution, quest-rank success, bath-zone initial points/entry, bonus 7-alignment, hidden-mode transition.

### Evidence
- bonus-end screen.
- AT-end PUSH voice.
- AT navigation voice.
- debt-line presentation.
- special payout display.
- illustration evidence.
- Sammy trophy.

### Linked service
- マイスロ: `FOUND`.
- exact machine-specific counters relevant to active numeric Selection: `UNRESOLVED`.
- do not guess hidden counters or unlock levels. If unavailable during a session, leave the corresponding optional observation blank.

## 220 `S_RAKUEN_TSUHO_FS` — パチスロ楽園追放

### Active numeric observations

1. `BB/RD/AT combined initial hit`
   - numerator: combined initial-hit events under the published definition.
   - denominator: matching published game universe.
   - RD and AT component inputs are not separately exposed as numeric likelihood fields in this batch.

2. `common bell` — CONDITIONAL
   - visually indistinguishable from push-order bell by stop form.
   - acquisition route: My Slot My Counter Lv4.
   - eligibility condition: cumulative 15,000G play requirement reported for the relevant counter level.
   - if eligibility is unmet, observation is blank/unobserved, never `0`.
   - denominator must come from the same valid My Slot/session universe or another route only after proven equivalence.

### Reference only
- state×role draws, NAH high/challenge and other conditional families.

### Evidence
- RD-end / AT-end screens, episode and payout evidence.

### Linked service
- マイスロ: `FOUND`.
- common-bell route: verified conditional availability.
- other machine-specific fields: `UNRESOLVED` unless separately proven.

## Observation debt classification after Pass 1

### WEB_RESEARCH_CANDIDATE
1. いざ！番長: direct BIG inclusion/exclusion relative to AT initial-hit composition.
2. わた婚: eSLOT+ machine-specific field list only if reliable public/manual evidence exists.
3. 転剣: eSLOT+ machine-specific field list only if reliable public/manual evidence exists.
4. 2022 このすば: My Slot machine-specific counters relevant to active Selection/Evidence recovery.
5. 楽園追放: exact same-session denominator semantics around My Counter common-bell display beyond the verified Lv4/15,000G eligibility fact.
6. remaining machine-menu existence/details for machines not already CHECKED_NONE or publicly evidenced.

### MACHINE_REQUIRED
- exact real-device confirmation of any menu/history field whose public documentation is absent or ambiguous.
- actual screen wording/availability for linked-service machine-specific fields where web research cannot prove the mapping.

### LOW_PRIORITY_HOLD
- all Gate-B REFERENCE numeric families whose denominators are not required for current active inference.

## Gate C status after Pass 1

**OPEN.** The active Selection→Observation map is defined, but Gate C cannot close until all `WEB_RESEARCH_CANDIDATE` items affecting active mappings are either resolved or explicitly downgraded to MACHINE_REQUIRED / LOW_PRIORITY_HOLD, and the shared Feature/Evidence one-input audit is completed.
