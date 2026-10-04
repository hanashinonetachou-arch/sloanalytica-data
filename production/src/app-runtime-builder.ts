import {evidenceSemanticExplanation} from './evidence-semantics.ts';
const heldReason=(x:any)=>{if(x?.status!=='HELD_NO_JOINT_MODEL')return '現在は数値推測に必要な条件が確定していません。';const concrete=String(x?.reason??'').trim();return concrete?userFacingBlockedText(concrete)+' 二重評価を避けるため、現在は単独の数値推測に使用していません。':'設定別出現率自体は確認できていますが、同じ観測範囲を使う複数要素を互いに独立とみなして同時加算できる根拠が確定していません。二重評価を避けるため、現在は単独の数値推測に使用していません。';};
const heldReevaluation=(x:any)=>x?.status==='HELD_NO_JOINT_MODEL'?'同じ観測範囲の要素を同時に扱える依存関係モデル、または代表要素を選ぶ明示的な選定基準が確定したら再評価します。':undefined;
const summaryLabel=(x:any,id:any)=>{const label=String(x?.name??x?.label??'').trim();const key=String(id??'').trim();if(!label||label==='設定推測要素'||label==='調査継続項目'||(key&&label===key))throw new Error('APP_RUNTIME_SUMMARY_LABEL_REQUIRED:'+key);return label;};
const probability=(v:any):number=>{if(typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1)return v;if(typeof v==='string'&&v.startsWith('1/')){const d=Number(v.slice(2));if(Number.isFinite(d)&&d>0)return 1/d}throw new Error('APP_RUNTIME_PROBABILITY_INVALID:'+String(v))};
const settingKey=(k:string)=>k.startsWith('SET_')?k:'SET_'+k;
export const categoricalProbabilityRow=(row:any,labels:string[],findingId:string,setting:string):number[]=>{
 if(row&&typeof row==='object'&&!Array.isArray(row))return labels.map(label=>{const v=row[label];if(typeof v!=='number'||v<0||v>1)throw new Error('APP_RUNTIME_CATEGORY_PROBABILITY:'+findingId+':'+setting+':'+label);return v});
 if(typeof row!=='string')throw new Error('APP_RUNTIME_CATEGORY_DISTRIBUTION:'+findingId+':'+setting);
 const parsed=new Map<string,number>();let explicitSum=0;
 for(const raw of row.split('/')){const part=raw.trim();const m=part.match(/^(.*?)(?:\s*:\s*|\s*)(\d+(?:\.\d+)?)%\s*$/);if(!m)continue;const label=m[1].trim();const value=Number(m[2])/100;if(!label||!Number.isFinite(value)||value<0||value>1)throw new Error('APP_RUNTIME_CATEGORY_DISTRIBUTION:'+findingId+':'+setting+':'+part);parsed.set(label,value);explicitSum+=value;}
 const hasResidualCategory=labels.includes('その他');
 const normalizeExhaustive=!hasResidualCategory&&Math.abs(explicitSum-1)<=0.005;
 return labels.map(label=>{if(parsed.has(label)){const value=parsed.get(label)!;return normalizeExhaustive?value/explicitSum:value;}if(label==='その他'){const residual=1-explicitSum;if(residual>=-1e-9&&residual<=1+1e-9)return Math.max(0,Math.min(1,residual));}throw new Error('APP_RUNTIME_CATEGORY_PROBABILITY:'+findingId+':'+setting+':'+label)});
};
const importanceForMetricValue=(value:any)=>{const n=Number(value);if(!Number.isFinite(n))return undefined;return n>=20?'主要':n>=10?'有力':n>=5?'補助':'微小';};
const runtimeImportance=(f:any)=>f?.score?.importance??importanceForMetricValue(f?.runtimePolicyBinding?.value);
const importanceToAdoption=(importance:any)=>importance==='主要'?'INCLUDE_PRIMARY':'INCLUDE_SUPPORT';
const scoreDescription=(section:any)=>{
 const score=section?.score;const power=section?.perEligibleTrialPower;
 if(score?.status==='COMPUTED'&&typeof score.value==='number')return `設定判別スコア：${Number(score.value).toFixed(1)}`;
 if(typeof power?.value==='number')return `1回の判別力：${Number(power.value).toFixed(3)}`;
 return `設定判別スコア：算出不可${score?.reason?'（'+score.reason+'）':''}`;
};
const trialLabelFor=(trialUniverse:any)=>{
 if(trialUniverse==='TOTAL_GAME_TRIAL')return '総ゲーム数';
 if(trialUniverse==='NORMAL_GAME_TRIAL'||trialUniverse==='BONUS_ELIGIBLE_GAME_TRIAL')return '通常ゲーム数';
 if(trialUniverse==='NON_TENHA_NORMAL_GAME_TRIAL')return '天破中を除く通常ゲーム数';
 if(trialUniverse==='LOTIS_NON_CHAIN_GAME_TRIAL'||trialUniverse==='NON_CHAIN_BONUS_INITIAL_GAME_TRIAL')return '連荘中を除くゲーム数';
 if(trialUniverse==='DAITOMO_NORMAL_PLAY_TRIAL')return 'ダイトモ通常プレイ数';
 if(trialUniverse==='HOWARD_GAME_50_REPLAY_TRIAL')return '規定リプレイ50回到達回数';
 if(typeof trialUniverse==='string'&&trialUniverse.includes('GAME_TRIAL'))return '対象ゲーム数';
 return '対象回数';
};
const trialUnitFor=(trialUniverse:any)=>trialLabelFor(trialUniverse).endsWith('ゲーム数')?'G':'回';
const sectionExplanation=(f:any,s:any)=>{
 const existing=String(s?.description??'').trim();if(existing)return existing;
 const inputs=s?.inputs??[],trial=inputs.find((x:any)=>x.role==='trial'),success=inputs.find((x:any)=>x.role==='success');
 if(f?.model==='CATEGORICAL')return String(s?.title??f?.name??'観測内容')+'を確認したときに、該当する項目を1回加算して記録します。';
 const trialLabel=String(trial?.label??'').trim(),successLabel=String(success?.label??'').trim();
 const successSubject=['','回数','対象回数','該当回数','該当した回数'].includes(successLabel)?String(f?.name??s?.title??'該当内容'):successLabel.replace(/回数$/,'').replace(/ゲーム数$/,'ゲーム').replace(/G数$/,'G');
 if(trialLabel.endsWith('ゲーム数'))return trialLabel+'を基準に、'+successSubject+'の出現割合を設定別に比較します。';
 return '対象となる機会のうち、'+successSubject+'が実際に起きた割合を設定別に比較します。';
};
const compactEvidenceText=(v:any)=>String(v??'').normalize('NFKC').replace(/[\\s（）()「」『』【】・：:、,／\\/_-]+/g,'');
const evidenceLinkKey=(findingId:any,index:number)=>String(findingId)+':'+index;
export function resolveEvidenceInputLinks(projection:any){
 const numeric=(projection.runtimeUi?.numericSections??[]);
 const categoryInputIdByKey=new Map<string,string>(),linkedEvidenceIds=new Set<string>(),featureEvidenceIds=new Map<string,string[]>();
 for(const section of projection.evidence??[])for(const e of section.evidenceItems??[]){
  const cats=Array.isArray(e.semanticCategories)?e.semanticCategories:[];
  for(let i=0;i<cats.length;i++){
   const cat=cats[i],linked=String(cat?.linkedFindingId??'').trim();if(!linked)continue;
   const target=numeric.find((s:any)=>s.sourceFindingId===linked);if(!target)continue;
   let input:any;
   if(target.model==='BERNOULLI')input=(target.inputs??[]).find((x:any)=>x.role==='success');
   else if(target.model==='CATEGORICAL'){
    const raw=compactEvidenceText(cat?.label),categoryInputs=(target.inputs??[]).filter((x:any)=>x.role==='categoryCount');
    const exact=categoryInputs.filter((x:any)=>compactEvidenceText(x.label)===raw);
    if(exact.length===1)input=exact[0];
    else if(exact.length===0){
      const partial=categoryInputs.filter((x:any)=>{const label=compactEvidenceText(x.label);return label.includes(raw)||raw.includes(label)});
      if(partial.length===1)input=partial[0];
    }
   }
   if(!input)continue;
   categoryInputIdByKey.set(evidenceLinkKey(e.findingId,i),input.id);
   const list=featureEvidenceIds.get(linked)??[];if(!list.includes(e.findingId))list.push(e.findingId);featureEvidenceIds.set(linked,list);
  }
  if(cats.length&&cats.every((_x:any,i:number)=>categoryInputIdByKey.has(evidenceLinkKey(e.findingId,i)))){linkedEvidenceIds.add(e.findingId);continue;}
  if(!e.trialUniverse||cats.length===0||cats.some((x:any)=>x?.semanticType!=='EXACT_CONSTRAINT'))continue;
  const candidates=numeric.filter((s:any)=>s?.model==='CATEGORICAL'&&s.trialUniverse===e.trialUniverse);
  let chosen:any=null;
  for(const s of candidates){
   const inputs=(s.inputs??[]).filter((x:any)=>x.role==='categoryCount');const ids:string[]=[];let ok=true;
   for(let i=0;i<cats.length;i++){
    const cat=cats[i],meaning=compactEvidenceText(cat.meaning),raw=compactEvidenceText(cat.label);
    let matches=inputs.filter((x:any)=>meaning&&compactEvidenceText(x.label).includes(meaning));
    if(matches.length===0&&raw)matches=inputs.filter((x:any)=>{const label=compactEvidenceText(x.label);return label===raw||label.includes(raw)||raw.includes(label)});
    if(matches.length!==1&&matches.length>0){
     const tokens=String(cat.label??'').replace(/[（）()]/g,'・').split(/[・：:\\s／\\/]+/).map(compactEvidenceText).filter((t:string)=>t.length>=2&&!/^設定[1-6]/.test(t)&&!/(?:濃厚|否定|示唆)$/.test(t));
     const narrowed=matches.filter((x:any)=>tokens.some((t:string)=>compactEvidenceText(x.label).includes(t))||raw&&compactEvidenceText(x.label).includes(raw));
     if(narrowed.length===1)matches=narrowed;
    }
    if(matches.length!==1){ok=false;break}ids.push(matches[0].id);
   }
   if(ok){if(chosen){chosen=null;break}chosen={section:s,ids};}
  }
  if(!chosen)continue;
  cats.forEach((_x:any,i:number)=>{const key=evidenceLinkKey(e.findingId,i);if(!categoryInputIdByKey.has(key))categoryInputIdByKey.set(key,chosen.ids[i])});if(cats.every((_x:any,i:number)=>categoryInputIdByKey.has(evidenceLinkKey(e.findingId,i))))linkedEvidenceIds.add(e.findingId);
  const list=featureEvidenceIds.get(chosen.section.sourceFindingId)??[];list.push(e.findingId);featureEvidenceIds.set(chosen.section.sourceFindingId,list);
 }
 return {categoryInputIdByKey,linkedEvidenceIds,featureEvidenceIds};
}
const appendLinkedEvidenceNote=(description:string,featureId:any,links:any)=>links.featureEvidenceIds.has(featureId)?[description,'・反映：同じ入力から設定確定・設定否定の条件にも自動反映します。別の欄へ重ねて入力する必要はありません'].filter(Boolean).join('\n'):description;
const playDataSourceForTrialUniverse=(trialUniverse:any)=>
 trialUniverse==='TOTAL_GAME_TRIAL'?'PLAY_TOTAL_GAME_DELTA':
 trialUniverse==='LOTIS_NON_CHAIN_GAME_TRIAL'||trialUniverse==='NON_CHAIN_BONUS_INITIAL_GAME_TRIAL'?'PLAY_TOTAL_GAME_DELTA_EXCLUDED':
 trialUniverse==='NON_TENHA_NORMAL_GAME_TRIAL'?'PLAY_NORMAL_GAME_DELTA_EXCLUDED':
 trialUniverse==='NORMAL_GAME_TRIAL'||trialUniverse==='BONUS_ELIGIBLE_GAME_TRIAL'?'PLAY_NORMAL_GAME_DELTA':undefined;
