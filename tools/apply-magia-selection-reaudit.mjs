#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const machineId = 'L_MAGIA_RECORD_RN';
const dir = path.join(root, 'research', machineId);
const files = {
  research: path.join(dir, 'research-data.json'),
  selection: path.join(dir, 'selection-data.json'),
  observation: path.join(dir, 'machine-observation-data.json'),
  ui: path.join(dir, 'ui-design-data.json'),
};
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, v) => fs.writeFileSync(p, `${JSON.stringify(v, null, 2)}\n`);
const research = read(files.research);
const selection = read(files.selection);
const observation = read(files.observation);
const ui = read(files.ui);

const rfeat = id => research.features.find(x => x.researchFeatureId === id);
const sfeat = id => selection.features.find(x => x.featureId === id);
const obs = id => observation.observations.find(x => x.observationId === id);
const fmap = id => observation.featureMappings.find(x => x.featureId === id);
const upsertBy = (arr, key, value) => {
  const i = arr.findIndex(x => x[key] === value[key]);
  if (i >= 0) arr[i] = value; else arr.push(value);
};
const removeFeatureInputRefs = f => {
  for (const k of ['numeratorInputId','denominatorInputId','trialCountInputId','numeratorInputIds','categoryInputIds','denominatorInputIds','categorySubtractInputIds','inputTransform','residualCategoryLabel','categoryExcludeLabels']) delete f[k];
  delete f.suppressedByFeatureIds;
};
const exclude = (featureId, userFacingReason, detail) => {
  const f = sfeat(featureId);
  f.adoptionCategory = 'EXCLUDE';
  f.difficultyParticipation = 'EXCLUDE';
  f.userFacingReason = userFacingReason;
  f.rejectionReason = detail ?? userFacingReason;
  delete f.userReason;
  delete f.difficultyExclusionReason;
  removeFeatureInputRefs(f);
};

// Research semantic corrections.
rfeat('RF_MODE_AT_END').notes = '設定別の内部魔法少女モード振り分け。アイキャッチ・会話は滞在示唆であり、各試行の真のモードを確定観測する表示ではない。公開された示唆挙動から6カテゴリの真値を復元できる完全なemission modelも確認できないため、Selectionではlatent-state observability gateを適用する。';
rfeat('RF_MODE_BONUS_END').notes = 'ボーナス終了時かついろはモードからの内部昇格分布。画面・会話は滞在示唆であり真の6カテゴリを確定観測できないため、公開分布そのものをユーザー入力カテゴリとして扱わない。';
rfeat('RF_HIGH_TRANSITION_ADV_AT_END').notes = '有利区間移行・AT終了時の内部高確保証G数振り分け。高確示唆ステージ等は存在するが、各抽選の初期HIGH10/HIGH20/HIGH30/NONEを毎回確定観測できる公開Observationは確認できない。';
rfeat('RF_HIGH_TRANSITION_BIG_END').notes = 'AT非当選BIG終了時の内部高確保証G数振り分け。レア役等による保証G上乗せもあり、初期HIGH10/HIGH20/HIGH30/NONEを毎回確定分類するObservationは確認できない。';
rfeat('RF_WATERMELON_CZ').notes = '公開値は「さなモード以外」のスイカ成立を分母とする。さなモード滞在は直接確定できず示唆からの推定になるため、ユーザーが各スイカを正しいtrial universeへ分類できない。現行の条件付きmultinomialはSelectionで不採用。';
const ep = rfeat('RF_EPISODE_BONUS_TYPE');
ep.trialUnit = '通常の設定別エピソード選択抽選が行われた機会1回';
ep.denominatorDefinition = '通常の設定別エピソード選択抽選が実際に行われた回数。黒江チャレンジ成功、ドッペルモード、ロングフリーズ、その他選択先固定・強制経路を除外';
ep.notes = '黒江チャレンジ成功時は黒江エピソード固定、ドッペルモードは「いろは」固定、ロングフリーズは「うい」固定で通常の5カテゴリ設定別抽選とは別母集団。強制経路は分母・分子の双方から除外する。公開丸め値はResearch原値として保持。';

