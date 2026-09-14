#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const REGISTRY = path.join(ROOT, 'machine-registry.json');
const LEGACY_RESULT = /(設定下限|確認した設定下限|トロフィーで確認した設定下限|設定[23456]以上|設定6(?:確定)?|高設定確定)/;
const CONTEXT_RULES = [
  ['ending-screen', /(終了画面|終了時画面|完走画面)/],
  ['trophy-stamp', /(トロフィー|スタンプ)/],
  ['voice-line', /(ボイス|セリフ|台詞)/],
  ['character-intro', /(キャラ紹介|キャラクター紹介)/],
  ['navigation-instruction', /(ナビ|指示)/],
  ['judge-special-effect', /(ジャッジ|特殊演出|告知演出)/],
  ['symbol-stop-pattern', /(図柄|出目|停止形)/],
  ['lamp-color-gimmick', /(ランプ|色|役物)/],
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.json$/i.test(ent.name)) out.push(p);
  }
  return out;
}
function json(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } }
function text(v) { return typeof v === 'string' ? v : ''; }
function strings(node, key = '', out = []) {
  if (Array.isArray(node)) node.forEach(v => strings(v, key, out));
  else if (node && typeof node === 'object') Object.entries(node).forEach(([k,v]) => strings(v,k,out));
  else if (typeof node === 'string') out.push({ key, value: node });
  return out;
}
function classify(label) {
  for (const [id,re] of CONTEXT_RULES) if (re.test(label)) return id;
  return 'other-independent-evidence';
}
function machineEntries(reg) {
  if (Array.isArray(reg)) return reg;
  for (const k of ['machines','entries','items']) if (Array.isArray(reg?.[k])) return reg[k];
  return [];
}
function idOf(m) { return m?.machineId ?? m?.id ?? m?.slug ?? m?.packageId ?? null; }
function likelyMachineFile(file, id) {
  if (!id) return false;
  const norm = file.replaceAll('\\','/').toLowerCase();
  return norm.includes(String(id).toLowerCase());
}

const reg = json(REGISTRY);
if (!reg) throw new Error('machine-registry.json not readable');
const machines = machineEntries(reg);
const roots = ['machines','machine-data','machine-packages','packages','ui-design','canonical-ui','research','selection','observation']
  .map(x => path.join(ROOT,x)).filter(fs.existsSync);
const files = roots.flatMap(r => walk(r));
const report = {
  schemaVersion: 'evidence-ui-v2-phase2-audit-v1',
  generatedAt: new Date().toISOString(),
  registryCount: machines.length,
  scannedJsonFiles: files.length,
  machines: [],
  summary: {}
};

for (const m of machines) {
  const machineId = idOf(m);
  const candidates = files.filter(f => likelyMachineFile(f, machineId));
  const hits = [];
  for (const file of candidates) {
    const doc = json(file); if (!doc) continue;
    for (const s of strings(doc)) {
      const evidenceish = /evidence|確定|以上|否定|トロフィー|スタンプ|終了画面|ボイス|セリフ|キャラ紹介|ランプ/i.test(`${s.key} ${s.value}`);
      if (!evidenceish) continue;
      hits.push({ file: path.relative(ROOT,file).replaceAll('\\','/'), key:s.key, label:s.value,
        group: classify(s.value), legacyInteractiveCandidate: LEGACY_RESULT.test(s.value) });
    }
  }
  const groups = [...new Set(hits.map(h => h.group))];
  report.machines.push({ machineId, registryEntry:m, candidateFiles:candidates.length, evidenceSignals:hits.length,
    evidencePresent:hits.length>0, groups, unclassifiedContext: groups.includes('other-independent-evidence'),
    legacyCandidates:hits.filter(h=>h.legacyInteractiveCandidate), signals:hits });
}
const ms = report.machines;
report.summary = {
  registryCount: ms.length,
  evidencePresent: ms.filter(x=>x.evidencePresent).length,
  noEvidenceSignal: ms.filter(x=>!x.evidencePresent).length,
  legacyCandidateMachines: ms.filter(x=>x.legacyCandidates.length).length,
  unclassifiedContextMachines: ms.filter(x=>x.unclassifiedContext).length,
  catalogGroups: [...new Set(ms.flatMap(x=>x.groups))].sort()
};
fs.mkdirSync(path.join(ROOT,'audit-reports'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-reports','evidence-ui-v2-phase2.json'), JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.summary,null,2));
if (ms.length === 0) process.exitCode = 2;