const playDataBindingFor=(source:any)=>source?{source,...(source==='PLAY_TOTAL_GAME_DELTA_EXCLUDED'||source==='PLAY_NORMAL_GAME_DELTA_EXCLUDED'?{mode:'AUTO_EXACT'}:{})}:undefined;
const numericUiSections=(projection:any)=>{
 const src=projection.runtimeUi??{},links=resolveEvidenceInputLinks(projection);const activeBy=new Map((projection.activeFeatures??[]).map((x:any)=>[x.findingId,x]));
 const rows=(src.numericSections??[]).map((s:any)=>{const f:any=activeBy.get(s.sourceFindingId);if(!f)throw new Error('APP_RUNTIME_UI_FEATURE_MISSING:'+s.sourceFindingId);return {s,f,inputs:s.inputs??[],playDataSource:playDataSourceForTrialUniverse(f.trialUniverse)}});
 const groups=new Map<string,any[]>();for(const row of rows){if(row.f.model==='BERNOULLI'&&row.playDataSource){const key=String(row.f.trialUniverse)+'|'+row.playDataSource;groups.set(key,[...(groups.get(key)??[]),row])}}
 const consumed=new Set<string>();const out:any[]=[];
 for(const row of rows){if(consumed.has(row.s.sourceFindingId))continue;const key=String(row.f.trialUniverse)+'|'+String(row.playDataSource??'');const peers=row.f.model==='BERNOULLI'&&row.playDataSource?(groups.get(key)??[row]):[row];
  if(peers.length>1){const trials=peers.map((p:any)=>p.inputs.find((x:any)=>x.role==='trial'));if(trials.some((x:any)=>!x))throw new Error('APP_RUNTIME_SHARED_DENOMINATOR_TRIAL');for(const p of peers)consumed.add(p.s.sourceFindingId);const label=trials[0].label;const sharedTitle=peers.map((p:any)=>String(p.s.title)).join('・');out.push({id:'OBS_SHARED_'+String(row.f.trialUniverse),title:sharedTitle,collapsible:true,defaultExpanded:false,description:'複数の設定推測項目で同じ「'+label+'」を共通の基準として使用します。'+label+'は1回だけ入力し、各項目では該当した回数だけを記録してください。',descriptionPresentation:{collapsible:true,label:'説明',defaultExpanded:false},groups:[{id:'DENOM_'+String(row.f.trialUniverse),label,input:'denominator',inputId:trials[0].id,engineBinding:{inputIds:trials.map((x:any)=>x.id)},gridSpan:12,directNumeric:true,quickAdd:trials[0].quickAdd??[50],unobservedDisplay:'—',playDataBinding:playDataBindingFor(row.playDataSource)}],items:peers.map((p:any)=>{const success=p.inputs.find((x:any)=>x.role==='success');if(!success)throw new Error('APP_RUNTIME_BERNOULLI_UI:'+p.f.findingId);return {id:'NODE_'+p.f.findingId,featureId:p.f.findingId,title:p.s.title,description:appendLinkedEvidenceNote(sectionExplanation(p.f,p.s),p.f.findingId,links),descriptionPresentation:{collapsible:true,label:'説明',defaultExpanded:false},gridSpan:6,inputs:[{id:success.id,label:success.label,input:'counter',inputId:success.id,engineBinding:{inputId:success.id},gridSpan:12,directNumeric:true,quickAdd:success.quickAdd??[1],unobservedDisplay:'—'}]}})});continue}
  consumed.add(row.s.sourceFindingId);const {s,f,inputs}=row;
  if(f.model==='BERNOULLI'){const trial=inputs.find((x:any)=>x.role==='trial'),success=inputs.find((x:any)=>x.role==='success');if(!trial||!success)throw new Error('APP_RUNTIME_BERNOULLI_UI:'+f.findingId);const trialNode:any={id:trial.id,label:trial.label,input:'denominator',inputId:trial.id,engineBinding:{inputId:trial.id},gridSpan:row.playDataSource?12:6,directNumeric:true,quickAdd:trial.quickAdd??[50],unobservedDisplay:'—'};if(row.playDataSource)trialNode.playDataBinding=playDataBindingFor(row.playDataSource);out.push({id:s.id,title:s.title,collapsible:s.collapsible!==false,defaultExpanded:s.defaultExpanded===true,description:appendLinkedEvidenceNote(sectionExplanation(f,s),f.findingId,links),descriptionPresentation:{collapsible:true,label:'説明',defaultExpanded:false},items:[{id:'NODE_'+f.findingId,featureId:f.findingId,title:s.title,inputs:[trialNode,{id:success.id,label:success.label,input:'counter',inputId:success.id,engineBinding:{inputId:success.id},gridSpan:6,directNumeric:true,quickAdd:success.quickAdd??[1],unobservedDisplay:'—'}]}]});continue}
  if(f.model==='CATEGORICAL'){const trial=inputs.find((x:any)=>x.role==='trial'),cats=inputs.filter((x:any)=>x.role==='categoryCount');if(!trial||cats.length<2)throw new Error('APP_RUNTIME_CATEGORICAL_UI:'+f.findingId);const sumMode=['SOURCE_EXHAUSTIVE','SOURCE_EXPLICIT_OTHER'].includes(String(f.categoryModel?.residualPolicy??''));out.push({id:s.id,title:s.title,collapsible:s.collapsible!==false,defaultExpanded:s.defaultExpanded===true,description:appendLinkedEvidenceNote(sectionExplanation(f,s),f.findingId,links),descriptionPresentation:{collapsible:true,label:'説明',defaultExpanded:false},items:[{id:'NODE_'+f.findingId,featureId:f.findingId,title:s.title,interaction:{type:'CATEGORY_COUNTERS',preservePriorObservations:true,showAccumulatedCounts:true,categoryCoverage:sumMode?'EXHAUSTIVE':'NON_EXHAUSTIVE',totalOpportunities:sumMode?'SUM_CATEGORY_COUNTS':'SEPARATE_COUNTER',...(sumMode?{}:{opportunityTracking:{type:'SEPARATE_COUNTER',inputId:trial.id,label:trial.label}}),categories:cats.map((x:any)=>({id:x.id,inputId:x.id,label:x.label}))}}]});continue}
  throw new Error('APP_RUNTIME_MODEL_UNSUPPORTED:'+f.model)
 }
 return out;
};
const evidenceExplanation=(s:any)=>{
 const existing=String(s?.description??'').trim();if(existing&&/設定別出現率が未確認|設定候補の絞り込み|記録のみ/.test(existing))return existing;
 const types=[...new Set((s.evidenceItems??[]).flatMap((e:any)=>Array.isArray(e.semanticCategories)?e.semanticCategories.map((x:any)=>x.semanticType):[e.semanticType]).filter(Boolean))];
 const details=(s.evidenceItems??[]).flatMap((e:any)=>Array.isArray(e.details)?e.details:[]).filter((x:any)=>typeof x==='string'&&x.trim());
 const semantic=types.includes('EXACT_CONSTRAINT')&&types.some((x:any)=>x!=='EXACT_CONSTRAINT')?evidenceSemanticExplanation('EXACT_CONSTRAINT')+' '+types.filter((x:any)=>x!=='EXACT_CONSTRAINT').map((x:any)=>evidenceSemanticExplanation(x)).join(' '):evidenceSemanticExplanation((types[0]??'DISPLAY_ONLY') as any);
 return [existing,...details,semantic].filter(Boolean).join('\n');
};
const evidenceCategoryPresentation=(raw:string)=>{
 const m=raw.match(/^(.+?)[：:]\s*(.+)$/);
 if(m&&/設定|示唆|濃厚|否定|以上|奇数|偶数|高設定|低設定/.test(m[2]))return {label:m[1].trim(),meaning:m[2].trim()};
 return {label:raw,meaning:'観測回数'};
};
export const evidenceCategoryRecords=(e:any)=>{
 const structured=Array.isArray(e.semanticCategories)?e.semanticCategories.filter((x:any)=>x&&typeof x==='object'&&typeof x.label==='string'&&x.label.trim()):[];
 if(structured.length)return structured.map((x:any)=>{const rawLabel=String(x.label).trim();const parsed=evidenceCategoryPresentation(rawLabel);const explicitMeaning=typeof x.meaning==='string'&&x.meaning.trim()?x.meaning.trim():undefined;const label=explicitMeaning?rawLabel:parsed.label,meaning=explicitMeaning??parsed.meaning;return {label,meaning,semanticType:x.semanticType??e.semanticType,linkedFindingId:x.linkedFindingId,raw:explicitMeaning?`${label}：${meaning}`:rawLabel};});
 const details=Array.isArray(e.details)?e.details.filter((x:any)=>typeof x==='string'&&x.trim()):[];
 const labels=details.length?details:[e.label];
 return labels.map((raw:string)=>{const p=evidenceCategoryPresentation(raw);return {...p,semanticType:e.semanticType,raw};});
};
const evidenceUiSections=(projection:any)=>{
 const links=resolveEvidenceInputLinks(projection),out:any[]=[];
 for(const s of projection.runtimeUi?.evidenceSections??[]){
  const items=(s.evidenceItems??[]).flatMap((e:any)=>{const records=evidenceCategoryRecords(e).map((p:any,i:number)=>({p,i})).filter(({i}:any)=>!links.categoryInputIdByKey.has(evidenceLinkKey(e.findingId,i)));if(!records.length)return [];return [{id:'REF_'+e.findingId,evidenceId:e.findingId,label:e.label,interaction:{type:'CATEGORY_COUNTERS',preservePriorObservations:true,showAccumulatedCounts:true,categoryCoverage:'NON_EXHAUSTIVE',totalOpportunities:'NONE',categories:records.map(({p,i}:any)=>({id:'REF_'+e.findingId+'_'+(i+1),inputId:'REF_'+e.findingId+'_'+(i+1),label:p.label,meaning:p.meaning}))}}]});
  if(items.length)out.push({id:s.id,title:s.title,description:evidenceExplanation(s),collapsible:s.collapsible!==false,defaultExpanded:s.defaultExpanded===true,descriptionPresentation:s.descriptionPresentation??{collapsible:true,label:'説明',defaultExpanded:false},items});
 }
 return out;
};
const toUi=(projection:any)=>{const src=projection.runtimeUi??{};return {schemaVersion:'v8.5-runtime-ui-v1',contractVersion:'runtime-ui-v8',source:'CANONICAL_UI',sourceSchemaVersion:src.schemaVersion,manifestRevision:'8.5',playInfo:src.playInfo,accordion:{enabled:true,singleOpen:true},quickInput:{enabled:false},v8Sections:[...numericUiSections(projection),...evidenceUiSections(projection)]}};
const buildInputs=(projection:any)=>{
 const out:any[]=[];const seen=new Set<string>();let order=1;const links=resolveEvidenceInputLinks(projection);
 for(const s of projection.runtimeUi?.numericSections??[]){
  const f=(projection.activeFeatures??[]).find((x:any)=>x.findingId===s.sourceFindingId);if(!f)continue;
  const trialId=(s.inputs??[]).find((x:any)=>x.role==='trial')?.id;
  for(const x of s.inputs??[]){
   if(seen.has(x.id))throw new Error('APP_RUNTIME_DUPLICATE_INPUT:'+x.id);seen.add(x.id);
   const sumMode=f.model==='CATEGORICAL'&&['SOURCE_EXHAUSTIVE','SOURCE_EXPLICIT_OTHER'].includes(String(f.categoryModel?.residualPolicy??''));const categoryIds=(s.inputs??[]).filter((i:any)=>i.role==='categoryCount').map((i:any)=>i.id);out.push({id:x.id,name:x.label,category:'V8_NUMERIC',type:x.role==='trial'?'integer':'counter',unit:x.role==='trial'?trialUnitFor(f.trialUniverse):'回',defaultValue:0,minimum:0,displayOrder:order++,parentInputId:x.role==='trial'?undefined:trialId,inferenceRole:importanceToAdoption(runtimeImportance(f)),...(sumMode&&x.role==='trial'?{inputVisible:false,derivedCalculation:'sum',derivedFromInputIds:categoryIds}:{})});
  }
 }
 for(const s of projection.evidence??[]){
  for(const e of s.evidenceItems??[]){
   for(const [i,category] of evidenceCategoryRecords(e).entries()){
    if(links.categoryInputIdByKey.has(evidenceLinkKey(e.findingId,i)))continue;
    const id=`REF_${e.findingId}_${i+1}`;if(seen.has(id))continue;seen.add(id);
    out.push({id,name:category.raw,category:'EVIDENCE_REFERENCE',type:'counter',unit:'回',defaultValue:0,minimum:0,displayOrder:order++,inferenceRole:'DISPLAY_ONLY'});
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
  const base:any={featureId:f.findingId,name:f.name,trialUniverse:f.trialUniverse,adoptionCategory:importanceToAdoption(runtimeImportance(f)),calculationRole:'PROBABILITY',probabilityEngineUsage:true,denominatorInputId:trial.id,suppressedByFeatureIds:Array.isArray(f.suppressedByFeatureIds)&&f.suppressedByFeatureIds.length?[...f.suppressedByFeatureIds]:undefined,probabilities:{},selectionRationale:{summary:'設定推測に採用された要素です。',adoptionReason:'採用条件を満たし、実戦で観測できる設定差を使用します。',shortTermReason:'標本が少ない間は結果の振れが大きくなります。',longTermReason:'観測数が増えるほど設定別の比較が安定します。'}};
  if(f.model==='BERNOULLI'){
   const success=s.inputs?.find((x:any)=>x.role==='success');if(!success)throw new Error('APP_RUNTIME_FEATURE_SUCCESS:'+f.findingId);
   base.modelType='binomial';base.numeratorInputId=success.id;base.displayFormat='percentage';
   base.probabilities=Object.fromEntries(Object.entries(f.settingDistribution??{}).map(([k,v])=>[settingKey(k),probability(v)]));
   return base;
  }
  if(f.model==='CATEGORICAL'){
   const cats=(s.inputs??[]).filter((x:any)=>x.role==='categoryCount');if(cats.length<2)throw new Error('APP_RUNTIME_FEATURE_CATEGORIES:'+f.findingId);
   base.modelType='multinomial';base.numeratorInputId=cats[0].id;base.categoryInputIds=cats.slice(1).map((x:any)=>x.id);if(['SOURCE_EXHAUSTIVE','SOURCE_EXPLICIT_OTHER'].includes(String(f.categoryModel?.residualPolicy??'')))base.denominatorRule='SUM_CATEGORY_COUNTS';
   base.categoryProbabilities=Object.fromEntries(Object.entries(f.settingDistribution??{}).map(([k,row]:any)=>[settingKey(k),categoricalProbabilityRow(row,cats.map((x:any)=>x.label),f.findingId,k)]));
   return base;
  }
  throw new Error('APP_RUNTIME_FEATURE_MODEL:'+f.model);
 });
};
const evidenceConstraintFromLabel=(label:string,allSettings:string[])=>{
 const settings=[...allSettings];
 const above=label.match(/設定([1-6])以上/);if(above){const n=Number(above[1]);return {confirmedSettings:settings.filter(s=>Number(String(s).replace('SET_',''))>=n),deniedSettings:[]};}
 const deniedList=label.match(/設定([1-6](?:[・,／\\/][1-6])+)否定/);if(deniedList){const nums=deniedList[1].split(/[・,／\\/]/);return {confirmedSettings:[],deniedSettings:settings.filter(s=>nums.includes(String(s).replace('SET_','')))};}
 const denied=label.match(/設定([1-6])否定/);if(denied)return {confirmedSettings:[],deniedSettings:['SET_'+denied[1]]};
 const listed=label.match(/設定([1-6](?:[・,／\/][1-6])+)(?:濃厚)?/);if(listed){const nums=listed[1].split(/[・,／\/]/);return {confirmedSettings:settings.filter(s=>nums.includes(String(s).replace('SET_',''))),deniedSettings:[]};}
 const parity=label.match(/(奇数|偶数)設定濃厚/);if(parity){const odd=parity[1]==='奇数';return {confirmedSettings:settings.filter(s=>{const n=Number(String(s).replace('SET_',''));return odd?n%2===1:n%2===0}),deniedSettings:[]};}
 const exact=label.match(/(?:^|[:：=]\s*)設定([1-6])(?:濃厚)?\s*$/);if(exact)return {confirmedSettings:['SET_'+exact[1]],deniedSettings:[]};
 return null;
};
const materializedEvidences=(projection:any)=>{
 const allSettings=Array.isArray(projection.settings?.values)?projection.settings.values:[],links=resolveEvidenceInputLinks(projection);
 return (projection.evidence??[]).flatMap((s:any)=>(s.evidenceItems??[]).flatMap((e:any)=>evidenceCategoryRecords(e).flatMap((category:any,i:number)=>{
  if(category.semanticType!=='EXACT_CONSTRAINT')return [];
  const constraint=evidenceConstraintFromLabel(category.meaning==='観測回数'?category.raw:category.meaning,allSettings);if(!constraint)throw new Error('APP_RUNTIME_EXACT_CONSTRAINT_UNPARSEABLE:'+e.findingId+':'+category.raw);
  const inputId=links.categoryInputIdByKey.get(evidenceLinkKey(e.findingId,i))??('REF_'+e.findingId+'_'+(i+1));
  return [{id:e.findingId+'__'+(i+1),name:category.raw,displayName:category.raw,inputId,details:[category.raw],confirmedSettings:constraint.confirmedSettings,deniedSettings:constraint.deniedSettings,hasImage:false,type:'SETTING_CONSTRAINT',sourceEvidenceRefs:[e.findingId]}];
 })));
};
const nonRuntimeReason=(x:any,targetLabel?:string)=>{const concrete=String(x?.dependencyReason??'').trim(),target=targetLabel??'代表となる設定推測要素';if(x?.dependencyResolution==='RESOLVED_BY_SINGLE_MEMBER'&&x?.resolvedIntoFindingId){const context=concrete?userFacingBlockedText(concrete)+' ':'';return 'この項目にも設定差のある数値は確認できています。'+context+'同じ情報を重ねて評価して判別力を過大に見積もらないため、現在は設定判別スコア等を比較して「'+target+'」を代表として使用し、この項目は単独では数値推測に使用しません。';}if(x?.dependencyResolution==='RESOLVED_IN_JOINT_MODEL'&&x?.resolvedIntoFindingId)return (concrete?userFacingBlockedText(concrete)+' ':'')+'「'+target+'」と同じ観測結果の内訳としてまとめて評価します。';return (concrete?userFacingBlockedText(concrete):'')+' 現在は単独の数値推測要素として使用しません。';};
function userFacingBlockedText(raw:any){return String(raw??'').replace(/likelihood/gi,'数値推測').replace(/source-supportedな/gi,'信頼できる資料で確認できる').replace(/source-supported/gi,'信頼できる資料で確認できる').replace(/joint\s*\/\s*conditional\s*model/gi,'要素間の関係を扱う統計モデル').replace(/joint\s*\/\s*dependency\s*model/gi,'要素間の関係を扱う統計モデル').replace(/joint\s*categorical\s*model/gi,'複数カテゴリを同時に扱う統計モデル').replace(/joint\s*model/gi,'要素を同時に扱う統計モデル').replace(/dependency\s*model/gi,'要素間の関係を扱う方法').replace(/candidate\s*contract/gi,'採用判定').replace(/runtime\s*policy/gi,'採用基準').replace(/\bjoint\b/gi,'複数要素の同時評価').replace(/\bconditional\b/gi,'条件付き').replace(/\bcategorical\b/gi,'カテゴリ別').replace(/\bmodel\b/gi,'統計モデル').replace(/research/gi,'調査').replace(/evaluation/gi,'評価');}
const userFacingExcludedReason=(x:any)=>{const explicit=String(x?.userFacingReason??'').trim();if(explicit)return userFacingBlockedText(explicit);const reason=String(x?.reason??'');if(/likelihood|補間|設定別/.test(reason))return '設定ごとの判別に必要な数値が揃っていないため、現在は数値推測に使用しません。';if(/denominator|観測機会|reconstruction|再現/.test(reason))return '正確な観測回数を扱うための情報が不足しているため、現在は数値推測に使用しません。';return '現在は数値推測に必要な情報が十分でないため使用しません。';};
const userFacingReevaluation=(x:any)=>x?.reevaluationCondition?'必要な設定別データや観測条件が確認できれば再評価します。':undefined;
const dedupeSummary=(items:any[])=>{const seen=new Set<string>();return items.filter((x:any)=>{const k=String(x?.featureId??x?.label??'');if(!k||seen.has(k))return false;seen.add(k);return true})};
const runtimeProjection=(projection:any)=>[
 ...(projection.activeFeatures??[]).map((f:any)=>({featureId:f.findingId,runtimeStatus:'ACTIVE',metric:f.runtimePolicyBinding?.metric,metricValue:f.runtimePolicyBinding?.value,importance:runtimeImportance(f)})),
 ...(projection.inactiveFeatures??[]).map((f:any)=>({featureId:f.findingId,runtimeStatus:'INACTIVE',metric:f.metric,metricValue:f.value,threshold:f.threshold,runtimeReason:f.reason})),
];
export function buildAppRuntime(projection:any,projectionArtifact:any){
 if(projection.settings?.status!=='SOURCE_DERIVED'||!(projection.settings?.values?.length>0))throw new Error('APP_RUNTIME_SETTINGS_REQUIRED');
 const version='8.5.0-'+projection.batchId,held=projection.heldObservations??[],hld=projection.highLowDiscrimination;
 const features=buildFeatures(projection),inputs=buildInputs(projection),rp=runtimeProjection(projection);
 const adopted=(projection.activeFeatures??[]).map((f:any)=>({featureId:f.findingId,label:f.name,importance:runtimeImportance(f),selectionScore:f.score?.status==='COMPUTED'?f.score.value:undefined,evaluation:{userLabel:f.score?.status==='COMPUTED'?'設定判別スコア':'1回の判別力',value:f.score?.status==='COMPUTED'?f.score.value:f.runtimePolicyBinding?.value},reason:Array.isArray(f.suppressedByFeatureIds)&&f.suppressedByFeatureIds.length?'優先する設定推測項目を記録していない場合の補助として使用します。優先項目を記録した場合は、同じ設定差を重ねて評価しないよう自動で推測から外れます。':'現在の採用基準を満たしているため、設定推測に使用します。'}));
 const inactive=(projection.inactiveFeatures??[]).map((f:any)=>({featureId:f.findingId,label:summaryLabel(f,f.findingId),reason:'現在の採用基準を満たしていないため、設定推測に使用しません。'}));
 const allLabels=[...(projection.activeFeatures??[]).map((x:any)=>({findingId:x.findingId,label:x.name})),...(projection.nonRuntimeCandidates??[])];
 const resolved=(projection.nonRuntimeCandidates??[]).map((x:any)=>({featureId:x.findingId,label:x.label,reason:nonRuntimeReason(x,allLabels.find((y:any)=>y.findingId===x.resolvedIntoFindingId)?.label)}));
 const excluded=(projection.excludedDecisions??[]).map((x:any)=>({featureId:x.findingId,label:x.label,reason:userFacingExcludedReason(x),reevaluationCondition:userFacingReevaluation(x)}));
 const blocked=(projection.blockedItems??[]).map((x:any)=>({featureId:x.blockId??x.findingId,label:summaryLabel(x,x.blockId??x.findingId),reason:userFacingBlockedText(x.reason||'現在は数値推測に必要な情報が十分でないため使用しません。'),reevaluationCondition:userFacingBlockedText(x.reevaluationCondition)}));
 const notAdopted=dedupeSummary([...inactive,...held.map((x:any)=>({featureId:x.findingId,label:summaryLabel(x,x.findingId),reason:heldReason(x),reevaluationCondition:heldReevaluation(x)??x.reevaluationCondition})),...resolved,...excluded,...blocked]);
 return {schemaVersion:'app-runtime-v1',manifestVersion:'8.5',batchId:projection.batchId,machineId:projection.machineId,machineName:projection.machineName,sourceArtifact:projectionArtifact,package:{schemaVersion:1,provenance:{manifestVersion:'8.5',generationPath:'V8_5_PRODUCTION_PIPELINE',legacyOracleUsed:false},machine:{schemaVersion:'2.0.0',machineId:projection.machineId,machineDataVersion:version,displayName:projection.machineName,modelName:projection.machineName,settings:projection.settings.values,packagePolicy:projection.packagePolicy},inputs:{schemaVersion:'2.0.0',inputs},features:{version:'8.5-runtime',features,runtimeProjection:rp},evidence:{version:'8.5-runtime',evidences:materializedEvidences(projection),references:projection.evidence??[]},blockedItems:structuredClone(projection.blockedItems??[]),ui:toUi(projection),metadata:{machineId:projection.machineId,displayName:projection.machineName,settings:projection.settings.values,settingsStatus:projection.settings.status},v8:{machineResearchSummary:{title:'この機種の設定推測について',adopted,notAdopted,highLowDiscrimination:hld?.status==='COMPUTED'?hld:undefined,unresolved:hld?.status==='NOT_COMPUTED'?[{label:'高低判別精度',reason:hld.reason}]:[]}}}};
}
