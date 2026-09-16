#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const AUDIT_DATE = "2026-09-16";
export const BASE_HEAD = "229dddde617efb4e0427f08a3d5b2b324ad18d20";
export const INPUT = "reports/m7-phase2-2-lineage-resolution-plan-20260916.json";
export const TOPOLOGIES = ["EXISTING_UNIQUE_OBSERVATION_CANDIDATE","NO_EXISTING_OBSERVATION_CANDIDATE","MULTIPLE_EXISTING_OBSERVATION_CANDIDATES","OBSERVATION_REFERENCE_INCONSISTENCY"];
export const SOURCE_SET_SUBTYPES = ["SOURCE_SET_ABSENT","SOURCE_SET_PARTIAL","SOURCE_SET_SUPERSET","SOURCE_SET_DIFFERENT","SOURCE_SET_NOT_MACHINE_READABLE","EXACT_MACHINE_READABLE_SET_FOUND","NOT_APPLICABLE"];
export const DECISION_TYPES = ["CONFIRM_EXISTING_OBSERVATION_EXACT_UNIVERSE","CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED","SELECT_AMONG_MULTIPLE_OBSERVATIONS","RESOLVE_STRUCTURAL_REFERENCE_INCONSISTENCY","REVIEW_UNEXPECTED_EXACT_MACHINE_READABLE_SET"];

