import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const read = p => JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const write = (p,v) => fs.writeFileSync(path.join(ROOT,p), `${JSON.stringify(v,null,2)}\n`);
const rp = id => `research/${id}/research-data.json`;
const sp = id => `research/${id}/selection-data.json`;

function feature(r,id){ const f=r.features.find(x=>x.researchFeatureId===id); if(!f) throw new Error(`${r.machine.machineId}: missing ${id}`); return f; }
function selectionFeature(s,id){ const f=s.features.find(x=>x.researchFeatureId===id); if(!f) throw new Error(`${s.machineId}: missing selection ${id}`); return f; }
function setUnknown(r, ids){ for(const id of ids){ const f=feature(r,id); f.candidateModel='unknown'; delete f.categories; delete f.settingDistributions; delete f.distributionMode; } }
function addSource(r,src){ if(!r.sources.some(x=>x.sourceId===src.sourceId)) r.sources.push(src); }
function addEvidence(r,items){ const existing=new Set(r.evidenceCandidates.map(x=>x.researchEvidenceId)); for(const item of items) if(!existing.has(item.researchEvidenceId)) r.evidenceCandidates.push(item); }
function denied(settings,allowed){ const a=new Set(allowed); return settings.filter(x=>!a.has(x)); }
function ev(r,id,name,allowed,sourceRefs,notes=''){ return {researchEvidenceId:id,name,factStatus:'verified',observationScope:name,allowedSettings:allowed,deniedSettings:denied(r.machine.settings,allowed),sourceRefs,notes}; }

// Candidates whose existence is researched but whose complete distributions are not available.
for(const [id,ids] of Object.entries({
  L_GIRLS_UND_PANZER_FINALE_H1:['RF_CZ_SKIP_CEILING','RF_GC_INITIAL_POINT'],
  L_NANGOKU_SODACHI_S3:['RF_BONUS_TYPE'],
  L_CHIBARIYO2_ZB:['RF_BONUS_TYPE'],
  L_DRAGON_HANAHANA_SENKO_JP:['RF_REG_SIDE_LAMP','RF_FEATHER'],
  L_SHINOBIDAMASHII3_A3:['RF_INITIAL_SET'],
  L_STRIKE_THE_BLOOD_ZC:['RF_CEILING'],
  L_OSU_BANCHO4_A3:['RF_BONUS_TYPE']
})) { const r=read(rp(id)); setUnknown(r,ids); write(rp(id),r); }

// King Pulsar: official-spec BIG/REG outcome as a complete per-game multinomial.
{
 const id='L_KING_PULSAR_SLCC', r=read(rp(id)), s=read(sp(id));
 const f=feature(r,'RF_BONUS');
 const vals={SET_1:[257.6,387.8],SET_2:[251.4,378.4],SET_4:[210.0,324.2],SET_5:[191.8,298.8],SET_6:[173.6,274.9]};
 f.categories=['BIG','REG','OTHER']; f.distributionMode='complete'; f.settingDistributions={};
 for(const [st,[b,rg]] of Object.entries(vals)){ const pb=1/b, pr=1/rg; f.settingDistributions[st]={BIG:pb,REG:pr,OTHER:1-pb-pr}; }
 const sf=selectionFeature(s,'RF_BONUS'); delete sf.countInputIds; sf.numeratorInputId='INP_BIG'; sf.categoryInputIds=['INP_REG']; sf.residualCategoryLabel='OTHER';
 write(rp(id),r); write(sp(id),s);
}

// Smart Dragon Hanahana: BIG/REG official spec as complete per-game multinomial.
{
 const id='L_DRAGON_HANAHANA_SENKO_JP', r=read(rp(id)), s=read(sp(id));
 const f=feature(r,'RF_BONUS');
 const vals={SET_1:[256,642],SET_2:[246,585],SET_3:[235,537],SET_4:[224,489],SET_5:[212,442],SET_6:[199,399]};
 f.categories=['BIG','REG','OTHER']; f.distributionMode='complete'; f.settingDistributions={};
 for(const [st,[b,rg]] of Object.entries(vals)){ const pb=1/b, pr=1/rg; f.settingDistributions[st]={BIG:pb,REG:pr,OTHER:1-pb-pr}; }
 const sf=selectionFeature(s,'RF_BONUS'); delete sf.countInputIds; sf.numeratorInputId='INP_BIG'; sf.categoryInputIds=['INP_REG']; sf.residualCategoryLabel='OTHER';
 write(rp(id),r); write(sp(id),s);
}

