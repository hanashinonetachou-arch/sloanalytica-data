import fs from 'node:fs';

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, v) => fs.writeFileSync(p, `${JSON.stringify(v, null, 2)}\n`);
const byId = (a, key, id) => (a ?? []).find((x) => x?.[key] === id);
const removeIds = (a, key, ids) => (a ?? []).filter((x) => !ids.includes(x?.[key]));
const upsert = (a, key, item) => {
  const idx = a.findIndex((x) => x?.[key] === item[key]);
  if (idx >= 0) a[idx] = item; else a.push(item);
};

function compactCounter(name) {
  return { name, mode: 'COUNTER', gridSpan: 6, directInput: false, compact: true, step: 1, quickAdd: [1], quickInputEligible: true, inputVisible: true, emptyMeansUnobserved: true, observedZeroAllowed: true };
}
function numberInput(name) {
  return { name, mode: 'NUMBER', gridSpan: 12, directInput: true, quickAdd: [50], quickInputEligible: false, inputVisible: true, emptyMeansUnobserved: true, observedZeroAllowed: true };
}

// Yoshimune: Daitomo image confirms first-hit, BIG and REG rates all use 通常プレイ数.
// The earlier small-role screenshot also resolves common 12枚俵 against the same 2811G sample.
{
  const sf = 'research/L_YOSHIMUNE_SC2/selection-data.json';
  const s = read(sf);
  s.inputs = removeIds(s.inputs, 'id', ['INP_BONUS_FIRST_HIT_TRIALS']);
  const normal = byId(s.inputs, 'id', 'INP_COMMON_TAWARA_TRIALS');
  Object.assign(normal, { name: '通常プレイ数', unit: 'G', category: 'SEL_RF_COMMON_TAWARA', displayOrder: 17 });
  const tawara = byId(s.inputs, 'id', 'INP_COMMON_TAWARA_COUNT');
  Object.assign(tawara, { name: '共通12枚俵 回数' });
  const first = byId(s.features, 'featureId', 'FEAT_BONUS_FIRST_HIT');
  first.denominatorInputId = 'INP_COMMON_TAWARA_TRIALS';
  first.userReason = 'ダイトモの初当り回数と通常プレイ数が直接取得でき、BIG/REG個別初当り確率も同じ通常プレイ数を母数としているため主Featureとして採用する。';
  s.uiCategoryLabels.SEL_RF_BONUS_FIRST_HIT = '通常時データ（ダイトモ）';
  s.uiCategoryLabels.SEL_RF_COMMON_TAWARA = '通常時データ（ダイトモ）';
  write(sf, s);

  const uf = 'research/L_YOSHIMUNE_SC2/ui-design-data.json';
  const u = read(uf);
  u.sectionOrder = ['通常時データ（ダイトモ）', ...u.sectionOrder.filter((x) => !['BIG/REG初当り','共通俵'].includes(x))];
  delete u.sections['BIG/REG初当り'];
  delete u.sections['共通俵'];
  u.sections['通常時データ（ダイトモ）'] = {
    inputIds: ['INP_BONUS_FIRST_HIT_COUNT','INP_COMMON_TAWARA_COUNT','INP_COMMON_TAWARA_TRIALS'],
    description: 'ダイトモの「通常プレイ数」を共通の母数として、初当り回数と「共通12枚俵」回数を入力します。BIG/REG個別の初当り確率も同じ通常プレイ数が母数です。前任者の履歴は取得できないため、自分が連動した区間だけを使います。',
    observationRole: 'LINKED_SERVICE', observationRefs: ['OBS_BONUS_FIRST_HIT','OBS_COMMON_TAWARA','OBS_DAITOMO_HISTORY'], acquisitionSources: ['LINKED_SERVICE'], collapsible: false, defaultExpanded: true
  };
  delete u.inputContracts.INP_BONUS_FIRST_HIT_TRIALS;
  u.inputContracts.INP_BONUS_FIRST_HIT_COUNT = compactCounter('初当り 回数');
  u.inputContracts.INP_COMMON_TAWARA_COUNT = compactCounter('共通12枚俵 回数');
  u.inputContracts.INP_COMMON_TAWARA_TRIALS = numberInput('通常プレイ数');
  write(uf, u);

  const of = 'research/L_YOSHIMUNE_SC2/machine-observation-data.json';
  const o = read(of);
  o.researchedAt = '2026-09-02';
  o.sourceCoverage.linkedService = 'VERIFIED_ON_MACHINE';
  const ob = byId(o.observations, 'observationId', 'OBS_BONUS_FIRST_HIT');
  if (ob) {
    ob.sourceType = 'LINKED_SERVICE'; ob.observationMode = 'LINKED_SERVICE_READ'; ob.status = 'VERIFIED_ON_MACHINE';
    ob.label = 'ダイトモ 初当り回数・通常プレイ数'; ob.categories = ['初当り回数','通常プレイ数'];
    ob.timing = ['ダイトモ遊技データ確認時'];
    ob.excludedConditions = ['前任者の履歴を含めない','総プレイ数を通常プレイ数の代用にしない','未観測を0として扱わない'];
    ob.notes = 'ユーザー提供のダイトモ画面で通常プレイ数2811G、初当り13回・1/216.2、BIG初当り5回・1/562.2、REG初当り8回・1/351.4を確認。2811/13、2811/5、2811/8が各表示確率と一致する。';
  }
  const cot = byId(o.observations, 'observationId', 'OBS_COMMON_TAWARA');
  if (cot) { cot.categories = ['共通12枚俵 回数','通常プレイ数']; cot.notes = 'ダイトモ通常時小役の共通12枚俵と、遊技データに直接表示される通常プレイ数を同一サンプルとして使用する。'; }
  o.fieldVerificationItems = (o.fieldVerificationItems ?? []).filter((x) => x.verificationId !== 'VFY_L_YOSHIMUNE_SC2_NORMAL_GAME_DISPLAY');
  write(of, o);
}