const readJson = file => JSON.parse(fs.readFileSync(file, "utf8"));
const uniq = values => [...new Set(values.filter(Boolean))].sort();
const same = (a,b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
function nonDiagnosticText(o) { return JSON.stringify({sourceRefs:o.sourceRefs??[],notes:o.notes??null,semanticNote:o.semanticNote??null,definitionEquality:o.definitionEquality??null}); }
function explicitSelectedIds(o, selected) { const text=nonDiagnosticText(o); return selected.filter(id=>text.includes(id)).sort(); }

function topologyFor(row, observations) {
  const ids=uniq(row.relevantObservationIds??[]);
  const present=ids.filter(id=>observations.some(o=>o.observationId===id));
  if (ids.length!==present.length) return {topology:"OBSERVATION_REFERENCE_INCONSISTENCY",candidateIds:present,missingReferenceIds:ids.filter(id=>!present.includes(id))};
  if (!present.length) return {topology:"NO_EXISTING_OBSERVATION_CANDIDATE",candidateIds:[],missingReferenceIds:[]};
  if (present.length===1) return {topology:"EXISTING_UNIQUE_OBSERVATION_CANDIDATE",candidateIds:present,missingReferenceIds:[]};
  return {topology:"MULTIPLE_EXISTING_OBSERVATION_CANDIDATES",candidateIds:present,missingReferenceIds:[]};
}

function sourceSetSubtype(row, candidate) {
  if (!candidate) return "NOT_APPLICABLE";
  const selected=uniq(row.sourceEvidenceIds??[]), explicit=explicitSelectedIds(candidate,selected), text=nonDiagnosticText(candidate);
  if (selected.length && same(explicit,selected)) return "EXACT_MACHINE_READABLE_SET_FOUND";
  if (explicit.length && explicit.length<selected.length) return "SOURCE_SET_PARTIAL";
  const mentioned=uniq(text.match(/(?:RESEARCH_)?EVI_[A-Z0-9_]+/g)??[]);
  if (mentioned.length>selected.length && selected.every(id=>mentioned.includes(id))) return "SOURCE_SET_SUPERSET";
  if (mentioned.length && mentioned.some(id=>selected.includes(id)) && !selected.every(id=>mentioned.includes(id))) return "SOURCE_SET_DIFFERENT";
  const hasLineageContainer=Array.isArray(candidate.sourceEvidenceIds)||Array.isArray(candidate.researchEvidenceIds)||candidate.definitionEquality!=null||candidate.semanticNote!=null;
  return hasLineageContainer ? "SOURCE_SET_ABSENT" : "SOURCE_SET_NOT_MACHINE_READABLE";
}
function decisionFor(topology, subtype) {
  if (topology==="OBSERVATION_REFERENCE_INCONSISTENCY") return "RESOLVE_STRUCTURAL_REFERENCE_INCONSISTENCY";
  if (topology==="NO_EXISTING_OBSERVATION_CANDIDATE") return "CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED";
  if (topology==="MULTIPLE_EXISTING_OBSERVATION_CANDIDATES") return "SELECT_AMONG_MULTIPLE_OBSERVATIONS";
  if (subtype==="EXACT_MACHINE_READABLE_SET_FOUND") return "REVIEW_UNEXPECTED_EXACT_MACHINE_READABLE_SET";
  return "CONFIRM_EXISTING_OBSERVATION_EXACT_UNIVERSE";
}
function stopCondition(decision) {
  return {
    CONFIRM_EXISTING_OBSERVATION_EXACT_UNIVERSE:"Stop until a human or authoritative artifact confirms that the unique Observation represents exactly the selected Research Evidence universe.",
    CREATE_OR_IDENTIFY_OBSERVATION_REQUIRED:"Stop until the correct Observation is created or authoritatively identified; do not infer it from labels/categories.",
    SELECT_AMONG_MULTIPLE_OBSERVATIONS:"Stop until a human resolves which Observation(s) represent the selected universe; do not auto-select by label similarity.",
    RESOLVE_STRUCTURAL_REFERENCE_INCONSISTENCY:"Stop until stale/missing Observation references are reconciled against the checked-in Observation artifact.",
    REVIEW_UNEXPECTED_EXACT_MACHINE_READABLE_SET:"Stop and review the unexpected exact machine-readable set; this audit must not formalize it automatically."
  }[decision];
}

export function auditControlledLineageWorkqueue(root) {
  const plan=readJson(path.join(root,INPUT));
  const target=(plan.unresolvedGroups??[]).filter(row=>row.resolutionClass==="SOURCE_EVIDENCE_SET_NOT_EXPLICIT"&&row.bulkAnnotationEligibility==="REQUIRES_HUMAN_LINEAGE_CONFIRMATION");
  const groups=target.map(row=>{
    const rel=`research/${row.machineId}/machine-observation-data.json`, data=readJson(path.join(root,rel)), observations=data.observations??[], topo=topologyFor(row,observations);
    const candidate=topo.candidateIds.length===1?observations.find(o=>o.observationId===topo.candidateIds[0]):null;
    const subtype=sourceSetSubtype(row,candidate), decision=decisionFor(topo.topology,subtype);
    return {machineId:row.machineId,groupId:row.groupId,selectedSourceEvidenceIds:uniq(row.sourceEvidenceIds??[]),currentObservationId:row.currentObservationId??null,relevantObservationIds:uniq(row.relevantObservationIds??[]),observationTopology:topo.topology,candidateObservationIds:topo.candidateIds,missingReferenceIds:topo.missingReferenceIds,sourceSetSubtype:subtype,humanDecisionRequired:decision,blocker:row.knownBlocker??null,inspectedArtifacts:uniq([...(row.inspectedArtifacts??[]),rel]),stopCondition:stopCondition(decision),currentState:"FORMAL_PROOF_NOT_ESTABLISHED",automationPossibleAfterConfirmation:decision==="CONFIRM_EXISTING_OBSERVATION_EXACT_UNIVERSE"?"Exact lineage annotation may be automated only after authoritative human confirmation.":"No lineage annotation automation is permitted until the stated decision/stop condition is resolved."};
  }).sort((a,b)=>a.machineId.localeCompare(b.machineId)||a.groupId.localeCompare(b.groupId));
  const map=new Map(); for (const row of groups) { const rows=map.get(row.machineId)??[]; rows.push(row); map.set(row.machineId,rows); }
  const machines=[...map].map(([machineId,rows])=>({machineId,unresolvedGroupCount:rows.length,groupIds:rows.map(r=>r.groupId),canReviewInOneSession:true,independentDecisionCount:rows.length,decisionTypes:uniq(rows.map(r=>r.humanDecisionRequired)),groups:rows})).sort((a,b)=>a.machineId.localeCompare(b.machineId));
  const count=(names,field)=>Object.fromEntries(names.map(name=>[name,groups.filter(row=>row[field]===name).length]));
  const excluded=new Set(["L_ASLOT_KONOSUBA_FX/KONOSUBA_BIG_END","L_SISTER_QUEST_CA/SMARTALK","S_TOARU_RAILGUN_FB/SETTING_EVIDENCE"]);
  const absorbed=groups.filter(r=>excluded.has(`${r.machineId}/${r.groupId}`));
  return {schemaVersion:"m7-phase2.2-controlled-lineage-workqueue-v1",auditDate:AUDIT_DATE,baseHead:BASE_HEAD,authoritativeInput:INPUT,policy:{scope:"Diagnostic human-confirmation work queue only; no Research, Selection, Observation, canonical UI, MachineData, runtime, distribution, or validator mutation.",formalProof:"Binary only. This work queue does not establish proof.",labelCategoryRule:"Labels/categories are never lineage proof and are not used to select candidates.",runtimeFields:"No runtime proof/sharing fields are introduced.",realDevice:"No real-device verification is claimed."},summary:{controlledLineageGroupCount:groups.length,affectedMachineCount:machines.length,topologyCounts:count(TOPOLOGIES,"observationTopology"),sourceSetSubtypeCounts:count(SOURCE_SET_SUBTYPES,"sourceSetSubtype"),decisionTypeCounts:count(DECISION_TYPES,"humanDecisionRequired"),unexpectedExactMachineReadableSetCount:groups.filter(r=>r.sourceSetSubtype==="EXACT_MACHINE_READABLE_SET_FOUND").length,accidentalMismatchAbsorptionCount:absorbed.length},groups,machines};
}

export function markdownReport(report) {
  const s=report.summary, lines=[`# M7 Phase 2.2 Controlled lineage work queue — ${report.auditDate}`,"",`Base HEAD: \`${report.baseHead}\`. Diagnostic work queue only; no formalization or production artifact mutation.`,"","## Summary","","| Metric | Count |","|---|---:|",`| Controlled-lineage groups | ${s.controlledLineageGroupCount} |`,`| Affected machines | ${s.affectedMachineCount} |`,`| Unexpected exact machine-readable sets | ${s.unexpectedExactMachineReadableSetCount} |`,`| Accidental mismatch-group absorption | ${s.accidentalMismatchAbsorptionCount} |`,"","### Observation topology","","| Topology | Count |","|---|---:|",...TOPOLOGIES.map(n=>`| ${n} | ${s.topologyCounts[n]} |`),"","### Source-set subtype","","| Subtype | Count |","|---|---:|",...SOURCE_SET_SUBTYPES.map(n=>`| ${n} | ${s.sourceSetSubtypeCounts[n]} |`),"","### Human decision type","","| Decision | Count |","|---|---:|",...DECISION_TYPES.map(n=>`| ${n} | ${s.decisionTypeCounts[n]} |`),"","## Machine-level queue",""];
  for (const m of report.machines) { lines.push(`### ${m.machineId}`,"",`Groups: ${m.unresolvedGroupCount}; independent decisions: ${m.independentDecisionCount}; one-session review: ${m.canReviewInOneSession?"yes":"no"}.`,"","| Group | Topology | Source-set subtype | Decision | Candidate Observation(s) | Stop condition |","|---|---|---|---|---|---|"); for (const r of m.groups) lines.push(`| \`${r.groupId}\` | ${r.observationTopology} | ${r.sourceSetSubtype} | ${r.humanDecisionRequired} | ${r.candidateObservationIds.map(id=>`\`${id}\``).join(", ")||"-"} | ${r.stopCondition.replaceAll("|","\\|")} |`); lines.push(""); }
  return `${lines.join("\n")}\n`;
}

if (process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
  const root=process.cwd(), report=auditControlledLineageWorkqueue(root);
  if (process.argv.includes("--write")) { const stamp=AUDIT_DATE.replaceAll("-",""); fs.writeFileSync(path.join(root,"reports",`m7-phase2-2-controlled-lineage-workqueue-${stamp}.json`),`${JSON.stringify(report,null,2)}\n`); fs.writeFileSync(path.join(root,"reports",`m7-phase2-2-controlled-lineage-workqueue-${stamp}.md`),markdownReport(report)); }
  console.log(JSON.stringify(report.summary,null,2));
}
