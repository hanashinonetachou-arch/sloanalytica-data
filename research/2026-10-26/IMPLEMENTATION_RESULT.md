# Batch026 — implementation and immutable QA distribution

User continuation on 2026-10-27 JST authorizes implementation, distribution and APK generation. Physical-device QA is not certified by this work.

## Baselines and immutable inputs

- Production source: `eeb059c717a4d42ee34a7d806574270bd9cd56d0`.
- Completed research/evaluation/eligibility/candidate snapshot: `55d81dc66dadf57772ab30f78b71add4beef28df`.
- Prior distribution: `10efc9f14bbeaeae421c681777320b5e787eb55d` (Crea 8.5.4 and Thunder 8.5.10 preserved).
- Prior app: `b2e745672b7012f9a7aa8b5c497ec7aa95895151`.
- New distribution: `75ea64a8f84068763e86dd55e35585f18f295d2d`, branch `qa/batch026-runtime-20261027`. Catalog package URLs pin immutable commits.
- New app: `ad8da81371a13a4aec194ca6f9c0e59ddd1f3b61`, branch `qa/batch026-apk-20261027`.

## Ten machines, in the requested order

| Machine | Runtime features | Exact constraint rules |
|---|---:|---:|
| L不二子BT | 9 | 16 |
| LB スロット GALFY | 10 | 2 |
| ヱヴァンゲリヲン ～約束の扉～ | 1 | 9 |
| 異世界かるてっと BT | 4 | 15 |
| 翔べ！ハーレムエース | 6 | 6 |
| ネオアイムジャグラーEX | 2 | 0 |
| ウルトラミラクルジャグラー | 2 | 0 |
| ミスタージャグラー | 2 | 0 |
| ジャグラーガールズSS | 2 | 0 |
| ゴーゴージャグラー3 | 2 | 0 |

All ten packages use `8.5.1-batch-20261026-026`. The 97 original candidates remain traceable; the complete 147-entry candidate ledger is preserved in artifacts and package metadata. No missing setting probability was interpolated. All 263 unrelated machine packages match the previous distribution's Git blob hashes. All 273 catalog package hashes and sizes are checked; the existing v8.5 fleet runtime check covers 260 packages (the other 13 are retained and integrity-checked, not misrepresented as v8.5 runtime tests).

## Bounded integration adapter

Manifest v8.5 and its thresholds are unchanged. `execute-batch026-runtime.ts` builds Observation → Canonical UI → MachineData → RuntimePolicy → RuntimeProjection → raw AppRuntime and runs the existing document validators. `package_batch026.py` applies a separately identified `batch026-observation-contract-v1` delivery adapter. Raw artifacts and their validator results remain available beside final delivered artifacts; a legacy validator PASS is never claimed for a transformed artifact.

This adapter retains every likelihood vector and dependency-suppression list. It expresses automatic residual game counts using the app's supported exact play-data binding and hidden linear residual. New opt-in `requireAllCategoryCountsObserved` prevents unobserved categories from becoming observed zero; old packages retain their behavior. Category controls are enabled only by the explicit observation contract (and the existing Crea revision gate). The new required capability prevents unsupported old apps from installing these packages.

- Fujiko: first/every-fifth REG and other REG are two independent tabs; exact constraints share scenario inputs. Both adjustment-success voice tables share the Fujiko exact constraint through a hidden sum. Legacy stamp inferences remain record-only.
- GALFY: rainbow lamp shares one input; normal/conditional alternatives never accumulate overlapping likelihoods.
- Eva: duplicate yellow-BIG and solo-Bousou evidence share counters; movie records require the specified successful observation operation.
- Isekai: one daily 086枚OVER count drives thresholds 1/3/4. Counts above four continue to imply setting6.
- Harem: BT eligible games stay separate; unidentified role/denominator candidates remain closed and record-only as contracted.
- Jugglers: BIG/REG and predecessor play are separate. Grape site means, counts and source URLs remain reference data; no grape likelihood is fabricated.

The finite-7000 multinomial evaluation supplement from the candidate phase is imported under an explicit adapter because the pinned shared evaluator incorrectly leaves every appearance distribution unresolved. Its original builder output is still validated separately. No common evaluator/validator or policy threshold is loosened.

High/low reference benchmarks use Manifest HLD-001: low1–2 versus high5–6 at 1500/3000/7000G, with balanced class priors. Deterministic stratified Monte Carlo uses 131072 samples per setting and records numerical confidence intervals, seed and the selected single feature. Settings3–4 remain available for actual inference. Conditional exposures are not invented.

## Distribution and validation boundary

This delivery uses an immutable GitHub raw QA channel pinned into the APK. It does not claim a Pages deployment on `prototype-multi-machine`. The scoped distribution attestation explicitly records this difference from the old Pages-only validator. `import-batch026-completion.ts` validates frozen artifacts and imports them with separate leases, attempts, work results and provenance; prior QA state is preserved, and new DEVICE_QA remains pending.

Automated checks cover each numeric feature, each exact constraint, unobserved/zero values, actual play-data binding, residual reconstruction, counts exceeding available games, record-only invariance, per-REG conditions, 086 thresholds, actual rendered tab switching, input-screen mounting and the full available v8.5 fleet. The app's existing full tests, TypeScript, build, Crea regression suite and Thunder mobile layout remain required APK gates.

The first APK run found a Crea control-gate regression and stopped. The renderer was corrected, Crea's 75 cases passed again, and the complete workflow was rerun. The successful final build, APK integrity and production-state import are recorded in `production/batches/batch-20261026-026/validation/apk-boundary.json`.

Research source-coverage limitations remain those of the completed candidate snapshot. No closed missing-data search was reopened, no new claims of independent eight-site audit were added, and no prior physical-device QA status was changed.

## Final APK

- Workflow: https://github.com/hanashinonetachou-arch/sloanalytica-app/actions/runs/40414637348 — success.
- Filename: `SloAnalytica-prototype-vc2002986819.apk` (4,521,553 bytes).
- Application ID: `com.sloanalytica.settingtool`.
- Version: `1.0.1-prototype.vc2002986819+ad8da813`, versionCode `2002986819`.
- APK SHA-256: `20a57c6d4d80f8311921635afbafe44ba65fc39e7073f44a9938ef2691771b03`.
- Signing certificate SHA-256: `1c01974fc54a2c351539147179944dbab5a5104d92b9447c36e04f50cbf45ea0`.
- Artifact ID: `12695850561`.
- Physical device QA: **NOT_PERFORMED / PENDING**.
