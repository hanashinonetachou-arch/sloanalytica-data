import fs from 'node:fs';

const IDS = [
  'L_SEIYA_KAIOU_ED',
  'L_STREET_FIGHTER5_ZD',
  'L_BOFURI_FN',
  'L_SYMPHOGEAR_SEIGI_JA',
  'L_HOKUTO_MUSOU_FS',
  'S_KIN_NO_KABOCHA_AA',
  'S_BAHAMA_A3_30',
  'S_OKIDOKI_BLACK_EP',
  'S_AOHARU_MISAO_A2',
  'S_DANMACHI2_XZ',
];

const audit = {
  L_SEIYA_KAIOU_ED: {
    menu: {status:'checked', availableData:['総ゲーム数','現在GBスルー回数','弱チェリー確率','強チェリー確率','スイカ確率','チャンス目確率','前回GB終了画面'], notes:'再調査で火時計PUSHの遊技履歴から取得可能と確認。総Gは自分区間Gの補助、前回GB終了画面は着席時Evidence確認に利用可能。小役は率表示のため、前任者区間の正確な回数へ機械変換しない。'},
    linked: {status:'unresolved', checkedServices:[], availableData:[], notes:'専用連動サービスの具体的取得項目は公開情報から確定できず。撤去等で実機確認困難な場合に備え、未確認事項として内部保持。'}
  },
  L_STREET_FIGHTER5_ZD: {
    menu: {status:'checked', availableData:['総ゲーム数','現在ゲーム数','ワールドチャレンジ回数','総目押し回数','EXCELLENT/GREAT/MISS','ボーナス直撃の確認'], notes:'再調査で筐体の遊技データ画面を確認。総G差分は自分区間ゲーム数入力の補助に利用できる。直撃情報はメニュー確認可能だが、前任者区間の完全な回数・分母として使えるとは断定しない。'},
    linked: {status:'unresolved', checkedServices:[], availableData:[], notes:'専用連動サービスの具体的取得項目は未確定。内部確認項目として保持。'}
  },
  L_BOFURI_FN: {
    menu: {status:'checked', availableData:['データカウンタ累計ゲーム数','データカウンタ上のボーナス回数'], notes:'データカウンタ上のトータルボーナス合算に設定別公表値があり、夕方からの判別利用が明示されているため前任者区間Featureへ採用。'},
    linked: {status:'checked', checkedServices:['マイスロ'], availableData:['総ゲーム数（擬似遊技を含む）'], notes:'マイスロ対応を確認。総Gには擬似遊技が含まれるため、上段5枚ベルの分母へそのまま使用しない。'}
  },
  L_SYMPHOGEAR_SEIGI_JA: {
    menu: {status:'unresolved', availableData:[], notes:'筐体メニュー/遊技履歴の具体的累計項目を公開情報から特定できず。撤去等で実機確認困難な場合に備え内部未確認項目として保持。'},
    linked: {status:'unresolved', checkedServices:[], availableData:[], notes:'連動機能の具体取得項目は未確定。'}
  },
  L_HOKUTO_MUSOU_FS: {
    menu: {status:'unresolved', availableData:[], notes:'筐体内累計項目は未確定。ホールカウンタ情報と混同しない。'},
    linked: {status:'checked', checkedServices:['マイスロ'], availableData:['スイカ回数/確率の自動集計'], notes:'マイスロ対応およびスイカ自動集計を確認。自分のマイスロ区間の値として利用し、前任者区間データとはみなさない。'}
  },
  S_KIN_NO_KABOCHA_AA: {
    menu: {status:'unresolved', availableData:[], notes:'公開情報不足。実機確認困難な可能性を考慮し内部未確認項目として保持。'},
    linked: {status:'unresolved', checkedServices:[], availableData:[], notes:'実機連動機能の有無・具体取得項目は未確定。'}
  },
  S_BAHAMA_A3_30: {
    menu: {status:'unresolved', availableData:[], notes:'公開情報不足。内部未確認項目として保持。'},
    linked: {status:'unresolved', checkedServices:[], availableData:[], notes:'実機連動機能の有無・具体取得項目は未確定。'}
  },
  S_OKIDOKI_BLACK_EP: {
    menu: {status:'unresolved', availableData:[], notes:'ホールのデータカウンタではBIG・REG・累計・現在Gを利用できるが、筐体メニュー固有の累計項目は未特定。モード依存が強いため単純な前任者ボーナスFeature化は保留。'},
    linked: {status:'unresolved', checkedServices:[], availableData:[], notes:'実機連動機能の具体取得項目は未確定。'}
  },
  S_AOHARU_MISAO_A2: {
    menu: {status:'unresolved', availableData:[], notes:'ホールカウンタのBB/RB/総Gは利用可能だが、筐体独自の累計画面は公開情報から確定できず。内部未確認項目として保持。'},
    linked: {status:'unresolved', checkedServices:[], availableData:[], notes:'連動機能の具体取得項目は未確定。'}
  },
  S_DANMACHI2_XZ: {
    menu: {status:'unresolved', availableData:[], notes:'北電子公式を含め確認したが、筐体メニューの累計項目を特定できず。内部未確認項目として保持。'},
    linked: {status:'unresolved', checkedServices:[], availableData:[], notes:'実機連動サービスの有無・具体取得項目を確定できず。'}
  },
};

