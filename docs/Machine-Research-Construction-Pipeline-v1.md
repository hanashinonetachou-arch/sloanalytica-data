# Machine Research & Construction Pipeline v1

Status: adopted pilot flow (2026-09-20)

## Purpose
Build a machine package by construction rather than repairing it through a later fleet audit.

## Ordered stages
1. Research
2. Data Completeness
3. Denominator / Trial Universe
4. Exposure
5. Dependency
6. Selection
7. Evidence Research
8. Linked Play Data Research
9. Predecessor Observation Research (pure A-type standard; otherwise NOT_REQUIRED)
10. Observation
11. HighLowDiscrimination
12. Canonical UI
13. MachinePackage
14. Machine Research Summary

## Core rules
- Public-value completeness and usefulness for inference are separate decisions.
- SelectionScore = IG7000 * 200. CORE >=20; SUPPORT >=10; JOINT_ELIGIBLE >=5; below 5 REJECT.
- A standalone feature needs IG7000 >=0.05 bit. Joint participation needs >=0.025 bit and the joint feature must reach >=0.05 bit.
- Dependent observations are never naively multiplied.
- Input burden is not a Selection criterion.
- Evidence is researched during Research but is not scored by Numeric SelectionScore.
- Evidence UI is grouped by natural Observation Context, not by generic "setting hint" categories.
- Linked play data is researched only after Selection and only as an Observation source for adopted information.
- UNKNOWN exposure must never be converted into fabricated 7000G trials.
- HighLowDiscrimination evaluates LOW=settings 1-2 vs HIGH=settings 5-6 at 1500/3000/7000G. Settings 3-4 are excluded only from this evaluation, not from the inference engine.
- Canonical UI consumes Selection + Observation; it must not re-decide Selection.
- Research Complete, Selection Complete, Observation Complete, Canonical UI Complete and MachinePackage Complete are distinct statuses.

## Required machine artifacts
- research-data.json
- selection-data.json
- observation-data.json
- high-low-discrimination-report.json
- canonical-ui.json
- machine-package.json
- machine-research-summary.json

## Completion gate
A machine is MachinePackage Complete only when all required artifacts exist, no unresolved item blocks an adopted feature/evidence, Observation is feasible, and Canonical UI represents all adopted observable information.

## Pilot reference machines
- L_GOBLIN_SLAYER_RD
- L_LOVEJOU3_M4
- L_SMASLO_KAIJI_KYOEN_FJ

These three machines are the first end-to-end reference set for this pipeline.
