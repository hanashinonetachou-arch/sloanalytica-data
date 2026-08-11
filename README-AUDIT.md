# Phase 9.4B-7 Audit

- Added generic Numeric Inference Profile:
  - NORMAL
  - LIMITED
  - EVIDENCE_DOMINANT
  - NO_NUMERIC_INFERENCE
- Added generic rejected-Feature diagnostics with concise `rejectionReason` plus automatically computed `requiredTrials80` when mathematically available.
- Required trial counts are never invented when the ResearchData does not support computation.
- Kaguya BONUS initial is now rejected from inference because the numeric setting difference is not practically useful.
- Kaguya profile: `EVIDENCE_DOMINANT`.
- Kaguya presentation mode: `REJECTED_FEATURES_FIRST`.
- Kaguya BONUS initial rejection reason: `設定差が小さい。`.
- Kaguya BONUS initial 80% discrimination estimate: `423,584G`.
- Kaguya cross-machine Difficulty calibration readiness: `NOT_APPLICABLE` (intentional, not an error).
- EVIDENCE_DOMINANT machines no longer block cross-machine score calibration.
- Hard Evidence remains excluded from numeric Difficulty Score.
- Full test suite and validators passed.
