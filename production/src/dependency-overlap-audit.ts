import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const canonical=(v:any):string=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
export function auditDependencyProjection(research:any,evaluation:any,candidate:any,appRuntime:any){
 const issues:string[]=[];const pkg=appRuntime?.package??appRuntime;
 if(evaluation?.dependencyReview?.status!=='COMPLETE')issues.push('DEPENDENCY_REVIEW_INCOMPLETE');
 const evalBy=new Map((evaluation?.evaluations??[]).map((x:any)=>[x.findingId,x]));
 for(const f of research?.findings??[]){
  if(f.settingDistribution===undefined)continue;const e:any=evalBy.get(f.findingId);if(!e)continue;
  if(canonical(e.settingDistribution)!==canonical(f.settingDistribution))issues.push('RAW_DISTRIBUTION_CHANGED:'+f.findingId);
 }
 const candBy=new Map((candidate?.candidates??[]).map((x:any)=>[x.findingId,x]));
 const active=new Set((pkg?.features?.runtimeProjection??[]).filter((x:any)=>x.runtimeStatus==='ACTIVE').map((x:any)=>x.featureId));
 for(const c of candidate?.candidates??[]){
  if(c.dependencyResolution==='UNRESOLVED')issues.push('CANDIDATE_DEPENDENCY_UNRESOLVED:'+c.findingId);
  if(c.runtimeInferenceAllowed!==true&&active.has(c.findingId))issues.push('NON_RUNTIME_CANDIDATE_ACTIVE:'+c.findingId);
 }
 for(const group of candidate?.dependencyGroups??[]){
  const members=(group.members??[]).map((id:string)=>candBy.get(id)).filter(Boolean) as any[];
  const allowed=members.filter(c=>c.runtimeInferenceAllowed===true);
  if(group.resolution==='CONDITIONALLY_SEPARATE'){
   if(allowed.length!==members.length)issues.push('CONDITIONALLY_SEPARATE_MEMBER_DISABLED:'+group.groupId);
  }else if(group.resolution==='SINGLE_MEMBER_SELECTED'){
   if(allowed.length!==1||allowed[0]?.findingId!==group.selectedFindingId)issues.push('SINGLE_MEMBER_RESOLUTION_INVALID:'+group.groupId);
  }else if(group.resolution==='MUTUALLY_EXCLUSIVE_CATEGORICAL'){
   if(allowed.length!==1)issues.push('CATEGORICAL_GROUP_RUNTIME_COUNT:'+group.groupId+':'+allowed.length);
  }else if(group.resolution==='HELD_NO_JOINT_MODEL'){
   if(allowed.length!==0)issues.push('HELD_GROUP_RUNTIME_ACTIVE:'+group.groupId);
  }else issues.push('UNKNOWN_DEPENDENCY_RESOLUTION:'+String(group.resolution));
 }
 const highLow=pkg?.v8?.machineResearchSummary?.highLowDiscrimination;
 if(highLow?.selectedFeatureId){const c:any=candBy.get(highLow.selectedFeatureId);if(c&&c.runtimeInferenceAllowed!==true)issues.push('HIGH_LOW_NON_RUNTIME_SELECTION:'+highLow.selectedFeatureId)}
 if(research?.machineId==='L_GOBLIN_SLAYER_2_JZ'){
  const ids=['cz-first-hit','at-first-hit','weak-role-cz','zone-300-500-cz'];
  const group=(candidate?.dependencyGroups??[]).find((x:any)=>x.groupId==='goblin-cz-at-overlap');
  if(!group)issues.push('GOBLIN_DEPENDENCY_GROUP_MISSING');
  else{
   if(group.resolution!=='SINGLE_MEMBER_SELECTED'||group.selectedFindingId!=='cz-first-hit')issues.push('GOBLIN_REPRESENTATIVE_INVALID:'+String(group.resolution)+':'+String(group.selectedFindingId));
   for(const id of ids)if(!(group.members??[]).includes(id))issues.push('GOBLIN_GROUP_MEMBER_MISSING:'+id);
  }
  const notAdopted=new Map((pkg?.v8?.machineResearchSummary?.notAdopted??[]).map((x:any)=>[x.featureId,x]));
  for(const id of ['at-first-hit','weak-role-cz','zone-300-500-cz']){
   const c:any=candBy.get(id);if(!c||c.runtimeInferenceAllowed!==false||c.resolvedIntoFindingId!=='cz-first-hit')issues.push('GOBLIN_NON_RUNTIME_RESOLUTION:'+id);
   const row:any=notAdopted.get(id);const reason=String(row?.reason??'');
   if(!row||reason.length<40||!/重複|共有|含まれ/.test(reason))issues.push('GOBLIN_NOT_ADOPTED_REASON:'+id);
   if(active.has(id))issues.push('GOBLIN_DUPLICATE_FEATURE_ACTIVE:'+id);
  }
  if(!active.has('cz-first-hit'))issues.push('GOBLIN_CZ_REPRESENTATIVE_INACTIVE');
  for(const id of ids){const f=(research.findings??[]).find((x:any)=>x.findingId===id);if(!f?.settingDistribution)issues.push('GOBLIN_RAW_DISTRIBUTION_MISSING:'+id)}
 }
 return {status:issues.length?'FAIL':'PASS',issues,dependencyGroups:(candidate?.dependencyGroups??[]).length,activeFeatures:active.size};
}
function readJson(p:string){return JSON.parse(fs.readFileSync(p,'utf8'))}
function readRef(root:string,stage:any){if(!stage?.authoritativeOutputRef?.path)throw new Error('AUTHORITATIVE_OUTPUT_MISSING:'+String(stage?.name));return readJson(path.join(root,String(stage.authoritativeOutputRef.path).replace(/^production\//,'')))}
export function auditBatchDependencyOverlap(root:string,batchId:string,machineIds?:string[]){
 const batch=readJson(path.join(root,'batches',batchId,'batch.json'));const ids=machineIds?.length?machineIds:batch.waves.flatMap((w:any)=>w.machineIds);const machines:any[]=[];
 for(const machineId of ids){
  const research=readJson(path.join(root,'batches',batchId,'artifacts',machineId,'research','result.json'));
  const evaluation=readRef(root,readJson(path.join(root,'batches',batchId,'machines',machineId,'stages','EVALUATION.json')));
  const candidate=readRef(root,readJson(path.join(root,'batches',batchId,'machines',machineId,'stages','CANDIDATE_CONTRACT.json')));
  const app=readRef(root,readJson(path.join(root,'batches',batchId,'machines',machineId,'stages','APP_RUNTIME.json')));
  const result=auditDependencyProjection(research,evaluation,candidate,app);machines.push({machineId,...result});
 }
 const failed=machines.filter(x=>x.status!=='PASS');const report={schemaVersion:'dependency-overlap-audit-v1',batchId,total:machines.length,passed:machines.length-failed.length,failed:failed.length,machines};
 if(failed.length)throw new Error('DEPENDENCY_OVERLAP_AUDIT_FAILED:'+JSON.stringify(report));return report;
}
const direct=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));
if(direct){const batchId=process.argv[2];if(!batchId)throw new Error('USAGE: dependency-overlap-audit <batch-id> [machine-id...]');console.log(JSON.stringify(auditBatchDependencyOverlap(process.cwd(),batchId,process.argv.slice(3)),null,2))}
