# SloAnalytica 2026-09-01 Batch — Real-device Verification

Status: **IN_PROGRESS / WAITING_FOR_USER_REAL_DEVICE_SMOKE**

## Formal standards
- Core Policy v1.7
- Research / Selection / Observation Manifest v6.9
- MachineData / UX Construction Manifest v6.9

## Starting checkpoint
- PR: #149
- Branch: `batch/20260901-magia-gundamseed`
- Publish checkpoint HEAD at stage entry: `52f7cfbb1cc4d0dd802930522c1acf035508da25`
- Formal Publish workflow: `33485719583` — SUCCESS
- Published work-product HEAD: `7161e96acd628219c36e8147ebb2801ddafd12d0`
- Publish status: `PASS_WITH_TRACKED_OBSERVATION_DEBT`

This stage does not promote unresolved acquisition/source-coverage items to FOUND from automated PASS alone.

## Checkpoint model
The first cross-machine checkpoint is **Real-device UI Smoke Pass**. It is intentionally narrower than User-Verified UI Lock.

For every machine, confirm:
1. machine appears in catalog and can be installed/selected;
2. input screen opens;
3. major adopted-Feature sections and Evidence section have no obvious omissions;
4. no obvious EXCLUDE-only / REJECT-only input leaked into the input UI;
5. labels, descriptions, section order, counters and layout are understandable and not broken;
6. quick-input `+` updates the same normal input where offered;
7. enter representative values and reach the result screen;
8. no crash, NaN, generic-label regression, or serious layout break;
9. empty remains unobserved and an explicitly entered `0` remains observed zero;
10. predecessor/seat-time values are not merged into the self-play interval unless a verified seat-time contract exists.

A Smoke PASS does **not** automatically mean all controls, denominators, Evidence, persistence/history, or field-acquisition routes are User-Verified UI Locked.

## Machine-specific semantic checks

### 192 — L_MAGIA_RECORD_RN
- Confirm primary sections for Bonus first hit / Magia Rush first hit and adopted support/fallback sections are present.
- Conditional fallback populations must remain conditional; do not interpret them as total-normal-game denominators.
- UniMemo is a supplementary acquisition route only where its displayed denominator agrees with Selection. Do not merge a linked-service value merely because it is available.
- Field verification still waiting: machine-menu/history concrete fields, hall data-counter semantics, seated-start snapshot / predecessor alignment.

### 193 — L_GODZILLA_NS
- Confirm G-RUSH DESTRUCTION first-hit and 襲来ZONE opponent inputs plus Hard Evidence UI.
- Open the PUSH menu and record the exact numeric fields shown under `当日の遊技履歴`.
- Check whether a machine-specific QR / linked-service route exists.
- Field verification still waiting: hall data-counter semantics and seated-start snapshot / predecessor alignment.

### 194 — L_USHIO_TORA_HAKUMEN_VH
- Confirm AT first-hit and Hard Evidence UI.
- Do not create/use reset-only population unless a reset opportunity is actually confirmed.
- Check machine menu/history concrete fields and machine-specific QR / linked-service route.
- Field verification still waiting: hall data-counter semantics and seated-start snapshot / predecessor alignment.

### 195 — L_AMAZING_LIVE_PD
- Confirm **Bonus first hit is the sole active overlap-family likelihood representative**.
- BIG, REG and BIG+REG aggregate must not appear as independent numeric likelihood inputs.
- Confirm SET_L remains an operational/identity setting; no SET_3 is generated and SET_L is not treated as a numeric inference candidate without a published likelihood.
- Highest-priority field check: identify the machine-visible boundary for a Bonus `first hit`, how consecutive/chain bonuses are excluded, and whether an explicit first-hit count is displayed anywhere. Do not substitute BIG/REG/aggregate counts.
- Check machine menu/history concrete fields and machine-specific QR / linked-service route.
- Field verification still waiting: hall data-counter semantics and seated-start snapshot / predecessor alignment.

### 196 — L_YOSHIMUNE_SC2
- Confirm BIG/REG first-hit, common tawara and Hard Evidence UI.
- Check machine menu/history concrete fields and machine-specific QR / linked-service route.
- Field verification still waiting: hall data-counter semantics and seated-start snapshot / predecessor alignment.

