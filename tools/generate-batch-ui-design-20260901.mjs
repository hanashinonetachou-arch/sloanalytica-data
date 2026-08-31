#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ids = [
  'L_MAGIA_RECORD_RN','L_GODZILLA_NS','L_USHIO_TORA_HAKUMEN_VH','L_AMAZING_LIVE_PD','L_YOSHIMUNE_SC2',
  'L_MAHJONG_MONOGATARI_S2','L_IDOLMASTER_MILLION_LIVE_HC','L_YOUJITSU_DE','L_MIDORI_DON_5_FY','L_GUNDAM_SEED_G'
];

const modeFor = input => {
  if (input.type === 'counter') return 'COUNTER';
  if (input.type === 'integer' || input.type === 'number') return 'NUMBER';
  if (input.type === 'select') return 'SELECT';
  return 'NUMBER';
};

for (const id of ids) {
  const dir = path.join('research', id);
  const selection = JSON.parse(fs.readFileSync(path.join(dir, 'selection-data.json'), 'utf8'));
  const observation = JSON.parse(fs.readFileSync(path.join(dir, 'machine-observation-data.json'), 'utf8'));
  const categoryLabels = selection.uiCategoryLabels ?? {};
  const sectionOrder = [];
  const sections = {};
  const inputContracts = {};

  const categoryOrder = [];
  for (const input of selection.inputs ?? []) {
    if (!categoryOrder.includes(input.category)) categoryOrder.push(input.category);
    inputContracts[input.id] = {
      name: input.name,
      mode: modeFor(input),
      gridSpan: input.type === 'counter' ? 6 : 12,
      directInput: true,
      ...(input.type === 'counter' ? { compact: true } : {})
    };
  }

  for (const category of categoryOrder) {
    const label = categoryLabels[category] ?? category;
    const inputIds = (selection.inputs ?? []).filter(x => x.category === category).map(x => x.id);
    if (!inputIds.length) continue;
    sectionOrder.push(label);
    sections[label] = { inputIds };
  }

  const evidenceContracts = {};
  const evidenceIds = [];
  for (const group of selection.evidenceUi?.groups ?? []) {
    const evidenceId = `EVC_${group.groupId}`;
    evidenceIds.push(evidenceId);
    evidenceContracts[evidenceId] = {
      label: group.label,
      selectionMode: group.selectionMode ?? 'multi',
      sourceEvidenceGroupId: group.groupId,
      inheritOptions: true
    };
  }
  if (evidenceIds.length) {
    const label = categoryLabels.EVIDENCE ?? '設定確定情報';
    if (!sectionOrder.includes(label)) sectionOrder.push(label);
    sections[label] = { ...(sections[label] ?? { inputIds: [] }), evidenceIds };
  }

  const waiting = (observation.fieldVerificationItems ?? []).filter(x => x.status === 'WAITING_FOR_MACHINE');
  const unresolvedCoverage = Object.entries(observation.sourceCoverage ?? {}).filter(([,v]) => v === 'UNRESOLVED').map(([k]) => k);
  const unresolved = [
    ...waiting.map(x => ({ type:'FIELD_VERIFICATION', id:x.verificationId, priority:x.priority, question:x.question })),
    ...unresolvedCoverage.map(x => ({ type:'SOURCE_COVERAGE', source:k }))
  ];

  const design = {
    schemaVersion: 'ui-design-data-v1',
    machineId: id,
    status: unresolved.length ? 'PASS_WITH_UNRESOLVED' : 'PASS',
    generatedFrom: {
      selection: `research/${id}/selection-data.json`,
      observation: `research/${id}/machine-observation-data.json`
    },
    sectionOrder,
    sections,
    inputContracts,
    ...(Object.keys(evidenceContracts).length ? { evidenceContracts } : {}),
    unresolved,
    auditNotes: [
      'Generated from SelectionData + Machine Observation Data v2 after Gate B.',
      'REJECT/EXCLUDE-only research features do not receive dedicated input surfaces.',
      'Blank/null remains unobserved; entered zero remains observed zero. Final labels and field availability remain subject to real-device verification where listed in unresolved.'
    ]
  };
  fs.writeFileSync(path.join(dir, 'ui-design-data.json'), JSON.stringify(design, null, 2) + '\n');
  console.log(`GENERATED ${id} / inputs=${Object.keys(inputContracts).length} / evidenceGroups=${evidenceIds.length} / unresolved=${unresolved.length}`);
}
