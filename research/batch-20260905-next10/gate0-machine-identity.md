# SloAnalytica 2026-09-05 Next10 — Gate 0 Machine Identity

Status: IN PROGRESS
Base: prototype-multi-machine @ 542cfe4f9eece7126717c3fef760a300ab4d93f9
Policy: Core Policy v1.8 / Research-Selection-Observation Manifest v6.15

## Registry source-of-truth

- Current source-of-truth: `machine-registry.json` on `prototype-multi-machine`.
- Current maximum `provisionalRegistrationId`: **229** (`L_ULTRAMAN_KE`).
- Therefore this batch uses **230–239** as provisional candidates. The earlier 221–230 draft was incorrect and is superseded by this table.
- `catalog.json` contains 220 currently published prototype machines, but catalog count is not the registration-ID source-of-truth.

## Requested machines

| provisionalRegistrationId candidate | requested / canonical name | type/model | maker (identity label) | introduction | setting stages | duplicate status vs current 220-machine catalog |
|---:|---|---|---|---|---|---|
| 230 | L アズールレーン THE ANIMATION | LアズールレーンTHE ANIMATION KN | **京楽産業．株式会社** | 2025-08-04 | 1/2/3/4/5/6 | ABSENT — new identity |
| 231 | スマスロ ドルアーガの塔 | **Lドルアーガの塔ZA** | **ミズホ** | 2025-09-08 | **1/2/5/6** | ABSENT — new identity |
| 232 | スマスロ 東京リベンジャーズ | Lスマスロ東京リベンジャーズZF | サミー | 2025-09-08 | 1/2/3/4/5/6 | ABSENT — new identity |
| 233 | スマスロ バベル | L/バベル/BA | ユニバーサルブロス | 2025-10-06 | 1/2/3/4/5/6 | ABSENT — new identity |
| 234 | スマスロ 新鬼武者3 | L新鬼武者3SA | **レオスター**（brand/ecosystem: エンターライズ） | 2025-10-06 | 1/2/3/4/5/6 | ABSENT — new identity |
| 235 | L主役は銭形5 | L銭形5L2 | **オリンピア** | 2025-10-06 | **2/3/4/5/6（設定1なし）** | ABSENT — new identity |
| 236 | スマスロ とある科学の超電磁砲2 | Lとある科学の超電磁砲2FV | **藤商事** | 2025-11-04 | 1/2/3/4/5/6 | ABSENT — new identity |
| 237 | L 絶対衝激Ⅳ | L絶対衝激フォースFH | **アイドル** | 2025-11-04 | 1/2/3/4/5/6 | ABSENT — **family-name collision only** with existing `L_ZETTAI_SHOGEKI_PLATONIC_HEART_TK`; distinct model/edition |
| 238 | Lパチスロ 革命機ヴァルヴレイヴ2 | L革命機ヴァルヴレイヴ2jF | **ジェイビー**（market brand: SANKYO） | 2025-11-04 | **1/2/4/5/6（設定3なし）** | ABSENT — new identity |
| 239 | スマスロネオプラネット | LネオプラネットSLED | **セブンリーグ**（brand/ecosystem: 山佐NEXT） | 2025-11-17 | **1/2/4/5/6（設定3なし）** | ABSENT — new identity |

## Maker/model identity resolution

Government/public-safety model notices were used where available to resolve legal holder vs market-brand ambiguity:

- `LアズールレーンTHE ANIMATION KN`: legal applicant/manufacturer **京楽産業．株式会社**. Do not label this slot model as オッケー. merely because related Azur Lane pachinko titles use オッケー.
- `Lドルアーガの塔ZA`: this is the **smart-slot** model; `S/ドルアーガの塔/ZU` is a simultaneously sold medal-machine model and must not be substituted. Both are ミズホ.
- `L新鬼武者3SA`: legal applicant/manufacturer **株式会社レオスター**; market references may present the Enterrise/Capcom brand relationship separately.
- `L銭形5L2`: legal applicant/manufacturer **株式会社オリンピア**.
- `Lとある科学の超電磁砲2FV`: legal applicant/manufacturer **株式会社藤商事**.
- `L絶対衝激フォースFH`: legal applicant/manufacturer **株式会社アイドル**.
- `L革命機ヴァルヴレイヴ2jF`: legal applicant/manufacturer **株式会社ジェイビー**; public market/analysis pages commonly identify the machine under SANKYO. Identity metadata should preserve the legal holder and may separately retain market brand.
- `LネオプラネットSLED`: legal applicant/manufacturer **セブンリーグ株式会社**; Yamasa NEXT is the public brand/service ecosystem.

## Duplicate audit result

Exact display-name search over the current prototype `catalog.json` returned no hit for all ten requested identities. `L 絶対衝激Ⅳ` is intentionally not treated as a duplicate of the existing `L 絶対衝激～PLATONIC HEART～`: the existing catalog entry is model-family-distinct and must remain separate. Similar sequel/family names must continue to be checked by model number before MachineData creation.

## Gate 0 required Discovery Candidate Universe

Discovery must be exhaustive before Selection. For every machine, investigate all of the following independently and retain candidates even when weak, low-frequency, correlated, cumbersome, or likely to be rejected later:

- BIG / REG / bonus and type-specific bonus distributions
- AT / ART / ST first-hit rates
- CZ total and type-specific rates
- small roles / rare roles / role-specific overlaps
- direct hit / comeback / trigger path
- mode / internal state / state migration
- prescribed game / point / cycle / zone distributions
- type-specific distribution / success probability
- start/end screen / voice / card / lamp
- trophy / stamp / setting denial / lower-bound / exact-setting evidence
- other setting hints
- linked-service-specific counters
- seated-state / data-counter observable values

## Red-team checklist

- Do not decide adoption/rejection in Discovery.
- Verify same-event/subset/conditional-composition/mutually-exclusive/causally-related-distinct relationships later in Selection.
- For conditional success rates, distinguish initial lottery from rewrite/promotion/revival/guarantee and final observed success.
- Record numerator, denominator, acquisition source, reset scope and whether prior-player values are usable.
- Search multiple sources; disagreement remains CONFLICT / UNRESOLVED.
- Do not import PLATONIC HEART analysis into 絶対衝激Ⅳ merely because the series title overlaps.
- Do not invent missing setting stages. Druaga=1/2/5/6, Zenigata5=2/3/4/5/6, VVV2=1/2/4/5/6, Neo Planet=1/2/4/5/6.

## Current blockers before Gate 0 PASS

1. Complete linked-service obtainable-field audit for all ten machines; existence alone is insufficient.
2. Complete per-candidate source traceability for Discovery Candidate Universe pass 2.
3. Complete Discovery red-team review and explicitly preserve unresolved source conflicts (especially Shin Onimusha 3).

Maker-label ambiguity is no longer a Gate 0 blocker for the identities resolved above. Public main is not part of this work and must remain unchanged.
