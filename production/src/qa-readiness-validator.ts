import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
export const QA_REQUIRED_STAGES=['CANONICAL_UI','MACHINE_DATA','RUNTIME_POLICY','RUNTIME_PROJECTION','APP_RUNTIME','DISTRIBUTION'] as const;
const fail=(m:string):never=>{throw new Error('QA_READINESS_FAILED:'+m)};
const sameStrings=(a:unknown,b:unknown)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>typeof x==='string'&&x===b[i]);
const sameEvidencePresentation=(details:unknown,categories:any[])=>Array.isArray(details)&&Array.isArray(categories)&&details.length===categories.length&&details.every((raw:any,i:number)=>{
 if(typeof raw!=='string')return false;const c=categories[i];if(!c||typeof c.label!=='string')return false;if(c.label===raw)return true;
 return typeof c.meaning==='string'&&`${c.label}：${c.meaning}`===raw;
});
export function validateMachineQaReadiness(machineId:string,stageStates:Record<string,any>,pkg:any,renderReport:any){
 for(const stage of QA_REQUIRED_STAGES){
  const s=stageStates?.[stage];
  if(s?.state!=='COMPLETE'||!s?.authoritativeOutputRef?.path)fail(machineId+':STAGE_'+stage);
 }
 if(pkg?.schemaVersion!==1||pkg?.machine?.machineId!==machineId)fail(machineId+':PACKAGE_IDENTITY');
 if(pkg?.provenance?.manifestVersion!=='8.5'||pkg?.provenance?.generationPath!=='V8_5_PRODUCTION_PIPELINE'||pkg?.provenance?.legacyOracleUsed!==false)fail(machineId+':V8_PROVENANCE');
 if(pkg?.ui?.contractVersion!=='runtime-ui-v8'||pkg?.ui?.source!=='CANONICAL_UI')fail(machineId+':CANONICAL_UI_PACKAGE');
 if(typeof pkg?.machine?.machineDataVersion!=='string'||!/^8\.5\.\d+-batch-/.test(pkg.machine.machineDataVersion))fail(machineId+':V8_VERSION');
 const refs=pkg?.evidence?.references??[],defs=pkg?.evidence?.evidences??[];
 if(!Array.isArray(refs)||!Array.isArray(defs))fail(machineId+':EVIDENCE_ARRAYS');
 const expected=refs.flatMap((s:any)=>(s?.evidenceItems??[]).map((e:any)=>e.findingId));
 const expectedSet=new Set(expected);
 for(const def of defs){
  const sourceIds=Array.isArray(def?.sourceEvidenceRefs)?def.sourceEvidenceRefs:[];
  const hasConstraint=(Array.isArray(def?.confirmedSettings)&&def.confirmedSettings.length>0)||(Array.isArray(def?.deniedSettings)&&def.deniedSettings.length>0);
  if(sourceIds.length!==1||!expectedSet.has(sourceIds[0])||!hasConstraint||def?.type!=='SETTING_CONSTRAINT')fail(machineId+':EVIDENCE_MATERIALIZATION');
 }
 const uiEvidence=(pkg?.ui?.v8Sections??[]).filter((s:any)=>String(s?.id??'').startsWith('EVI_'));
 // Explicit linked categories are rendered by their numeric counter section.
 // Never require a second Evidence section for the same observation.
 const linkedSectionFor=(ref:any)=>{
  const cats=(ref.evidenceItems??[]).flatMap((e:any)=>e.semanticCategories??[]);
  if(!cats.length||cats.some((c:any)=>!c.linkedFindingId))return undefined;
  const ids=[...new Set(cats.map((c:any)=>c.linkedFindingId))];if(ids.length!==1)return undefined;
  const sections=(pkg?.ui?.v8Sections??[]).filter((s:any)=>(s.items??[]).some((n:any)=>n.featureId===ids[0]&&n.interaction?.type==='CATEGORY_COUNTERS'));
  if(sections.length!==1)return undefined;
  const categories=sections[0].items.flatMap((n:any)=>n.featureId===ids[0]?n.interaction?.categories??[]:[]);
  if(categories.length!==cats.length||categories.some((c:any,i:number)=>c.label!==cats[i].label||c.meaning!==cats[i].meaning||!pkg.inputs?.inputs?.some((input:any)=>input.id===c.inputId)))return undefined;
  for(const def of defs.filter((e:any)=>e.sourceEvidenceRefs?.some((id:string)=>ref.evidenceItems.some((item:any)=>item.findingId===id)))){
   const index=Number(String(def.id).split('__').pop())-1;
   if(!categories[index]||def.inputId!==categories[index].inputId)fail(machineId+':LINKED_EVIDENCE_INPUT_MISMATCH');
  }
  return sections[0];
 };

 if(expected.length&&uiEvidence.length!==refs.filter((ref:any)=>!linkedSectionFor(ref)).length)fail(machineId+':EVIDENCE_UI_COVERAGE');
 const blockedFindingIds=new Set((pkg?.blockedItems??[]).flatMap((b:any)=>Array.isArray(b?.blockedFindingIds)?b.blockedFindingIds:[]));
 for(const ref of refs){
  const items=Array.isArray(ref?.evidenceItems)?ref.evidenceItems:[];
  if(items.length===0)fail(machineId+':EVIDENCE_DETAIL_CONTRACT:'+String(ref?.id??'UNKNOWN'));
  const findingIds=items.map((x:any)=>x?.findingId).filter((x:any)=>typeof x==='string');
  if(findingIds.some((id:string)=>blockedFindingIds.has(id)))fail(machineId+':BLOCKED_EVIDENCE_RESURRECTION:'+String(ref?.id??'UNKNOWN'));
  const details=items.flatMap((x:any)=>Array.isArray(x?.details)?x.details:[]);
  if(details.length===0||details.some((x:any)=>typeof x!=='string'||!x.trim()))fail(machineId+':EVIDENCE_DETAILS_MISSING:'+String(ref?.id??'UNKNOWN'));
  for(const item of items){const cats=Array.isArray(item?.semanticCategories)?item.semanticCategories:[];if(cats.length===0||cats.some((x:any)=>typeof x?.label!=='string'||!x.label.trim()||!['EXACT_CONSTRAINT','PROBABILITY_BACKED','PROBABILITY_UNKNOWN','DISPLAY_ONLY','BLOCK'].includes(x?.semanticType))||(cats.some((x:any)=>x.meaning!==undefined)?cats.some((x:any)=>typeof x.meaning!=='string'||!x.meaning.trim()):cats.length!==item.details.length||cats.some((x:any,i:number)=>x.label!==item.details[i])))fail(machineId+':EVIDENCE_SEMANTICS:'+String(ref?.id??'UNKNOWN'));}
  const section=uiEvidence.find((s:any)=>s?.id===ref?.id)??linkedSectionFor(ref);
  const categories=(section?.items??[]).flatMap((node:any)=>node?.interaction?.type==='CATEGORY_COUNTERS'?(node?.interaction?.categories??[]).map((c:any)=>c?.label):[]);
  const categoryDetails=items.flatMap((item:any)=>item.semanticCategories.map((c:any)=>c.meaning?`${c.label}：${c.meaning}`:c.label));
  if(!sameEvidencePresentation(categoryDetails,(section?.items??[]).flatMap((node:any)=>node?.interaction?.type==='CATEGORY_COUNTERS'?(node?.interaction?.categories??[]):[])))fail(machineId+':EVIDENCE_CATEGORY_MISMATCH:'+String(ref?.id??'UNKNOWN'));
 }
 if(renderReport?.schemaVersion!=='rendered-ui-validation-v1'||renderReport?.machineId!==machineId)fail(machineId+':RENDER_REPORT_IDENTITY');
 if(renderReport?.status!=='PASS')fail(machineId+':RENDERED_UI_VALIDATION');
 if(renderReport?.contractVersion!=='rendered-canonical-ui-v1'||renderReport?.renderer!=='MANIFEST_V8'||renderReport?.source!=='CANONICAL_UI'||renderReport?.manifestRevision!=='8.5')fail(machineId+':RENDER_CONTRACT');
 const checks=renderReport?.checks??{};
 for(const key of ['noDuplicateUi','noEmptySections','evidenceCoverage','summaryCoverage','noInternalWording','noLegacyRendererFallback','denominatorBinding','importanceCoverage','explanationCoverage','evidenceBodyCoverage','sectionGuidance','conciseInputLabels','evidenceCounterCoverage'])if(checks[key]!==true)fail(machineId+':RENDER_CHECK_'+key);
 const counters=(pkg.ui.v8Sections??[]).flatMap((s:any)=>s.items??[]).flatMap((n:any)=>(n.inputs??[]).filter((i:any)=>i.input==='counter').map((i:any)=>({gridSpan:(n.gridSpan??12)*(i.gridSpan??12)/12})));
 if(checks.compactTwoColumnLayout!==true && !(checks.compactTwoColumnLayout===undefined && checks.gameCountInputs===true && counters.every((n:any)=>n.gridSpan===6)))fail(machineId+':RENDER_CHECK_compactTwoColumnLayout');
 return {machineId,status:'QA_READY',evidenceCount:defs.length,renderedUi:'PASS'};
}

