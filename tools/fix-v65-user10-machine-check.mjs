import fs from 'node:fs';

function readJson(path){ return JSON.parse(fs.readFileSync(path,'utf8')); }
function writeJson(path,value){ fs.writeFileSync(path,JSON.stringify(value,null,2)+'\n','utf8'); }

// 1) SBJ: user-facing Selection summary must not expose a machine-linked service name.
{
  const path='research/L_SUPER_BLACKJACK_SLDC/selection-data.json';
  const s=readJson(path);
  const suika=s.features.find(f=>f.featureId==='FEAT_DIAGONAL_SUIKA');
  const jac=s.features.find(f=>f.featureId==='FEAT_JAC_CARD_EXCLUDED');
  if(!suika||!jac) throw new Error('SBJ target features missing');
  suika.userReason='斜めスイカは成立回数を直接観測でき、設定1約1/99.9から設定6約1/83.9まで設定差があるため補助採用します。';
  jac.userFacingReason='トランプのカテゴリ別回数は観測できますが、設定別の完全な出現分布が未解決でmultinomial尤度を構成できないため不採用です。';
  writeJson(path,s);
}

// 2) Nyaruko: selected public multinomials are rounded by 0.1%, so explicitly opt in to safe <=0.5% normalization.
{
  const path='research/S_HAIYORE_NYARUKO_SAN_Y/selection-data.json';
  const s=readJson(path);
  for(const id of ['FEAT_CZ_INITIAL_STAGE','FEAT_FIGURE_POSE']){
    const f=s.features.find(x=>x.featureId===id);
    if(!f) throw new Error(`Nyaruko ${id} missing`);
    f.normalizeRoundedCategoryProbabilities=true;
  }
  writeJson(path,s);
}

// 3) Batch quality: rounded-sum warnings are already resolved when Selection excludes the feature
// or explicitly enables the builder's bounded rounding normalization.
{
  const path='tools/batch-machine-pipeline.mjs';
  let text=fs.readFileSync(path,'utf8');
  const oldSig='export function classifyMachineQuality({ researchValidation, selectionValidation, selectionQuality, research }) {';
  const newHelper=`export function shouldSurfaceResearchWarning(warning, selection) {\n  if (warning?.code !== 'MULTINOMIAL_ROUNDED_SUM') return true;\n  const match = String(warning?.message ?? '').match(/^Feature ([A-Z0-9_]+) \/ /);\n  if (!match) return true;\n  const selected = (selection?.features ?? []).find(feature => feature?.researchFeatureId === match[1]);\n  if (!selected) return true;\n  if (selected.adoptionCategory === 'EXCLUDE') return false;\n  if (selected.normalizeRoundedCategoryProbabilities === true) return false;\n  return true;\n}\n\nexport function classifyMachineQuality({ researchValidation, selectionValidation, selectionQuality, research, selection }) {`;
  if(!text.includes(oldSig)) throw new Error('batch classifier signature not found');
  text=text.replace(oldSig,newHelper);
  const oldWarnings='  for (const warning of researchValidation?.warnings ?? []) reasons.push(`ResearchData: ${warning.message ?? warning}`);';
  const newWarnings='  for (const warning of researchValidation?.warnings ?? []) if (shouldSurfaceResearchWarning(warning, selection)) reasons.push(`ResearchData: ${warning.message ?? warning}`);';
  if(!text.includes(oldWarnings)) throw new Error('batch warning loop not found');
  text=text.replace(oldWarnings,newWarnings);
  const oldCall='    return classifyMachineQuality({ researchValidation, selectionValidation, selectionQuality, research });';
  const newCall='    return classifyMachineQuality({ researchValidation, selectionValidation, selectionQuality, research, selection });';
  if(!text.includes(oldCall)) throw new Error('batch classifier call not found');
  text=text.replace(oldCall,newCall);
  fs.writeFileSync(path,text,'utf8');
}

// 4) Regression tests for resolved and unresolved rounded warnings.
{
  const path='test/batch-machine-pipeline.test.mjs';
  let text=fs.readFileSync(path,'utf8');
  const oldImport="import { normalizeMachineIds, shouldEnforceSelectionQuality, classifyMachineQuality, deriveOverallStatus, generatedPaths } from '../tools/batch-machine-pipeline.mjs';";
  const newImport="import { normalizeMachineIds, shouldEnforceSelectionQuality, shouldSurfaceResearchWarning, classifyMachineQuality, deriveOverallStatus, generatedPaths } from '../tools/batch-machine-pipeline.mjs';";
  if(!text.includes(oldImport)) throw new Error('batch test import not found');
  text=text.replace(oldImport,newImport);
  const marker="test('validation failure classifies BLOCKED', () => {";
  if(!text.includes(marker)) throw new Error('batch test insertion marker not found');
  const tests=`test('rounded multinomial warning is resolved when Selection excludes the feature', () => {\n  const warning={ code:'MULTINOMIAL_ROUNDED_SUM', message:'Feature RF_ROUNDED / SET_1 の公開カテゴリ確率は丸めにより合計が1.001です。' };\n  const selection={ features:[{ researchFeatureId:'RF_ROUNDED', adoptionCategory:'EXCLUDE' }] };\n  assert.equal(shouldSurfaceResearchWarning(warning,selection),false);\n  assert.equal(classifyMachineQuality({\n    researchValidation:{status:'PASS',warnings:[warning]}, selectionValidation:{ok:true,warnings:[]},\n    selectionQuality:{status:'PASS',blockers:[],reviews:[]}, research:{machine:{displayName:'Machine'},conflicts:[]}, selection\n  }).status,'PASS');\n});\n\ntest('rounded multinomial warning is resolved by explicit bounded Selection normalization', () => {\n  const warning={ code:'MULTINOMIAL_ROUNDED_SUM', message:'Feature RF_ROUNDED / SET_4 の公開カテゴリ確率は丸めにより合計が1.001です。' };\n  const selection={ features:[{ researchFeatureId:'RF_ROUNDED', adoptionCategory:'INCLUDE_SUPPORT', normalizeRoundedCategoryProbabilities:true }] };\n  assert.equal(shouldSurfaceResearchWarning(warning,selection),false);\n  assert.equal(classifyMachineQuality({\n    researchValidation:{status:'PASS',warnings:[warning]}, selectionValidation:{ok:true,warnings:[]},\n    selectionQuality:{status:'PASS',blockers:[],reviews:[]}, research:{machine:{displayName:'Machine'},conflicts:[]}, selection\n  }).status,'PASS');\n});\n\ntest('unresolved selected rounded multinomial warning remains REVIEW', () => {\n  const warning={ code:'MULTINOMIAL_ROUNDED_SUM', message:'Feature RF_ROUNDED / SET_4 の公開カテゴリ確率は丸めにより合計が1.001です。' };\n  const selection={ features:[{ researchFeatureId:'RF_ROUNDED', adoptionCategory:'INCLUDE_SUPPORT' }] };\n  assert.equal(shouldSurfaceResearchWarning(warning,selection),true);\n  assert.equal(classifyMachineQuality({\n    researchValidation:{status:'PASS',warnings:[warning]}, selectionValidation:{ok:true,warnings:[]},\n    selectionQuality:{status:'PASS',blockers:[],reviews:[]}, research:{machine:{displayName:'Machine'},conflicts:[]}, selection\n  }).status,'REVIEW');\n});\n\n`;
  text=text.replace(marker,tests+marker);
  fs.writeFileSync(path,text,'utf8');
}

console.log('Applied v6.5 user10 machine-check fixes');
