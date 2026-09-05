# SloAnalytica 2026-09-05 Next10 — Gate C Observation pass 1

Status: PASS — superseded/finalized by `gate-c-observation-contracts-final.md` and `gate-c-red-team-final.md`
Started after Gate B PASS: 2026-09-05
Completed: 2026-09-05

Gate C converts final Selection decisions into concrete user-observable input contracts. Only Gate-B ADOPT + EVIDENCE items are materialized. SUPPORT items remain non-inference references unless promoted by a later audited change.

## Observation contract rules

For every statistical input:
- user-visible label;
- numerator and denominator;
- inclusion/exclusion scope;
- reset/session scope;
- acquisition method;
- empty vs entered-zero behavior;
- real-device feasibility.

For Evidence items:
- selectable source-supported outcome(s);
- lower-bound / exact / denial semantics;
- valid context;
- history/reopen dependency where relevant.

## Finalized machine outcomes

### 230 — L アズールレーン THE ANIMATION
Primary: normal games, AT first-hit, bonus first-hit, common bell, cherry, watermelon. Hard evidence only; Blue7 and bonus-count-conditioned AT expectations remain SUPPORT/reference.

### 231 — スマスロ ドルアーガの塔
Primary: shared normal games + BIG + REG. `イシターの復活` retained as setting-2+ evidence. Total bonus is not a simultaneous likelihood input.

### 232 — スマスロ 東京リベンジャーズ
Primary: normal games, Tokyo Manji RUSH first-hit, normal-play common bell. AT games are excluded from the common-bell population. Middle cherry is deferred until a complete publication-grade setting vector exists.

### 233 — スマスロ バベル
Primary: normal games + BIG + REG, weak/strong-cherry trial/hit pairs, scorpion eligible-3rd/6th trial/hit pair. Hit counts must not exceed eligible trials. Bonus total and all-setting-common scorpion events are excluded from simultaneous inference.

### 234 — スマスロ 新鬼武者3
Primary: normal games + Soken RUSH first-hit. Hard AT-end / Entertrophy / other source-confirmed evidence. Common bell remains absent because current values are empirical-only.

### 235 — L主役は銭形5
Primary: normal games + bonus/AT first-hit, plus non-true-foreshadowing Deka-me trial/direct-hit pair. Payout/stamp/hidden-Nagi evidence retained. Deka Time end screen is reference/mode information, not setting evidence.

### 236 — スマスロ とある科学の超電磁砲2
Primary: normal games + AT first-hit + CZ total. Type-specific CZs remain SUPPORT/reference and do not multiply with CZ total. Hard AT-end/Fujimaru Coin evidence retained.

### 237 — L 絶対衝激Ⅳ
Primary: normal games + Platonic Time first-hit. Bonus first-hit remains SUPPORT/reference due dependency. Source-confirmed hard evidence retained.

### 238 — Lパチスロ 革命機ヴァルヴレイヴ2
Primary: normal games + AT first-hit. BAR-alignment direct-hit is deferred from active v1 inference because its opportunity denominator is not safely locked. Ordinary end-screen distribution remains reference-only and requires explicit customization-OFF context. Hard +22/+44/+66G and other source-confirmed evidence retained.

### 239 — スマスロネオプラネット
Primary: normal games excluding published 1G-ren scope + total bonus first-hit. Mode-F trial/transition pair is reset/setting-change-only and gated by explicit applicability. BIG/REG are reference/history only. Hard constellation/trophy/end/payout evidence retained.

## Cross-machine locks

- Empty = unobserved / no participation.
- Entered zero = observed zero within a known eligible denominator.
- Evidence observations do not require a statistical denominator.
- SUPPORT is never silently materialized into active likelihood.
- Linked-service prefill must preserve exact denominator/reset semantics; manual input remains canonical.
- Conditional exclusions must be visible in user-facing help.
- Missing setting stages are structural and are never interpolated.

## Gate C result

Concrete input IDs, UI labels, denominator contracts and hard-evidence semantic vocabularies are defined in `gate-c-observation-contracts-final.md`. Observation feasibility, dependency boundaries, empty/zero semantics, service equivalence, missing-setting handling and context-sensitive evidence were re-audited in `gate-c-red-team-final.md` with verdict **PASS**.

Gate D / UI Design + MachineData may proceed on `research/20260905-batch10-next`. Public `main` remains untouched.