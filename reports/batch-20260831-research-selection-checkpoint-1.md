# Batch Research / Selection checkpoint 1 — 2026-08-31

Branch: `batch/20260831-persona5-to-bio5`

## Completed in this checkpoint

### Research numeric/source enrichment

- `S_PERSONA5_FR`
  - PERSONA CHANCE first-hit full setting values populated.
  - AT TAKE YOUR HEART first-hit full setting values populated.
  - Watermelon full setting values retained and cross-source matched.
  - MySlot observation route is now explicitly noted for watermelon because major analysis instructs counting it with MySlot.
  - Sammy Trophy evidence decomposed into 2+/3+/4+/5+/6 evidence entries.

- `L_SISTER_QUEST_CA`
  - Quest Battle CZ and Adventure RUSH AT full setting values populated and cross-source matched.
  - Monster ZONE stock probability populated (7.0% -> 12.5%).
  - AT-end screen setting distribution populated as multinomial data, including ordinary hint categories and lower-bound/6-confirm categories.
  - Payout, gacha and Smart TALK evidence decomposed into concrete setting constraints.
  - Smart TALK observation semantics clarified: question selection -> fixed game consumption -> answer -> repeatable sampling.

- `L_BIOHAZARD5_ZE`
  - AT first-hit, Panic Zone and CZ total full setting values populated.
  - Infection middle-line conditional entry and overall entry separated into distinct Research candidates.
  - Payout / Enter Trophy / AT-end / ending evidence decomposed into explicit allowed/denied settings.

## Initial Selection completed

SelectionData v1 created for:

1. `S_PERSONA5_FR`
2. `L_SISTER_QUEST_CA`
3. `L_BIOHAZARD5_ZE`

### Dependency-safe decisions

#### Persona5
- INCLUDE_PRIMARY: PERSONA CHANCE first-hit.
- INCLUDE_SUPPORT: watermelon.
- EXCLUDE for now: AT first-hit, because PC-derived AT is included and a separate direct-AT decomposition is not yet numerically complete.
- EXCLUDE for now: direct AT until complete setting values are secured.
- EXCLUDE: cherry by internal bonus state and internal-state transitions because denominator/state classification cannot be safely observed in ordinary play.

#### Sister Quest
- INCLUDE_PRIMARY: Adventure RUSH AT first-hit.
- INCLUDE_SUPPORT: Monster ZONE conditional stock probability.
- INCLUDE_SUPPORT: AT-end screen multinomial distribution.
- EXCLUDE: CZ first-hit from the same independent-likelihood stack to avoid strong causal overlap with AT first-hit.
- EXCLUDE: AT ceiling selection due incomplete observability.
- EXCLUDE pending numeric completion: AT monster composition.

#### Smart Biohazard 5
- INCLUDE_PRIMARY: AT Hazard Rush first-hit.
- INCLUDE_SUPPORT: Infection entry conditioned specifically on middle-line AT initial hit.
- EXCLUDE from the same likelihood stack: Panic Zone and CZ total because they form upstream/part-whole observations that feed AT first-hit.
- EXCLUDE: overall Infection entry when the conditional middle-line feature is used, preventing the same AT observation from being counted twice.

## Linked/built-in observation findings

- Persona5: major analysis explicitly recommends counting watermelon with `マイスロ`; therefore MySlot is a FOUND observation path for at least that counter. Exact machine-service result-field enumeration remains to be completed before Observation v2 finalization.
- Sister Quest: `スマコレ` -> `スマTALK` is a confirmed built-in observation route. The player selects a question, consumes a prescribed number of games, receives a message, checks answer text/color, and may repeat the process. This is not treated as an external linked-account service.
- Den-O: generic/current web search did not yet surface a reliable page enumerating the exact `ぱちログweb` result fields for the slot version. Keep service-detail status unresolved rather than inferring fields from brand-level capability.

## Validation status

- GitHub file/schema review completed against current `selection-data.schema.json` and current ResearchData schema.
- Repository-local `npm run research:validate`, `research:gate0`, `selection:validate`, statistics and batch gates have NOT yet run in this GitHub-only environment.
- Therefore this checkpoint is a content-construction milestone, not a substitute for local/CI validator PASS.

## Next

Continue the same process across the remaining seven machines, prioritizing complete setting-value tables, conditional denominator definitions and explicit Evidence decomposition before final Selection and Observation v2.