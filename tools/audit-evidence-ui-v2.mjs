#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BASELINE_SHA = process.env.EVIDENCE_UI_V2_BASELINE_SHA || 'e38ad44297f6c1dcb923f0ce7417373099c86f61';
const REGISTRY_PATH = path.join(ROOT, 'machine-registry.json');
const OUT_DIR = path.join(ROOT, 'audit-reports');

const RESULT_RE = /(設定下限|確認した設定下限|トロフィーで確認した設定下限|設定[23456]以上|設定6(?:確定)?|高設定確定|設定[1-6]否定)/;
const RESULT_SUFFIX_RE = /[（(](?:設定)?(?:[23456]以上|6(?:確定)?|[1-6]否定|高設定確定|設定下限)[）)]/g;
const ABSTRACT_RE = /(その他の?確定情報|確認した設定下限|設定下限|トロフィーで確認した設定下限|確定情報)$/;
const NONE_RE = /^(NONE|なし|確認なし|未確認|該当なし)$/i;
const INTERACTIVE_TYPES = new Set(['enum','multi_enum','select','multi_select','checkbox','toggle','counter','integer','number','boolean']);
const REPEAT_TYPES = new Set(['counter','integer','number']);
const CATALOG = [
  { groupId:'ending-screen', displayName:'終了画面系', re:/(終了画面|終了時画面|終了時|完走画面)/ },
  { groupId:'trophy-stamp', displayName:'トロフィー／スタンプ系', re:/(トロフィー|スタンプ)/ },
  { groupId:'voice-line', displayName:'ボイス／セリフ系', re:/(ボイス|セリフ|台詞)/ },
  { groupId:'character-intro', displayName:'キャラクター紹介系', re:/(キャラ紹介|キャラクター紹介)/ },
  { groupId:'navigation-instruction', displayName:'ナビ／指示系', re:/(ナビ|指示)/ },
  { groupId:'judge-special-effect', displayName:'ジャッジ／特殊演出系', re:/(ジャッジ|特殊演出|告知演出|PUSH)/i },
  { groupId:'symbol-stop-pattern', displayName:'図柄／出目系', re:/(図柄|出目|停止形|停止型)/ },
  { groupId:'lamp-color-gimmick', displayName:'ランプ／色／役物系', re:/(ランプ|役物|点灯|発光|色)/ },
];

const segmenter = typeof Intl?.Segmenter === 'function'
  ? new Intl.Segmenter('ja', { granularity:'grapheme' }) : null;
const graphemeLength = s => segmenter ? [...segmenter.segment(String(s))].length : [...String(s)].length;
const readJson = file => { try { return JSON.parse(fs.readFileSync(file,'utf8')); } catch { return null; } };
const rel = file => path.relative(ROOT,file).replaceAll('\\','/');
const stripResult = label => String(label ?? '').replace(RESULT_SUFFIX_RE,'').trim().replace(/^「|」$/g,'');
const contextOf = text => {
  for (const g of CATALOG) if (g.re.test(text)) return g.groupId;
  return 'UNCLASSIFIED';
};
function walkJson(dir, out=[]) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir,{withFileTypes:true})) {
    const p=path.join(dir,ent.name);
    if (ent.isDirectory()) walkJson(p,out);
    else if (/\.json$/i.test(ent.name)) out.push(p);
  }
  return out;
}
function collectObjects(node, predicate, out=[], trail='$') {
  if (Array.isArray(node)) node.forEach((v,i)=>collectObjects(v,predicate,out,`${trail}[${i}]`));
  else if (node && typeof node === 'object') {
    if (predicate(node)) out.push({ value:node, trail });
    for (const [k,v] of Object.entries(node)) collectObjects(v,predicate,out,`${trail}.${k}`);
  }
  return out;
}
function referencedInputIds(doc) {
  const refs = new Map();
  const objects = collectObjects(doc, o => o && typeof o === 'object');
  for (const {value:o,trail} of objects) {
    for (const [k,v] of Object.entries(o)) {
      if (!/inputid|inputids/i.test(k)) continue;
      const ids = Array.isArray(v) ? v : [v];
      for (const id of ids) if (typeof id === 'string') {
        if (!refs.has(id)) refs.set(id,[]);
        refs.get(id).push({ key:k, trail });
      }
    }
  }
  return refs;
}
function registryMachines(reg) {
  if (Array.isArray(reg)) return reg;
  for (const k of ['machines','entries','items']) if (Array.isArray(reg?.[k])) return reg[k];
  return [];
}
function catalogMeta(groupId, featureShare=false) {
  const g = CATALOG.find(x=>x.groupId===groupId);
  return {
    groupId,
    displayName:g?.displayName ?? '未分類',
    observationContext:groupId,
    placementMode:featureShare ? 'NATURAL_OBSERVATION' : 'EVIDENCE_SECTION',
  };
}

