#!/usr/bin/env node
import fs from 'node:fs';

const configs = [
  {
    id: 'L_AKAME_GA_KILL_2', version: '0.1.1',
    groups: [
      { groupId: 'AT_END_SCREEN', label: 'AT終了画面', evidenceIds: ['EV_AT_END_2PLUS','EV_AT_END_4PLUS','EV_AT_END_5PLUS'] },
      { groupId: 'NAMI_PANEL', label: 'ナミちゃんパネル', evidenceIds: ['EV_NAMI_6'] }
    ],
    observations: [
      { observationId:'OBS_AT_END_SCREEN', sourceType:'END_EVENT', observationMode:'VISUAL_EVENT', status:'FOUND', label:'AT終了画面', categories:['AT終了画面 アカメ','AT終了画面 アカメ＆レオーネ','AT終了画面 エスデス'], timing:['AT終了時'], excludedConditions:['未確認を非発生とみなさない'], sourceRefs:[], notes:'Research Evidence EV_AT_END_2PLUS / EV_AT_END_4PLUS / EV_AT_END_5PLUS の自然観測面。' },
      { observationId:'OBS_NAMI_PANEL', sourceType:'END_EVENT', observationMode:'VISUAL_EVENT', status:'FOUND', label:'ナミちゃんパネル', categories:['ナミちゃんパネル 虹'], timing:['ナミちゃんパネル表示時'], excludedConditions:['未確認を非発生とみなさない'], sourceRefs:[], notes:'Research Evidence EV_NAMI_6 の自然観測面。' }
    ]
  },
  {
    id: 'L_BOUNTY_ANGEL', version: '0.1.2',
    groups: [
      { groupId: 'BONUS_CONFIRM_SCREEN', label: 'ボーナス確定画面', evidenceIds: ['EV_BONUS_SCREEN_6'] },
      { groupId: 'COSPLAY_CHALLENGE', label: 'コスプレちゃれんじ', evidenceIds: ['EV_COSPLAY_4PLUS'] },
      { groupId: 'ENDING_VOICE', label: 'エンディングボイス', evidenceIds: ['EV_ENDING_VOICE_6'] }
    ],
    observations: [
      { observationId:'OBS_BONUS_CONFIRM_SCREEN', sourceType:'END_EVENT', observationMode:'VISUAL_EVENT', status:'FOUND', label:'ボーナス確定画面', categories:['ボーナス確定画面 シトリン&アメジスト＋赤7シングル'], timing:['ボーナス確定画面表示時'], excludedConditions:['未確認を非発生とみなさない'], sourceRefs:[], notes:'Research Evidence EV_BONUS_SCREEN_6 の自然観測面。' },
      { observationId:'OBS_COSPLAY_CHALLENGE', sourceType:'END_EVENT', observationMode:'VISUAL_EVENT', status:'FOUND', label:'コスプレちゃれんじ', categories:['コスプレちゃれんじ アメジスト'], timing:['コスプレちゃれんじ結果確認時'], excludedConditions:['未確認を非発生とみなさない'], sourceRefs:[], notes:'Research Evidence EV_COSPLAY_4PLUS の自然観測面。' },
      { observationId:'OBS_ENDING_VOICE', sourceType:'END_EVENT', observationMode:'AUDIO_EVENT', status:'FOUND', label:'エンディングボイス', categories:["エンディング アクア&ローズ『私たちの冒険は、まだこれから！』"], timing:['エンディング中の該当ボイス確認時'], excludedConditions:['未確認を非発生とみなさない'], sourceRefs:[], notes:'Research Evidence EV_ENDING_VOICE_6 の自然観測面。' }
    ]
  }
];

for (const cfg of configs) {
  const base = `research/${cfg.id}`;
  const sp = `${base}/selection-data.json`, rp = `${base}/research-data.json`, op = `${base}/machine-observation-data.json`, up = `${base}/ui-design-data.json`;
  const selection = JSON.parse(fs.readFileSync(sp,'utf8'));
  const research = JSON.parse(fs.readFileSync(rp,'utf8'));
  const observation = JSON.parse(fs.readFileSync(op,'utf8'));
  const ui = JSON.parse(fs.readFileSync(up,'utf8'));
  const evidenceMap = new Map((research.evidenceCandidates ?? []).map(x => [x.researchEvidenceId, x]));

  const groups = cfg.groups.map(group => ({
    groupId: group.groupId,
    label: group.label,
    selectionMode: 'single',
    normalizationMode: 'ALLOWED_SETTINGS',
    options: group.evidenceIds.map(evidenceId => {
      const candidate = evidenceMap.get(evidenceId);
      if (!candidate) throw new Error(`${cfg.id}: Research Evidence missing ${evidenceId}`);
      if (!Array.isArray(candidate.allowedSettings) || candidate.allowedSettings.length === 0) throw new Error(`${cfg.id}: invalid allowedSettings ${evidenceId}`);
      return {
        value: evidenceId.replace(/^(RE|EV)_/, ''),
        label: candidate.name,
        allowedSettings: candidate.allowedSettings,
        excludedSettings: candidate.deniedSettings ?? [],
        sourceEvidenceIds: [evidenceId]
      };
    })
  }));
  selection.machineDataVersion = cfg.version;
  selection.evidenceUi = { groups };
  fs.writeFileSync(sp, JSON.stringify(selection,null,2)+'\n');

  const legacyIndex = (observation.observations ?? []).findIndex(x => x.observationId === 'OBS_SETTING_EVIDENCE');
  if (legacyIndex >= 0) {
    const featureRef = (observation.featureMappings ?? []).find(x => (x.observationIds ?? []).includes('OBS_SETTING_EVIDENCE'));
    if (featureRef) throw new Error(`${cfg.id}: OBS_SETTING_EVIDENCE referenced by ${featureRef.featureId}`);
    observation.observations.splice(legacyIndex,1,...cfg.observations);
  } else {
    const ids = new Set((observation.observations ?? []).map(x => x.observationId));
    for (const natural of cfg.observations) {
      if (!ids.has(natural.observationId)) observation.observations.push(natural);
    }
  }
  fs.writeFileSync(op, JSON.stringify(observation,null,2)+'\n');

  const section = ui.sections?.['設定確定・否定情報'];
  if (!section) throw new Error(`${cfg.id}: evidence section missing`);
  section.inputIds = [];
  section.evidenceIds = groups.map(group => `EVI_UI_${group.groupId}`);
  section.description = section.description ?? '';
  section.collapsible = section.collapsible ?? false;
  section.defaultExpanded = section.defaultExpanded ?? true;
  delete ui.inputContracts?.INP_EVI_SETTING_FLOOR;
  delete ui.inputContracts?.INP_EVI_SETTING_CONSTRAINT;
  ui.evidenceContracts = {};
  for (const group of groups) ui.evidenceContracts[`EVI_UI_${group.groupId}`] = { label:group.label, selectionMode:'single', sourceEvidenceGroupId:group.groupId, inheritOptions:true };
  ui.auditNotes = [
    'Evidence UI v2 Phase 2 Batch 9正式移行。設定結果ではなく、Research Evidenceで確認済みの自然観測面を入力する。',
    '設定下限・否定設定はResearch EvidenceのallowedSettings / deniedSettingsから導出し、Feature再選定は行っていない。',
    'Legacy SETTING_FLOORで同じ設定下限へ圧縮されていた異なる観測面をResearch単位へSAFE SPLITした。'
  ];
  fs.writeFileSync(up, JSON.stringify(ui,null,2)+'\n');
  console.log(`${cfg.id}: Batch 9b canonical migration prepared`);
}
