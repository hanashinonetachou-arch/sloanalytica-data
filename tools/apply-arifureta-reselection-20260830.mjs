import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const dir=path.join(root,'research','L_ARIFURETA_JA');
const read=(name)=>JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
const write=(name,v)=>fs.writeFileSync(path.join(dir,name),JSON.stringify(v,null,2)+'\n');
const upsertBy=(arr,key,item)=>[...(arr??[]).filter(x=>x?.[key]!==item[key]),item];
const dropBy=(arr,key,ids)=> (arr??[]).filter(x=>!ids.has(x?.[key]));
const norm=(a,b)=>({GUN:a/(a+b),TIO_SHIA_YUE:b/(a+b)});

const research=read('research-data.json');
const sel=read('selection-data.json');
const obs=read('machine-observation-data.json');
const ui=read('ui-design-data.json');

const srcScenario={sourceId:'SRC_NANA_MYU_SCENARIO',publisher:'なな徹',title:'ミュウボーナス中のキャラ紹介による設定示唆',url:'https://nana-press.com/kaiseki/machine/885/27328/',checkedAt:'2026-08-30',sourceType:'major_analysis'};
const srcAtEnd={sourceId:'SRC_NANA_AT_END',publisher:'なな徹',title:'AT終了画面による設定示唆',url:'https://nana-press.com/kaiseki/machine/885/27327/',checkedAt:'2026-08-30',sourceType:'major_analysis'};
research.sources=upsertBy(upsertBy(research.sources,'sourceId',srcScenario),'sourceId',srcAtEnd);

const myuCats=['HAJIME','YUE','HERO','DEMON','NOINT','DEMIHUMAN','HAJIME_YUE','YUE_HAJIME'];
const myuRows={
 SET_1:[36,43,20,1,0,0,0,0],SET_2:[39,31,20,1,1,5,1,2],SET_3:[31,37,22,2,0,5,2,1],
 SET_4:[36,29,22,2,3,5,1,2],SET_5:[29,35,25,3,0,5,2,1],SET_6:[33,27,25,3,3,5,2,2]
};
const rfMyu={researchFeatureId:'RF_MYU_SCENARIO_DISTRIBUTION',name:'ミュウボーナス中キャラ紹介シナリオ振り分け',factStatus:'verified',candidateModel:'multinomial',trialUnit:'通常キャラ紹介シナリオ1回',numeratorDefinition:'各紹介シナリオ出現回数',denominatorDefinition:'通常のキャラ紹介シナリオを最後まで判別できた回数（特殊キャラ・ミニキャラムービー等の置換時は除外）',settingValues:{},categories:myuCats,distributionMode:'complete',settingDistributions:Object.fromEntries(Object.entries(myuRows).map(([s,row])=>[s,Object.fromEntries(myuCats.map((c,i)=>[c,row[i]/100]))])),sourceRefs:['SRC_NANA_MYU_SCENARIO'],notes:'3キャラの組み合わせ・登場順で8シナリオを排他的に判別する。金文字の特殊キャラは設定4+/5+/6のEvidenceとして別処理し、本multinomialには含めない。'};

