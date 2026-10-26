# LBパチスロ ヱヴァンゲリヲン ～約束の扉～ Research / model design
date 2026-10-26. Status: RESEARCH_CLOSED_WITH_LIMITATIONS. No formal Evaluation/Eligibility/Contract.
Identity: Bisty, introduced 2025-07-07, smart BT slot, setting [1,2,3,4,5,6].
Sources:
https://nana-press.com/kaiseki/machine/988/30579/
https://nana-press.com/kaiseki/machine/988/30312/
https://1geki.jp/slot/lb_eva/0/
https://1geki.jp/slot/lb_eva/43/
Six-domain audit:
1 confirmed: normal red SBB [1985.9,1560.4,1872.5,1524.1,1771.2,1424.7], blue SBB [1365.3,1524.1,1365.3,1524.1,1365.3,1560.4], yellow BIG [520.1,508.0,478.4,448.9,414.8,390.1], 暴走 mode [5957.8,5461.3,5041.2,4681.1,4369.1,4096.0], REG [569.9,546.1,508.0,474.9,442.8,404.5]; derived all bonus [196.8,189.4,181.0,170.7,161.4,151.0].
2 role/overlap confirmed in part: replay, bell, cherry, weak/strong watermelon, reach eye, 暴走 replay, solo. Individual role occurrence rates and state-specific denominators require direct cross-check; do not infer.
3 conditional: bonus overlap by role reported as %, including bell [0.01,0.02,0.04,0.06,0.08,0.10], cherry [10.30,10.60,10.70,11.10,11.00,11.40], weak watermelon [1.82,1.91,1.97,2.23,2.31,2.54]. These are conditional ON role occurrences, not 1/G; no independent multiplication with all bonus categories. Distinct exact constraints: independent 暴走 triggers >=2; bell+yellow BIG >=2 per published descriptions.
4 REG character order, BT special movie, bonus end screen documented; non-Kaworu probabilities generally unpublished. Movie appears only on BT red7 establishment with middle BAR precise input; failure to meet condition must not be counted default.
5 exact hint candidates: REG カヲル =>6; BT movie ゲンドウ >=4, 加持 >=5, カヲル =>6; bonus-end カヲル=>6. Probabilities not guessed.
6 separate normal 3coin game/BT, no AT/CZ/ceiling; SBB/暴走 after bonus enter BT; no independent BT and source category rates.
Model: normal five-category multinomial incl none with published per-spin denominators (validate rate consistency first); derived BIG/REG/BT totals never independently multiply. Bonus overlap modeled as conditional partition by eligible observed role, only when triggering event reliably distinguishable. REG, movie, end-screen record categories when distributions absent, plus explicit hard constraints as warranted.
UI: single normal G input; bonus kinds redSBB/blueSBB/yellowBIG/暴走/REG in one section; small roles with deduped counter; role-based bonus overlaps in same opportunity without separate duplicate denominators; REGキャラ紹介 / BTムービー / 終了画面 separate; movie requires conditional success status not default count; BT counters distinct if later applicable.
Self-audit: 6 domains checked at summary level, no independent external audit. Nonpublished numerical splits closed as information unknown. Need Work verification against existing manifests and refined source page for setting-specific role occurrences; source coverage not claimed exhaustive.
