const heldReason=(x:any)=>x?.status==='HELD_NO_JOINT_MODEL'?'複数要素をまとめて評価するための条件が確定していないため、現在は数値推測に使用しません。':'現在は数値推測に必要な条件が確定していません。';
const probability=(v:any):number=>{if(typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1)return v;if(typeof v==='string'&&v.startsWith('1/')){const d=Number(v.slice(2));if(Number.isFinite(d)&&d>0)return 1/d}throw new Error('APP_RUNTIME_PROBABILITY_INVALID:'+String(v))};
const settingKey=(k:string)=>k.startsWith('SET_')?k:'SET_'+k;
export const categoricalProbabilityRow=(row:any,labels:string[],findingId:string,setting:string):number[]=>{
 if(row&&typeof row==='object'&&!Array.isArray(row))return labels.map(label=>{const v=row[label];if(typeof v!=='number'||v<0||v>1)throw new Error('APP_RUNTIME_CATEGORY_PROBABILITY:'+findingId+':'+setting+':'+label);return v});
 if(typeof row!=='string')throw new Error('APP_RUNTIME_CATEGORY_DISTRIBUTION:'+findingId+':'+setting);
 const parsed=new Map<string,number>();let explicitSum=0;
 for(const raw of row.split('/')){const part=raw.trim();const m=part.match(/^(.*?)(?:\s*:\s*|\s*)(\d+(?:\.\d+)?)%\s*$/);if(!m)continue;const label=m[1].trim();const value=Number(m[2])/100;if(!label||!Number.isFinite(value)||value<0||value>1)throw new Error('APP_RUNTIME_CATEGORY_DISTRIBUTION:'+findingId+':'+setting+':'+part);parsed.set(label,value);explicitSum+=value;}
 return labels.map(label=>{if(parsed.has(label))return parsed.get(label)!;if(label==='その他'){const residual=1-explicitSum;if(residual>=-1e-9&&residual<=1+1e-9)return Math.max(0,Math.min(1,residual));}throw new Error('APP_RUNTIME_CATEGORY_PROBABILITY:'+findingId+':'+setting+':'+label)});
};
const importanceForMetricValue=(value:any)=>{const n=Number(value);if(!Number.isFinite(n))return undefined;return n>=20?'主要':n>=10?'有力':n>=5?'補助':'微小';};
const runtimeImportance=(f:any)=>f?.score?.importance??importanceForMetricValue(f?.runtimePolicyBinding?.value);
const importanceToAdoption=(importance:any)=>importance==='主要'?'INCLUDE_PRIMARY':'INCLUDE_SUPPORT';
const scoreDescription=(section:any)=>{
 const score=section?.score;const power=section?.perEligibleTrialPower;
 const powerText=typeof power?.value==='number'?`1回の判別力：${Number(power.value).toFixed(3)}`:null;
 const scoreText=score?.status==='COMPUTED'&&typeof score.value==='number'
  ?`設定判別スコア：${Number(score.value).toFixed(1)}`
  :powerText?null:`設定判別スコア：算出不可${score?.reason?'（'+score.reason+'）':''}`;
 return [scoreText,powerText].filter(Boolean).join('\\n');
};
const trialLabelFor=(trialUniverse:any)=>trialUniverse==='NORMAL_GAME_TRIAL'||trialUniverse==='BONUS_ELIGIBLE_GAME_TRIAL'?'通常ゲーム数':trialUniverse==='TOTAL_GAME_TRIAL'?'総ゲーム数':trialUniverse==='PREDECESSOR_TOTAL_GAME_TRIAL'?'着席時総ゲーム数':trialUniverse==='REG_POST_50G_CC_TRIAL'?'対象ゲーム数':'対象回数';
const sectionExplanation=(f:any,s:any)=>{
 const metric=scoreDescription(s);
 let guide=s?.userExplanation??(s?.model==='CATEGORICAL'&&s?.categoryCoverage==='EXHAUSTIVE'
  ?'表示された各項目の回数を入力します。入力した回数の合計を観測回数として自動計算します。'
  :'対象となる機会の回数と、そのうち該当した回数を入力します。');
 if(f.trialUniverse==='NORMAL_GAME_TRIAL'||f.trialUniverse==='BONUS_ELIGIBLE_GAME_TRIAL')guide='通常ゲーム数に対する該当回数を入力します。「着席時との差分を使用」がONの場合、通常ゲーム数は遊技情報から自動反映されます。';
 else if(f.trialUniverse==='MILE_CHARGE_4PLUS_END_TRIAL')guide='まいるチャージ4回以上で終了した回数を「対象回数」、そのうち温泉ステージへ移行した回数を「回数」に入力します。';
 else if(f.trialUniverse==='CZ_TRUE_PREMONITION_TRIAL')guide='CZ本前兆となった回数を「対象回数」、そのうち温泉ステージへ移行した回数を「回数」に入力します。';
 else if(f.trialUniverse==='PREDECESSOR_TOTAL_GAME_TRIAL')guide='着席時点のBIG・REG回数を入力します。母数には遊技情報の「着席時 総ゲーム数」を自動使用し、自身の遊技区間とは分けて設定推測へ反映します。';
 return [guide,metric].filter(Boolean).join('\\n');
};
const playDataSourceForTrialUniverse=(trialUniverse:any)=>
 trialUniverse==='NORMAL_GAME_TRIAL'||trialUniverse==='BONUS_ELIGIBLE_GAME_TRIAL'?'PLAY_NORMAL_GAME_DELTA':trialUniverse==='TOTAL_GAME_TRIAL'?'PLAY_TOTAL_GAME_DELTA':undefined;
