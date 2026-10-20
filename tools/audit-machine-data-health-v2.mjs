import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MACHINES = path.join(ROOT, 'machines');
const REPORT_PATH = process.argv.includes('--json-out')
  ? path.resolve(ROOT, process.argv[process.argv.indexOf('--json-out') + 1])
  : null;

const textOf = x => {
  if (x == null) return '';
  if (typeof x === 'string') return x;
  if (typeof x === 'number' || typeof x === 'boolean') return String(x);
  if (Array.isArray(x)) return x.map(textOf).join(' ');
  if (typeof x === 'object') return Object.entries(x).map(([k,v]) => `${k} ${textOf(v)}`).join(' ');
  return '';
};

const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog.json'), 'utf8'));
const catalogById = new Map((catalog.machines ?? []).map((m, i) => [m.machineId, { ...m, catalogIndex:i }]));
function registrationEpoch(machineId) {
  const addedAt = catalogById.get(machineId)?.addedAt;
  const t = addedAt ? Date.parse(addedAt) : NaN;
  return Number.isFinite(t) ? Math.floor(t / 1000) : null;
}

function probabilityValues(feature) {
  const vals = [];
  const walk = v => {
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1) vals.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  if (feature.probabilities) walk(feature.probabilities);
  if (feature.categoryProbabilities) walk(feature.categoryProbabilities);
  return vals;
}

function inputIdsReferenced(feature) {
  const ids = new Set();
  const walk = (v, k='') => {
    if (typeof v === 'string' && /inputid$/i.test(k)) ids.add(v);
    else if (Array.isArray(v)) v.forEach(x => walk(x, k));
    else if (v && typeof v === 'object') Object.entries(v).forEach(([kk,vv]) => walk(vv, kk));
  };
  walk(feature);
  return [...ids];
}

