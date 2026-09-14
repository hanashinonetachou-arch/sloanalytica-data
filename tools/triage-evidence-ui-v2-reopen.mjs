#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const IN=path.join(ROOT,'audit-reports','evidence-ui-v2-phase2-breakdowns.json');
const JSON_OUT=path.join(ROOT,'audit-reports','evidence-ui-v2-phase2-triage.json');
const MD_OUT=path.join(ROOT,'audit-reports','evidence-ui-v2-phase2-triage.md');
const readJson=f=>{try{return JSON.parse(fs.readFileSync(f,'utf8'));}catch{return null;}};
const genericScope=/^(?:設定示唆|設定確定(?:・否定)?情報|その他|不明|未分類|unknown)$/i;
const concreteCandidate=c=>Boolean(c&&c.factStatus==='verified'&&c.observationScope&&!genericScope.test(String(c.observationScope).trim()));

if(!fs.existsSync(IN)) throw new Error('fixed breakdown report missing');
const fixed=readJson(IN);
const reopen=fixed?.breakdowns?.researchReopen?.items??[];
const shared=fixed?.breakdowns?.featureEvidenceSharingCandidates??[];
const triage=[];

for(const item of reopen){
  const machineId=item.machineId;
  const pkg=readJson(path.join(ROOT,'machines',machineId,'machine-package.json'));
  const research=readJson(path.join(ROOT,'research',machineId,'research-data.json'));
  const evidences=Array.isArray(pkg?.evidence?.evidences)?pkg.evidence.evidences:[];
  const linked=evidences.filter(e=>e?.inputId===item.inputId);
  const sourceEvidenceRefs=[...new Set(linked.flatMap(e=>Array.isArray(e?.sourceEvidenceRefs)?e.sourceEvidenceRefs:[]))];
  const researchCandidates=Array.isArray(research?.evidenceCandidates)?research.evidenceCandidates:[];
  const byId=new Map(researchCandidates.map(c=>[c.researchEvidenceId,c]));
  const matched=sourceEvidenceRefs.map(id=>byId.get(id)).filter(Boolean);
  const concrete=matched.filter(concreteCandidate);
  let status='PUBLIC_RESEARCH_RECHECK_REQUIRED';
  let reason='No complete, concrete Research Evidence mapping is available yet.';
  if(!research){ status='RESEARCH_ARTIFACT_MISSING'; reason='research-data.json is missing.'; }
  else if(sourceEvidenceRefs.length>0&&matched.length===sourceEvidenceRefs.length&&concrete.length===matched.length){
    status='EXISTING_RESEARCH_RESOLVABLE';
    reason='All materialized sourceEvidenceRefs resolve to verified Research Evidence candidates with concrete observationScope.';
  } else if(sourceEvidenceRefs.length>0&&concrete.length>0){
    status='EXISTING_RESEARCH_PARTIAL';
    reason='At least one concrete Research Evidence mapping exists, but the materialized mapping is incomplete or partly generic.';
  }
  triage.push({...item,status,reason,sourceEvidenceRefs,matchedResearchEvidenceIds:matched.map(c=>c.researchEvidenceId),observationScopes:[...new Set(concrete.map(c=>c.observationScope))],candidateForAutomaticMigration:status==='EXISTING_RESEARCH_RESOLVABLE'});
}

