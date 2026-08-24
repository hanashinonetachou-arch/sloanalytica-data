import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJson = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');

function replaceOnce(text, before, after, label) {
  if (!text.includes(before)) throw new Error(`patch target not found: ${label}`);
  return text.replace(before, after);
}

// 1) Builder: preserve tabbed section definitions from Selection into MachineData.
{
  const p = path.join(root, 'tools', 'build-machine-data.mjs');
  let text = fs.readFileSync(p, 'utf8');
  if (!text.includes('sectionOptions.tabs')) {
    const before = `    sections.push({\n      id:\`AUTO_\${cat}\`.replace(/[^A-Z0-9_]/gi,"_").toUpperCase(),\n      ...(categoryTitle?{title:categoryTitle}:{}),\n      displayOrder:order++,\n      ...(selection.uiCategoryDescriptions?.[cat]?{description:selection.uiCategoryDescriptions[cat]}:{}),\n      ...(typeof sectionOptions.description==="string"&&sectionOptions.description?{description:sectionOptions.description}:{}),\n      ...(typeof sectionOptions.collapsible==="boolean"?{collapsible:sectionOptions.collapsible}:{}),\n      ...(typeof sectionOptions.defaultExpanded==="boolean"?{defaultExpanded:sectionOptions.defaultExpanded}:{}),\n      ...(Array.isArray(sectionOptions.summaryInputIds)?{summaryInputIds:sectionOptions.summaryInputIds}:{}),\n      items:items.sort((a,b)=>a.displayOrder-b.displayOrder).map(i=>({\n        type:"input",inputId:i.id,label:i.name,\n        ...(i.uiGridSpan?{gridSpan:i.uiGridSpan}:{}),\n        ...((i.uiDirectInput===false||i.uiCompactCounter===true||i.uiQuickAdd!==undefined)?{config:{...(i.uiDirectInput===false?{directInput:false}:{}),...(i.uiCompactCounter===true?{compact:true}:{}),...(i.uiQuickAdd!==undefined?{quickAdd:i.uiQuickAdd}:{})}}:{}),\n        widget:i.type==="counter"?"counter":i.type==="boolean"?"boolean":i.type==="enum"?"select":i.type==="multi_enum"?"multi_select":"number"\n      }))\n    });`;
    const after = `    const toUiItem=(i)=>({\n      type:"input",inputId:i.id,label:i.name,\n      ...(i.uiGridSpan?{gridSpan:i.uiGridSpan}:{}),\n      ...((i.uiDirectInput===false||i.uiCompactCounter===true||i.uiQuickAdd!==undefined)?{config:{...(i.uiDirectInput===false?{directInput:false}:{}),...(i.uiCompactCounter===true?{compact:true}:{}),...(i.uiQuickAdd!==undefined?{quickAdd:i.uiQuickAdd}:{})}}:{}),\n      widget:i.type==="counter"?"counter":i.type==="boolean"?"boolean":i.type==="enum"?"select":i.type==="multi_enum"?"multi_select":"number"\n    });\n    const sortedItems=items.sort((a,b)=>a.displayOrder-b.displayOrder);\n    let tabs;\n    if(Array.isArray(sectionOptions.tabs)){\n      const itemById=new Map(sortedItems.map(i=>[i.id,i]));\n      const seen=new Set();\n      tabs=sectionOptions.tabs.map((tab,index)=>{\n        if(!tab||typeof tab.id!=="string"||!tab.id||typeof tab.label!=="string"||!tab.label||!Array.isArray(tab.inputIds)||tab.inputIds.length===0) fail(\`\${cat}: invalid tab definition at index \${index}\`);\n        const tabItems=tab.inputIds.map(id=>{\n          if(seen.has(id)) fail(\`\${cat}: duplicate tab inputId \${id}\`);\n          const input=itemById.get(id);\n          if(!input) fail(\`\${cat}: unknown tab inputId \${id}\`);\n          seen.add(id);\n          return toUiItem(input);\n        });\n        return {id:tab.id,label:tab.label,items:tabItems};\n      });\n      if(seen.size!==sortedItems.length) fail(\`\${cat}: tab definitions must cover every section input exactly once\`);\n    }\n    sections.push({\n      id:\`AUTO_\${cat}\`.replace(/[^A-Z0-9_]/gi,"_").toUpperCase(),\n      ...(categoryTitle?{title:categoryTitle}:{}),\n      displayOrder:order++,\n      ...(selection.uiCategoryDescriptions?.[cat]?{description:selection.uiCategoryDescriptions[cat]}:{}),\n      ...(typeof sectionOptions.description==="string"&&sectionOptions.description?{description:sectionOptions.description}:{}),\n      ...(typeof sectionOptions.collapsible==="boolean"?{collapsible:sectionOptions.collapsible}:{}),\n      ...(typeof sectionOptions.defaultExpanded==="boolean"?{defaultExpanded:sectionOptions.defaultExpanded}:{}),\n      ...(Array.isArray(sectionOptions.summaryInputIds)?{summaryInputIds:sectionOptions.summaryInputIds}:{}),\n      ...(tabs?{tabs}:{}),\n      items:tabs?[]:sortedItems.map(toUiItem)\n    });`;
    text = replaceOnce(text, before, after, 'build-machine-data tabbed sections');
    fs.writeFileSync(p, text);
  }
}