const registry = readJson(REGISTRY_PATH);
if (!registry) throw new Error('machine-registry.json is not readable');
const machines = registryMachines(registry);
if (!machines.length) throw new Error('machine-registry.json contains no machines');

const researchFiles = walkJson(path.join(ROOT,'research'));
const report = {
  schemaVersion:'evidence-ui-v2-phase2-audit-v2',
  baselineSha:BASELINE_SHA,
  generatedAt:new Date().toISOString(),
  registrySchemaVersion:registry.schemaVersion ?? null,
  registryCount:machines.length,
  catalog:CATALOG.map(({groupId,displayName})=>({groupId,displayName})),
  machines:[], summary:{}
};

for (const registryEntry of machines) {
  const machineId = registryEntry.machineId;
  const packageFile = path.join(ROOT,'machines',machineId,'machine-package.json');
  const pkg = readJson(packageFile);
  const inputs = Array.isArray(pkg?.inputs?.inputs) ? pkg.inputs.inputs : [];
  const evidenceInputs = inputs.filter(i => String(i?.category ?? '').toUpperCase()==='EVIDENCE');
  const refs = pkg ? referencedInputIds(pkg) : new Map();
  const evidenceObjects = pkg ? collectObjects(pkg, o => typeof o?.evidenceId === 'string') : [];
  const researchForMachine = researchFiles.filter(f => rel(f).toLowerCase().includes(String(machineId).toLowerCase()));

  const items = evidenceInputs.map(input => {
    const options = Array.isArray(input.options) ? input.options : [];
    const labels = options.map(o=>String(o?.label ?? o?.name ?? o?.value ?? '')).filter(Boolean);
    const normalizedLabels = labels.map(stripResult);
    const joined = [input.name,...labels].filter(Boolean).join(' ');
    const groupId = contextOf(joined);
    const inputRefs = refs.get(input.id) ?? [];
    const featureShare = inputRefs.some(r => /feature/i.test(r.trail));
    const directResultInput = RESULT_RE.test(String(input.name ?? ''));
    const legacySelect = INTERACTIVE_TYPES.has(String(input.type ?? '').toLowerCase()) && directResultInput;
    const badgeSplit = labels.filter(l=>RESULT_RE.test(l) && stripResult(l)!==l);
    const noneOptions = labels.filter(l=>NONE_RE.test(stripResult(l)));
    const abstractName = ABSTRACT_RE.test(String(input.name ?? '').trim());
    const maxTitleGraphemes = normalizedLabels.length ? Math.max(...normalizedLabels.map(graphemeLength)) : graphemeLength(input.name ?? '');
    const repeatSemantics = REPEAT_TYPES.has(String(input.type ?? '').toLowerCase());
    return {
      inputId:input.id ?? null,
      name:input.name ?? null,
      currentInputType:input.type ?? null,
      observationContext:groupId,
      catalog:catalogMeta(groupId,featureShare),
      featureShare,
      inputSemantics: repeatSemantics ? 'REPEATED_OBSERVATION' : 'ONE_TIME_OR_ENUM_OBSERVATION',
      recommendedInputMode: repeatSemantics ? 'COUNTER_KEEP' : 'CHECKBOX_OR_TOGGLE_REVIEW',
      legacySelect,
      directSettingResultInput:directResultInput,
      genericEvidenceSeparation:abstractName,
      namingResearchReopenCandidate:abstractName || groupId==='UNCLASSIFIED',
      resultBadgeSeparationCandidates:badgeSplit,
      noneOptionsForbidden:noneOptions,
      normalizedTitles:normalizedLabels,
      maxTitleGraphemes,
      layoutCandidate:maxTitleGraphemes<=5 ? 'TWO_COLUMN_ELIGIBLE' : 'ONE_COLUMN',
      sourceRefs:input.sourceEvidenceRefs ?? [],
      structuralReferences:inputRefs,
    };
  });

  const nonEvidenceShared = inputs.filter(input => {
    if (String(input?.category ?? '').toUpperCase()==='EVIDENCE') return false;
    const r=refs.get(input.id) ?? [];
    const evidenceRef=r.some(x=>/evidence/i.test(x.trail));
    const featureRef=r.some(x=>/feature/i.test(x.trail));
    return evidenceRef && featureRef;
  }).map(i=>({inputId:i.id,name:i.name,type:i.type,category:i.category,placementMode:'NATURAL_OBSERVATION'}));

  const unresolved = items.filter(i=>i.observationContext==='UNCLASSIFIED');
  const researchReopen = items.filter(i=>i.namingResearchReopenCandidate);
  const selectionReopen = items.filter(i=>i.legacySelect || i.noneOptionsForbidden.length>0);

  report.machines.push({
    machineId,
    displayName:registryEntry.displayName ?? pkg?.machine?.displayName ?? null,
    appStatus:registryEntry.appStatus ?? null,
    packagePresent:Boolean(pkg),
    evidencePresent:items.length>0 || evidenceObjects.length>0,
    evidenceInputCount:items.length,
    evidenceDefinitionCount:evidenceObjects.length,
    researchFileCount:researchForMachine.length,
    observationGroups:[...new Set(items.map(i=>i.observationContext))],
    items,
    naturalFeatureSharedInputs:nonEvidenceShared,
    legacyInteractiveCount:items.filter(i=>i.legacySelect).length,
    resultBadgeSeparationCount:items.reduce((n,i)=>n+i.resultBadgeSeparationCandidates.length,0),
    genericEvidenceSeparationCount:items.filter(i=>i.genericEvidenceSeparation).length,
    unclassifiedContextCount:unresolved.length,
    researchReopenCandidates:researchReopen.map(i=>i.inputId),
    selectionReopenCandidates:selectionReopen.map(i=>i.inputId),
  });
}

