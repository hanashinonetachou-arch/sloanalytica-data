#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const INCLUDED=new Set(['INCLUDE_PRIMARY','INCLUDE_SUPPORT','INCLUDE_FALLBACK']);
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));

export function scoreLegacyObservationMachine({selection,observation,research}){
  const active=(selection.features??[]).filter(f=>INCLUDED.has(f.adoptionCategory));
  const researchById=new Map((research?.features??[]).map(f=>[f.researchFeatureId,f]));
  let score=0;
  const reasons=[];
  const add=(points,reason)=>{score+=points;reasons.push({points,reason});};

  if(active.length>=5) add(4,`active Features ${active.length}`);
  else if(active.length>=3) add(2,`active Features ${active.length}`);
  else if(active.length>=1) add(1,`active Features ${active.length}`);

  const multinomial=active.filter(f=>{
    const rf=researchById.get(f.researchFeatureId);
    return f.modelTypeOverride==='multinomial'||f.modelTypeOverride==='marginal_multinomial'||rf?.candidateModel==='multinomial'||Array.isArray(f.categoryInputIds)||f.residualCategoryLabel;
  });
  if(multinomial.length) add(Math.min(8,multinomial.length*3),`active categorical/multinomial Features ${multinomial.length}`);

  const suppressed=active.filter(f=>Array.isArray(f.suppressedByFeatureIds)&&f.suppressedByFeatureIds.length>0);
  if(suppressed.length) add(4,`fallback/suppression contracts ${suppressed.length}`);

  const conditional=active.filter(f=>{
    const rf=researchById.get(f.researchFeatureId);
    const text=[rf?.trialUnit,rf?.observationScope,rf?.denominatorDefinition,f.userReason,f.userFacingReason].filter(Boolean).join(' ');
    return /条件|時のみ|成功|失敗|終了画面|画面|終了時|当選時|契機|初回|設定変更|高確|CZ中|AT中|REG中|BIG中/i.test(text);
  });
  if(conditional.length) add(Math.min(6,conditional.length*2),`conditional/event-scoped active Features ${conditional.length}`);

  const linked=observation?.linkedService;
  if(linked?.status==='CHECKED'&&(linked.availableData?.length??0)>0) add(5,`linked service has ${linked.availableData.length} known data items`);
  else if(linked?.status==='UNRESOLVED') add(2,'linked service unresolved');

  const predecessor=observation?.predecessorData;
  if(predecessor?.status==='CHECKED'&&(predecessor.availableData?.length??0)>0) add(3,`predecessor/seated data has ${predecessor.availableData.length} known items`);
  else if(predecessor?.status==='UNRESOLVED') add(1,'predecessor/seated scope unresolved');

  const evidenceCount=(selection.evidence??[]).length;
  if(evidenceCount>=5) add(3,`Evidence definitions ${evidenceCount}`);
  else if(evidenceCount>0) add(1,`Evidence definitions ${evidenceCount}`);

  let priority='LOW';
  if(score>=15) priority='HIGH';
  else if(score>=8) priority='MEDIUM';
  return {score,priority,activeFeatureCount:active.length,multinomialFeatureIds:multinomial.map(f=>f.featureId),suppressedFeatureIds:suppressed.map(f=>f.featureId),conditionalFeatureIds:conditional.map(f=>f.featureId),evidenceCount,reasons};
}

export function auditLegacyObservationPriority(rootArg='.'){
  const root=path.resolve(rootArg);
  const researchRoot=path.join(root,'research');
  const machines=[];
  for(const entry of fs.readdirSync(researchRoot,{withFileTypes:true})){
    if(!entry.isDirectory()||entry.name.startsWith('_')) continue;
    const dir=path.join(researchRoot,entry.name);
    const op=path.join(dir,'machine-observation-data.json');
    const sp=path.join(dir,'selection-data.json');
    if(!fs.existsSync(op)||!fs.existsSync(sp)) continue;
    const observation=read(op);
    if(observation.schemaVersion!=='machine-observation-data-v1') continue;
    const selection=read(sp);
    const rp=path.join(dir,'research-data.json');
    const research=fs.existsSync(rp)?read(rp):null;
    machines.push({machineId:entry.name,displayName:selection.displayName??research?.machine?.displayName??entry.name,...scoreLegacyObservationMachine({selection,observation,research})});
  }
  machines.sort((a,b)=>b.score-a.score||b.activeFeatureCount-a.activeFeatureCount||a.machineId.localeCompare(b.machineId));
  const summary={machineCount:machines.length,HIGH:machines.filter(x=>x.priority==='HIGH').length,MEDIUM:machines.filter(x=>x.priority==='MEDIUM').length,LOW:machines.filter(x=>x.priority==='LOW').length};
  return {schemaVersion:'v6.4-observation-v1-priority-v1',generatedAt:new Date().toISOString(),summary,machines};
}

export function writeLegacyObservationPriority(rootArg='.',outArg='reports/v64-observation-v1-priority.json'){
  const root=path.resolve(rootArg);
  const report=auditLegacyObservationPriority(root);
  const out=path.resolve(root,outArg);
  fs.mkdirSync(path.dirname(out),{recursive:true});
  fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
  return report;
}

const isDirect=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isDirect){
  const report=writeLegacyObservationPriority(process.argv[2]??'.',process.argv[3]??'reports/v64-observation-v1-priority.json');
  console.log(`Legacy Observation priority: ${report.summary.machineCount} | HIGH ${report.summary.HIGH} | MEDIUM ${report.summary.MEDIUM} | LOW ${report.summary.LOW}`);
  for(const m of report.machines.slice(0,30)) console.log(`${m.priority.padEnd(6)} ${String(m.score).padStart(2)} ${m.machineId} active=${m.activeFeatureCount} multi=${m.multinomialFeatureIds.length} conditional=${m.conditionalFeatureIds.length}`);
}
