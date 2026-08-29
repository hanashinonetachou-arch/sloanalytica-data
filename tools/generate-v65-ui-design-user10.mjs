import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IDS = [
  'S_YOUJO_SENKI_ZR','S_HAIYORE_NYARUKO_SAN_Y','S_TOARU_RAILGUN_FB',
  'S_TEKKEN4_ULTIMATE_DEVIL_TCD','S_DANMACHI_GAIDEN_XR','S_MAHOIKU_NB',
  'L_SHIMAMUSUME_L2','L_SUPER_BLACKJACK_SLDC','L_SHAMANKING_SS','L_ARIFURETA_JA'
];

function read(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function modeFor(input) {
  if (input.type === 'counter') return 'COUNTER';
  if (input.type === 'integer' || input.type === 'number') return 'NUMBER';
  if (input.type === 'select') return 'SELECT';
  return 'NUMBER';
}
function uniqueSectionName(base, used) {
  let name = base || '入力';
  let n = 2;
  while (used.has(name)) name = `${base || '入力'} ${n++}`;
  used.add(name);
  return name;
}

for (const machineId of IDS) {
  const dir = path.join(ROOT, 'research', machineId);
  const selectionPath = path.join(dir, 'selection-data.json');
  const observationPath = path.join(dir, 'machine-observation-data.json');
  const outputPath = path.join(dir, 'ui-design-data.json');
  const selection = read(selectionPath);
  const observation = read(observationPath);
  if (selection.machineId !== machineId || observation.machineId !== machineId) throw new Error(`${machineId}: layer machineId mismatch`);

  const inputs = [...(selection.inputs ?? [])].sort((a,b)=>(a.displayOrder??9999)-(b.displayOrder??9999));
  const categoryOrder = [];
  for (const input of inputs) if (!categoryOrder.includes(input.category)) categoryOrder.push(input.category);
  const sectionOrder = [];
  const sections = {};
  const inputContracts = {};
  const evidenceContracts = {};
  const usedSections = new Set();

  for (const category of categoryOrder) {
    const categoryInputs = inputs.filter(input => input.category === category);
    const sectionName = uniqueSectionName(selection.uiCategoryLabels?.[category] ?? category, usedSections);
    sectionOrder.push(sectionName);
    sections[sectionName] = {
      inputIds: categoryInputs.map(input => input.id),
      observationRole: 'DIRECT_PLAY',
    };
    for (const input of categoryInputs) {
      const mode = modeFor(input);
      inputContracts[input.id] = {
        name: input.name,
        mode,
        gridSpan: input.uiGridSpan ?? (mode === 'NUMBER' ? 12 : 6),
        directInput: input.uiDirectInput ?? (mode === 'NUMBER'),
        ...(mode === 'COUNTER' ? { compact: input.uiCompactCounter ?? true } : {}),
        observationSemantics: 'blank=unobserved; zero=observed-zero',
      };
    }
  }

  let evidenceIndex = 1;
  for (const group of selection.evidenceUi?.groups ?? []) {
    const evidenceId = `EVIDENCE_${String(evidenceIndex++).padStart(2, '0')}`;
    const sectionName = uniqueSectionName(group.label ?? '設定確定・否定', usedSections);
    sectionOrder.push(sectionName);
    sections[sectionName] = {
      inputIds: [],
      evidenceIds: [evidenceId],
      observationRole: 'END_EVENT',
    };
    evidenceContracts[evidenceId] = {
      label: group.label,
      selectionMode: group.selectionMode ?? 'multi',
      sourceEvidenceGroupId: group.groupId,
      inheritOptions: true,
    };
  }

  const unresolved = (observation.fieldVerificationItems ?? [])
    .filter(item => item.status === 'WAITING_FOR_MACHINE')
    .map(item => ({
      verificationId: item.verificationId,
      priority: item.priority,
      sourceType: item.sourceType,
      question: item.question,
    }));

  const ui = {
    schemaVersion: 'ui-design-data-v1',
    machineId,
    status: unresolved.length ? 'PASS_WITH_UNRESOLVED' : 'PASS',
    generatedFrom: {
      selection: `research/${machineId}/selection-data.json`,
      observation: `research/${machineId}/machine-observation-data.json`,
    },
    sectionOrder,
    sections,
    inputContracts,
    ...(Object.keys(evidenceContracts).length ? { evidenceContracts } : {}),
    unresolved,
    auditNotes: [
      'Section order follows SelectionData display order and user-facing category labels.',
      'Only Selection-adopted input contracts are exposed; rejected Research features do not create normal UI inputs.',
      'Blank means unobserved and explicit 0 means observed zero; history and restore must preserve this distinction.',
      'Observation unresolved machine-menu/data-counter/linked-service details remain verification items and are not invented into UI.',
      'Evidence options inherit the SelectionData evidence group so the same deterministic setting constraints are reused without duplicate definitions.'
    ],
  };
  fs.writeFileSync(outputPath, JSON.stringify(ui, null, 2) + '\n', 'utf8');
  console.log(`GENERATED ${machineId}`);
}