const ms=report.machines;
report.summary={
  registryCount:ms.length,
  packagePresent:ms.filter(m=>m.packagePresent).length,
  packageMissing:ms.filter(m=>!m.packagePresent).length,
  evidencePresentMachines:ms.filter(m=>m.evidencePresent).length,
  evidenceInputCount:ms.reduce((n,m)=>n+m.evidenceInputCount,0),
  legacyInteractiveMachines:ms.filter(m=>m.legacyInteractiveCount>0).length,
  legacyInteractiveInputs:ms.reduce((n,m)=>n+m.legacyInteractiveCount,0),
  resultBadgeSeparationMachines:ms.filter(m=>m.resultBadgeSeparationCount>0).length,
  resultBadgeSeparationOptions:ms.reduce((n,m)=>n+m.resultBadgeSeparationCount,0),
  genericEvidenceSeparationMachines:ms.filter(m=>m.genericEvidenceSeparationCount>0).length,
  naturalFeatureShareMachines:ms.filter(m=>m.naturalFeatureSharedInputs.length>0).length,
  unclassifiedContextMachines:ms.filter(m=>m.unclassifiedContextCount>0).length,
  unclassifiedContextInputs:ms.reduce((n,m)=>n+m.unclassifiedContextCount,0),
  researchReopenMachines:ms.filter(m=>m.researchReopenCandidates.length>0).length,
  selectionReopenMachines:ms.filter(m=>m.selectionReopenCandidates.length>0).length,
};

const lines=[
  '# Evidence UI v2 Phase 2 inventory', '',
  `- Baseline SHA: \`${report.baselineSha}\``,
  `- Registry machines: ${report.summary.registryCount}`,
  `- Machine packages present: ${report.summary.packagePresent} (missing ${report.summary.packageMissing})`,
  `- Evidence-present machines: ${report.summary.evidencePresentMachines}`,
  `- Evidence inputs: ${report.summary.evidenceInputCount}`,
  `- Legacy interactive inputs: ${report.summary.legacyInteractiveInputs} / ${report.summary.legacyInteractiveMachines} machines`,
  `- Result-badge separation candidates: ${report.summary.resultBadgeSeparationOptions} options / ${report.summary.resultBadgeSeparationMachines} machines`,
  `- Generic Evidence separation candidates: ${report.summary.genericEvidenceSeparationMachines} machines`,
  `- Natural Feature-share candidates: ${report.summary.naturalFeatureShareMachines} machines`,
  `- Unclassified contexts: ${report.summary.unclassifiedContextInputs} inputs / ${report.summary.unclassifiedContextMachines} machines`,
  `- Research reopen candidates: ${report.summary.researchReopenMachines} machines`,
  `- Selection reopen candidates: ${report.summary.selectionReopenMachines} machines`, '',
  '## Machines needing review',''
];
for (const m of ms.filter(m=>m.legacyInteractiveCount||m.resultBadgeSeparationCount||m.genericEvidenceSeparationCount||m.unclassifiedContextCount||m.naturalFeatureSharedInputs.length)) {
  lines.push(`- **${m.machineId}** ${m.displayName ?? ''}: legacy=${m.legacyInteractiveCount}, badgeSplit=${m.resultBadgeSeparationCount}, generic=${m.genericEvidenceSeparationCount}, shared=${m.naturalFeatureSharedInputs.length}, unclassified=${m.unclassifiedContextCount}`);
}

fs.mkdirSync(OUT_DIR,{recursive:true});
fs.writeFileSync(path.join(OUT_DIR,'evidence-ui-v2-phase2.json'),JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(path.join(OUT_DIR,'evidence-ui-v2-phase2.md'),lines.join('\n')+'\n');
console.log(JSON.stringify(report.summary,null,2));
if (report.summary.packageMissing>0) console.error('WARN: registry machines without machine-package.json:',report.summary.packageMissing);
