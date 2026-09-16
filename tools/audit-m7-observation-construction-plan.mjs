#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const AUDIT_DATE = "2026-09-16";
export const BASE_HEAD = "c9ca6a016599e931175065e3311f7b4116cf7632";
export const INPUT = "reports/m7-phase2-2-controlled-lineage-workqueue-20260916.json";
export const UNIQUE_CLASSES = ["EXACT_UNIVERSE_CONFIRMED_BY_REPOSITORY_ARTIFACT","HUMAN_CONFIRMATION_REQUIRED","OBSERVATION_UNIVERSE_MISMATCH","OBSERVATION_REDESIGN_OR_SPLIT_REQUIRED","RESEARCH_OR_SELECTION_REOPEN_REQUIRED"];
export const CONSTRUCTION_PATTERNS = ["SINGLE_DISCRETE_EVIDENCE_OBSERVATION","MULTIPLE_INDEPENDENT_EVIDENCE_OBSERVATIONS","BOOLEAN_OR_OCCURRENCE_OBSERVATION","COUNT_OR_NUMERIC_OBSERVATION","CONTEXT_DEPENDENT_OBSERVATION","COMPOSITE_OBSERVATION_REQUIRES_REDESIGN","UPSTREAM_CONTRACT_REVIEW_REQUIRED"];

const readJson = f => JSON.parse(fs.readFileSync(f,"utf8"));
const uniq = xs => [...new Set((xs??[]).filter(Boolean))].sort();
const countBy = (rows,key,names) => Object.fromEntries(names.map(n=>[n,rows.filter(r=>r[key]===n).length]));
const nonDiagnosticText = o => JSON.stringify({sourceRefs:o?.sourceRefs??[],notes:o?.notes??null,semanticNote:o?.semanticNote??null,definitionEquality:o?.definitionEquality??null,sourceEvidenceIds:o?.sourceEvidenceIds??[],researchEvidenceIds:o?.researchEvidenceIds??[]});

function exactExplicitSet(observation, selected) {
  const text=nonDiagnosticText(observation);
  return selected.length>0 && selected.every(id=>text.includes(id));
}
function classifyUnique(root,row) {
  const obsPath=path.join(root,`research/${row.machineId}/machine-observation-data.json`);
  const data=readJson(obsPath), id=row.candidateObservationIds?.[0], obs=(data.observations??[]).find(o=>o.observationId===id);
  const exact=obs && exactExplicitSet(obs,row.selectedSourceEvidenceIds??[]);
  return {...row,exactUniverseClassification:exact?"EXACT_UNIVERSE_CONFIRMED_BY_REPOSITORY_ARTIFACT":"HUMAN_CONFIRMATION_REQUIRED",classificationBasis:exact?"Explicit selected Research Evidence IDs are all present in non-diagnostic Observation lineage fields.":"Repository does not explicitly enumerate the complete selected Research Evidence set in non-diagnostic Observation lineage fields; names, labels and categories are not proof.",formalProofEstablished:false,nextAction:exact?"Independent review is still required before any production formalization.":"Obtain authoritative human/artifact confirmation of exact semantic-universe equality before formalization."};
}

function patternFor(row) {
  const s=`${row.groupId} ${(row.selectedSourceEvidenceIds??[]).join(" ")}`.toUpperCase();
  const context=/END|ENDING|BONUS|AT_|REG|BIG|CZ|START|SCREEN|VOICE|PANEL/.test(s);
  const numeric=/COUNT|PAYOUT|KILL|枚|NUMBER|NUMERIC/.test(s);
  const discrete=/TROPHY|SCREEN|VOICE|STAMP|PANEL|CHAR|COLOR|COLOUR|ENDING|END_|_END|PAYOUT|DISPLAY|CARD|IMAGE|SEIRYU|SUZAKU|BYAKKO|GENBU/.test(s);
  if (numeric && !/TROPHY/.test(s)) return {constructionPattern:"COUNT_OR_NUMERIC_OBSERVATION",recommendedObservationCount:"UNDETERMINED",basis:"Structural token suggests a numeric/count-like observation, but semantic review is required before design."};
  if (discrete && context) return {constructionPattern:"CONTEXT_DEPENDENT_OBSERVATION",recommendedObservationCount:1,basis:"Structural tokens suggest a discrete result observed in a specific context; this is planning-only and not lineage proof."};
  if (discrete) return {constructionPattern:"SINGLE_DISCRETE_EVIDENCE_OBSERVATION",recommendedObservationCount:1,basis:"Structural tokens suggest a discrete evidence result; semantic review is required before production design."};
  return {constructionPattern:"UPSTREAM_CONTRACT_REVIEW_REQUIRED",recommendedObservationCount:"UNDETERMINED",basis:"Machine-readable topology establishes no Observation candidate and structural tokens are insufficient for safe design classification."};
}

