#!/usr/bin/env node
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const upsertBy=(arr,key,obj)=>{const i=arr.findIndex(x=>x[key]===obj[key]);if(i>=0)arr[i]=obj;else arr.push(obj);};

// Triple Crown
{
 const d='research/LB_TRIPLE_CROWN_SEVEN_FG';
 const op=`${d}/machine-observation-data.json`,up=`${d}/ui-design-data.json`;
 const o=read(op),u=read(up);
 const small=o.observations.find(x=>x.observationId==='OBS_SMALL_ROLES_SHARED');
 small.label='通常時の小役構成（チェリー・プラム）';
 small.categories=['チェリー回数','プラム回数','通常ゲーム'];
 small.timing=['自己実戦中、通常ゲームを分母としてチェリー・プラム成立時に各回数を更新'];
 small.excludedConditions=['着席前累積値を自己実戦値へ混ぜない','未観測を観測済み0として扱わない','チェリーとプラムを別々の独立Binomialとして重複評価しない'];
 small.notes='Selection FEAT_SMALL_ROLE_COMPOSITION の自然観測。通常Gを共通分母に、チェリー・プラム・OTHERを1つのMultinomialとして評価する。OTHERは通常G-チェリー-プラムで導出する。';
 const bb=o.observations.find(x=>x.observationId==='OBS_BB_INITIAL');
 const rb=o.observations.find(x=>x.observationId==='OBS_RB_INITIAL');
 bb.label='通常時のボーナス構成（BB）'; bb.notes='FEAT_BONUS_OUTCOMEの構成要素。BB/RB/NO_BONUSを同一通常GのMultinomialとして評価する。';
 rb.label='通常時のボーナス構成（RB）'; rb.notes='FEAT_BONUS_OUTCOMEの構成要素。BB/RB/NO_BONUSを同一通常GのMultinomialとして評価する。';
 const rbgm=o.observations.find(x=>x.observationId==='OBS_RB_BGM');
 rbgm.categories=['安里屋ユンタ選択回数','BB後100G以内の連チャン条件を満たすRB入賞回数'];
 rbgm.timing=['BB後100G以内の連チャン条件を満たすRB入賞時に1回ずつ観測する。途中にRBを挟んでも条件継続中は対象'];
 rbgm.excludedConditions=['分母条件: BB後100G以内の連チャン条件を満たすRB入賞回数','対象条件外のRBを分母へ混ぜない','着席前累積値を自己実戦値へ混ぜない','未観測を観測済み0として扱わない'];
 rbgm.notes='Selection FEAT_RB_BGM の観測契約。安里屋ユンタ回数 / BB後100G以内連チャン条件を満たすRB入賞回数。';

 upsertBy(o.observations,'observationId',{
   observationId:'OBS_BONUS_TRIGGER_COMPOSITION',
   label:'通常時ボーナスの当選契機',
   observationType:'MANUAL_COUNT',
   sourceType:'MANUAL_COUNT',
   sourceAvailability:'AVAILABLE',
   acquisitionSource:'実戦中の成立役・ボーナス種別を目視で記録',
   categories:['単独BB','単独RB','リプレイ+BB','リプレイ+RB','チェリー+BB','チェリー+RB','プラム+BB','プラム+RB'],
   timing:['通常時にBBまたはRBが成立した時、その成立契機とボーナス種別を1回記録する'],
   includedConditions:['通常時に成立したBB/RB','総試行数は既存のBB回数+RB回数から内部算出する'],
   excludedConditions:['BT中のBB in BB等、通常時ボーナス契機表とは条件が異なる成立を混ぜない','成立契機を判別できなかったボーナスを任意カテゴリへ推定入力しない','着席前の契機不明ボーナスを自己実戦の契機内訳へ混ぜない'],
   resetConditions:['実戦セッション開始時'],
   previousPlayerUsable:false,
   selfPlayUsable:true,
   notes:'Selection FEAT_BONUS_TRIGGER_COMPOSITION の条件付き自然観測。母数は既存の通常時BB+RB総回数で、追加の総回数入力は不要。7カテゴリを入力し、残余のプラム+RBはBB+RB総回数から他7カテゴリを差し引いて内部算出する。'
 });
 o.featureMappings=(o.featureMappings??[]).filter(m=>!['FEAT_CHERRY','FEAT_PLUM','FEAT_BB_INITIAL','FEAT_RB_INITIAL','FEAT_SPECIFIC_BONUS_CHERRY_BB','FEAT_SPECIFIC_BONUS_CHERRY_RB','FEAT_SPECIFIC_BONUS_SINGLE_BB','FEAT_SPECIFIC_BONUS_SINGLE_RB','FEAT_SPECIFIC_BONUS_REPLAY_BB','FEAT_SPECIFIC_BONUS_REPLAY_RB','FEAT_SPECIFIC_BONUS_PLUM_BB','FEAT_SPECIFIC_BONUS_PLUM_RB'].includes(m.featureId));
 upsertBy(o.featureMappings,'featureId',{featureId:'FEAT_SMALL_ROLE_COMPOSITION',mappingType:'EXACT',observationIds:['OBS_SMALL_ROLES_SHARED'],collectionMethods:['MANUAL_COUNTER'],usableForInference:true,usableForDifficulty:false,notes:'チェリー・プラム・OTHERを同一通常Gの排他的Multinomialとして一度だけ評価する。'});
 upsertBy(o.featureMappings,'featureId',{featureId:'FEAT_BONUS_OUTCOME',mappingType:'COMBINABLE',observationIds:['OBS_BB_INITIAL','OBS_RB_INITIAL'],collectionMethods:['MANUAL_COUNTER'],usableForInference:true,usableForDifficulty:false,notes:'BB/RB/NO_BONUSを同一通常Gの排他的Multinomialとして一度だけ評価する。'});
 upsertBy(o.featureMappings,'featureId',{featureId:'FEAT_BONUS_TRIGGER_COMPOSITION',mappingType:'EXACT',observationIds:['OBS_BONUS_TRIGGER_COMPOSITION'],collectionMethods:['MANUAL_COUNTER','DERIVED'],usableForInference:true,usableForDifficulty:false,notes:'通常時BB+RB総回数を条件分母に、成立契機8カテゴリの構成比だけを追加評価する。プラム+RBは残余カテゴリとして内部導出。'});

 const normal=u.sections['通常時'];
 normal.inputIds=['INP_NORMAL_GAMES','INP_BB_INITIAL_COUNT','INP_RB_INITIAL_COUNT','INP_CHERRY_COUNT','INP_PLUM_COUNT'];
 normal.description='通常ゲーム数を入力し、その区間で成立したBB・RB・チェリー・プラムを記録します。BB/RBとチェリー/プラムはそれぞれ同じ通常ゲーム内の構成比として推測に使います。';
 normal.observationRefs=['OBS_BB_INITIAL','OBS_RB_INITIAL','OBS_SMALL_ROLES_SHARED'];
 u.inputContracts.INP_PLUM_COUNT={name:'プラム',mode:'COUNTER',gridSpan:6,directInput:false,compact:true,step:1,quickAdd:[1],quickInputEligible:true,inputVisible:true,emptyMeansUnobserved:true,observedZeroAllowed:true};
 const triggerSection='通常時ボーナスの当選契機';
 u.sections[triggerSection]={
   inputIds:['INP_TRIGGER_SINGLE_BB','INP_TRIGGER_SINGLE_RB','INP_TRIGGER_REPLAY_BB','INP_TRIGGER_REPLAY_RB','INP_TRIGGER_CHERRY_BB','INP_TRIGGER_CHERRY_RB','INP_TRIGGER_PLUM_BB'],
   description:'通常時に成立したBB・RBについて、成立契機ごとの回数を記録します。母数は上のBB回数+RB回数を自動で使うため、総回数の追加入力は不要です。プラム+RBは残り回数から内部計算します。',
   observationRole:'DIRECT_PLAY',observationRefs:['OBS_BONUS_TRIGGER_COMPOSITION'],acquisitionSources:['DIRECT_PLAY'],collapsible:true,defaultExpanded:false
 };
 if(!u.sectionOrder.includes(triggerSection)){
   const ni=u.sectionOrder.indexOf('通常時'); u.sectionOrder.splice(ni>=0?ni+1:0,0,triggerSection);
 }
 const names={INP_TRIGGER_SINGLE_BB:'単独BB',INP_TRIGGER_SINGLE_RB:'単独RB',INP_TRIGGER_REPLAY_BB:'リプレイ+BB',INP_TRIGGER_REPLAY_RB:'リプレイ+RB',INP_TRIGGER_CHERRY_BB:'チェリー+BB',INP_TRIGGER_CHERRY_RB:'チェリー+RB',INP_TRIGGER_PLUM_BB:'プラム+BB'};
 for(const [id,name] of Object.entries(names)) u.inputContracts[id]={name,mode:'COUNTER',gridSpan:6,directInput:false,compact:true,step:1,quickAdd:[1],quickInputEligible:true,inputVisible:true,emptyMeansUnobserved:true,observedZeroAllowed:true};
 u.auditNotes=(u.auditNotes??[]).filter(x=>!/プラムはEXCLUDE|チェリーを通常G小役の代表/.test(x));
 u.auditNotes.push('チェリーとプラムは単独Binomialではなく、通常Gを分母とする1つの小役構成Multinomialで評価する。');
 u.auditNotes.push('BBとRBは単独Binomialではなく、通常Gを分母とする1つのボーナス構成Multinomialで評価する。');
 u.auditNotes.push('通常時ボーナスの契機内訳はBB+RB総回数を条件分母にし、総ボーナス発生率と重複しない条件付きMultinomialで評価する。');
 write(op,o);write(up,u);
}

