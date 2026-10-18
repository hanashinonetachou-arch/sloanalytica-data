# SloAnalytica — Research self-audit / model-design completion (2026-10-19)

**Public-source Research closure 10/10; Production reconciliation 0/10; formal Evaluation/Eligibility/Contract 0/10.**

Machine research was conducted sequentially, preserving a dedicated JSON per machine. Research close does not mean all probabilities were published, exact source scope exhaustive, or independent audit done.

| # | Machine | JSON | Candidate groups | Public Research | Repo comparison |
|---|---|---|---:|---|---|
| 1 | L ひぐらしのなく頃に 業 | `01_higurashi_gou.json` | 12 | Closed in verified public-source scope | Pending |
| 2 | L エヴァンゲリオン ～未来への創造～ | `02_eva_mirai.json` | 12 | Closed in verified public-source scope | Pending |
| 3 | スマスロ転生したらスライムだった件 | `03_tensura.json` | 16 | Closed in verified public-source scope | Pending |
| 4 | 戦国コレクション5超極楽LOOP | `04_senkore5_loop.json` | 10 | Closed in verified public-source scope | Pending |
| 5 | 麻雀格闘倶楽部 覚醒 | `05_mahjong_kakusei.json` | 6 | Closed in verified public-source scope | Pending |
| 6 | L009 RE:CYBORG | `06_009_recyborg.json` | 11 | Closed in verified public-source scope | Pending |
| 7 | L戦国乙女4 戦乱に閃く炯眼の軍師 | `07_otome4.json` | 16 | Closed in verified public-source scope | Pending |
| 8 | スマスロキン肉マン～7人の悪魔超人編～ | `08_kinnikuman.json` | 12 | Closed in verified public-source scope | Pending |
| 9 | スマスロ 戦国BASARA GIGA | `09_basara_giga.json` | 12 | Closed in verified public-source scope | Pending |
| 10 | ぱちスロ 乃木坂46 | `10_nogizaka46.json` | 23 | Closed in verified public-source scope | Pending |

## Open execution-stage items (not reason to reopen all Research)

- Reconcile all ten JSONs and candidate identifiers against current production repository and Manifest v8.5; retain existing candidate data. No Github writes have been made.
- `07_otome4.json`: source discrepancies for AT initial rate and AT direct chance; compare only disputed rows, document adopted definitions.
- `10_nogizaka46.json`: full 16-category map table is in source but not transcribed to machine-readable per-setting matrix; complete source-to-parameter transcription and validate sum before formal likelihood usage.
- `10_nogizaka46.json`: unusual setting 0 (no setting 3), confirm support by existing Contract / evaluator.
- Eligibility and statistical score not computed for any machine; no adoption decisions made.
- One-machine JSON candidates have different key shapes inherited from prior work, so Work must normalize without dropping fields.
- External independent audit not conducted; all audits are self-audits only.
- Public information missing or timing/state observationally unavailable is closed as unavailable, not kept in open-ended research.
- The user-designated standard site set was not exhaustively verified site-by-site for every machine: closure pertains only to actually consulted/recorded sources. Complete any strictly required contract-level site verification as a bounded gap check, do not claim it has been done.

## Next work

Repository latest production state → reconcile/import per-machine JSON → bounded validations for specific discrepancies / parameter transcription → Evaluation → Eligibility → Candidate Contract. No implementation, publishing, APK or QA unless separately instructed.
