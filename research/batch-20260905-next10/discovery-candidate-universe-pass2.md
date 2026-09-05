# SloAnalytica 2026-09-05 Next10 — Discovery Candidate Universe pass 2

Status: DISCOVERY IN PROGRESS — NO SELECTION DECISIONS
Checked: 2026-09-05

This pass expands machine-specific evidence, conditional denominators, observability notes and linked-service findings. Nothing in this document is an adoption/rejection decision.

## L アズールレーン THE ANIMATION

Machine-linked service:
- KYORAKU `ぱちログ` support is confirmed on the official supported-machine list.
- Official description confirms that reading the machine result lets the player view play results; exact machine-specific field inventory remains unresolved.

Setting/evidence candidates added in pass 2:
- Sea-battle bonus failure / AT end screen: default 1, default 2, high-setting weak, high-setting strong, setting 2+, setting 4+.
- Kaga Battle first-half failure character-introduction scenario: default patterns, odd setting indication, even setting indication, setting 4 indication, setting 5/6 indication, plus an AT-only scenario that must not be misclassified as setting evidence.
- Kaga Battle win back-button voice: no voice = AT lottery path, standard voice = prescribed-bonus-count path, setting 5+, setting 6.
- Akashi Challenge success notification game: odd/even remaining-game parity is an odd/even setting indication. Condition is `success without a rare role and prescribed-bonus-count hit`; this is not an unconditional distribution.
- Existing candidates retained: AT first-hit, bonus first-hit, blue7 bonus, common bell, cherry, watermelon, bonus-count AT expectation, blue7 promotion, post-AT state, payout/trophy evidence.

Red-team notes:
- The AT-ending/sea-battle screen may also encode remaining prescribed-bonus-count information; setting and non-setting meanings must be separated at Observation.
- Akashi Challenge denominator must be restricted to the eligible prescribed-count success population; using all challenge attempts would be invalid.

## スマスロ ドルアーガの塔

Linked service:
- UniMemo support is confirmed by Universal Entertainment.
- Generic UniMemo supports interim record / final play-result viewing, but machine-specific counters are still unresolved and must not be inherited from another title.

Candidate universe retained/expanded:
- BIG, REG, total bonus.
- Parallel watermelon + Gil BIG, parallel watermelon + red7 BIG, diagonal watermelon + red7 BIG, cherry + REG.
- Watermelon bonus simultaneous-hit expectation, cherry bonus simultaneous-hit expectation.
- DC non-specific-square rare-role treasure acquisition.
- AT REG -> Druaga BIG point acquisition.
- REG BGM `イシターの復活` = setting 2+ evidence.

Dependency notes:
- BIG/REG/total are aggregate-related.
- Specific overlap bonuses are strict subsets of bonus counts and must not be independently multiplied without a dependency model.

## スマスロ 東京リベンジャーズ

Observability/denominator findings:
- Public machine-specific analysis explicitly recommends counting common bell only during normal play because AT push-order navigation can produce indistinguishable bell appearances.
- A machine-specific setting tool separately requests `通常G数` and `通常時共通ベル回数`, matching that denominator contract.

Candidate universe expanded:
- Initial-hit total, Tokyo Manji RUSH first-hit, MIDNIGHT MODE, Kisaki conspiracy.
- Normal common bell, middle cherry.
- Decisive-battle-eve noise rate at 3/4 cycles and at 5 cycles.
- Tokyo Manji Chance 2-3 throughs -> REVENGE freeze, excluding long freeze.
- Tokyo Manji Chance / Tokyo Manji RUSH end screens: default, odd indication, even indication, high-setting weak, high-setting strong, setting 2+, 3+, 4+, 5+, 6.
- EPISODE / long-freeze episode / ending fixed screens are non-setting fixed outcomes and must be excluded from setting evidence.
- Ending rare-role PUSH top-lens colors: odd, even, odd-high, even-high, setting 6.

Red-team notes:
- Gold group screen is setting 6 evidence in the ordinary end-screen context but appears fixed after ending, so context is mandatory.
- First-hit total, AT first-hit, CZ paths and cycle events are causally related and require dependency audit later.

## スマスロ バベル

Machine observability:
- Scorpion accumulated count can be checked on the sub display during normal play.

Candidates expanded:
- BIG, REG, total bonus, bonus first-hit.
- Weak cherry bonus hit: setting-dependent.
- Strong cherry bonus hit: setting-dependent.
- Scorpion 3rd/6th occurrence bonus hit: setting-dependent.
- Scorpion 10th occurrence: 100% hit across settings; non-discriminative but retained as a structural fact.
- Other scorpion occurrence hit: common low probability; retained as a structural fact.
- Scorpion-triggered heaven-preparation transition.
- Normal-B residence and mode-transition candidates.

Conditional denominator notes:
- Scorpion 3rd/6th success must use only eligible 3rd/6th occurrences as trials.
- Weak/strong cherry bonus hit requires role-specific opportunities, not total games.

## スマスロ 新鬼武者3

