#!/usr/bin/env node
import fs from 'node:fs';

const cfg = {
  id: 'L_HOKUTO_AD_XR',
  version: '0.1.2',
  groups: [
    {
      groupId: 'SAMMY_TROPHY',
      label: 'サミートロフィー',
      evidenceIds: ['RE_TROPHY_GOLD_4PLUS', 'RE_TROPHY_KIRIN_5PLUS', 'RE_TROPHY_RAINBOW_6']
    },
    {
      groupId: 'AT_END_TOUCH_VOICE',
      label: 'AT終了後サブ液晶タッチボイス',
      evidenceIds: ['RE_VOICE_YURIA_5PLUS']
    }
  ]
};

const base = `research/${cfg.id}`;
const selectionPath = `${base}/selection-data.json`;
const researchPath = `${base}/research-data.json`;
const observationPath = `${base}/machine-observation-data.json`;
const uiPath = `${base}/ui-design-data.json`;

const selection = JSON.parse(fs.readFileSync(selectionPath, 'utf8'));
const research = JSON.parse(fs.readFileSync(researchPath, 'utf8'));
const observation = JSON.parse(fs.readFileSync(observationPath, 'utf8'));
const ui = JSON.parse(fs.readFileSync(uiPath, 'utf8'));

const evidenceMap = new Map((research.evidenceCandidates ?? []).map(x => [x.researchEvidenceId, x]));
const groups = cfg.groups.map(group => ({
  groupId: group.groupId,
  label: group.label,
  selectionMode: 'single',
  normalizationMode: 'ALLOWED_SETTINGS',
  options: group.evidenceIds.map(evidenceId => {
    const candidate = evidenceMap.get(evidenceId);
    if (!candidate || candidate.factStatus !== 'verified') {
      throw new Error(`${cfg.id}: invalid or unverified Research Evidence ${evidenceId}`);
    }
    return {
      value: evidenceId.replace(/^RE_/, ''),
      label: candidate.name,
      allowedSettings: candidate.allowedSettings,
      excludedSettings: candidate.deniedSettings ?? [],
      sourceEvidenceIds: [evidenceId]
    };
  })
}));

selection.machineDataVersion = cfg.version;
selection.evidenceUi = { groups };
fs.writeFileSync(selectionPath, JSON.stringify(selection, null, 2) + '\n');

const legacyObservationIndex = (observation.observations ?? []).findIndex(x => x.observationId === 'OBS_SETTING_EVIDENCE');
if (legacyObservationIndex < 0) throw new Error(`${cfg.id}: legacy OBS_SETTING_EVIDENCE not found`);
const featureRef = (observation.featureMappings ?? []).find(x => (x.observationIds ?? []).includes('OBS_SETTING_EVIDENCE'));
if (featureRef) throw new Error(`${cfg.id}: OBS_SETTING_EVIDENCE is referenced by feature ${featureRef.featureId}`);

const naturalEvidenceObservations = [
  {
    observationId: 'OBS_SAMMY_TROPHY',
    sourceType: 'END_EVENT',
    observationMode: 'VISUAL_EVENT',
    status: 'FOUND',
    label: 'サミートロフィー',
    categories: ['サミートロフィー 金', 'サミートロフィー キリン', 'サミートロフィー 虹'],
    timing: ['BB終了後通常画面移行時'],
    excludedConditions: ['未確認を非発生とみなさない'],
    sourceRefs: [],
    notes: 'Research Evidence RE_TROPHY_GOLD_4PLUS / RE_TROPHY_KIRIN_5PLUS / RE_TROPHY_RAINBOW_6 の自然観測面。'
  },
  {
    observationId: 'OBS_AT_END_TOUCH_VOICE',
    sourceType: 'END_EVENT',
    observationMode: 'AUDIO_EVENT',
    status: 'FOUND',
    label: 'AT終了後サブ液晶タッチボイス',
    categories: ['AT終了後ボイス ユリア'],
    timing: ['AT終了後サブ液晶タッチ時'],
    excludedConditions: ['未確認を非発生とみなさない'],
    sourceRefs: [],
    notes: 'Research Evidence RE_VOICE_YURIA_5PLUS の自然観測面。BB終了時ボイスFeatureとは別観測として保持する。'
  }
];
observation.observations.splice(legacyObservationIndex, 1, ...naturalEvidenceObservations);
fs.writeFileSync(observationPath, JSON.stringify(observation, null, 2) + '\n');

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
for (const group of groups) {
  const id = `EVI_UI_${group.groupId}`;
  ui.evidenceContracts[id] = {
    label: group.label,
    selectionMode: 'single',
    sourceEvidenceGroupId: group.groupId,
    inheritOptions: true
  };
}
ui.auditNotes = [
  'Evidence UI v2 Phase 2 Batch 9正式移行。設定結果そのものではなく、実際に観測したサミートロフィー／AT終了後サブ液晶タッチボイスを入力する。',
  '設定下限・否定設定はResearch EvidenceのallowedSettings / deniedSettingsから導出し、Feature再選定は行っていない。',
  '旧SETTING_FLOORで同じ設定5以上に圧縮されていたキリントロフィーとユリアボイスを、Research Evidenceの自然観測面に従って分離する。',
  'BB終了時ボイスFeature RF_BB_END_VOICE_NON_1G は統計Featureとして独立維持し、EvidenceのAT終了後ユリアボイスと混同しない。'
];
fs.writeFileSync(uiPath, JSON.stringify(ui, null, 2) + '\n');

console.log(`${cfg.id}: Evidence UI v2 Batch 9 canonical migration prepared`);
