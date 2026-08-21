import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
const upsertBy = (arr, key, item) => { const i = arr.findIndex(x => x[key] === item[key]); if (i >= 0) arr[i] = item; else arr.push(item); };
const addSource = (r, s) => upsertBy(r.sources, 'sourceId', s);
const addEvidence = (r, e) => upsertBy(r.evidenceCandidates, 'researchEvidenceId', e);
const addInput = (s, i) => upsertBy(s.inputs, 'id', i);
const addFeature = (s, f) => upsertBy(s.features, 'featureId', f);
const addResearchFeature = (r, f) => upsertBy(r.features, 'researchFeatureId', f);
const bump = s => { const p=s.machineDataVersion.split('.').map(Number); p[2]=(p[2]||0)+1; s.machineDataVersion=p.join('.'); };

// BOFURI: trophy evidence + BET denominator wording.
{
  const rp='research/L_BOFURI_FN/research-data.json', sp='research/L_BOFURI_FN/selection-data.json';
  const r=read(rp), s=read(sp); bump(s);
  addSource(r,{sourceId:'SRC_TROPHY_RECHECK',publisher:'パチーモ',url:'https://altema.jp/pachimo/lbouhurigamen',checkedAt:'2026-08-22',sourceType:'major_analysis'});
  for (const [id,name,allowed] of [
    ['RE_TROPHY_2PLUS','サミートロフィー銅（設定2以上）',['SET_2','SET_3','SET_4','SET_5','SET_6']],
    ['RE_TROPHY_3PLUS','サミートロフィー銀（設定3以上）',['SET_3','SET_4','SET_5','SET_6']],
    ['RE_TROPHY_4PLUS','サミートロフィー金（設定4以上）',['SET_4','SET_5','SET_6']],
    ['RE_TROPHY_5PLUS','サミートロフィーキリン柄（設定5以上）',['SET_5','SET_6']],
    ['RE_TROPHY_6','サミートロフィー虹（設定6）',['SET_6']]
  ]) addEvidence(r,{researchEvidenceId:id,name,factStatus:'verified',allowedSettings:allowed,deniedSettings:r.machine.settings.filter(x=>!allowed.includes(x)),sourceRefs:['SRC_TROPHY_RECHECK']});
  const bet=s.inputs.find(x=>x.id==='INP_BET_TRIALS');
  bet.description='初当りBIG・REGのうち、最大天井契機を除いた回数を入力します。EPISODE BONUSは当選時点でBET高確が確定するため対象外です。通常のBIG・REGからBET高確へ入った回数だけを「BET高確当選回数」に数えてください。';
  const group=s.evidenceUi.groups[0];
  const opts=[
    ['TROPHY_2PLUS','トロフィー：銅（設定2以上）',['SET_2','SET_3','SET_4','SET_5','SET_6'],'RE_TROPHY_2PLUS'],
    ['TROPHY_3PLUS','トロフィー：銀（設定3以上）',['SET_3','SET_4','SET_5','SET_6'],'RE_TROPHY_3PLUS'],
    ['TROPHY_4PLUS','トロフィー：金（設定4以上）',['SET_4','SET_5','SET_6'],'RE_TROPHY_4PLUS'],
    ['TROPHY_5PLUS','トロフィー：キリン柄（設定5以上）',['SET_5','SET_6'],'RE_TROPHY_5PLUS'],
    ['TROPHY_6','トロフィー：虹（設定6）',['SET_6'],'RE_TROPHY_6']
  ];
  for (const [value,label,allowed,id] of opts) upsertBy(group.options,'value',{value,label,allowedSettings:allowed,sourceEvidenceIds:[id]});
  write(rp,r); write(sp,s);
}

