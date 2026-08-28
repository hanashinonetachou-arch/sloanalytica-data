#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const INCLUDE = new Set(['INCLUDE_PRIMARY', 'INCLUDE_SUPPORT', 'INCLUDE_FALLBACK']);
const EVIDENCE_REASON = /(Evidence|evidence|確定情報|確定系|確定演出|設定確定|設定否定|示唆.*優先|優先.*示唆)/u;
const OVERLAP_REASON = /(重複|二重評価|二重計上|同じ観測|同一観測|同じ事象|同一事象|同一演出|同じ演出|重なる)/u;
const GENERIC_CONTEXT = new Set(['RF','RE','FEAT','EVI','SCREEN','PICTURE','IMAGE','RESULT','OUTCOME','SETTING','SET','COUNT','RATE','COMPOSITION','DISTRIBUTION','HINT','INDICATION']);
const arr = v => Array.isArray(v) ? v : [];
const obj = v => v && typeof v === 'object' && !Array.isArray(v);
const uniq = xs => [...new Set(xs.filter(Boolean))];
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));

function normTokens(value) {
  return uniq(String(value ?? '')
    .toUpperCase()
    .replace(/[＋+／/・（）()\[\]【】「」『』:：,，.。\-]/gu, '_')
    .split(/[_\s]+/u)
    .map(x => x.trim())
    .filter(x => x.length >= 2 && !GENERIC_CONTEXT.has(x)));
}
function eventInputs(f) {
  return uniq([f?.numeratorInputId, ...arr(f?.numeratorInputIds), ...arr(f?.categoryInputIds), ...arr(f?.optionalCategoryInputIds)]);
}
function numericSignature(v) {
  if (!obj(v)) return null;
  const scalar = [v.probability, v.rate, v.value].find(Number.isFinite);
  if (Number.isFinite(scalar)) return `scalar:${scalar}`;
  const pairs = Object.entries(v).filter(([,x]) => Number.isFinite(x)).sort(([a],[b]) => a.localeCompare(b));
  return pairs.length ? `dist:${JSON.stringify(pairs)}` : null;
}
function numericCoverage(feature) {
  const values = Object.entries(obj(feature?.settingValues) ? feature.settingValues : {})
    .map(([k,v]) => [k,v,numericSignature(v)])
    .filter(([, ,sig]) => sig);
  const dists = Object.entries(obj(feature?.settingDistributions) ? feature.settingDistributions : {})
    .map(([k,v]) => [k,v,numericSignature(v)])
    .filter(([, ,sig]) => sig);
  const settings = uniq([...values.map(([k]) => k), ...dists.map(([k]) => k)]);
  const signatures = new Set([...values.map(([, ,sig]) => sig), ...dists.map(([, ,sig]) => sig)]);
  const hasSettingVariation = signatures.size >= 2;
  return {
    settings,
    settingCount: settings.length,
    hasNumeric: settings.length >= 2 && hasSettingVariation,
    hasSettingVariation,
    completeDistribution: feature?.distributionMode === 'complete' && dists.length >= 2 && hasSettingVariation,
    multinomialLike: /multinomial/i.test(String(feature?.candidateModel ?? '')) || arr(feature?.categories).length >= 2 || dists.length >= 2,
  };
}
function collectExplicitPairs(research) {
  const rf = new Set(arr(research?.features).map(x => x?.researchFeatureId).filter(Boolean));
  const re = new Set(arr(research?.evidenceCandidates).map(x => x?.researchEvidenceId).filter(Boolean));
  const pairs = new Set();
  const walk = node => {
    if (Array.isArray(node)) { for (const v of node) walk(v); return; }
    if (!obj(node)) return;
    const raw = node.researchTarget ?? node.mappedTo;
    const targets = arr(raw).length ? raw : (raw ? [raw] : []);
    const fids = targets.filter(x => rf.has(x));
    const eids = targets.filter(x => re.has(x));
    for (const f of fids) for (const e of eids) pairs.add(`${f}::${e}`);
    for (const v of Object.values(node)) walk(v);
  };
  walk(research?.discoveryInventory ?? []);
  return pairs;
}
function relation(feature, evidence, explicitPairs) {
  const fid = feature?.researchFeatureId;
  const eid = evidence?.researchEvidenceId;
  if (explicitPairs.has(`${fid}::${eid}`)) return { confidence: 'HIGH', basis: ['EXPLICIT_DISCOVERY_LINKAGE'] };

  const categoryTokens = new Set(arr(feature?.categories).flatMap(normTokens));
  const evidenceTokens = new Set([...normTokens(evidence?.researchEvidenceId), ...normTokens(evidence?.name)]);
  const featureTokens = new Set([...normTokens(feature?.researchFeatureId), ...normTokens(feature?.name)]);
  const categoryHit = [...categoryTokens].filter(t => evidenceTokens.has(t));
  const contextHit = [...featureTokens].filter(t => evidenceTokens.has(t));

  // Evidence often names one category of a complete screen/card/voice distribution.
  if (categoryHit.length && contextHit.length) return { confidence: 'HIGH', basis: ['CATEGORY_TOKEN_MATCH','CONTEXT_TOKEN_MATCH'], categoryHit, contextHit };
  if (categoryHit.length) return { confidence: 'MEDIUM', basis: ['CATEGORY_TOKEN_MATCH'], categoryHit };
  if (contextHit.length >= 2) return { confidence: 'MEDIUM', basis: ['CONTEXT_TOKEN_MATCH'], contextHit };
  return null;
}
function machineStatus(issues) {
  return issues.some(x => x.severity === 'HIGH_RISK') ? 'HIGH_RISK' : issues.some(x => x.severity === 'REVIEW') ? 'REVIEW' : 'PASS';
}

