#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.argv[2] ?? '.');
const OUT = path.resolve(process.argv[3] ?? path.join(ROOT, 'reports', 'phase9-feature-dependency-audit.json'));
const ACTIVE = new Set(['INCLUDE_PRIMARY','INCLUDE_SUPPORT']);
const arr = v => Array.isArray(v) ? v : [];
const obj = v => v && typeof v === 'object' && !Array.isArray(v);
const uniq = xs => [...new Set(xs.filter(Boolean))];
const read = p => JSON.parse(fs.readFileSync(p,'utf8'));
const active = f => ACTIVE.has(f?.adoptionCategory) && f?.calculationRole !== 'DISPLAY_ONLY' && f?.probabilityEngineUsage !== false;

function eventInputs(f){
  const residualBases = new Set(Object.keys(obj(f?.categorySubtractInputIds) ? f.categorySubtractInputIds : {}));
  const xs = [f?.numeratorInputId];
  for (const id of [...arr(f?.categoryInputIds), ...arr(f?.optionalCategoryInputIds)]) {
    // A category equal to the denominator and used only as the base of a residual
    // (e.g. REG total - cherry REG = single REG) is not an independent event.
    if (id === f?.denominatorInputId && residualBases.has(id)) continue;
    xs.push(id);
  }
  return uniq(xs);
}
function denominatorInputs(f){
  return uniq([f?.denominatorInputId, ...arr(f?.denominatorInputIds), ...arr(f?.trialInputIds), f?.trialCountInputId, f?.conditionedOnInputId]);
}
function suppressionSafe(a,b){
  return arr(a?.suppressedByFeatureIds).includes(b?.featureId) || arr(b?.suppressedByFeatureIds).includes(a?.featureId);
}
function conditionalSafe(parent,child){
  const pe = new Set(eventInputs(parent));
  const cd = new Set(denominatorInputs(child));
  if (child?.conditionedOnFeatureId === parent?.featureId) return true;
  if (child?.conditionedOnInputId && pe.has(child.conditionedOnInputId)) return true;
  if (child?.denominatorInputId && pe.has(child.denominatorInputId)) return true;
  for (const d of cd) if (pe.has(d)) return true;
  return false;
}
function overlapType(a,b){
  const ae = new Set(eventInputs(a)), be = new Set(eventInputs(b));
  const sharedEvents = [...ae].filter(x=>be.has(x));
  if (sharedEvents.length) return {code:'DUPLICATE_EVENT', severity:suppressionSafe(a,b)?'REVIEW':'HIGH_RISK', sharedInputs:sharedEvents};

  const aEvents = eventInputs(a), bEvents = eventInputs(b);
  const aDen = new Set(denominatorInputs(a)), bDen = new Set(denominatorInputs(b));
  const aToB = aEvents.filter(x=>bDen.has(x));
  const bToA = bEvents.filter(x=>aDen.has(x));
  if (aToB.length) return {code:'HIERARCHICAL_CONDITIONAL',severity:conditionalSafe(a,b)?'SAFE':'REVIEW',parent:a.featureId,child:b.featureId,sharedInputs:aToB};
  if (bToA.length) return {code:'HIERARCHICAL_CONDITIONAL',severity:conditionalSafe(b,a)?'SAFE':'REVIEW',parent:b.featureId,child:a.featureId,sharedInputs:bToA};
  return null;
}