// Discovery/Evidence gap: story order after a chapter-5 start.
const src = 'SRC_NANA_SETTING_FULL';
const storyEvidence = [
  ['RE_STORY_ORDER_DENY1','ストーリー5話スタート後 設定1否定パターン',['SET_2','SET_3','SET_4','SET_5','SET_6'],['SET_1'],'1→2→3→4 または 4→3→1→2。後者は高設定示唆も併記されるがHard部分は設定1否定。'],
  ['RE_STORY_ORDER_DENY2','ストーリー5話スタート後 設定2否定パターン',['SET_1','SET_3','SET_4','SET_5','SET_6'],['SET_2'],'2→1→3→4 または 4→2→1→3。'],
  ['RE_STORY_ORDER_DENY3','ストーリー5話スタート後 設定3否定パターン',['SET_1','SET_2','SET_4','SET_5','SET_6'],['SET_3'],'3→1→2→4。'],
  ['RE_STORY_ORDER_5PLUS','ストーリー5話スタート後 4→3→2→1',['SET_5','SET_6'],['SET_1','SET_2','SET_3','SET_4'],'設定5 or 6濃厚。'],
];
for (const [id,name,allowedSettings,deniedSettings,notes] of storyEvidence) upsertBy(research.evidenceCandidates,'researchEvidenceId',{researchEvidenceId:id,name,factStatus:'verified',allowedSettings,deniedSettings,sourceRefs:[src],notes});
for (const [id,name] of storyEvidence) upsertBy(research.discoveryInventory,'discoveryCandidateId',{discoveryCandidateId:`D_${id.replace(/^RE_/,'')}`,name,researchTarget:id});

// Selection: dependency-safe active set.
const at = sfeat('FEAT_AT_FIRST_HIT');
at.adoptionCategory = 'INCLUDE_PRIMARY';
at.userReason = 'AT初当りは通常時の主要な最終到達イベントとして全設定値が公開され、直接観測できるため主Featureとして採用する。ボーナス初当りとの同時独立乗算は避ける。';
delete at.suppressedByFeatureIds;
const bonus = sfeat('FEAT_BONUS_FIRST_HIT');
bonus.adoptionCategory = 'INCLUDE_FALLBACK';
bonus.userReason = 'ボーナス初当り自体には設定差と情報量があるが、AT到達経路と重なる公開周辺分布をAT初当りと独立に掛け合わせるJoint根拠がないため、AT初当り未使用時のFallbackとして採用する。';
bonus.suppressedByFeatureIds = ['FEAT_AT_FIRST_HIT'];
const weak = sfeat('FEAT_WEAK_CHERRY');
weak.adoptionCategory = 'INCLUDE_PRIMARY';
weak.userReason = '毎ゲーム多数の試行を得られ、1↔6の1ゲーム当たり情報量も初当り系より大きく、AT/ボーナス初当りとは別の上流成立事象として正確に観測できるため主Featureとして採用する。';
for (const i of selection.inputs) {
  if (i.category === 'SEL_RF_BONUS_FIRST_HIT') i.inferenceRole = 'INCLUDE_FALLBACK';
  if (i.category === 'SEL_RF_AT_FIRST_HIT' || i.category === 'SEL_RF_WEAK_CHERRY') i.inferenceRole = 'INCLUDE_PRIMARY';
}
exclude('FEAT_MODE_AT_END','内部モードを各試行で確定できないため不採用。','設定別の内部モード分布は公開されているが、アイキャッチ・会話は示唆であって真の6カテゴリObservationではない。完全な観測生成確率も不足し、latent stateを直接multinomialへ入力できない。');
exclude('FEAT_MODE_BONUS_END','内部モードを各試行で確定できないため不採用。','ボーナス終了後の内部モード昇格分布は公開されるが、真のモードカテゴリを確定観測できない。');
exclude('FEAT_HIGH_TRANSITION_ADV_AT_END','高確保証G数の内部振り分けを正確に判別できないため不採用。','HIGH10/HIGH20/HIGH30/NONEは内部割当で、示唆ステージや後続挙動から各抽選の初期カテゴリを確定できない。');
exclude('FEAT_HIGH_TRANSITION_BIG_END','高確保証G数の内部振り分けを正確に判別できないため不採用。','AT非当選BIG終了後の初期高確保証Gカテゴリを各試行で確定できず、後続レア役による保証G加算とも分離できない。');
exclude('FEAT_WATERMELON_CZ','「さなモード以外」の正しい分母を取得できないため不採用。','公開CZ分布の分母は非さなモード中スイカに限定されるが、さな滞在を試行ごとに確定できないため条件付きtrial universeを構成できない。');
const eps = sfeat('FEAT_EPISODE_BONUS_TYPE');
eps.adoptionCategory = 'INCLUDE_SUPPORT';
eps.userReason = '通常の設定別エピソード選択抽選が行われた機会だけに限定すれば、直接観測できるカテゴリ構成として有用。観測機会が少ないため補助Featureとする。';
for (const id of ['FEAT_MITAMA_LEVEL2_AT','FEAT_MITAMA_LEVEL3_AT']) {
  const f=sfeat(id); f.adoptionCategory='INCLUDE_FALLBACK'; f.suppressedByFeatureIds=['FEAT_AT_FIRST_HIT'];
  f.userReason='条件成立後のAT当選率には設定差があり正確に観測できるが、成功事象はAT初当りへ包含されるため、AT初当り未使用時のFallbackとしてのみ採用する。';
}
const excludedPrefixes = ['INP_MODE_AT_END_','INP_MODE_BONUS_END_','INP_HIGH_TRANSITION_ADV_AT_END_','INP_HIGH_TRANSITION_BIG_END_','INP_WATERMELON_CZ_'];
selection.inputs = selection.inputs.filter(i => !excludedPrefixes.some(p => i.id.startsWith(p)));

