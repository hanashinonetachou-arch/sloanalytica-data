#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const MACHINE_ID='L_G1_YUSHUN_CLUB_GOLD_KD';
const LEGACY_INPUT='INP_EVI_SETTING_FLOOR';
const PLAN=path.join(ROOT,'audit-reports','evidence-ui-v2-phase2-migration-plan.json');
const PKG=path.join(ROOT,'machines',MACHINE_ID,'machine-package.json');
const RESEARCH=path.join(ROOT,'research',MACHINE_ID,'research-data.json');
const OUT_JSON=path.join(ROOT,'audit-reports',`evidence-ui-v2-pilot-${MACHINE_ID}.json`);
const OUT_MD=path.join(ROOT,'audit-reports',`evidence-ui-v2-pilot-${MACHINE_ID}.md`);
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const slug=s=>String(s).replace(/[^A-Za-z0-9_]+/g,'_').replace(/^_+|_+$/g,'').toUpperCase();
const stripOutcome=s=>String(s??'')
  .replace(/(?:設定)?(?:[23456]以上|6(?:確定)?|[1-6]否定|高設定確定|設定[13456](?:・[13456])*)/g,'')
  .replace(/\s+/g,' ').trim();
const stripScope=(name,scope)=>{
  let s=stripOutcome(name);
  const q=String(scope??'').trim();
  if(q&&s.startsWith(q)) s=s.slice(q.length).trim();
  return s||stripOutcome(name)||String(name??'');
};

const plan=read(PLAN);
const pkg=read(PKG);
const research=read(RESEARCH);
const p=(plan.plans??[]).find(x=>x.machineId===MACHINE_ID&&x.legacyInputId===LEGACY_INPUT);
if(!p) throw new Error('pilot migration plan not found');
const oldInput=(pkg?.inputs?.inputs??[]).find(x=>x.id===LEGACY_INPUT);
if(!oldInput) throw new Error('legacy input not found');
const oldEvidences=(pkg?.evidence?.evidences??[]).filter(e=>e.inputId===LEGACY_INPUT);
const byResearchId=new Map((research?.evidenceCandidates??[]).map(x=>[x.researchEvidenceId,x]));

const groups=p.replacementGroups.map((g,gi)=>({
  groupId:`EVI_V2_${slug(g.observationScope)||gi+1}`,
  title:g.observationScope,
  observationScope:g.observationScope,
  inputMode:'CHECKBOX',
  options:g.options.map((o,oi)=>{
    const r=byResearchId.get(o.researchEvidenceId);
    if(!r) throw new Error(`missing Research Evidence ${o.researchEvidenceId}`);
    return {
      inputId:`INP_EVI_V2_${slug(o.researchEvidenceId)||`${gi+1}_${oi+1}`}`,
      observedTitle:stripScope(r.name,g.observationScope),
      resultBadge:{allowedSettings:r.allowedSettings??[],deniedSettings:r.deniedSettings??[]},
      sourceEvidenceId:r.researchEvidenceId,
      sourceRefs:r.sourceRefs??[],
      valueSemantics:'OBSERVED_OR_NOT_OBSERVED',
      defaultValue:false,
      legacyMappedEvidenceIds:oldEvidences.filter(e=>(e.sourceEvidenceRefs??[]).includes(r.researchEvidenceId)).map(e=>e.id),
    };
  })
}));

const errors=[];
const options=groups.flatMap(g=>g.options);
const researchIds=new Set(options.map(o=>o.sourceEvidenceId));
const plannedIds=new Set(p.sourceEvidenceRefs??[]);
for(const id of plannedIds) if(!researchIds.has(id)) errors.push(`planned Research Evidence missing from pilot: ${id}`);
for(const id of researchIds) if(!plannedIds.has(id)) errors.push(`unexpected Research Evidence in pilot: ${id}`);
for(const o of options){
  if(!o.observedTitle) errors.push(`${o.sourceEvidenceId}: blank observed title`);
  if(!o.legacyMappedEvidenceIds.length) errors.push(`${o.sourceEvidenceId}: no legacy Evidence mapping`);
}
const duplicateInputIds=options.map(o=>o.inputId).filter((id,i,a)=>a.indexOf(id)!==i);
if(duplicateInputIds.length) errors.push(`duplicate input ids: ${[...new Set(duplicateInputIds)].join(', ')}`);

const report={
  schemaVersion:'evidence-ui-v2-dry-run-pilot-v1',
  generatedAt:new Date().toISOString(),
  machineId:MACHINE_ID,
  mode:'DRY_RUN_NO_CANONICAL_MUTATION',
  sourceLegacy:{inputId:LEGACY_INPUT,name:oldInput.name,type:oldInput.type,optionCount:(oldInput.options??[]).length,evidenceCount:oldEvidences.length},
  proposed:{sectionTitle:'設定確定情報',groups},
  semanticChecks:{plannedResearchEvidenceCount:plannedIds.size,proposedObservationCount:options.length,oneToOneResearchCoverage:plannedIds.size===researchIds.size&&[...plannedIds].every(id=>researchIds.has(id)),legacyEvidenceCoverage:options.every(o=>o.legacyMappedEvidenceIds.length>0),resultSemanticsResearchOwned:true,canonicalMutation:false},
  errors
};
fs.writeFileSync(OUT_JSON,JSON.stringify(report,null,2)+'\n');
const md=[
  '# Evidence UI v2 dry-run pilot: GI優駿倶楽部黄金','',
  '- Mode: **DRY RUN / canonical未変更**',
  `- Legacy input: ${LEGACY_INPUT} / ${oldInput.name} (${oldInput.type})`,
  `- Legacy Evidence definitions: ${oldEvidences.length}`,
  `- Proposed observation groups: ${groups.length}`,
  `- Proposed observation inputs: ${options.length}`,
  `- Research coverage: ${report.semanticChecks.oneToOneResearchCoverage?'PASS':'FAIL'}`,
  `- Legacy Evidence coverage: ${report.semanticChecks.legacyEvidenceCoverage?'PASS':'FAIL'}`,
  `- Errors: ${errors.length}`,'',
  '## Proposed groups','',
  ...groups.flatMap(g=>[
    `### ${g.title}`,'',
    ...g.options.map(o=>`- [ ] ${o.observedTitle} → allowed: ${(o.resultBadge.allowedSettings??[]).join('/')||'-'}; denied: ${(o.resultBadge.deniedSettings??[]).join('/')||'-'}; source: ${o.sourceEvidenceId}`),''
  ]),
  '## Safety','',
  '- 設定結果そのものを入力させず、実際に観測した現象をチェックする。',
  '- 設定下限／否定結果はResearchのallowedSettings / deniedSettingsから導出する。',
  '- このpilotは監査レポートのみを生成し、machine-package.json / Research / Selection / canonical UI / catalogを変更しない。','',
  '## Errors','',...(errors.length?errors.map(e=>`- ${e}`):['- none']),'',
].join('\n');
fs.writeFileSync(OUT_MD,md);
console.log(JSON.stringify(report.semanticChecks,null,2));
if(errors.length||!report.semanticChecks.oneToOneResearchCoverage||!report.semanticChecks.legacyEvidenceCoverage) process.exitCode=1;
