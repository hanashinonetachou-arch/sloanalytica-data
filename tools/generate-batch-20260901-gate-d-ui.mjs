#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const IDS=[
'L_MAGIA_RECORD_RN','L_GODZILLA_NS','L_USHIO_TORA_HAKUMEN_VH','L_AMAZING_LIVE_PD','L_YOSHIMUNE_SC2',
'L_MAHJONG_MONOGATARI_S2','L_IDOLMASTER_MILLION_LIVE_HC','L_YOUJITSU_DE','L_MIDORIDON_VIVA_REVIVAL_FY','L_GUNDAM_SEED_G'
];
const semanticLocks={
L_MAGIA_RECORD_RN:['条件付きFallbackを総通常G率へ平坦化しない','UniMemo取得値もSelection定義の分母一致を必須とする'],
L_AMAZING_LIVE_PD:['Bonus初当りをoverlap family唯一のactive representativeとする','BIG/REG/BIG+REG合算を独立Likelihoodとして復活させない','SET_Lを保持しSET_3を生成しない'],
L_MAHJONG_MONOGATARI_S2:['解析定義AT直撃は前兆昇格除外','promotion-inclusive実戦AT直撃と統合しない','Bonus初当り/AT初当りtotal/Bonus-or-AT aggregateを独立尤度として復活させない'],
L_USHIO_TORA_HAKUMEN_VH:['reset-only populationを一般セッションへ混ぜない','confirmed reset opportunityがない場合reset-only Featureを通常入力として露出しない'],
L_YOUJITSU_DE:['DAXEL flash分母=CZ成功回数','通常周期CZ種別分母=通常周期CZ当選回数（レア役昇格除外）','red-button分母=対象連続演出成功回数','条件付き分母を総通常Gへ変換しない'],
L_MIDORIDON_VIVA_REVIVAL_FY:['state × role Fallbackは対象状態×対象成立役×抽選機会を維持','Bonus初当りとの二重評価抑制を保持'],
L_GUNDAM_SEED_G:['100G windowはresetまたはST終了後1 opportunity単位','per-game probabilityへ変換しない']
};
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>{fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n','utf8');};
const safeTitle=s=>String(s??'').replace(/\s+(回数|試行数|ゲーム数)$/,'').trim();
const roleMap={DIRECT_PLAY:'DIRECT_PLAY',END_EVENT:'END_EVENT',MACHINE_MENU:'MACHINE_MENU',DATA_COUNTER:'DATA_COUNTER',LINKED_SERVICE:'LINKED_SERVICE',SEATED_START:'SEATED_STATE'};
function unresolvedItems(obs){
 const out=[];
 for(const [k,v] of Object.entries(obs.sourceCoverage??{})) if(v==='UNRESOLVED') out.push(`${k}: UNRESOLVED`);
 for(const x of obs.fieldVerificationItems??[]) if(x.status==='WAITING_FOR_MACHINE') out.push(x.label??x.itemId??'実機確認待ち');
 return [...new Set(out)];
}
function obsForCategory(obs,category){
 const suffix=String(category).replace(/^SEL_RF_/,'');
 const direct=(obs.observations??[]).find(o=>o.observationId===`OBS_${suffix}`);
 return direct?[direct]:[];
}
function sectionTitle(category,inputs,observations){
 if(category==='EVIDENCE') return '設定示唆・確定情報';
 const names=inputs.map(x=>safeTitle(x.name)).filter(Boolean);
 if(names.length===1) return names[0];
 const common=names.reduce((a,b)=>{let i=0;while(i<a.length&&i<b.length&&a[i]===b[i])i++;return a.slice(0,i);});
 const cleaned=common.replace(/[・\s]+$/,'').trim();
 if(cleaned.length>=3) return cleaned;
 const label=observations[0]?.label;
 if(label&&label.length<=28) return label.replace(/・/g,' / ');
 return names[0]||'実戦データ';
}
function contract(input,groupSize){
 const type=String(input.type??'integer').toLowerCase();
 const counter=type==='counter';
 const name=String(input.name??input.id);
 const games=/GAME|ゲーム|GAMES|TRIAL/i.test(input.id+' '+name);
 return {
   name,
   mode:counter?'COUNTER':(type==='select'?'SELECT':'NUMBER'),
   gridSpan:counter&&groupSize>1&&name.length<=20?6:12,
   directInput:!counter,
   ...(counter?{compact:groupSize>1,step:1,quickAdd:[1],quickInputEligible:true}:{}),
   ...(games&&!counter?{quickAdd:[50],quickInputEligible:false}:{}),
   inputVisible:true,
   emptyMeansUnobserved:true,
   observedZeroAllowed:true
 };
}
for(const machineId of IDS){
 const dir=path.join(ROOT,'research',machineId);
 const selection=read(path.join(dir,'selection-data.json'));
 const obs=read(path.join(dir,'machine-observation-data.json'));
 const inputs=[...(selection.inputs??[])].sort((a,b)=>(a.displayOrder??999)-(b.displayOrder??999));
 const groups=new Map();
 for(const input of inputs){
   const category=input.category??'OTHER';
   if(!groups.has(category)) groups.set(category,[]);
   groups.get(category).push(input);
 }
 const sectionOrder=[]; const sections={}; const inputContracts={};
 for(const [category,group] of groups){
   const observations=obsForCategory(obs,category);
   let title=sectionTitle(category,group,observations);
   let base=title, n=2; while(sections[title]) title=`${base} ${n++}`;
   sectionOrder.push(title);
   const found=observations.find(o=>['FOUND','VERIFIED_ON_MACHINE'].includes(o.status));
   sections[title]={
     inputIds:group.map(x=>x.id),
     description:category==='EVIDENCE'
       ?'実戦中に確認できた設定示唆・設定確定情報だけを入力します。通常の確率Featureとは区別して扱います。'
       :(found?.timing?.[0]??'自己実戦中、Selectionで定義された対象試行・対象イベントに合わせて更新します。'),
     ...(found?.sourceType&&roleMap[found.sourceType]?{observationRole:roleMap[found.sourceType]}:{}),
     observationRefs:observations.map(o=>o.observationId),
     acquisitionSources:observations.map(o=>o.sourceType),
     collapsible:category==='EVIDENCE'||String(category).includes('SEATED'),
     defaultExpanded:category!=='EVIDENCE'&&!String(category).includes('SEATED')
   };
   for(const input of group) inputContracts[input.id]=contract(input,group.length);
 }
 const unresolved=unresolvedItems(obs);
 const doc={
   schemaVersion:'ui-design-data-v1',machineId,
   status:unresolved.length?'PASS_WITH_UNRESOLVED':'PASS',
   generatedFrom:{selection:`research/${machineId}/selection-data.json`,observation:`research/${machineId}/machine-observation-data.json`},
   sectionOrder,sections,inputContracts,unresolved,
   auditNotes:[
     'Selection EXCLUDE-only inputは生成しない。SelectionData inputsに存在する正式入力だけをUI化する。',
     '空欄=未観測、0=観測済み0回を維持する。',
     '前任者区間と自己実戦区間はObservationで明示された場合のみ接続し、UNRESOLVEDから架空の着席時入力を生成しない。',
     'linked-service / machine-menuは補助取得元であり必須入力にしない。',
     ...(semanticLocks[machineId]??[])
   ]
 };
 write(path.join(dir,'ui-design-data.json'),doc);
}
console.log(`Gate D UI Design generated: ${IDS.length}/10`);
