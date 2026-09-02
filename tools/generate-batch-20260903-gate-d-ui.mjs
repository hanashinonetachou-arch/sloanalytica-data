#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const IDS=['L_HANAGASA_NA','L_TOLOVE_DARKNESS_S8','LB_PREMIUM_UMAIBO_S1','LB_NEW_PULSAR_BT_C9','S_KABANERI_ZR','L_DMC5_ST_XA','LB_1000CHAN_ALPHA_L3','LB_JACKPOT_CY1','L_GUILTY_CROWN_2_XF','L_ULTRAMAN_KE'];
const semanticLocks={
  L_HANAGASA_NA:['BIG/REG/合算を初当りと独立に掛け直さない。'],
  L_TOLOVE_DARKNESS_S8:['ハーレムモード中の報酬3カテゴリは同一抽選の排他的分布として一体入力する。','250G/650G未公開設定差をUIへ露出しない。','打-WIN LITEの隠れ凪は確認タイミングを案内するが、Hard確定情報と傾向示唆を混同しない。'],
  LB_PREMIUM_UMAIBO_S1:['REGを代表採用し、BIG/合算/単独/チェリー重複を独立尤度として復活させない。'],
  LB_NEW_PULSAR_BT_C9:['ボーナス合算を代表採用しBIG/REG内訳を独立尤度として復活させない。','スロプラNEXT表示値はResearchの分母定義と一致する項目だけ補助取得元として使う。'],
  S_KABANERI_ZR:['CZ失敗時BBランク昇格を入力させない。内部ランク示唆を昇格結果として扱わない。','無名CZ 2択ナビは連撃中1連撃以上かつ押し順ベル・非小役対象成立時だけを分母にする。','共通6枚ベルはトータルゲームを分母にする。'],
  L_DMC5_ST_XA:['潜在モード移行を入力させず、上位ST後100G+α以内の実際のボーナス当選結果を使う。','条件別抽選を単一成功率へ合算しない。','筐体DMC履歴から推定した内部モードを確定観測値として扱わない。'],
  LB_1000CHAN_ALPHA_L3:['通常時ボーナス合算と当選契機内訳は、総率と排他的内訳として役割を分ける。','設定Hは通常設定1/2/5/6と同一の高低軸へ混ぜない。'],
  LB_JACKPOT_CY1:['ボーナス合算を代表採用しBIG/REGを独立尤度として復活させない。','REG終了時バックランプ消灯はREG終了1回を観測機会とする。'],
  L_GUILTY_CROWN_2_XF:['ボーナス+AT合算を代表採用し構成するAT/ボーナス内訳を独立尤度として復活させない。','弱/強スイカ条件別同時当選を単一率へ混ぜない。'],
  L_ULTRAMAN_KE:['中押しウルトラ目とウルトラ目合成を重複利用しない。','内部超高確・ポイント高確・ループストックレベルを観測値として入力させない。','ぱちログ表示値はResearch分母と一致する場合のみ補助取得元として使う。']
};
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n','utf8');
const safeTitle=s=>String(s??'').replace(/\s+(回数|試行数|ゲーム数)$/,'').trim();
const roleMap={DIRECT_PLAY:'DIRECT_PLAY',END_EVENT:'END_EVENT',MACHINE_MENU:'MACHINE_MENU',DATA_COUNTER:'DATA_COUNTER',LINKED_SERVICE:'LINKED_SERVICE',SEATED_STATE:'SEATED_STATE'};
const uiName=input=>String(input.name??input.id)
  .replace(/\s*試行数$/,' 対象回数')
  .replace(/\s*回数$/,'')
  .replace(/トータルゲーム\s*対象回数/,'総ゲーム数');
