import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=JSON.parse(fs.readFileSync(path.join(ROOT,'reports','cross-sectional-v7-audit.json'),'utf8'));
const machinesByClassification={};
for(const cls of ['GREEN','FIX','FIELD_VERIFY','RESEARCH_REOPEN','BLOCKED']){
  machinesByClassification[cls]=source.results.filter(r=>r.classification===cls).map(r=>({machineId:r.machineId,displayName:r.displayName,issues:r.issues.map(x=>x.code)}));
}
const issueMap=new Map();
for(const r of source.results) for(const x of r.issues){
  if(!issueMap.has(x.code)) issueMap.set(x.code,[]);
  issueMap.get(x.code).push({machineId:r.machineId,displayName:r.displayName,classification:r.classification,message:x.message});
}
const machinesByIssue=Object.fromEntries([...issueMap.entries()].sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0])));
const deterministicFixCodes=new Set(['OBSERVATION_VALIDATION','BLANK_ZERO_DEFAULT','MISSING_UI_DESIGN','USER_FACING_INTERNAL_TERM','ADOPTED_INPUT_NO_UI_ROUTE','DENOMINATOR_SHARING_MISMATCH','CATALOG_VERSION_MISMATCH','CATALOG_SIZE_MISMATCH','CATALOG_SHA_MISMATCH','ADOPTED_FEATURE_NOT_MATERIALIZED','ADOPTED_FEATURE_NOT_IN_INFERENCE','ADOPTED_INPUT_NOT_MATERIALIZED','EVIDENCE_NOT_MATERIALIZED','UI_VALIDATION']);
const researchCodes=new Set(['MISSING_OBSERVATION','OBSERVATION_LEGACY_V1','OPEN_RESEARCH_REOPEN','ADOPTED_FEATURE_NO_OBSERVATION_MAPPING','ADOPTED_FEATURE_OBSERVATION_UNUSABLE']);
const fieldCodes=new Set(['FIELD_VERIFICATION_WAITING','UI_REVIEW_PENDING']);
const workstreams={
  deterministicFix:source.results.filter(r=>r.issues.some(x=>deterministicFixCodes.has(x.code))).map(r=>({machineId:r.machineId,displayName:r.displayName,codes:[...new Set(r.issues.filter(x=>deterministicFixCodes.has(x.code)).map(x=>x.code))]})),
  researchReopen:source.results.filter(r=>r.issues.some(x=>researchCodes.has(x.code))).map(r=>({machineId:r.machineId,displayName:r.displayName,codes:[...new Set(r.issues.filter(x=>researchCodes.has(x.code)).map(x=>x.code))]})),
  fieldVerify:source.results.filter(r=>r.issues.some(x=>fieldCodes.has(x.code))).map(r=>({machineId:r.machineId,displayName:r.displayName,codes:[...new Set(r.issues.filter(x=>fieldCodes.has(x.code)).map(x=>x.code))]})),
};
const summary={
  schemaVersion:'cross-sectional-v7-priority-v1',
  generatedAt:new Date().toISOString(),
  canonicalMachineCount:source.canonicalMachineCount,
  classificationCounts:source.classificationCounts,
  coverage:source.coverage,
  workstreamCounts:Object.fromEntries(Object.entries(workstreams).map(([k,v])=>[k,v.length])),
  machinesByClassification,
  machinesByIssue,
  workstreams
};
fs.writeFileSync(path.join(ROOT,'reports','cross-sectional-v7-priority.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({classificationCounts:summary.classificationCounts,coverage:summary.coverage,workstreamCounts:summary.workstreamCounts,classificationIds:Object.fromEntries(Object.entries(machinesByClassification).map(([k,v])=>[k,v.map(x=>x.machineId)]))},null,2));
