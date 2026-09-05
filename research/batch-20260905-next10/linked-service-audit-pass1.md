# 2026-09-05 Next10 — Linked-service audit pass 1

Status: IN PROGRESS — WEB-RESOLVABLE WORK CONTINUES

This audit separates **service existence** from **actual obtainable fields**. A service is not considered fully audited until concrete result-screen/history fields and reset scope are confirmed. Real-device work is intentionally deferred unless public/manual evidence cannot resolve an item.

| machine | service status | confirmed public evidence | obtainable-field status | Gate 0 handling |
|---|---|---|---|---|
| L アズールレーン THE ANIMATION | unresolved | no sufficiently reliable linked-service page confirmed yet | UNRESOLVED | continue manufacturer/manual search; no user action yet |
| スマスロ ドルアーガの塔 | **UniMemo confirmed** | Universal Entertainment official UniMemo machine list includes `スマスロ/SLOT ドルアーガの塔` | generic UniMemo result/途中記録 flow confirmed; machine-specific field inventory pending | continue web/manual audit; actual result screenshot only if fields stay inaccessible |
| スマスロ 東京リベンジャーズ | **My Slot / My Counter observability confirmed** | public machine-specific sources state normal-game count and common-bell count can be checked with My Counter | normal-game denominator + common-bell observability confirmed; full My Slot field inventory pending | preserve normal-play-only denominator; continue field inventory |
| スマスロ バベル | **UniMemo confirmed** | Universal Entertainment official UniMemo machine list includes `スマスロ バベル` | generic UniMemo result/途中記録 flow confirmed; machine-specific field inventory pending | continue web/manual audit; actual result screenshot only if fields stay inaccessible |
| スマスロ 新鬼武者3 | unresolved | no machine-specific linked-service source accepted yet | UNRESOLVED | continue maker/manual search; no user action yet |
| L主役は銭形5 | **打-WIN LITE confirmed by multiple analysis sources** | QR/menu-based 打-WIN LITE setting-hint voice is described; voice changes at 1000G milestones | hidden Nagi voice observable; exact reopen/history semantics pending | evidence candidate locked; actual menu/result screen may become device-only check |
| スマスロ とある科学の超電磁砲2 | unresolved | machine-specific linked-service source not yet confirmed | UNRESOLVED | continue Fuji official/manual search; no user action yet |
| L 絶対衝激Ⅳ | unresolved | machine-specific linked-service source not yet confirmed | UNRESOLVED | continue maker/manual search; no user action yet |
| Lパチスロ 革命機ヴァルヴレイヴ2 | unresolved | machine-specific PowerCom/public service linkage not accepted yet | UNRESOLVED | do not inherit VVV1 behavior; continue official/manual search |
| スマスロネオプラネット | **SloPla NEXT ecosystem confirmed** | Yamasa NEXT official site lists `スマスロネオプラネット`; SloPla NEXT supports machine-specific play-information pages | Neo Planet exact field page still not exposed by current public search; other official SloPla NEXT machine pages prove the platform can expose total/normal games, bonus/type counts, role counts, feature counts and trophy observations | do not inherit fields; continue machine-specific page discovery; screenshot is useful only if exact page remains inaccessible |

## Confirmed service-sensitive candidates

### Druaga / Babel — UniMemo
- Machine support itself is confirmed on the Universal Entertainment official UniMemo list.
- UniMemo officially supports `途中記録を見る` and result confirmation after reading the machine QR code.
- Required next check remains **machine-specific** result/history labels: total/normal games, BIG/REG/type-specific counts, role counts, AT/DC-related values, session/reset behavior, and current-player-only semantics.
- Generic UniMemo capability is not enough to materialize a machine-specific input.

### Tokyo Revengers — My Counter
- Machine-specific public sources state that the normal-game count can be checked with My Counter.
- The same sources identify common bell as the upper-line 15-coin bell and recommend counting only during normal play because AT navigation can produce an indistinguishable bell.
- Therefore `normal games` is a usable denominator candidate and `common bell` is an observable numerator candidate, subject to exact My Slot/My Counter field-label confirmation.
- Do not use AT games in the common-bell denominator.

### Zenigata 5 — 打-WIN LITE
- Public analysis sources describe a menu/QR flow and a hidden Nagi voice updated per 1000G consumed.
- The voice has lower-bound/exact-setting implications and belongs in the evidence discovery universe.
- Numerator/denominator modeling is inappropriate for the voice itself; it is an evidence observation.
- Exact UI wording and whether a passed milestone can be reopened remain candidates for eventual actual-device verification.

### Neo Planet — SloPla NEXT
- Official Yamasa NEXT SloPla NEXT pages confirm the machine is in the ecosystem.
- The official platform demonstrably exposes rich per-machine play information on supported models (examples include total/normal games, bonus breakdowns, role counts, feature counts, distributions and Kerotto trophy observations).
- This proves **platform capability only**. It does not prove that Neo Planet exposes the same fields.
- Required next check: locate the Neo Planet machine-specific result page or manual and enumerate exact fields; especially BIG/SBB/REG separation, normal-game denominator, role counts and trophy/history semantics.

## Device-only / user-side escalation policy

At this stage the user does **not** need to research general setting differences or web sources; those remain AI-side work.

Ask the user only when one of these survives the web/manual audit:
1. a linked-service result screen is login/QR/session gated and its exact field list cannot be retrieved publicly;
2. an in-machine menu item or setting-hint history/reopen behavior is undocumented;
3. a counter's reset scope (current player vs prior player / power-on / service start) cannot be established from documentation;
4. exact on-device wording or grouping is needed for MachineData/UI design;
5. final isolated APK real-device verification.

High-value screenshots, if naturally available to the user later, are:
- UniMemo result/途中記録 screens for Druaga and Babel;
- Tokyo Revengers My Counter/My Slot result screen;
- Zenigata 5 打-WIN LITE screen around a 1000G milestone;
- Neo Planet SloPla NEXT result/play-information screen.

These are **accelerators, not current blockers**. Continue AI-side research first.

## Nonstandard setting-stage lock

- Druaga: `1, 2, 5, 6` only.
- Zenigata 5: `2, 3, 4, 5, 6` only; no setting 1.
- Neo Planet: `1, 2, 4, 5, 6` only; no setting 3.

These absences are structural machine identity facts, not missing research data. No synthetic SET_3/SET_1 interpolation is permitted.

## Pass-2 requirements

1. official/manual machine-specific linked-service pages where available;
2. concrete result-screen field names;
3. acquisition timing and reset scope;
4. current-player vs previous-player usability;
5. actual-screen verification items handed to the user only when web/manual evidence cannot resolve them.
