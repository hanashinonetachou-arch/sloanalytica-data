export const APP_RUNTIME_VALIDATOR_CONTRACT='app-runtime-v1';
const canonical=(v:any):string=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const fail=(m:string):never=>{throw new Error('APP_RUNTIME_VALIDATION_FAILED:'+m)};
export function validateAppRuntimeDocument(doc:any,projection:any,projectionArtifact:any){
 if(doc?.schemaVersion!=='app-runtime-v1'||doc?.manifestVersion!=='8.5')fail('HEADER');
 if(doc.batchId!==projection.batchId||doc.machineId!==projection.machineId||doc.machineName!==projection.machineName)fail('IDENTITY');
 if(canonical(doc.sourceArtifact)!==canonical(projectionArtifact))fail('LINKAGE');
 if((projection.activeFeatures??[]).length>0||(projection.inactiveFeatures??[]).length>0)fail('FEATURE_PROFILE_UNSUPPORTED');
 if(projection.settings?.status!=='SOURCE_DERIVED'||!(projection.settings?.values?.length>0))fail('SETTINGS_REQUIRED');
 const p=doc.package;if(p?.schemaVersion!==1||p.machine?.machineId!==projection.machineId||p.machine?.displayName!==projection.machineName||p.machine?.machineDataVersion!=='8.5.0-'+projection.batchId)fail('MACHINE');
 if(canonical(p.machine?.settings)!==canonical(projection.settings.values)||canonical(p.metadata?.settings)!==canonical(projection.settings.values)||p.metadata?.settingsStatus!=='SOURCE_DERIVED')fail('SETTINGS_COPY');
 if(!Array.isArray(p.inputs?.inputs)||p.inputs.inputs.length!==0||!Array.isArray(p.features?.features)||p.features.features.length!==0||!Array.isArray(p.features?.runtimeProjection)||p.features.runtimeProjection.length!==0)fail('NO_FEATURE_PROFILE');
 if(p.ui?.contractVersion!=='runtime-ui-v8'||p.ui?.source!=='CANONICAL_UI'||p.ui?.sourceSchemaVersion!==projection.runtimeUi?.schemaVersion||p.ui?.accordion?.singleOpen!==true||p.ui?.quickInput?.enabled!==false)fail('UI_HEADER');
 const expectedSections=(projection.runtimeUi?.evidenceSections??[]);if((p.ui?.v8Sections??[]).length!==expectedSections.length)fail('UI_SECTION_COVERAGE');
 for(let i=0;i<expectedSections.length;i++){const a=p.ui.v8Sections[i],s=expectedSections[i];if(a.id!==s.id||a.title!==s.title||(a.items??[]).length!==(s.evidenceItems??[]).length)fail('UI_SECTION:'+s.id);for(let j=0;j<(s.evidenceItems??[]).length;j++){const e=s.evidenceItems[j],n=a.items[j];if(n.evidenceId!==e.findingId||n.label!==e.label)fail('UI_EVIDENCE:'+e.findingId)}}
 if(canonical(p.evidence?.references)!==canonical(projection.evidence??[])||!Array.isArray(p.evidence?.evidences)||p.evidence.evidences.length!==0)fail('EVIDENCE_REFERENCE_ONLY');
 if(p.provenance?.legacyOracleUsed!==false||p.provenance?.generationPath!=='V8_5_PRODUCTION_PIPELINE')fail('PROVENANCE');
 return [{validator:APP_RUNTIME_VALIDATOR_CONTRACT,sections:(p.ui.v8Sections??[]).length,evidenceReferences:(projection.evidence??[]).length,settings:p.machine.settings.length}];
}
export function validateAppRuntimeArtifacts(s:any,a:any,r:any){const out=r.producedArtifacts??[];if(out.length!==1)fail('OUTPUT_COUNT');const ref=out[0];if(ref.kind!=='app-runtime'||typeof ref.path!=='string'||!ref.path.startsWith('production/batches/'+a.batchId+'/artifacts/'+a.machineId+'/app_runtime/'))fail('OUTPUT_REF');const prefix='production/';const doc=s.read(...ref.path.slice(prefix.length).split('/'));const ps=s.read('batches',a.batchId,'machines',a.machineId,'stages','RUNTIME_PROJECTION.json');if(!ps.authoritativeOutputRef?.path)fail('PROJECTION_AUTHORITY_MISSING');const projection=s.read(...String(ps.authoritativeOutputRef.path).slice(prefix.length).split('/'));return validateAppRuntimeDocument(doc,projection,ps.authoritativeOutputRef)}
