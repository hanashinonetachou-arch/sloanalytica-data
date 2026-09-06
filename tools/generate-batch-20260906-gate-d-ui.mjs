#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const IDS=['L_BURNING_EXPRESS_ZN','L_PRISM_NANA_CC','L_GINGA_EIYUU_DNT_GH','L_HIHODEN_PA7','L_OKIDOKI_DUO_ENCORE_FR','L_HOKUTO_TENSEI_2_MW','L_TEKKEN_6_YD01H','L_HANMA_BAKI_L5','L_GOBLIN_SLAYER_2_JZ','L_GHOST_IN_THE_SHELL_ZS'];
const semanticLocks={
  L_BURNING_EXPRESS_ZN:['エクスプレスボーナス初当りをactive representativeとし、バーニングボーナスを独立Likelihoodとして復活させない','リーチ目ロックは設定差ほぼ無しのため復活させない','非リーチ目リールロックFallbackは代表Feature利用時に同時尤度化しない'],
  L_PRISM_NANA_CC:['ボーナス中リールロックの分母はボーナス中ゲーム数。通常Gへ置換しない','終了画面・タッチボイス・会話のHard Evidenceパターンを数値分布へ混ぜない'],
  L_HIHODEN_PA7:['通常時チェリーは高確率中を除外した通常ゲームだけを分母にする','ボーナス中ハズレはボーナス中ゲームだけを分母にする','謎高確率は否伝説モード中Gを正確観測できない間はEXCLUDEを維持する','ボーナス中ゲーム数はダイトモで確認可能と案内する'],
  L_OKIDOKI_DUO_ENCORE_FR:['ボーナス初当りは連チャン中を除外した通常ゲームだけを分母にする','設定4を生成しない'],
  L_HOKUTO_TENSEI_2_MW:['天破・天撃・設定変更256あべしFallbackはAT初当りと同時尤度化しない','設定変更256あべしはconfirmed reset後の初回AT機会だけを分母にする','天撃は0G/3G目ハズレ成立機会だけを分母にする'],
  L_TEKKEN_6_YD01H:['ボーナス初当りFallbackはAT初当りと同時尤度化しない','CZ合算FallbackはAT初当り・ボーナス初当りと同時尤度化しない','AT直撃・ボーナス直撃内訳/合算を既存初当りと二重計上しない','赤UI中引き戻しはコンティニューゾーン失敗後に通常時へ戻ったAT終了機会だけを母数にする','ケロットトロフィーのsource conflictをHard Evidenceへ昇格させない'],
  L_HANMA_BAKI_L5:['AT初当りは引き戻し込み公表定義を維持する','範馬BONUS初当りFallbackをAT初当りと同時尤度化しない'],
  L_GOBLIN_SLAYER_2_JZ:['CZ合算・弱レア役CZ・300/500G CZはAT初当りとのsuppression契約を保持','弱レア役CZ分母=弱チェリー+スイカ成立回数','300/500G CZ分母=有効ゾーン到達回数'],
  L_GHOST_IN_THE_SHELL_ZS:['CZ合算・200/400GタチコマCZはAT初当りとのsuppression契約を保持','タチコマCZ分母はモードA-Dの有効200/400G到達のみ。白の境界失敗後の確定区間を除外','S.A.M.視覚フラグ分母=通常モード開始回数','AT引き戻しストックはAT当選回数を条件付き分母にする']
};
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n','utf8');
const safeTitle=s=>String(s??'').replace(/\s+(回数|試行数|ゲーム数)$/,'').trim();
const roleMap={DIRECT_PLAY:'DIRECT_PLAY',END_EVENT:'END_EVENT',MACHINE_MENU:'MACHINE_MENU',DATA_COUNTER:'DATA_COUNTER',LINKED_SERVICE:'LINKED_SERVICE',SEATED_STATE:'SEATED_STATE'};
function unresolvedItems(obs){const out=[];for(const [k,v] of Object.entries(obs.sourceCoverage??{}))if(v==='UNRESOLVED')out.push(`${k}: UNRESOLVED`);for(const x of obs.fieldVerificationItems??[])if(x.status==='WAITING_FOR_MACHINE')out.push(x.question??x.verificationId??'実機確認待ち');return [...new Set(out)];}
function obsForCategory(obs,category,selection,group=[]){const suffix=String(category).replace(/^SEL_RF_/,'');const direct=(obs.observations??[]).find(o=>o.observationId===`OBS_${suffix}`);if(direct)return [direct];if(String(category).startsWith('SHARED_DENOM_')){const ids=new Set(group.map(x=>x.id));const featIds=(selection.features??[]).filter(f=>[f.numeratorInputId,f.denominatorInputId,...(f.categoryInputIds??[])].some(x=>ids.has(x))).map(f=>f.featureId);return (obs.observations??[]).filter(o=>featIds.some(fid=>o.observationId===`OBS_${String(fid).replace(/^FEAT_/,'')}`));}return [];}
function sectionTitle(category,inputs,observations){if(category==='EVIDENCE')return '設定示唆・確定情報';const names=inputs.map(x=>safeTitle(x.name)).filter(Boolean);if(names.length===1)return names[0];const common=names.reduce((a,b)=>{let i=0;while(i<a.length&&i<b.length&&a[i]===b[i])i++;return a.slice(0,i);});const cleaned=common.replace(/[・\s]+$/,'').trim();if(cleaned.length>=3)return cleaned;const label=observations[0]?.label;if(label&&label.length<=28)return label.replace(/・/g,' / ');return names[0]||'実戦データ';}
function contract(input,groupSize){const type=String(input.type??'integer').toLowerCase();const counter=type==='counter';const name=String(input.name??input.id);const games=/GAME|ゲーム|GAMES|TRIAL/i.test(input.id+' '+name);return {name,mode:counter?'COUNTER':(type==='select'?'SELECT':'NUMBER'),gridSpan:counter&&groupSize>1&&name.length<=20?6:12,directInput:!counter,...(counter?{compact:groupSize>1,step:1,quickAdd:[1],quickInputEligible:true}:{}),...(games&&!counter?{quickAdd:[50],quickInputEligible:false}:{}),inputVisible:true,emptyMeansUnobserved:true,observedZeroAllowed:true};}
for(const machineId of IDS){
  const dir=path.join(ROOT,'research',machineId);const selection=read(path.join(dir,'selection-data.json'));const obs=read(path.join(dir,'machine-observation-data.json'));const inputs=[...(selection.inputs??[])].sort((a,b)=>(a.displayOrder??999)-(b.displayOrder??999));const groups=new Map();
  for(const input of inputs){const category=input.category??'OTHER';if(!groups.has(category))groups.set(category,[]);groups.get(category).push(input);}
  const sectionOrder=[];const sections={};const inputContracts={};
  for(const [category,group] of groups){const observations=obsForCategory(obs,category,selection,group);let title=String(category).startsWith('SHARED_DENOM_')?(selection.uiCategoryLabels?.[category]??sectionTitle(category,group,observations)):sectionTitle(category,group,observations);let base=title,n=2;while(sections[title])title=`${base} ${n++}`;sectionOrder.push(title);const found=observations.find(o=>['FOUND','VERIFIED_ON_MACHINE'].includes(o.status));sections[title]={inputIds:group.map(x=>x.id),description:category==='EVIDENCE'?'実戦中に確認できた設定確定・否定情報だけを入力します。通常の確率Featureとは分離して扱います。':(found?.timing?.[0]??'自己実戦中、Selectionで定義された対象試行・対象イベントに合わせて更新します。'),...(found?.sourceType&&roleMap[found.sourceType]?{observationRole:roleMap[found.sourceType]}:{}),observationRefs:observations.map(o=>o.observationId),acquisitionSources:observations.map(o=>o.sourceType),collapsible:category==='EVIDENCE'||String(category).includes('SEATED'),defaultExpanded:category!=='EVIDENCE'&&!String(category).includes('SEATED')};for(const input of group)inputContracts[input.id]=contract(input,group.length);}
  const unresolved=unresolvedItems(obs);const doc={schemaVersion:'ui-design-data-v1',machineId,status:unresolved.length?'PASS_WITH_UNRESOLVED':'PASS',generatedFrom:{selection:`research/${machineId}/selection-data.json`,observation:`research/${machineId}/machine-observation-data.json`},sectionOrder,sections,inputContracts,unresolved,auditNotes:['Selection EXCLUDE-only inputは生成しない。SelectionData inputsに存在する正式入力だけをUI化する。','空欄=未観測、0=観測済み0回を維持する。','前任者区間と自己実戦区間はObservationで明示された場合のみ接続し、UNRESOLVEDから架空の着席時入力を生成しない。','linked-service / machine-menuは補助取得元であり必須入力にしない。','Hard Evidenceは確率Featureから分離し、原則最後のセクションに置く。',...(semanticLocks[machineId]??[])]};write(path.join(dir,'ui-design-data.json'),doc);
}
console.log(`Gate D UI Design generated: ${IDS.length}/10`);