const researchPath = path.join(root, 'research', 'S_GRANBELM_ZX', 'research-data.json');
const selectionPath = path.join(root, 'research', 'S_GRANBELM_ZX', 'selection-data.json');
const research = readJson(researchPath);
const selection = readJson(selectionPath);

const sourceId = 'SRC_NANATETSU_NAKAMIMIERU';
const source = {
  sourceId,
  publisher: 'なな徹',
  title: '回胴式遊技機 グランベルム ナカミミエールモード（ミエールポイント）の詳細・アイテムの示唆内容',
  url: 'https://nana-press.com/kaiseki/machine/587/17206/',
  checkedAt: '2026-08-25',
  sourceType: 'major_analysis'
};
research.sources = [...(research.sources || []).filter((s) => s.sourceId !== sourceId), source];

const cats = ['MAGIC_BLUE','MAGIC_GREEN','MOON_BLUE','MOON_GREEN','HOPE_BLUE','HOPE_GREEN'];
const labels = {
  MAGIC_BLUE:'魔（青）', MAGIC_GREEN:'魔（緑）', MOON_BLUE:'月（青）', MOON_GREEN:'月（緑）', HOPE_BLUE:'希（青）', HOPE_GREEN:'希（緑）'
};
const distributions = {
  RF_NAKAMI_NORMAL: {
    SET_1:[0.46399920,0.03349378,0.37966306,0.01684717,0.06909346,0.03690333],
    SET_2:[0.37547662,0.01685731,0.45896047,0.03351395,0.06913506,0.04605659],
    SET_3:[0.44474556,0.03352404,0.36394660,0.01686239,0.08561678,0.05530463],
    SET_4:[0.35959799,0.01688442,0.43949749,0.03356784,0.08572864,0.06472362],
    SET_5:[0.42599859,0.03360499,0.34862662,0.01690311,0.10081497,0.07405172],
    SET_6:[0.33343395,0.01690311,0.40758628,0.03360499,0.11580642,0.09266526]
  },
  RF_NAKAMI_05: {
    SET_1:[0.45483871,0.03366935,0.37207661,0.01693548,0.07983871,0.04264113],
    SET_2:[0.36387517,0.01765262,0.44467794,0.03509509,0.08321950,0.05547967],
    SET_3:[0.42898732,0.03472655,0.35090455,0.01746725,0.10199626,0.06591807],
    SET_4:[0.34259955,0.01803156,0.41869701,0.03584845,0.10529140,0.07953204],
    SET_5:[0.40403611,0.03547531,0.33043016,0.01784387,0.12235794,0.08985661],
    SET_6:[0.30754883,0.01843318,0.37590520,0.03664692,0.14527101,0.11619487]
  },
  RF_NAKAMI_55: {
    SET_1:[0.49280190,0.10648424,0.24830458,0.02665080,0.08197501,0.04378346],
    SET_2:[0.22816149,0.03150935,0.45294697,0.12589675,0.09691940,0.06456604],
    SET_3:[0.45290176,0.11316222,0.22809458,0.02832216,0.10785181,0.06966747],
    SET_4:[0.19544803,0.03565176,0.38819035,0.14244788,0.13576317,0.10249881],
    SET_5:[0.33871799,0.15380650,0.17030418,0.03849459,0.17219454,0.12648221],
    SET_6:[0.10401381,0.04833837,0.20738023,0.19313768,0.24838153,0.19874838]
  },
  RF_NAKAMI_99: {
    SET_1:[0.40324948,0.12882600,0.32987421,0.02274633,0.06310273,0.05220126],
    SET_2:[0.30670165,0.02587646,0.37491057,0.14655378,0.07178631,0.07417124],
    SET_3:[0.37563397,0.13262113,0.30743498,0.02341642,0.08039279,0.08050070],
    SET_4:[0.27833126,0.02702366,0.34022416,0.15305106,0.09277709,0.10859278],
    SET_5:[0.31677935,0.15107560,0.25925015,0.02667486,0.12366318,0.12255685],
    SET_6:[0.21945137,0.03006373,0.26807980,0.17026877,0.13937379,0.17276254]
  }
};
const featureMeta = [
  ['RF_NAKAMI_NORMAL','ナカミミエール アイコン振り分け（通常サイクル）','末尾0・5、55、99以降に該当しないサイクル'],
  ['RF_NAKAMI_05','ナカミミエール アイコン振り分け（末尾0/5）','末尾0または5のサイクル（55を除く）'],
  ['RF_NAKAMI_55','ナカミミエール アイコン振り分け（55サイクル）','55サイクル'],
  ['RF_NAKAMI_99','ナカミミエール アイコン振り分け（99以降）','99サイクル到達以降']
];
const researchFeatures = featureMeta.map(([id,name,scope]) => ({
  researchFeatureId:id,
  name,
  factStatus:'verified',
  candidateModel:'multinomial',
  trialUnit:'ナカミミエールアイコン',
  observationScope:scope,
  numeratorDefinition:'魔・月・希（青/緑）の出現回数',
  denominatorDefinition:'同サイクル区分で出現した魔・月・希（青/緑）の合計回数（アルマノクスと先読み後の次回アイテムは除外）',
  categories:cats,
  distributionMode:'complete',
  settingDistributions:Object.fromEntries(Object.entries(distributions[id]).map(([setting,arr]) => [setting,Object.fromEntries(cats.map((c,i)=>[c,arr[i]]))])),
  sourceRefs:[sourceId],
  crossSourceStatus:'single_source',
  sourceWording:'アイテム選択率はサイクル区分と設定で変化する。数値Inferenceではアルマノクスを除外し、魔・月・希6種の条件付き構成を評価する。',
  notes:'先読みアイテム出現の次サイクルは専用アルマノクステーブルになるため、本Featureには含めない。'
}));
research.features = [...(research.features || []).filter((f) => !featureMeta.some(([id]) => id === f.researchFeatureId)), ...researchFeatures];