Candidates retained:
- AT first-hit.
- Weak rare role -> Onigiri Charge expectation, especially weak chance role.
- Normal reach-eye, high-state transition, back/裏 mode.
- Common bell candidate remains CONFLICT / UNRESOLVED.
- Special +4/+5/+6 evidence, repeated payout evidence, Oni Bonus character introduction, all-cast nav, AT-end screen, Entertrophy, ending rare-role voice.

Conflict status:
- Third-party AT/game-number claims remain inconsistent; no silent reconciliation is permitted.
- Linked service remains unresolved; manufacturer-family assumptions are not accepted as evidence.

## L主役は銭形5

Candidates and contracts expanded:
- Bonus first-hit.
- Normal-play Deka-me direct hit with strict `non-foreshadowing only` denominator condition.
- 333/1333 = 3+, 444/1444 = 4+, 555/1555 = 5+, 666/1666 = 6 evidence.
- Bonus-end Nagi stamps retained as setting evidence candidates.
- ST `Deka Time` end screen is a next-mode hint and must not be treated as setting evidence.
- Public analysis confirms that the previous ST end screen can be reviewed again from the menu, improving observability of the mode-hint candidate.
- 打-WIN LITE hidden Nagi voice remains linked-service evidence candidate; 1000G milestone semantics remain subject to exact machine-specific confirmation.

Settings are structurally 2/3/4/5/6 only.

## スマスロ とある科学の超電磁砲2

Candidates expanded:
- AT first-hit, GJ CZ, upper CZ `婚后光子と知っての挑戦ですの`, CZ total.
- AT end screens: default, even indication, non-setting Eternal Party return indication, setting 2+, high-setting weak, high-setting strong, setting 3+, 4+, 5+, 6.
- Fujimaru Coin at AT end: bronze 2+, silver 3+, gold 4+, DANGER 5+, rainbow 6.
- Existing episode-bonus direct hit, state-transition, coin-preparation, CZ-success and post-AT candidates retained.

Red-team notes:
- The `大切な友達C` screen is a return/引き戻し indication rather than a setting indication and must be kept outside setting evidence.
- CZ total and type-specific CZs are aggregate/subset related.

## L 絶対衝激Ⅳ

Candidates retained/expanded:
- AT `Platonic Time` first-hit and bonus probability.
- Night-stage lottery, black-high transition, bonus direct hit.
- Absolute Zone special move, Platonic Bonus end screen, payout display, Dynamite trophy, ending rare-role setting hint.

Identity red-team:
- This machine is distinct from existing `L 絶対衝激～PLATONIC HEART～`; old-machine values are excluded.

Dependency notes:
- Bonus and AT paths are related; do not multiply both naively.

## Lパチスロ 革命機ヴァルヴレイヴ2

Candidates retained:
- AT first-hit.
- CZ/bonus end-screen distribution under customization OFF.
- Purple/silver/gold lower-bound evidence.
- AT/upper-AT end display/photo setting 6 evidence.
- AT-start +22/+44/+66G evidence.
- Round-start screen, Magius mark, payout, BAR-alignment direct hit, special table, sub-monitor, repeated-number G hints.

Conditional-context note:
- End-screen distribution inference is invalid when hall-side customization state is unknown; exact lower-bound evidence can still be modeled if the evidence meaning itself is unaffected.

Settings are structurally 1/2/4/5/6 only.

## スマスロネオプラネット

Linked-service status:
- SloPla NEXT support for this exact machine is confirmed by Yamasa NEXT.
- Official site confirms the machine was added to the play-support ecosystem, but exact Neo Planet result-field inventory remains unresolved.

Candidates retained/expanded:
- BIG, REG, total.
- Mode F reset-only non-rare-role per-game high transition.
- Mode-specific bonus appearance.
- Post-bonus 101/301G touch-constellation evidence.
- Bonus end screen, Kerotto trophy, payout evidence.

Conditional/reset notes:
- Mode F candidate is valid only under setting-change/reset scope; mixing ordinary post-bonus play would invalidate the denominator.
- 101/301G touch evidence requires reaching the specified post-bonus game and executing the touch action.

Settings are structurally 1/2/4/5/6 only.

## Cross-machine pass-2 red-team summary

- No Selection decisions were made.
- Context-fixed screens are separated from setting screens where known.
- Aggregate/subset relationships remain explicit for later dependency audit.
- Conditional denominators are now explicit for Azur Lane Akashi Challenge, Tokyo Revengers common bell, Babel scorpion/cherry events, Zenigata5 Deka-me, VVV2 customization-sensitive end screens and Neo Planet Mode F.
- Linked-service existence is now confirmed for Azur Lane (ぱちログ), Druaga/Babel (UniMemo), Zenigata5 (打-WIN LITE evidence flow), and Neo Planet (SloPla NEXT). Tokyo Revengers machine-specific normal-game observability is supported by public analysis, but a full My Slot result-field inventory is not yet treated as complete.
- Remaining linked-service unknowns do not justify user-side work yet; web/manual investigation should continue first.
