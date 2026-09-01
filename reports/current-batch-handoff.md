# SloAnalytica Current Batch Handoff

Updated: 2026-09-01
Batch: 20260901 Magia Record → Gundam SEED
Working branch: `batch/20260901-magia-gundamseed`
Stacked base: `batch/20260831-persona5-to-bio5` @ `9b8f7f05fb1d72f5d0b177f1adf00220adb2f136`
Target integration branch: `prototype-multi-machine`

## Formal references

Library latest confirmed at Gate 0:
- `SloAnalytica_Core_Policy_v1_7.txt`
- `SloAnalytica_Research_Selection_Observation_Manifest_v6_9.txt`
- `SloAnalytica_MachineData_UX_Construction_Manifest_v6_9.txt`

Core constraints confirmed: Discovery completeness, Research→Selection→Observation→UI ordering, correct numerator/denominator semantics, no duplicate likelihood, empty != observed zero, linked-service FOUND/CHECKED_NONE/UNRESOLVED contract.

## Dependency correction

The first recovery checkpoint had been branched directly from `prototype-multi-machine`. That was unsafe because Draft PR #148 contains the immediately preceding batch, provisional IDs 181-190, current schemas/tooling, and 190-machine identity state. This branch has therefore been intentionally restacked on PR #148 head before new production data is created. No new-machine production artifact had been created before the restack.

## Machines / identity lock candidates

| # | Machine | Manufacturer / brand | Type name | Introduction | Gate-0 identity |
|---|---|---|---|---|---|
| 191 | スマスロ マギアレコード 魔法少女まどか☆マギカ外伝 | ミズホ | L／スマスロマギアレコード／RN | 2025-04-07 | LOCKED |
| 192 | Lゴジラ | ニューギン | LゴジラNS | 2025-04-07 | LOCKED |
| 193 | Lうしおととら 白面決戦 | Daiichi / 製造: アイドル | Lうしおととら白面決戦VH | 2025-04-07 | LOCKED |
| 194 | スマート沖スロ アメイジングライブ | パイオニア | LアメイジングライブPD | 2025-04-07 | LOCKED |
| 195 | 吉宗 | サボハニ | L／ヨシムネS／SC2 | 2025-04-21 | LOCKED |
| 196 | L麻雀物語 | オリンピアエステート | L麻雀物語S2 | 2025-04-21 | LOCKED |
| 197 | スマスロ アイドルマスター ミリオンライブ！ ネクストプロローグ | 山佐 | LパチスロアイドルマスターミリオンライブHC | 2025-04-21 | LOCKED |
| 198 | スマスロ ようこそ実力至上主義の教室へ | DAXEL | Lようこそ実力至上主義の教室へDE | 2025-05-07 | LOCKED |
| 199 | スマスロ 緑ドン VIVA!情熱南米編 REVIVAL | ユニバーサルブロス | L／緑ドン5／FY | 2025-05-07 | LOCKED |
| 200 | Lパチスロ 機動戦士ガンダムSEED | ビスティ | L機動戦士ガンダムSEED G | 2025-05-07 | LOCKED |

Provisional registration IDs 191-200 are reserved for this batch because the stacked predecessor already owns 181-190. Final machineId strings must follow repository naming conventions derived from the exact type names and are not yet written to production artifacts.

## Gate 0 Web Discovery candidate universe — first complete pass

Discovery sources include manufacturer/official pages plus multiple major analysis surfaces (not a single-site scrape). Candidate classes below are discovery candidates, not Selection decisions.

### 191 Magia Record
- bonus / AT initial-hit probabilities
- weak cherry probability
- non-Iroha mode selection
- high-state transition probabilities (reset/AT end, BIG end)
- CZ selection from watermelon
- bonus end screens / AT end screens and other hard-evidence or setting-suggestive surfaces
- linked service: Universal ecosystem must be distinguished from the simulator app; exact UniMemo target support/fields remains to be resolved in Observation research

### 192 L Godzilla
- CZ initial hit and AT initial hit
- mode transition / G-point related setting differences
- CZ entry/selection related differences where published
- menu/operator/EX-bonus or other setting-suggestive surfaces
- hard-evidence surfaces to be decomposed during Research
- linked service currently UNRESOLVED; do not infer from manufacturer family alone