export function auditObservationConstructionPlan(root) {
  const input=readJson(path.join(root,INPUT));
  const uniqueRows=input.groups.filter(r=>r.observationTopology==="EXISTING_UNIQUE_OBSERVATION_CANDIDATE").map(r=>classifyUnique(root,r));
  const missingRows=input.groups.filter(r=>r.observationTopology==="NO_EXISTING_OBSERVATION_CANDIDATE").map(r=>{const p=patternFor(r); return {...r,...p,classificationBasis:"STRUCTURAL_HEURISTIC_REVIEW_REQUIRED",semanticUniverseSummary:`Selected Research Evidence IDs: ${(r.selectedSourceEvidenceIds??[]).join(", ")}`,observationContext:"REQUIRES_SEMANTIC_REVIEW",answerOrValueShape:p.constructionPattern==="COUNT_OR_NUMERIC_OBSERVATION"?"NUMERIC_OR_COUNT_REVIEW_REQUIRED":p.constructionPattern==="SINGLE_DISCRETE_EVIDENCE_OBSERVATION"||p.constructionPattern==="CONTEXT_DEPENDENT_OBSERVATION"?"DISCRETE_OPTIONS_REVIEW_REQUIRED":"UNDETERMINED",repositoryEvidence:r.inspectedArtifacts??[],blocker:r.blocker??null,nextAction:"Review Research/Selection semantics and design the Observation without inferring lineage from labels/categories.",formalProofEstablished:false};});
  const machineCounts={}; for (const p of CONSTRUCTION_PATTERNS) machineCounts[p]=new Set(missingRows.filter(r=>r.constructionPattern===p).map(r=>r.machineId)).size;
  const multiMachine=[...new Set(missingRows.map(r=>r.machineId))].map(machineId=>({machineId,groupCount:missingRows.filter(r=>r.machineId===machineId).length,groupIds:missingRows.filter(r=>r.machineId===machineId).map(r=>r.groupId)})).filter(x=>x.groupCount>1).sort((a,b)=>b.groupCount-a.groupCount||a.machineId.localeCompare(b.machineId));
  const batches=[
    {batchId:"B1_UNIQUE_CANDIDATE_CONFIRMATION",purpose:"Resolve the 10 unique existing Observation candidates by exact-universe confirmation only.",groupCount:uniqueRows.length,machineCount:new Set(uniqueRows.map(r=>r.machineId)).size,requiredHumanDecision:true,requiredExternalResearch:false,requiredFieldVerification:false,productionMutationAllowedAfterApproval:"Lineage annotation only for individually confirmed exact-universe rows.",stopConditions:["No exact-universe proof","Universe mismatch","Research/Selection reopen"]},
    {batchId:"B2_DISCRETE_CONTEXT_DESIGN",purpose:"Design candidate Observation structures for structurally clear discrete/context rows; no lineage formalization.",groupCount:missingRows.filter(r=>["SINGLE_DISCRETE_EVIDENCE_OBSERVATION","CONTEXT_DEPENDENT_OBSERVATION"].includes(r.constructionPattern)).length,machineCount:new Set(missingRows.filter(r=>["SINGLE_DISCRETE_EVIDENCE_OBSERVATION","CONTEXT_DEPENDENT_OBSERVATION"].includes(r.constructionPattern)).map(r=>r.machineId)).size,requiredHumanDecision:true,requiredExternalResearch:false,requiredFieldVerification:false,productionMutationAllowedAfterApproval:"Observation design only after semantic review.",stopConditions:["Ambiguous context","Multiple independent observations required","Upstream contract issue"]},
    {batchId:"B3_NUMERIC_AND_UNRESOLVED_REVIEW",purpose:"Resolve numeric/count and structurally indeterminate rows before any Observation construction.",groupCount:missingRows.filter(r=>!["SINGLE_DISCRETE_EVIDENCE_OBSERVATION","CONTEXT_DEPENDENT_OBSERVATION"].includes(r.constructionPattern)).length,machineCount:new Set(missingRows.filter(r=>!["SINGLE_DISCRETE_EVIDENCE_OBSERVATION","CONTEXT_DEPENDENT_OBSERVATION"].includes(r.constructionPattern)).map(r=>r.machineId)).size,requiredHumanDecision:true,requiredExternalResearch:"Only if repository semantics are insufficient.",requiredFieldVerification:"Only if observation method cannot be established from repository artifacts.",productionMutationAllowedAfterApproval:false,stopConditions:["Repository semantics insufficient","External/field verification required","Upstream contract issue"]}
  ];
  return {schemaVersion:"m7-phase2.2-observation-construction-plan-v1",auditDate:AUDIT_DATE,baseHead:BASE_HEAD,authoritativeInput:INPUT,policy:{scope:"Planning/diagnostic only; no production Research, Selection, Observation, canonical UI, MachineData, runtime, distribution, or validator mutation.",formalProof:"Binary only; this plan never formalizes proof.",labelCategoryRule:"Labels/categories/names/appearance are diagnostic only and never proof.",classificationRule:"Construction-pattern heuristics are planning aids only and require semantic review before production mutation.",realDevice:"No real-device verification is claimed."},summary:{controlledLineageGroupCount:input.groups.length,uniqueCandidateCount:uniqueRows.length,noCandidateCount:missingRows.length,affectedMachineCount:new Set(input.groups.map(r=>r.machineId)).size,uniqueClassificationCounts:countBy(uniqueRows,"exactUniverseClassification",UNIQUE_CLASSES),constructionPatternGroupCounts:countBy(missingRows,"constructionPattern",CONSTRUCTION_PATTERNS),constructionPatternMachineCounts:machineCounts,multipleUnresolvedGroupMachineCount:multiMachine.length,formalProofEstablishedCount:[...uniqueRows,...missingRows].filter(r=>r.formalProofEstablished).length},uniqueCandidateReview:uniqueRows,noCandidateConstructionPlan:missingRows,multipleUnresolvedGroupsByMachine:multiMachine,batches};
}

