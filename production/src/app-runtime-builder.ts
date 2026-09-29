const heldReason=(x:any)=>x?.status==='HELD_NO_JOINT_MODEL'?'依存関係またはjoint modelが未確立のため、現在は数値推測に使用しません。':String(x?.status??'未解決');
const probability=(v:any):number=>{if(typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1)return v;if(typeof v==='string'&&v.startsWith('1/')){const d=Number(v.slice(2));if(Number.isFinite(d)&&d>0)return 1/d}throw new Error('APP_RUNTIME_PROBABILITY_INVALID:'+String(v))};
const settingKey=(k:string)=>k.startsWith('SET_')?k:'SET_'+k;
export const categoricalProbabilityRow=(row:any,labels:string[],findingId:string,setting:string):number[]=>{
 if(row&&typeof row==='object'&&!Array.isArray(row))return labels.map(label=>{const v=row[label];if(typeof v!=='number'||v<0||v>1)throw new Error('APP_RUNTIME_CATEGORY_PROBABILITY:'+findingId+':'+setting+':'+label);return v});
 if(typeof row!=='string')throw new Error('APP_RUNTIME_CATEGORY_DISTRIBUTION:'+findingId+':'+setting);
 const parsed=new Map<string,number>();let explicitSum=0;
 for(const raw of row.split('/')){const part=raw.trim();const m=part.match(/^(.*?)(?:\s*:\s*|\s*)(\d+(?:\.\d+)?)%\s*$/);if(!m)continue;const label=m[1].trim();const value=Number(m[2])/100;if(!label||!Number.isFinite(value)||value<0||value>1)throw new Error('APP_RUNTIME_CATEGORY_DISTRIBUTION:'+findingId+':'+setting+':'+part);parsed.set(label,value);explicitSum+=value;}
 return labels.map(label=>{if(parsed.has(label))return parsed.get(label)!;if(label==='その他'){const residual=1-explicitSum;if(residual>=-1e-9&&residual<=1+1e-9)return Math.max(0,Math.min(1,residual));}throw new Error('APP_RUNTIME_CATEGORY_PROBABILITY:'+findingId+':'+setting+':'+label)});
};
const importanceToAdoption=(importance:any)=>importance==='主要'?'INCLUDE_PRIMARY':'INCLUDE_SUPPORT';
const scoreDescription=(section:any)=>{
 const score=section?.score;const power=section?.perEligibleTrialPower;
 const scoreText=score?.status==='COMPUTED'&&typeof score.value==='number'?`設定判別スコア：${Number(score.value).toFixed(1)}`:`設定判別スコア：算出不可${score?.reason?'（'+score.reason+'）':''}`;
 const powerText=typeof power?.value==='number'?`1回の判別力：${Number(power.value).toFixed(3)}`:null;
 return [scoreText,powerText].filter(Boolean).join('\n');
};
const numericUiSections=(projection:any)=>{
 const src=projection.runtimeUi??{};const activeBy=new Map((projection.activeFeatures??[]).map((x:any)=>[x.findingId,x]));
 return (src.numericSections??[]).map((s:any)=>{
  const f:any=activeBy.get(s.sourceFindingId);if(!f)throw new Error('APP_RUNTIME_UI_FEATURE_MISSING:'+s.sourceFindingId);
  const inputs=s.inputs??[];
  if(f.model==='BERNOULLI'){
   const trial=inputs.find((x:any)=>x.role==='trial'),success=inputs.find((x:any)=>x.role==='success');
   if(!trial||!success)throw new Error('APP_RUNTIME_BERNOULLI_UI:'+f.findingId);
   const trialNode:any={id:trial.id,label:trial.label,input:'denominator',inputId:trial.id,engineBinding:{inputId:trial.id},gridSpan:12,directNumeric:true,quickAdd:trial.quickAdd??[50],unobservedDisplay:'—'};
   if(f.trialUniverse==='NORMAL_GAME_TRIAL')trialNode.playDataBinding={source:'PLAY_NORMAL_GAME_DELTA'};
   return {id:s.id,title:s.title,collapsible:s.collapsible!==false,defaultExpanded:s.defaultExpanded===true,descriptionPresentation:s.descriptionPresentation??{collapsible:true,label:'説明',defaultExpanded:false},items:[{id:'NODE_'+f.findingId,featureId:f.findingId,title:s.title,description:scoreDescription(s),descriptionPresentation:{collapsible:false},inputs:[trialNode,{id:success.id,label:success.label,input:'counter',inputId:success.id,engineBinding:{inputId:success.id},gridSpan:6,directNumeric:true,quickAdd:success.quickAdd??[1],unobservedDisplay:'—'}]}]};
  }
  if(f.model==='CATEGORICAL'){
   const trial=inputs.find((x:any)=>x.role==='trial'),cats=inputs.filter((x:any)=>x.role==='categoryCount');
   if(!trial||cats.length<2)throw new Error('APP_RUNTIME_CATEGORICAL_UI:'+f.findingId);
   return {id:s.id,title:s.title,collapsible:s.collapsible!==false,defaultExpanded:s.defaultExpanded===true,descriptionPresentation:s.descriptionPresentation??{collapsible:true,label:'説明',defaultExpanded:false},items:[{id:'NODE_'+f.findingId,featureId:f.findingId,title:s.title,description:scoreDescription(s),descriptionPresentation:{collapsible:false},interaction:{type:'CATEGORY_COUNTERS',preservePriorObservations:true,showAccumulatedCounts:true,categoryCoverage:'NON_EXHAUSTIVE',totalOpportunities:'SEPARATE_COUNTER',opportunityTracking:{type:'SEPARATE_COUNTER',inputId:trial.id,label:trial.label},categories:cats.map((x:any)=>({id:x.id,inputId:x.id,label:x.label,meaning:'観測した回数'}))}}]};
  }
  throw new Error('APP_RUNTIME_MODEL_UNSUPPORTED:'+f.model);
 });
};
const evidenceUiSections=(projection:any)=>(projection.runtimeUi?.evidenceSections??[]).map((s:any)=>({id:s.id,title:s.title,description:s.description,collapsible:s.collapsible!==false,defaultExpanded:s.defaultExpanded===true,descriptionPresentation:s.descriptionPresentation??{collapsible:true,label:'説明',defaultExpanded:false},items:(s.evidenceItems??[]).map((e:any)=>({id:'REF_'+e.findingId,evidenceId:e.findingId,label:e.label,description:s.description}))}));
const toUi=(projection:any)=>{const src=projection.runtimeUi??{};return {schemaVersion:'v8.5-runtime-ui-v1',contractVersion:'runtime-ui-v8',source:'CANONICAL_UI',sourceSchemaVersion:src.schemaVersion,manifestRevision:'8.5',accordion:{enabled:true,singleOpen:true},quickInput:{enabled:false},v8Sections:[...numericUiSections(projection),...evidenceUiSections(projection)]}};
const buildInputs=(projection:any)=>{
 const out:any[]=[];const seen=new Set<string>();let order=1;
 for(const s of projection.runtimeUi?.numericSections??[]){
  const f=(projection.activeFeatures??[]).find((x:any)=>x.findingId===s.sourceFindingId);if(!f)continue;
  const trialId=(s.inputs??[]).find((x:any)=>x.role==='trial')?.id;
  for(const x of s.inputs??[]){
   if(seen.has(x.id))throw new Error('APP_RUNTIME_DUPLICATE_INPUT:'+x.id);seen.add(x.id);
   out.push({id:x.id,name:x.label,category:'V8_NUMERIC',type:x.role==='trial'?'integer':'counter',unit:x.role==='trial'&&f.trialUniverse==='NORMAL_GAME_TRIAL'?'G':'回',defaultValue:0,minimum:0,displayOrder:order++,parentInputId:x.role==='trial'?undefined:trialId,inferenceRole:importanceToAdoption(f.score?.importance)});
  }
 }
 return out;
};
const buildFeatures=(projection:any)=>{
 const secBy=new Map((projection.runtimeUi?.numericSections??[]).map((s:any)=>[s.sourceFindingId,s]));
 return (projection.activeFeatures??[]).map((f:any)=>{
  const s:any=secBy.get(f.findingId);if(!s)throw new Error('APP_RUNTIME_FEATURE_UI_MISSING:'+f.findingId);
  const trial=s.inputs?.find((x:any)=>x.role==='trial');if(!trial)throw new Error('APP_RUNTIME_FEATURE_TRIAL:'+f.findingId);
  const base:any={featureId:f.findingId,name:f.name,adoptionCategory:importanceToAdoption(f.score?.importance),calculationRole:'PROBABILITY',probabilityEngineUsage:true,denominatorInputId:trial.id,probabilities:{},selectionRationale:{summary:'Manifest v8.5 Production Lineで採用された設定推測要素。',adoptionReason:'EligibilityとCandidate Contractを通過した観測可能likelihoodを使用します。',shortTermReason:'標本が少ない間は結果の振れが大きくなります。',longTermReason:'観測数が増えるほど設定別likelihoodの比較が安定します。'}};
  if(f.model==='BERNOULLI'){
   const success=s.inputs?.find((x:any)=>x.role==='success');if(!success)throw new Error('APP_RUNTIME_FEATURE_SUCCESS:'+f.findingId);
   base.modelType='binomial';base.numeratorInputId=success.id;base.displayFormat='percentage';
   base.probabilities=Object.fromEntries(Object.entries(f.settingDistribution??{}).map(([k,v])=>[settingKey(k),probability(v)]));
   return base;
  }
  if(f.model==='CATEGORICAL'){
   const cats=(s.inputs??[]).filter((x:any)=>x.role==='categoryCount');if(cats.length<2)throw new Error('APP_RUNTIME_FEATURE_CATEGORIES:'+f.findingId);
   base.modelType='multinomial';base.numeratorInputId=cats[0].id;base.categoryInputIds=cats.slice(1).map((x:any)=>x.id);
   base.categoryProbabilities=Object.fromEntries(Object.entries(f.settingDistribution??{}).map(([k,row]:any)=>[settingKey(k),categoricalProbabilityRow(row,cats.map((x:any)=>x.label),f.findingId,k)]));
   return base;
  }
  throw new Error('APP_RUNTIME_FEATURE_MODEL:'+f.model);
 });
};
const materializedEvidences=(projection:any)=>(projection.evidence??[]).flatMap((s:any)=>(s.evidenceItems??[]).map((e:any)=>({id:e.findingId,name:e.label,displayName:e.label,inputId:'REF_'+e.findingId,confirmedSettings:[],deniedSettings:[],hasImage:false,type:'REFERENCE_ONLY',sourceEvidenceRefs:[e.findingId]})));
const nonRuntimeReason=(x:any,targetLabel?:string)=>x?.dependencyResolution==='RESOLVED_BY_SINGLE_MEMBER'&&x?.resolvedIntoFindingId?`同じ観測内容を二重に評価しないため、${targetLabel??'代表となる設定推測要素'}へ統合し、単独では数値推測に使用しません。`:x?.dependencyResolution==='RESOLVED_IN_JOINT_MODEL'&&x?.resolvedIntoFindingId?`同じ観測内の項目をまとめて評価するため、${targetLabel??'代表となる設定推測要素'}へ統合しています。`:'現在は単独の数値推測要素として使用しません。';
const dedupeSummary=(items:any[])=>{const seen=new Set<string>();return items.filter((x:any)=>{const k=String(x?.featureId??x?.label??'');if(!k||seen.has(k))return false;seen.add(k);return true})};
const runtimeProjection=(projection:any)=>[
 ...(projection.activeFeatures??[]).map((f:any)=>({featureId:f.findingId,runtimeStatus:'ACTIVE',metric:f.runtimePolicyBinding?.metric,metricValue:f.runtimePolicyBinding?.value,importance:f.score?.importance})),
 ...(projection.inactiveFeatures??[]).map((f:any)=>({featureId:f.findingId,runtimeStatus:'INACTIVE',metric:f.metric,metricValue:f.value,threshold:f.threshold,runtimeReason:f.reason})),
];
export function buildAppRuntime(projection:any,projectionArtifact:any){
 if(projection.settings?.status!=='SOURCE_DERIVED'||!(projection.settings?.values?.length>0))throw new Error('APP_RUNTIME_SETTINGS_REQUIRED');
 const version='8.5.0-'+projection.batchId,held=projection.heldObservations??[],hld=projection.highLowDiscrimination;
 const features=buildFeatures(projection),inputs=buildInputs(projection),rp=runtimeProjection(projection);
 const adopted=(projection.activeFeatures??[]).map((f:any)=>({featureId:f.findingId,label:f.name,importance:f.score?.importance,selectionScore:f.score?.status==='COMPUTED'?f.score.value:undefined,evaluation:{userLabel:f.score?.status==='COMPUTED'?'設定判別スコア':'1回の判別力',value:f.score?.status==='COMPUTED'?f.score.value:f.runtimePolicyBinding?.value},reason:'Runtime PolicyでACTIVEのため現在の設定推測に使用します。'}));
 const inactive=(projection.inactiveFeatures??[]).map((f:any)=>({featureId:f.findingId,label:f.findingId,reason:'Runtime Policyの閾値未満のため現在は設定推測に使用しません。'}));
 const allLabels=[...(projection.activeFeatures??[]).map((x:any)=>({findingId:x.findingId,label:x.name})),...(projection.nonRuntimeCandidates??[])];
 const resolved=(projection.nonRuntimeCandidates??[]).map((x:any)=>({featureId:x.findingId,label:x.label,reason:nonRuntimeReason(x,allLabels.find((y:any)=>y.findingId===x.resolvedIntoFindingId)?.label)}));
 const excluded=(projection.excludedDecisions??[]).map((x:any)=>({featureId:x.findingId,label:x.label,reason:x.reason,reevaluationCondition:x.reevaluationCondition}));
 const notAdopted=dedupeSummary([...inactive,...held.map((x:any)=>({featureId:x.findingId,label:x.label,reason:heldReason(x)})),...resolved,...excluded]);
 return {schemaVersion:'app-runtime-v1',manifestVersion:'8.5',batchId:projection.batchId,machineId:projection.machineId,machineName:projection.machineName,sourceArtifact:projectionArtifact,package:{schemaVersion:1,provenance:{manifestVersion:'8.5',generationPath:'V8_5_PRODUCTION_PIPELINE',legacyOracleUsed:false},machine:{schemaVersion:'2.0.0',machineId:projection.machineId,machineDataVersion:version,displayName:projection.machineName,modelName:projection.machineName,settings:projection.settings.values,packagePolicy:projection.packagePolicy},inputs:{schemaVersion:'2.0.0',inputs},features:{version:'8.5-runtime',features,runtimeProjection:rp},evidence:{version:'8.5-runtime',evidences:materializedEvidences(projection),references:projection.evidence??[]},ui:toUi(projection),metadata:{machineId:projection.machineId,displayName:projection.machineName,settings:projection.settings.values,settingsStatus:projection.settings.status},v8:{machineResearchSummary:{title:'この機種の設定推測について',adopted,notAdopted,highLowDiscrimination:hld?.status==='COMPUTED'?hld:undefined,unresolved:hld?.status==='NOT_COMPUTED'?[{label:'高低判別精度',reason:hld.reason}]:[]}}}};
}
