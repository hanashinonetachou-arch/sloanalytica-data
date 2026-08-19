import fs from 'node:fs';

const researchPath = 'research/L_MONKEY_TURN5_CE/research-data.json';
const selectionPath = 'research/L_MONKEY_TURN5_CE/selection-data.json';
const research = JSON.parse(fs.readFileSync(researchPath, 'utf8'));
const selection = JSON.parse(fs.readFileSync(selectionPath, 'utf8'));

const sourceId = 'SRC_MONKEY_EX_ITEM';
if (!research.sources.some(s => s.sourceId === sourceId)) {
  research.sources.push({
    sourceId,
    publisher: 'なな徹',
    title: 'スマスロモンキーターンV EXアイテムの種類・恩恵・設定ごとの獲得率',
    url: 'https://nana-press.com/kaiseki/machine/644/21244/',
    checkedAt: '2026-08-19',
    sourceType: 'major_analysis'
  });
}

const settings = ['SET_1','SET_2','SET_4','SET_5','SET_6'];
const defs = [
  {
    id: 'RF_GEKSOU_EX_WEAK',
    name: '激走チャージ中 ボート・弱チェリーからのEXアイテム獲得率',
    numerator: '激走チャージ中のボート・弱チェリー成立時にEXアイテムを獲得した回数',
    denominator: '激走チャージ中のボート・弱チェリー成立回数',
    values: [0.25,0.262,0.328,0.391,0.43],
    raw: ['25.0%','26.2%','32.8%','39.1%','43.0%'],
    note: '設定1の25.0%から設定6の43.0%まで差が大きい。成立役と獲得成否をその場で直接観測でき、極端設定間の80%分離目安は約50試行。'
  },
  {
    id: 'RF_GEKSOU_EX_WEAK_CHANCE',
    name: '激走チャージ中 弱チャンス目からのEXアイテム獲得率',
    numerator: '激走チャージ中の弱チャンス目成立時にEXアイテムを獲得した回数',
    denominator: '激走チャージ中の弱チャンス目成立回数',
    values: [0.313,0.32,0.375,0.406,0.469],
    raw: ['31.3%','32.0%','37.5%','40.6%','46.9%'],
    note: '設定1の31.3%から設定6の46.9%まで差があり、成立役と獲得成否を直接観測できる。極端設定間の80%分離目安は約71試行。'
  },
  {
    id: 'RF_GEKSOU_EX_STRONG_CHANCE',
    name: '激走チャージ中 強チャンス目からのEXアイテム獲得率',
    numerator: '激走チャージ中の強チャンス目成立時にEXアイテムを獲得した回数',
    denominator: '激走チャージ中の強チャンス目成立回数',
    values: [0.5,0.508,0.586,0.625,0.664],
    raw: ['50.0%','50.8%','58.6%','62.5%','66.4%'],
    note: '設定1の50.0%から設定6の66.4%まで差がある。強チェリーは全設定100%のため推測対象から除外し、強チャンス目だけを独立集計する。極端設定間の80%分離目安は約66試行。'
  }
];

for (const d of defs) {
  const feature = {
    researchFeatureId: d.id,
    name: d.name,
    factStatus: 'verified',
    candidateModel: 'binomial',
    trialUnit: '対象レア小役成立',
    observationScope: '激走チャージ中',
    numeratorDefinition: d.numerator,
    denominatorDefinition: d.denominator,
    settingValues: Object.fromEntries(settings.map((s,i)=>[s,{probability:d.values[i],rawDisplay:d.raw[i]}])),
    sourceRefs: [sourceId],
    crossSourceStatus: 'multi_source_consistent',
    notes: d.note
  };
  const idx = research.features.findIndex(f => f.researchFeatureId === d.id);
  if (idx >= 0) research.features[idx] = feature; else research.features.push(feature);
}

