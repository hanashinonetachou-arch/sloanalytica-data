import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const IDS = [
  'S_MOMOKYUN_SWORD_DX','S_SHIN_ORE_NO_SORA_ST','S_MORE_CHIBARIYO_NB_30','S_OKIDOKI_GOLD_GS','L_SALARYMAN_KINTARO_ET',
  'L_NYANKO_DAISENSO_CHOSHINSOKU_KB','L_NANATSU_NO_MAKEN_PU','L_DISCUP_ULTRA_REMIX_XR','L_STAR_HANAHANA_MX','L_SHIN_EVANGELION'
];

const read = p => JSON.parse(fs.readFileSync(p,'utf8'));
const write = (p,v) => { fs.writeFileSync(p, JSON.stringify(v,null,2)+'\n','utf8'); };
const slug = s => String(s).replace(/^INP_/,'OBS_');

for (const id of IDS) {
  const dir = path.join(ROOT,'research',id);
  const research = read(path.join(dir,'research-data.json'));
  const selection = read(path.join(dir,'selection-data.json'));
  const included = (selection.features ?? []).filter(f => ['INCLUDE_PRIMARY','INCLUDE_SUPPORT','INCLUDE_FALLBACK'].includes(f.adoptionCategory));
  const usedInputIds = new Set();
  for (const f of included) {
    for (const key of ['numeratorInputId','denominatorInputId','trialCountInputId']) if (f[key]) usedInputIds.add(f[key]);
    for (const key of ['numeratorInputIds','categoryInputIds','denominatorInputIds']) for (const x of f[key] ?? []) usedInputIds.add(x);
  }

  const inputMap = new Map((selection.inputs ?? []).map(x => [x.id,x]));
  const observations = [];
  for (const inputId of usedInputIds) {
    const input = inputMap.get(inputId);
    if (!input) continue;
    const isGames = input.type === 'integer' && input.unit === 'G';
    observations.push({
      observationId: slug(inputId),
      sourceType: 'DIRECT_PLAY',
      observationMode: 'MANUAL_COUNTER',
      status: 'FOUND',
      label: input.name,
      categories: [],
      timing: ['遊技中に随時更新'],
      excludedConditions: [],
      sourceRefs: [],
      notes: isGames
        ? 'Selectionで採用した分母。ユーザーが自然に把握できるゲーム数として直接入力する。空欄=未観測、0=観測済み0を維持する。'
        : 'Selectionで採用した観測値。発生時にカウントする。空欄=未観測、0=観測済み0を維持する。'
    });
  }

  const featureMappings = included.map(f => {
    const obsIds = [];
    for (const key of ['numeratorInputId','denominatorInputId','trialCountInputId']) if (f[key] && usedInputIds.has(f[key])) obsIds.push(slug(f[key]));
    for (const key of ['numeratorInputIds','categoryInputIds','denominatorInputIds']) for (const x of f[key] ?? []) if (usedInputIds.has(x)) obsIds.push(slug(x));
    return {
      featureId: f.featureId,
      mappingType: 'EXACT',
      observationIds: [...new Set(obsIds)],
      collectionMethods: ['MANUAL_COUNTER'],
      usableForInference: true,
      usableForDifficulty: f.difficultyParticipation === 'INCLUDE',
      notes: 'SelectionDataの入力契約をObservationへ1対1で写像。derived/residualの詳細はUI Design/MachinePackage compile時にSelection定義を保持する。'
    };
  });

  const evidencePresent = (selection.evidenceUi?.groups ?? []).length > 0;
  const sources = (research.sources ?? []).map(s => ({
    sourceId: s.sourceId,
    publisher: s.publisher,
    title: s.title,
    url: s.url,
    sourceType: s.sourceType
  }));

  const out = {
    schemaVersion: 'machine-observation-data-v2',
    machineId: id,
    displayName: research.machine.displayName,
    provisionalRegistrationId: null,
    registrationId: null,
    releaseDate: research.machine.introductionDate ?? null,
    researchedAt: '2026-08-28',
    sources,
    sourceCoverage: {
      machineMenu: 'UNRESOLVED',
      dataCounter: 'UNRESOLVED',
      linkedService: 'UNRESOLVED',
      directPlay: 'FOUND',
      endEvent: evidencePresent ? 'FOUND' : 'CHECKED_NONE',
      seatedState: 'UNRESOLVED'
    },
    observations,
    featureMappings,
    researchReopenRequests: [],
    fieldVerificationItems: [
      {
        verificationId: 'FV_MACHINE_MENU', status: 'WAITING_FOR_MACHINE', sourceType: 'MACHINE_MENU', priority: 'MEDIUM',
        question: '実機メニューに累計ゲーム数・小役・ボーナス・CZ・AT・終了画面履歴など、Selection入力を代替または補助できるカウンターがあるか。'
      },
      {
        verificationId: 'FV_DATA_COUNTER', status: 'WAITING_FOR_MACHINE', sourceType: 'DATA_COUNTER', priority: 'HIGH',
        question: '着席時に店舗データカウンターから取得できる累計G・BIG/REG・CZ/AT等は何か。また公開解析の分母定義と一致するか。'
      },
      {
        verificationId: 'FV_LINKED_SERVICE', status: 'WAITING_FOR_MACHINE', sourceType: 'LINKED_SERVICE', priority: 'MEDIUM',
        question: 'マイスロ・ユニメモ・スロプラNEXT・メーカー独自連動等で取得できる具体的なゲーム数・小役・ボーナス・CZ・AT・画面履歴は何か。'
      },
      {
        verificationId: 'FV_SEATED_STATE', status: 'WAITING_FOR_MACHINE', sourceType: 'SEATED_STATE', priority: 'HIGH',
        question: '着席時に自然に取得でき、推測へ安全に引き継げる前任者区間データは何か。取得不能な値を推測で補完しないこと。'
      }
    ],
    notes: '初版Observation。Selection採用Featureの観測契約を固定し、実機/店舗環境でのみ確定できる取得手段はfieldVerificationへ残す。空欄=未観測、0=観測済み0。'
  };
  write(path.join(dir,'machine-observation-data.json'), out);
  console.log(`built observation: ${id}`);
}