// Mahjong: direct AT is a rare strict subset of AT first-hit. Prefer the frequent total first-hit.
// Kotei published rate mixes forced appearances (e.g. after ending / within battle progression), so a stationary independent feature is not justified.
{
  const sf = 'research/L_MAHJONG_MONOGATARI_S2/selection-data.json';
  const s = read(sf);
  s.inputs = removeIds(s.inputs, 'id', ['INP_DIRECT_AT_COUNT','INP_DIRECT_AT_TRIALS','INP_KOTEI_APPEARANCE_COUNT','INP_KOTEI_APPEARANCE_TRIALS']);
  upsert(s.inputs, 'id', { id:'INP_AT_FIRST_HIT_COUNT', name:'AT初当り 回数', category:'SEL_RF_AT_FIRST_HIT', type:'counter', unit:'回', displayOrder:10, inferenceRole:'INCLUDE_PRIMARY', defaultValue:'' });
  upsert(s.inputs, 'id', { id:'INP_AT_FIRST_HIT_TRIALS', name:'有効通常ゲーム数', category:'SEL_RF_AT_FIRST_HIT', type:'integer', unit:'G', displayOrder:11, inferenceRole:'INCLUDE_PRIMARY', defaultValue:'' });
  const at = byId(s.features, 'featureId', 'FEAT_AT_FIRST_HIT');
  Object.assign(at, { adoptionCategory:'INCLUDE_PRIMARY', numeratorInputId:'INP_AT_FIRST_HIT_COUNT', denominatorInputId:'INP_AT_FIRST_HIT_TRIALS', userReason:'AT初当りトータルは全設定値が公開され、直撃よりはるかに高頻度で実戦情報量が大きい。AT直撃を内包するため直撃とは同時に独立乗算せず、こちらを代表採用する。', difficultyParticipation:'EXCLUDE', difficultyExclusionReason:'共通Difficultyの総プレイGから有効通常Gへの根拠ある固定変換率がないため。' });
  delete at.userFacingReason; delete at.rejectionReason;
  const direct = byId(s.features, 'featureId', 'FEAT_DIRECT_AT');
  Object.assign(direct, { adoptionCategory:'EXCLUDE', userFacingReason:'AT直撃はAT初当りトータルに含まれる低頻度な部分事象です。両方を独立に掛けると同じ直撃当選を二重評価するため、より高頻度で実用情報量の大きいAT初当りトータルを代表採用します。', rejectionReason:'AT直撃はAT初当りトータルの厳密な部分集合かつ低頻度。joint/conditional分解用の公開分布がないため独立尤度積を避ける。', difficultyParticipation:'EXCLUDE' });
  delete direct.numeratorInputId; delete direct.denominatorInputId;
  const kotei = byId(s.features, 'featureId', 'FEAT_KOTEI_APPEARANCE');
  Object.assign(kotei, { adoptionCategory:'EXCLUDE', userFacingReason:'公開されている煌帝出現率にはAT中の通常選択だけでなく、エンディング後など必ず出現する経路や進行上の強制出現が混在します。設定差も小さく、強制出現を除いた設定別の条件付き確率が公開されていないため、独立した設定推測要素としては採用しません。', rejectionReason:'AT内の非定常・条件付き生成と強制出現を混在した公開率。強制経路を除外した全設定conditional分布がなく、単純binomial化できない。', difficultyParticipation:'EXCLUDE' });
  delete kotei.numeratorInputId; delete kotei.denominatorInputId;
  s.uiCategoryLabels.SEL_RF_AT_FIRST_HIT = 'AT初当り';
  write(sf, s);

  const uf = 'research/L_MAHJONG_MONOGATARI_S2/ui-design-data.json';
  const u = read(uf);
  u.sectionOrder = ['AT初当り', ...u.sectionOrder.filter((x) => !['AT直撃（前兆昇格除外）','煌帝出現率'].includes(x))];
  delete u.sections['AT直撃（前兆昇格除外）']; delete u.sections['煌帝出現率'];
  u.sections['AT初当り'] = { inputIds:['INP_AT_FIRST_HIT_COUNT','INP_AT_FIRST_HIT_TRIALS'], description:'AT初当りトータルと、それを観測できる有効通常ゲーム数を入力します。低頻度のAT直撃はこの初当りに含まれるため別Featureとして重ねません。', observationRole:'DIRECT_PLAY', observationRefs:['OBS_AT_FIRST_HIT'], acquisitionSources:['DIRECT_PLAY'], collapsible:false, defaultExpanded:true };
  for (const id of ['INP_DIRECT_AT_COUNT','INP_DIRECT_AT_TRIALS','INP_KOTEI_APPEARANCE_COUNT','INP_KOTEI_APPEARANCE_TRIALS']) delete u.inputContracts[id];
  u.inputContracts.INP_AT_FIRST_HIT_COUNT = compactCounter('AT初当り 回数');
  u.inputContracts.INP_AT_FIRST_HIT_TRIALS = numberInput('有効通常ゲーム数');
  u.auditNotes = (u.auditNotes ?? []).filter((x) => !String(x).includes('Bonus初当り/AT初当りtotal'));
  u.auditNotes.push('AT直撃はAT初当りトータルの低頻度な部分事象のため独立併用しない。','煌帝出現率は強制出現を含む非定常な公開率のためInferenceへ使用しない。');
  write(uf, u);

  const of = 'research/L_MAHJONG_MONOGATARI_S2/machine-observation-data.json';
  const o = read(of);
  upsert(o.observations, 'observationId', { observationId:'OBS_AT_FIRST_HIT', sourceType:'DIRECT_PLAY', observationMode:'MANUAL_COUNTER', status:'FOUND', label:'AT初当り 回数・有効通常ゲーム数', categories:['AT初当り 回数','有効通常ゲーム数'], timing:['自己実戦中にAT初当りと有効通常ゲーム数を更新'], excludedConditions:['AT直撃を別Featureとして重ねない','未観測を0として扱わない'], sourceRefs:[], notes:'AT初当りトータルを代表採用。' });
  const dm = byId(o.featureMappings, 'featureId', 'FEAT_DIRECT_AT'); if (dm) dm.usableForInference = false;
  const km = byId(o.featureMappings, 'featureId', 'FEAT_KOTEI_APPEARANCE'); if (km) { km.usableForInference = false; km.notes = '強制出現を含む公開率のためInference不採用。'; }
  upsert(o.featureMappings, 'featureId', { featureId:'FEAT_AT_FIRST_HIT', mappingType:'EXACT', observationIds:['OBS_AT_FIRST_HIT'], collectionMethods:['MANUAL_COUNTER'], usableForInference:true, usableForDifficulty:false, notes:'AT初当りトータルを代表採用。' });
  write(of, o);
}

