export const APP_RUNTIME_VALIDATOR_CONTRACT='app-runtime-v1';
const canonical=(v:any):string=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const fail=(m:string):never=>{throw new Error('APP_RUNTIME_VALIDATION_FAILED:'+m)};
const probability=(v:any):number=>{if(typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1)return v;if(typeof v==='string'&&v.startsWith('1/')){const d=Number(v.slice(2));if(Number.isFinite(d)&&d>0)return 1/d}fail('PROBABILITY:'+String(v))};
const settingKey=(k:string)=>k.startsWith('SET_')?k:'SET_'+k;
const near=(a:any,b:any)=>typeof a==='number'&&typeof b==='number'&&Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(a),Math.abs(b));
export function validateAppRuntimeDocument(doc:any,projection:any,projectionArtifact:any){
 if(doc?.schemaVersion!=='app-runtime-v1'||doc?.manifestVersion!=='8.5')fail('HEADER');
 if(doc.batchId!==projection.batchId||doc.machineId!==projection.machineId||doc.machineName!==projection.machineName)fail('IDENTITY');
 if(canonical(doc.sourceArtifact)!==canonical(projectionArtifact))fail('LINKAGE');
 if(projection.settings?.status!=='SOURCE_DERIVED'||!(projection.settings?.values?.length>0))fail('SETTINGS_REQUIRED');
 const p=doc.package;if(p?.schemaVersion!==1||p.machine?.machineId!==projection.machineId||p.machine?.displayName!==projection.machineName||p.machine?.machineDataVersion!=='8.5.0-'+projection.batchId)fail('MACHINE');
 if(canonical(p.machine?.settings)!==canonical(projection.settings.values)||canonical(p.metadata?.settings)!==canonical(projection.settings.values)||p.metadata?.settingsStatus!=='SOURCE_DERIVED')fail('SETTINGS_COPY');
 const expectedSections=projection.runtimeUi?.numericSections??[],active=projection.activeFeatures??[],inactive=projection.inactiveFeatures??[];
 const expectedInputs=expectedSections.flatMap((s:any)=>s.inputs??[]);
 if(!Array.isArray(p.inputs?.inputs)||p.inputs.inputs.length!==expectedInputs.length)fail('INPUT_COVERAGE');
 const inputBy=new Map((p.inputs.inputs??[]).map((x:any)=>[x.id,x]));if(inputBy.size!==expectedInputs.length)fail('INPUT_DUPLICATE');
 for(const x of expectedInputs){const a:any=inputBy.get(x.id);if(!a||a.name!==x.label||!['integer','counter'].includes(a.type))fail('INPUT:'+x.id)}
 if(!Array.isArray(p.features?.features)||p.features.features.length!==active.length)fail('FEATURE_COVERAGE');
 const featureBy=new Map((p.features.features??[]).map((x:any)=>[x.featureId,x]));
 const secBy=new Map(expectedSections.map((s:any)=>[s.sourceFindingId,s]));
 for(const src of active){
  const a:any=featureBy.get(src.findingId),s:any=secBy.get(src.findingId);if(!a||!s)fail('FEATURE:'+src.findingId);
  const trial=s.inputs?.find((x:any)=>x.role==='trial');if(!trial||a.denominatorInputId!==trial.id||a.probabilityEngineUsage!==true||a.calculationRole!=='PROBABILITY')fail('FEATURE_BASE:'+src.findingId);
  if(src.model==='BERNOULLI'){
   const success=s.inputs?.find((x:any)=>x.role==='success');if(a.modelType!=='binomial'||a.numeratorInputId!==success?.id)fail('FEATURE_BERNOULLI:'+src.findingId);
   for(const [k,v] of Object.entries(src.settingDistribution??{}))if(!near(a.probabilities?.[settingKey(k)],probability(v)))fail('FEATURE_PROB:'+src.findingId+':'+k);
  }else if(src.model==='CATEGORICAL'){
   const cats=s.inputs?.filter((x:any)=>x.role==='categoryCount')??[];if(a.modelType!=='multinomial'||a.numeratorInputId!==cats[0]?.id||canonical(a.categoryInputIds??[])!==canonical(cats.slice(1).map((x:any)=>x.id)))fail('FEATURE_CATEGORICAL:'+src.findingId);
   for(const [k,row] of Object.entries(src.settingDistribution??{}) as any){const expected=cats.map((x:any)=>row[x.label]);if(canonical(a.categoryProbabilities?.[settingKey(k)])!==canonical(expected))fail('FEATURE_CATEGORY_PROB:'+src.findingId+':'+k)}
  }else fail('FEATURE_MODEL:'+src.findingId);
 }
 if(!Array.isArray(p.features?.runtimeProjection)||p.features.runtimeProjection.length!==active.length+inactive.length)fail('RUNTIME_PROJECTION_COVERAGE');
 const rpBy=new Map(p.features.runtimeProjection.map((x:any)=>[x.featureId,x]));
 for(const x of active)if(rpBy.get(x.findingId)?.runtimeStatus!=='ACTIVE')fail('RUNTIME_ACTIVE:'+x.findingId);
 for(const x of inactive)if(rpBy.get(x.findingId)?.runtimeStatus!=='INACTIVE')fail('RUNTIME_INACTIVE:'+x.findingId);
 if(p.ui?.contractVersion!=='runtime-ui-v8'||p.ui?.source!=='CANONICAL_UI'||p.ui?.sourceSchemaVersion!==projection.runtimeUi?.schemaVersion||p.ui?.accordion?.singleOpen!==true||p.ui?.quickInput?.enabled!==false)fail('UI_HEADER');
 const expectedUiCount=(projection.runtimeUi?.numericSections??[]).length+(projection.runtimeUi?.evidenceSections??[]).length;
 if((p.ui?.v8Sections??[]).length!==expectedUiCount)fail('UI_SECTION_COVERAGE');
 const expectedIds=[...(projection.runtimeUi?.numericSections??[]).map((s:any)=>s.id),...(projection.runtimeUi?.evidenceSections??[]).map((s:any)=>s.id)];
 if(canonical((p.ui.v8Sections??[]).map((s:any)=>s.id))!==canonical(expectedIds))fail('UI_SECTION_IDS');
 if(canonical(p.evidence?.references)!==canonical(projection.evidence??[])||!Array.isArray(p.evidence?.evidences)||p.evidence.evidences.length!==0)fail('EVIDENCE_REFERENCE_ONLY');
 if(p.provenance?.legacyOracleUsed!==false||p.provenance?.generationPath!=='V8_5_PRODUCTION_PIPELINE')fail('PROVENANCE');
 return [{validator:APP_RUNTIME_VALIDATOR_CONTRACT,sections:(p.ui.v8Sections??[]).length,evidenceReferences:(projection.evidence??[]).length,settings:p.machine.settings.length,features:active.length,inputs:expectedInputs.length}];
}
export function validateAppRuntimeArtifacts(s:any,a:any,r:any){const out=r.producedArtifacts??[];if(out.length!==1)fail('OUTPUT_COUNT');const ref=out[0];if(ref.kind!=='app-runtime'||typeof ref.path!=='string'||!ref.path.startsWith('production/batches/'+a.batchId+'/artifacts/'+a.machineId+'/app_runtime/'))fail('OUTPUT_REF');const prefix='production/';const doc=s.read(...ref.path.slice(prefix.length).split('/'));const ps=s.read('batches',a.batchId,'machines',a.machineId,'stages','RUNTIME_PROJECTION.json');if(!ps.authoritativeOutputRef?.path)fail('PROJECTION_AUTHORITY_MISSING');const projection=s.read(...String(ps.authoritativeOutputRef.path).slice(prefix.length).split('/'));return validateAppRuntimeDocument(doc,projection,ps.authoritativeOutputRef)}