function auditPackage(pkg, packagePath) {
  const machine = pkg.machine ?? {};
  const inputs = pkg.inputs?.inputs ?? [];
  const features = pkg.features?.features ?? [];
  const evidences = pkg.evidence?.evidences ?? [];
  const inputById = new Map(inputs.map(x => [x.id, x]));
  const evidenceInputIds = new Set(evidences.map(e => e.inputId).filter(Boolean));
  const findings = [];
  const add = (code, severity, feature, detail, confidence='HEURISTIC') => findings.push({code,severity,featureId:feature?.featureId ?? null,featureName:feature?.name ?? null,detail,confidence});

  // Structural: exact same observed numerator/denominator enters the likelihood twice.
  const pairMap = new Map();
  for (const f of features.filter(x => x.probabilityEngineUsage !== false)) {
    const n = f.numeratorInputId ?? null;
    const d = f.denominatorInputId ?? null;
    if (!n || !d) continue;
    const key = `${n}::${d}`;
    if (pairMap.has(key)) add('DUPLICATE_NUMERATOR_DENOMINATOR','HIGH',f,`same numerator/denominator as ${pairMap.get(key)}`,'STRUCTURAL');
    else pairMap.set(key, f.featureId ?? f.name ?? key);
  }

  // Structural: same input is both hard Evidence and part of a probability feature.
  for (const f of features.filter(x => x.probabilityEngineUsage !== false)) {
    for (const id of inputIdsReferenced(f)) {
      if (evidenceInputIds.has(id)) add('EVIDENCE_PROBABILITY_INPUT_OVERLAP','HIGH',f,`evidence input ${id} is referenced by probability feature`,'STRUCTURAL');
    }
  }

  // Heuristic: aggregate and breakdown may be using the same exposure.
  const byDen = new Map();
  for (const f of features.filter(x => x.probabilityEngineUsage !== false && x.denominatorInputId)) {
    if (!byDen.has(f.denominatorInputId)) byDen.set(f.denominatorInputId, []);
    byDen.get(f.denominatorInputId).push(f);
  }
  for (const [den, arr] of byDen) {
    if (arr.length < 2) continue;
    const agg = arr.filter(f => /合算|合成|総合|全体|初当り確率|ボーナス確率/.test(f.name ?? ''));
    if (!agg.length) continue;
    for (const a of agg) {
      const others = arr.filter(f => f !== a && !/着席|前任者/.test(f.name ?? ''));
      if (others.length) add('AGGREGATE_BREAKDOWN_OVERLAP_RISK','REVIEW',a,`shares denominator ${den} with ${others.map(x=>x.name ?? x.featureId).join(' / ')}`,'HEURISTIC');
    }
  }

  // Quantitative heuristic: direct per-game features that remain unlikely to appear even in 7000G.
  for (const f of features.filter(x => x.probabilityEngineUsage !== false)) {
    const den = inputById.get(f.denominatorInputId);
    const vals = probabilityValues(f).filter(v => v > 0);
    if (!den || !vals.length) continue;
    const denText = `${den.name ?? ''} ${den.unit ?? ''} ${den.id ?? ''}`;
    if (!/(ゲーム|G|GAME)/i.test(denText)) continue;
    const maxP = Math.max(...vals);
    if (maxP >= 0.02) continue;
    const p7000 = 1 - Math.pow(1 - maxP, 7000);
    if (p7000 < 0.5) add('LOW_FREQUENCY_7000G','REVIEW',f,`best-setting P(>=1 by 7000G)≈${p7000.toFixed(3)} (max per-G p=${maxP})`,'QUANTITATIVE_HEURISTIC');
  }

  // Manifest v1.1: “initial hit” must say what actually counts.
  for (const f of features.filter(x => /初当り/.test(x.name ?? ''))) {
    const n = inputById.get(f.numeratorInputId);
    const combined = `${textOf(f)} ${textOf(n)}`;
    const hasDefinition = /(含む|除く|除外|数え|対象|初回|1回|連チャン|天国|直撃|経由|通常区間|通常時)/.test(combined.replace(f.name ?? '', ''));
    if (!hasDefinition) add('FIRST_HIT_UNDEFINED','REVIEW',f,'“初当り” is used without an explicit counting/inclusion/exclusion definition in the input/feature contract','HEURISTIC');
  }

  // Manifest v1.1: vague exposure needs explicit scope, not only a short label.
  for (const f of features.filter(x => x.probabilityEngineUsage !== false && x.denominatorInputId)) {
    const den = inputById.get(f.denominatorInputId);
    if (!den) continue;
    const nm = den.name ?? '';
    if (!/(通常ゲーム数|通常G|対象回数|試行回数|対象ゲーム数)/.test(nm)) continue;
    const supportive = `${textOf(den.description)} ${textOf(den.helpText)} ${textOf(den.note)} ${textOf(f.description)} ${textOf(f.notes)} ${textOf(f.denominatorDefinition)}`;
    if (supportive.trim().length < 12) add('DENOMINATOR_EXPLANATION_WEAK','REVIEW',f,`denominator “${nm}” has little/no explicit scope explanation`,'HEURISTIC');
  }

  // State/condition terms paired with a generic G denominator deserve manual verification.
  for (const f of features.filter(x => x.probabilityEngineUsage !== false && x.denominatorInputId)) {
    const den = inputById.get(f.denominatorInputId);
    if (!den) continue;
    const ft = f.name ?? '';
    const dn = den.name ?? '';
    if (/(高確|超高確|モード|状態移行|状態中|CZ中|AT中|終了時|失敗時|契機)/.test(ft) && /(通常ゲーム数|総ゲーム数|ゲーム数)/.test(dn)) {
      add('STATE_DEPENDENT_DENOMINATOR_RISK','REVIEW',f,`state/condition feature uses generic denominator “${dn}”`,'HEURISTIC');
    }
  }

  // Predecessor/seat-start data must not define intrinsic machine Difficulty.
  for (const f of features) {
    const t = `${f.name ?? ''} ${f.featureId ?? ''} ${textOf(f)}`;
    if (!/(前任者|着席時|PREDECESSOR|SEAT_START)/i.test(t)) continue;
    const dp = f.difficultyParticipation ?? f.difficulty?.participation ?? null;
    if (dp && !/EXCLUDE/i.test(String(dp))) add('PREDECESSOR_DIFFICULTY_PARTICIPATION','HIGH',f,`predecessor/seat-start feature has difficulty participation=${dp}`,'STRUCTURAL');
  }

  // Policy inventory only: non-standard weights can be valid, but should have an intentional rationale.
  for (const f of features.filter(x => x.probabilityEngineUsage !== false)) {
    const w = f.reliabilityProfile?.weight;
    if (typeof w === 'number' && Number.isFinite(w) && ![0.35,0.5,0.8,0.9,1].includes(w)) {
      add('NONSTANDARD_WEIGHT','REVIEW',f,`weight=${w}; verify intentional machine-specific rationale`,'INVENTORY');
    }
  }

  const highCount = findings.filter(x => x.severity === 'HIGH').length;
  const reviewCount = findings.filter(x => x.severity === 'REVIEW').length;
  const machineId = machine.machineId ?? path.basename(path.dirname(packagePath));
  return {
    machineId,
    displayName: machine.displayName ?? machineId,
    machineDataVersion: machine.machineDataVersion ?? null,
    registeredAtEpoch: registrationEpoch(machineId),
    addedAt: catalogById.get(machineId)?.addedAt ?? null,
    featureCount: features.length,
    evidenceCount: evidences.length,
    classification: highCount ? 'HIGH_RISK' : reviewCount ? 'REVIEW' : 'PASS',
    highCount, reviewCount, findings,
  };
}