const prereadEvidence = {
  researchEvidenceId:'RE_NAKA_PREREAD_2PLUS',
  name:'ナカミミエール 先読みアイテム',
  allowedSettings:['SET_2','SET_3','SET_4','SET_5','SET_6'],
  deniedSettings:['SET_1'],
  sourceRefs:[sourceId]
};
research.evidenceCandidates = [...(research.evidenceCandidates || []).filter((e) => e.researchEvidenceId !== prereadEvidence.researchEvidenceId), prereadEvidence];
writeJson(researchPath, research);

selection.uiCategoryLabels = {...(selection.uiCategoryLabels || {}), NAKAMI:'ナカミミエール'};
selection.uiCategoryDescriptions = {...(selection.uiCategoryDescriptions || {}), NAKAMI:'サイクル条件をタブで切り替えて記録します。先読みアイテム出現後の次回アイテムは4タブに数えません。確定・否定アルマノクスは下の設定示唆にも登録してください。'};

const cycleDefs = [
  ['NORMAL','通常'],
  ['C05','末尾0/5'],
  ['C55','55'],
  ['C99','99以降']
];
const longItems = [
  ['WHITE_LILY','ホワイトリリー'],
  ['CREST_ANCE','クレストアンス'],
  ['SETSUGETSUKA','雪月梅花'],
  ['ARC_KNIGHT_GRIS','アークナイトグリス'],
  ['VIOLA_KATZE','ヴィオラカッツェ'],
  ['DROSERA_NOCTURNE','ドロセラノクターン'],
  ['AWAKENED_WHITE_LILY','覚醒ホワイトリリー'],
  ['SELADOR_NOCTURNE','セラドアノクターン'],
  ['ZEEGUANLONG','ジーグァンロン']
];
const iconItems = cats.map((c) => [c, labels[c]]);
const generatedInputs = [];
const tabs = [];
let displayOrder = 20;
for (const [cycleId,tabLabel] of cycleDefs) {
  const inputIds = [];
  for (const [itemId,itemLabel] of [...iconItems, ...longItems]) {
    const id = `INP_NAKAMI_${cycleId}_${itemId}`;
    const isIcon = cats.includes(itemId);
    generatedInputs.push({
      id,
      name:itemLabel,
      type:'counter',
      category:'NAKAMI',
      unit:'回',
      displayOrder:displayOrder++,
      inferenceRole:isIcon?'INCLUDE_SUPPORT':'DISPLAY_ONLY',
      uiGridSpan:isIcon?6:12,
      uiDirectInput:false,
      uiCompactCounter:isIcon
    });
    inputIds.push(id);
  }
  tabs.push({id:cycleId,label:tabLabel,inputIds});
}
selection.inputs = [...(selection.inputs || []).filter((i) => !String(i.id || '').startsWith('INP_NAKAMI_')), ...generatedInputs];
selection.uiSectionOptions = {...(selection.uiSectionOptions || {}), NAKAMI:{...(selection.uiSectionOptions?.NAKAMI || {}), tabs}};

