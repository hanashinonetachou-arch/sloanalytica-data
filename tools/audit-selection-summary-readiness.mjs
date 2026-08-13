import fs from 'node:fs';
import path from 'node:path';
import { buildMachineData } from './build-machine-data.mjs';

const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const exists=p=>fs.existsSync(p);
const listDirs=p=>fs.readdirSync(p,{withFileTypes:true}).filter(x=>x.isDirectory()&&!x.name.startsWith('_')).map(x=>x.name).sort();
const idsOf=sf=>[sf.numeratorInputId,sf.denominatorInputId,sf.trialCountInputId,...(sf.denominatorInputIds??[]),...(sf.categoryInputIds??[]),...(sf.denominatorAdjustments??[]).map(x=>x.inputId),...Object.entries(sf.categorySubtractInputIds??{}).flatMap(([k,v])=>[k,...v])].filter(Boolean);
const trim=s=>typeof s==='string'?s.trim():'';

export function auditSelectionSummaryReadiness(root){
  const researchRoot=path.join(root,'research');
  const machineRoot=path.join(root,'machines');
  const reports=[];
  for(const machineId of listDirs(researchRoot)){
    const dir=path.join(researchRoot,machineId);
    const rp=path.join(dir,'research-data.json'), sp=path.join(dir,'selection-data.json');
    if(!exists(rp)||!exists(sp)) continue;
    const research=readJson(rp), selection=readJson(sp);
    const statp=path.join(dir,'statistics-report.json');
    const statistics=exists(statp)?readJson(statp):null;
    let generated=null, buildError=null;
    try{ generated=buildMachineData(research,selection,statistics); }catch(e){ buildError=e?.message??String(e); }

    const included=(selection.features??[]).filter(f=>['INCLUDE_PRIMARY','INCLUDE_SUPPORT'].includes(f.adoptionCategory));
    const rejected=(selection.features??[]).filter(f=>f.adoptionCategory==='EXCLUDE');
    const displayOnly=(selection.features??[]).filter(f=>f.adoptionCategory==='DISPLAY_ONLY');
    const includedInputs=new Set(included.flatMap(idsOf));
    const legacyDisplayOnly=displayOnly.map(f=>({
      featureId:f.featureId,
      usedByIncludedFeature:idsOf(f).some(id=>includedInputs.has(id)),
      mappedInputIds:idsOf(f)
    }));
    // A DISPLAY_ONLY source can be structurally required even when its own mapped ids do not overlap
    // directly: another feature may explicitly use its numerator/denominator input. Detect both directions.
    for(const item of legacyDisplayOnly){
      const f=displayOnly.find(x=>x.featureId===item.featureId);
      const own=new Set(idsOf(f));
      item.usedByIncludedFeature=included.some(inc=>idsOf(inc).some(id=>own.has(id)));
      item.classification=item.usedByIncludedFeature?'INPUT_DEPENDENCY':'LEGACY_REFERENCE_CANDIDATE';
    }

    const missingSelectedReasons=included.filter(f=>!trim(f.userReason)).map(f=>f.featureId);
    const missingRejectedReasons=rejected.filter(f=>!trim(f.userReason)&&!trim(f.rejectionReason)).map(f=>f.featureId);
    const summary=generated?.selectionSummary??null;
    const missingRequiredTrials=summary?[...summary.selected,...summary.rejected].filter(x=>!x.requiredTrials).map(x=>x.featureId):[];
    const sfById=new Map((selection.features??[]).map(f=>[f.featureId,f]));
    const rfById=new Map((research.features??[]).map(f=>[f.researchFeatureId,f]));
    const requiredTrialsUnavailableByDesign=missingRequiredTrials.filter(featureId=>{
      const sf=sfById.get(featureId),rf=sf?rfById.get(sf.researchFeatureId):null;
      if(!rf)return false;
      if(!["binomial","poisson","multinomial"].includes(rf.candidateModel))return true;
      if(rf.candidateModel==="multinomial") return !rf.settingDistributions || Object.keys(rf.settingDistributions).length<2;
      return !rf.settingValues || Object.values(rf.settingValues).filter(v=>Number.isFinite(Number(v?.probability))).length<2;
    });
    const actionableMissingRequiredTrials=missingRequiredTrials.filter(id=>!requiredTrialsUnavailableByDesign.includes(id));

    const mp=path.join(machineRoot,machineId,'machine-package.json');
    const published=exists(mp)?readJson(mp):null;
    const publishedHasSummary=!!published?.selectionSummary;
    const blockers=[];
    if(buildError) blockers.push('BUILDER_REPRODUCTION');
    if(missingSelectedReasons.length) blockers.push('SELECTED_REASON_MISSING');
    if(missingRejectedReasons.length) blockers.push('REJECTED_REASON_MISSING');
    const warnings=[];
    if(displayOnly.length) warnings.push('LEGACY_DISPLAY_ONLY');
    if(actionableMissingRequiredTrials.length) warnings.push('REQUIRED_TRIALS_UNAVAILABLE');
    if(!publishedHasSummary) warnings.push('PUBLISHED_SUMMARY_MISSING');
    const status=blockers.length?'BLOCKED':warnings.some(x=>x!=='PUBLISHED_SUMMARY_MISSING')?'REVIEW':'READY';
    reports.push({machineId,status,counts:{evaluated:(summary?.evaluatedCount??included.length+rejected.length),selected:included.length,rejected:rejected.length,legacyDisplayOnly:displayOnly.length},buildError,missingSelectedReasons,missingRejectedReasons,missingRequiredTrials,requiredTrialsUnavailableByDesign,actionableMissingRequiredTrials,legacyDisplayOnly,publishedHasSummary,blockers,warnings});
  }
  return {schemaVersion:'selection-summary-readiness-v1',generatedAt:new Date().toISOString(),machineCount:reports.length,summary:{ready:reports.filter(x=>x.status==='READY').length,review:reports.filter(x=>x.status==='REVIEW').length,blocked:reports.filter(x=>x.status==='BLOCKED').length},machines:reports};
}

