#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const IN_FILE = path.join(ROOT, 'audit-reports', 'evidence-ui-v2-phase2.json');
const JSON_OUT = path.join(ROOT, 'audit-reports', 'evidence-ui-v2-phase2-breakdowns.json');
const MD_OUT = path.join(ROOT, 'audit-reports', 'evidence-ui-v2-phase2-breakdowns.md');
const SPECIAL_BEHAVIOR_REOPEN_RE = /^設定[HL]特殊挙動$/;

const segmenter = typeof Intl?.Segmenter === 'function'
  ? new Intl.Segmenter('ja', { granularity:'grapheme' }) : null;
const graphemeLength = s => segmenter ? [...segmenter.segment(String(s))].length : [...String(s)].length;
const uniq = xs => [...new Set(xs)];

if (!fs.existsSync(IN_FILE)) throw new Error('phase 2 inventory JSON is missing; run tools/audit-evidence-ui-v2.mjs first');
const inventory = JSON.parse(fs.readFileSync(IN_FILE, 'utf8'));
const machines = Array.isArray(inventory?.machines) ? inventory.machines : [];

const researchReopen = [];
const legacyMigration = [];
const legacyLexical = [];
const specialBehaviorReopen = [];
const featureEvidenceSharing = [];
const groupLayouts = [];

for (const machine of machines) {
  const items = Array.isArray(machine?.items) ? machine.items : [];

  for (const item of items) {
    const base = {
      machineId:machine.machineId,
      displayName:machine.displayName ?? null,
      inputId:item.inputId ?? null,
      name:item.name ?? null,
      currentInputType:item.currentInputType ?? null,
    };
    const isSpecialBehaviorReopen = SPECIAL_BEHAVIOR_REOPEN_RE.test(String(item.name ?? '').trim());
    if (item.namingResearchReopenCandidate) {
      const reason = isSpecialBehaviorReopen
        ? 'SPECIAL_BEHAVIOR_NEEDS_OBSERVATION_CONTEXT'
        : item.legacyAbstraction
          ? 'LEGACY_ABSTRACTION_NEEDS_OBSERVATION_CONTEXT'
          : 'GENERIC_EVIDENCE_NEEDS_OBSERVATION_CONTEXT';
      researchReopen.push({ ...base, reason });
    }
    if (isSpecialBehaviorReopen) {
      specialBehaviorReopen.push({ ...base, reason:'OBSERVABLE_BEHAVIOR_NAME_IS_NOT_A_DIRECT_SETTING_RESULT' });
      continue;
    }
    if (item.legacyAbstraction) legacyLexical.push(base);
    if (item.legacySelect) legacyMigration.push({ ...base, reason:'INTERACTIVE_DIRECT_SETTING_RESULT_INPUT' });
  }

  const shared = Array.isArray(machine?.naturalFeatureSharedInputs) ? machine.naturalFeatureSharedInputs : [];
  if (shared.length) featureEvidenceSharing.push({
    machineId:machine.machineId,
    displayName:machine.displayName ?? null,
    inputs:shared,
  });

  const resolved = items.filter(i => i.observationContext && !['UNRESOLVED_REOPEN','UNCLASSIFIED'].includes(i.observationContext));
  const byGroup = new Map();
  for (const item of resolved) {
    const key = item.observationContext;
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key).push(item);
  }
  for (const [observationContext, members] of byGroup) {
    const titles = uniq(members.flatMap(i => {
      const normalized = Array.isArray(i.normalizedTitles) ? i.normalizedTitles : [];
      return normalized.length ? normalized : [i.name].filter(Boolean);
    }).filter(Boolean));
    const maxTitleGraphemes = titles.length ? Math.max(...titles.map(graphemeLength)) : 0;
    groupLayouts.push({
      machineId:machine.machineId,
      displayName:machine.displayName ?? null,
      observationContext,
      inputIds:members.map(i=>i.inputId).filter(Boolean),
      titles,
      maxTitleGraphemes,
      layoutCandidate:maxTitleGraphemes <= 5 ? 'TWO_COLUMN_ELIGIBLE' : 'ONE_COLUMN',
      decisionScope:'OBSERVATION_GROUP',
    });
  }
}

const byReason = rows => Object.fromEntries([...new Set(rows.map(x=>x.reason))].sort().map(reason=>[reason, rows.filter(x=>x.reason===reason).length]));
const summary = {
  registryMachines:inventory?.summary?.registryCount ?? inventory?.registryCount ?? machines.length,
  researchReopenInputs:researchReopen.length,
  researchReopenMachines:new Set(researchReopen.map(x=>x.machineId)).size,
  legacyMigrationInputs:legacyMigration.length,
  legacyMigrationMachines:new Set(legacyMigration.map(x=>x.machineId)).size,
  legacyLexicalInputs:legacyLexical.length,
  legacyLexicalMachines:new Set(legacyLexical.map(x=>x.machineId)).size,
  specialBehaviorReopenInputs:specialBehaviorReopen.length,
  specialBehaviorReopenMachines:new Set(specialBehaviorReopen.map(x=>x.machineId)).size,
  featureEvidenceSharingMachines:featureEvidenceSharing.length,
  featureEvidenceSharingInputs:featureEvidenceSharing.reduce((n,m)=>n+m.inputs.length,0),
  unclassifiedActualObservationInputs:machines.reduce((n,m)=>n+(m.unclassifiedObservationContextCount ?? 0),0),
  resolvedObservationGroups:groupLayouts.length,
};

