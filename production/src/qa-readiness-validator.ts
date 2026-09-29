import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
export const QA_REQUIRED_STAGES=['CANONICAL_UI','MACHINE_DATA','RUNTIME_POLICY','RUNTIME_PROJECTION','APP_RUNTIME','DISTRIBUTION'] as const;
const fail=(m:string):never=>{throw new Error('QA_READINESS_FAILED:'+m)};
export function validateMachineQaReadiness(machineId:string,stageStates:Record<string,any>,pkg:any,renderReport:any){
 for(const stage of QA_REQUIRED_STAGES){
  const s=stageStates?.[stage];
  if(s?.state!=='COMPLETE'||!s?.authoritativeOutputRef?.path)fail(machineId+':STAGE_'+stage);
 }
 if(pkg?.schemaVersion!==1||pkg?.machine?.machineId!==machineId)fail(machineId+':PACKAGE_IDENTITY');
 if(pkg?.provenance?.manifestVersion!=='8.5'||pkg?.provenance?.generationPath!=='V8_5_PRODUCTION_PIPELINE'||pkg?.provenance?.legacyOracleUsed!==false)fail(machineId+':V8_PROVENANCE');
 if(pkg?.ui?.contractVersion!=='runtime-ui-v8'||pkg?.ui?.source!=='CANONICAL_UI')fail(machineId+':CANONICAL_UI_PACKAGE');
 if(typeof pkg?.machine?.machineDataVersion!=='string'||!pkg.machine.machineDataVersion.startsWith('8.5.0-batch-'))fail(machineId+':V8_VERSION');
 const refs=pkg?.evidence?.references??[],defs=pkg?.evidence?.evidences??[];
 if(!Array.isArray(refs)||!Array.isArray(defs))fail(machineId+':EVIDENCE_ARRAYS');
 const expected=refs.flatMap((s:any)=>(s?.evidenceItems??[]).map((e:any)=>e.findingId));
 const actual=defs.map((e:any)=>e?.id);
 if(expected.length!==actual.length||expected.some((id:string,i:number)=>id!==actual[i]))fail(machineId+':EVIDENCE_MATERIALIZATION');
 const uiEvidence=(pkg?.ui?.v8Sections??[]).filter((s:any)=>String(s?.id??'').startsWith('EVI_'));
 if(expected.length&&uiEvidence.length!==refs.length)fail(machineId+':EVIDENCE_UI_COVERAGE');
 if(renderReport?.schemaVersion!=='rendered-ui-validation-v1'||renderReport?.machineId!==machineId)fail(machineId+':RENDER_REPORT_IDENTITY');
 if(renderReport?.status!=='PASS')fail(machineId+':RENDERED_UI_VALIDATION');
 if(renderReport?.contractVersion!=='rendered-canonical-ui-v1'||renderReport?.renderer!=='MANIFEST_V8'||renderReport?.source!=='CANONICAL_UI'||renderReport?.manifestRevision!=='8.5')fail(machineId+':RENDER_CONTRACT');
 const checks=renderReport?.checks??{};
 for(const key of ['noDuplicateUi','noEmptySections','evidenceCoverage','summaryCoverage','noInternalWording','noLegacyRendererFallback','denominatorBinding','importanceCoverage','explanationCoverage','evidenceBodyCoverage'])if(checks[key]!==true)fail(machineId+':RENDER_CHECK_'+key);
 return {machineId,status:'QA_READY',evidenceCount:actual.length,renderedUi:'PASS'};
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