// Idolmaster: CZ occurs upstream of only part of bonus first hits (published route ratio 6:3:1 for game-count:CZ:rare-role).
// Do not multiply CZ and bonus first hit as independent in the current engine; keep CZ as fallback.
{
  const sf = 'research/L_IDOLMASTER_MILLION_LIVE_HC/selection-data.json';
  const s = read(sf);
  const bonus = byId(s.features, 'featureId', 'FEAT_BONUS_FIRST_HIT');
  bonus.userReason = 'ボーナス初当りは規定ゲーム数・CZ成功・レア役の複数経路を含む最終到達事象で、公開値の設定差も大きいため主Featureとして採用する。';
  const cz = byId(s.features, 'featureId', 'FEAT_CZ_FIRST_HIT');
  Object.assign(cz, { adoptionCategory:'INCLUDE_FALLBACK', userReason:'CZ出現自体にも設定差はあるが、ボーナス当選の約3割がCZ経由で部分的に依存する。現行Engineは一般joint依存を扱わないため、ボーナス初当りが未観測のときだけFallbackとして利用する。', suppressedByFeatureIds:['FEAT_BONUS_FIRST_HIT'] });
  s.inputs.filter((x) => x.category === 'SEL_RF_CZ_FIRST_HIT').forEach((x) => x.inferenceRole = 'INCLUDE_FALLBACK');
  write(sf, s);
}

