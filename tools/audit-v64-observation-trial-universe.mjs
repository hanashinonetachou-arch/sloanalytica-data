#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]??'.');
const outArg=process.argv[3]??'reports/v64-observation-trial-universe-audit.json';
const outPath=path.resolve(root,outArg);
const researchRoot=path.join(root,'research');
const INCLUDED=new Set(['INCLUDE_PRIMARY','INCLUDE_SUPPORT','INCLUDE_FALLBACK']);
const files=fs.readdirSync(researchRoot,{withFileTypes:true}).filter(e=>e.isDirectory()&&!e.name.startsWith('_'));
const machines=[];

function readJson(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }
function issue(type,severity,message,extra={}){ return {type,severity,message,...extra}; }

for(const entry of files){
  const machineId=entry.name;
  const dir=path.join(researchRoot,machineId);
  const selectionPath=path.join(dir,'selection-data.json');
  const obsPath=path.join(dir,'machine-observation-data.json');
  if(!fs.existsSync(selectionPath)) continue;
  const s=readJson(selectionPath);
  const issues=[];
  const active=(s.features??[]).filter(f=>INCLUDED.has(f.adoptionCategory));
  if(!fs.existsSync(obsPath)){
    issues.push(issue('OBSERVATION_FILE_MISSING','REVIEW','Selection exists but machine-observation-data.json is missing.'));
  } else {
    const o=readJson(obsPath);
    if(o.schemaVersion==='machine-observation-data-v1'){
      issues.push(issue('OBSERVATION_V1_COMPATIBILITY','REVIEW','Legacy Observation v1 cannot explicitly prove per-Feature source/trial-universe linkage.',{activeFeatureCount:active.length}));
      for(const [key,block] of Object.entries({machineMenu:o.machineMenu,linkedService:o.linkedService,predecessorData:o.predecessorData})){
        if(block?.status==='UNRESOLVED') issues.push(issue('LEGACY_SOURCE_SCOPE_UNRESOLVED','REVIEW',`${key} is unresolved in legacy Observation v1.`,{sourceBlock:key}));
      }
    } else if(o.schemaVersion==='machine-observation-data-v2'){
      const observations=new Map((o.observations??[]).map(x=>[x.observationId,x]));
      const mappings=new Map((o.featureMappings??[]).map(x=>[x.featureId,x]));
      for(const f of active){
        const m=mappings.get(f.featureId);
        if(!m){
          issues.push(issue('ACTIVE_FEATURE_MAPPING_MISSING','REVIEW','Active inference Feature has no Observation v2 mapping.',{featureId:f.featureId,researchFeatureId:f.researchFeatureId}));
          continue;
        }
        if(m.mappingType==='INCOMPATIBLE'||m.usableForInference===false){
          issues.push(issue('ACTIVE_FEATURE_OBSERVATION_INCOMPATIBLE','HIGH_RISK','Active inference Feature is explicitly incompatible/unusable for inference in Observation v2.',{featureId:f.featureId,mappingType:m.mappingType,usableForInference:m.usableForInference}));
        } else if(m.mappingType==='UNRESOLVED'){
          issues.push(issue('ACTIVE_FEATURE_MAPPING_UNRESOLVED','REVIEW','Active inference Feature mapping is unresolved.',{featureId:f.featureId}));
        }
        for(const id of m.observationIds??[]){
          const ob=observations.get(id);
          if(!ob){
            issues.push(issue('ACTIVE_FEATURE_OBSERVATION_MISSING','HIGH_RISK','Active inference Feature references a missing Observation.',{featureId:f.featureId,observationId:id}));
            continue;
          }
          if(ob.status==='UNRESOLVED') issues.push(issue('ACTIVE_FEATURE_SOURCE_UNRESOLVED','REVIEW','An Observation used by an active inference Feature is unresolved.',{featureId:f.featureId,observationId:id,sourceType:ob.sourceType}));
        }
      }
      for(const [key,status] of Object.entries(o.sourceCoverage??{})){
        if(status==='UNRESOLVED') issues.push(issue('SOURCE_COVERAGE_UNRESOLVED','REVIEW','Observation source coverage remains unresolved.',{sourceSurface:key}));
      }
      for(const v of o.fieldVerificationItems??[]){
        if(v.status==='WAITING_FOR_MACHINE'&&v.priority==='HIGH') issues.push(issue('HIGH_PRIORITY_FIELD_VERIFICATION_PENDING','REVIEW','High-priority field verification remains pending.',{verificationId:v.verificationId,question:v.question,sourceType:v.sourceType}));
      }
    } else {
      issues.push(issue('OBSERVATION_SCHEMA_UNKNOWN','HIGH_RISK',`Unsupported Observation schema: ${o.schemaVersion??'(missing)'}`));
    }
  }
  let status='PASS';
  if(issues.some(x=>x.severity==='HIGH_RISK')) status='HIGH_RISK';
  else if(issues.length) status='REVIEW';
  machines.push({machineId,displayName:s.displayName??machineId,status,activeFeatureCount:active.length,issues});
}

const summary={machineCount:machines.length,PASS:machines.filter(x=>x.status==='PASS').length,REVIEW:machines.filter(x=>x.status==='REVIEW').length,HIGH_RISK:machines.filter(x=>x.status==='HIGH_RISK').length};
const issueCounts={};
for(const m of machines) for(const i of m.issues) issueCounts[i.type]=(issueCounts[i.type]??0)+1;
const report={schemaVersion:'v6.4-observation-trial-universe-audit-v1',generatedAt:new Date().toISOString(),summary,issueCounts,machines};
fs.mkdirSync(path.dirname(outPath),{recursive:true});
fs.writeFileSync(outPath,JSON.stringify(report,null,2)+'\n');
console.log(`Observation/trial-universe audit: ${summary.machineCount} machines | PASS ${summary.PASS} | REVIEW ${summary.REVIEW} | HIGH_RISK ${summary.HIGH_RISK}`);
for(const [k,v] of Object.entries(issueCounts).sort((a,b)=>b[1]-a[1])) console.log(`- ${k}: ${v}`);
if(summary.HIGH_RISK>0) process.exitCode=2;