function toMarkdown(r){
  const lines=['# Selection Summary Readiness Audit','',`Machines: ${r.machineCount} / READY ${r.summary.ready} / REVIEW ${r.summary.review} / BLOCKED ${r.summary.blocked}`,'','| Machine | Status | 評価 | 採用 | 不採用 | Legacy DISPLAY_ONLY | 主な課題 |','|---|---:|---:|---:|---:|---:|---|'];
  for(const m of r.machines){
    const issues=[...m.blockers,...m.warnings].join(', ')||'-';
    lines.push(`| ${m.machineId} | ${m.status} | ${m.counts.evaluated} | ${m.counts.selected} | ${m.counts.rejected} | ${m.counts.legacyDisplayOnly} | ${issues} |`);
  }
  lines.push('','## Legacy DISPLAY_ONLY classification','');
  for(const m of r.machines.filter(x=>x.legacyDisplayOnly.length)){
    lines.push(`### ${m.machineId}`);
    for(const x of m.legacyDisplayOnly) lines.push(`- ${x.featureId}: ${x.classification}`);
    lines.push('');
  }
  return lines.join('\n')+'\n';
}

if(import.meta.url===`file://${process.argv[1]}`){
  const root=path.resolve(process.argv[2]??'.');
  const outJson=process.argv[3]??path.join(root,'reports','selection-summary-readiness.json');
  const outMd=process.argv[4]??path.join(root,'reports','selection-summary-readiness.md');
  const r=auditSelectionSummaryReadiness(root);
  fs.mkdirSync(path.dirname(outJson),{recursive:true});
  fs.writeFileSync(outJson,JSON.stringify(r,null,2)+'\n');
  fs.writeFileSync(outMd,toMarkdown(r));
  console.log(`Selection Summary Readiness: READY ${r.summary.ready} / REVIEW ${r.summary.review} / BLOCKED ${r.summary.blocked}`);
  console.log(outMd);
}