function read(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }
function write(p,v){ fs.writeFileSync(p, JSON.stringify(v,null,2)+'\n'); }
function getInput(sel,id){ const x=sel.inputs.find(i=>i.id===id); if(!x) throw new Error(`${sel.machineId}: missing ${id}`); return x; }

for (const id of IDS) {
  const p=`research/${id}/research-data.json`;
  const r=read(p);
  r.machineMenuResearch=audit[id].menu;
  r.linkedMachineServiceResearch=audit[id].linked;
  write(p,r);
}

// 聖闘士星矢: 遊技履歴を自分区間Gと小役確認の入力補助として明示。
{
  const p='research/L_SEIYA_KAIOU_ED/selection-data.json';
  const s=read(p); s.machineDataVersion='0.1.1';
  getInput(s,'INP_NORMAL_GAMES').description='火時計PUSH→遊技履歴の総ゲーム数を着席時と現在で比較し、自分区間の通常G入力の目安にできます。AT/CZ等を含む表示値と通常Gの定義が一致しない場合は、その差分をそのまま使用しないでください。';
  getInput(s,'INP_WEAK_CHERRY').description='遊技履歴では弱チェリー確率を確認できます。前任者込みの率表示を自分区間の回数へ逆算せず、自分で数えた回数を入力してください。';
  write(p,s);
}

// ストV: 遊技データ総G差分とメニュー直撃確認を入力補助として明示。
{
  const p='research/L_STREET_FIGHTER5_ZD/selection-data.json';
  const s=read(p); s.machineDataVersion='0.1.1';
  getInput(s,'INP_NORMAL_GAMES').description='筐体の遊技データに表示される総ゲーム数を着席時と現在で比較し、自分区間Gの入力補助にできます。表示総Gと設定推測上の通常Gの範囲が異なる場合は補正してください。';
  getInput(s,'INP_SUIKA_DIRECT').description='スイカからのボーナス直撃回数。メニュー画面でも直撃の有無を確認できますが、自分区間の分子として数える場合は着席前の履歴を混ぜないでください。';
  write(p,s);
}

// 真・北斗無双: マイスロのスイカ自動集計を正規の取得手段として案内。
{
  const p='research/L_HOKUTO_MUSOU_FS/selection-data.json';
  const s=read(p); s.machineDataVersion='0.1.1';
  getInput(s,'INP_SUIKA').description='マイスロ起動時はスイカを自動集計できます。自分のマイスロ区間と通常ゲーム数の集計範囲を揃えて入力してください。';
  write(p,s);
}

