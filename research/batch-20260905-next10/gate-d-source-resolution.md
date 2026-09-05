# SloAnalytica 2026-09-05 Next10 — Gate D Source Resolution

Status: ACTIVE
Date: 2026-09-05

This note records source issues discovered while materializing Gate D. It does not change Gate-B dependency/adoption policy except where Gate C explicitly made implementation conditional on a complete publication-grade vector.

## 東京リベンジャーズ — 中段チェリー

Gate C condition: do not materialize unless a complete probability vector exists for every implemented setting; never interpolate.

Resolved at Gate D:
- P-WORLD publishes settings 1/2/3 = 1/16384.0, settings 4/5 = 1/13107.2, setting 6 = 1/10922.7.
- 1geki and nana-press independently show the same grouped stage table.
- Therefore the vector is complete even though repeated cells are visually grouped/blank on some tables.
- `FEAT_MIDDLE_CHERRY` is materialized with no interpolation.
- Reliability weight is reduced versus common bell/AT because the event is extremely rare; rarity is not treated as missing data.

## L アズールレーン THE ANIMATION — AT設定5 source conflict

Conflict discovered at Gate D:
- older 1geki page: setting 5 AT = 1/469.4;
- nana-press updated 2026-08-28: setting 5 AT = 1/496.4;
- current P-WORLD: setting 5 AT = 1/496.4;
- current HAZUSE DATA: setting 5 AT = 1/496.4.

Resolution:
- use `1/496.4` for setting 5 in MachineData;
- retain the older `1/469.4` as a documented conflicting/stale source value, not as a probability candidate;
- no averaging or interpolation is performed.

Rationale: the newer machine-specific source and two independent current machine databases agree on 496.4, while 469.4 is isolated to the older page.

## L アズールレーン THE ANIMATION — trophy/payout evidence

Gate C allowed only source-traceable hard evidence.

At Gate D:
- machine-specific end-screen hard outcomes (`全員集合`=2+, `加賀＆赤城`=4+, `パーティ`=6) are materialized;
- Kaga Battle win back-button voices (`たぁーのしいなぁー！`=5+, `赤城の愛、受け止めてくださるかしら？`=6) are materialized with the prescribed-bonus-count context note;
- 玉ちゃんトロフィー and payout tables are not materialized in v1 because currently visible public pages mix explicit machine data with other-KYORAKU-machine reference/prediction wording. Gate D does not promote those inferred semantics into hard EvidenceEngine entries.

## Wave 1 identity workflow failure

The `Machine identity consistency` workflow failed after Wave 1, but the log does not identify any of the four new Wave-1 package IDs. It reports that 29 already-cataloged machines are missing identity-audit entries, including machines from earlier batches. Statistical, user-facing-definition and user-verified-UX audits all passed for the Wave-1 head.

Gate D treatment:
- do not alter public/prototype identity metadata merely to silence a pre-existing baseline-wide audit gap;
- keep the failure visible for Gate E/baseline maintenance;
- continue per-machine collision/model/manufacturer checks on the dedicated research branch.