const numericUiSections=(projection:any)=>{
 const src=projection.runtimeUi??{};const activeBy=new Map((projection.activeFeatures??[]).map((x:any)=>[x.findingId,x]));
 return (src.numericSections??[]).map((s:any)=>{
  const f:any=activeBy.get(s.sourceFindingId);if(!f)throw new Error('APP_RUNTIME_UI_FEATURE_MISSING:'+s.sourceFindingId);
  const inputs=s.inputs??[];
  if(f.model==='BERNOULLI'){
   const trial=inputs.find((x:any)=>x.role==='trial'),success=inputs.find((x:any)=>x.role==='success');
   if(!trial||!success)throw new Error('APP_RUNTIME_BERNOULLI_UI:'+f.findingId);
   const trialNode:any={id:trial.id,label:trial.label??trialLabelFor(f.trialUniverse),input:'denominator',inputId:trial.id,engineBinding:{inputId:trial.id},gridSpan:playDataSourceForTrialUniverse(f.trialUniverse)?12:6,directNumeric:true,quickAdd:trial.quickAdd??[50],unobservedDisplay:'—'};
   const playDataSource=playDataSourceForTrialUniverse(f.trialUniverse);if(playDataSource)trialNode.playDataBinding={source:playDataSource};
   return {id:s.id,title:s.title,collapsible:s.collapsible!==false,defaultExpanded:s.defaultExpanded===true,description:sectionExplanation(f,s),descriptionPresentation:{collapsible:true,label:'説明',defaultExpanded:false},items:[{id:'NODE_'+f.findingId,featureId:f.findingId,title:s.title,inputs:[trialNode,{id:success.id,label:success.label??'回数',input:'counter',inputId:success.id,engineBinding:{inputId:success.id},gridSpan:6,directNumeric:true,quickAdd:success.quickAdd??[1],unobservedDisplay:'—'}]}]};
  }
  if(f.model==='CATEGORICAL'){
   const trial=inputs.find((x:any)=>x.role==='trial'),cats=inputs.filter((x:any)=>x.role==='categoryCount');
   if(!trial||cats.length<2)throw new Error('APP_RUNTIME_CATEGORICAL_UI:'+f.findingId);
   const exhaustive=s.categoryCoverage==='EXHAUSTIVE';
   const interaction:any={type:'CATEGORY_COUNTERS',preservePriorObservations:true,showAccumulatedCounts:true,categoryCoverage:exhaustive?'EXHAUSTIVE':'NON_EXHAUSTIVE',totalOpportunities:exhaustive?'SUM_CATEGORY_COUNTS':'SEPARATE_COUNTER',categories:cats.map((x:any)=>({id:x.id,inputId:x.id,label:x.label,meaning:x.description??'観測した回数'}))};
   if(!exhaustive)interaction.opportunityTracking={type:'SEPARATE_COUNTER',inputId:trial.id,label:trial.label,...(trial.playDataBinding?{playDataBinding:trial.playDataBinding}:{})};
   return {id:s.id,title:s.title,collapsible:s.collapsible!==false,defaultExpanded:s.defaultExpanded===true,description:sectionExplanation(f,s),descriptionPresentation:{collapsible:true,label:'説明',defaultExpanded:false},items:[{id:'NODE_'+f.findingId,featureId:f.findingId,title:s.title,interaction}]};
  }
  throw new Error('APP_RUNTIME_MODEL_UNSUPPORTED:'+f.model);
 });
};
const evidenceSemanticRows=(e:any)=>{const details=Array.isArray(e.details)&&e.details.length?e.details:[e.label];const rows=Array.isArray(e.categorySemantics)?e.categorySemantics:[];if(rows.length!==details.length)throw new Error('APP_RUNTIME_EVIDENCE_SEMANTICS_REQUIRED:'+e.findingId);return details.map((label:string,i:number)=>{const row=rows[i];if(row?.label!==label||!['EXACT_CONSTRAINT','PROBABILITY_BACKED','PROBABILITY_UNKNOWN','DISPLAY_ONLY','BLOCK'].includes(row?.semantic))throw new Error('APP_RUNTIME_EVIDENCE_SEMANTIC_INVALID:'+e.findingId+':'+i);return {label,semantic:row.semantic,confirmedSettings:row.confirmedSettings,deniedSettings:row.deniedSettings,observationContext:row.observationContext};});};
const evidenceExplanation=(s:any)=>{
 const semantics=(s.evidenceItems??[]).flatMap((e:any)=>evidenceSemanticRows(e).map((x:any)=>x.semantic));
 const hasExact=semantics.includes('EXACT_CONSTRAINT'),hasBacked=semantics.includes('PROBABILITY_BACKED'),hasUnknown=semantics.includes('PROBABILITY_UNKNOWN');
 if(hasExact&&(hasUnknown||hasBacked))return hasUnknown?'設定確定・設定否定など条件が明確な項目は設定候補の絞り込みに反映します。設定別の出現率が公表・確認されていない示唆は、観測回数を記録できますが、現在の設定推測計算には直接反映していません。設定別の出現率が確認できた場合は、今後のデータ更新で設定推測へ反映できる可能性があります。':'設定確定・設定否定など条件が明確な項目は設定候補の絞り込みに反映し、設定別出現率が確認できる示唆は確認済みの分布に基づいて設定推測へ使用します。';
 if(hasExact)return '確認した項目に応じて、設定候補を確定・除外します。';
 if(hasBacked&&!hasUnknown)return '設定別の出現率が確認できる示唆は、確認済みの分布に基づいて設定推測へ使用します。';
 if(hasUnknown)return 'この示唆については設定別の出現率が公表・確認されていないため、観測回数を記録できますが、現在の設定推測計算には直接反映していません。設定別の出現率が確認できた場合は、今後のデータ更新で設定推測へ反映できる可能性があります。';
 return 'この項目は観測回数を記録するための参考情報で、現在の設定推測計算には直接反映していません。';
};
const evidenceUiSections=(projection:any)=>(projection.runtimeUi?.evidenceSections??[]).map((s:any)=>({id:s.id,title:s.title,description:evidenceExplanation(s),collapsible:s.collapsible!==false,defaultExpanded:s.defaultExpanded===true,descriptionPresentation:s.descriptionPresentation??{collapsible:true,label:'説明',defaultExpanded:false},items:(s.evidenceItems??[]).map((e:any)=>{const details=Array.isArray(e.details)?e.details.filter((x:any)=>typeof x==='string'&&x.trim()):[];const labels=evidenceSemanticRows(e).map((x:any)=>x.label);return {id:'REF_'+e.findingId,evidenceId:e.findingId,label:e.label,interaction:{type:'CATEGORY_COUNTERS',preservePriorObservations:true,showAccumulatedCounts:true,categoryCoverage:'NON_EXHAUSTIVE',totalOpportunities:'NONE',categories:labels.map((label:string,i:number)=>({id:`REF_${e.findingId}_${i+1}`,inputId:`REF_${e.findingId}_${i+1}`,label,meaning:'観測回数'}))}}})}));
const toUi=(projection:any)=>{const src=projection.runtimeUi??{};return {schemaVersion:'v8.5-runtime-ui-v1',contractVersion:'runtime-ui-v8',source:'CANONICAL_UI',sourceSchemaVersion:src.schemaVersion,manifestRevision:'8.5',playInfo:src.playInfo,accordion:{enabled:true,singleOpen:true},quickInput:{enabled:false},v8Sections:[...numericUiSections(projection),...evidenceUiSections(projection)]}};
const buildInputs=(projection:any)=>{
 const out:any[]=[];const seen=new Set<string>();let order=1;
 for(const s of projection.runtimeUi?.numericSections??[]){
  const f=(projection.activeFeatures??[]).find((x:any)=>x.findingId===s.sourceFindingId);if(!f)continue;
  const trialId=(s.inputs??[]).find((x:any)=>x.role==='trial')?.id;
  for(const x of s.inputs??[]){
   if(seen.has(x.id)){if(x.role==='trial'&&x.id==='shared.NORMAL_GAME_TRIAL')continue;throw new Error('APP_RUNTIME_DUPLICATE_INPUT:'+x.id);}seen.add(x.id);
   out.push({id:x.id,name:x.label,category:'V8_NUMERIC',type:x.role==='trial'?'integer':'counter',unit:x.role==='trial'&&(f.trialUniverse==='NORMAL_GAME_TRIAL'||f.trialUniverse==='TOTAL_GAME_TRIAL'||f.trialUniverse==='PREDECESSOR_TOTAL_GAME_TRIAL'||f.trialUniverse==='REG_POST_50G_CC_TRIAL')?'G':'回',defaultValue:0,minimum:0,displayOrder:order++,parentInputId:x.role==='trial'?undefined:trialId,inferenceRole:importanceToAdoption(runtimeImportance(f)),observationScope:x.observationScope??f.observationScope,inputVisible:x.playDataBinding?.mode==='AUTO_EXACT'?false:undefined});
  }
 }
 for(const s of projection.evidence??[]){
  for(const e of s.evidenceItems??[]){
   const details=Array.isArray(e.details)?e.details.filter((x:any)=>typeof x==='string'&&x.trim()):[];
   const labels=evidenceSemanticRows(e).map((x:any)=>x.label);
   for(const [i,label] of labels.entries()){
    const id=`REF_${e.findingId}_${i+1}`;if(seen.has(id))continue;seen.add(id);
    out.push({id,name:label,category:'EVIDENCE_REFERENCE',type:'counter',unit:'回',defaultValue:0,minimum:0,displayOrder:order++,inferenceRole:'DISPLAY_ONLY'});
   }
  }
 }
 return out;
};
const buildFeatures=(projection:any)=>{
 const secBy=new Map((projection.runtimeUi?.numericSections??[]).map((s:any)=>[s.sourceFindingId,s]));
 return (projection.activeFeatures??[]).map((f:any)=>{
  const s:any=secBy.get(f.findingId);if(!s)throw new Error('APP_RUNTIME_FEATURE_UI_MISSING:'+f.findingId);
  const trial=s.inputs?.find((x:any)=>x.role==='trial');if(!trial)throw new Error('APP_RUNTIME_FEATURE_TRIAL:'+f.findingId);
  const base:any={featureId:f.findingId,name:f.name,trialUniverse:f.trialUniverse,observationScope:f.observationScope,adoptionCategory:importanceToAdoption(runtimeImportance(f)),calculationRole:'PROBABILITY',probabilityEngineUsage:true,denominatorInputId:trial.id,probabilities:{},selectionRationale:{summary:'Manifest v8.5 Production Lineで採用された設定推測要素。',adoptionReason:'EligibilityとCandidate Contractを通過した観測可能likelihoodを使用します。',shortTermReason:'標本が少ない間は結果の振れが大きくなります。',longTermReason:'観測数が増えるほど設定別likelihoodの比較が安定します。'}};
  if(f.model==='BERNOULLI'){
   const success=s.inputs?.find((x:any)=>x.role==='success');if(!success)throw new Error('APP_RUNTIME_FEATURE_SUCCESS:'+f.findingId);
   base.modelType='binomial';base.numeratorInputId=success.id;base.displayFormat='percentage';
   base.probabilities=Object.fromEntries(Object.entries(f.settingDistribution??{}).map(([k,v])=>[settingKey(k),probability(v)]));
   return base;
  }
  if(f.model==='CATEGORICAL'){
   const cats=(s.inputs??[]).filter((x:any)=>x.role==='categoryCount');if(cats.length<2)throw new Error('APP_RUNTIME_FEATURE_CATEGORIES:'+f.findingId);
   base.modelType='multinomial';base.numeratorInputId=cats[0].id;base.categoryInputIds=cats.slice(1).map((x:any)=>x.id);
   if(s.categoryCoverage==='EXHAUSTIVE')base.denominatorRule='SUM_CATEGORY_COUNTS';
   base.categoryProbabilities=Object.fromEntries(Object.entries(f.settingDistribution??{}).map(([k,row]:any)=>[settingKey(k),categoricalProbabilityRow(row,cats.map((x:any)=>x.categoryKey??x.label),f.findingId,k)]));
   return base;
  }
  throw new Error('APP_RUNTIME_FEATURE_MODEL:'+f.model);
 });
};
const evidenceConstraintFromLabel=(label:string,allSettings:string[])=>{
 const settings=[...allSettings];
 const above=label.match(/設定([1-6])以上/);if(above){const n=Number(above[1]);return {confirmedSettings:settings.filter(s=>Number(String(s).replace('SET_',''))>=n),deniedSettings:[]};}
 const denied=label.match(/設定([1-6])否定/);if(denied)return {confirmedSettings:[],deniedSettings:['SET_'+denied[1]]};
 const listed=label.match(/設定([1-6](?:[・,／\/][1-6])+)(?:濃厚)?/);if(listed){const nums=listed[1].split(/[・,／\/]/);return {confirmedSettings:settings.filter(s=>nums.includes(String(s).replace('SET_',''))),deniedSettings:[]};}
 const exact=label.match(/(?:^|[:：=]\s*)設定([1-6])(?:濃厚)?\s*$/);if(exact)return {confirmedSettings:['SET_'+exact[1]],deniedSettings:[]};
 return null;
};
const materializedEvidences=(projection:any)=>{
 const allSettings=Array.isArray(projection.settings?.values)?projection.settings.values:[];
 return (projection.evidence??[]).flatMap((s:any)=>(s.evidenceItems??[]).flatMap((e:any)=>{
  const details=Array.isArray(e.details)?e.details.filter((x:any)=>typeof x==='string'&&x.trim()):[];
  const rows=evidenceSemanticRows(e);
  return rows.flatMap(({label,semantic,confirmedSettings,deniedSettings}:any,i:number)=>{
   if(semantic!=='EXACT_CONSTRAINT')return [];
   const explicitConstraint=(Array.isArray(confirmedSettings)||Array.isArray(deniedSettings))?{confirmedSettings:(confirmedSettings??[]).map(settingKey),deniedSettings:(deniedSettings??[]).map(settingKey)}:null;
   const constraint=explicitConstraint??evidenceConstraintFromLabel(label,allSettings);if(!constraint)throw new Error('APP_RUNTIME_EXACT_CONSTRAINT_UNPARSEABLE:'+e.findingId+':'+label);
   return [{id:`${e.findingId}__${i+1}`,name:label,displayName:label,inputId:`REF_${e.findingId}_${i+1}`,details:[label],confirmedSettings:constraint.confirmedSettings,deniedSettings:constraint.deniedSettings,hasImage:false,type:'SETTING_CONSTRAINT',sourceEvidenceRefs:[e.findingId]}];
  });
 }));
};
const nonRuntimeReason=(x:any,targetLabel?:string)=>x?.dependencyResolution==='RESOLVED_BY_SINGLE_MEMBER'&&x?.resolvedIntoFindingId?`同じ観測内容を二重に評価しないため、${targetLabel??'代表となる設定推測要素'}へ統合し、単独では数値推測に使用しません。`:x?.dependencyResolution==='RESOLVED_IN_JOINT_MODEL'&&x?.resolvedIntoFindingId?`同じ観測内の項目をまとめて評価するため、${targetLabel??'代表となる設定推測要素'}へ統合しています。`:'現在は単独の数値推測要素として使用しません。';
const userFacingExcludedReason=(x:any)=>{const reason=String(x?.reason??'');if(/likelihood|補間|設定別/.test(reason))return '設定ごとの判別に必要な数値が揃っていないため、現在は数値推測に使用しません。';if(/denominator|観測機会|reconstruction|再現/.test(reason))return '正確な観測回数を扱うための情報が不足しているため、現在は数値推測に使用しません。';return '現在は数値推測に必要な情報が十分でないため使用しません。';};
const userFacingReevaluation=(x:any)=>x?.reevaluationCondition?'必要な設定別データや観測条件が確認できれば再評価します。':undefined;
const userFacingBlockedReason=(x:any)=>{
 const id=String(x?.blockId??'');
 if(id==='bonus-total-overlap')return 'ボーナス合算には設定差がありますが、小役成立と同じゲームで重なる場合があり、現在の推測モデルで小役と同時に使うと同じ情報を二重評価する可能性があるため、現在は設定推測に使用していません。設定別の元データは保存しています。';
 if(id==='bonus-detail-overlap')return 'BIG・REGなどのボーナス内訳や同時当選役には設定差がありますが、小役やボーナス合算と同じ成立ゲームを重ねて評価すると同じ情報を二重に数える可能性があるため、現在は単独の設定推測要素として使用していません。設定別の元データは保存しています。';
 if(id==='small-role-separate-overlap')return 'チェリーとスイカは個別の設定差を保存していますが、同じ通常ゲームを分母に独立した要素として重ねると二重評価になるため、現在は「チェリーまたはスイカ」の合算要素として使用しています。';
 if(id==='ending-screen-probabilities')return 'エンディング終了画面は高設定示唆であることを確認できますが、設定別の出現率を確認できないため、現在は記録のみで数値推測には使用していません。';
 return String(x?.reason??'現在は安全に数値推測へ使用するための条件が確定していません。');
};
const dedupeSummary=(items:any[])=>{const seen=new Set<string>();return items.filter((x:any)=>{const k=String(x?.featureId??x?.label??'');if(!k||seen.has(k))return false;seen.add(k);return true})};
const runtimeProjection=(projection:any)=>[
 ...(projection.activeFeatures??[]).map((f:any)=>({featureId:f.findingId,runtimeStatus:'ACTIVE',metric:f.runtimePolicyBinding?.metric,metricValue:f.runtimePolicyBinding?.value,importance:runtimeImportance(f)})),
 ...(projection.inactiveFeatures??[]).map((f:any)=>({featureId:f.findingId,runtimeStatus:'INACTIVE',metric:f.metric,metricValue:f.value,threshold:f.threshold,runtimeReason:f.reason})),
];
export function buildAppRuntime(projection:any,projectionArtifact:any){
 if(projection.settings?.status!=='SOURCE_DERIVED'||!(projection.settings?.values?.length>0))throw new Error('APP_RUNTIME_SETTINGS_REQUIRED');
 const version='8.5.0-'+projection.batchId,held=projection.heldObservations??[],hld=projection.highLowDiscrimination;
 const features=buildFeatures(projection),inputs=buildInputs(projection),rp=runtimeProjection(projection);
 const adopted=(projection.activeFeatures??[]).map((f:any)=>({featureId:f.findingId,label:f.name,importance:runtimeImportance(f),selectionScore:f.score?.status==='COMPUTED'?f.score.value:undefined,evaluation:{userLabel:f.score?.status==='COMPUTED'?'設定判別スコア':'1回の判別力',value:f.score?.status==='COMPUTED'?f.score.value:f.runtimePolicyBinding?.value},reason:'現在の採用基準を満たしているため、設定推測に使用します。'}));
 const inactive=(projection.inactiveFeatures??[]).map((f:any)=>({featureId:f.findingId,label:f.findingId,reason:'現在の採用基準を満たしていないため、設定推測に使用しません。'}));
 const allLabels=[...(projection.activeFeatures??[]).map((x:any)=>({findingId:x.findingId,label:x.name})),...(projection.nonRuntimeCandidates??[])];
 const resolved=(projection.nonRuntimeCandidates??[]).map((x:any)=>({featureId:x.findingId,label:x.label,reason:nonRuntimeReason(x,allLabels.find((y:any)=>y.findingId===x.resolvedIntoFindingId)?.label)}));
 const excluded=(projection.excludedDecisions??[]).map((x:any)=>({featureId:x.findingId,label:x.label,reason:userFacingExcludedReason(x),reevaluationCondition:userFacingReevaluation(x)}));
 const blocked=(projection.blockedItems??[]).map((x:any)=>({featureId:x.blockId??x.findingId??x.label,label:x.label,reason:userFacingBlockedReason(x),reevaluationCondition:x.reevaluationCondition?'追加の公開データや安全な評価方法が確立した場合に再評価します。':undefined}));
 const notAdopted=dedupeSummary([...inactive,...held.map((x:any)=>({featureId:x.findingId,label:x.label,reason:heldReason(x)})),...resolved,...excluded,...blocked]);
 return {schemaVersion:'app-runtime-v1',manifestVersion:'8.5',batchId:projection.batchId,machineId:projection.machineId,machineName:projection.machineName,machineIdentity:structuredClone(projection.machineIdentity),sourceArtifact:projectionArtifact,package:{schemaVersion:1,provenance:{manifestVersion:'8.5',generationPath:'V8_5_PRODUCTION_PIPELINE',legacyOracleUsed:false,machineIdentity:structuredClone(projection.machineIdentity)},machine:{schemaVersion:'2.0.0',machineId:projection.machineId,machineDataVersion:version,displayName:projection.machineName,modelName:projection.machineName,machineIdentity:structuredClone(projection.machineIdentity),settings:projection.settings.values,packagePolicy:projection.packagePolicy},inputs:{schemaVersion:'2.0.0',inputs},features:{version:'8.5-runtime',features,runtimeProjection:rp},evidence:{version:'8.5-runtime',evidences:materializedEvidences(projection),references:projection.evidence??[]},blockedItems:structuredClone(projection.blockedItems??[]),ui:toUi(projection),metadata:{machineId:projection.machineId,displayName:projection.machineName,machineIdentity:structuredClone(projection.machineIdentity),settings:projection.settings.values,settingsStatus:projection.settings.status},v8:{machineResearchSummary:{title:'この機種の設定推測について',adopted,notAdopted,highLowDiscrimination:hld?.status==='COMPUTED'?hld:undefined,unresolved:hld?.status==='NOT_COMPUTED'?[{label:'高低判別精度',reason:hld.reason}]:[]}}}};
}
