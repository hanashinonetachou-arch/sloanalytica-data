# SloAnalytica Current Batch Handoff

Updated: 2026-09-01
Batch: 20260901 Magia Record → Gundam SEED
Working branch: `batch/20260901-magia-gundamseed`
Stacked base: `batch/20260831-persona5-to-bio5` @ `9b8f7f05fb1d72f5d0b177f1adf00220adb2f136`
Current Draft PR: #149
Target integration branch: `prototype-multi-machine`

## Formal references

Latest Library-confirmed standards:
- `SloAnalytica_Core_Policy_v1_7.txt`
- `SloAnalytica_Research_Selection_Observation_Manifest_v6_9.txt`
- `SloAnalytica_MachineData_UX_Construction_Manifest_v6_9.txt`

## Gate status

Gate 0: `PASS_WITH_TRACKED_DISCOVERY_DEBT`.
Gate A / Research: **REOPENED — IN PROGRESS**.
Selection workspace has been prepared but Selection decisions are frozen until Gate A re-closes.

Reason for reopening: a second distribution/evidence red-team sweep, performed immediately after the first Gate-A pass, found previously undiscovered public setting-difference candidates. RSO v6.9 requires later discoveries to reopen the affected Research layer rather than silently continuing Selection.

## Registration / machine IDs

PR #148 owns production IDs 181-190. ID 191 is occupied by test-only `S_REVUE_STARLIGHT_CX_TEST_V66`; this production batch uses 192-201.

192 `L_MAGIA_RECORD_RN`
193 `L_GODZILLA_NS`
194 `L_USHIO_TORA_HAKUMEN_VH`
195 `L_AMAZING_LIVE_PD`
196 `L_YOSHIMUNE_SC2`
197 `L_MAHJONG_MONOGATARI_S2`
198 `L_IDOLMASTER_MILLION_LIVE_HC`
199 `L_YOUJITSU_DE`
200 `L_MIDORIDON_VIVA_REVIVAL_FY`
201 `L_GUNDAM_SEED_G`

## First Gate-A audit (now superseded as final gate decision)

GitHub Actions run `33473996001` passed ResearchData validation 10/10 and Discovery→Research 85/85, missing 0. That result remains valid for the then-current inventory but is no longer sufficient as the terminal Gate-A decision because the later Web→Discovery red-team found additional candidates.

## Newly discovered candidates requiring Research transfer

### Magia Record
- Bonus-end magic-girl mode full setting distribution exists and must be numeric/multinomial Research, not grouped pending.
- Episode Bonus character-selection full setting multinomial exists.
- Hard Evidence: BIG end swimsuit Mikazuki-so 2+, 2nd Season KV 4+, 1st Season KV 5+, small Kyubey 6; AT end Madoka&Iroha 6; story scenario 9/small Kyubey 5+; ending card Stage-Construction Witch 4+ plus setting-denial cards.
- Existing AT/end-of-advantageous-section mode distribution remains separate from Bonus-end distribution.

### Idolmaster Million Live! Next Prologue
- Bonus-end hard patterns: red 2+, purple 2+ (plus high-setting tendency), silver 3+, gold-4 motif 4+, gold-5 motif 5+, rainbow 6.
- Kerot Trophy semantics remain pending because Nana explicitly describes machine-specific meaning as under investigation and only shows prior-machine convention.

### Classroom of the Elite
- Bonus ending screen has a published full 2-category setting distribution: group picture / Kushida = 95.0/5.0, 94.9/5.1, 94.5/5.5, 94.2/5.8, 93.5/6.5, 93.0/7.0. Must be numeric multinomial Research under the distribution-table sweep rule.
- Hard Evidence: payout 246 = even set, 456 = 4+, 666 = 6; AT end special Horikita 2+, special Sakayanagi 4+, special Ryuen 5+, Ryuen vs Ayanokoji 6; Bonus-introduction denial/lower-bound pairs also publicly enumerated.

### Midoridon VIVA REVIVAL
- Hard Evidence: bonus-end girls 2+, all-members 4+, live-action Billy 6.
- Ending trick: Maria/Guukawa 2+, all-members 4+, Oyaji 5+, Aodon 6.
- XR failure touch-voice hard patterns require exact machine-source normalization; tendency voices remain non-hard.

### Mahjong Monogatari
- Stamp `可` = 2+ was missing; current 良/優/極 = 4+/5+/6 remain.
- Special hard patterns require decomposition: +44G 4+, +55G 5+, +66G 6, Haruruna PUSH 4+, hidden Nagi gold 6.
- Payout-number claims have source-confidence conflict in checked sources; keep unresolved/conflict unless reconciled, do not promote blindly.

### Gundam SEED
- Fresh sweep found missing purple screen `マリュー＆ムウ` = SET2 denied. Existing `クルーゼ＆ムウ` = SET3 denied + high-setting tendency, silver = 4+, gold = 6 remain.

### Godzilla / Ushio / Amazing / Yoshimune
- Godzilla second sweep corroborated multiple hard cue families (menu/operator/bonus/EX movie/trophy) and requires decomposition from grouped Research evidence.
- Ushio second sweep corroborated Dynamite Trophy exact lower-bound colors; decompose grouped candidate.
- Amazing: no additional trustworthy setting-specific screen family found in the second checked major-source sweep beyond SET_L panel; retain unresolved small-role publication debt.
- Yoshimune second sweep confirms ending PUSH voices are mode/1G-chain/other state cues, not setting hard evidence; Hanafuda remains the setting hard-evidence surface.

## Linked services

FOUND:
- Magia Record — UniMemo.
- Idolmaster — SloPla NEXT.
- Midoridon — UniMemo.

Other seven remain UNRESOLVED unless machine-specific primary evidence proves CHECKED_NONE.

## Next action

1. Patch ResearchData and discoveryInventory for all red-team discoveries above.
2. Decompose hard Evidence only where public wording is sufficiently explicit.
3. Re-run Research validation and Discovery→Research completeness on the enlarged inventory.
4. Record new discovered/transferred/missing counts and warnings.
5. Only then re-mark Gate A PASS and resume the already-prepared Selection batch `SELECTION_20260901053510`.
