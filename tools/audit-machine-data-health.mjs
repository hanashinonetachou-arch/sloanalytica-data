import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ACTIVE = new Set(['INCLUDE_PRIMARY', 'INCLUDE_SUPPORT']);
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const exists = p => fs.existsSync(p);
const arr = v => Array.isArray(v) ? v : [];
const uniq = xs => [...new Set(xs.filter(Boolean))];

function featureInputs(f) {
  const ids = [];
  for (const k of ['numeratorInputId','denominatorInputId','conditionedOnInputId','trialCountInputId']) if (f?.[k]) ids.push(f[k]);
  for (const k of ['categoryInputIds','optionalCategoryInputIds','denominatorInputIds','trialInputIds']) ids.push(...arr(f?.[k]));
  if (isObj(f?.categorySubtractInputIds)) for (const [base, subs] of Object.entries(f.categorySubtractInputIds)) ids.push(base, ...arr(subs));
  return uniq(ids);
}
function eventInputs(f) {
  return uniq([
    f?.numeratorInputId,
    ...arr(f?.categoryInputIds),
    ...arr(f?.optionalCategoryInputIds),
  ]);
}
function featureIsActive(f) {
  return f?.calculationRole !== 'DISPLAY_ONLY' && f?.probabilityEngineUsage !== false && f?.adoptionCategory !== 'EXCLUDE' && f?.adoptionCategory !== 'DISPLAY_ONLY';
}
function selectedActive(s) { return ACTIVE.has(s?.adoptionCategory); }
function severityRank(s) { return s === 'HIGH_RISK' ? 3 : s === 'REVIEW' ? 2 : 1; }
function addFlag(flags, severity, code, detail, featureIds = []) {
  const key = `${code}|${detail}|${featureIds.slice().sort().join(',')}`;
  if (!flags.some(f => f._key === key)) flags.push({_key:key,severity,code,detail,featureIds});
}
function settingScalarProbabilities(f) {
  const map = f?.probabilities;
  if (!isObj(map)) return null;
  const vals = Object.values(map);
  if (!vals.length || vals.some(v => !Number.isFinite(v))) return null;
  return vals;
}
function getUiText(machine, inputId) {
  const chunks = [];
  for (const sec of arr(machine?.ui?.sections)) {
    for (const item of arr(sec?.items)) {
      if (item?.inputId !== inputId) continue;
      for (const k of ['label','description','helpText','note','hint','subtitle']) if (typeof item?.[k] === 'string') chunks.push(item[k]);
      if (isObj(item?.config)) chunks.push(JSON.stringify(item.config));
    }
  }
  const input = arr(machine?.inputs?.inputs).find(x => x?.id === inputId);
  if (input) for (const k of ['name','label','description','helpText','note','hint']) if (typeof input[k] === 'string') chunks.push(input[k]);
  return chunks.join(' ');
}
function generationRisk(selection, machineVersion) {
  const features = arr(selection?.features);
  const inputs = arr(selection?.inputs);
  const legacyInputs = inputs.filter(x => x?.legacyContractSource).length;
  const noReason = features.filter(selectedActive).filter(x => !String(x?.userReason ?? '').trim()).length;
  const noExposure = features.filter(x => selectedActive(x) && x?.difficultyParticipation === 'INCLUDE' && !isObj(x?.difficultyExposure)).length;
  let score = 0;
  if (machineVersion === '0.1.0') score += 2;
  else if (/^0\.1\./.test(machineVersion ?? '')) score += 1;
  if (legacyInputs >= 3) score += 2; else if (legacyInputs) score += 1;
  if (noReason) score += Math.min(2, noReason);
  if (noExposure) score += 2;
  return {score, legacyInputs, noReason, noExposure};
}
function expected7000ForFeature(pub, sel) {
  const ps = settingScalarProbabilities(pub);
  if (!ps) return null;
  const exp = sel?.difficultyExposure;
  if (!isObj(exp) || exp.mode !== 'per_game' || !Number.isFinite(exp.factor) || exp.factor <= 0) return null;
  const counts = ps.map(p => p * 7000 * exp.factor);
  return {min:Math.min(...counts), max:Math.max(...counts)};
}