function unresolvedItems(obs){
  const out=[];
  for(const [k,v] of Object.entries(obs.sourceCoverage??{})) if(v==='UNRESOLVED') out.push(`${k}: 実機確認待ち`);
  for(const x of obs.fieldVerificationItems??[]) if(x.status==='WAITING_FOR_MACHINE') out.push(x.question??x.verificationId);
  return [...new Set(out)];
}
function obsForCategory(obs,category){
  if(category==='EVIDENCE') return (obs.observations??[]).filter(o=>o.observationId==='OBS_HARD_EVIDENCE_EVENTS');
  const suffix=String(category).replace(/^SEL_RF_/,'');
  const direct=(obs.observations??[]).find(o=>o.observationId===`OBS_${suffix}`);
  return direct?[direct]:[];
}
function sectionTitle(category,inputs,observations){
  if(category==='EVIDENCE') return '設定示唆・確定情報';
  const label=observations[0]?.label;
  if(label&&label.length<=30) return label.replace(/確率$/,'').replace(/・/g,' / ');
  const names=inputs.map(x=>safeTitle(uiName(x))).filter(Boolean);
  const common=names.reduce((a,b)=>{let i=0;while(i<a.length&&i<b.length&&a[i]===b[i])i++;return a.slice(0,i);});
  const cleaned=common.replace(/[・\s]+$/,'').trim();
  return cleaned.length>=3?cleaned:(names[0]||'実戦データ');
}
function contract(input,groupSize){
  const type=String(input.type??'integer').toLowerCase();
  const counter=type==='counter';
  const name=uiName(input);
  const denominator=/TRIAL|GAME|GAMES|対象回数|ゲーム数|総ゲーム数/i.test(input.id+' '+name);
  return {name,mode:counter?'COUNTER':(type==='select'?'SELECT':'NUMBER'),gridSpan:counter&&groupSize>1&&name.length<=20?6:12,directInput:!counter,...(counter?{compact:groupSize>1,step:1,quickAdd:[1],quickInputEligible:true}:{}),...(denominator&&!counter?{quickAdd:[50],quickInputEligible:false}:{}),inputVisible:true,emptyMeansUnobserved:true,observedZeroAllowed:true};
}
for(const machineId of IDS){
  const dir=path.join(ROOT,'research',machineId);
  const selection=read(path.join(dir,'selection-data.json'));
  const obs=read(path.join(dir,'machine-observation-data.json'));
  const inputs=[...(selection.inputs??[])].sort((a,b)=>(a.displayOrder??999)-(b.displayOrder??999));
  const groups=new Map();
  for(const input of inputs){const category=input.category??'OTHER';if(!groups.has(category))groups.set(category,[]);groups.get(category).push(input);}
  const sectionOrder=[],sections={},inputContracts={};
  for(const [category,group] of groups){
    const observations=obsForCategory(obs,category);let title=sectionTitle(category,group,observations),base=title,n=2;while(sections[title])title=`${base} ${n++}`;
    sectionOrder.push(title);const found=observations.find(o=>['FOUND','VERIFIED_ON_MACHINE'].includes(o.status));
    sections[title]={inputIds:group.map(x=>x.id),description:category==='EVIDENCE'?'実戦中に確認した設定確定・設定否定情報を入力します。傾向示唆だけの表示は確定情報として扱いません。':(found?.timing?.[0]??'実戦中、この項目の対象となる場面だけを数えます。'),...(found?.sourceType&&roleMap[found.sourceType]?{observationRole:roleMap[found.sourceType]}:{}),observationRefs:observations.map(o=>o.observationId),acquisitionSources:observations.map(o=>o.sourceType),collapsible:category==='EVIDENCE',defaultExpanded:category!=='EVIDENCE'};
    for(const input of group)inputContracts[input.id]=contract(input,group.length);
  }
  const unresolved=unresolvedItems(obs);
  const doc={schemaVersion:'ui-design-data-v1',machineId,status:unresolved.length?'PASS_WITH_UNRESOLVED':'PASS',generatedFrom:{selection:`research/${machineId}/selection-data.json`,observation:`research/${machineId}/machine-observation-data.json`},sectionOrder,sections,inputContracts,unresolved,auditNotes:['不採用要素専用の入力欄は生成しない。','空欄は未観測、0は観測した結果0回として区別する。','着席時データは実機・データカウンターで同一設定区間と確認できる場合だけ利用し、未解決状態から架空の入力欄を生成しない。','連動サービスや筐体メニューは補助取得元であり、サービス表示値の分母が一致しない項目を推測へ流用しない。','クイック入力は通常入力と同じ値へ即時反映し、別カウンターを持たない。',...(semanticLocks[machineId]??[])]};
  write(path.join(dir,'ui-design-data.json'),doc);
}
console.log(`Gate D UI Design generated: ${IDS.length}/10`);
