#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BASELINE_SHA = process.env.EVIDENCE_UI_V2_BASELINE_SHA || 'e38ad44297f6c1dcb923f0ce7417373099c86f61';
const REGISTRY_PATH = path.join(ROOT, 'machine-registry.json');
const OUT_DIR = path.join(ROOT, 'audit-reports');

const SETTING_RESULT_TOKEN_RE = /(設定下限|設定[23456]以上|設定6(?:確定)?|高設定確定|設定[1-6]否定|設定[13456](?:・[13456])*)/;
const RESULT_SUFFIX_RE = /[（(](?:設定)?(?:[23456]以上|6(?:確定)?|[1-6]否定|高設定確定|設定下限|[13456](?:・[13456])*)[）)]/g;
const PURE_LEGACY_RE = /^(?:設定下限|確認した設定下限|トロフィーで確認した設定下限|設定[23456]以上|設定6(?:確定)?|高設定確定|設定[1-6]否定|否定設定|設定集合|設定確定・否定|確認した設定確定・否定(?:情報)?|確認した設定否定|確認した設定限定|設定L判別|設定H特殊挙動|設定L特殊挙動)$/;
const GENERIC_REOPEN_RE = /^(?:その他の?確定情報|成立契機の確定情報|確定情報|設定示唆|エンディング示唆|エンディング中の設定示唆)$/;
const NONE_RE = /^(?:NONE|なし|確認なし|未確認|未選択|該当なし)$/i;
const INTERACTIVE_TYPES = new Set(['enum','multi_enum','select','multi_select','checkbox','toggle','counter','integer','number','boolean']);
const REPEAT_TYPES = new Set(['counter','integer','number']);

// Priority matters: an "AT終了時ボイス" is a voice observation, not an ending-screen observation.
const CATALOG = [
  { groupId:'voice-line', displayName:'ボイス／セリフ系', re:/(ボイス|セリフ|台詞|スマTALK|隠れ凪|隠しナギ)/i },
  { groupId:'trophy-stamp', displayName:'トロフィー／スタンプ系', re:/(トロフィー|スタンプ|コイン)/ },
  { groupId:'payout-display', displayName:'獲得枚数表示系', re:/(獲得枚数|\d+枚(?:OVER|突破)|枚数表示|BQB中\d+枚)/i },
  { groupId:'menu-display', displayName:'メニュー表示系', re:/(メニュー|サブ液晶)/ },
  { groupId:'card-display', displayName:'カード表示系', re:/(カード|ガチャ)/ },
  { groupId:'sound-music', displayName:'サウンド／BGM系', re:/(BGM|サウンド|楽曲|蛍の光|音声)/i },
  { groupId:'character-intro', displayName:'キャラクター紹介系', re:/(キャラ紹介|キャラクター紹介|キャラカード|ミニキャラ|実写(?:ペンギン|ウサギ|ライオン|ブルドッグ)|REG中.*(?:キャラ|実写|背景|シナリオ)|ドレスヱリカ|GM戦人|オール金背景)/ },
  { groupId:'ending-screen', displayName:'終了画面系', re:/(終了画面|終了時画面|完走画面|(?:AT|BT|CZ|BIG|REG|ボーナス|ジャングルボーナス|ウイングボーナス).*終了|エンディング|セット開始画面|開始画面|確定画面)/i },
  { groupId:'navigation-instruction', displayName:'ナビ／指示系', re:/(ナビ|指示)/ },
  { groupId:'judge-special-effect', displayName:'ジャッジ／特殊演出系', re:/(ジャッジ|特殊演出|告知演出|PUSH|必殺技|ムービー|プレミアム|シナリオ|タイマー|残り(?:妖魔|体)|継続ゲーム数|開始ゲーム数|上乗せ|加算カロリー)/i },
  { groupId:'symbol-stop-pattern', displayName:'図柄／出目系', re:/(図柄|出目|停止形|停止型|7セグ|セグ)/i },
  { groupId:'lamp-color-gimmick', displayName:'ランプ／色／役物系', re:/(ランプ|役物|点灯|発光|LED|パネル|枠|色|衣装変化)/i },
  { groupId:'other-independent-evidence', displayName:'その他の独立確定情報', re:/.+/ },
];