// Symphogear: use non-Evidence AT end-screen distribution as a conditional multinomial; exact/deny screens remain Evidence.
{
  const rp='research/L_SYMPHOGEAR_SEIGI_JA/research-data.json', sp='research/L_SYMPHOGEAR_SEIGI_JA/selection-data.json';
  const r=read(rp), s=read(sp); bump(s);
  addSource(r,{sourceId:'SRC_ENDSCREEN_RECHECK',publisher:'ちょんぼりすた',url:'https://chonborista.com/slot/sankyo-slot/211326/',checkedAt:'2026-08-22',sourceType:'major_analysis'});
  const raw={SET_1:[27,22,18,23,5],SET_2:[27,14,20,24,6],SET_4:[27,12,17,25,8],SET_5:[26,17,11,26,9],SET_6:[26,14,17,26,8]};
  const cats=['DEFAULT','ODD','EVEN','HIGH_WEAK','HIGH_STRONG'];
  const dist={}; for(const [st,a] of Object.entries(raw)){const z=a.reduce((x,y)=>x+y,0);dist[st]=Object.fromEntries(cats.map((c,i)=>[c,a[i]/z]));}
  addResearchFeature(r,{researchFeatureId:'RF_AT_ENDSCREEN_NON_EVIDENCE',name:'AT終了画面（確定・否定系を除く）',factStatus:'verified',candidateModel:'multinomial',trialUnit:'確定・否定系を除くAT終了画面1回',numeratorDefinition:'デフォルト・奇数示唆・偶数示唆・高設定示唆弱/強の各回数',denominatorDefinition:'左記5種類のAT終了画面合計回数',settingValues:{},categories:cats,settingDistributions:dist,distributionMode:'explicit_complete',sourceRefs:['SRC_ENDSCREEN_RECHECK'],crossSourceStatus:'matched',notes:'紫・銀・金など設定確定/否定を伴う画面はEvidenceへ分離し、同一観測の二重計上を避ける。残る5種類のみで条件付き分布を構成。'});
  for(const [id,name,allowed] of [
    ['RE_END_2PLUS','AT終了画面 紫①/②（設定2以上）',['SET_2','SET_4','SET_5','SET_6']],
    ['RE_END_NOT2','AT終了画面 紫③（設定2否定）',['SET_1','SET_4','SET_5','SET_6']],
    ['RE_END_NOT4','AT終了画面 紫④（設定4否定）',['SET_1','SET_2','SET_5','SET_6']],
    ['RE_END_246','AT終了画面 紫⑤（設定2・4・6）',['SET_2','SET_4','SET_6']],
    ['RE_END_4PLUS','AT終了画面 銀（設定4以上）',['SET_4','SET_5','SET_6']],
    ['RE_END_6','AT終了画面 金（設定6）',['SET_6']]
  ]) addEvidence(r,{researchEvidenceId:id,name,factStatus:'verified',allowedSettings:allowed,deniedSettings:r.machine.settings.filter(x=>!allowed.includes(x)),sourceRefs:['SRC_ENDSCREEN_RECHECK']});
  const ins=[['DEFAULT','デフォルト'],['ODD','奇数示唆'],['EVEN','偶数示唆'],['HIGH_WEAK','高設定示唆（弱）'],['HIGH_STRONG','高設定示唆（強）']];
  ins.forEach(([k,n],i)=>addInput(s,{id:`INP_AT_END_${k}`,name:n,type:'counter',category:'AT_END_SCREEN',displayOrder:40+i,defaultValue:0,unit:'回',description:'AT終了時に表示された回数を入力。紫・銀・金など設定確定/否定系の画面はここには含めず「設定確定・否定情報」で選択してください。'}));
  addFeature(s,{researchFeatureId:'RF_AT_ENDSCREEN_NON_EVIDENCE',featureId:'FEAT_AT_ENDSCREEN_NON_EVIDENCE',adoptionCategory:'INCLUDE_SUPPORT',numeratorInputId:'INP_AT_END_DEFAULT',denominatorInputId:'INP_AT_END_ODD',categoryInputIds:['INP_AT_END_ODD','INP_AT_END_EVEN','INP_AT_END_HIGH_WEAK','INP_AT_END_HIGH_STRONG'],inputTransform:'sum_inputs_to_trials',denominatorInputIds:ins.map(([k])=>`INP_AT_END_${k}`),minimumSample:1,sampleRecommendation:10,weight:1,modelTypeOverride:'multinomial',difficultyParticipation:'EXCLUDE',difficultyExclusionReason:'AT終了回数を通常ゲーム数から一意にExposure化できないため。',userReason:'AT終了画面は設定別振り分けが公開されているため採用。確定・否定系はEvidenceへ分離して二重計上を避けます。'});
  s.uiCategoryLabels.AT_END_SCREEN='AT終了画面';
  const group=s.evidenceUi?.groups?.[0]; if(group){ for(const [value,label,allowed,id] of [
    ['END_2PLUS','AT終了画面：紫①/②（設定2以上）',['SET_2','SET_4','SET_5','SET_6'],'RE_END_2PLUS'],
    ['END_NOT2','AT終了画面：紫③（設定2否定）',['SET_1','SET_4','SET_5','SET_6'],'RE_END_NOT2'],
    ['END_NOT4','AT終了画面：紫④（設定4否定）',['SET_1','SET_2','SET_5','SET_6'],'RE_END_NOT4'],
    ['END_246','AT終了画面：紫⑤（設定2・4・6）',['SET_2','SET_4','SET_6'],'RE_END_246'],
    ['END_4PLUS','AT終了画面：銀（設定4以上）',['SET_4','SET_5','SET_6'],'RE_END_4PLUS'],
    ['END_6','AT終了画面：金（設定6）',['SET_6'],'RE_END_6']
  ]) upsertBy(group.options,'value',{value,label,allowedSettings:allowed,sourceEvidenceIds:[id]}); }
  write(rp,r); write(sp,s);
}

