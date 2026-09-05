# 2026-09-05 Next10 — Linked-service audit pass 1

Status: GATE-0 COMPLETE — UNRESOLVED FIELDS CARRIED FORWARD

This audit separates **service existence** from **actual obtainable fields**. A service is not considered fully field-audited until concrete result-screen/history fields and reset scope are confirmed. Real-device work is intentionally deferred unless public/manual evidence cannot resolve an item.

| machine | service status | confirmed public evidence | obtainable-field status | Gate 0 handling |
|---|---|---|---|---|
| L アズールレーン THE ANIMATION | **ぱちログ confirmed** | KYORAKU official supported-machine information confirms machine support and play-result viewing flow | exact machine-specific result-field inventory pending | carry exact fields to Gate A / Observation research; no user action yet |
| スマスロ ドルアーガの塔 | **UniMemo confirmed** | Universal Entertainment official UniMemo machine list includes `スマスロ/SLOT ドルアーガの塔` | generic UniMemo result/途中記録 flow confirmed; machine-specific field inventory pending | carry forward; actual result screenshot only if fields stay inaccessible |
| スマスロ 東京リベンジャーズ | **My Slot / My Counter observability confirmed** | public machine-specific sources state normal-game count and common-bell count can be checked with My Counter | normal-game denominator + common-bell observability confirmed; full My Slot field inventory pending | preserve normal-play-only denominator; carry field inventory |
| スマスロ バベル | **UniMemo confirmed** | Universal Entertainment official UniMemo machine list includes `スマスロ バベル` | generic UniMemo result/途中記録 flow confirmed; machine-specific field inventory pending | carry forward; actual result screenshot only if fields stay inaccessible |
| スマスロ 新鬼武者3 | unresolved | targeted public search found no accepted machine-specific linked-service result inventory | UNRESOLVED | preserve uncertainty; do not infer service from Enterrise/Capcom family |
| L主役は銭形5 | **打-WIN LITE confirmed by multiple analysis sources** | QR/menu-based 打-WIN LITE setting-hint voice is described; voice changes at 1000G milestones | hidden Nagi voice observable; exact reopen/history semantics pending | evidence candidate locked; actual menu/result screen may become device-only check |
| スマスロ とある科学の超電磁砲2 | unresolved | targeted public search found no accepted machine-specific linked-service result inventory | UNRESOLVED | preserve uncertainty; no user action yet |
| L 絶対衝激Ⅳ | unresolved | targeted public search found no accepted machine-specific linked-service result inventory | UNRESOLVED | preserve uncertainty; no user action yet |
| Lパチスロ 革命機ヴァルヴレイヴ2 | unresolved | no machine-specific PowerCom/result-service linkage accepted after targeted search; old/general SANKYO PowerCom references are insufficient | UNRESOLVED | do not inherit VVV1 or generic SANKYO behavior |
| スマスロネオプラネット | **SloPla NEXT ecosystem confirmed** | Yamasa NEXT official site lists `スマスロネオプラネット`; SloPla NEXT supports machine-specific play-information pages | Neo Planet exact field page still not exposed by current public search | carry exact fields; screenshot useful only if exact page remains inaccessible |

## Confirmed service-sensitive candidates

### Azur Lane — ぱちログ
- Exact-machine support is confirmed.
- Official service description establishes play-result viewing after machine interaction.
- MachineData must not materialize any specific counter until the exact Azur Lane result field is independently confirmed.

### Druaga / Babel — UniMemo
- Machine support itself is confirmed on the Universal Entertainment official UniMemo list.
- UniMemo officially supports `途中記録を見る` and result confirmation after reading the machine QR code.
- Required later check remains **machine-specific** result/history labels: total/normal games, BIG/REG/type-specific counts, role counts, AT/DC-related values, session/reset behavior, and current-player-only semantics.
- Generic UniMemo capability is not enough to materialize a machine-specific input.

### Tokyo Revengers — My Counter
- Machine-specific public sources state that the normal-game count can be checked with My Counter.
- The same sources identify common bell and recommend counting only during normal play because AT navigation can produce an indistinguishable bell.
- Therefore `normal games` is a usable denominator candidate and `common bell` is an observable numerator candidate, subject to exact field-label confirmation.
- Do not use AT games in the common-bell denominator.

### Zenigata 5 — 打-WIN LITE
- Public analysis sources describe a menu/QR flow and a hidden Nagi voice updated per 1000G consumed.
- The voice has lower-bound/exact-setting implications and belongs in the evidence discovery universe.
- Numerator/denominator modeling is inappropriate for the voice itself; it is an evidence observation.
- Exact UI wording and whether a passed milestone can be reopened remain candidates for eventual actual-device verification.

### Neo Planet — SloPla NEXT
- Official Yamasa NEXT pages confirm the machine is in the ecosystem.
- The official platform demonstrably exposes rich per-machine play information on supported models.
- This proves **platform capability only**. It does not prove that Neo Planet exposes the same fields.
- Required later check: locate the Neo Planet machine-specific result page or enumerate the exact fields from an actual result screen.

## Device-only / user-side escalation policy

The user does **not** need to research general setting differences or web sources.

Ask the user only when one of these survives web/manual audit:
1. a linked-service result screen is login/QR/session gated and its exact field list cannot be retrieved publicly;
2. an in-machine menu item or setting-hint history/reopen behavior is undocumented;
3. a counter's reset scope cannot be established from documentation;
4. exact on-device wording/grouping is needed for MachineData/UI design;
5. final isolated APK real-device verification.

High-value screenshots, if naturally available later:
- Azur Lane ぱちログ result screen;
- UniMemo result/途中記録 screens for Druaga and Babel;
- Tokyo Revengers My Counter/My Slot result screen;
- Zenigata 5 打-WIN LITE screen around a 1000G milestone;
- Neo Planet SloPla NEXT result/play-information screen.

These are **accelerators, not Gate-0 blockers**.

## Nonstandard setting-stage lock

- Druaga: `1, 2, 5, 6` only.
- Zenigata 5: `2, 3, 4, 5, 6` only; no setting 1.
- VVV2: `1, 2, 4, 5, 6` only; no setting 3.
- Neo Planet: `1, 2, 4, 5, 6` only; no setting 3.

These absences are structural machine identity facts, not missing research data. No synthetic interpolation is permitted.

## Gate-0 disposition

Linked-service discovery is sufficient to close Gate 0 because:
- known services are explicitly separated from unverified machine-specific fields;
- unknown services remain `UNRESOLVED` rather than being guessed;
- service-gated exact fields are carried into Gate A / Observation research;
- no MachineData field is being invented at this stage.