const segmenter = typeof Intl?.Segmenter === 'function'
  ? new Intl.Segmenter('ja', { granularity:'grapheme' }) : null;
const graphemeLength = s => segmenter ? [...segmenter.segment(String(s))].length : [...String(s)].length;
const readJson = file => { try { return JSON.parse(fs.readFileSync(file,'utf8')); } catch { return null; } };
const rel = file => path.relative(ROOT,file).replaceAll('\\','/');
const stripResult = label => String(label ?? '').replace(RESULT_SUFFIX_RE,'').trim().replace(/^「|」$/g,'');
const csvCell = v => `"${String(v ?? '').replaceAll('"','""')}"`;
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
  for (const {value:o,trail} of objects) for (const [k,v] of Object.entries(o)) {
    if (!/inputid|inputids/i.test(k)) continue;
    const ids = Array.isArray(v) ? v : [v];
    for (const id of ids) if (typeof id === 'string') {
      if (!refs.has(id)) refs.set(id,[]);
      refs.get(id).push({ key:k, trail });
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
  return g ? { groupId, displayName:g.displayName, observationContext:groupId,
    placementMode:featureShare ? 'NATURAL_OBSERVATION' : 'EVIDENCE_SECTION' } : null;
}
function isLegacyAbstraction(name) { return PURE_LEGACY_RE.test(String(name ?? '').trim()); }
function isGenericReopen(name) { return GENERIC_REOPEN_RE.test(String(name ?? '').trim()); }

const registry = readJson(REGISTRY_PATH);
if (!registry) throw new Error('machine-registry.json is not readable');
const machines = registryMachines(registry);
if (!machines.length) throw new Error('machine-registry.json contains no machines');
const researchFiles = walkJson(path.join(ROOT,'research'));

const report = {
  schemaVersion:'evidence-ui-v2-phase2-audit-v3', baselineSha:BASELINE_SHA,
  generatedAt:new Date().toISOString(), registrySchemaVersion:registry.schemaVersion ?? null,
  registryCount:machines.length,
  catalog:CATALOG.filter(g=>g.groupId!=='other-independent-evidence').map(({groupId,displayName})=>({groupId,displayName}))
    .concat([{groupId:'other-independent-evidence',displayName:'その他の独立確定情報'}]),
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
    const name=String(input.name ?? '');
    const options = Array.isArray(input.options) ? input.options : [];
    const labels = options.map(o=>String(o?.label ?? o?.name ?? o?.value ?? '')).filter(Boolean);
    const normalizedLabels = labels.map(stripResult);
    const pureLegacy = isLegacyAbstraction(name);
    const genericReopen = isGenericReopen(name);
    const joined = [stripResult(name),...normalizedLabels].filter(Boolean).join(' ');
    const groupId = pureLegacy || genericReopen ? 'UNRESOLVED_REOPEN' : contextOf(joined);
    const inputRefs = refs.get(input.id) ?? [];
    const featureShare = inputRefs.some(r => /feature/i.test(r.trail));
    const legacySelect = INTERACTIVE_TYPES.has(String(input.type ?? '').toLowerCase()) && pureLegacy;
    const nameBadgeSplit = SETTING_RESULT_TOKEN_RE.test(name) && stripResult(name)!==name ? [name] : [];
    const optionBadgeSplit = labels.filter(l=>SETTING_RESULT_TOKEN_RE.test(l) && stripResult(l)!==l);
    const badgeSplit = [...nameBadgeSplit,...optionBadgeSplit];
    const noneOptions = labels.filter(l=>NONE_RE.test(stripResult(l)));
    const titlesForLayout = normalizedLabels.filter(l=>!NONE_RE.test(l));
    const maxTitleGraphemes = titlesForLayout.length ? Math.max(...titlesForLayout.map(graphemeLength)) : graphemeLength(stripResult(name));
    const repeatSemantics = REPEAT_TYPES.has(String(input.type ?? '').toLowerCase());
    const namingResearchReopenCandidate = pureLegacy || genericReopen;
    return {
      inputId:input.id ?? null, name:input.name ?? null, currentInputType:input.type ?? null,
      observationContext:groupId,
      catalog:groupId==='UNRESOLVED_REOPEN' ? null : catalogMeta(groupId,featureShare),
      featureShare,
      inputSemantics:repeatSemantics ? 'REPEATED_OBSERVATION' : 'ONE_TIME_OR_ENUM_OBSERVATION',
      recommendedInputMode:repeatSemantics ? 'COUNTER_KEEP' : 'CHECKBOX_OR_TOGGLE_REVIEW',
      legacySelect, legacyAbstraction:pureLegacy,
      directSettingResultInput:pureLegacy,
      genericEvidenceSeparation:genericReopen || /その他の?確定情報/.test(name),
      namingResearchReopenCandidate,
      resultBadgeSeparationCandidates:badgeSplit,
      noneOptionsForbidden:noneOptions,
      normalizedTitles:titlesForLayout,
      maxTitleGraphemes,
      layoutCandidate:maxTitleGraphemes<=5 ? 'TWO_COLUMN_ELIGIBLE' : 'ONE_COLUMN',
      sourceRefs:input.sourceEvidenceRefs ?? [], structuralReferences:inputRefs,
    };
  });

  const nonEvidenceShared = inputs.filter(input => {
    if (String(input?.category ?? '').toUpperCase()==='EVIDENCE') return false;
    const r=refs.get(input.id) ?? [];
    return r.some(x=>/evidence/i.test(x.trail)) && r.some(x=>/feature/i.test(x.trail));
  }).map(i=>({inputId:i.id,name:i.name,type:i.type,category:i.category,placementMode:'NATURAL_OBSERVATION'}));

  const unresolvedObservation = items.filter(i=>i.observationContext==='UNCLASSIFIED');
  const reopen = items.filter(i=>i.observationContext==='UNRESOLVED_REOPEN');
  const researchReopen = items.filter(i=>i.namingResearchReopenCandidate);
  const selectionReopen = items.filter(i=>i.legacySelect || i.noneOptionsForbidden.length>0);

  report.machines.push({
    machineId, displayName:registryEntry.displayName ?? pkg?.machine?.displayName ?? null,
    appStatus:registryEntry.appStatus ?? null, packagePresent:Boolean(pkg),
    evidencePresent:items.length>0 || evidenceObjects.length>0,
    evidenceInputCount:items.length, evidenceDefinitionCount:evidenceObjects.length,
    researchFileCount:researchForMachine.length,
    observationGroups:[...new Set(items.filter(i=>i.catalog).map(i=>i.observationContext))],
    items, naturalFeatureSharedInputs:nonEvidenceShared,
    legacyInteractiveCount:items.filter(i=>i.legacySelect).length,
    legacyAbstractionCount:items.filter(i=>i.legacyAbstraction).length,
    resultBadgeSeparationCount:items.reduce((n,i)=>n+i.resultBadgeSeparationCandidates.length,0),
    noneOptionCount:items.reduce((n,i)=>n+i.noneOptionsForbidden.length,0),
    genericEvidenceSeparationCount:items.filter(i=>i.genericEvidenceSeparation).length,
    unclassifiedObservationContextCount:unresolvedObservation.length,
    unresolvedReopenCount:reopen.length,
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
  legacyAbstractionInputs:ms.reduce((n,m)=>n+m.legacyAbstractionCount,0),
  resultBadgeSeparationMachines:ms.filter(m=>m.resultBadgeSeparationCount>0).length,
  resultBadgeSeparationCandidates:ms.reduce((n,m)=>n+m.resultBadgeSeparationCount,0),
  noneOptionMachines:ms.filter(m=>m.noneOptionCount>0).length,
  noneOptionsForbidden:ms.reduce((n,m)=>n+m.noneOptionCount,0),
  genericEvidenceSeparationMachines:ms.filter(m=>m.genericEvidenceSeparationCount>0).length,
  naturalFeatureShareMachines:ms.filter(m=>m.naturalFeatureSharedInputs.length>0).length,
  unclassifiedObservationContextMachines:ms.filter(m=>m.unclassifiedObservationContextCount>0).length,
  unclassifiedObservationContextInputs:ms.reduce((n,m)=>n+m.unclassifiedObservationContextCount,0),
  unresolvedReopenMachines:ms.filter(m=>m.unresolvedReopenCount>0).length,
  unresolvedReopenInputs:ms.reduce((n,m)=>n+m.unresolvedReopenCount,0),
  researchReopenMachines:ms.filter(m=>m.researchReopenCandidates.length>0).length,
  selectionReopenMachines:ms.filter(m=>m.selectionReopenCandidates.length>0).length,
};

const lines=[
  '# Evidence UI v2 Phase 2 inventory','',
  `- Baseline SHA: \`${report.baselineSha}\``,
  `- Registry machines: ${report.summary.registryCount}`,
  `- Machine packages present: ${report.summary.packagePresent} (missing ${report.summary.packageMissing})`,
  `- Evidence-present machines: ${report.summary.evidencePresentMachines}`,
  `- Evidence inputs: ${report.summary.evidenceInputCount}`,
  `- Legacy result-abstraction inputs: ${report.summary.legacyInteractiveInputs} / ${report.summary.legacyInteractiveMachines} machines`,
  `- Result-badge separation candidates: ${report.summary.resultBadgeSeparationCandidates} labels / ${report.summary.resultBadgeSeparationMachines} machines`,
  `- Explicit NONE/unselected options: ${report.summary.noneOptionsForbidden} / ${report.summary.noneOptionMachines} machines`,
  `- Generic/research-reopen groups: ${report.summary.unresolvedReopenInputs} inputs / ${report.summary.unresolvedReopenMachines} machines`,
  `- Natural Feature-share candidates: ${report.summary.naturalFeatureShareMachines} machines`,
  `- Unclassified actual observation contexts: ${report.summary.unclassifiedObservationContextInputs} inputs / ${report.summary.unclassifiedObservationContextMachines} machines`,
  `- Research reopen candidates: ${report.summary.researchReopenMachines} machines`,
  `- Selection reopen candidates: ${report.summary.selectionReopenMachines} machines`,'',
  '## Machines needing review',''
];
for (const m of ms.filter(m=>m.legacyInteractiveCount||m.resultBadgeSeparationCount||m.noneOptionCount||m.genericEvidenceSeparationCount||m.unclassifiedObservationContextCount||m.unresolvedReopenCount||m.naturalFeatureSharedInputs.length)) {
  lines.push(`- **${m.machineId}** ${m.displayName ?? ''}: legacy=${m.legacyInteractiveCount}, badgeSplit=${m.resultBadgeSeparationCount}, none=${m.noneOptionCount}, generic=${m.genericEvidenceSeparationCount}, shared=${m.naturalFeatureSharedInputs.length}, unresolvedReopen=${m.unresolvedReopenCount}, unclassifiedObservation=${m.unclassifiedObservationContextCount}`);
}

const csvRows=[['machineId','displayName','inputId','name','observationContext','groupId','placementMode','featureShare','inputType','recommendedInputMode','legacyAbstraction','badgeSplitCount','noneOptionCount','layoutCandidate','researchReopen','selectionReopen']];
for (const m of ms) for (const i of m.items) csvRows.push([
  m.machineId,m.displayName,i.inputId,i.name,i.observationContext,i.catalog?.groupId ?? '',i.catalog?.placementMode ?? '',i.featureShare,i.currentInputType,i.recommendedInputMode,i.legacyAbstraction,i.resultBadgeSeparationCandidates.length,i.noneOptionsForbidden.length,i.layoutCandidate,i.namingResearchReopenCandidate,i.legacySelect||i.noneOptionsForbidden.length>0
]);

fs.mkdirSync(OUT_DIR,{recursive:true});
fs.writeFileSync(path.join(OUT_DIR,'evidence-ui-v2-phase2.json'),JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(path.join(OUT_DIR,'evidence-ui-v2-phase2.md'),lines.join('\n')+'\n');
fs.writeFileSync(path.join(OUT_DIR,'evidence-ui-v2-phase2.csv'),csvRows.map(r=>r.map(csvCell).join(',')).join('\n')+'\n');
console.log(JSON.stringify(report.summary,null,2));
if (report.summary.packageMissing>0) console.error('WARN: registry machines without machine-package.json:',report.summary.packageMissing);
