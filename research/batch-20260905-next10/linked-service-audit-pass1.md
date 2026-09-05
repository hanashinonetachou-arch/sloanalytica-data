# 2026-09-05 Next10 — Linked-service audit pass 1

Status: IN PROGRESS

This audit separates **service existence** from **actual obtainable fields**. A service is not considered fully audited until concrete result-screen/history fields and reset scope are confirmed.

| machine | service status | confirmed public evidence | obtainable-field status | Gate 0 handling |
|---|---|---|---|---|
| L アズールレーン THE ANIMATION | unresolved | no sufficiently reliable linked-service page confirmed in pass 1 | UNRESOLVED | continue manufacturer/manual search |
| スマスロ ドルアーガの塔 | **UniMemo confirmed** | Universal Entertainment official UniMemo machine list includes `スマスロ/SLOT ドルアーガの塔` | field inventory not yet complete | service-specific counters remain discovery candidates |
| スマスロ 東京リベンジャーズ | likely My Slot ecosystem, but machine-specific public evidence not yet sufficient in pass 1 | unresolved | UNRESOLVED | do not assume My Slot fields from other Sammy machines |
| スマスロ バベル | **UniMemo confirmed** | Universal Entertainment official UniMemo machine list includes `スマスロ バベル` | field inventory not yet complete | service-specific counters remain discovery candidates |
| スマスロ 新鬼武者3 | unresolved | no machine-specific linked-service source accepted yet | UNRESOLVED | continue maker/manual search |
| L主役は銭形5 | **打-WIN LITE confirmed by multiple analysis sources** | QR/menu-based 打-WIN LITE setting-hint voice is described; voice changes at 1000G milestones | at least hidden Nagi voice is observable; full result-field inventory pending | treat voice as evidence candidate; do not infer unrelated counters |
| スマスロ とある科学の超電磁砲2 | unresolved | machine-specific linked-service source not yet confirmed | UNRESOLVED | continue Fuji official/manual search |
| L 絶対衝激Ⅳ | unresolved | machine-specific linked-service source not yet confirmed | UNRESOLVED | continue maker/manual search |
| Lパチスロ 革命機ヴァルヴレイヴ2 | unresolved | machine-specific PowerCom/public service linkage not accepted yet | UNRESOLVED | do not inherit VVV1 service behavior without evidence |
| スマスロネオプラネット | **SloPla NEXT ecosystem confirmed** | Yamasa NEXT SloPla NEXT site lists `スマスロネオプラネット`; site exposes play-information functionality for supported machines | machine-specific field inventory still pending | investigate concrete play-information/result fields before Observation |

## Confirmed service-sensitive candidates

### Druaga / Babel — UniMemo
- Machine support itself is confirmed on the Universal Entertainment official UniMemo list.
- Required next check: result/history screen labels, total games, BIG/REG/type-specific counts, role counts, AT/DC-related values, session/reset behavior, and whether values are current-player-only.
- Do not treat generic UniMemo capabilities as machine-specific facts until the machine page/manual supports them.

### Zenigata 5 — 打-WIN LITE
- Public analysis sources describe a menu/QR flow and a hidden Nagi voice updated per 1000G consumed.
- The voice has lower-bound/exact-setting implications and belongs in the evidence discovery universe.
- Numerator/denominator modeling is inappropriate for the voice itself; it is an evidence observation.
- Need real-device/manual confirmation of exact UI wording and whether the displayed milestone/history can be re-opened after passing it.

### Neo Planet — SloPla NEXT
- Official Yamasa NEXT SloPla NEXT site announces the machine and play-information ecosystem.
- Required next check: machine-specific counters, whether BIG/SBB/REG are separated, normal-game denominator, role counts, mode/high-state related history, and reset/session semantics.
- Do not copy fields from another SloPla NEXT machine.

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
5. actual-screen verification items to hand to the user only when web/manual evidence cannot resolve them.
