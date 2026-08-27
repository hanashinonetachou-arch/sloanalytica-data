import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WORKSPACE = path.join(ROOT, 'selection-batch', 'SELECTION_20260827151959');

const decisions = {
  S_MOMOKYUN_SWORD_DX: {
    include: {
      RF_AT_FIRST_HIT: ['INCLUDE_PRIMARY','AT初当りは設定1と設定6で約1.67倍の設定差があり、通常ゲーム数を分母に直接観測できるため主軸として採用します。'],
      RF_AT_MOMOKEN_BONUS: ['INCLUDE_SUPPORT','AT中桃剣BONUSは設定間の確率差が大きく、ATゲーム数を分母に独立したAT中事象として観測できるため補助採用します。'],
      RF_MOMOKEN_ATTACK: ['INCLUDE_SUPPORT','桃剣ATTACKは設定間の発生率差が大きく、ATゲーム数に対する別事象として観測できるため補助採用します。']
    },
    exclude: {
      RF_NORMAL_MOMOKEN_BONUS:'通常時桃剣BONUSは公開設定差が小さく、設定1対6でも必要試行量が非常に大きいため情報量が低く不採用です。',
      RF_SUIKA:'スイカは全設定で確率差が小さく、単独で必要となる試行量が大きいため主推測への追加情報量が小さく不採用です。',
      RF_ONI_BATTLE_R1:'鬼決戦1戦目は設定差が小さいうえ日常対決を含む集計で、日常対決との重複を安全に分離できないため不採用です。',
      RF_ONI_BATTLE_R2:'鬼決戦2戦目は到達条件付きで設定差も小さく、有効試行数が限られ情報量が低いため不採用です。',
      RF_ONI_BATTLE_R3:'鬼決戦3戦目は到達条件付きで設定差も小さく、有効試行数が限られ情報量が低いため不採用です。',
      RF_ONI_BATTLE_R4:'鬼決戦4戦目は到達条件付きで設定差も小さく、有効試行数が限られ情報量が低いため不採用です。',
      RF_AT_DIRECT:'AT直撃は全設定の確率差がごく小さく、通常ゲーム数に対する単独情報量が低いため不採用です。',
      RF_HYOI_BALL:'憑依玉別勝率は複数条件の組合せごとに試行が分散し、実戦内で十分な母数を得にくいため数値推測には不採用です。',
      RF_DAILY_BATTLE:'日常対決は鬼決戦1戦目集計に含まれる関係があり、同じ勝敗情報を二重評価しないため数値推測には不採用です。'
    }
  },
  S_SHIN_ORE_NO_SORA_ST: {
    include:{RF_AT_FIRST_HIT:['INCLUDE_PRIMARY','AT初当りは設定1対6の識別効率が高く、通常ゲーム数を分母に直接観測できるため主軸として採用します。']},
    exclude:{
      RF_CZ_FIRST_HIT:'CZ初当りは設定差が小さく、設定1対6でも必要試行量が非常に大きいため情報量が低く不採用です。',
      RF_SUIKA:'スイカは設定差が小さく必要試行量が大きいため、AT初当りへ加える実用的な情報量が低く不採用です。',
      RF_ORE_BONUS_BGM:'俺ボーナス開始時BGMは設定別の公開振り分けがなく、尤度として定量化できないため数値Featureには不採用です。'
    }
  },
  S_MORE_CHIBARIYO_NB_30: {
    include:{RF_BONUS_FIRST_HIT:['INCLUDE_PRIMARY','ボーナス初当りはデータカウンターから自然に観測でき、設定差は弱いものの低負担で継続的な母数を確保できるため主軸として採用します。']},
    exclude:{
      RF_WEAK_CHERRY_BONUS:'弱チェリー契機当選は設定差が非常に小さく必要試行量が大きいうえ、疑似遊技チェリーと実ゲーム数の分母定義に注意が必要なため不採用です。',
      RF_TEMPAI_VOICE:'テンパイボイスは高設定示唆の存在のみ公開され、設定別出現率が公開されていないため数値推測には不採用です。'
    }
  },
  S_OKIDOKI_GOLD_GS: {
    include:{RF_BONUS_FIRST_HIT:['INCLUDE_PRIMARY','ボーナス初当りは通常ゲーム数を分母に直接観測でき、モード判別を要求せず設定差を利用できるため主軸として採用します。']},
    exclude:{
      RF_CHERRY_B:'チェリーBには設定差がありますが、停止形でA/Bを正確に判別する必要があり、単独情報量に対して誤分類リスクが大きいため不採用です。',
      RF_CONFIRMED_ROLE_B:'確定役Bは設定差が大きい一方で極端に低頻度で、実戦範囲では有効な母数を得にくいため数値推測には不採用です。',
      RF_MODE_AB_BONUS:'通常A/B滞在時ボーナス率はモード滞在ゲーム数を正確に判別できず、公開分母を実戦で再現できないため不採用です。'
    }
  },
  L_SALARYMAN_KINTARO_ET: {
    include:{RF_AT_FIRST_HIT:['INCLUDE_PRIMARY','金太郎チャンス初当りは設定差が比較的大きく、通常ゲーム数を分母に直接観測できるため主軸として採用します。']},
    exclude:{
      RF_BONUS_FIRST_HIT:'BONUS初当りは設定差が小さく、AT初当りと同じ通常時の当選経路に強く依存するため二重評価を避けて不採用です。',
      RF_CHANCE_ME:'チャンス目合算は全設定で確率差がごく小さく、単独情報量が低いため不採用です。',
      RF_SINGLE_BONUS_AT_NORMAL:'シングルBONUS中AT当選はAT初当りの部分集合で、主軸AT初当りと同時採用すると同じAT当選を重複評価するため不採用です。',
      RF_CHANCE_ME_BONUS_NORMAL:'通常滞在時チャンス目からのBONUS当選はBONUS初当りの条件付き内訳で、AT初当りを含む通常時当選経路との依存を安全に分離しない現行構成では不採用です。',
      RF_CHANCE_ME_AT_NORMAL:'通常滞在時チャンス目からのAT当選はAT初当りの部分集合で、主軸AT初当りとの二重評価を避けるため不採用です。',
      RF_CHANCE_ME_BONUS_HIGH:'高確滞在時チャンス目からのBONUS当選は内部状態の正確な判別が必要で、公開条件と同じ分母を安定して再現できないため不採用です。',
      RF_CHANCE_ME_AT_HIGH:'高確滞在時チャンス目からのAT当選は内部状態判別が必要かつAT初当りの部分集合で、二重評価と分母誤認を避けるため不採用です。',
      RF_MYSTERY_HIT:'謎当りは設定差の存在は確認できるものの全設定の公開確率がなく、尤度を定量化できないため不採用です。',
      RF_GAME_AT:'規定G数AT当選は設定差の存在は確認できるものの全設定の公開振り分けがなく、数値尤度を構成できないため不採用です。',
      RF_AT_STOCK:'ATストック振り分けは設定差の存在のみで全設定分布が公開されておらず、定量化できないため不採用です。',
      RF_CHERRY_NAV:'チェリーナビ回数は設定差の存在のみで全設定分布が公開されておらず、定量化できないため不採用です。'
    }
  },
  L_NYANKO_DAISENSO_CHOSHINSOKU_KB: {
    include:{RF_AT_FIRST_HIT:['INCLUDE_PRIMARY','AT初当りは通常ゲーム数を分母に直接観測でき、設定間で一貫した差があるため主軸として採用します。']},
    exclude:{
      RF_NORMAL_MODE_AT:'通常モード滞在時AT当選率は設定差が大きいものの、内部モード滞在ゲーム数を実戦で直接判別できず公開分母を再現できないため不採用です。',
      RF_CZ_FIRST_HIT:'大狂乱のネコ島初当りは設定差が小さく、AT初当りへ追加する情報量が限定的なため不採用です。',
      RF_KYORAN_HIGH_LOWER_BELL:'下段ベルからの狂乱高確移行は状態移行の判定条件が複雑で、公開条件と同じ試行母数を安定して再現しにくいため不採用です。',
      RF_KYORAN_HIGH_UPPER_RIGHT_BELL:'右上がりベルからの狂乱高確移行は状態移行の判定条件が複雑で、公開条件と同じ試行母数を安定して再現しにくいため不採用です。',
      RF_222G_CEILING:'222G天井選択は高設定示唆とされるものの設定別選択率が公開されておらず、数値尤度を構成できないため不採用です。',
      RF_MUSO_EARLY:'夢想への早期移行は高設定ほど優遇されるものの具体的な全設定振り分けが公開されておらず、定量化できないため不採用です。',
      RF_KAMISAMA_BGM:'神さま勝撫中の楽曲変化は高設定示唆の存在のみで設定別発生率が公開されておらず、数値推測には不採用です。'
    }
  },
  L_NANATSU_NO_MAKEN_PU: {
    include:{RF_ST_FIRST_HIT:['INCLUDE_PRIMARY','ST初当りは設定1対6で大きな設定差があり、通常ゲーム数を分母に直接観測できるため主軸として採用します。']},
    exclude:{
      RF_BONUS_FIRST_HIT:'ボーナス初当りはST初当りへつながる上流事象で、両方を独立に加えると同じ好挙動を重複評価しやすいため不採用です。',
      RF_250G_HIT:'250G消化時ボーナス当選は設定差候補ですが設定別当選率が公開されておらず、尤度として定量化できないため不採用です。',
      RF_PROLOGUE_END_SCREEN:'プロローグBONUS終了画面は奇偶示唆の内容のみで設定別選択率が公開されておらず、数値Featureには不採用です。',
      RF_KIMBERLY_CHAR:'キンバリーBONUS中キャラ紹介は示唆カテゴリのみで全設定の選択率が公開されておらず、数値Featureには不採用です。'
    }
  },
  L_DISCUP_ULTRA_REMIX_XR: {
    include:{
      RF_BONUS_OUTCOME:['INCLUDE_PRIMARY','BIG・REG内訳は通常ゲーム数に対して自然に観測でき、特にREG確率に設定差があるため主軸として採用します。'],
      RF_THREE_COIN:['INCLUDE_SUPPORT','3枚役は高頻度でマイスロ等から観測しやすく、ボーナスとは別の成立役情報として独立に追加できるため補助採用します。']
    },
    exclude:{
      RF_WATERMELON_A:'スイカAは設定差が小さく、3枚役を採用した後の追加情報量が限定的なため不採用です。',
      RF_REACH_T2:'リーチ目役T2は低頻度で、BIG・REG主軸へ追加する実戦範囲の情報量が限定的なため不採用です。',
      RF_REACH_T3:'リーチ目役T3は極端に低頻度で実戦範囲の母数を得にくいため不採用です。',
      RF_REACH_A2:'リーチ目役A2は極端に低頻度で実戦範囲の母数を得にくいため不採用です。',
      RF_REACH_D2:'リーチ目役D2は低頻度で、成立後ボーナス内訳とも依存するため現行構成では不採用です。',
      RF_REACH_G2:'リーチ目役G2は低頻度で、成立後ボーナス内訳とも依存するため現行構成では不採用です。',
      RF_CONFIRMED_CHERRY:'確定チェリーは低頻度で、成立後ボーナス内訳とも依存するため実戦範囲では不採用です。',
      RF_D2_BONUS_TYPE:'D2成立時ボーナス種別はD2成立率と条件付きで安全に構成できますが、D2自体が低頻度で実戦内母数が少ないため不採用です。',
      RF_G2_BONUS_TYPE:'G2成立時ボーナス種別はG2自体が低頻度で実戦内母数が少ないため不採用です。',
      RF_T2_BONUS_TYPE:'T2成立時ボーナス種別はT2成立回数を十分に得にくく、主軸ボーナス内訳への追加情報量が限定的なため不採用です。',
      RF_CONFIRMED_CHERRY_BONUS_TYPE:'確定チェリー成立時ボーナス種別は確定チェリー自体が低頻度で、十分な条件付き母数を得にくいため不採用です。',
      RF_BIG_SUIKA_ULTRA:'BIG中スイカからのULTRA上乗せは極端に低頻度で、実戦範囲では有効な母数を得にくいため不採用です。',
      RF_REG_HINT_MODE:'REG中示唆カテゴリは設定下限・確定パターンと同一観測内で重なるため、確定情報をEvidenceとして優先し数値分布は二重評価防止のため不採用です。'
    }
  },
  L_STAR_HANAHANA_MX: {
    include:{RF_BONUS_OUTCOME:['INCLUDE_PRIMARY','BIG・REG確率は通常ゲーム数に対して直接観測でき、REGを中心に設定差が大きいため主軸として採用します。']},
    exclude:{
      RF_NORMAL_BELL:'通常時ベルは設定差候補ですが全設定の公開確率が揃っておらず、数値尤度を構成できないため不採用です。',
      RF_REG_SIDE_LAMP:'REG中サイドランプは示唆内容のみで設定別選択率が公開されておらず、数値Featureには不採用です。',
      RF_BIG_END_FEATHER:'BIG終了時フェザーランプは高設定期待度の序列のみで設定別選択率が公開されておらず、数値Featureには不採用です。'
    }
  },
  L_SHIN_EVANGELION: {
    include:{
      RF_FIRST_HIT:['INCLUDE_PRIMARY','初当り合算は通常ゲーム数を分母に直接観測でき、設定1から6へ一貫した設定差があるため主軸として採用します。'],
      RF_REI_NAV:['INCLUDE_SUPPORT','レイチャンスのナビ種別は成功時ごとに排他的に観測でき、設定別の完全分布が公開されているため補助採用します。']
    },
    exclude:{
      RF_WITHIN_150G_HIT:'150G以内初当りは初当りタイミングの情報で主軸初当りと同じ当選過程を共有し、独立尤度として加えると二重評価になるため不採用です。',
      RF_REI_CHANCE_PICTURE:'レイチャンス成功画面は設定差がありますが月背景・ロングヘアが設定下限・確定Evidenceと同一観測なので、Evidenceを優先して数値分布は不採用です。',
      RF_BONUS_END_SCREEN:'ボーナス終了画面は設定別振り分けのResearch数値が未整備で、確定枠はEvidenceとして扱えるものの非確定部分の尤度を再現できないため数値Featureには不採用です。',
      RF_ST_AFTER_MODE_0:'ST駆け抜け後のモード振り分けは内部モードを直接観測できず、公開分布と同じカテゴリ判定を実戦で再現できないため不採用です。',
      RF_ST_AFTER_MODE_1:'ST2回連続駆け抜け後のモード振り分けは内部モードを直接観測できず、公開分布と同じカテゴリ判定を実戦で再現できないため不採用です。',
      RF_ST_AFTER_MODE_2PLUS:'ST3回以上連続駆け抜け後のモード振り分けは内部モードを直接観測できず、公開分布と同じカテゴリ判定を実戦で再現できないため不採用です。',
      RF_HEAVEN_MODE:'天国移行率は全設定で約35.8～35.9%とほぼ同一で、設定推測情報量が実質的にないため不採用です。',
      RF_INTERNAL_STATE:'内部状態移行は全設定の公開値が揃っておらず、状態自体も直接観測できないため不採用です。',
      RF_STATE_ROLE_HIT:'状態別レア役初当り抽選は全設定値が揃わず、内部状態の正確な判別も必要なため不採用です。'
    }
  }
};

