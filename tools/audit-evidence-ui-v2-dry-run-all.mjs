#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const PLAN_FILE=path.join(ROOT,'audit-reports','evidence-ui-v2-phase2-migration-plan.json');
const OUT_JSON=path.join(ROOT,'audit-reports','evidence-ui-v2-phase2-dry-run-all.json');
const OUT_MD=path.join(ROOT,'audit-reports','evidence-ui-v2-phase2-dry-run-all.md');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const segmenter=typeof Intl?.Segmenter==='function'?new Intl.Segmenter('ja',{granularity:'grapheme'}):null;
const glen=s=>segmenter?[...segmenter.segment(String(s))].length:[...String(s)].length;
const outcomeRe=/(?:設定下限|設定[23456]以上|設定6(?:確定)?|高設定確定|設定[1-6]否定|設定[13456](?:・[13456])*)/g;
const stripOutcome=s=>String(s??'').replace(outcomeRe,'').replace(/[（(]\s*[）)]/g,'').replace(/\s+/g,' ').trim();
const stripScope=(name,scope)=>{
  let s=stripOutcome(name); const q=String(scope??'').trim();
  if(q&&s.startsWith(q)) s=s.slice(q.length).trim();
  return s||stripOutcome(name)||String(name??'');
};
const hasOutcomeLeak=s=>/(設定下限|設定[23456]以上|設定6|高設定確定|設定[1-6]否定)/.test(String(s??''));

const plan=read(PLAN_FILE);
const machines=[];
const hardErrors=[];
const reviewFlags=[];
let totalGroups=0,totalOptions=0,twoColumn=0,oneColumn=0;

for(const p of plan.plans??[]){
  const pkg=read(path.join(ROOT,'machines',p.machineId,'machine-package.json'));
  const research=read(path.join(ROOT,'research',p.machineId,'research-data.json'));
  const byResearchId=new Map((research?.evidenceCandidates??[]).map(x=>[x.researchEvidenceId,x]));
  const legacyEvidences=(pkg?.evidence?.evidences??[]).filter(e=>e?.inputId===p.legacyInputId);
  const groups=[];
  for(const g of p.replacementGroups??[]){
    const options=[];
    for(const o of g.options??[]){
      const r=byResearchId.get(o.researchEvidenceId);
      if(!r){ hardErrors.push(`${p.machineId}/${p.legacyInputId}: missing ${o.researchEvidenceId}`); continue; }
      const observedTitle=stripScope(r.name,g.observationScope);
      const mapped=legacyEvidences.filter(e=>(e.sourceEvidenceRefs??[]).includes(r.researchEvidenceId));
      if(!mapped.length) hardErrors.push(`${p.machineId}/${p.legacyInputId}/${r.researchEvidenceId}: legacy mapping missing`);
      if(!observedTitle) hardErrors.push(`${p.machineId}/${r.researchEvidenceId}: blank observed title`);
      if(hasOutcomeLeak(observedTitle)) reviewFlags.push({machineId:p.machineId,inputId:p.legacyInputId,group:g.observationScope,researchEvidenceId:r.researchEvidenceId,flag:'SETTING_RESULT_TEXT_REMAINS',observedTitle});
      options.push({sourceEvidenceId:r.researchEvidenceId,observedTitle,allowedSettings:r.allowedSettings??[],deniedSettings:r.deniedSettings??[],sourceRefs:r.sourceRefs??[],legacyMappedEvidenceIds:mapped.map(e=>e.id)});
    }
    const titles=options.map(x=>x.observedTitle);
    const duplicates=[...new Set(titles.filter((t,i,a)=>a.indexOf(t)!==i))];
    if(duplicates.length) reviewFlags.push({machineId:p.machineId,inputId:p.legacyInputId,group:g.observationScope,flag:'DUPLICATE_OBSERVED_TITLE',titles:duplicates});
    const maxTitleGraphemes=titles.length?Math.max(...titles.map(glen)):0;
    const layoutCandidate=maxTitleGraphemes<=5?'TWO_COLUMN_ELIGIBLE':'ONE_COLUMN';
    if(/[／/]|\/|・.+(?:終了|画面|表示|ボイス|セリフ)/.test(String(g.observationScope))) reviewFlags.push({machineId:p.machineId,inputId:p.legacyInputId,group:g.observationScope,flag:'COMPOSITE_OBSERVATION_SCOPE_REVIEW'});
    groups.push({observationScope:g.observationScope,options,maxTitleGraphemes,layoutCandidate,decisionScope:'OBSERVATION_GROUP'});
    totalGroups++; totalOptions+=options.length; if(layoutCandidate==='TWO_COLUMN_ELIGIBLE') twoColumn++; else oneColumn++;
  }
  const plannedRefs=new Set(p.sourceEvidenceRefs??[]);
  const generatedRefs=new Set(groups.flatMap(g=>g.options.map(o=>o.sourceEvidenceId)));
  const coverage=plannedRefs.size===generatedRefs.size&&[...plannedRefs].every(id=>generatedRefs.has(id));
  if(!coverage) hardErrors.push(`${p.machineId}/${p.legacyInputId}: Research coverage mismatch`);
  machines.push({machineId:p.machineId,displayName:p.displayName??null,legacyInputId:p.legacyInputId,legacyName:p.legacyName??null,groups,researchCoverage:coverage});
}