### 193 Ushio & Tora Hakumen Kessen
- CZ / AT initial hit
- reset-only AT ceiling shortening distribution
- reset-only Ushio-Tora mode selection distribution
- state/role-specific CZ lottery differences
- payout milestone hard evidence
- Dynamite Trophy hard evidence
- reset-only candidates must not be mixed into ordinary-session denominators

### 194 Amazing Live
- BIG / REG / combined bonus rates
- bonus initial-hit rate
- rare-role bonus lottery candidates
- currently no credible setting-suggestive screen family found in the first pass; absence must be explicitly verified before CHECKED_NONE-style treatment
- setting 3 is not part of the published five-setting table (1,2,4,5,6); inference setting domain must follow confirmed machine specification rather than fabricate SET_3 values

### 195 Yoshimune
- bonus initial-hit probability
- common tawara probability
- bonus-end hanafuda / frame evidence and suggestive categories
- voice/effect evidence candidates
- mode/zone-related public differences must be screened for observability and duplicate information before Selection
- do not confuse this 2025 `吉宗` with 2026 `真打 吉宗`

### 196 Mahjong Monogatari
- bonus / AT-related initial-hit candidates
- CZ and state/role-specific lottery candidates
- bonus/AT end screens and trophy/evidence surfaces
- direct/conditional routes require denominator observability review
- linked service currently UNRESOLVED

### 197 Idolmaster Million Live! Next Prologue
- bonus initial hit / CZ-related candidates
- bonus end screens and setting-suggestive/evidence surfaces
- 300G / direct-high-probability behavior candidates reported by analysis surfaces require exact semantics review
- `スロプラNEXT` FOUND. Public result page confirms at least total games, normal games, bonus initial hits, Million Live, Million Seven Chance, Grow Up Challenge, cherry, watermelon, chance bell, Duo A/B/C, Mirishita role, multiple bonus/live counts and success counts.
- official service notice says rare-role probability display was removed because accurate calculation was difficult; use raw counts where observable, never reconstruct deleted service probabilities as official values.

### 198 Classroom of the Elite
- CZ and AT initial-hit probabilities
- CZ mode 3 lottery differences
- Yojitsu-point CZ-type allocation
- DAXEL flash rate on CZ success
- red-button rate on continuous-performance success
- bonus character introductions / bonus end screen
- AT end screen hard evidence and suggestive categories
- acquired-coin milestone evidence
- ending challenge voice evidence
- linked service currently UNRESOLVED

### 199 Midoridon VIVA REVIVAL
- bonus and AT initial-hit probabilities
- weak cherry / weak wave / reach-eye replay probabilities
- role-specific high-state transition probabilities
- normal/high-state bonus lottery probabilities
- bonus end screens
- XR Challenge failure voice
- ending trick-introduction evidence/suggestion
- UniMemo support is publicly indicated by analysis sources; exact official result fields remain Observation-research work

### 200 Gundam SEED
- AT initial-hit probability
- CZ / bonus / ST route candidates and state-dependent lottery candidates
- end screens / voice / milestone / hard-evidence surfaces must be enumerated from major analysis sources in Research
- denominator separation is especially important because CZ, pseudo-bonus, ST and upper-AT routes are nested
- linked service currently UNRESOLVED

## Gate 0 result

**PASS_WITH_TRACKED_DISCOVERY_DEBT**

Identity is locked for 10/10 and the first cross-source candidate-universe pass is complete enough to start Research without silently dropping known candidate classes. Remaining items are intentionally carried into Research/Observation as explicit questions rather than guessed:
- exact linked-service status/field list for all machines except Idolmaster (FOUND with public field evidence)
- exact full setting-suggestive category tables for several machines
- exact machineId strings following repository convention
- cross-source numeric conflict reconciliation

## Next action

Start Gate A / Research for all 10 machines horizontally. For every discovered candidate, capture exact published values, source provenance, settings domain, numerator/denominator semantics, observability notes, evidence semantics, and linked-service coverage. Do not perform Selection while Research rows are incomplete.

## Handoff rule

At each Gate completion, update this checkpoint before moving on. If context pressure rises before completion, write an intermediate checkpoint first.