export function auditV64CrossMachine(root = process.cwd()) {
  const researchRoot = path.join(root, 'research');
  const machineRoot = path.join(root, 'machines');
  const machines = [];
  if (!fs.existsSync(researchRoot)) throw new Error(`research root not found: ${researchRoot}`);

  const dirs = fs.readdirSync(researchRoot, {withFileTypes:true})
    .filter(x => x.isDirectory() && !x.name.startsWith('_'))
    .sort((a,b) => a.name.localeCompare(b.name));

  for (const de of dirs) {
    const machineId = de.name;
    const rp = path.join(researchRoot, machineId, 'research-data.json');
    const sp = path.join(researchRoot, machineId, 'selection-data.json');
    const mp = path.join(machineRoot, machineId, 'machine-package.json');
    const issues = [];
    if (!fs.existsSync(rp) || !fs.existsSync(sp)) {
      issues.push({severity:'REVIEW', code:'SCHEMA_LIMITATION_MISSING_RESEARCH_OR_SELECTION'});
      machines.push({machineId, status:machineStatus(issues), issues});
      continue;
    }
    let research, selection, pkg = null;
    try { research = read(rp); selection = read(sp); if (fs.existsSync(mp)) pkg = read(mp); }
    catch (error) {
      issues.push({severity:'HIGH_RISK', code:'INVALID_JSON', detail:String(error)});
      machines.push({machineId, status:machineStatus(issues), issues});
      continue;
    }

    const sfByResearch = new Map(arr(selection.features).filter(x => x?.researchFeatureId).map(x => [x.researchFeatureId, x]));
    const featureById = new Map(arr(selection.features).filter(x => x?.featureId).map(x => [x.featureId, x]));
    const evidenceByResearch = new Map(arr(selection.evidence).filter(x => x?.researchEvidenceId).map(x => [x.researchEvidenceId, x]));
    const explicitPairs = collectExplicitPairs(research);

    for (const rf of arr(research.features)) {
      const cov = numericCoverage(rf);
      if (!cov.hasNumeric) continue;
      const sf = sfByResearch.get(rf.researchFeatureId);
      if (!sf) {
        issues.push({severity:'REVIEW', code:'RESEARCH_NUMERIC_FEATURE_MISSING_FROM_SELECTION', researchFeatureId:rf.researchFeatureId, name:rf.name, settingCount:cov.settingCount});
        continue;
      }
      const relatedEvidence = [];
      for (const re of arr(research.evidenceCandidates)) {
        const rel = relation(rf, re, explicitPairs);
        if (rel) relatedEvidence.push({researchEvidenceId:re.researchEvidenceId, name:re.name, ...rel});
      }
      const reason = String(sf.rejectionReason ?? sf.userReason ?? '');
      if (!INCLUDE.has(sf.adoptionCategory) && relatedEvidence.length) {
        const overlapWording = EVIDENCE_REASON.test(reason) || OVERLAP_REASON.test(reason);
        const strongest = relatedEvidence.some(x => x.confidence === 'HIGH') ? 'HIGH' : 'MEDIUM';
        issues.push({
          severity:'REVIEW',
          code: overlapWording ? 'LEGACY_EVIDENCE_OVERLAP_REJECT_CANDIDATE' : 'EXCLUDED_NUMERIC_FEATURE_WITH_RELATED_EVIDENCE',
          researchFeatureId:rf.researchFeatureId,
          featureId:sf.featureId ?? null,
          name:rf.name,
          adoptionCategory:sf.adoptionCategory,
          candidateModel:rf.candidateModel ?? null,
          completeDistribution:cov.completeDistribution,
          settingCount:cov.settingCount,
          relationConfidence:strongest,
          reason,
          relatedEvidence,
        });
      }
    }

    // Validate declared shared contracts in Selection independent of discovery linkage.
    for (const se of arr(selection.evidence)) {
      const declared = uniq(arr(se.sharedFeatureIds));
      if (!declared.length) continue;
      for (const featureId of declared) {
        const sf = featureById.get(featureId);
        if (!sf || !INCLUDE.has(sf.adoptionCategory) || !eventInputs(sf).includes(se.inputId)) {
          issues.push({severity:'HIGH_RISK', code:'INVALID_SELECTION_SHARED_CONTRACT', evidenceId:se.evidenceId, inputId:se.inputId, sharedFeatureId:featureId});
        }
      }
    }

    // Package overlap must be explicitly declared. Only event inputs count here; denominators are not the same event.
    const pkgFeatures = arr(pkg?.features?.features).filter(f => INCLUDE.has(f?.adoptionCategory) && f?.calculationRole !== 'DISPLAY_ONLY' && f?.probabilityEngineUsage !== false);
    const users = new Map();
    for (const f of pkgFeatures) for (const inputId of eventInputs(f)) {
      if (!users.has(inputId)) users.set(inputId, []);
      users.get(inputId).push(f.featureId);
    }
    for (const e of arr(pkg?.evidence?.evidences)) {
      const overlaps = uniq(users.get(e?.inputId) ?? []);
      if (!overlaps.length) continue;
      const declared = uniq(arr(e?.sharedFeatureIds));
      if (!overlaps.every(id => declared.includes(id))) {
        issues.push({severity:'HIGH_RISK', code:'UNDECLARED_PACKAGE_FEATURE_EVIDENCE_OVERLAP', evidenceId:e.id, inputId:e.inputId, featureIds:overlaps, sharedFeatureIds:declared});
      }
    }

    // Evidence selected from Research but still lacking an input/contract is reviewable, not automatically wrong.
    for (const re of arr(research.evidenceCandidates)) {
      const se = evidenceByResearch.get(re.researchEvidenceId);
      if (se && !se.inputId) issues.push({severity:'REVIEW', code:'SELECTED_EVIDENCE_WITHOUT_INPUT_ID', researchEvidenceId:re.researchEvidenceId, evidenceId:se.evidenceId ?? null});
    }

    machines.push({machineId, displayName:research?.machine?.displayName ?? machineId, status:machineStatus(issues), issues});
  }

  const summary = {machineCount:machines.length, PASS:0, REVIEW:0, HIGH_RISK:0, issueCounts:{}};
  for (const m of machines) {
    summary[m.status]++;
    for (const i of m.issues) summary.issueCounts[i.code] = (summary.issueCounts[i.code] ?? 0) + 1;
  }
  return {schemaVersion:'v6.4-cross-machine-semantic-audit-v1.1', generatedAt:new Date().toISOString(), summary, machines};
}

function main() {
  const root = path.resolve(process.argv[2] ?? '.');
  const out = path.resolve(process.argv[3] ?? path.join(root, 'reports', 'v64-cross-machine-semantic-audit.json'));
  const report = auditV64CrossMachine(root);
  fs.mkdirSync(path.dirname(out), {recursive:true});
  fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
  console.log(`v6.4 Cross-machine Semantic Audit: PASS ${report.summary.PASS} / REVIEW ${report.summary.REVIEW} / HIGH_RISK ${report.summary.HIGH_RISK} / TOTAL ${report.summary.machineCount}`);
  console.log(JSON.stringify({issueCounts:report.summary.issueCounts, report:out}, null, 2));
  for (const m of report.machines.filter(x => x.status !== 'PASS')) console.log(`${m.status}\t${m.machineId}\t${m.issues.map(i => i.code).join(',')}`);
  if (report.summary.HIGH_RISK > 0) process.exitCode = 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) main();
