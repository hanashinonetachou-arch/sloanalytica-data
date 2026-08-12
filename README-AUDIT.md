# Phase 9.4B-14 — Difficulty Analyzer Cross-Machine Review

Eight machines were reviewed as one calibration universe.

## Final ranking policy
Only `READY` machines receive final cross-machine Raw Score ranking.
`NOT_READY` values are exploratory only and cannot participate in future 0–100 normalization.
`NOT_APPLICABLE` means numeric Difficulty is structurally inappropriate, not “difficulty score = 1”.

## Main finding
The current Raw Score behaves monotonically and gives a plausible first ordering, but the universe is too small and heterogeneous for final 100-point normalization. Several machines have adopted inference Features explicitly excluded from game-based Difficulty because their trial units cannot be derived safely. Therefore the displayed score must eventually be accompanied by coverage/readiness context.

## READY current ordering at 7000G
My Juggler V 31
Code Geass 3 C.C.&Kallen ver. 26
I'm Juggler EX 25
Bakemonogatari 18
Mushoku Tensei 17

Tokyo Ghoul and Revue Starlight remain NOT_READY for final comparison.
Kaguya-sama is NOT_APPLICABLE / EVIDENCE_DOMINANT.

No normalization change is made in this phase.