// Strike the Blood: keep episode points as an explicit researched-but-excluded factor, and dispose hard evidence.
{
 const id='L_STRIKE_THE_BLOOD_ZC', r=read(rp(id)), s=read(sp(id));
 addSource(r,{sourceId:'SRC_STB_NANA',publisher:'なな徹',title:'スマスロ ストライク・ザ・ブラッド 設定判別',url:'https://nana-press.com/kaiseki/machine/724/20435/',checkedAt:'2026-08-19',sourceType:'major_analysis'});
 if(!r.features.some(x=>x.researchFeatureId==='RF_EPISODE_POINT')) r.features.push({researchFeatureId:'RF_EPISODE_POINT',name:'エピソードポイント振り分け',factStatus:'verified',candidateModel:'unknown',trialUnit:'ポイント獲得契機',observationScope:'通常時',numeratorDefinition:'内部エピソードポイント獲得量',denominatorDefinition:'ポイント獲得契機回数',settingValues:{},sourceRefs:['SRC_STB_NANA'],crossSourceStatus:'single_source_verified',notes:'設定差のある要素として確認。内部ポイントを完全観測できない。'});
 if(!s.features.some(x=>x.researchFeatureId==='RF_EPISODE_POINT')) s.features.push({researchFeatureId:'RF_EPISODE_POINT',featureId:'FEAT_EPISODE_POINT',adoptionCategory:'EXCLUDE',rejectionReason:'設定差は把握していますが、内部ポイントの獲得量と蓄積値を実戦中に完全観測できず、分子・分母を再現できないため不採用。'});
 s.rejectedElements=(s.rejectedElements??[]).filter(x=>x.id!=='REJECTED_EPISODE_POINT');
 const st=r.machine.settings;
 addEvidence(r,[
   ev(r,'RE_TROPHY_2PLUS','エンタトロフィー 銅',['SET_2','SET_3','SET_4','SET_5','SET_6'],['SRC_STB_NANA'],'設定2以上。'),
   ev(r,'RE_TROPHY_3PLUS','エンタトロフィー 銀',['SET_3','SET_4','SET_5','SET_6'],['SRC_STB_NANA'],'設定3以上。'),
   ev(r,'RE_TROPHY_4PLUS','エンタトロフィー 金',['SET_4','SET_5','SET_6'],['SRC_STB_NANA'],'設定4以上。'),
   ev(r,'RE_TROPHY_5PLUS','エンタトロフィー 紅葉柄',['SET_5','SET_6'],['SRC_STB_NANA'],'設定5以上。'),
   ev(r,'RE_TROPHY_6','エンタトロフィー 虹',['SET_6'],['SRC_STB_NANA'],'設定6。'),
   ev(r,'RE_PUSH_4PLUS','終了時PUSHランプ 赤',['SET_4','SET_5','SET_6'],['SRC_STB_NANA'],'設定4以上。'),
   ev(r,'RE_PUSH_6','終了時PUSHランプ 虹',['SET_6'],['SRC_STB_NANA'],'設定6。'),
   ev(r,'RE_KALEIDO_DENY2','カレイドBONUS モグワイ',['SET_1','SET_3','SET_4','SET_5','SET_6'],['SRC_STB_NANA'],'設定2否定。'),
   ev(r,'RE_KALEIDO_2PLUS','カレイドBONUS リディアーヌ',['SET_2','SET_3','SET_4','SET_5','SET_6'],['SRC_STB_NANA'],'設定2以上。'),
   ev(r,'RE_KALEIDO_4PLUS','カレイドBONUS ディミトリエ・ヴァトラー',['SET_4','SET_5','SET_6'],['SRC_STB_NANA'],'設定4以上。'),
   ev(r,'RE_KALEIDO_6','カレイドBONUS エンタライオン',['SET_6'],['SRC_STB_NANA'],'設定6。')
 ]);
 s.evidenceUi={groups:[{groupId:'SETTING_CONSTRAINT',label:'確認した設定確定・否定',selectionMode:'multiple',normalizationMode:'ALLOWED_SETTINGS',options:[
  {value:'SET_2_DENIED',label:'設定2否定',allowedSettings:['SET_1','SET_3','SET_4','SET_5','SET_6'],sourceEvidenceIds:['RE_KALEIDO_DENY2']},
  {value:'SET_2_OR_HIGHER',label:'設定2以上',allowedSettings:['SET_2','SET_3','SET_4','SET_5','SET_6'],sourceEvidenceIds:['RE_TROPHY_2PLUS','RE_KALEIDO_2PLUS']},
  {value:'SET_3_OR_HIGHER',label:'設定3以上',allowedSettings:['SET_3','SET_4','SET_5','SET_6'],sourceEvidenceIds:['RE_TROPHY_3PLUS']},
  {value:'SET_4_OR_HIGHER',label:'設定4以上',allowedSettings:['SET_4','SET_5','SET_6'],sourceEvidenceIds:['RE_TROPHY_4PLUS','RE_PUSH_4PLUS','RE_KALEIDO_4PLUS']},
  {value:'SET_5_OR_HIGHER',label:'設定5以上',allowedSettings:['SET_5','SET_6'],sourceEvidenceIds:['RE_TROPHY_5PLUS']},
  {value:'SET_6',label:'設定6',allowedSettings:['SET_6'],sourceEvidenceIds:['RE_TROPHY_6','RE_PUSH_6','RE_KALEIDO_6']}
 ]}]};
 write(rp(id),r); write(sp(id),s);
}