// 防振り: データカウンタ上のトータルボーナス合算を前任者区間として採用。
{
  const rp='research/L_BOFURI_FN/research-data.json';
  const r=read(rp);
  if (!r.features.some(f=>f.researchFeatureId==='RF_PREDECESSOR_COUNTER_BONUS')) {
    const den=[122.4,119.6,115.1,102.8,95.7,90.0];
    const settings=['SET_1','SET_2','SET_3','SET_4','SET_5','SET_6'];
    r.features.unshift({
      researchFeatureId:'RF_PREDECESSOR_COUNTER_BONUS',
      name:'データカウンタ上のトータルボーナス合算',
      factStatus:'verified',
      candidateModel:'binomial',
      trialUnit:'データカウンタ累計ゲーム',
      numeratorDefinition:'データカウンタ上のボーナス回数',
      denominatorDefinition:'データカウンタ累計ゲーム数',
      settingValues:Object.fromEntries(settings.map((x,i)=>[x,{probability:1/den[i],rawDisplay:`1/${den[i]}`,numerator:1,denominator:den[i]}])),
      sourceRefs:['SRC_ALT'],
      crossSourceStatus:'single_source',
      notes:'防御状態中を含むトータル合算。公開解析で夕方からの設定判別利用が明示されているため、着席時スナップショットを前任者区間Featureとして採用。'
    });
  }
  write(rp,r);

  const sp='research/L_BOFURI_FN/selection-data.json';
  const s=read(sp); s.machineDataVersion='0.1.1';
  s.uiCategoryLabels={PREDECESSOR:'着席時データ', ...s.uiCategoryLabels};
  if (!s.inputs.some(i=>i.id==='INP_PREDECESSOR_COUNTER_GAMES')) {
    s.inputs.unshift(
      {id:'INP_PREDECESSOR_COUNTER_GAMES',name:'着席時累計ゲーム数',type:'integer',category:'PREDECESSOR',displayOrder:1,defaultValue:0,unit:'G',observationScope:'PREDECESSOR_SNAPSHOT',description:'着席時にデータカウンタへ表示されている累計ゲーム数を入力します。前任者区間のトータルボーナス合算評価に使用します。'},
      {id:'INP_PREDECESSOR_COUNTER_BONUS',name:'着席時ボーナス回数',type:'counter',category:'PREDECESSOR',displayOrder:2,defaultValue:0,unit:'回',observationScope:'PREDECESSOR_SNAPSHOT',parentInputId:'INP_PREDECESSOR_COUNTER_GAMES',description:'着席時のデータカウンタ上のボーナス回数を入力します。機種内のボーナス種別を分けず、カウンタのトータル回数を使用します。'}
    );
  }
  if (!s.features.some(f=>f.featureId==='FEAT_PREDECESSOR_COUNTER_BONUS')) {
    s.features.unshift({
      researchFeatureId:'RF_PREDECESSOR_COUNTER_BONUS',
      featureId:'FEAT_PREDECESSOR_COUNTER_BONUS',
      adoptionCategory:'INCLUDE_SUPPORT',
      numeratorInputId:'INP_PREDECESSOR_COUNTER_BONUS',
      denominatorInputId:'INP_PREDECESSOR_COUNTER_GAMES',
      minimumSample:300,
      sampleRecommendation:3000,
      weight:1,
      displayFormat:'ratio_1_over_n',
      difficultyParticipation:'EXCLUDE',
      userReason:'データカウンタ上のトータルボーナス合算に設定差があり、着席前の区間を独立した観測として利用できるため採用。',
      difficultyExclusionReason:'共通Difficultyは自分が遊技したゲーム数のみを評価するため、着席前の前任者区間は含めない。'
    });
  }
  getInput(s,'INP_BELL_GAMES').description='上段5枚ベルを実際に観測した対象ゲーム数を入力します。マイスロ総Gには擬似遊技が含まれるため、その総Gを分母へ直接入力しないでください。';
  write(sp,s);
}

console.log('menu/predecessor reaudit applied');
