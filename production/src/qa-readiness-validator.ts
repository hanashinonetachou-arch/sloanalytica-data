export const QA_REQUIRED_STAGES=['CANONICAL_UI','MACHINE_DATA','RUNTIME_POLICY','RUNTIME_PROJECTION','APP_RUNTIME','DISTRIBUTION'] as const;
const fail=(m:string):never=>{throw new Error('QA_READINESS_FAILED:'+m)};
export function validateMachineQaReadiness(machineId:string,stageStates:Record<string,any>,pkg:any){
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
 for(const s of uiEvidence)if(typeof s?.description!=='string'||!s.description.trim())fail(machineId+':EVIDENCE_UI_RENDERABLE');
 return {machineId,status:'QA_READY',evidenceCount:actual.length};
}
