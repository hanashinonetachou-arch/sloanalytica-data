# 2026-09-07 Next10 Research Universe repair progress

Isolated branch: `audit/20260907-next10-research-universe`
Baseline: `prototype-multi-machine@8ac2535dfb323d9efedbab897df11e875776ee55`

## Canonical Research + Selection repaired

1. `L_SHINUCHI_YOSHIMUNE_A1`
   - Research: recovered 抜刀メーターMAX時・抜刀チャンス当選率, 柳生選択率, AT終了画面complete distribution.
   - Selection: 2 -> 5 evaluated; hard-screen categories deduped from probability feature.
   - commits: `f3adc607c79c17a5701b0b4ed519cc0020df5752`, `c3650b10186ce04662a2e0039bd0eb82046d7d6d`.

2. `L_KYOKOU_SUIRI_ST`
   - Research: 3 -> 12 numeric features; common-bell conditional draw, first episode, episode clear, end-screen distribution, direct bonus, state/ceiling candidates.
   - Selection: 12 evaluated / 7 selected / 5 excluded with explicit reasons.
   - commits: `ef2b8176498d9ccd6523f41322dc4ad7c0ce4344`, `55db3bab242d9fdf2c9fa0c1173dc2827344f300`.

3. `L_GUNDAM_UNICORN_KAKUSEI_DRIVE_2JA`
   - Research: corrected candidate identity to `スタンバイ状態移行時のキャラ男女振り分け`; 60/40 odd-even complete distribution.
   - Selection: 2 -> 3 evaluated; standby gender INCLUDE_SUPPORT.
   - commits: `6c7805b5300e07ba26a8e008a4ce1658cf881226`, `55ff17779d9f19b986f56ced152f0f87c7f612f3`.

4. `L_JORMUNGAND_ND01G`
   - Research: recovered mode+role CZ rates, 450G short-ceiling selection, confirmed-CZ rate, Shame Century start success.
   - Selection: 3 -> 12 evaluated / 3 selected / 9 excluded. Latent state, censoring and failure-only reveal are explicit user-facing exclusion reasons.
   - commits: `2b11e1af9fa769fcdd2378aeac2ae18901fe708e`, `65ef83626a6f583a674dcf3f495954581a748cd1`.

5. `L_MILLION_GOD_KISEKI_CX`
   - Research: recovered lowA/B/heaven-prep and normal-mode non-rare GG rates; corrected current NanaPress setting source URL.
   - Discovery explicitly records blue7 3/4-chain as numeric-insufficient for settings3-6, 5-chain as no setting difference, Gaia Z-ZONE as setting1-only numeric.
   - Selection: 2 -> 4 evaluated / 2 selected / 2 excluded due latent internal-mode denominator.
   - commits: `676aa0e05f0ab6ebaa5843488a20e1deb41ca7e4`, `9c17870e2d08ab390365f7a3084d95cbd582100e`.

6. `LB_TRIPLE_CROWN_SEVEN_FG`
   - Research: recovered Special trophy direction distribution, BB/RB music rates, RB-end LED distribution + hard evidence, cherry-overlap bonus rates, BT replay+BB.
   - Selection: 4 -> 11 evaluated / 6 selected / 5 excluded. Overlap bonus components and RB LED probability are explicitly deduped.
   - commits: `67c05c8aaa40ec60ec7a621024ca74f39fdec7a1`, `b0542b0e5f9affad43409c588fa86c8a880d078c`.

## Remaining canonical repairs

### `L_FIRE_FORCE_2`
Fresh re-audit confirms a transfer gap: normal bonus-end-screen probabilities are public, not only hard evidence.
- REG / Accel / 灰焰 distribution (default, weak, strong, 4+, 5+, 6) is fully published for settings1-6.
- 炎炎BONUS has a separate fully published settings1-6 distribution.
- Must create bonus-type-specific multinomial Research features; hard categories remain Evidence and must be excluded from probability feature likelihood to avoid double count.
- 有利区間リセット時の炎炎大戦/紅J大戦 is high-setting favored but exact six-setting rates remain unpublished: keep NUMERIC_INSUFFICIENT.

### `L_UMINEKO_2_A1`
Fresh re-audit confirms multiple numeric-universe gaps:
- logo flash small/large complete distribution.
- 1枚役B / 1枚役C / 確定役A setting-specific rates.
- ART-only common bell in addition to existing ART miss.
- 11 specific overlap bonuses and setting-specific simultaneous-win expectations.
- cycle-ceiling Truth Point 30/50/70/200 distribution.
- CZ inheritance-duration distribution.
Dependency design is required before canonical write: small roles and specific bonuses share/nest information with total bonus; same-color BIG miss Truth Point is the exact complement of existing Lv2-nav rate and must not be double-counted.

### `L_KABANERI_UNATO_KESSEN_XX`
- ST-end `無名&菖蒲` = setting6 Hard Evidence; appearance rate is daily-total-game-band dependent and must not be a simple setting-only multinomial.
- 456OVER = setting4+, 666OVER = setting6; Research Evidence transfer required if missing.
- character intro `美馬` = setting4+; male/female are qualitative setting tendencies but full per-setting distribution is not public.
- CZ rate / 景之ST loop remain NUMERIC_INSUFFICIENT; do not invent values.

### `L_AKUDAMA_DRIVE_TP`
No additional six-setting numeric probability feature was found beyond current Research feature set.
- CZ-end voice is CZ-mode indication, not setting difference.
- ST-end ordinary patterns are odd/even/high-setting qualitative indications without published per-setting distribution.
- `PUSH変化なし` = setting4+ is already represented as Hard Evidence.
- phase/CZ-mode transition tables are state-system behavior, not confirmed setting-difference features in the checked public sources.

## Validation / safety

- public data `main` untouched.
- `prototype-multi-machine` untouched by this audit branch.
- App PR #42 remains unmerged; no runtime/code changes were made by this audit.
- Container-side `git clone` validation could not run because the container has no external DNS access to github.com. Run repository validators through GitHub Actions after all 10 canonical Research/Selection repairs are complete; do not weaken validators.
- Observation/UI Design/MachineData regeneration has NOT started; canonical Research/Selection must finish first.