const featureDefs = [
  ['RF_NAKAMI_NORMAL','FEAT_NAKAMI_NORMAL','NORMAL'],
  ['RF_NAKAMI_05','FEAT_NAKAMI_05','C05'],
  ['RF_NAKAMI_55','FEAT_NAKAMI_55','C55'],
  ['RF_NAKAMI_99','FEAT_NAKAMI_99','C99']
].map(([researchFeatureId,featureId,cycleId]) => {
  const ids = cats.map((c) => `INP_NAKAMI_${cycleId}_${c}`);
  return {
    researchFeatureId,
    featureId,
    adoptionCategory:'INCLUDE_SUPPORT',
    numeratorInputId:ids[0],
    categoryInputIds:ids.slice(1),
    denominatorInputIds:ids,
    inputTransform:'sum_inputs_to_trials',
    minimumSample:5,
    sampleRecommendation:30,
    userReason:'サイクル条件を分離したうえで、魔・月・希（青/緑）の排他的な出現構成をMultinomialで評価します。アルマノクスと先読み後の次回アイテムは数値Featureから除外し、二重評価を避けます。'
  };
});
selection.features = [...(selection.features || []).filter((f) => !String(f.featureId || '').startsWith('FEAT_NAKAMI_')), ...featureDefs];

const evGroup = selection.evidenceUi?.groups?.find((g) => g.groupId === 'EV_NAKAMIMIERU');
if (!evGroup) throw new Error('EV_NAKAMIMIERU group not found');
evGroup.options = [...(evGroup.options || []).filter((o) => o.value !== 'PREREAD_2PLUS'), {
  value:'PREREAD_2PLUS',
  label:'先読みアイテム（設定2以上）',
  allowedSettings:['SET_2','SET_3','SET_4','SET_5','SET_6'],
  excludedSettings:['SET_1'],
  sourceEvidenceIds:['RE_NAKA_PREREAD_2PLUS']
}];

selection.selectionNotes = [
  ...(selection.selectionNotes || []).filter((n) => !String(n).includes('ナカミミエール')),
  'ナカミミエールは通常・末尾0/5・55・99以降を分離し、魔/月/希（青/緑）の条件付きMultinomialを補助Featureとして採用する。',
  'アルマノクスは入力記録を残すが数値Featureには含めず、確定・否定系はEvidenceとして扱う。先読みアイテムは設定2以上Evidenceのみ採用し、非出現は評価しない。',
  '先読みアイテム出現後の次サイクルは専用テーブルのため4区分Featureから除外する。ナカミミエールFeatureは通常Gへの安全なExposure換算根拠がないためDifficultyには参加させない。'
];
writeJson(selectionPath, selection);

console.log('OK: Granbelm Nakamimieru research/selection and tabbed-section builder support applied.');