const endRows={
 RF_AT_END_NON_EVIDENCE_U1999:{SET_1:[85,15],SET_2:[82,18],SET_3:[80,20],SET_4:[77,22],SET_5:[74,25],SET_6:[74,25]},
 RF_AT_END_NON_EVIDENCE_2000_5999:{SET_1:[85,15],SET_2:[83,17],SET_3:[80,20],SET_4:[74,23],SET_5:[70,25],SET_6:[70,25]},
 RF_AT_END_NON_EVIDENCE_6000_PLUS:{SET_1:[85,15],SET_2:[83,17],SET_3:[80,20],SET_4:[71,23],SET_5:[66,25],SET_6:[63,25]}
};
const endMeta={
 RF_AT_END_NON_EVIDENCE_U1999:['大迷宮RUSH終了画面 非Evidence構成（1999G以下）','総ゲーム数1999G以下'],
 RF_AT_END_NON_EVIDENCE_2000_5999:['大迷宮RUSH終了画面 非Evidence構成（2000～5999G）','総ゲーム数2000～5999G'],
 RF_AT_END_NON_EVIDENCE_6000_PLUS:['大迷宮RUSH終了画面 非Evidence構成（6000G以上）','総ゲーム数6000G以上']
};
const endFeatures=Object.entries(endRows).map(([id,rows])=>({researchFeatureId:id,name:endMeta[id][0],factStatus:'verified',candidateModel:'multinomial',trialUnit:'非Evidenceの大迷宮RUSH終了画面1回',observationScope:endMeta[id][1],numeratorDefinition:'銃またはティオ・シア・ユエの出現回数',denominatorDefinition:'当該総G帯で出現した非Evidence終了画面（銃/ティオ・シア・ユエ）の合計回数。ハジメ4+・ユエ5+・レミア/ミュウ/ユエ6は除外',settingValues:{},categories:['GUN','TIO_SHIA_YUE'],distributionMode:'complete',settingDistributions:Object.fromEntries(Object.entries(rows).map(([s,[a,b]])=>[s,norm(a,b)])),sourceRefs:['SRC_NANA_AT_END'],notes:'公開表の銃とティオ・シア・ユエの比率を、Evidence画面が出なかった条件で再正規化した条件付き分布。確定画面の出現率は数値尤度に使用せずEvidence Engineのみで処理する。'}));
const newIds=new Set([rfMyu.researchFeatureId,...endFeatures.map(f=>f.researchFeatureId)]);
research.features=[...dropBy(research.features,'researchFeatureId',newIds),rfMyu,...endFeatures];
research.evidenceCandidates=(research.evidenceCandidates??[]).filter(e=>e.researchEvidenceId!=='RE_MYU_SCENARIO');
research.discoveryInventory=(research.discoveryInventory??[]).map(x=>x.id==='DC_MYU_SCENARIO'?{...x,mappedTo:'RF_MYU_SCENARIO_DISTRIBUTION'}:x).filter(x=>!['DC_AT_END_NUM_U1999','DC_AT_END_NUM_2000_5999','DC_AT_END_NUM_6000_PLUS'].includes(x.id));
research.discoveryInventory.push(
 {id:'DC_AT_END_NUM_U1999',name:'AT終了画面 非Evidence構成 1999G以下',mappedTo:'RF_AT_END_NON_EVIDENCE_U1999'},
 {id:'DC_AT_END_NUM_2000_5999',name:'AT終了画面 非Evidence構成 2000～5999G',mappedTo:'RF_AT_END_NON_EVIDENCE_2000_5999'},
 {id:'DC_AT_END_NUM_6000_PLUS',name:'AT終了画面 非Evidence構成 6000G以上',mappedTo:'RF_AT_END_NON_EVIDENCE_6000_PLUS'}
);
for(const x of research.researchCompleteness?.numericSurfaces??[]){if(x.surface==='character_distribution'){x.status='CHECKED';x.sourceRefs=[...new Set([...(x.sourceRefs??[]),'SRC_NANA_MYU_SCENARIO'])];x.notes='カテゴリ・キャラクター分布系を再監査し、ミュウボーナス中8シナリオの設定別完全分布をResearch Featureとして保持した。';}}
for(const x of research.researchCompleteness?.evidenceSurfaces??[]){if(x.surface==='end_screen'){x.sourceRefs=[...new Set([...(x.sourceRefs??[]),'SRC_NANA_AT_END'])];x.notes='終了画面を再監査し、大迷宮RUSH終了画面の確定系はEvidence、銃/ティオ・シア・ユエは総G帯別の非Evidence条件付き数値Featureとして分離した。';}}
write('research-data.json',research);