const machineRoot=path.join(ROOT,'machines');
const rows=[];
for(const ent of fs.readdirSync(machineRoot,{withFileTypes:true}).filter(e=>e.isDirectory()).sort((a,b)=>a.name.localeCompare(b.name))){
  const p=path.join(machineRoot,ent.name,'machine-package.json');
  if(!fs.existsSync(p)) continue;
  let pkg;
  try{pkg=read(p);}catch(error){rows.push({machineId:ent.name,status:'HIGH_RISK',issues:[{code:'INVALID_MACHINE_PACKAGE',severity:'HIGH_RISK',detail:String(error)}]});continue;}
  const fsActive=arr(pkg?.features?.features).filter(active);
  const issues=[];
  for(let i=0;i<fsActive.length;i++) for(let j=i+1;j<fsActive.length;j++){
    const a=fsActive[i], b=fsActive[j], ov=overlapType(a,b);
    if(!ov) continue;
    issues.push({severity:ov.severity,code:ov.code,featureIds:[a.featureId,b.featureId],sharedInputs:ov.sharedInputs??[],parent:ov.parent??null,child:ov.child??null});
  }
  const featureInputIds=new Map();
  for(const f of fsActive) for(const id of uniq([...eventInputs(f),...denominatorInputs(f)])){
    if(!featureInputIds.has(id)) featureInputIds.set(id,[]);
    featureInputIds.get(id).push(f.featureId);
  }
  for(const e of arr(pkg?.evidence?.evidences)){
    const ids=featureInputIds.get(e?.inputId)??[];
    if(!ids.length) continue;
    const declared=uniq(arr(e?.sharedFeatureIds));
    const activeById=new Map(fsActive.map(f=>[f.featureId,f]));
    const declaredValid=declared.length>0 && ids.every(id=>declared.includes(id)) && declared.every(id=>{
      const f=activeById.get(id);
      return f && eventInputs(f).includes(e.inputId);
    });
    if(declaredValid) continue;
    issues.push({
      severity:'HIGH_RISK',
      code:declared.length?'INVALID_SHARED_FEATURE_EVIDENCE_CONTRACT':'EVIDENCE_FEATURE_OVERLAP',
      featureIds:ids,evidenceId:e.id,inputId:e.inputId,sharedFeatureIds:declared
    });
  }
  const contracts=new Map();
  for(const f of fsActive){
    if(!f?.numeratorInputId || !f?.denominatorInputId) continue;
    const k=`${f.numeratorInputId}|${f.denominatorInputId}`;
    if(!contracts.has(k)) contracts.set(k,[]);
    contracts.get(k).push(f);
  }
  for(const [contract,features] of contracts) if(features.length>1){
    const safe=features.some((a,i)=>features.some((b,j)=>i<j&&suppressionSafe(a,b)));
    issues.push({severity:safe?'REVIEW':'HIGH_RISK',code:'DUPLICATE_BINOMIAL_CONTRACT',featureIds:features.map(f=>f.featureId),contract});
  }
  const seen=new Set();
  const dedup=issues.filter(x=>{const k=JSON.stringify([x.code,[...(x.featureIds??[])].sort(),x.inputId??'',x.contract??'',x.sharedInputs??[]]);if(seen.has(k))return false;seen.add(k);return true;});
  const status=dedup.some(x=>x.severity==='HIGH_RISK')?'HIGH_RISK':dedup.some(x=>x.severity==='REVIEW')?'REVIEW':'PASS';
  rows.push({machineId:ent.name,displayName:pkg?.machine?.displayName??ent.name,status,activeFeatureCount:fsActive.length,issues:dedup});
}
const counts={PASS:0,REVIEW:0,HIGH_RISK:0};
for(const r of rows) counts[r.status]=(counts[r.status]??0)+1;
const issueCounts={};
for(const r of rows) for(const i of r.issues) issueCounts[i.code]=(issueCounts[i.code]??0)+1;
const report={schemaVersion:'phase9-feature-dependency-audit-v1.1',generatedAt:new Date().toISOString(),summary:{machineCount:rows.length,...counts,issueCounts},machines:rows};
fs.mkdirSync(path.dirname(OUT),{recursive:true});
fs.writeFileSync(OUT,JSON.stringify(report,null,2)+'\n');
console.log(`Phase 9 Feature Dependency Audit: PASS ${counts.PASS} / REVIEW ${counts.REVIEW} / HIGH_RISK ${counts.HIGH_RISK} / TOTAL ${rows.length}`);
console.log(JSON.stringify(report.summary));
for(const r of rows.filter(x=>x.status!=='PASS')) console.log(`${r.status}\t${r.machineId}\t${r.issues.map(i=>i.code+':'+i.featureIds?.join('+')).join(',')}`);
if(counts.HIGH_RISK>0) process.exitCode=2;
