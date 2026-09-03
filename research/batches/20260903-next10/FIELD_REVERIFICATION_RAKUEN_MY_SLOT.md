# Field Reverification — パチスロ楽園追放 My Slot

Status: VERIFIED
Source: user-provided real My Slot result screen, 2026-09-04.
Machine: `S_RAKUEN_TSUHO_FS`

## Verified fields visible on the result screen

- ゲーム数: `9538G`
- 通常ゲーム数: `6078G`
- 共通ベル成立回数: `33回` with displayed rate `(1/289.04)`
- 通常時BB突入回数: `24回` with displayed rate `(1/253.25)`
- NAH覚醒チャレンジ突入回数: `16回` with displayed rate `(1/379.88)`
- Revolt to DEVA突入回数: `32回` with displayed rate `(1/189.94)`
- FS防衛戦突入回数: `16回` with displayed rate `(1/379.88)`

## Denominator proof

The screen itself resolves the previously open common-bell denominator question.

- `9538 / 33 = 289.03...`, matching the displayed common-bell rate `1/289.04` after display rounding.
- `6078 / 33 = 184.18...`, which does not match the displayed common-bell rate.

Therefore the My Slot `共通ベル成立回数` rate is paired with the screen's total `ゲーム数`, not `通常ゲーム数`, for this result screen/session.

The same screen also independently demonstrates that some normal-state event rates use `通常ゲーム数`:

- `6078 / 24 = 253.25`, exactly matching `通常時BB突入回数 24回 (1/253.25)`.
- `6078 / 16 = 379.875`, matching `NAH覚醒チャレンジ突入回数 16回 (1/379.88)` and `FS防衛戦突入回数 16回 (1/379.88)`.
- `6078 / 32 = 189.9375`, matching `Revolt to DEVA突入回数 32回 (1/189.94)`.

This proves that My Slot exposes multiple denominator universes explicitly by its displayed rates, and that `共通ベル成立回数` belongs to the total-game universe represented by `ゲーム数` on this screen.

## Observation / MachineData consequence

- Reactivate `共通ベル` as an active numeric Feature for `S_RAKUEN_TSUHO_FS` when the My Slot counter is available.
- Numerator: `共通ベル成立回数`.
- Denominator: My Slot result-screen `ゲーム数` from the same result screen/session.
- Do not pair the numerator with `通常ゲーム数`.
- If the My Slot common-bell field is unavailable because eligibility/unlock conditions are not met, leave the observation blank/unobserved; do not enter zero.
- Keep the existing My Counter Lv4 / cumulative eligibility note in the UI guidance.

This real-device evidence closes the Gate C `MACHINE_REQUIRED` denominator debt for 楽園追放 common bell and reopens/recloses Observation with the common-bell Feature active.