const sharingTriage=[];
for(const m of shared){
  const pkg=readJson(path.join(ROOT,'machines',m.machineId,'machine-package.json'));
  const inputs=Array.isArray(pkg?.inputs?.inputs)?pkg.inputs.inputs:[];
  const sections=Array.isArray(pkg?.ui?.sections)?pkg.ui.sections:[];
  for(const candidate of m.inputs??[]){
    const inputId=candidate.inputId;
    const input=inputs.find(i=>i?.id===inputId);
    const locations=[];
    for(const s of sections){
      for(const it of s?.items??[]) if(it?.inputId===inputId) locations.push({sectionId:s.id??null,title:s.title??null,gridSpan:it.gridSpan??null,widget:it.widget??null});
    }
    const status=input&&String(input.category??'').toUpperCase()!=='EVIDENCE'&&locations.length===1
      ? 'KEEP_NATURAL_OBSERVATION_READY'
      : 'UI_REVIEW_REQUIRED';
    sharingTriage.push({machineId:m.machineId,displayName:m.displayName??null,inputId,name:input?.name??candidate.name??null,category:input?.category??candidate.category??null,currentInputType:input?.type??candidate.type??null,uiLocations:locations,status});
  }
}

const countBy=(rows,key)=>Object.fromEntries([...new Set(rows.map(r=>r[key]))].sort().map(v=>[v,rows.filter(r=>r[key]===v).length]));
const report={
  schemaVersion:'evidence-ui-v2-phase2-triage-v1',generatedAt:new Date().toISOString(),
  policyNotes:[
    'EXISTING_RESEARCH_RESOLVABLE requires an explicit materialized sourceEvidenceRef for every linked Evidence and a verified Research Evidence candidate with a concrete observationScope.',
    'Names alone never make an item auto-resolvable.',
    'Automatic migration is only a candidate flag; this tool does not mutate Research, Selection, canonical UI, or MachineData.',
    'Feature/Evidence shared inputs remain in their natural observation section only when the current non-EVIDENCE input has exactly one UI location.'
  ],
  summary:{reopenInputs:triage.length,reopenMachines:new Set(triage.map(x=>x.machineId)).size,reopenByStatus:countBy(triage,'status'),automaticMigrationCandidates:triage.filter(x=>x.candidateForAutomaticMigration).length,sharingInputs:sharingTriage.length,sharingMachines:new Set(sharingTriage.map(x=>x.machineId)).size,sharingByStatus:countBy(sharingTriage,'status')},
  reopenTriage:triage,
  featureEvidenceSharingTriage:sharingTriage
};
fs.writeFileSync(JSON_OUT,JSON.stringify(report,null,2)+'\n');
const md=[
  '# Evidence UI v2 Phase 2 reopen triage','',
  `- Research reopen: ${report.summary.reopenInputs} inputs / ${report.summary.reopenMachines} machines`,
  `- Existing Research auto-migration candidates: ${report.summary.automaticMigrationCandidates}`,
  `- Feature/Evidence sharing: ${report.summary.sharingInputs} inputs / ${report.summary.sharingMachines} machines`,'',
  '## Reopen classification','',
  ...Object.entries(report.summary.reopenByStatus).map(([k,v])=>`- ${k}: ${v}`),'',
  '## Feature/Evidence sharing classification','',
  ...Object.entries(report.summary.sharingByStatus).map(([k,v])=>`- ${k}: ${v}`),'',
  '## Existing Research resolvable candidates','',
  ...triage.filter(x=>x.status==='EXISTING_RESEARCH_RESOLVABLE').map(x=>`- **${x.machineId}** ${x.displayName??''}: ${x.inputId} / ${x.name} → ${x.observationScopes.join(', ')}`),
  ...(triage.some(x=>x.status==='EXISTING_RESEARCH_RESOLVABLE')?[]:['- none']),'',
  '## Remaining Research recheck','',
  ...triage.filter(x=>x.status!=='EXISTING_RESEARCH_RESOLVABLE').map(x=>`- **${x.machineId}** ${x.displayName??''}: ${x.inputId} / ${x.name} — ${x.status}`),''
].join('\n');
fs.writeFileSync(MD_OUT,md);
console.log(JSON.stringify(report.summary,null,2));
if(triage.length!==93) throw new Error(`reopen invariant changed: expected 93, actual ${triage.length}`);
if(new Set(sharingTriage.map(x=>x.machineId)).size!==6) throw new Error('Feature/Evidence sharing machine invariant changed');