sel.uiCategoryLabels={...(sel.uiCategoryLabels??{}),MYU_SCENARIO:'ミュウボーナス キャラ紹介',AT_END:'大迷宮RUSH終了画面'};
sel.uiCategoryDescriptions={...(sel.uiCategoryDescriptions??{}),MYU_SCENARIO:'通常キャラ紹介の3人セットを1シナリオとして記録します。特殊キャラ（金文字）はここに数えず設定確定・否定へ登録します。',AT_END:'筐体メニューの総ゲーム数に対応するタブを選択します。ハジメ・ユエ・レミア/ミュウ/ユエの確定画面はここに数えず設定確定・否定へ登録します。'};
const generatedIds=new Set();
const newInputs=[];
let order=30;
const myuLabels={HAJIME:'ハジメ',YUE:'ユエ',HERO:'勇者',DEMON:'魔人',NOINT:'ノイント',DEMIHUMAN:'亜人',HAJIME_YUE:'ハジメ＆ユエ',YUE_HAJIME:'ユエ＆ハジメ'};
for(const c of myuCats){const id=`INP_MYU_SCENARIO_${c}`;generatedIds.add(id);newInputs.push({id,name:myuLabels[c],type:'counter',category:'MYU_SCENARIO',unit:'回',displayOrder:order++,inferenceRole:'INCLUDE_SUPPORT',defaultValue:null,uiGridSpan:6,uiDirectInput:false,uiCompactCounter:true,uiQuickAdd:1});}
const bands=[['U1999','～1999G'],['B2000_5999','2000～5999G'],['B6000_PLUS','6000G～']];
const tabs=[];
for(const [bid,label] of bands){const ids=[];for(const [suffix,name] of [['GUN','銃'],['TIO_SHIA_YUE','ティオ・シア・ユエ']]){const id=`INP_AT_END_${bid}_${suffix}`;ids.push(id);generatedIds.add(id);newInputs.push({id,name,type:'counter',category:'AT_END',unit:'回',displayOrder:order++,inferenceRole:'INCLUDE_SUPPORT',defaultValue:null,uiGridSpan:6,uiDirectInput:false,uiCompactCounter:true,uiQuickAdd:1});}tabs.push({id:bid,label,inputIds:ids});}
sel.inputs=[...(sel.inputs??[]).filter(i=>!generatedIds.has(i.id) && !i.id.startsWith('INP_MYU_SCENARIO_') && !i.id.startsWith('INP_AT_END_')), ...newInputs];
sel.uiSectionOptions={...(sel.uiSectionOptions??{}),AT_END:{tabs}};
const featureIdsToReplace=new Set(['FEAT_MYU_SCENARIO_DISTRIBUTION','FEAT_AT_END_NON_EVIDENCE_U1999','FEAT_AT_END_NON_EVIDENCE_2000_5999','FEAT_AT_END_NON_EVIDENCE_6000_PLUS']);
sel.features=(sel.features??[]).filter(f=>!featureIdsToReplace.has(f.featureId));
sel.features.push(
 {researchFeatureId:'RF_MYU_SCENARIO_DISTRIBUTION',featureId:'FEAT_MYU_SCENARIO_DISTRIBUTION',adoptionCategory:'INCLUDE_SUPPORT',numeratorInputId:'INP_MYU_SCENARIO_HAJIME',categoryInputIds:myuCats.slice(1).map(c=>`INP_MYU_SCENARIO_${c}`),inputTransform:'sum_inputs_to_trials',weight:1,difficultyParticipation:'EXCLUDE',userReason:'8シナリオを排他的に直接観測でき、全設定の公開振り分けが揃っているため補助採用します。特殊キャラはEvidenceとして別処理します。'},
 {researchFeatureId:'RF_AT_END_NON_EVIDENCE_U1999',featureId:'FEAT_AT_END_NON_EVIDENCE_U1999',adoptionCategory:'INCLUDE_SUPPORT',numeratorInputId:'INP_AT_END_U1999_GUN',categoryInputIds:['INP_AT_END_U1999_TIO_SHIA_YUE'],inputTransform:'sum_inputs_to_trials',weight:1,difficultyParticipation:'EXCLUDE',userReason:'1999G以下の非Evidence終了画面2種だけを条件付きで比較し、確定画面の不明な1%未満を数値推定せず利用できるため補助採用します。'},
 {researchFeatureId:'RF_AT_END_NON_EVIDENCE_2000_5999',featureId:'FEAT_AT_END_NON_EVIDENCE_2000_5999',adoptionCategory:'INCLUDE_SUPPORT',numeratorInputId:'INP_AT_END_B2000_5999_GUN',categoryInputIds:['INP_AT_END_B2000_5999_TIO_SHIA_YUE'],inputTransform:'sum_inputs_to_trials',weight:1,difficultyParticipation:'EXCLUDE',userReason:'2000～5999Gの非Evidence終了画面2種を公開比率から条件付き評価し、確定画面はEvidenceのみで処理するため補助採用します。'},
 {researchFeatureId:'RF_AT_END_NON_EVIDENCE_6000_PLUS',featureId:'FEAT_AT_END_NON_EVIDENCE_6000_PLUS',adoptionCategory:'INCLUDE_SUPPORT',numeratorInputId:'INP_AT_END_B6000_PLUS_GUN',categoryInputIds:['INP_AT_END_B6000_PLUS_TIO_SHIA_YUE'],inputTransform:'sum_inputs_to_trials',weight:1,difficultyParticipation:'EXCLUDE',userReason:'6000G以上の非Evidence終了画面2種を公開比率から条件付き評価し、確定画面はEvidenceのみで処理するため補助採用します。'}
);
sel.evidenceDecisions=(sel.evidenceDecisions??[]).filter(x=>x.researchEvidenceId!=='RE_MYU_SCENARIO');
if(sel.evidenceReview?.exclusions) sel.evidenceReview.exclusions=sel.evidenceReview.exclusions.filter(x=>x.researchEvidenceId!=='RE_MYU_SCENARIO');
write('selection-data.json',sel);