export function auditMachineDataHealth(root) {
  const machinesDir = path.join(root,'machines');
  const researchDir = path.join(root,'research');
  const rows = [];
  const dirs = fs.readdirSync(machinesDir,{withFileTypes:true}).filter(d => d.isDirectory()).map(d => d.name).sort();

  for (const machineId of dirs) {
    const mp = path.join(machinesDir,machineId,'machine-package.json');
    if (!exists(mp)) continue;
    const machine = readJson(mp);
    const sp = path.join(researchDir,machineId,'selection-data.json');
    const selection = exists(sp) ? readJson(sp) : null;
    const flags = [];
    const pubFeatures = arr(machine?.features?.features).filter(featureIsActive);
    const selById = new Map(arr(selection?.features).map(f => [f.featureId,f]));
    const pubById = new Map(pubFeatures.map(f => [f.featureId,f]));

    // Same observed event count used in more than one active likelihood.
    const owners = new Map();
    for (const f of pubFeatures) for (const inputId of eventInputs(f)) {
      if (!owners.has(inputId)) owners.set(inputId,[]);
      owners.get(inputId).push(f.featureId);
    }
    for (const [inputId, ids] of owners) if (ids.length > 1) {
      const suppresses = ids.every(id => {
        const f = pubById.get(id); return arr(f?.suppressedByFeatureIds).some(x => ids.includes(x));
      });
      addFlag(flags, suppresses ? 'REVIEW' : 'HIGH_RISK', 'DUPLICATE_EVENT_INPUT', `${inputId} が複数の有効Featureでイベント数として使われています`, ids);
    }

    // Exact same numerator/denominator contract.
    const contracts = new Map();
    for (const f of pubFeatures) {
      if (!f?.numeratorInputId || !f?.denominatorInputId) continue;
      const k = `${f.numeratorInputId}|${f.denominatorInputId}`;
      if (!contracts.has(k)) contracts.set(k,[]);
      contracts.get(k).push(f.featureId);
    }
    for (const [k,ids] of contracts) if (ids.length > 1) addFlag(flags,'HIGH_RISK','DUPLICATE_BINOMIAL_CONTRACT',`同一の分子/分母契約 ${k}`,ids);

    // Evidence input used by an active probability feature.
    const activeInputs = new Map();
    for (const f of pubFeatures) for (const id of featureInputs(f)) {
      if (!activeInputs.has(id)) activeInputs.set(id,[]);
      activeInputs.get(id).push(f.featureId);
    }
    for (const e of arr(machine?.evidence?.evidences)) if (activeInputs.has(e?.inputId)) {
      addFlag(flags,'HIGH_RISK','EVIDENCE_FEATURE_OVERLAP',`${e.inputId} がEvidenceと確率Featureの両方で使用されています`,activeInputs.get(e.inputId));
    }

    // Difficulty participation checks from SelectionData.
    if (!selection) {
      addFlag(flags,'HIGH_RISK','SELECTION_DATA_MISSING','SelectionDataが存在しません');
    } else {
      for (const s of arr(selection.features).filter(selectedActive)) {
        if (s?.difficultyParticipation === 'INCLUDE' && !isObj(s?.difficultyExposure)) addFlag(flags,'HIGH_RISK','DIFFICULTY_EXPOSURE_MISSING','Difficulty参加FeatureにdifficultyExposureがありません',[s.featureId]);
        if (s?.difficultyParticipation === 'INCLUDE' && /着席|前任者/.test(`${s?.userReason ?? ''} ${s?.difficultyExclusionReason ?? ''}`)) addFlag(flags,'HIGH_RISK','PREDECESSOR_DIFFICULTY_RISK','前任者/着席データ由来の可能性があるFeatureがDifficulty参加しています',[s.featureId]);
        if (s?.difficultyParticipation === 'INCLUDE' && isObj(s?.difficultyExposure) && s.difficultyExposure.quality && s.difficultyExposure.quality !== 'EXACT') addFlag(flags,'REVIEW','APPROX_DIFFICULTY_EXPOSURE',`Difficulty exposure quality=${s.difficultyExposure.quality}`,[s.featureId]);
        const pub = pubById.get(s.featureId);
        if (pub) {
          const ex = expected7000ForFeature(pub,s);
          if (ex && ex.max < 1) addFlag(flags,'REVIEW','LOW_FREQUENCY_7000G',`7000G時の最大期待回数が${ex.max.toFixed(3)}回です`,[s.featureId]);
        }
      }
    }

    // Ambiguous first-hit inputs: require some explanatory text beyond the label itself.
    for (const input of arr(selection?.inputs)) {
      if (!/初当り/.test(input?.name ?? '')) continue;
      const text = `${input?.description ?? ''} ${input?.helpText ?? ''} ${input?.note ?? ''} ${getUiText(machine,input.id)}`.trim();
      const informative = /(数え|含|除|通常|天国|引き戻|直撃|CZ|ボーナス|AT|1回|最初)/.test(text) && text.replace(input.name ?? '','').trim().length >= 8;
      if (!informative) addFlag(flags,'REVIEW','FIRST_HIT_DEFINITION_WEAK',`${input.name} の「何を1回と数えるか」の説明が弱い可能性があります`,[]);
    }

    // State-dependent language combined with simple per-game likelihood deserves manual review.
    for (const s of arr(selection?.features).filter(selectedActive)) {
      const text = `${s?.userReason ?? ''} ${s?.difficultyExclusionReason ?? ''}`;
      if (/(高確|低確|内部状態|モード|状態中|特定状態)/.test(text)) {
        const pub = pubById.get(s.featureId);
        if (pub && ['binomial','poisson'].includes(pub.modelType) && s?.difficultyExposure?.mode === 'per_game') addFlag(flags,'REVIEW','STATE_DEPENDENT_SIMPLE_MODEL','状態依存の記述があるFeatureを単純なper_gameモデルで扱っています',[s.featureId]);
      }
    }

    const gen = generationRisk(selection,machine?.machine?.machineDataVersion ?? machine?.machineDataVersion);
    if (gen.score >= 4) addFlag(flags,'REVIEW','OLD_RESEARCH_STANDARD',`旧世代データの可能性が高いです (score=${gen.score}, legacyInputs=${gen.legacyInputs}, noReason=${gen.noReason}, noExposure=${gen.noExposure})`);

    // Non-default weights are not errors, but worth a cross-machine consistency review later.
    for (const f of pubFeatures) if (Number.isFinite(f?.weight) && Math.abs(f.weight - 1) > 1e-9) addFlag(flags,'REVIEW','NON_DEFAULT_WEIGHT',`weight=${f.weight}`,[f.featureId]);

    for (const f of flags) delete f._key;
    const status = flags.some(f=>f.severity==='HIGH_RISK') ? 'HIGH_RISK' : flags.length ? 'REVIEW' : 'PASS';
    const riskScore = flags.reduce((n,f)=>n+(f.severity==='HIGH_RISK'?5:1),0) + Math.min(4,gen.score);
    rows.push({machineId,displayName:machine?.machine?.displayName ?? machineId,machineDataVersion:machine?.machine?.machineDataVersion ?? machine?.machineDataVersion ?? null,status,riskScore,generationRisk:gen,flags});
  }

  rows.sort((a,b)=>b.riskScore-a.riskScore || severityRank(b.status)-severityRank(a.status) || a.machineId.localeCompare(b.machineId));
  const summary = {
    machineCount: rows.length,
    pass: rows.filter(x=>x.status==='PASS').length,
    review: rows.filter(x=>x.status==='REVIEW').length,
    highRisk: rows.filter(x=>x.status==='HIGH_RISK').length,
    flagCounts: Object.fromEntries([...new Set(rows.flatMap(x=>x.flags.map(f=>f.code)))].sort().map(code=>[code,rows.reduce((n,x)=>n+x.flags.filter(f=>f.code===code).length,0)])),
  };
  return {schemaVersion:'machine-data-health-audit-v2',generatedAt:new Date().toISOString(),summary,machines:rows};
}