### 197 — L_MAHJONG_MONOGATARI_S2
- Confirm AT direct-hit input explicitly means `前兆昇格除外` and confirm 煌帝 appearance / Hard Evidence UI.
- Do not mix promotion-inclusive practical direct AT into the analysis direct-AT Feature.
- Bonus first hit / total AT first hit / Bonus-or-AT aggregate must not reappear as independent likelihood inputs.
- Check machine menu/history concrete fields and machine-specific QR / linked-service route.
- Field verification still waiting: hall data-counter semantics and seated-start snapshot / predecessor alignment.

### 198 — L_IDOLMASTER_MILLION_LIVE_HC
- Confirm CZ aggregate, Bonus first-hit and Hard Evidence UI.
- SloPla NEXT is already a FOUND supplementary route; verify the actual device/service flow if convenient, but do not substitute service values where denominator semantics disagree.
- Field verification still waiting: machine-menu/history concrete fields, hall data-counter semantics, seated-start snapshot / predecessor alignment.

### 199 — L_YOUJITSU_DE
- Confirm CZ occurrence, DAXEL flash, normal-cycle CZ type, red-button, Bonus-end-screen and Hard Evidence UI.
- DAXEL flash denominator = CZ successes; normal-cycle CZ type denominator = normal-cycle CZ wins excluding rare-role promotion; red-button denominator = target continuous-performance successes. None may be converted to total normal games.
- Machine menu/history is already FOUND for total games, normal games, CZ count, AT count and rare-role probability; check that the app does not misuse those totals for conditional support denominators.
- Linked service is CHECKED_NONE; do not create a linked-service requirement.
- Field verification still waiting: hall data-counter semantics and seated-start snapshot / predecessor alignment.

### 200 — L_MIDORIDON_VIVA_REVIVAL_FY
- Confirm Amazon Game first hit, weak cherry, weak wave, Bonus first-hit, conditional/fallback sections and Hard Evidence UI.
- State × role × opportunity denominators must remain exact; conditional populations must not be flattened to total games.
- Conditional Bonus-by-role fallbacks must remain suppressed against Bonus first hit when the primary overlap representative is available.
- UniMemo weak-cherry / weak-wave counts are supplementary; do not infer state-specific denominators from aggregate small-role counts.
- Field verification still waiting: machine-menu/history concrete fields, hall data-counter semantics, seated-start snapshot / predecessor alignment.

### 201 — L_GUNDAM_SEED_G
- Confirm AT first-hit, post-reset/ST-end 100G-window categories and Hard Evidence UI.
- One reset or ST end = one 100G-window opportunity. Never interpret 0–49 / 50–99 / 100+ as per-game probabilities.
- Check machine menu/history concrete fields and machine-specific QR / linked-service route.
- Field verification still waiting: hall data-counter semantics and seated-start snapshot / predecessor alignment.

## Hall data-counter policy
Hall-specific external data counters are **not** a universal mandatory Observation source. If checked, record what that particular counter exposes (e.g. total/current G, Bonus, AT, CZ, history) and whether its semantics can actually be aligned with a Selection denominator. A hall-specific display must not be generalized to every installation.

## Evidence / presentation checks
Across all ten machines:
- Hard Evidence and tendency cues must remain distinct.
- `採用していない設定推測要素` should show rejected elements with reasons without creating REJECT-only inputs.
- The old rejection-reason presentation must not be duplicated.
- Evidence and conditional numeric Features must not require double entry for the same event.
- Derived values must not appear as a second manual input.

## Closure rules
- A brief all-machine visual/functional check may close **Real-device UI Smoke Pass**.
- Machine-only questions that cannot be checked may remain UNRESOLVED without failing the entire Smoke Pass.
- A verified field result may update Observation / UI Design / MachineData only after checking the Selection denominator and Semantic Lock.
- If real-device review suggests a Research/Selection omission or semantic defect, reopen the upstream layer; do not patch only the UI.
- Any semantic reopen that changes adopted Features, denominators, input structure or inference linkage invalidates the affected prior UI verification until rebuilt and rechecked.

## Current result
- Cross-machine Smoke Pass: **WAITING_FOR_USER**
- User-Verified UI Lock: **NOT_STARTED**
- Tracked Observation / field-verification debt: **OPEN**