const obsSources=[
 {sourceId:'OBS_SRC_NANA_MYU_SCENARIO',publisher:'なな徹',title:'ミュウボーナス中のキャラ紹介による設定示唆',url:'https://nana-press.com/kaiseki/machine/885/27328/',sourceType:'major_analysis'},
 {sourceId:'OBS_SRC_NANA_AT_END',publisher:'なな徹',title:'AT終了画面による設定示唆',url:'https://nana-press.com/kaiseki/machine/885/27327/',sourceType:'major_analysis'}
];
for(const s of obsSources) obs.sources=upsertBy(obs.sources,'sourceId',s);
const newObsIds=new Set(['OBS_MYU_SCENARIO','OBS_AT_END_NON_EVIDENCE_U1999','OBS_AT_END_NON_EVIDENCE_2000_5999','OBS_AT_END_NON_EVIDENCE_6000_PLUS']);
obs.observations=dropBy(obs.observations,'observationId',newObsIds);
obs.observations.push(
 {observationId:'OBS_MYU_SCENARIO',sourceType:'END_EVENT',observationMode:'VISUAL_EVENT',status:'FOUND',label:'ミュウボーナス中キャラ紹介シナリオ',categories:Object.values(myuLabels),timing:['通常のキャラ紹介3人を確認した時'],excludedConditions:['特殊キャラ（金文字）が出現した回','ミニキャラムービー等で通常3人シナリオを最後まで判別できない回'],sourceRefs:['OBS_SRC_NANA_MYU_SCENARIO'],notes:'通常8シナリオだけを排他的に1件として記録する。特殊キャラはEvidence側へ登録する。'},
 {observationId:'OBS_AT_END_NON_EVIDENCE_U1999',sourceType:'END_EVENT',observationMode:'VISUAL_EVENT',status:'FOUND',label:'大迷宮RUSH終了画面（1999G以下・非Evidence）',categories:['銃','ティオ・シア・ユエ'],timing:['AT終了時かつ筐体メニュー総Gが1999G以下'],excludedConditions:['ハジメ（設定4以上）','ユエ（設定5以上）','レミア・ミュウ・ユエ（設定6）'],sourceRefs:['OBS_SRC_NANA_AT_END'],notes:'確定画面は数値カウントせずEvidenceのみへ登録する。'},
 {observationId:'OBS_AT_END_NON_EVIDENCE_2000_5999',sourceType:'END_EVENT',observationMode:'VISUAL_EVENT',status:'FOUND',label:'大迷宮RUSH終了画面（2000～5999G・非Evidence）',categories:['銃','ティオ・シア・ユエ'],timing:['AT終了時かつ筐体メニュー総Gが2000～5999G'],excludedConditions:['ハジメ（設定4以上）','ユエ（設定5以上）','レミア・ミュウ・ユエ（設定6）'],sourceRefs:['OBS_SRC_NANA_AT_END'],notes:'確定画面は数値カウントせずEvidenceのみへ登録する。'},
 {observationId:'OBS_AT_END_NON_EVIDENCE_6000_PLUS',sourceType:'END_EVENT',observationMode:'VISUAL_EVENT',status:'FOUND',label:'大迷宮RUSH終了画面（6000G以上・非Evidence）',categories:['銃','ティオ・シア・ユエ'],timing:['AT終了時かつ筐体メニュー総Gが6000G以上'],excludedConditions:['ハジメ（設定4以上）','ユエ（設定5以上）','レミア・ミュウ・ユエ（設定6）'],sourceRefs:['OBS_SRC_NANA_AT_END'],notes:'確定画面は数値カウントせずEvidenceのみへ登録する。'}
);
obs.featureMappings=(obs.featureMappings??[]).filter(m=>!featureIdsToReplace.has(m.featureId));
for(const [featureId,observationId] of [['FEAT_MYU_SCENARIO_DISTRIBUTION','OBS_MYU_SCENARIO'],['FEAT_AT_END_NON_EVIDENCE_U1999','OBS_AT_END_NON_EVIDENCE_U1999'],['FEAT_AT_END_NON_EVIDENCE_2000_5999','OBS_AT_END_NON_EVIDENCE_2000_5999'],['FEAT_AT_END_NON_EVIDENCE_6000_PLUS','OBS_AT_END_NON_EVIDENCE_6000_PLUS']]) obs.featureMappings.push({featureId,mappingType:'EXACT',observationIds:[observationId],collectionMethods:['VISUAL_EVENT'],usableForInference:true,usableForDifficulty:false});
const evidenceObs=obs.observations.find(o=>o.observationId==='OBS_SETTING_EVIDENCE');
if(evidenceObs){evidenceObs.notes='Selectionで採用した確定条件のみ記録する。大迷宮RUSH終了のハジメ4+・ユエ5+・レミア/ミュウ/ユエ6、およびミュウ特殊キャラは数値カテゴリへ重複計上しない。';}
write('machine-observation-data.json',obs);

