import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const INPUT='reports/m7-phase2-2-observation-construction-plan-20260916.json';
const OUT_JSON='reports/m7-phase2-2-single-discrete-evidence-review-20260916.json';
const OUT_MD='reports/m7-phase2-2-single-discrete-evidence-review-20260916.md';
const PATTERN='SINGLE_DISCRETE_EVIDENCE_OBSERVATION';
const CLASSIFICATIONS=new Set(['SAFE_CONSTRUCTION_CANDIDATE','HUMAN_SEMANTIC_CONFIRMATION_REQUIRED','UPSTREAM_CONTRACT_REVIEW_REQUIRED','OBSERVATION_REDESIGN_OR_SPLIT_REQUIRED','FIELD_OR_EXTERNAL_VERIFICATION_REQUIRED']);
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const exists=p=>fs.existsSync(path.join(ROOT,p));
const uniq=a=>[...new Set(a)];
const eq=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());

const plan=read(INPUT);
const rows=(plan.noCandidateConstructionPlan||[]).filter(r=>r.constructionPattern===PATTERN);
if(rows.length!==32) throw new Error(`population mismatch: expected 32 groups, got ${rows.length}`);
if(new Set(rows.map(r=>r.machineId)).size!==31) throw new Error('population mismatch: expected 31 machines');

