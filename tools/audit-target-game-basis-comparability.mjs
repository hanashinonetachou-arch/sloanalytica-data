import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const researchRoot = path.join(root, 'research');
const reportDir = path.join(root, 'reports');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const text = v => typeof v === 'string' ? v.trim() : '';
const gameLike = v => /(ゲーム|game|games|通常G|総G|有効G|消化G)/i.test(text(v));
const conditionalLike = v => /(CZ中|AT中|ART中|ボーナス中|高確|周期中|終了時|成立時|当選時|回数|機会)/i.test(text(v));

const results = [];
for (const dir of fs.readdirSync(researchRoot, {withFileTypes:true})) {
  if (!dir.isDirectory()) continue;
  const sp = path.join(researchRoot, dir.name, 'selection-data.json');
  const rp = path.join(researchRoot, dir.name, 'research-data.json');
  if (!fs.existsSync(sp) || !fs.existsSync(rp)) continue;
  const s = read(sp);
  const r = read(rp);
  const target = s.difficultyAnalysis?.targetGameBasis;
  if (!target || target.quality !== 'ESTIMATED') continue;

  const included = (s.features ?? []).filter(f => f.difficultyParticipation === 'INCLUDE' && f.difficultyExposure);
  if (!included.length) continue;
  const researchById = new Map((r.features ?? []).map(f => [f.researchFeatureId, f]));
  const basisAligned = included.filter(f => f.difficultyExposure?.basisId === target.basisId);
  const crossBasis = included.filter(f => f.difficultyExposure?.basisId && f.difficultyExposure.basisId !== target.basisId);
  const direct = basisAligned.filter(f => f.difficultyExposure?.mode === 'per_game' && Number(f.difficultyExposure?.factor ?? 1) === 1);

  const contexts = basisAligned.map(f => {
    const rf = researchById.get(f.researchFeatureId) ?? {};
    return {
      featureId:f.featureId,
      denominator:text(rf.denominatorDefinition),
      trialUnit:text(rf.trialUnit),
      observationScope:text(rf.observationScope),
      gameLike:gameLike(`${rf.denominatorDefinition ?? ''} ${rf.trialUnit ?? ''}`),
      conditionalLike:conditionalLike(`${rf.denominatorDefinition ?? ''} ${rf.trialUnit ?? ''} ${rf.observationScope ?? ''}`)
    };
  });

  const hasDirectGameDenominator = contexts.some(c => c.gameLike && !c.conditionalLike);
  const allIncludedSameBasis = crossBasis.length === 0;
  const allDirectOneToOne = included.every(f => f.difficultyExposure?.basisId === target.basisId && f.difficultyExposure?.mode === 'per_game' && Number(f.difficultyExposure?.factor ?? 1) === 1);
  const documented = text(target.note).length >= 12 && target.crossMachineComparable === true;

  let classification;
  let rationale;
  if (documented) {
    classification = 'DOCUMENTED_ESTIMATED';
    rationale = 'ESTIMATEDの理由とcrossMachineComparableが既に明示されている。';
  } else if (allDirectOneToOne && hasDirectGameDenominator) {
    classification = 'DIRECT_GAME_BASIS_METADATA_DEBT';
    rationale = 'Difficulty参加Featureは同一basisの1:1ゲーム分母に接続している。主課題はtargetGameBasisの比較可能性メタデータ不足。';
  } else if (allIncludedSameBasis && hasDirectGameDenominator) {
    classification = 'SAME_BASIS_MODEL_REVIEW';
    rationale = '同一basis内だが1:1以外の換算を含むため、targetGamesの意味と換算モデルを合わせて確認する。';
  } else if (crossBasis.length > 0) {
    classification = 'CROSS_BASIS_REVIEW';
    rationale = 'targetGameBasisと異なるbasisのDifficulty Featureが残るため、機種単位で比較軸の整合性を確認する。';
  } else {
    classification = 'TARGET_BASIS_SEMANTIC_REVIEW';
    rationale = 'Research上、targetGameBasisを直接的なゲーム分母として機械判定できない。';
  }

  results.push({
    machineId:s.machineId,
    machine:r.machine?.displayName ?? s.machineId,
    targetGameBasis:target,
    includedFeatures:included.map(f=>({featureId:f.featureId,mode:f.difficultyExposure?.mode,basisId:f.difficultyExposure?.basisId})),
    contexts,
    classification,
    rationale
  });
}

const counts = {};
for (const x of results) counts[x.classification]=(counts[x.classification]??0)+1;
const order=['CROSS_BASIS_REVIEW','TARGET_BASIS_SEMANTIC_REVIEW','SAME_BASIS_MODEL_REVIEW','DIRECT_GAME_BASIS_METADATA_DEBT','DOCUMENTED_ESTIMATED'];
const sorted=[...results].sort((a,b)=>order.indexOf(a.classification)-order.indexOf(b.classification)||a.machineId.localeCompare(b.machineId));
fs.mkdirSync(reportDir,{recursive:true});
fs.writeFileSync(path.join(reportDir,'target-game-basis-comparability-v1.json'),JSON.stringify({schemaVersion:'target-game-basis-comparability-v1',generatedAt:new Date().toISOString(),machines:results.length,counts,results},null,2)+'\n');
const table=sorted.map((x,i)=>`| ${i+1} | ${x.machine} (${x.machineId}) | ${x.targetGameBasis.basisId} | ${x.classification} | ${x.rationale} |`).join('\n');
const md=`# Target Game Basis Comparability Audit — v1\n\n- ESTIMATED targetGameBasis machines with Difficulty Features: ${results.length}\n${order.map(k=>`- ${k}: ${counts[k]??0}`).join('\n')}\n\n## Priority\n\n| # | Machine | Basis | Classification | Rationale |\n|---:|---|---|---|---|\n${table}\n\n## Policy\n\n- targetGameBasis.quality=ESTIMATED is not an error by itself. It represents uncertainty in the common game-count axis used to compare Difficulty across machines.\n- DIRECT_GAME_BASIS_METADATA_DEBT does not authorize automatic promotion to EXACT. It means current Research/Selection structure supports a direct game denominator, while cross-machine-comparability documentation is missing.\n- CROSS_BASIS_REVIEW / SAME_BASIS_MODEL_REVIEW / TARGET_BASIS_SEMANTIC_REVIEW should be checked before metadata backfill.\n- This audit changes no SelectionData or Difficulty values.\n`;
fs.writeFileSync(path.join(reportDir,'target-game-basis-comparability-v1.md'),md);
console.log(`Target game basis audit: ${results.length} machines`);
for(const k of order) console.log(`${k}\t${counts[k]??0}`);