// Youjitsu: replace internal source labels; clarify normal-cycle CZ type and make Daxel denominator a compact counter.
{
  const sf = 'research/L_YOUJITSU_DE/selection-data.json';
  const s = read(sf);
  const rename = { INP_NORMAL_CYCLE_CZ_TYPE_CAT_GIRLS_CHALLENGE:'ガールズチャレンジ', INP_NORMAL_CYCLE_CZ_TYPE_CAT_MERITOCRACY_ZONE:'実力至上主義ゾーン', INP_BONUS_END_SCREEN_CAT_GROUP_PICTURE:'キャラ集合絵', INP_BONUS_END_SCREEN_CAT_KUSHIDA:'櫛田桔梗' };
  for (const [id,name] of Object.entries(rename)) { const x=byId(s.inputs,'id',id); if(x)x.name=name; }
  const dt = byId(s.inputs,'id','INP_DAXEL_FLASH_TRIALS'); Object.assign(dt,{ name:'CZ成功回数', type:'counter', unit:'回' });
  s.uiCategoryLabels.SEL_RF_NORMAL_CYCLE_CZ_TYPE = '通常周期のCZ種別';
  s.uiCategoryLabels.SEL_RF_BONUS_END_SCREEN = 'よう実BONUS終了画面';
  write(sf,s);
  const uf='research/L_YOUJITSU_DE/ui-design-data.json'; const u=read(uf);
  u.sectionOrder = u.sectionOrder.map((x)=>x==='CZ種別'?'通常周期のCZ種別':x==='GROUP_PICTURE / KUSHIDA'?'よう実BONUS終了画面':x);
  u.sections['通常周期のCZ種別']=u.sections['CZ種別']; delete u.sections['CZ種別'];
  u.sections['通常周期のCZ種別'].description='AT後1・4周期目など全設定共通の特殊周期を除き、通常周期のCZ当選時だけ「ガールズチャレンジ」「実力至上主義ゾーン」をカウントします。メニューのCZ合算回数はここへ代用しません。';
  u.sections['よう実BONUS終了画面']=u.sections['GROUP_PICTURE / KUSHIDA']; delete u.sections['GROUP_PICTURE / KUSHIDA'];
  u.sections['よう実BONUS終了画面'].description='よう実BONUS終了画面の「キャラ集合絵」と「櫛田桔梗」をカウントします。';
  for(const [id,name] of Object.entries(rename)) if(u.inputContracts[id]) u.inputContracts[id].name=name;
  u.inputContracts.INP_DAXEL_FLASH_TRIALS = compactCounter('CZ成功回数');
  u.sections['CZ成功時ダクセルフラッシュ'].description='CZ成功回数を母数として、成功時にダクセルフラッシュが発生した回数を入力します。分子・母数とも＋/－で更新できます。';
  write(uf,u);
}