const groups=rows.map(row=>{
 const base=`research/${row.machineId}`;
 const rp=`${base}/research-data.json`, sp=`${base}/selection-data.json`, op=`${base}/machine-observation-data.json`;
 if(!exists(rp)||!exists(sp)) throw new Error(`missing source artifact: ${row.machineId}`);
 const research=read(rp), selection=read(sp), observation=exists(op)?read(op):null;
 const selected=[...(row.selectedSourceEvidenceIds||[])];
 const evidence=(research.evidenceCandidates||[]).filter(e=>selected.includes(e.researchEvidenceId));
 const group=(selection.evidenceUi?.groups||[]).find(g=>g.groupId===row.groupId);
 const optionIds=uniq((group?.options||[]).flatMap(o=>o.sourceEvidenceIds||[]));
 const scopes=uniq(evidence.map(e=>e.observationScope).filter(Boolean));
 const missing=selected.filter(id=>!evidence.some(e=>e.researchEvidenceId===id));
 const extra=optionIds.filter(id=>!selected.includes(id));
 const relevantObs=(observation?.observations||observation?.observationDefinitions||[]).filter(o=>o.groupId===row.groupId || (o.sourceEvidenceIds||[]).some(id=>selected.includes(id)));
 let semanticClassification='HUMAN_SEMANTIC_CONFIRMATION_REQUIRED';
 const blockers=[];
 if(missing.length){semanticClassification='UPSTREAM_CONTRACT_REVIEW_REQUIRED';blockers.push(`Research missing selected Evidence: ${missing.join(', ')}`);}
 else if(!group){semanticClassification='UPSTREAM_CONTRACT_REVIEW_REQUIRED';blockers.push('Selection evidenceUi group missing');}
 else if(!eq(optionIds,selected)){semanticClassification='UPSTREAM_CONTRACT_REVIEW_REQUIRED';blockers.push(`Selection sourceEvidenceIds do not exactly equal selected set${extra.length?`; extra: ${extra.join(', ')}`:''}`);}
 else if(scopes.length!==1){semanticClassification='OBSERVATION_REDESIGN_OR_SPLIT_REQUIRED';blockers.push(`Research Evidence spans ${scopes.length} observation scopes: ${scopes.join(' / ')||'unspecified'}`);}
 else if(relevantObs.length){semanticClassification='HUMAN_SEMANTIC_CONFIRMATION_REQUIRED';blockers.push('Relevant current Observation exists; exact-universe semantics require authoritative confirmation');}
 else {semanticClassification='SAFE_CONSTRUCTION_CANDIDATE';}
 if(!CLASSIFICATIONS.has(semanticClassification)) throw new Error('invalid classification');
 return {machineId:row.machineId,groupId:row.groupId,selectedSourceEvidenceIds:selected,researchEvidenceSummary:evidence.map(e=>({researchEvidenceId:e.researchEvidenceId,name:e.name,observationScope:e.observationScope,allowedSettings:e.allowedSettings,deniedSettings:e.deniedSettings})),selectionSemanticSummary:{label:group?.label||null,selectionMode:group?.selectionMode||null,normalizationMode:group?.normalizationMode||null,optionSourceEvidenceIds:optionIds},currentObservationIds:relevantObs.map(o=>o.observationId||o.id).filter(Boolean),observationUniverse:scopes.length===1?scopes[0]:scopes,observationContext:scopes.length===1?scopes[0]:'MULTIPLE_OR_UNSPECIFIED',answerOrValueShape:group?.selectionMode||null,semanticClassification,classificationBasis:'MACHINE_READABLE_REPOSITORY_SEMANTIC_TOPOLOGY_REVIEW',repositoryEvidence:{researchEvidenceSetComplete:missing.length===0,selectionSourceSetExact:eq(optionIds,selected),singleResearchObservationScope:scopes.length===1,currentRelevantObservationCount:relevantObs.length},canonicalUiRelationship:'NOT_USED_AS_FORMAL_PROOF',externalVerificationRequired:false,fieldVerificationRequired:false,formalProofEstablished:false,blockers,nextAction:semanticClassification==='SAFE_CONSTRUCTION_CANDIDATE'?'Eligible for a separate small-batch formal Observation construction review; no production mutation in this audit.':'Resolve blockers before any production Observation construction.'};
});
const counts=Object.fromEntries([...CLASSIFICATIONS].map(c=>[c,groups.filter(g=>g.semanticClassification===c).length]));
const summary={reviewedGroupCount:groups.length,reviewedMachineCount:new Set(groups.map(g=>g.machineId)).size,classificationCounts:counts,safeConstructionCandidateCount:counts.SAFE_CONSTRUCTION_CANDIDATE,blockedGroupCount:groups.length-counts.SAFE_CONSTRUCTION_CANDIDATE,formalProofEstablishedCount:groups.filter(g=>g.formalProofEstablished).length};
const report={schemaVersion:'m7-phase2.2-single-discrete-evidence-review-v1',auditDate:'2026-09-17',baseHead:'fb8c440361fbd54bdcc3a3047ba4c3825f21e02b',authoritativeInput:INPUT,policy:{scope:'Diagnostic semantic review only; no production mutation.',formalProof:'Binary only; this audit never establishes formal proof.',labelCategoryRule:'Labels/categories/names/appearance are diagnostic only and never proof.',realDevice:'No real-device verification is claimed.'},summary,groups};
fs.writeFileSync(path.join(ROOT,OUT_JSON),JSON.stringify(report,null,2)+'\n');
const lines=['# M7 Phase 2.2 — Single Discrete Evidence Semantic Review','',`- Reviewed: ${summary.reviewedGroupCount} groups / ${summary.reviewedMachineCount} machines`,`- SAFE_CONSTRUCTION_CANDIDATE: ${summary.safeConstructionCandidateCount}`,`- Blocked: ${summary.blockedGroupCount}`,'- Formal proof established: 0','', '## Classification counts','',...Object.entries(counts).map(([k,v])=>`- ${k}: ${v}`),'','## Groups','',...groups.map(g=>`- ${g.machineId} / ${g.groupId}: **${g.semanticClassification}**${g.blockers.length?` — ${g.blockers.join('; ')}`:''}`),'','No production Research, Selection, Observation, canonical UI, MachineData, runtime, distribution, or validator mutation is performed by this audit.'];
fs.writeFileSync(path.join(ROOT,OUT_MD),lines.join('\n')+'\n');
console.log(JSON.stringify(summary,null,2));
