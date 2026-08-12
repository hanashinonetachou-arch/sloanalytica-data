# Initial D 2nd Phase 10D Re-evaluation

Date: 2026-08-12

## Reason for re-evaluation

The first Pre-Publish Review treated AT-during-LB end screens only as Hard Evidence candidates (red/gold). Re-review found published setting-specific rates for the ordinary end-screen categories, including the swimsuit high-setting hint.

## Published distribution retained in ResearchData

AT-during-LB end screen per-display distribution:

- Default: 62/60/58/53/51/48.5%
- Odd hint: 18/12/18/12/18/12%
- Even hint: 12/18/12/18/12/18%
- Swimsuit: 8/10/12/16/18/20%
- Setting 4+: 0/0/0/1/1/1%
- Setting 6: 0/0/0/0/0/0.5%

Sources are recorded as SRC_NANA_LB_END, SRC_1GEKI_SETTING, and SRC_GABU_SETTING. Sources also state that the screen is selected on each display and a redisplay after revival remains valid.

## Selection decision

- Adopt the full end-screen event rather than swimsuit-only.
- Keep red/gold as Hard Evidence.
- Numeric inputs use only Default / Odd / Even / Swimsuit.
- Builder `categoryExcludeLabels` removes red/gold from numeric Multinomial categories and renormalizes the remaining published probabilities per setting.
- ResearchData keeps the original complete six-category distribution unchanged for auditability.

On the Difficulty Analyzer's common 80% equal-prior Bhattacharyya criterion, the conditioned four-category numeric feature requires about 38 displayed screens for SET_1 vs SET_6; swimsuit-only requires about 59. These are event-count comparison guides, not guaranteed setting-identification thresholds.

## Difficulty handling

No published or otherwise sufficiently grounded per-game exposure for AT-during-LB end-screen displays is currently registered. Therefore the feature participates in inference but is explicitly excluded from 1500/3000/7000 target-game Difficulty conversion. Existing target-game raw scores remain based on LB initial-hit and normal-bell features and are provisional.

## Publish status

Publish remains blocked by the unresolved LB published-denominator equivalence issue. The earlier Phase 10D package is superseded for review purposes by this re-evaluated working state.