function inputTypeForFeature(rf){ return rf.candidateModel === 'multinomial' ? 'counter' : 'counter'; }
function safeId(s){ return String(s).replace(/^RF_/, '').replace(/[^A-Z0-9_]/g,'_'); }
function ensureInput(inputs, spec){ if(!inputs.some(x=>x.id===spec.id)) inputs.push(spec); }

function buildSelection(research, cfg){
  const inputs=[]; const features=[]; let order=10;
  const categoryLabels={NUMERIC:'設定推測要素'};
  const denomByKey=new Map();
  const makeDenom=(rf)=>{
    const key=rf.trialUnit||rf.denominatorDefinition||'試行回数';
    if(denomByKey.has(key)) return denomByKey.get(key);
    const id=`INP_${safeId(key.normalize('NFKC').toUpperCase()).slice(0,45)}_TRIALS`.replace(/_+/g,'_');
    ensureInput(inputs,{id,name:rf.denominatorDefinition||rf.trialUnit||'試行回数',type:'integer',category:'NUMERIC',unit:(String(rf.trialUnit||'').includes('ゲーム')?'G':'回'),displayOrder:order++,inferenceRole:'INCLUDE_PRIMARY',defaultValue:null,observationScope:'SELF_PLAY'});
    denomByKey.set(key,id); return id;
  };
  for(const rf of research.features??[]){
    const inc=cfg.include?.[rf.researchFeatureId];
    if(!inc){ features.push({researchFeatureId:rf.researchFeatureId,featureId:`FEAT_${safeId(rf.researchFeatureId)}_EXCLUDED`,adoptionCategory:'EXCLUDE',userReason:cfg.exclude?.[rf.researchFeatureId]||'公開条件・観測分母・依存関係のいずれかが現行推測モデルで安全に再現できないため不採用です。'}); continue; }
    const [category, reason]=inc;
    if(rf.candidateModel==='binomial'){
      const den=makeDenom(rf), num=`INP_${safeId(rf.researchFeatureId)}_COUNT`;
      ensureInput(inputs,{id:num,name:rf.name,type:inputTypeForFeature(rf),category:'NUMERIC',unit:'回',displayOrder:order++,inferenceRole:category==='INCLUDE_PRIMARY'?'INCLUDE_PRIMARY':'INCLUDE_SUPPORT',defaultValue:null,parentInputId:den});
      const perGame=String(rf.trialUnit||'').includes('通常ゲーム');
      features.push({researchFeatureId:rf.researchFeatureId,featureId:`FEAT_${safeId(rf.researchFeatureId)}`,adoptionCategory:category,numeratorInputId:num,denominatorInputId:den,weight:1,difficultyParticipation:perGame?'INCLUDE':'EXCLUDE',...(perGame?{difficultyExposure:{mode:'per_game',factor:1,quality:'EXACT',basisId:'NORMAL_GAMES'}}:{}),userReason:reason});
    } else if(rf.candidateModel==='multinomial'){
      const cats=rf.categories??[];
      const ids=cats.map((c,i)=>{const id=`INP_${safeId(rf.researchFeatureId)}_${safeId(c)}`;ensureInput(inputs,{id,name:`${rf.name} ${c}`,type:'counter',category:'NUMERIC',unit:'回',displayOrder:order++,inferenceRole:category==='INCLUDE_PRIMARY'?'INCLUDE_PRIMARY':'INCLUDE_SUPPORT',defaultValue:null});return id;});
      features.push({researchFeatureId:rf.researchFeatureId,featureId:`FEAT_${safeId(rf.researchFeatureId)}`,adoptionCategory:category,numeratorInputId:ids[0],categoryInputIds:ids.slice(1),inputTransform:'sum_inputs_to_trials',weight:1,difficultyParticipation:'EXCLUDE',userReason:reason});
    }
  }
  const evidenceOptions=(research.evidenceCandidates??[]).map((e,i)=>({value:`EV_${i+1}`,label:e.name,allowedSettings:e.allowedSettings??[],excludedSettings:e.deniedSettings??[],sourceEvidenceIds:[e.researchEvidenceId]}));
  const evidenceUi=evidenceOptions.length?{groups:[{groupId:'SETTING_EVIDENCE',label:'設定確定・設定下限情報',category:'EVIDENCE',selectionMode:'multi',normalizationMode:'ALLOWED_SETTINGS_INTERSECTION',displayOrder:100,options:evidenceOptions}]}:{groups:[]};
  if(evidenceOptions.length) categoryLabels.EVIDENCE='設定確定・示唆';
  return {schemaVersion:'selection-data-v1',machineId:research.machine.machineId,machineDataVersion:research.machine.machineDataVersion||'0.1.0',uiCategoryLabels:categoryLabels,inputs,features,evidenceUi,rejectedElements:[]};
}

if(!fs.existsSync(WORKSPACE)) throw new Error(`workspace not found: ${WORKSPACE}`);
for(const [id,cfg] of Object.entries(decisions)){
  const researchPath=path.join(ROOT,'research',id,'research-data.json');
  const outPath=path.join(WORKSPACE,id,'selection-data.json');
  const research=JSON.parse(fs.readFileSync(researchPath,'utf8'));
  const selection=buildSelection(research,cfg);
  fs.writeFileSync(outPath,JSON.stringify(selection,null,2)+'\n','utf8');
  console.log(`wrote ${path.relative(ROOT,outPath)}`);
}
console.log('SelectionData drafts generated for 10 machines. Run selection:batch -- --ingest ... --check before ingest.');