// Midoridon: weak cherry and weak wave are per-game small-role probabilities over the same play sample.
{
  const sf='research/L_MIDORIDON_VIVA_REVIVAL_FY/selection-data.json'; const s=read(sf);
  s.inputs = removeIds(s.inputs,'id',['INP_WEAK_WAVE_TRIALS']);
  const g=byId(s.inputs,'id','INP_WEAK_CHERRY_TRIALS'); Object.assign(g,{name:'小役集計ゲーム数',unit:'G',displayOrder:17});
  const wc=byId(s.features,'featureId','FEAT_WEAK_CHERRY'); const ww=byId(s.features,'featureId','FEAT_WEAK_WAVE');
  wc.denominatorInputId='INP_WEAK_CHERRY_TRIALS'; ww.denominatorInputId='INP_WEAK_CHERRY_TRIALS';
  for(const f of [wc,ww]) { delete f.difficultyParticipation; delete f.difficultyExclusionReason; f.difficultyExposure={mode:'per_game',factor:1,quality:'EXACT',confidence:'HIGH',basisId:'TOTAL_PLAY_GAMES'}; }
  s.difficultyAnalysis.targetGameBasis={basisId:'TOTAL_PLAY_GAMES',label:'全状態の総プレイゲーム数',quality:'EXACT'};
  write(sf,s);
  const uf='research/L_MIDORIDON_VIVA_REVIVAL_FY/ui-design-data.json'; const u=read(uf);
  u.sectionOrder=['アマゾンゲーム初当り','弱チェリー・弱波',...u.sectionOrder.filter((x)=>!['弱チェリー','弱波 回数 / 弱波 試行数','アマゾンゲーム初当り'].includes(x))];
  delete u.sections['弱チェリー']; delete u.sections['弱波 回数 / 弱波 試行数'];
  u.sections['弱チェリー・弱波']={inputIds:['INP_WEAK_CHERRY_COUNT','INP_WEAK_WAVE_COUNT','INP_WEAK_CHERRY_TRIALS'],description:'弱チェリーと弱波は同じ小役集計ゲーム数を母数としてカウントします。2つの回数は横2列で入力し、母数は1回だけ入力します。',observationRole:'DIRECT_PLAY',observationRefs:['OBS_WEAK_CHERRY','OBS_WEAK_WAVE'],acquisitionSources:['DIRECT_PLAY','LINKED_SERVICE'],collapsible:false,defaultExpanded:true};
  delete u.inputContracts.INP_WEAK_WAVE_TRIALS;
  u.inputContracts.INP_WEAK_CHERRY_COUNT=compactCounter('弱チェリー 回数'); u.inputContracts.INP_WEAK_WAVE_COUNT=compactCounter('弱波 回数'); u.inputContracts.INP_WEAK_CHERRY_TRIALS=numberInput('小役集計ゲーム数');
  write(uf,u);
  const of='research/L_MIDORIDON_VIVA_REVIVAL_FY/machine-observation-data.json'; const o=read(of);
  for(const oid of ['OBS_WEAK_CHERRY','OBS_WEAK_WAVE']) { const ob=byId(o.observations,'observationId',oid); if(ob){ ob.categories=[oid==='OBS_WEAK_CHERRY'?'弱チェリー 回数':'弱波 回数','小役集計ゲーム数']; ob.notes='弱チェリー・弱波は同じ全プレイの小役集計ゲーム数を共通母数として利用する。ユニメモで両小役を自動カウント可能。'; } }
  write(of,o);
}

// Godzilla opponent names: user-facing Katakana.
{
  const map={INP_SHURAI_OPPONENT_CAT_RODAN:'ラドン',INP_SHURAI_OPPONENT_CAT_GIGAN:'ガイガン',INP_SHURAI_OPPONENT_CAT_BIOLLANTE:'ビオランテ',INP_SHURAI_OPPONENT_CAT_DESTOROYAH:'デストロイア',INP_SHURAI_OPPONENT_CAT_KING_GHIDORAH:'キングギドラ'};
  for(const file of ['research/L_GODZILLA_NS/selection-data.json','research/L_GODZILLA_NS/ui-design-data.json']){
    const v=read(file);
    if(v.inputs) for(const [id,name] of Object.entries(map)){const x=byId(v.inputs,'id',id); if(x)x.name=name;}
    if(v.inputContracts) for(const [id,name] of Object.entries(map)) if(v.inputContracts[id]) v.inputContracts[id].name=name;
    write(file,v);
  }
}

// Gundam SEED: expose semantic opportunity labels instead of schema-like bucket IDs.
{
  const names={INP_POST_RESET_ST_100G_CAT_G0_49:'0〜49Gで初回当選',INP_POST_RESET_ST_100G_CAT_G50_99:'50〜99Gで初回当選',INP_POST_RESET_ST_100G_CAT_G100_PLUS:'100G以上で初回当選'};
  const sf='research/L_GUNDAM_SEED_G/selection-data.json'; const s=read(sf); for(const [id,name] of Object.entries(names)){const x=byId(s.inputs,'id',id); if(x)x.name=name;} write(sf,s);
  const uf='research/L_GUNDAM_SEED_G/ui-design-data.json'; const u=read(uf);
  u.sectionOrder=u.sectionOrder.map((x)=>x==='G0_49 / G50_99 / G100_PLUS'?'リセット後・ST終了後の初回CZ/ボーナス':x);
  u.sections['リセット後・ST終了後の初回CZ/ボーナス']=u.sections['G0_49 / G50_99 / G100_PLUS']; delete u.sections['G0_49 / G50_99 / G100_PLUS'];
  u.sections['リセット後・ST終了後の初回CZ/ボーナス'].description='リセット後またはST終了後を1回の機会として、最初のCZまたはボーナス当選が0〜49G・50〜99G・100G以上のどこだったかを1つだけカウントします。1Gごとの確率ではありません。';
  for(const [id,name] of Object.entries(names)) if(u.inputContracts[id]) u.inputContracts[id].name=name;
  write(uf,u);
}

console.log('Applied batch10 real-device review round 2.');
