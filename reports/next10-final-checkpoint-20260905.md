# SloAnalytica 2026-09-05 Next10 Final Checkpoint

## Status

- Batch stage: Real-device Verification complete / final prototype integration candidate
- User real-device review: PASS after reviewed corrections
- Main branch: not touched
- Target prototype branch: `prototype-multi-machine`

## Batch machines

1. L_IZA_BANCHO_SB8
2. L_ZETTAI_SHOGEKI_PLATONIC_HEART_TK
3. L_WATASHI_NO_SHIAWASE_NA_KEKKON_PN
4. LB_TRIPLE_CROWN_SF4
5. LB_MATADOR_3_TT
6. L_TENSEI_SHITARA_KEN_DESHITA_GT
7. L_DARLING_IN_THE_FRANXX_SA
8. L_SAKI_CHOJO_KESSEN_YR
9. S_KONOSUBA_ZR
10. S_RAKUEN_TSUHO_FS

## Final reviewed corrections

- Konosuba: emergency-quest opponent distribution adopted as SUPPORT; quest-rank success and bath initial points retain detailed user-facing rejection reasons.
- Triple Crown: BIG / REG / cherry / plum share one normal-game denominator and one merged input section.
- Matador III: BB / RB share one normal-game denominator and one merged input section.
- Rakuen Tsuiho: MySlot common-bell denominator wording clarified.
- User-facing selection/rejection wording cleaned of internal pipeline terminology.
- Reviewed source Research / Selection / Observation / UI data synchronized so regeneration does not revert field-tested MachineData.
- MachineData builder corrected to honor `machine.inferenceSettings` when materializing numeric feature probabilities and required-trial comparisons. This resolves the verified LB 1000-chan setting-H exclusion contract without discarding the researched setting-H facts or Evidence.

## Cumulative prototype data restoration

- Verified device baseline before this batch: 210 machines.
- Current batch: 10 machines, IDs 211–220.
- Final catalog candidate: 220 unique machines.
- Nine prior verified Sep03 machines missing from the stale prototype base were restored from their exact verified package revisions.
- Catalog package URLs are normalized to `prototype-multi-machine` package paths.
- Machine registry synchronized to catalog membership.
- Difficulty Catalog synchronized and checked for 220/220 coverage.

## Automated verification

Finalization workflow: `Finalize 20260905 Next10 Research Batch v11`, run `33954408212`.

Passed:

- next10 ResearchData validation: 10 / 10
- next10 Observation validation: 10 / 10
- next10 UI Design validation: 10 / 10
- Selection Policy Migration: REVIEW 0 / BLOCKED 0 / reviewed historical safety removals 25
- public MachineData audit: 220 machines
- Machine Registry validation: PASS
- Difficulty Catalog coverage: 220 / 220
- full Node test suite: PASS
- catalog unique-count / package-hash / package-size / machineDataVersion / prototype URL checks: PASS

The public audit retains three pre-existing capability-detection warnings outside this batch (`L_MIDORIDON_VIVA_REVIVAL_FY`, `S_KABANERI_ZR` x2). They are not introduced by the next10 batch and did not block the 220-machine audit.

## Real-device checkpoint

The user verified all ten machines on the isolated 220-machine build. Follow-up corrections were applied and rechecked. The final Evidence/setting-confirmation issue was traced to the auto-generated fallback input route; the app now separates fallback Evidence into `設定確定演出`, collapsed by default, and the user confirmed the corrected APK on-device.

No additional ten-machine full-device rerun is required unless prototype integration itself changes runtime behavior.

## Integration readiness

The final data integration branch was compared against `prototype-multi-machine` after cleanup and is strictly ahead with `behind_by = 0`. The data prototype promotion must therefore be a fast-forward-only branch update, with no force update and no merge commit. `main` remains outside this batch.