function findPackages() {
  if (!fs.existsSync(MACHINES)) return [];
  const out = [];
  for (const ent of fs.readdirSync(MACHINES, {withFileTypes:true})) {
    if (!ent.isDirectory()) continue;
    const p = path.join(MACHINES, ent.name, 'machine-package.json');
    if (fs.existsSync(p)) out.push(p);
  }
  return out.sort();
}

const machines = findPackages().map(p => auditPackage(JSON.parse(fs.readFileSync(p,'utf8')), p));
const dated = machines.filter(x => Number.isFinite(x.registeredAtEpoch)).sort((a,b)=>a.registeredAtEpoch-b.registeredAtEpoch);
const rank = new Map(dated.map((x,i)=>[x.machineId,i+1]));
for (const m of machines) m.registrationRank = rank.get(m.machineId) ?? null;

const flagCounts = {};
for (const m of machines) for (const f of m.findings) flagCounts[f.code] = (flagCounts[f.code] ?? 0) + 1;
const counts = {PASS:0,REVIEW:0,HIGH_RISK:0};
for (const m of machines) counts[m.classification]++;
const priority = [...machines].sort((a,b) => {
  const sev = x => x.classification === 'HIGH_RISK' ? 2 : x.classification === 'REVIEW' ? 1 : 0;
  if (sev(b) !== sev(a)) return sev(b)-sev(a);
  if (b.highCount !== a.highCount) return b.highCount-a.highCount;
  if (b.reviewCount !== a.reviewCount) return b.reviewCount-a.reviewCount;
  return (a.registrationRank ?? 9999) - (b.registrationRank ?? 9999);
});

const report = {
  schemaVersion:'machine-data-health-v2',
  manifestBaseline:'SloAnalytica New Machine Research Manifest v1.1',
  generatedAt:new Date().toISOString(),
  scope:'machines/*/machine-package.json (catalog-published set)',
  note:'Audit-only. Heuristic findings require review and do not mutate MachineData.',
  machineCount:machines.length,
  catalogMachineCount:(catalog.machines ?? []).length,
  counts,
  flagCounts:Object.fromEntries(Object.entries(flagCounts).sort((a,b)=>b[1]-a[1])),
  priority:priority.map(x=>({machineId:x.machineId,displayName:x.displayName,classification:x.classification,registrationRank:x.registrationRank,addedAt:x.addedAt,highCount:x.highCount,reviewCount:x.reviewCount,flags:[...new Set(x.findings.map(f=>f.code))]})),
  machines,
};

if (REPORT_PATH) {
  fs.mkdirSync(path.dirname(REPORT_PATH), {recursive:true});
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report,null,2)+'\n');
}
console.log(`[health-v2] machines=${machines.length}/${report.catalogMachineCount} PASS=${counts.PASS} REVIEW=${counts.REVIEW} HIGH_RISK=${counts.HIGH_RISK}`);
console.log(`[health-v2] flags=${JSON.stringify(report.flagCounts)}`);
for (const m of priority.filter(x=>x.classification!=='PASS')) {
  console.log(`[health-v2] ${m.classification} rank=${m.registrationRank ?? '-'} ${m.machineId} ${m.displayName} high=${m.highCount} review=${m.reviewCount} flags=${[...new Set(m.findings.map(f=>f.code))].join(',')}`);
}
console.log(`HEALTH_V2_REPORT_JSON=${JSON.stringify(report)}`);