export function validateMachineQaReadinessFromFiles(productionRoot:string,distributionRoot:string,renderReportRoot:string,batchId:string,machineId:string){
 const stageStates:any={};
 for(const stage of QA_REQUIRED_STAGES)stageStates[stage]=JSON.parse(fs.readFileSync(path.join(productionRoot,'batches',batchId,'machines',machineId,'stages',stage+'.json'),'utf8'));
 const pkg=JSON.parse(fs.readFileSync(path.join(distributionRoot,'machines',machineId,'machine-package.json'),'utf8'));
 const renderReport=JSON.parse(fs.readFileSync(path.join(renderReportRoot,machineId+'.json'),'utf8'));
 return validateMachineQaReadiness(machineId,stageStates,pkg,renderReport);
}
function main(){const [productionRoot,distributionRoot,renderReportRoot,batchId,...machineIds]=process.argv.slice(2);if(!productionRoot||!distributionRoot||!renderReportRoot||!batchId||!machineIds.length)throw new Error('USAGE: qa-readiness-validator <productionRoot> <distributionRoot> <renderReportRoot> <batchId> <machineId...>');const results=machineIds.map(m=>validateMachineQaReadinessFromFiles(productionRoot,distributionRoot,renderReportRoot,batchId,m));console.log(JSON.stringify(results,null,2))}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main();

