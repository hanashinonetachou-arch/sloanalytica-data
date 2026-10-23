import {protectedInputMetadata} from './protected-input-metadata.ts';
import {concreteAdoptionReason,isGenericAdoptionReason} from './adoption-reason.ts';
import {withUnknownHistoryRecords} from './unknown-history-records.ts';
import {hasManualGameResidual,appRuntimeMachineDataVersion,playDataSourceForTrialUniverse,categoricalProbabilityRow,evidenceCategoryRecords,resolveEvidenceInputLinks,evidenceRecordInputId} from './app-runtime-builder.ts';
export const APP_RUNTIME_VALIDATOR_CONTRACT='app-runtime-v1';
const canonical=(v:any):string=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const fail=(m:string):never=>{throw new Error('APP_RUNTIME_VALIDATION_FAILED:'+m)};
const probability=(v:any):number=>{if(typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1)return v;if(typeof v==='string'&&v.startsWith('1/')){const d=Number(v.slice(2));if(Number.isFinite(d)&&d>0)return 1/d}fail('PROBABILITY:'+String(v))};
const settingKey=(k:string)=>k.startsWith('SET_')?k:'SET_'+k;
const near=(a:any,b:any)=>typeof a==='number'&&typeof b==='number'&&Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(a),Math.abs(b));
const sectionDescriptionRepeatsInputs=(section:any,sourceSection:any)=>{const description=String(section?.description??'');const labels=[...new Set((sourceSection?.inputs??[]).filter((input:any)=>['trial','success'].includes(String(input?.role??''))).map((input:any)=>String(input?.label??'').trim()).filter((label:string)=>label.length>=2))];return labels.filter((label:string)=>description.includes(label)).length>=2;};
export function validateAppRuntimeDocument(doc:any,projection:any,projectionArtifact:any){
 projection=withUnknownHistoryRecords(projection);
 if(doc?.schemaVersion!=='app-runtime-v1'||doc?.manifestVersion!=='8.5')fail('HEADER');
 if(doc.batchId!==projection.batchId||doc.machineId!==projection.machineId||doc.machineName!==projection.machineName)fail('IDENTITY');
 if(canonical(doc.sourceArtifact)!==canonical(projectionArtifact))fail('LINKAGE');
 if(projection.settings?.status!=='SOURCE_DERIVED'||!(projection.settings?.values?.length>0))fail('SETTINGS_REQUIRED');
 const p=doc.package;if(p?.schemaVersion!==1||p.machine?.machineId!==projection.machineId||p.machine?.displayName!==projection.machineName||p.machine?.machineDataVersion!==appRuntimeMachineDataVersion(projection.batchId,projection.packagePolicy?.machineDataRevision??1))fail('MACHINE');
 if(canonical(p.machine?.settings)!==canonical(projection.settings.values)||canonical(p.metadata?.settings)!==canonical(projection.settings.values)||p.metadata?.settingsStatus!=='SOURCE_DERIVED')fail('SETTINGS_COPY');
 const expectedSections=projection.runtimeUi?.numericSections??[],active=projection.activeFeatures??[],inactive=projection.inactiveFeatures??[],links=resolveEvidenceInputLinks(projection);
 const expectedNumericInputs=expectedSections.flatMap((s:any)=>s.inputs??[]);
 const expectedEvidenceInputs=(projection.evidence??[]).flatMap((s:any)=>(s.evidenceItems??[]).flatMap((e:any)=>evidenceCategoryRecords(e).flatMap((category:any,i:number)=>links.categoryInputIdByKey.has(String(e.findingId)+':'+i)?[]:[{id:evidenceRecordInputId(e,i),label:category.raw}])));
 const expectedInputs=[...expectedNumericInputs,...expectedEvidenceInputs];
 if(!Array.isArray(p.inputs?.inputs)||p.inputs.inputs.length!==expectedInputs.length)fail('INPUT_COVERAGE');
 const inputBy=new Map((p.inputs.inputs??[]).map((x:any)=>[x.id,x]));if(inputBy.size!==expectedInputs.length)fail('INPUT_DUPLICATE');
 for(const x of expectedNumericInputs){const a:any=inputBy.get(x.id);for(const [key,value] of Object.entries(protectedInputMetadata(projection.machineId,x.id)??{}))if(canonical(a?.[key])!==canonical(value))fail('PROTECTED_INPUT_METADATA:'+x.id+':'+key);if(!a||a.name!==(protectedInputMetadata(projection.machineId,x.id)?.name??x.label)||!['integer','counter'].includes(a.type))fail('INPUT:'+x.id);if(['対象回数','回数','観測機会数','該当回数'].includes(String(a.name)))fail('ABSTRACT_INPUT_LABEL:'+x.id);if(['trial','success'].includes(String(x.role??''))&&(String(a.name??'').length>30||/^(?:に|で|を|が|へ|から)/.test(String(a.name??''))))fail('INPUT_LABEL_NOT_CONCISE:'+x.id)}
 for(const x of expectedEvidenceInputs){const a:any=inputBy.get(x.id);if(!a||a.name!==x.label||a.type!=='counter'||a.inferenceRole!=='DISPLAY_ONLY'||a.unit!=='回')fail('EVIDENCE_INPUT:'+x.id)}
 if(!Array.isArray(p.features?.features)||p.features.features.length!==active.length)fail('FEATURE_COVERAGE');
 const featureBy=new Map((p.features.features??[]).map((x:any)=>[x.featureId,x]));
 for(const f of active.filter(hasManualGameResidual)){
  const s=expectedSections.find((x:any)=>x.sourceFindingId===f.findingId),trial=s.inputs.find((x:any)=>x.role==='trial'),cats=s.inputs.filter((x:any)=>x.role==='categoryCount'),other=cats.find((x:any)=>x.label==='その他');
  const expectedTerms=[{inputId:trial.id,multiplier:1},...cats.filter((x:any)=>x.id!==other.id).map((x:any)=>({inputId:x.id,multiplier:-1}))];
  const derived:any=inputBy.get(other.id);if(derived?.derivedCalculation!=='linear_combination'||derived.inputVisible!==false||canonical(derived.derivedTerms)!==canonical(expectedTerms)||(inputBy.get(trial.id) as any)?.derivedCalculation)fail('MANUAL_GAME_RESIDUAL:'+f.findingId);
  const node=(p.ui.v8Sections??[]).flatMap((x:any)=>x.items??[]).find((x:any)=>x.featureId===f.findingId);
  if(node?.interaction?.opportunityTracking?.inputId!==trial.id||node.interaction.totalOpportunities!=='SEPARATE_COUNTER'||canonical(node.interaction.categories.map((x:any)=>x.inputId))!==canonical(cats.filter((x:any)=>x.id!==other.id).map((x:any)=>x.id)))fail('MANUAL_GAME_RESIDUAL_UI:'+f.findingId);
 }
 const secBy=new Map(expectedSections.map((s:any)=>[s.sourceFindingId,s]));
 for(const src of active){
  const a:any=featureBy.get(src.findingId),s:any=secBy.get(src.findingId);if(!a||!s)fail('FEATURE:'+src.findingId);
  const trial=s.inputs?.find((x:any)=>x.role==='trial');if(!trial||a.denominatorInputId!==trial.id||a.probabilityEngineUsage!==true||a.calculationRole!=='PROBABILITY'||canonical(a.suppressedByFeatureIds??[])!==canonical(src.suppressedByFeatureIds??[]))fail('FEATURE_BASE:'+src.findingId);
  if(src.model==='BERNOULLI'){
   const success=s.inputs?.find((x:any)=>x.role==='success');if(a.modelType!=='binomial'||a.numeratorInputId!==success?.id)fail('FEATURE_BERNOULLI:'+src.findingId);
   for(const [k,v] of Object.entries(src.settingDistribution??{}))if(!near(a.probabilities?.[settingKey(k)],probability(v)))fail('FEATURE_PROB:'+src.findingId+':'+k);
  }else if(src.model==='CATEGORICAL'){
   const cats=s.inputs?.filter((x:any)=>x.role==='categoryCount')??[];const sumMode=!hasManualGameResidual(src)&&['SOURCE_EXHAUSTIVE','SOURCE_EXPLICIT_OTHER'].includes(String(src.categoryModel?.residualPolicy??''));if(a.modelType!==(src.categoryModel?.observationMode==='MARGINAL_COUNTS'?'marginal_multinomial':'multinomial')||a.numeratorInputId!==cats[0]?.id||canonical(a.categoryInputIds??[])!==canonical(cats.slice(1).map((x:any)=>x.id))||(sumMode?a.denominatorRule!=='SUM_CATEGORY_COUNTS':a.denominatorRule!==undefined))fail('FEATURE_CATEGORICAL:'+src.findingId);
   if(src.categoryModel?.observationMode==='MARGINAL_COUNTS'&&canonical(a.optionalCategoryInputIds)!==canonical(cats.map((x:any)=>x.id)))fail('MARGINAL_OBSERVATION_CONTRACT:'+src.findingId);
   if(hasManualGameResidual(src)&&canonical(a.requiredObservedInputIds)!==canonical([trial.id,...cats.filter((x:any)=>x.label!=='その他').map((x:any)=>x.id)]))fail('REQUIRED_RAW_OBSERVATIONS:'+src.findingId);
   for(const [k,row] of Object.entries(src.settingDistribution??{}) as any){const expected=categoricalProbabilityRow(row,cats.map((x:any)=>x.label),src.findingId,k);if(canonical(a.categoryProbabilities?.[settingKey(k)])!==canonical(expected))fail('FEATURE_CATEGORY_PROB:'+src.findingId+':'+k)}
  }else fail('FEATURE_MODEL:'+src.findingId);
 }
 if(!Array.isArray(p.features?.runtimeProjection)||p.features.runtimeProjection.length!==active.length+inactive.length)fail('RUNTIME_PROJECTION_COVERAGE');
 const rpBy=new Map(p.features.runtimeProjection.map((x:any)=>[x.featureId,x]));
 const importanceVocabulary=new Set(['主要','有力','補助','微小']);
 for(const x of active){const rp:any=rpBy.get(x.findingId);if(rp?.runtimeStatus!=='ACTIVE')fail('RUNTIME_ACTIVE:'+x.findingId);if(!importanceVocabulary.has(rp?.importance))fail('RUNTIME_IMPORTANCE:'+x.findingId);}
 for(const x of inactive)if(rpBy.get(x.findingId)?.runtimeStatus!=='INACTIVE')fail('RUNTIME_INACTIVE:'+x.findingId);
 if(p.ui?.contractVersion!=='runtime-ui-v8'||p.ui?.source!=='CANONICAL_UI'||p.ui?.sourceSchemaVersion!==projection.runtimeUi?.schemaVersion||p.ui?.accordion?.singleOpen!==true||p.ui?.quickInput?.enabled!==false)fail('UI_HEADER');
 if(p.ui?.gameCountPolicy!==projection.runtimeUi?.gameCountPolicy)fail('UI_GAME_COUNT_POLICY_COPY');
 if(p.ui?.playInfo?.visible!==true||!p.ui?.playInfo?.useDifference||canonical(p.ui?.playInfo)!==canonical(projection.runtimeUi?.playInfo))fail('UI_PLAY_INFO_COPY');if(!['TOTAL_ONLY','NORMAL_ONLY','TOTAL_AND_NORMAL','NONE'].includes(String(p.ui?.playInfo?.mode??'')))fail('UI_PLAY_INFO_MODE');
 const expectedSectionById=new Map(expectedSections.map((section:any)=>[section.id,section]));for(const s of (p.ui?.v8Sections??[]).filter((x:any)=>String(x.id??'').startsWith('OBS_'))){if(typeof s.description!=='string'||!s.description.trim())fail('NUMERIC_DESCRIPTION:'+s.id);if(/・数えるもの：|・基準：|opportunity model|candidate contract|runtime policy|denominator|benchmark/i.test(s.description)||/\\n|\/n/i.test(s.description))fail('NUMERIC_DESCRIPTION_RESPONSIBILITY:'+s.id);if(sectionDescriptionRepeatsInputs(s,expectedSectionById.get(s.id)))fail('NUMERIC_DESCRIPTION_REPEATS_INPUTS:'+s.id);if(s.descriptionPresentation?.collapsible!==true)fail('NUMERIC_DESCRIPTION_PRESENTATION:'+s.id);}
 for(const section of expectedSections){
  const feature=active.find((f:any)=>f.findingId===section.sourceFindingId),source=playDataSourceForTrialUniverse(feature?.trialUniverse,projection.runtimeUi?.gameCountPolicy);
  const cats=(section.inputs??[]).filter((x:any)=>x.role==='categoryCount'),other=cats.find((x:any)=>x.label==='その他'),trial=(section.inputs??[]).find((x:any)=>x.role==='trial');
  const expected=feature?.model==='CATEGORICAL'&&source&&other&&['SOURCE_EXHAUSTIVE','SOURCE_EXPLICIT_OTHER'].includes(String(feature.categoryModel?.residualPolicy??''))?{inputId:other.id,trialInputId:trial.id,categoryInputIds:cats.filter((x:any)=>x.id!==other.id).map((x:any)=>x.id),source,label:trial.label}:undefined;
  const nodes=(p.ui.v8Sections??[]).flatMap((s:any)=>s.items??[]).filter((n:any)=>n.featureId===section.sourceFindingId);
  if(feature?.model==='CATEGORICAL'&&canonical(nodes[0]?.interaction?.residualGameCount)!==canonical(expected))fail('RESIDUAL_GAME_CONTRACT:'+section.sourceFindingId);
 }
 for(const source of expectedNumericInputs.filter((x:any)=>x.derivedCalculation==='sum')){const input:any=inputBy.get(source.id);if(input?.derivedCalculation!=='sum'||canonical(input.derivedFromInputIds)!==canonical(source.derivedFromInputIds)||input.inputVisible!==false||source.derivedFromInputIds.some((id:string)=>!inputBy.has(id)))fail('DERIVED_SUCCESS_INPUT:'+source.id);const hidden=(projection.runtimeUi?.uiPresentation?.hiddenDerivedFindingIds??[]).includes(source.id.replace(/\.successCount$/,''));const nodes=(p.ui.v8Sections??[]).flatMap((s:any)=>s.items??[]).flatMap((n:any)=>n.inputs??[]).filter((n:any)=>n.inputId===source.id);if(hidden?nodes.length!==0:nodes.length!==1||nodes[0].engineBinding?.mode!=='SUM_COUNTS'||canonical(nodes[0].engineBinding.inputIds)!==canonical(source.derivedFromInputIds)||nodes[0].directNumeric!==false||nodes[0].quickAdd.length!==0)fail('DERIVED_SUCCESS_UI:'+source.id);}
 const uiSections=p.ui?.v8Sections??[];const featureIds:string[]=[];const visit=(n:any)=>{if(n?.featureId)featureIds.push(n.featureId);for(const child of n?.inputs??[])visit(child)};for(const s of uiSections){for(const n of s.groups??[])visit(n);for(const n of s.items??[])visit(n)}
 const hiddenIds=projection.runtimeUi?.uiPresentation?.hiddenDerivedFindingIds??[];const expectedFeatureIds=active.filter((x:any)=>!hiddenIds.includes(x.findingId)).map((x:any)=>x.findingId).sort();if(canonical([...featureIds].sort())!==canonical(expectedFeatureIds))fail('UI_FEATURE_COVERAGE');
 const expectedEvidenceSectionIds=(projection.runtimeUi?.evidenceSections??[]).filter((s:any)=>(s.evidenceItems??[]).some((e:any)=>!links.linkedEvidenceIds.has(e.findingId))).filter((s:any)=>!(projection.runtimeUi?.uiPresentation?.evidenceSectionMerges??[]).some((m:any)=>m.findingId===s.sourceFindingId)).map((s:any)=>s.id).sort();const actualEvidenceSectionIds=uiSections.filter((s:any)=>String(s.id??'').startsWith('EVI_')).map((s:any)=>s.id).sort();if(canonical(actualEvidenceSectionIds)!==canonical(expectedEvidenceSectionIds))fail('UI_EVIDENCE_SECTION_COVERAGE');
 const presentation=projection.runtimeUi?.uiPresentation;if(presentation){const requested=presentation.sectionOrder;const ordered=uiSections.filter((s:any)=>requested.includes(s.id)).map((s:any)=>s.id);if(canonical(ordered)!==canonical(requested))fail('UI_PRESENTATION_ORDER');for(const m of presentation.evidenceSectionMerges){const surfaces=uiSections.filter((s:any)=>(s.items??[]).some((n:any)=>n.evidenceId===m.findingId));if(surfaces.length!==1||surfaces[0].id!==m.targetSectionId)fail('UI_PRESENTATION_MERGE:'+m.findingId);}}
 for(const g of projection.runtimeUi?.uiPresentation?.tabGroups??[])for(const t of g.tabs){const s=uiSections.find((s:any)=>s.id===t.sectionId);if(canonical(s?.tabGroup)!==canonical({id:g.id,title:g.title,label:t.label}))fail('UI_TAB_GROUP:'+t.sectionId);}
 const sectionIds=uiSections.map((s:any)=>s.id);if(new Set(sectionIds).size!==sectionIds.length)fail('UI_SECTION_DUPLICATE');
 if(canonical(p.evidence?.references)!==canonical(projection.evidence??[])||!Array.isArray(p.evidence?.evidences))fail('EVIDENCE_REFERENCE_COPY');
 const expectedEvidenceIds=(projection.evidence??[]).flatMap((s:any)=>(s.evidenceItems??[]).map((e:any)=>e.findingId));
 const expectedEvidenceIdSet=new Set(expectedEvidenceIds);
 for(const def of p.evidence.evidences??[]){const sourceIds=Array.isArray(def.sourceEvidenceRefs)?def.sourceEvidenceRefs:[];if(sourceIds.length!==1||!expectedEvidenceIdSet.has(sourceIds[0]))fail('EVIDENCE_MATERIALIZATION');}
 const evidenceSourceBy=new Map((projection.evidence??[]).flatMap((s:any)=>(s.evidenceItems??[]).map((e:any)=>[e.findingId,e])));
 for(const e of p.evidence.evidences??[]){
  const sourceId=Array.isArray(e.sourceEvidenceRefs)?e.sourceEvidenceRefs[0]:undefined;const src:any=evidenceSourceBy.get(sourceId);
  const hasConstraint=(Array.isArray(e.confirmedSettings)&&e.confirmedSettings.length>0)||(Array.isArray(e.deniedSettings)&&e.deniedSettings.length>0);
  if(!src||e.type!=='SETTING_CONSTRAINT'||typeof e.inputId!=='string'||!e.inputId||!Array.isArray(e.details)||e.details.length!==1||!hasConstraint||!Array.isArray(e.confirmedSettings)||!Array.isArray(e.deniedSettings))fail('EVIDENCE_DEFINITION');
  const index=Number(String(e.id??'').split('__').pop())-1,linked=links.categoryInputIdByKey.get(String(sourceId)+':'+index),expectedInputId=linked??evidenceRecordInputId(src,index);
  if(!Number.isInteger(index)||index<0||e.inputId!==expectedInputId)fail('EVIDENCE_INPUT_LINK:'+String(sourceId));
  const input:any=inputBy.get(e.inputId);if(!input||input.type!=='counter'||(!linked&&input.inferenceRole!=='DISPLAY_ONLY')||(linked&&input.inferenceRole==='DISPLAY_ONLY'))fail('EVIDENCE_INPUT_BINDING');
 }
 for(const s of (p.ui?.v8Sections??[]).filter((x:any)=>String(x.id??'').startsWith('EVI_'))){
  if(typeof s.description!=='string'||!s.description.trim()||/Evidence|・数えるもの：|・基準：|opportunity model|candidate contract|runtime policy|denominator|benchmark/i.test(s.description)||/\\n|\/n/i.test(s.description))fail('EVIDENCE_UI_RENDERABLE');
  const item=(s.items??[])[0];if(item?.interaction?.type!=='CATEGORY_COUNTERS'||item?.interaction?.categoryCoverage!=='NON_EXHAUSTIVE'||item?.interaction?.totalOpportunities!=='NONE'||!Array.isArray(item?.interaction?.categories)||item.interaction.categories.length===0)fail('EVIDENCE_UI_INPUT');
 }
 const summary=p.v8?.machineResearchSummary;if(!summary)fail('V8_SUMMARY');
 for(const entry of summary.adopted??[]){if(isGenericAdoptionReason(entry.reason)||entry.reason!==concreteAdoptionReason(p,entry.featureId))fail('ADOPTION_REASON:'+entry.featureId);}
 for(const x of summary.notAdopted??[]){const label=String(x?.label??'').trim();const featureId=String(x?.featureId??'').trim();if(!label||label==='設定推測要素'||label==='調査継続項目'||(featureId&&label===featureId))fail('SUMMARY_LABEL:'+featureId);if(typeof x?.reason!=='string'||!x.reason.trim())fail('SUMMARY_REASON:'+featureId);}
 const rejectedIds=new Set((summary.notAdopted??[]).map((x:any)=>x.featureId));
 for(const x of projection.nonRuntimeCandidates??[])if(!rejectedIds.has(x.findingId))fail('SUMMARY_NON_RUNTIME_MISSING:'+x.findingId);
 for(const x of projection.excludedDecisions??[])if(!rejectedIds.has(x.findingId))fail('SUMMARY_EXCLUDED_MISSING:'+x.findingId);if(projection.highLowDiscrimination?.status==='COMPUTED'){if(canonical(summary.highLowDiscrimination)!==canonical(projection.highLowDiscrimination)||summary.unresolved?.some((x:any)=>x?.label==='高低判別精度'))fail('HLD_COMPUTED');}else{if(summary.highLowDiscrimination!==undefined||!summary.unresolved?.some((x:any)=>x?.label==='高低判別精度'&&x?.reason===projection.highLowDiscrimination?.reason))fail('HLD_UNRESOLVED');}
 if(p.provenance?.legacyOracleUsed!==false||p.provenance?.generationPath!=='V8_5_PRODUCTION_PIPELINE')fail('PROVENANCE');
 return [{validator:APP_RUNTIME_VALIDATOR_CONTRACT,sections:(p.ui.v8Sections??[]).length,evidenceReferences:(projection.evidence??[]).length,settings:p.machine.settings.length,features:active.length,inputs:expectedInputs.length}];
}
export function validateAppRuntimeArtifacts(s:any,a:any,r:any){const out=r.producedArtifacts??[];if(out.length!==1)fail('OUTPUT_COUNT');const ref=out[0];if(ref.kind!=='app-runtime'||typeof ref.path!=='string'||!ref.path.startsWith('production/batches/'+a.batchId+'/artifacts/'+a.machineId+'/app_runtime/'))fail('OUTPUT_REF');const prefix='production/';const doc=s.read(...ref.path.slice(prefix.length).split('/'));const ps=s.read('batches',a.batchId,'machines',a.machineId,'stages','RUNTIME_PROJECTION.json');if(!ps.authoritativeOutputRef?.path)fail('PROJECTION_AUTHORITY_MISSING');const projection=s.read(...String(ps.authoritativeOutputRef.path).slice(prefix.length).split('/'));return validateAppRuntimeDocument(doc,projection,ps.authoritativeOutputRef)}

