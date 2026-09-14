#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const TRIAGE=path.join(ROOT,'audit-reports','evidence-ui-v2-phase2-triage.json');
const JSON_OUT=path.join(ROOT,'audit-reports','evidence-ui-v2-phase2-migration-plan.json');
const MD_OUT=path.join(ROOT,'audit-reports','evidence-ui-v2-phase2-migration-plan.md');
const readJson=f=>{try{return JSON.parse(fs.readFileSync(f,'utf8'));}catch{return null;}};
if(!fs.existsSync(TRIAGE)) throw new Error('triage report missing');
const triage=readJson(TRIAGE);
const ready=(triage?.reopenTriage??[]).filter(x=>x.status==='EXISTING_RESEARCH_RESOLVABLE');
const plans=[];
const errors=[];

for(const item of ready){
  const pkg=readJson(path.join(ROOT,'machines',item.machineId,'machine-package.json'));
  const research=readJson(path.join(ROOT,'research',item.machineId,'research-data.json'));
  if(!pkg||!research){errors.push(`${item.machineId}/${item.inputId}: source artifact missing`);continue;}
  const evidences=(pkg?.evidence?.evidences??[]).filter(e=>e?.inputId===item.inputId);
  const refs=[...new Set(evidences.flatMap(e=>e?.sourceEvidenceRefs??[]))];
  const byId=new Map((research?.evidenceCandidates??[]).map(c=>[c.researchEvidenceId,c]));
  const candidates=refs.map(id=>byId.get(id)).filter(Boolean);
  if(candidates.length!==refs.length){errors.push(`${item.machineId}/${item.inputId}: incomplete Research mapping`);continue;}
  const groups=new Map();
  for(const c of candidates){
    const scope=String(c.observationScope??'').trim();
    if(!scope){errors.push(`${item.machineId}/${item.inputId}/${c.researchEvidenceId}: blank observationScope`);continue;}
    if(!groups.has(scope)) groups.set(scope,[]);
    groups.get(scope).push({researchEvidenceId:c.researchEvidenceId,name:c.name??null,factStatus:c.factStatus??null,allowedSettings:c.allowedSettings??[],deniedSettings:c.deniedSettings??[],sourceRefs:c.sourceRefs??[],notes:c.notes??null});
  }
  const replacementGroups=[...groups.entries()].map(([observationScope,options])=>({observationScope,options}));
  if(!replacementGroups.length) errors.push(`${item.machineId}/${item.inputId}: no replacement groups`);
  plans.push({machineId:item.machineId,displayName:item.displayName??null,legacyInputId:item.inputId,legacyName:item.name??null,currentInputType:item.currentInputType??null,replacementGroups,sourceEvidenceRefs:refs,materializationStatus:'PLAN_ONLY_NOT_APPLIED'});
}

const allOptionIds=plans.flatMap(p=>p.replacementGroups.flatMap(g=>g.options.map(o=>`${p.machineId}/${p.legacyInputId}/${o.researchEvidenceId}`)));
if(new Set(allOptionIds).size!==allOptionIds.length) errors.push('duplicate Research Evidence mapping detected inside migration plan');
if(ready.length!==48) errors.push(`ready invariant changed: expected 48, actual ${ready.length}`);
if(plans.length!==48) errors.push(`planned invariant changed: expected 48, actual ${plans.length}`);

const report={schemaVersion:'evidence-ui-v2-phase2-migration-plan-v1',generatedAt:new Date().toISOString(),source:'audit-reports/evidence-ui-v2-phase2-triage.json',policyNotes:['This is a plan only. It does not mutate Research, Selection, canonical UI, MachineData, catalog, or distribution artifacts.','One legacy result-abstraction input may expand into multiple observation groups.','Each replacement option is copied from a verified Research Evidence candidate already linked by sourceEvidenceRefs.','Allowed/denied settings remain Research-owned; the plan does not infer settings from labels.'],summary:{readyLegacyInputs:ready.length,plannedInputs:plans.length,replacementGroups:plans.reduce((n,p)=>n+p.replacementGroups.length,0),replacementOptions:plans.reduce((n,p)=>n+p.replacementGroups.reduce((m,g)=>m+g.options.length,0),0),errors:errors.length},plans,errors};
fs.writeFileSync(JSON_OUT,JSON.stringify(report,null,2)+'\n');
const md=['# Evidence UI v2 Phase 2 migration plan','',`- Ready legacy inputs: ${report.summary.readyLegacyInputs}`,`- Planned inputs: ${report.summary.plannedInputs}`,`- Replacement observation groups: ${report.summary.replacementGroups}`,`- Replacement options: ${report.summary.replacementOptions}`,`- Errors: ${report.summary.errors}`,'','## Per-machine plan','',...plans.map(p=>`- **${p.machineId}** ${p.displayName??''}: ${p.legacyInputId} / ${p.legacyName} → ${p.replacementGroups.map(g=>`${g.observationScope} (${g.options.length})`).join(' + ')}`),'','## Errors','',...(errors.length?errors.map(e=>`- ${e}`):['- none']),''].join('\n');
fs.writeFileSync(MD_OUT,md);
console.log(JSON.stringify(report.summary,null,2));
if(errors.length) process.exitCode=1;