export function markdownReport(r) {
  const s=r.summary, lines=[`# M7 Phase 2.2 Observation construction plan — ${r.auditDate}`,"",`Base HEAD: \`${r.baseHead}\`. Planning/diagnostic only; no production mutation or formal proof.`,"","## Summary","",`- Controlled lineage groups: ${s.controlledLineageGroupCount}`,`- Unique existing candidates: ${s.uniqueCandidateCount}`,`- No existing candidate: ${s.noCandidateCount}`,`- Formal proof established by this audit: ${s.formalProofEstablishedCount}`,"","## Unique candidate review","","| Machine | Group | Candidate | Classification |","|---|---|---|---|"];
  for (const x of r.uniqueCandidateReview) lines.push(`| ${x.machineId} | ${x.groupId} | ${(x.candidateObservationIds??[]).join(", ")} | ${x.exactUniverseClassification} |`);
  lines.push("","## Construction pattern counts","","| Pattern | Groups | Machines |","|---|---:|---:|"); for (const p of CONSTRUCTION_PATTERNS) lines.push(`| ${p} | ${s.constructionPatternGroupCounts[p]} | ${s.constructionPatternMachineCounts[p]} |`);
  lines.push("","## Safety note","","Construction-pattern classification is structural planning only. Every row requires semantic review before production Observation creation; no label/category/name correspondence establishes lineage.","");
  return `${lines.join("\n")}\n`;
}

if (process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
  const root=process.cwd(), report=auditObservationConstructionPlan(root);
  if (process.argv.includes("--write")) { const stamp=AUDIT_DATE.replaceAll("-",""); fs.writeFileSync(path.join(root,"reports",`m7-phase2-2-observation-construction-plan-${stamp}.json`),`${JSON.stringify(report,null,2)}\n`); fs.writeFileSync(path.join(root,"reports",`m7-phase2-2-observation-construction-plan-${stamp}.md`),markdownReport(report)); }
  console.log(JSON.stringify(report.summary,null,2));
}
