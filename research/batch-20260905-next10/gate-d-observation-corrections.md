# SloAnalytica 2026-09-05 Next10 — Gate D Observation Corrections

Status: ACTIVE CORRECTION
Date: 2026-09-05

## L主役は銭形5 — デカ目 denominator correction

Gate C wording incorrectly described the statistical pair as:
- eligible Deka-me opportunities; and
- direct hits from those Deka-me opportunities.

That would imply a conditional hit rate per Deka-me occurrence. Public machine-specific sources do not publish that quantity.

The published setting-difference table `1/21580.7, 1/19209.1, 1/10964.8, 1/7249.1, 1/5561.8` is the **Deka-me appearance/direct-hit rate per eligible normal game while not in true bonus foreshadowing**.

Correct Gate-D observation contract:
- denominator: `INP_DEKAME_ELIGIBLE_GAMES` — bonus-non-true-foreshadowing normal games only;
- numerator: `INP_DEKAME_DIRECT_HITS` — Deka-me appearances in that eligible population (each appearance is the direct-hit event for this published table);
- exclude true bonus-foreshadowing games from denominator and numerator population;
- do not divide direct hits by Deka-me occurrences;
- ST Deka-me is a different all-setting-common population and is excluded.

This is a denominator correction, not a change to Gate-B adoption: the same Deka-me setting-difference candidate remains ADOPT, now represented by the actual published population.

Sources checked at Gate D: P-WORLD, 1geki and nana-press machine-specific pages, all describing the table as normal/non-foreshadowing Deka-me appearance or direct-hit probability.