// Hokuto Musou: trophy Evidence + non-Evidence ST end-screen distribution.
{
  const rp='research/L_HOKUTO_MUSOU_FS/research-data.json', sp='research/L_HOKUTO_MUSOU_FS/selection-data.json';
  const r=read(rp), s=read(sp); bump(s);
  addSource(r,{sourceId:'SRC_ST_RECHECK',publisher:'P-WORLD',url:'https://www.p-world.co.jp/machine/database/10044',checkedAt:'2026-08-22',sourceType:'industry'});
  const raw={SET_1:[53.7,44.0,2.1,0.2],SET_2:[43.2,52.9,2.1,0.2],SET_3:[52.9,43.2,2.1,0.2],SET_4:[40.1,49.1,6.3,2.5],SET_5:[49.1,40.1,6.3,2.5],SET_6:[40.0,40.1,6.3,2.5]};
  const cats=['DEFAULT','EVEN','HIGH_WEAK','HIGH_STRONG']; const dist={};
  for(const [st,a] of Object.entries(raw)){const z=a.reduce((x,y)=>x+y,0);dist[st]=Object.fromEntries(cats.map((c,i)=>[c,a[i]/z]));}
  addResearchFeature(r,{researchFeatureId:'RF_ST_ENDSCREEN_NON_EVIDENCE',name:'ST終了画面（確定系を除く）',factStatus:'verified',candidateModel:'multinomial',trialUnit:'確定系を除くST終了画面1回',numeratorDefinition:'デフォルト・偶数示唆・高設定示唆弱/強の各回数',denominatorDefinition:'左記4種類のST終了画面合計回数',settingValues:{},categories:cats,settingDistributions:dist,distributionMode:'explicit_complete',sourceRefs:['SRC_ST_RECHECK'],crossSourceStatus:'matched',notes:'設定2以上/4以上/6の確定画面はEvidenceへ分離し、同一観測の二重計上を避ける。'});
  for(const [id,name,allowed] of [
    ['RE_TROPHY_2PLUS','サミートロフィー銅（設定2以上）',['SET_2','SET_3','SET_4','SET_5','SET_6']],
    ['RE_TROPHY_3PLUS','サミートロフィー銀（設定3以上）',['SET_3','SET_4','SET_5','SET_6']],
    ['RE_TROPHY_4PLUS','サミートロフィー金（設定4以上）',['SET_4','SET_5','SET_6']],
    ['RE_TROPHY_5PLUS','サミートロフィーキリン柄（設定5以上）',['SET_5','SET_6']],
    ['RE_TROPHY_6','サミートロフィーレインボー（設定6）',['SET_6']],
    ['RE_ST_2PLUS','ST終了画面 リン・バット（設定2以上）',['SET_2','SET_3','SET_4','SET_5','SET_6']],
    ['RE_ST_4PLUS','ST終了画面 ラオウ（設定4以上）',['SET_4','SET_5','SET_6']],
    ['RE_ST_6','ST終了画面 ユリア（金）（設定6）',['SET_6']]
  ]) addEvidence(r,{researchEvidenceId:id,name,factStatus:'verified',allowedSettings:allowed,deniedSettings:r.machine.settings.filter(x=>!allowed.includes(x)),sourceRefs:['SRC_ST_RECHECK']});
  const ins=[['DEFAULT','キャラ集合（デフォルト）'],['EVEN','ケンシロウ（偶数示唆）'],['HIGH_WEAK','北斗四兄弟（高設定示唆・弱）'],['HIGH_STRONG','女性キャラ4人（高設定示唆・強）']];
  ins.forEach(([k,n],i)=>addInput(s,{id:`INP_ST_END_${k}`,name:n,type:'counter',category:'ST_END_SCREEN',displayOrder:40+i,defaultValue:0,unit:'回',description:'ST終了時にPUSHして確認した回数を入力。リン・バット／ラオウ／ユリアなど設定確定系はここに含めず「設定確定・否定情報」で選択してください。'}));
  addFeature(s,{researchFeatureId:'RF_ST_ENDSCREEN_NON_EVIDENCE',featureId:'FEAT_ST_ENDSCREEN_NON_EVIDENCE',adoptionCategory:'INCLUDE_SUPPORT',numeratorInputId:'INP_ST_END_DEFAULT',denominatorInputId:'INP_ST_END_EVEN',categoryInputIds:['INP_ST_END_EVEN','INP_ST_END_HIGH_WEAK','INP_ST_END_HIGH_STRONG'],inputTransform:'sum_inputs_to_trials',denominatorInputIds:ins.map(([k])=>`INP_ST_END_${k}`),minimumSample:1,sampleRecommendation:10,weight:1,modelTypeOverride:'multinomial',difficultyParticipation:'EXCLUDE',difficultyExclusionReason:'ST終了回数を通常ゲーム数から一意にExposure化できないため。',userReason:'ST終了画面は設定別振り分けが公開され、偶奇・高設定示唆を定量評価できるため採用。確定系はEvidenceへ分離します。'});
  s.uiCategoryLabels.ST_END_SCREEN='ST終了画面';
  const group=s.evidenceUi?.groups?.[0]; if(group){ for(const [value,label,allowed,id] of [
    ['TROPHY_2PLUS','トロフィー：銅（設定2以上）',['SET_2','SET_3','SET_4','SET_5','SET_6'],'RE_TROPHY_2PLUS'],
    ['TROPHY_3PLUS','トロフィー：銀（設定3以上）',['SET_3','SET_4','SET_5','SET_6'],'RE_TROPHY_3PLUS'],
    ['TROPHY_4PLUS','トロフィー：金（設定4以上）',['SET_4','SET_5','SET_6'],'RE_TROPHY_4PLUS'],
    ['TROPHY_5PLUS','トロフィー：キリン柄（設定5以上）',['SET_5','SET_6'],'RE_TROPHY_5PLUS'],
    ['TROPHY_6','トロフィー：レインボー（設定6）',['SET_6'],'RE_TROPHY_6'],
    ['ST_2PLUS','ST終了画面：リン・バット（設定2以上）',['SET_2','SET_3','SET_4','SET_5','SET_6'],'RE_ST_2PLUS'],
    ['ST_4PLUS','ST終了画面：ラオウ（設定4以上）',['SET_4','SET_5','SET_6'],'RE_ST_4PLUS'],
    ['ST_6','ST終了画面：ユリア（金）（設定6）',['SET_6'],'RE_ST_6']
  ]) upsertBy(group.options,'value',{value,label,allowedSettings:allowed,sourceEvidenceIds:[id]}); }
  write(rp,r); write(sp,s);
}