const invariants = [
  { id:'RESEARCH_REOPEN_INPUTS', expected:93, actual:summary.researchReopenInputs },
  { id:'LEGACY_INTERACTIVE_MIGRATION_INPUTS', expected:88, actual:summary.legacyMigrationInputs },
  { id:'SPECIAL_BEHAVIOR_REOPEN_INPUTS', expected:1, actual:summary.specialBehaviorReopenInputs },
  { id:'FEATURE_EVIDENCE_SHARING_MACHINES', expected:6, actual:summary.featureEvidenceSharingMachines },
  { id:'UNCLASSIFIED_ACTUAL_OBSERVATION_INPUTS', expected:0, actual:summary.unclassifiedActualObservationInputs },
].map(x=>({ ...x, status:x.actual===x.expected ? 'PASS' : 'FAIL' }));

const report = {
  schemaVersion:'evidence-ui-v2-phase2-breakdowns-v2',
  generatedAt:new Date().toISOString(),
  source:'audit-reports/evidence-ui-v2-phase2.json',
  policyNotes:[
    'Layout is decided once per resolved observationContext group, never independently per input.',
    'UNRESOLVED_REOPEN inputs receive no inferred layout decision.',
    'Legacy migration means interactive direct-setting-result abstractions only.',
    '設定H特殊挙動 / 設定L特殊挙動 are observable-behavior placeholders: they remain Research reopen but are not counted as Legacy direct-setting-result abstractions.',
    'Research reopen names/contexts are not guessed.'
  ],
  summary,
  invariants,
  breakdowns:{
    researchReopen:{ reasons:byReason(researchReopen), items:researchReopen },
    legacyMigration:{ reasons:byReason(legacyMigration), items:legacyMigration },
    legacyLexical:{ items:legacyLexical },
    specialBehaviorReopen:{ items:specialBehaviorReopen },
    featureEvidenceSharingCandidates:featureEvidenceSharing,
    groupLayouts,
  }
};

fs.writeFileSync(JSON_OUT, `${JSON.stringify(report,null,2)}\n`);
const md = [
  '# Evidence UI v2 Phase 2 fixed breakdowns', '',
  `- Research reopen: ${summary.researchReopenInputs} inputs / ${summary.researchReopenMachines} machines`,
  `- Legacy migration: ${summary.legacyMigrationInputs} interactive inputs / ${summary.legacyMigrationMachines} machines`,
  `- Special-behavior Research reopen (non-Legacy): ${summary.specialBehaviorReopenInputs} input / ${summary.specialBehaviorReopenMachines} machine`,
  `- Feature/Evidence sharing candidates: ${summary.featureEvidenceSharingMachines} machines / ${summary.featureEvidenceSharingInputs} inputs`,
  `- Unclassified actual observation contexts: ${summary.unclassifiedActualObservationInputs} inputs`,
  `- Resolved observation groups with group-unit layout decision: ${summary.resolvedObservationGroups}`, '',
  '## Invariants', '',
  ...invariants.map(x=>`- **${x.status}** ${x.id}: expected ${x.expected}, actual ${x.actual}`), '',
  '## Special-behavior reopen separated from Legacy', '',
  ...specialBehaviorReopen.map(x=>`- **${x.machineId}** ${x.displayName ?? ''}: ${x.inputId ?? '?'} / ${x.name ?? ''}`),
  ...(specialBehaviorReopen.length ? [] : ['- none']), '',
  '## Feature / Evidence sharing candidates', '',
  ...featureEvidenceSharing.map(m=>`- **${m.machineId}** ${m.displayName ?? ''}: ${m.inputs.map(i=>i.inputId ?? i.name ?? '?').join(', ')}`),
  ...(featureEvidenceSharing.length ? [] : ['- none']), '',
  '## Research reopen reasons', '',
  ...Object.entries(byReason(researchReopen)).map(([k,v])=>`- ${k}: ${v}`), '',
  '## Layout policy', '',
  '- Resolved inputs are grouped by observationContext.',
  '- The longest normalized title in the whole group determines ONE_COLUMN vs TWO_COLUMN_ELIGIBLE.',
  '- Research-reopen / unclassified contexts are intentionally left undecided.', ''
].join('\n');
fs.writeFileSync(MD_OUT, md);

console.log(`Phase 2 fixed breakdowns: reopen=${summary.researchReopenInputs}, legacyMigration=${summary.legacyMigrationInputs}, specialBehaviorReopen=${summary.specialBehaviorReopenInputs}, sharedMachines=${summary.featureEvidenceSharingMachines}, unclassified=${summary.unclassifiedActualObservationInputs}, groups=${summary.resolvedObservationGroups}`);
const failed = invariants.filter(x=>x.status==='FAIL');
if (failed.length) {
  failed.forEach(x=>console.error(`Invariant FAIL ${x.id}: expected ${x.expected}, actual ${x.actual}`));
  process.exitCode = 1;
}
