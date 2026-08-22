import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const researchRoot = path.join(root, 'research');
const reportDir = path.join(root, 'reports');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const txt = v => typeof v === 'string' ? v.trim() : '';

const gameTerms = /(通常ゲーム|通常時.*ゲーム|通常G|自分区間.*ゲーム|自己遊技.*ゲーム|総ゲーム|消化ゲーム)/i;
const conditionalTerms = /(CZ中|AT中|ART中|ボーナス中|RB後|終了時|成立時|当選時|周期中|高確.*ゲーム|対象ゲーム|機会回数|試行回数)/i;

const rows = [];
for (const ent of fs.readdirSync(researchRoot, {withFileTypes:true})) {
  if (!ent.isDirectory()) continue;
  const sp = path.join(researchRoot, ent.name, 'selection-data.json');
  const rp = path.join(researchRoot, ent.name, 'research-data.json');
  if (!fs.existsSync(sp) || !fs.existsSync(rp)) continue;
  const s = read(sp);
  const r = read(rp);
  const target = s.difficultyAnalysis?.targetGameBasis;
  if (!target || target.quality !== 'ESTIMATED' || target.crossMachineComparable === true) continue;

  const included = (s.features ?? []).filter(f => f.difficultyParticipation === 'INCLUDE' && f.difficultyExposure);
  if (!included.length) continue;
  const rfById = new Map((r.features ?? []).map(x => [x.researchFeatureId, x]));
  const details = [];
  let structurallyDirect = true;
  let semanticallyGameBased = true;

  for (const f of included) {
    const dx = f.difficultyExposure ?? {};
    const rf = rfById.get(f.researchFeatureId) ?? {};
    const context = `${txt(rf.denominatorDefinition)} ${txt(rf.trialUnit)} ${txt(rf.observationScope)}`;
    const sameBasis = dx.basisId === target.basisId;
    const direct = dx.mode === 'per_game' && Number(dx.factor ?? 1) === 1;
    const gameBased = gameTerms.test(context);
    const conditional = conditionalTerms.test(context);
    if (!sameBasis || !direct) structurallyDirect = false;
    if (!gameBased || conditional) semanticallyGameBased = false;
    details.push({
      featureId:f.featureId,
      researchFeatureId:f.researchFeatureId ?? null,
      basisId:dx.basisId ?? null,
      mode:dx.mode ?? null,
      factor:dx.factor ?? 1,
      denominatorDefinition:txt(rf.denominatorDefinition),
      trialUnit:txt(rf.trialUnit),
      observationScope:txt(rf.observationScope),
      sameBasis,
      direct,
      gameBased,
      conditional
    });
  }

  let classification;
  let rationale;
  if (structurallyDirect && semanticallyGameBased && ['NORMAL_GAMES','SELF_PLAY_GAMES'].includes(target.basisId)) {
    classification = 'READY_ESTIMATED_METADATA_BACKFILL';
    rationale = '全Difficulty参加Featureが同一basisのper_game 1:1で、Research上も条件付き機会ではなく通常/自己遊技ゲームを分母としている。ESTIMATEDは維持しつつ比較可能性と近似理由を明文化可能。';
  } else if (!structurallyDirect) {
    classification = 'STRUCTURE_REVIEW';
    rationale = '同一basisのper_game 1:1だけでは構成されていないため、自動backfill対象外。';
  } else {
    classification = 'SEMANTIC_REVIEW';
    rationale = '構造は直接的だがResearch文言から通常/自己遊技ゲームの共通軸を安全に確認できない。';
  }
  rows.push({machineId:s.machineId,machine:r.machine?.displayName ?? s.machineId,targetGameBasis:target,classification,rationale,details});
}

const counts = {};
for (const row of rows) counts[row.classification]=(counts[row.classification]??0)+1;
const order=['STRUCTURE_REVIEW','SEMANTIC_REVIEW','READY_ESTIMATED_METADATA_BACKFILL'];
const sorted=[...rows].sort((a,b)=>order.indexOf(a.classification)-order.indexOf(b.classification)||a.machineId.localeCompare(b.machineId));
fs.mkdirSync(reportDir,{recursive:true});
fs.writeFileSync(path.join(reportDir,'target-basis-backfill-readiness-v1.json'),JSON.stringify({schemaVersion:'target-basis-backfill-readiness-v1',generatedAt:new Date().toISOString(),machines:rows.length,counts,rows},null,2)+'\n');
const table=sorted.map((x,i)=>`| ${i+1} | ${x.machine} (${x.machineId}) | ${x.targetGameBasis.basisId} | ${x.classification} | ${x.rationale} |`).join('\n');
const md=`# Target Basis Backfill Readiness — v1\n\n- Candidate machines: ${rows.length}\n${order.map(k=>`- ${k}: ${counts[k]??0}`).join('\n')}\n\n| # | Machine | Basis | Classification | Rationale |\n|---:|---|---|---|---|\n${table}\n\n## Backfill policy\n\n- READY does not promote quality to EXACT. quality remains ESTIMATED.\n- READY only permits adding an auditable note/crossMachineComparable contract and matching Feature-level confidence/estimationBasis/uncertaintyNote for direct same-basis 1:1 mappings.\n- The note must explicitly state that machine-specific exclusions/definitions can differ, so cross-machine comparison remains approximate.\n- STRUCTURE/SEMANTIC review is not auto-filled.\n- This audit changes no SelectionData or Difficulty values.\n`;
fs.writeFileSync(path.join(reportDir,'target-basis-backfill-readiness-v1.md'),md);
console.log(`Target basis backfill readiness: ${rows.length} machines`);
for (const k of order) console.log(`${k}\t${counts[k]??0}`);
