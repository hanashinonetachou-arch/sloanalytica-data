import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const researchRoot = path.join(root, 'research');
const reportDir = path.join(root, 'reports');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const text = v => typeof v === 'string' ? v.trim() : '';
const substantial = v => text(v).length >= 12;

const rows = [];
for (const dir of fs.readdirSync(researchRoot, {withFileTypes:true})) {
  if (!dir.isDirectory()) continue;
  const sp = path.join(researchRoot, dir.name, 'selection-data.json');
  const rp = path.join(researchRoot, dir.name, 'research-data.json');
  if (!fs.existsSync(sp) || !fs.existsSync(rp)) continue;
  const s = read(sp);
  const r = read(rp);
  const target = s.difficultyAnalysis?.targetGameBasis ?? null;

  for (const f of s.features ?? []) {
    const dx = f.difficultyExposure;
    if (f.difficultyParticipation !== 'INCLUDE' || dx?.quality !== 'ESTIMATED') continue;

    const missingMetadata = !text(dx.confidence) || !substantial(dx.estimationBasis) || !substantial(dx.uncertaintyNote) || (target?.quality === 'ESTIMATED' && !substantial(target.note));
    if (!missingMetadata) continue;

    const sameBasis = Boolean(dx.basisId && target?.basisId && dx.basisId === target.basisId);
    const directPerGame = dx.mode === 'per_game' && Number(dx.factor ?? 1) === 1;
    const targetEstimated = target?.quality === 'ESTIMATED';
    const researchFeature = (r.features ?? []).find(x => x.researchFeatureId === f.researchFeatureId);
    const denominator = text(researchFeature?.denominatorDefinition);
    const trialUnit = text(researchFeature?.trialUnit);
    const observationScope = text(researchFeature?.observationScope);
    const researchContext = `${denominator} ${trialUnit} ${observationScope}`;
    const hasGameContext = /(ゲーム|G|通常時|総ゲーム)/i.test(researchContext);

    let priority;
    let rationale;
    if (sameBasis && directPerGame && !targetEstimated) {
      priority = 'LEGACY_METADATA_ONLY';
      rationale = '同一basisのper_game 1:1換算で、targetGameBasis自体も推定ではない。構造は直接的で、主に説明メタデータの世代差。';
    } else if (sameBasis && directPerGame && targetEstimated && hasGameContext) {
      priority = 'TARGET_BASIS_REVIEW';
      rationale = 'Feature換算は同一basis 1:1だが、targetGameBasis自体がESTIMATED。Feature単体よりtargetGames定義の根拠確認を優先。';
    } else if (dx.mode === 'derived_event_rate' || dx.mode === 'setting_rate' || dx.mode === 'fixed_rate') {
      priority = 'CONVERSION_RESEARCH';
      rationale = 'ゲーム数から試行回数への換算がイベント率・設定別率・固定率に依存するため、換算根拠の再確認が必要。';
    } else {
      priority = 'MANUAL_REVIEW';
      rationale = '単純な同一basis 1:1として自動分類できないため、Research/Selectionを個別確認する。';
    }

    rows.push({
      machineId:s.machineId,
      machine:r.machine?.displayName ?? s.machineId,
      featureId:f.featureId,
      researchFeatureId:f.researchFeatureId ?? null,
      mode:dx.mode,
      featureBasisId:dx.basisId ?? null,
      targetBasisId:target?.basisId ?? null,
      targetBasisQuality:target?.quality ?? null,
      priority,
      rationale,
      missing:{
        confidence:!text(dx.confidence),
        estimationBasis:!substantial(dx.estimationBasis),
        uncertaintyNote:!substantial(dx.uncertaintyNote),
        targetBasisNote:Boolean(target?.quality === 'ESTIMATED' && !substantial(target.note))
      }
    });
  }
}

const counts = {};
for (const x of rows) counts[x.priority] = (counts[x.priority] ?? 0) + 1;
const machineCounts = {};
for (const x of rows) {
  machineCounts[x.priority] ??= new Set();
  machineCounts[x.priority].add(x.machineId);
}
const machineCountJson = Object.fromEntries(Object.entries(machineCounts).map(([k,v])=>[k,v.size]));
const report = {schemaVersion:'estimated-exposure-review-priority-v1',generatedAt:new Date().toISOString(),features:rows.length,counts,machineCounts:machineCountJson,rows};
fs.mkdirSync(reportDir,{recursive:true});
fs.writeFileSync(path.join(reportDir,'estimated-exposure-review-priority-v1.json'),JSON.stringify(report,null,2)+'\n');

const order = ['CONVERSION_RESEARCH','TARGET_BASIS_REVIEW','MANUAL_REVIEW','LEGACY_METADATA_ONLY'];
const sorted = [...rows].sort((a,b)=>order.indexOf(a.priority)-order.indexOf(b.priority) || a.machineId.localeCompare(b.machineId));
const table = sorted.map((x,i)=>`| ${i+1} | ${x.machine} (${x.machineId}) | ${x.featureId} | ${x.mode} | ${x.priority} | ${x.rationale} |`).join('\n');
const md = `# Estimated Exposure Review Priority — v1\n\n- Features requiring metadata/review: ${rows.length}\n${order.map(k=>`- ${k}: ${counts[k] ?? 0} Features / ${machineCountJson[k] ?? 0} machines`).join('\n')}\n\n## Priority\n\n| # | Machine | Feature | Mode | Classification | Rationale |\n|---:|---|---|---|---|---|\n${table}\n\n## Policy\n\n- LEGACY_METADATA_ONLY: 現在の換算構造を変更する根拠はない。将来の説明メタデータbackfill候補。\n- TARGET_BASIS_REVIEW: Feature個別より、機種共通targetGameBasisの推定根拠を確認する。\n- CONVERSION_RESEARCH: イベント率等を介した換算なので、公開根拠または明示的な推定モデルを再確認する。\n- MANUAL_REVIEW: 自動分類せず個別確認する。\n- この監査はSelectionData・Difficulty値を変更しない。\n`;
fs.writeFileSync(path.join(reportDir,'estimated-exposure-review-priority-v1.md'),md);
console.log(`Exposure review priority: ${rows.length} Features`);
for (const k of order) console.log(`${k}\tFeatures=${counts[k] ?? 0}\tMachines=${machineCountJson[k] ?? 0}`);