function markdown(report) {
  const s=report.summary;
  const lines=[
    '# MachineData Health Audit v2','',
    `- Machines: ${s.machineCount}`,
    `- PASS: ${s.pass}`,
    `- REVIEW: ${s.review}`,
    `- HIGH_RISK: ${s.highRisk}`,'',
    '## Flag counts','',
    ...Object.entries(s.flagCounts).map(([k,v])=>`- ${k}: ${v}`),'',
    '## Priority ranking','',
    '| # | Machine | Status | Score | Main flags |',
    '|---:|---|---|---:|---|',
    ...report.machines.slice(0,50).map((m,i)=>`| ${i+1} | ${m.displayName} (${m.machineId}) | ${m.status} | ${m.riskScore} | ${m.flags.slice(0,4).map(f=>f.code).join(', ')} |`),
    '','## Notes','',
    '- This is a triage audit. REVIEW/HIGH_RISK means “manual recheck recommended”, not “data is wrong”.',
    '- No MachineData is modified by this audit.',
    '- Web re-research should start from HIGH_RISK and older-generation candidates.',
  ];
  return lines.join('\n')+'\n';
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root=path.resolve(process.argv[2] ?? '.');
  const outJson=path.resolve(process.argv[3] ?? path.join(root,'reports','machine-data-health-audit-v2.json'));
  const outMd=path.resolve(process.argv[4] ?? path.join(root,'reports','machine-data-health-audit-v2.md'));
  fs.mkdirSync(path.dirname(outJson),{recursive:true}); fs.mkdirSync(path.dirname(outMd),{recursive:true});
  const report=auditMachineDataHealth(root);
  fs.writeFileSync(outJson,JSON.stringify(report,null,2)+'\n');
  fs.writeFileSync(outMd,markdown(report));
  console.log(`MachineData Health Audit v2: PASS ${report.summary.pass} / REVIEW ${report.summary.review} / HIGH_RISK ${report.summary.highRisk} / TOTAL ${report.summary.machineCount}`);
  for (const m of report.machines.slice(0,20)) console.log(`${m.status}\t${m.riskScore}\t${m.machineId}\t${m.flags.map(f=>f.code).join(',')}`);
}