const report={schemaVersion:'evidence-ui-v2-phase2-dry-run-all-v1',generatedAt:new Date().toISOString(),mode:'DRY_RUN_NO_CANONICAL_MUTATION',summary:{plannedInputs:machines.length,groups:totalGroups,options:totalOptions,twoColumnGroups:twoColumn,oneColumnGroups:oneColumn,hardErrors:hardErrors.length,reviewFlags:reviewFlags.length},machines,reviewFlags,hardErrors};
fs.writeFileSync(OUT_JSON,JSON.stringify(report,null,2)+'\n');
const flagCounts=Object.fromEntries([...new Set(reviewFlags.map(x=>x.flag))].sort().map(k=>[k,reviewFlags.filter(x=>x.flag===k).length]));
const md=['# Evidence UI v2 Phase 2 all-ready dry-run audit','',`- Planned legacy inputs: ${machines.length}`,`- Proposed observation groups: ${totalGroups}`,`- Proposed observation inputs: ${totalOptions}`,`- TWO_COLUMN_ELIGIBLE groups: ${twoColumn}`,`- ONE_COLUMN groups: ${oneColumn}`,`- Hard errors: ${hardErrors.length}`,`- Review flags: ${reviewFlags.length}`,'','## Review flags','',...Object.entries(flagCounts).map(([k,v])=>`- ${k}: ${v}`),...(reviewFlags.length?reviewFlags.map(f=>`- **${f.machineId}** ${f.inputId} / ${f.group}: ${f.flag}${f.observedTitle?` → ${f.observedTitle}`:''}`):['- none']),'','## Hard errors','',...(hardErrors.length?hardErrors.map(e=>`- ${e}`):['- none']),'','## Safety','', '- This report does not mutate canonical artifacts.','- Layout is decided once per observation group using the longest normalized observed title.','- Review flags do not auto-rewrite Research; they block/flag ambiguous presentation for manual or Research-level resolution.',''].join('\n');
fs.writeFileSync(OUT_MD,md);
console.log(JSON.stringify(report.summary,null,2));
if(machines.length!==48) hardErrors.push(`planned input invariant changed: ${machines.length}`);
if(totalGroups!==106) hardErrors.push(`group invariant changed: ${totalGroups}`);
if(totalOptions!==252) hardErrors.push(`option invariant changed: ${totalOptions}`);
if(hardErrors.length) process.exitCode=1;