// Add hard Evidence inputs and dispositions for story order.
const storyInputs = [
 ['INP_STORY_ORDER_DENY1_COUNT','ストーリー5話開始：設定1否定パターン','RE_STORY_ORDER_DENY1','EVI_STORY_ORDER_DENY1',['SET_2','SET_3','SET_4','SET_5','SET_6'],['SET_1']],
 ['INP_STORY_ORDER_DENY2_COUNT','ストーリー5話開始：設定2否定パターン','RE_STORY_ORDER_DENY2','EVI_STORY_ORDER_DENY2',['SET_1','SET_3','SET_4','SET_5','SET_6'],['SET_2']],
 ['INP_STORY_ORDER_DENY3_COUNT','ストーリー5話開始：設定3否定パターン','RE_STORY_ORDER_DENY3','EVI_STORY_ORDER_DENY3',['SET_1','SET_2','SET_4','SET_5','SET_6'],['SET_3']],
 ['INP_STORY_ORDER_5PLUS_COUNT','ストーリー5話開始：4→3→2→1（設定5以上）','RE_STORY_ORDER_5PLUS','EVI_STORY_ORDER_5PLUS',['SET_5','SET_6'],['SET_1','SET_2','SET_3','SET_4']],
];
let order = Math.max(...selection.inputs.map(x=>x.displayOrder), 0) + 1;
for (const [inputId,name,researchEvidenceId,evidenceId,allowedSettings,deniedSettings] of storyInputs) {
  upsertBy(selection.inputs,'id',{id:inputId,name,category:'EVIDENCE',type:'counter',unit:'回',displayOrder:order++,inferenceRole:'INCLUDE_SUPPORT',defaultValue:''});
  upsertBy(selection.evidence,'evidenceId',{researchEvidenceId,evidenceId,inputId,name,displayName:name,allowedSettings,deniedSettings,notes:'ResearchでHard Evidenceとして検証済み。傾向示唆が併記される場合もHardな設定集合だけを適用する。'});
}

// Observation validity corrections.
for (const id of ['OBS_MODE_AT_END','OBS_MODE_BONUS_END']) {
  const o=obs(id); o.status='CHECKED_NONE'; o.notes='実機確認と公開解析の再監査により、真の魔法少女モード6カテゴリを各試行で確定する直接Observationは存在しないと判定。アイキャッチ・会話は示唆であり真値入力に使用しない。';
}
for (const id of ['OBS_HIGH_TRANSITION_ADV_AT_END','OBS_HIGH_TRANSITION_BIG_END']) {
  const o=obs(id); o.status='CHECKED_NONE'; o.notes='公開解析は内部高確保証G数の振り分けを示すが、各抽選の初期HIGH10/HIGH20/HIGH30/NONEを直接確定する表示は確認できないためInference用Observationとして不成立。';
}
const ow = obs('OBS_WATERMELON_CZ');
ow.status='FOUND';
ow.notes='スイカ成立とCZ結果自体は観測可能。ただし公開Selection表の分母は「さなモード以外」に限定され、さな滞在は確定観測できないため、このObservationから現行Featureの正しい条件付き分母を構成できない。';
ow.excludedConditions = [...new Set([...(ow.excludedConditions??[]),'「さなモード以外」を示唆演出から推定して分母へ採用しない'])];
const oe = obs('OBS_EPISODE_BONUS_TYPE');
oe.label='通常抽選のエピソードボーナス種類';
oe.categories=['やちよ','鶴乃','さな','フェリシア','黒江'];
oe.excludedConditions=[
 '黒江チャレンジ成功経由は黒江固定のため除外',
 'ドッペルモード経由はいろは固定のため除外',
 'ロングフリーズ経由はうい固定のため除外',
 'その他、通常の設定別5カテゴリ選択抽選を経ない強制・固定経路を除外',
 '未観測を観測済み0として扱わない'
];
oe.notes='通常の設定別エピソード選択抽選が実際に行われた機会だけを母集団とする。特殊経路を混ぜると公開分布と異なるため厳密に除外する。';
for (const id of ['FEAT_MODE_AT_END','FEAT_MODE_BONUS_END','FEAT_HIGH_TRANSITION_ADV_AT_END','FEAT_HIGH_TRANSITION_BIG_END','FEAT_WATERMELON_CZ']) {
  const m=fmap(id); m.mappingType='INCOMPATIBLE'; m.usableForInference=false; m.usableForDifficulty=false; m.notes='Selection再監査でObservation契約不成立。公開設定差だけでは採用せず、直接確定Observationまたは妥当なlatent/emission modelが構築できるまでInferenceへ使用しない。';
}
upsertBy(observation.researchReopenRequests,'requestId',{requestId:'REOPEN_MAGIA_LATENT_STATE_20260901',status:'RESOLVED',reason:'実機確認で魔法少女モードを真の6カテゴリとして確定観測できないことが判明。Selectionを再オープンし、モード・非さな条件・内部高確保証GのObservation validityを再監査して不採用へ変更。'});
upsertBy(observation.fieldVerificationItems,'verificationId',{verificationId:'VFY_L_MAGIA_RECORD_RN_MAGIC_GIRL_MODE_DIRECT',status:'VERIFIED_ON_MACHINE',sourceType:'DIRECT_PLAY',priority:'HIGH',question:'魔法少女モード6カテゴリを各試行で確定できる直接表示が存在するか確認する。',notes:'2026-09-01実機確認：真のモードを直接確定する画面ではなく、公開解析上もアイキャッチ・会話は滞在示唆。'});
const hardObs=obs('OBS_HARD_EVIDENCE_EVENTS');
for (const [,name] of storyInputs) if (!hardObs.categories.includes(name)) hardObs.categories.push(name);
hardObs.notes='SelectionData evidenceに採用済みのHard Evidenceのみ。ストーリー5話開始後の順番による設定否定/5以上も含む。';