const myuInputIds=myuCats.map(c=>`INP_MYU_SCENARIO_${c}`);
const atInputIds=tabs.flatMap(t=>t.inputIds);
ui.status='PASS';
ui.sectionOrder=['初当り・成功率','ミュウボーナス キャラ紹介','大迷宮RUSH終了画面','設定確定・否定'];
ui.sections={
 '初当り・成功率':{inputIds:['INP_NORMAL_GAMES','INP_COMBINED_FIRST_HIT','INP_AWAKENING_TRIALS','INP_AWAKENING_SUCCESS'],observationRole:'DIRECT_PLAY'},
 'ミュウボーナス キャラ紹介':{inputIds:myuInputIds,observationRole:'END_EVENT'},
 '大迷宮RUSH終了画面':{inputIds:atInputIds,observationRole:'END_EVENT'},
 '設定確定・否定':{inputIds:[],evidenceIds:['EVIDENCE_01'],observationRole:'END_EVENT'}
};
for(const i of newInputs){ui.inputContracts[i.id]={name:i.name,mode:'COUNTER',gridSpan:6,directInput:false,compact:true,observationSemantics:'blank=unobserved; zero=observed-zero'};}
ui.unresolved=[];
ui.auditNotes=[
 '筐体メニューの総ゲーム数は2026-08-30実機確認済み。AT終了画面は総G帯タブで入力する。',
 '大迷宮RUSH終了画面の設定4+/5+/6確定画面はEvidenceのみで処理し、非Evidence数値分布へ重複計上しない。',
 '非Evidence画面の数値尤度は各総G帯で銃/ティオ・シア・ユエの公開比率を条件付き再正規化して使用するため、1999G以下の「1%未満」確定画面率を推定しない。',
 'ミュウボーナス中の通常8シナリオはmultinomial、特殊キャラはEvidenceとして分離する。',
 'Blank means unobserved and explicit 0 means observed zero; history and restore must preserve this distinction.'
];
write('ui-design-data.json',ui);
console.log('Applied Arifureta reselection: Miu scenario + total-G-band AT end non-Evidence features.');
