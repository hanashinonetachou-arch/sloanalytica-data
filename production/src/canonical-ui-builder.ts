const IMPORTANCE_LABELS=['主要','有力','補助','微小'] as const;
const ABSTRACT_INPUT_LABELS=new Set(['対象回数','回数','観測機会数','該当回数']);
function importanceFor(score:number){return score>=20?'主要':score>=10?'有力':score>=5?'補助':'微小'}
function userFacingScoreUnavailableReason(raw:any){const reason=String(raw??'').trim();if(!reason||/opportunity model|research|exact exposure|denominator|benchmark/i.test(reason))return '基準遊技量7000Gでの判別力を算出するための観測条件が確定していないため算出できません。';return reason}
function scoreView(e:any){const s=e?.metrics?.selectionScore;if(s?.status==='COMPUTED'&&typeof s.value==='number'&&Number.isFinite(s.value)){const value=Number(s.value.toFixed(1));return {label:'設定判別スコア',status:'COMPUTED',value,precision:1,importance:importanceFor(s.value)}}const sourceReason=e?.benchmarkExposure?.reason??'基準遊技量に対応するexact exposure modelが未確立のため算出しない。';const reason=userFacingScoreUnavailableReason(sourceReason);return {label:'設定判別スコア',status:'NOT_COMPUTED',display:'算出不可',reason,sourceReason}}
function categoryLabels(distribution:any){const out:string[]=[];for(const v of Object.values(distribution??{})){if(v&&typeof v==='object'&&!Array.isArray(v)){for(const k of Object.keys(v))if(!out.includes(k))out.push(k);continue}if(typeof v!=='string')continue;for(const raw of v.split('/')){const label=raw.trim().replace(/[:\s]*[-+]?\d+(?:\.\d+)?%\s*$/,'').trim();if(label&&!out.includes(label))out.push(label)}}return out}
const safeKey=(s:string,i:number)=>(i+1)+'_'+s.replace(/[^A-Za-z0-9一-龠ぁ-んァ-ヶー＋+_-]+/g,'_');
const trialQuickAdd=(trialUniverse:any)=>typeof trialUniverse==='string'&&trialUniverse.includes('GAME_TRIAL')?[50]:[];
const normalizeUserText=(v:any)=>String(v??'').replace(/\\n/g,'\n').replace(/\/n/gi,'\n');
const clean=(v:any)=>normalizeUserText(v).trim().replace(/[。．]+$/,'').trim();
const sentences=(v:any)=>normalizeUserText(v).split(/[。．]|\n+/).map(clean).filter(Boolean);
const knownTrialLabel=(u:any)=>{
 if(u==='TOTAL_GAME_TRIAL')return '総ゲーム数';
 if(u==='NORMAL_GAME_TRIAL'||u==='BONUS_ELIGIBLE_GAME_TRIAL')return '通常ゲーム数';
 if(u==='LOTIS_NON_CHAIN_GAME_TRIAL'||u==='NON_CHAIN_BONUS_INITIAL_GAME_TRIAL')return '連荘中を除くゲーム数';
 if(u==='DAITOMO_NORMAL_PLAY_TRIAL')return 'ダイトモ通常プレイ数';
 if(u==='HOWARD_GAME_50_REPLAY_TRIAL')return '規定リプレイ50回到達回数';
 return undefined;
};
const normalizeTrialLabel=(raw:any)=>{
 let s=clean(raw).replace(/^通常時ゲーム数$/,'通常ゲーム数').replace(/^通常時のゲーム数$/,'通常ゲーム数');
 s=s.replace(/抽選機会$/,'抽選回数').replace(/確認機会$/,'確認回数').replace(/を受けた回数$/,'回数').replace(/を確認した回数$/,'回数').replace(/機会$/,'回数');
 return s;
};
const normalizeSuccessLabel=(raw:any,fallback:any)=>{
 let s=clean(raw).replace(/^そのうち[、,]?/,'').replace(/を数える$/,'').replace(/を記録する$/,'');
 if(!s)s=clean(fallback);
 s=s.replace(/エピソードボーナス/g,'EPボーナス').replace(/の設定別(?:選択率|振り分け)$/,'').replace(/設定別(?:選択率|振り分け)$/,'').replace(/発生率$/,'発生回数').replace(/選択率$/,'選択回数').replace(/獲得率$/,'獲得回数').replace(/移行率$/,'移行回数').replace(/当選率$/,'当選回数');
 if(/確率$/.test(s))s=s.replace(/確率$/,'回数');
 if(!/(?:回数|ゲーム数|G数)$/.test(s))s+='回数';
 return s;
};
const sharedContextBoundary=(title:string,label:string)=>{
 const max=Math.min(title.length,label.length);let i=0;while(i<max&&title[i]===label[i])i++;
 const prefix=label.slice(0,i);let cut=-1;
 for(const token of ['の','時','中','後']){const p=prefix.lastIndexOf(token);if(p>=2)cut=Math.max(cut,p+token.length)}
 return cut;
};
const compactContextualInputLabel=(raw:any,sectionTitle:any)=>{
 let label=clean(raw).replace(/エピソードボーナス/g,'EPボーナス');
 const title=clean(sectionTitle).replace(/エピソードボーナス/g,'EPボーナス');
 const cut=sharedContextBoundary(title,label);if(cut>0&&label.length-cut>=2)label=label.slice(cut);
 label=label
  .replace(/^(?:の|に|で|を|が|へ|から)+/,'')
  .replace(/^.+?を除いた[、,]?(?:通常の)?(.+)$/,'$1')
  .replace(/^.+?を除く(.+)$/,'$1')
  .replace(/^.+?[、,](.+?)を確認できた回数の合計を観測母数とする$/,'$1確認回数')
  .replace(/^(.+?)を確認できた回数の合計を観測母数とする$/,'$1確認回数')
  .replace(/^.+が0ptへ到達して(.+)$/,'0pt到達時$1')
  .replace(/^前回ボーナスから(\d+G以内)に成立した(BIG|REG)回数$/,'$1$2回数')
  .replace(/^.+(?:後|時)に(.+へ突入した回数)$/,'$1')
  .replace(/^.+(?:で|から)(.+へ突入した回数)$/,'$1')
  .replace(/^.+から転落し[、,]?(.+)が発生した回数$/,'$1発生回数')
  .replace(/^(.+)に前兆ゲーム数がセットされた回数$/,'$1の前兆セット回数')
  .replace(/へ突入した回数$/,'突入回数')
  .replace(/へ昇格した回数$/,'昇格回数')
  .replace(/が成立した回数$/,'成立回数')
  .replace(/が選ばれた回数$/,'選択回数')
  .replace(/まで到達した回数$/,'到達回数')
  .replace(/を受けた回数$/,'回数')
  .replace(/を確認した回数$/,'回数');
 const max=Math.min(title.length,label.length);let shared=0;while(shared<max&&title[shared]===label[shared])shared++;
 const secondCut=sharedContextBoundary(title,label);if(shared>=7&&secondCut>0&&label.length-secondCut>=2)label=label.slice(secondCut).replace(/^(?:の|に|で|を|が|へ|から)+/,'');
 return label||clean(raw);
};
const countSubject=(label:string)=>label.replace(/回数$/,'').replace(/ゲーム数$/,'ゲーム').replace(/G数$/,'G');
const userFacingEligibilityNotes=(o:any)=>{
 const ss=sentences(o?.denominatorSemantics),out:string[]=[];
 for(let i=0;i<ss.length;i++){
  const raw=ss[i];
  const excluded=raw.match(/^(.+?)を除いた[、,]?(?:通常の)?(.+)$/)||raw.match(/^(.+?)を除く(.+)$/);
  if(excluded){out.push(excluded[1]+'は対象に含めません。');continue}
  const explicitExclude=raw.match(/^(.+?)は(?:対象から)?除外する$/);
  if(explicitExclude){out.push(explicitExclude[1]+'は対象に含めません。');continue}
  if(i===0)continue;
  if(/を数える$|を記録する$/.test(raw))continue;
  out.push(raw+'。');
 }
 return unique(out);
};
export function deriveObservationInputLabels(o:any){
 const ss=sentences(o?.denominatorSemantics),first=ss[0]??'',against=first.match(/^(.+?)に対する[、,]?(.+)$/);
 let trial=knownTrialLabel(o?.trialUniverse),success='';
 if(against){trial=trial??normalizeTrialLabel(against[1]);success=normalizeSuccessLabel(against[2],o?.label)}
 else{
  trial=trial??normalizeTrialLabel(first||((o?.label??'観測内容')+'を確認した回数'));
  const counter=ss.slice(1).map((x:string)=>x.match(/^(.+?)を数える$/)||x.match(/^(.+?)を記録する$/)).find(Boolean) as RegExpMatchArray|undefined;
  success=normalizeSuccessLabel(counter?.[1],o?.label);
 }
 if(!trial||ABSTRACT_INPUT_LABELS.has(trial))trial=normalizeTrialLabel((o?.label??'観測内容')+'を確認した回数');
 if(!success||ABSTRACT_INPUT_LABELS.has(success))success=normalizeSuccessLabel('',o?.label);
 trial=compactContextualInputLabel(trial,o?.label);success=compactContextualInputLabel(success,o?.label);
 return {trialLabel:trial,successLabel:success};
}
const isSettingMeaning=(s:string)=>/設定[1-6]|高設定|低設定|奇数|偶数|示唆|濃厚|否定/.test(s);
const unique=(xs:string[])=>xs.filter((x,i)=>x&&xs.indexOf(x)===i);
const operationalDetails=(o:any)=>unique((Array.isArray(o?.details)?o.details:[]).filter((x:any)=>typeof x==='string'&&x.trim()).flatMap((x:any)=>normalizeUserText(x).split(/\n+/).map(clean)).filter((x:string)=>!isSettingMeaning(x)&&!/同じ.+(?:数値入力|別欄).*(?:1回|入力)|重ねて入力/.test(x)));
const categoricalSubject=(label:any)=>clean(label).replace(/の設定別(?:選択率|振り分け)$/,'').replace(/設定別(?:選択率|振り分け)$/,'');
export function buildObservationDescription(o:any,model:any,residualPolicy:any){
 const labels=deriveObservationInputLabels(o),lines:string[]=[];
 if(model==='CATEGORICAL'){
  const subject=categoricalSubject(o?.label),reason=clean(o?.liveObservation?.reason);
  if(reason&&!/^(確認するたび|該当する項目)/.test(reason))lines.push(reason+'。');
  else lines.push(subject+'を確認したときに、該当する項目を1回加算して記録します。');
  if(!['SOURCE_EXHAUSTIVE','SOURCE_EXPLICIT_OTHER'].includes(String(residualPolicy??'')))lines.push('確認した全体回数も記録し、その中で各項目がどれだけ出たかを比較します。');
 }else if(labels.trialLabel==='通常ゲーム数'){
  lines.push('通常時の'+countSubject(labels.successLabel)+'を記録します。通常ゲーム数を基準に、実戦中の出現割合を設定別に比較します。');
 }else if(labels.trialLabel==='総ゲーム数'){
  lines.push(countSubject(labels.successLabel)+'を記録します。総ゲーム数を基準に、実戦中の出現割合を設定別に比較します。');
 }else{
  lines.push(categoricalSubject(o?.label)+'について記録します。');
  lines.push('対象となる機会のうち、実際に該当した割合を設定別に比較します。');
 }
 const notes=unique([...userFacingEligibilityNotes(o),...operationalDetails(o).map((x:string)=>x.endsWith('。')?x:x+'。')]).slice(0,2);
 for(const note of notes)lines.push('・注意：'+note);
 return lines.join('\n');
}
export function derivePlayInfoRequirement(trialUniverses:Iterable<string>){
 const values=[...trialUniverses].map(String);const normalUniverses=new Set(['NORMAL_GAME_TRIAL','BONUS_ELIGIBLE_GAME_TRIAL']);const excludedTotalUniverses=new Set(['LOTIS_NON_CHAIN_GAME_TRIAL','NON_CHAIN_BONUS_INITIAL_GAME_TRIAL']);
 const needsNormal=values.some(x=>normalUniverses.has(x));const needsExcludedGames=values.some(x=>excludedTotalUniverses.has(x));const needsTotal=needsExcludedGames||values.includes('TOTAL_GAME_TRIAL');
 const mode=needsTotal&&needsNormal?'TOTAL_AND_NORMAL':needsTotal?'TOTAL_ONLY':needsNormal?'NORMAL_ONLY':'NONE';
 return {mode,needsTotal,needsNormal,needsExcludedGames};
}
function evidenceDescription(x:any){
 const categories=Array.isArray(x?.semanticCategories)?x.semanticCategories:[];
 const categoryText=new Set(categories.flatMap((c:any)=>[clean(c?.label),clean([c?.label,c?.meaning].filter(Boolean).join('：'))]));
 const details=(Array.isArray(x?.details)?x.details:[]).filter((v:any)=>typeof v==='string'&&v.trim()).flatMap((v:any)=>normalizeUserText(v).split(/\n+/).map(clean)).filter((v:string)=>!categoryText.has(v)&&!/同じ.+(?:数値入力|別欄).*(?:1回|入力)|重ねて入力/.test(v));
 const types=[...new Set(categories.map((c:any)=>c?.semanticType??x?.semanticType).filter(Boolean))];
 const lines=[clean(x?.label)+'を確認したときに、該当する項目を1回加算して記録します。'];
 for(const d of unique(details).slice(0,2))lines.push('・注意：'+d);
 if(types.includes('EXACT_CONSTRAINT'))lines.push('・反映：設定確定・設定否定の条件は、設定候補の絞り込みに自動反映します');
 if(types.some((t:any)=>t==='PROBABILITY_UNKNOWN'||t==='DISPLAY_ONLY'))lines.push('・反映：設定別出現率が未確認の項目は記録のみです。出現率確認後は設定推測へ反映できる可能性があります');
 return lines.join('\n');
}
export function buildCanonicalUi(candidate:any,observation:any,evaluation:any,candidateArtifact:any,observationArtifact:any,evaluationArtifact:any){
 if(candidate.machineId!==observation.machineId||candidate.machineId!==evaluation.machineId)throw new Error('CANONICAL_UI_BUILD_IDENTITY');
 const cBy=new Map((candidate.candidates??[]).map((x:any)=>[x.findingId,x]));const eBy=new Map((evaluation.evaluations??[]).map((x:any)=>[x.findingId,x]));
 const numericSections=(observation.observations??[]).filter((o:any)=>o.observationStatus==='READY').map((o:any)=>{
  const c:any=cBy.get(o.findingId),e:any=eBy.get(o.findingId);if(!c||!e||c.runtimeInferenceAllowed!==true||o.runtimeInferenceAllowed!==true)throw new Error('CANONICAL_UI_READY_SOURCE:'+o.findingId);
  const labels=deriveObservationInputLabels(o);let inputs:any[]=[];
  if(o.collectionContract?.type==='SUCCESS_TRIAL_COUNTS'){
   inputs=[{id:o.findingId+'.'+o.collectionContract.trialField,label:labels.trialLabel,role:'trial',mode:'NUMBER',directNumeric:true,quickAdd:trialQuickAdd(o.trialUniverse),partialInputAllowed:true,emptyMeansUnobserved:true},{id:o.findingId+'.'+o.collectionContract.successField,label:labels.successLabel,role:'success',mode:'NUMBER',directNumeric:true,quickAdd:[1],partialInputAllowed:true,emptyMeansUnobserved:true,missingSubItemTreatment:'ZERO_WHEN_PARENT_OBSERVED'}];
  }else if(o.collectionContract?.type==='CATEGORY_COUNTS'){
   const categoryNames=categoryLabels(c.settingDistribution);if(e.categoryModel?.residualPolicy==='SOURCE_EXPLICIT_OTHER'&&!categoryNames.includes('その他'))categoryNames.push('その他');if(categoryNames.length<2)throw new Error('CANONICAL_UI_CATEGORIES_UNRESOLVED:'+o.findingId);
   inputs=[{id:o.findingId+'.'+o.collectionContract.trialField,label:labels.trialLabel,role:'trial',mode:'NUMBER',directNumeric:true,quickAdd:trialQuickAdd(o.trialUniverse),partialInputAllowed:true,emptyMeansUnobserved:true},...categoryNames.map((label:string,i:number)=>({id:o.findingId+'.'+o.collectionContract.countsField+'.'+safeKey(label,i),label,role:'categoryCount',mode:'NUMBER',directNumeric:true,quickAdd:[1],partialInputAllowed:true,emptyMeansUnobserved:true,missingSubItemTreatment:'ZERO_WHEN_PARENT_OBSERVED'}))];
  }else throw new Error('CANONICAL_UI_COLLECTION_UNSUPPORTED:'+o.findingId);
  return {id:'OBS_'+o.findingId,sourceFindingId:o.findingId,title:o.label,kind:'NUMERIC_OBSERVATION',model:o.model,trialUniverse:o.trialUniverse,description:buildObservationDescription(o,o.model,e.categoryModel?.residualPolicy),collapsible:true,defaultExpanded:false,descriptionPresentation:{collapsible:true,label:'説明',defaultExpanded:false},score:scoreView(e),perEligibleTrialPower:{label:'1回の判別力',value:c.runtimePolicyBinding.value,metric:'PER_ELIGIBLE_TRIAL_POWER',thresholdSource:'RUNTIME_POLICY'},inputs};
 });
 const trialUniverses=new Set(numericSections.map((x:any)=>String(x.trialUniverse)));const playInfoRequirement=derivePlayInfoRequirement(trialUniverses);const playInfoMode=playInfoRequirement.mode;const needsExcludedGames=playInfoRequirement.needsExcludedGames;
 const evidenceSections=(observation.evidence??[]).map((x:any)=>{
  const details=Array.isArray(x.details)?x.details.filter((v:any)=>typeof v==='string'&&v.trim()):[];
  return {id:'EVI_'+x.findingId,sourceFindingId:x.findingId,title:x.label,kind:'EVIDENCE',trialUniverse:x.trialUniverse,collapsible:true,defaultExpanded:false,description:evidenceDescription(x),descriptionPresentation:{collapsible:true,label:'説明',defaultExpanded:false},runtimePolicyControlled:false,evidenceItems:[{findingId:x.findingId,label:x.label,sourceIds:x.sourceIds??[],trialUniverse:x.trialUniverse,denominatorSemantics:x.denominatorSemantics,details,semanticType:x.semanticType,semanticCategories:x.semanticCategories,settingDistribution:x.settingDistribution,runtimePolicyControlled:false,status:x.status,interaction:'REFERENCE_ONLY'}]};
 });
 const dependencyGroupByFindingId=new Map<string,any>();for(const group of candidate.dependencyGroups??[])for(const findingId of group.members??[])dependencyGroupByFindingId.set(findingId,group);
 const heldObservations=(observation.observations??[]).filter((o:any)=>o.observationStatus==='HELD_NO_JOINT_MODEL').map((o:any)=>{const group=dependencyGroupByFindingId.get(o.findingId);return {findingId:o.findingId,label:o.label,status:o.observationStatus,materialized:false,reason:group?.reason,reevaluationCondition:group?.reevaluationCondition}});
 return {schemaVersion:'canonical-ui-v1',manifestVersion:'8.5',batchId:candidate.batchId,machineId:candidate.machineId,machineName:candidate.machineName,sourceArtifacts:{candidateContract:candidateArtifact,observationEvidence:observationArtifact,evaluation:evaluationArtifact},machineInferenceSummary:{title:'この機種の設定推測について',position:'TOP_ONLY',highLowDiscrimination:observation.highLowDiscrimination},playInfo:{visible:true,collapsible:false,mode:playInfoMode,sessionFields:[{id:'date',label:'日付',mode:'DATE'},{id:'storeName',label:'店舗名',mode:'TEXT'},{id:'machineNumber',label:'台番号',mode:'TEXT'}],startFields:[...(playInfoRequirement.needsTotal?[{id:'startTotalGames',label:'着席時 総ゲーム数',mode:'NUMBER',directNumeric:true}]:[]),...(playInfoRequirement.needsNormal?[{id:'startNormalGames',label:'着席時 通常ゲーム数',mode:'NUMBER',directNumeric:true}]:[])],currentFields:[...(playInfoRequirement.needsTotal?[{id:'currentTotalGames',label:'現在 総ゲーム数',mode:'NUMBER',directNumeric:true}]:[]),...(playInfoRequirement.needsNormal?[{id:'currentNormalGames',label:'現在 通常ゲーム数',mode:'NUMBER',directNumeric:true}]:[])],difference:{autoCalculate:true},useDifference:{label:'着席時との差分を使用',defaultWhenStartNormalGamesPresent:true},...(needsExcludedGames?{exclusionGames:{visible:true,label:'除外ゲーム数（連荘中のゲーム数）'}}:{})},accordion:{enabled:true,singleOpen:true},numericSections,evidenceSections,heldObservations,layoutRules:{hideEmptySections:true,twoColumnWhen:{minimumNumericSections:2,minimumEvidenceSections:2},quickAddPolicy:[1,50],directNumericRequired:true},inputRules:{partialInputAllowed:true,missingSubItemTreatment:'ZERO_WHEN_PARENT_OBSERVED'},importanceVocabulary:[...IMPORTANCE_LABELS]};
}
