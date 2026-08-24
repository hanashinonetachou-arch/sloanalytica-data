# Observation Engine v1

## Purpose
Observation Engine sits between Selection and UI Design. Selection decides which statistical information is useful. Observation decides how a real user can obtain that information from the machine, store display, linked service, or direct play. UI Design then turns those observations into practical inputs.

Pipeline: `Research -> Selection -> Observation -> UI Design -> MachineData -> Audit -> Field Test -> UI Lock`.

## Required source coverage
Every v2 file records all six coverage areas: `machineMenu`, `dataCounter`, `linkedService`, `directPlay`, `endEvent`, `seatedState`.

Allowed statuses are `FOUND`, `CHECKED_NONE`, `UNRESOLVED`, `VERIFIED_ON_MACHINE`.

`UNRESOLVED` is not a publish blocker by itself. It must remain explicit and, where field confirmation is useful, be represented by a `fieldVerificationItems` entry so it can be exported later.

## Observation principles
1. Observation is not required to be one-to-one with a Selection Feature. One feature may require multiple observations, and one observation may support multiple features.
2. Store data-counter availability varies by store. If a value can be entered safely, UI may offer it as an optional source; accuracy is the user's responsibility.
3. Linked-service availability is an acquisition method, not a requirement. UI should remain usable for users who choose manual observation whenever practical.
4. If a setting-dependent event is observable and counting it through a full-day session has statistical meaning, retain it as an Observation candidate even when users may choose not to collect it.
5. Values needed by Selection do not have to be user inputs. Derived values should be calculated from easier observations when possible.
6. Do not invent unavailable machine-menu or linked-service details. Keep them `UNRESOLVED` and continue the pipeline.
7. A Research reopen is reserved for cases where Observation discovers a factual/statistical gap that prevents safe mapping. UI uncertainty alone does not require Research reopen.

## Mapping types
- `EXACT`: observation directly supplies the feature quantity.
- `DERIVABLE`: feature quantity is deterministically derived from observations.
- `COMBINABLE`: multiple observations jointly form the feature quantity.
- `OPTIONAL_SOURCE`: usable only when that acquisition source is available/accurate.
- `INCOMPATIBLE`: observation cannot safely represent an adopted feature; this is a pipeline error.
- `UNRESOLVED`: mapping is not yet established. It may proceed only as explicit unresolved work and must not masquerade as confirmed inference data.

## UI Design handoff
`ui-design-data.json.generatedFrom.observation` must point to the machine's `machine-observation-data.json`.

UI Design chooses widgets from observation behavior rather than unit alone. Examples from pilots:
- progressively accumulated excluded games can use direct input plus `-/+`;
- a derived REG total can remain hidden while inference uses it;
- seated/start-only information can be collapsible;
- Selection's required denominator can be represented as `base games - excluded games` rather than asking the user to enter the final denominator.

## Field verification CSV
Run `npm run observation:unresolved:csv` (or the underlying tool) to export unresolved source coverage, unresolved observations/mappings, and `WAITING_FOR_MACHINE` items. Filters `--from-id=` and `--to-id=` use provisional registration IDs.

## Four-layer batch gate
For new batches, every machine must have Research, Selection, Observation v2, and UI Design before the batch is considered ready. `PASS_WITH_UNRESOLVED` is acceptable; missing Observation or a Selection-adopted feature without an Observation mapping is not.
