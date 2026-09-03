#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const IDS=['L_IZA_BANCHO_SB8','L_ZETTAI_SHOGEKI_PLATONIC_HEART_TK','L_WATASHI_NO_SHIAWASE_NA_KEKKON_PN','LB_TRIPLE_CROWN_SF4','LB_MATADOR_3_TT','L_TENSEI_SHITARA_KEN_DESHITA_GT','L_DARLING_IN_THE_FRANXX_SA','L_SAKI_CHOJO_KESSEN_YR','S_KONOSUBA_ZR','S_RAKUEN_TSUHO_FS'];
const locks={
 L_IZA_BANCHO_SB8:['直撃BIGをAT初当りと独立尤度として復活させない。','共通ベルAは手動またはダイトモの一貫した取得経路を使い、経路間で分子・分母を混在させない。'],
 L_ZETTAI_SHOGEKI_PLATONIC_HEART_TK:['状態依存抽選を通常総ゲーム数へ置換しない。'],
 L_WATASHI_NO_SHIAWASE_NA_KEKKON_PN:['eSLOT+の機種固有項目は実機確認前に自動入力へ昇格しない。'],
 LB_TRIPLE_CROWN_SF4:['ボーナス合算をBIG/REGと独立に掛け直さない。','ドラマチックスコアは着席時の参考履歴であり、試行母集団が未確認の数値を自己実戦分母へ混ぜない。'],
 LB_MATADOR_3_TT:['ボーナス合算をBB/RBと独立に掛け直さない。','BT中1枚役を通常ゲーム数分母へ置換しない。'],
 L_TENSEI_SHITARA_KEN_DESHITA_GT:['CZ/ボーナス初当りをAT初当りと独立に掛け直さない。','内部状態別抽選を通常総ゲーム数へ置換しない。'],
 L_DARLING_IN_THE_FRANXX_SA:['ボーナス高確初当りを総ボーナス初当りと独立に掛け直さない。','条件別フランクス高確/CZレベル抽選を総ゲーム数へ置換しない。'],
 L_SAKI_CHOJO_KESSEN_YR:['CZ初当りをAT初当りと独立に掛け直さない。','周期・内部状態の条件付き候補をデフォルト入力へ戻さない。'],
 S_KONOSUBA_ZR:['緊急クエスト・ランク別成功率・お風呂初期ptなど条件付き候補を総試行へ集約しない。'],
 S_RAKUEN_TSUHO_FS:['RD/AT初当りをBB/RD/AT初当り合成と独立に掛け直さない。','共通ベルの母数は同一マイスロ結果画面の「ゲーム数」。通常ゲーム数ではない。','My Counter Lv4未開放時は共通ベルを未観測として扱う。']
};
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n','utf8');
const role={DIRECT_PLAY:'DIRECT_PLAY',END_EVENT:'END_EVENT',MACHINE_MENU:'MACHINE_MENU',DATA_COUNTER:'DATA_COUNTER',LINKED_SERVICE:'LINKED_SERVICE',SEATED_STATE:'SEATED_STATE'};
const clean=s=>String(s??'').replace(/\s+(回数|試行数)$/,'').trim();
function unresolved(o){const out=[];for(const [k,v] of Object.entries(o.sourceCoverage??{}))if(v==='UNRESOLVED')out.push(`${k}: 実機確認待ち`);for(const x of o.fieldVerificationItems??[])if(x.status==='WAITING_FOR_MACHINE')out.push(x.question??x.verificationId);return [...new Set(out)]}
function obsFor(o,fid){return (o.observations??[]).filter(x=>(o.featureMappings??[]).some(m=>m.featureId===fid&&(m.observationIds??[]).includes(x.observationId)))}
function contract(input,groupSize){const counter=String(input.type).toLowerCase()==='counter';return {name:clean(input.name),mode:counter?'COUNTER':'NUMBER',gridSpan:counter&&groupSize>1?6:12,directInput:!counter,...(counter?{compact:groupSize>1,step:1,quickAdd:[1],quickInputEligible:true}:{quickAdd:[50],quickInputEligible:false}),inputVisible:true,emptyMeansUnobserved:true,observedZeroAllowed:true}}
for(const id of IDS){
 const dir=path.join(ROOT,'research',id),s=read(path.join(dir,'selection-data.json')),o=read(path.join(dir,'machine-observation-data.json'));
 const active=s.features.filter(x=>String(x.adoptionCategory).startsWith('INCLUDE_'));const sections={},sectionOrder=[],inputContracts={};
 for(const f of active){const inputs=s.inputs.filter(x=>x.category===`SEL_${f.featureId}`||[f.numeratorInputId,f.denominatorInputId].includes(x.id)).sort((a,b)=>(a.displayOrder??999)-(b.displayOrder??999));if(!inputs.length)throw new Error(`${id}: active feature ${f.featureId} has no inputs`);const observations=obsFor(o,f.featureId);let title=s.uiCategoryLabels?.[inputs[0].category]||clean(inputs[0].name),base=title,n=2;while(sections[title])title=`${base} ${n++}`;const found=observations.find(x=>['FOUND','VERIFIED_ON_MACHINE'].includes(x.status))||observations[0];const den=inputs.find(x=>x.id===f.denominatorInputId);sections[title]={inputIds:inputs.map(x=>x.id),description:`母数には「${clean(den?.name||'この項目の対象試行')}」を入力します。分子と分母は同じ観測経路・同じ設定区間の値を使います。`,...(found?.sourceType&&role[found.sourceType]?{observationRole:role[found.sourceType]}:{}),observationRefs:observations.map(x=>x.observationId),acquisitionSources:[...new Set(observations.map(x=>x.sourceType).filter(Boolean))],collapsible:false,defaultExpanded:true};sectionOrder.push(title);for(const x of inputs)inputContracts[x.id]=contract(x,inputs.length)}
 const debt=unresolved(o);const doc={schemaVersion:'ui-design-data-v1',machineId:id,status:debt.length?'PASS_WITH_UNRESOLVED':'PASS',generatedFrom:{selection:`research/${id}/selection-data.json`,observation:`research/${id}/machine-observation-data.json`},sectionOrder,sections,inputContracts,unresolved:debt,auditNotes:['不採用・REFERENCE要素専用の入力欄は生成しない。','設定示唆・確定情報はSelectionのEvidence UIから表示し、同じ物理観測を数値Featureと二重入力しない。','空欄は未観測、0は観測した結果0回として区別する。','着席時データは同一設定区間と確認できる場合だけ利用する。','連動サービスや筐体メニューの表示値はResearchの分母定義と一致する場合だけ推測へ使う。','クイック入力は通常入力と同じ値へ即時反映し、別カウンターを持たない。',...(locks[id]??[])]};write(path.join(dir,'ui-design-data.json'),doc);
}
console.log(`Gate D UI generated: ${IDS.length}/10`);
