#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateUiDesignData } from './validate-ui-design-data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FORMAL_PUBLISH_COMMIT = '431cfcc7a465dcb7c5053f7ca94e5da8ea5cdac2';
const IDS = [
  'L_AZURLANE_THE_ANIMATION_KN',
  'L_DRUAGA_NO_TOU_ZA',
  'L_SMASLO_TOKYO_REVENGERS_ZF',
  'L_BABEL_BA',
  'L_SHIN_ONIMUSHA_3_SA',
  'L_ZENIGATA_5_L2',
  'L_TOARU_KAGAKU_NO_RAILGUN_2_FV',
  'L_ZETTAI_SHOGEKI_FORCE_FH',
  'L_KAKUMEIKI_VALVRAVE_2_JF',
  'L_NEO_PLANET_SLED',
];

function gitShowJson(spec) {
  const r = spawnSync('git', ['show', spec], { cwd: ROOT, encoding: 'utf8' });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`git show failed for ${spec}: ${r.stderr}`);
  return JSON.parse(r.stdout);
}

function modeFor(input, item) {
  if (item.widget === 'counter' || input.type === 'counter') return 'COUNTER';
  if (item.widget === 'number' || ['integer','number'].includes(input.type)) return 'NUMBER';
  if (['select','multi_select'].includes(item.widget) || ['enum','multi_enum'].includes(input.type)) return 'SELECT';
  if (input.type === 'boolean') return 'SELECT';
  return 'READ_ONLY';
}

function contractFor(input, item) {
  const c = {
    name: item.label ?? input.name,
    mode: modeFor(input, item),
  };
  if (item.gridSpan !== undefined) c.gridSpan = item.gridSpan;
  const cfg = item.config ?? {};
  for (const key of ['directInput','compact','note','step','emptyMeansUnobserved','observedZeroAllowed']) {
    if (cfg[key] !== undefined) c[key] = cfg[key];
  }
  if (Array.isArray(cfg.quickAdd) && cfg.quickAdd.length) c.quickAdd = [...cfg.quickAdd];
  return c;
}

function recoverOne(machineId) {
  const pkg = gitShowJson(`${FORMAL_PUBLISH_COMMIT}:machines/${machineId}/machine-package.json`);
  if (pkg.machine?.machineId !== machineId) throw new Error(`${machineId}: formal package machineId mismatch`);
  const inputMap = new Map((pkg.inputs?.inputs ?? []).map(x => [x.id, x]));
  const sectionOrder = [];
  const sections = {};
  const inputContracts = {};

  for (const section of pkg.ui?.sections ?? []) {
    const title = section.title;
    if (!title || sections[title]) throw new Error(`${machineId}: duplicate/missing formal UI section title`);
    const inputIds = [];
    for (const item of section.items ?? []) {
      if (item.type !== 'input') continue;
      const input = inputMap.get(item.inputId);
      if (!input) throw new Error(`${machineId}: formal UI references missing input ${item.inputId}`);
      inputIds.push(item.inputId);
      inputContracts[item.inputId] = contractFor(input, item);
    }
    sectionOrder.push(title);
    sections[title] = {
      inputIds,
      ...(section.description ? { description: section.description } : {}),
      ...(typeof section.collapsible === 'boolean' ? { collapsible: section.collapsible } : {}),
      ...(typeof section.defaultExpanded === 'boolean' ? { defaultExpanded: section.defaultExpanded } : {}),
      ...(Array.isArray(section.summaryInputIds) ? { summaryInputIds: [...section.summaryInputIds] } : {}),
      ...(Array.isArray(section.subgroups) ? { subgroups: structuredClone(section.subgroups) } : {}),
    };
  }

  for (const input of pkg.inputs?.inputs ?? []) {
    if (['counter','integer','number'].includes(input.type) && !inputContracts[input.id]) {
      throw new Error(`${machineId}: formal numeric input not present in curated UI: ${input.id}`);
    }
  }

  const design = {
    schemaVersion: 'ui-design-data-v1',
    machineId,
    status: 'PASS',
    generatedFrom: {
      formalPublishCommit: FORMAL_PUBLISH_COMMIT,
      note: 'Recovered once from the Gate E-passing Formal Publish UI contract after generic MachineData regeneration exposed the missing UI Design source layer.',
    },
    sectionOrder,
    sections,
    inputContracts,
    unresolved: [],
    auditNotes: [
      `Recovered from Formal Publish ${FORMAL_PUBLISH_COMMIT}; UI semantics are now explicit source data rather than implicit machine-package state.`,
      'Numeric inputs preserve empty=unobserved and explicit zero where the Formal Publish contract declared those semantics.',
      'This recovery does not copy probabilities, Difficulty values, Research facts, or machine identity from historical output.',
    ],
  };
  const errors = validateUiDesignData(design, { expectedMachineId: machineId });
  if (errors.length) throw new Error(`${machineId}: recovered UI Design invalid: ${errors.join('; ')}`);
  const out = path.join(ROOT, 'research', machineId, 'ui-design-data.json');
  fs.writeFileSync(out, JSON.stringify(design, null, 2) + '\n');
  console.log(`RECOVERED ${machineId}: ${sectionOrder.length} sections / ${Object.keys(inputContracts).length} input contracts`);
}

for (const id of IDS) recoverOne(id);
console.log(`PASS: recovered UI Design source for ${IDS.length}/10 machines from Formal Publish ${FORMAL_PUBLISH_COMMIT}`);