// Umineko2
{
 const d='research/L_UMINEKO_2_A1';
 const op=`${d}/machine-observation-data.json`,up=`${d}/ui-design-data.json`;
 const o=read(op),u=read(up);
 const miss=o.observations.find(x=>x.observationId==='OBS_ART_MISS' || x.observationId==='OBS_ART_ROLE_COMPOSITION');
 const bell=o.observations.find(x=>x.observationId==='OBS_ART_COMMON_BELL');
 miss.observationId='OBS_ART_ROLE_COMPOSITION';
 miss.label='ART中の役構成（ハズレ・共通ベル）';
 miss.categories=['ART中ハズレ回数','ART中共通ベル回数','ARTゲーム'];
 miss.timing=['自己実戦中、ARTゲームを分母としてハズレ・共通ベル成立時に各回数を更新'];
 miss.excludedConditions=['ART外のゲームを分母へ混ぜない','着席前累積値を自己実戦値へ混ぜない','未観測を観測済み0として扱わない','ハズレと共通ベルを別々の独立Binomialとして重複評価しない'];
 miss.notes='Selection FEAT_ART_ROLE_COMPOSITION の自然観測。ハズレ・共通ベル・OTHERをARTゲーム上の1つのMultinomialとして評価する。OTHERはARTゲーム-ハズレ-共通ベルで導出する。';
 if(bell) o.observations=o.observations.filter(x=>x!==bell);
 o.featureMappings=(o.featureMappings??[]).filter(m=>!['FEAT_ART_MISS','FEAT_ART_COMMON_BELL'].includes(m.featureId));
 upsertBy(o.featureMappings,'featureId',{featureId:'FEAT_ART_ROLE_COMPOSITION',mappingType:'EXACT',observationIds:['OBS_ART_ROLE_COMPOSITION'],collectionMethods:['MANUAL_COUNTER'],usableForInference:true,usableForDifficulty:false,notes:'ARTハズレ・共通ベル・OTHERを同一ARTゲームの排他的Multinomialとして一度だけ評価する。'});
 const oldA='ART中ハズレ',oldB='ART中の共通ベル',newName='ART中の役構成';
 const base=u.sections[oldA]??u.sections[newName]??{};
 u.sections[newName]={...base,inputIds:['INP_ART_MISS_TRIALS','INP_ART_MISS_COUNT','INP_ART_COMMON_BELL_COUNT'],description:'ARTゲーム数を入力し、そのうちハズレと共通ベルが成立した回数を記録します。3つの値を1つの役構成として推測に使います。',observationRole:'DIRECT_PLAY',observationRefs:['OBS_ART_ROLE_COMPOSITION'],acquisitionSources:['DIRECT_PLAY'],collapsible:false,defaultExpanded:true};
 delete u.sections[oldA]; delete u.sections[oldB];
 u.sectionOrder=u.sectionOrder.filter(x=>x!==oldA&&x!==oldB&&x!==newName);
 const regIndex=Math.max(0,u.sectionOrder.indexOf('REG中')+1); u.sectionOrder.splice(regIndex,0,newName);
 if(u.inputContracts.INP_ART_COMMON_BELL_COUNT){u.inputContracts.INP_ART_COMMON_BELL_COUNT.name='共通ベル';u.inputContracts.INP_ART_COMMON_BELL_COUNT.gridSpan=6;}
 if(u.inputContracts.INP_ART_MISS_COUNT){u.inputContracts.INP_ART_MISS_COUNT.name='ハズレ';u.inputContracts.INP_ART_MISS_COUNT.gridSpan=6;}
 if(u.inputContracts.INP_ART_MISS_TRIALS){u.inputContracts.INP_ART_MISS_TRIALS.name='ARTゲーム';u.inputContracts.INP_ART_MISS_TRIALS.gridSpan=12;}
 u.auditNotes=(u.auditNotes??[]).filter(x=>!/ART中ハズレ|ART中共通ベル/.test(x));
 u.auditNotes.push('ART中ハズレと共通ベルは、ARTゲームを分母とする1つの役構成Multinomialで評価する。');
 write(op,o);write(up,u);
}
console.log('Applied v6.14 Observation/UI cascade repairs including Triple bonus trigger composition.');