// Bahama: merge bonus + long freeze into one multinomial so the freeze is not double-counted.
{
  const rp='research/S_BAHAMA_A3_30/research-data.json', sp='research/S_BAHAMA_A3_30/selection-data.json';
  const r=read(rp), s=read(sp); bump(s);
  const bonus=Object.fromEntries(Object.entries(r.features.find(x=>x.researchFeatureId==='RF_BONUS').settingValues).map(([k,v])=>[k,v.probability]));
  const freeze=Object.fromEntries(Object.entries(r.features.find(x=>x.researchFeatureId==='RF_FREEZE').settingValues).map(([k,v])=>[k,v.probability]));
  const dist={}; for(const st of Object.keys(bonus)) dist[st]={FREEZE_BONUS:freeze[st],OTHER_BONUS:bonus[st]-freeze[st]};
  addResearchFeature(r,{researchFeatureId:'RF_BONUS_FREEZE_OUTCOME',name:'ボーナス内訳（ロングフリーズ/その他）',factStatus:'verified',candidateModel:'multinomial',trialUnit:'通常ゲーム',numeratorDefinition:'ロングフリーズ回数とその他ボーナス回数',denominatorDefinition:'通常ゲーム',settingValues:{},categories:['FREEZE_BONUS','OTHER_BONUS'],settingDistributions:dist,distributionMode:'implicit_residual',sourceRefs:['SRC_ANALYSIS'],crossSourceStatus:'single_source',notes:'ロングフリーズはボーナス合成に含まれるため、別々の独立Featureにはせず1つの排他的結果として統合。7000Gでのフリーズ1回以上出現率は概算で設定1約15%、設定6約58%と情報はあるが、単独Feature化による二重計上を避ける。'});
  const oldB=s.features.find(x=>x.featureId==='FEAT_BONUS'); oldB.adoptionCategory='EXCLUDE'; oldB.rejectionReason='ロングフリーズを含むボーナス内訳Featureへ統合。'; delete oldB.numeratorInputId; delete oldB.denominatorInputId; delete oldB.difficultyExposure; delete oldB.difficultyParticipation; delete oldB.userReason;
  const oldF=s.features.find(x=>x.featureId==='FEAT_FREEZE'); oldF.adoptionCategory='EXCLUDE'; oldF.rejectionReason='ボーナス合成に含まれるため単独採用すると二重計上。ボーナス内訳Featureへ統合。'; delete oldF.numeratorInputId; delete oldF.denominatorInputId; delete oldF.difficultyExposure; delete oldF.difficultyParticipation; delete oldF.userReason;
  addFeature(s,{researchFeatureId:'RF_BONUS_FREEZE_OUTCOME',featureId:'FEAT_BONUS_FREEZE_OUTCOME',adoptionCategory:'INCLUDE_PRIMARY',numeratorInputId:'INP_FREEZE',denominatorInputId:'INP_NORMAL_GAMES',categoryInputIds:['INP_BONUS'],categorySubtractInputIds:{INP_BONUS:['INP_FREEZE']},minimumSample:1,sampleRecommendation:7000,weight:1,modelTypeOverride:'marginal_multinomial',difficultyParticipation:'INCLUDE',difficultyExposure:{mode:'per_game',factor:1,quality:'EXACT',basisId:'NORMAL_GAMES'},userReason:'ボーナス合成とロングフリーズを排他的な内訳として一体評価します。7000Gでも設定6ならフリーズ発生余地はありますが、単独で強い判別要素とはせずボーナス情報の一部として扱います。'});
  write(rp,r); write(sp,s);
}

// Okinawa BLACK: clarify operational definition of initial hit.
{
  const sp='research/S_OKIDOKI_BLACK_EP/selection-data.json'; const s=read(sp); bump(s);
  const i=s.inputs.find(x=>x.id==='INP_INITIAL');
  i.description='「初当り」は、前回ボーナス終了後32G以内の天国連チャン中のボーナスを除き、通常区間から新たに当選した最初のボーナスを1回として数えます。天国中の2連目以降のBIG・REGは初当り回数に加えません。';
  const f=s.features.find(x=>x.featureId==='FEAT_INITIAL'); f.userReason='天国連中のボーナスを除いた「通常区間からのボーナス初当り」に設定差があるため主軸として採用。';
  write(sp,s);
}