// Golden Kamuy: hard evidence disposition.
{
 const id='L_GOLDEN_KAMUY_KR', r=read(rp(id)), s=read(sp(id));
 addEvidence(r,[
  ev(r,'RE_TROPHY_2PLUS','サミートロフィー 銅',['SET_2','SET_4','SET_5','SET_6'],['SRC_GK_NANA'],'設定2以上。'),
  ev(r,'RE_TROPHY_4PLUS','サミートロフィー 金',['SET_4','SET_5','SET_6'],['SRC_GK_NANA'],'設定4以上。'),
  ev(r,'RE_TROPHY_5PLUS','サミートロフィー キリン柄',['SET_5','SET_6'],['SRC_GK_NANA'],'設定5以上。'),
  ev(r,'RE_TROPHY_6','サミートロフィー 虹',['SET_6'],['SRC_GK_NANA'],'設定6。'),
  ev(r,'RE_PAYOUT_456','456枚突破',['SET_4','SET_5','SET_6'],['SRC_GK_NANA'],'設定4以上。'),
  ev(r,'RE_PAYOUT_666','666枚突破',['SET_6'],['SRC_GK_NANA'],'設定6。'),
  ev(r,'RE_PHOTO_4PLUS','金枠写真',['SET_4','SET_5','SET_6'],['SRC_GK_NANA'],'設定4以上。')
 ]);
 s.evidenceUi={groups:[{groupId:'SETTING_FLOOR',label:'確認した設定下限',selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',options:[
  {value:'SET_2_OR_HIGHER',label:'設定2以上',allowedSettings:['SET_2','SET_4','SET_5','SET_6'],sourceEvidenceIds:['RE_TROPHY_2PLUS']},
  {value:'SET_4_OR_HIGHER',label:'設定4以上',allowedSettings:['SET_4','SET_5','SET_6'],sourceEvidenceIds:['RE_TROPHY_4PLUS','RE_PAYOUT_456','RE_PHOTO_4PLUS']},
  {value:'SET_5_OR_HIGHER',label:'設定5以上',allowedSettings:['SET_5','SET_6'],sourceEvidenceIds:['RE_TROPHY_5PLUS']},
  {value:'SET_6',label:'設定6',allowedSettings:['SET_6'],sourceEvidenceIds:['RE_TROPHY_6','RE_PAYOUT_666']}
 ]}]};
 write(rp(id),r); write(sp(id),s);
}

// Urusei Yatsura: denial/floor evidence disposition.
{
 const id='L_URUSEI_YATSURA_EV', r=read(rp(id)), s=read(sp(id));
 addSource(r,{sourceId:'SRC_UY_NANA',publisher:'なな徹',title:'Lパチスロうる星やつら 設定判別',url:'https://nana-press.com/kaiseki/machine/727/20610/',checkedAt:'2026-08-19',sourceType:'major_analysis'});
 addEvidence(r,[
  ev(r,'RE_DENY_1','終了画面 テンちゃん',['SET_2','SET_4','SET_5','SET_6'],['SRC_UY_NANA'],'設定1否定。'),
  ev(r,'RE_DENY_2','終了画面 錯乱坊',['SET_1','SET_4','SET_5','SET_6'],['SRC_UY_NANA'],'設定2否定。'),
  ev(r,'RE_DENY_1_5','終了画面 コタツネコ',['SET_2','SET_4','SET_6'],['SRC_UY_NANA'],'設定1・5否定。'),
  ev(r,'RE_4PLUS','AT終了画面 ラム＆あたる等',['SET_4','SET_5','SET_6'],['SRC_UY_NANA'],'設定4以上。'),
  ev(r,'RE_5PLUS','ヒロイン集合',['SET_5','SET_6'],['SRC_UY_NANA'],'設定5以上。'),
  ev(r,'RE_6','あたる逃走中アイキャッチ',['SET_6'],['SRC_UY_NANA'],'設定6。')
 ]);
 write(rp(id),r); write(sp(id),s);
}

console.log('OK: batch10 Research/Selection normalization completed.');