const numeric = research.researchCompleteness?.numericSurfaces;
if (Array.isArray(numeric)) {
  const target = numeric.find(x => x.surface === 'event_success_rate');
  if (target) {
    target.sourceRefs = [...new Set([...(target.sourceRefs ?? []), sourceId])];
    target.notes = '強レア役AT直撃率に加え、激走チャージ中のEXアイテム獲得率を成立役別に数値Feature候補化。強チェリーは全設定100%のため除外。';
  }
}

const newInputs = [
  ['INP_EX_WEAK_TRIALS','ボート・弱チェリー成立回数',40],
  ['INP_EX_WEAK_HITS','EX獲得回数',41],
  ['INP_EX_WEAK_CHANCE_TRIALS','弱チャンス目成立回数',42],
  ['INP_EX_WEAK_CHANCE_HITS','EX獲得回数',43],
  ['INP_EX_STRONG_CHANCE_TRIALS','強チャンス目成立回数',44],
  ['INP_EX_STRONG_CHANCE_HITS','EX獲得回数',45]
];
for (const [id,name,displayOrder] of newInputs) {
  const input = {id,name,type:'counter',category:'GEKSOU_EX_ITEM',unit:'回',displayOrder,defaultValue:0,
    description:id.endsWith('_TRIALS')?'激走チャージ中のみカウントします。強チェリーは全設定100%のため含めません。':'対応する成立役のうち、EXアイテムを獲得した回数を入力します。'};
  const idx = selection.inputs.findIndex(x => x.id === id);
  if (idx >= 0) selection.inputs[idx] = input; else selection.inputs.push(input);
}

const newFeatures = [
  {researchFeatureId:'RF_GEKSOU_EX_WEAK',featureId:'FEAT_GEKSOU_EX_WEAK',numeratorInputId:'INP_EX_WEAK_HITS',denominatorInputId:'INP_EX_WEAK_TRIALS',sampleRecommendation:50,userReason:'激走チャージ中のボート・弱チェリーからのEX獲得率は25.0%→43.0%と差が大きく、成立役と結果を直接観測できるため補助採用。'},
  {researchFeatureId:'RF_GEKSOU_EX_WEAK_CHANCE',featureId:'FEAT_GEKSOU_EX_WEAK_CHANCE',numeratorInputId:'INP_EX_WEAK_CHANCE_HITS',denominatorInputId:'INP_EX_WEAK_CHANCE_TRIALS',sampleRecommendation:70,userReason:'激走チャージ中の弱チャンス目からのEX獲得率は31.3%→46.9%と差があり、分母・成否を直接観測できるため補助採用。'},
  {researchFeatureId:'RF_GEKSOU_EX_STRONG_CHANCE',featureId:'FEAT_GEKSOU_EX_STRONG_CHANCE',numeratorInputId:'INP_EX_STRONG_CHANCE_HITS',denominatorInputId:'INP_EX_STRONG_CHANCE_TRIALS',sampleRecommendation:65,userReason:'激走チャージ中の強チャンス目からのEX獲得率は50.0%→66.4%と差があり、強チェリーを除外して独立集計できるため補助採用。'}
].map(x=>({...x,adoptionCategory:'INCLUDE_SUPPORT',minimumSample:1,weight:1,displayFormat:'percent',difficultyParticipation:'EXCLUDE',difficultyExclusionReason:'激走チャージ中の対象レア小役成立回数を通常ゲーム数へ安定換算できないためDifficultyには含めない。'}));
for (const f of newFeatures) {
  const idx = selection.features.findIndex(x => x.featureId === f.featureId);
  if (idx >= 0) selection.features[idx] = f; else selection.features.push(f);
}
selection.uiCategoryLabels = {...selection.uiCategoryLabels, GEKSOU_EX_ITEM:'激走チャージ中 EXアイテム'};

fs.writeFileSync(researchPath, JSON.stringify(research, null, 2) + '\n');
fs.writeFileSync(selectionPath, JSON.stringify(selection, null, 2) + '\n');
console.log('Updated Monkey V EX item Research/Selection.');