// UI: remove invalid latent/internal-state inputs; make episode section explicit and 2 columns.
const invalidSections = new Set(['IROHA','IROHA 2','HIGH10 / HIGH20 / HIGH30 / NONE','HIGH10 / HIGH20 / HIGH30 / NONE 2','MAGIA_CHALLENGE']);
ui.sectionOrder = ui.sectionOrder.filter(x => !invalidSections.has(x));
for (const key of invalidSections) delete ui.sections[key];
for (const id of Object.keys(ui.inputContracts)) if (excludedPrefixes.some(p=>id.startsWith(p))) delete ui.inputContracts[id];
if (ui.sections.YACHIYO) {
  const section=ui.sections.YACHIYO; delete ui.sections.YACHIYO;
  section.description='通常の設定別エピソード選択抽選が行われた回だけ入力します。黒江チャレンジ成功、ドッペルモード、ロングフリーズなど、選択先が固定される経路は除外してください。';
  ui.sections['エピソードボーナス選択率']=section;
  ui.sectionOrder=ui.sectionOrder.map(x=>x==='YACHIYO'?'エピソードボーナス選択率':x);
}
const episodeNames = {
 INP_EPISODE_BONUS_TYPE_CAT_YACHIYO:'やちよ',
 INP_EPISODE_BONUS_TYPE_CAT_TSURUNO:'鶴乃',
 INP_EPISODE_BONUS_TYPE_CAT_SANA:'さな',
 INP_EPISODE_BONUS_TYPE_CAT_FELICIA:'フェリシア',
 INP_EPISODE_BONUS_TYPE_CAT_KUROE:'黒江',
};
for (const [id,name] of Object.entries(episodeNames)) {
  const si=selection.inputs.find(x=>x.id===id); if(si) si.name=name;
  const c=ui.inputContracts[id]; if(c){c.name=name;c.gridSpan=6;c.compact=true;}
}
const evidenceSection=ui.sections['設定示唆・確定情報'];
for (const [inputId,name] of storyInputs) {
  if (!evidenceSection.inputIds.includes(inputId)) evidenceSection.inputIds.push(inputId);
  ui.inputContracts[inputId]={name,mode:'COUNTER',gridSpan:12,directInput:false,compact:true,step:1,quickAdd:[1],quickInputEligible:true,inputVisible:true,emptyMeansUnobserved:true,observedZeroAllowed:true};
}
ui.auditNotes = [...new Set([...(ui.auditNotes??[]),'2026-09-01 Selection再監査：latent内部モード/高確保証G/非さな条件スイカCZの専用入力を削除。エピソード選択は通常抽選のみ・特殊固定経路除外、2列表示へ修正。'])];

write(files.research,research);
write(files.selection,selection);
write(files.observation,observation);
write(files.ui,ui);
console.log('Applied L_MAGIA_RECORD_RN Selection re-audit migration.');
