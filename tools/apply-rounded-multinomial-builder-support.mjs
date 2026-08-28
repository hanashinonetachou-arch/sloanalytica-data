#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? '.');
const target = path.join(root, 'tools', 'build-machine-data.mjs');
let text = fs.readFileSync(target, 'utf8');

const oldReturn = '      return [s,(excludedCats.size||residualCat)?probs.map(p=>p/includedSum):probs];';
const newReturn = '      if(sf.normalizeRoundedCategoryProbabilities===true && Math.abs(includedSum-1)>0.005) fail(`${sf.featureId}: rounded category normalization exceeds 0.5% for ${s}: ${includedSum}`);\n      return [s,(excludedCats.size||residualCat||sf.normalizeRoundedCategoryProbabilities===true)?probs.map(p=>p/includedSum):probs];';
if (!text.includes(newReturn)) {
  if (!text.includes(oldReturn)) throw new Error('build-machine-data multinomial normalization anchor not found');
  text = text.replace(oldReturn, newReturn);
}

const oldCondition = '    if(!isConditionalPartial && (excludedCats.size || (residualCat && Object.values(rf.settingDistributions??{}).every(dist=>Number.isFinite(Number(dist?.[residualCat])))))) base.categoryConditioning={excludedCategories:[...excludedCats],normalization:"RENORMALIZE_INCLUDED",...(residualCat?{residualCategory:residualCat}:{})};';
const newCondition = '    if(!isConditionalPartial && (excludedCats.size || sf.normalizeRoundedCategoryProbabilities===true || (residualCat && Object.values(rf.settingDistributions??{}).every(dist=>Number.isFinite(Number(dist?.[residualCat])))))) base.categoryConditioning={excludedCategories:[...excludedCats],normalization:"RENORMALIZE_INCLUDED",...(residualCat?{residualCategory:residualCat}:{}),...(sf.normalizeRoundedCategoryProbabilities===true?{roundingNormalization:true}:{})};';
if (!text.includes(newCondition)) {
  if (!text.includes(oldCondition)) throw new Error('build-machine-data categoryConditioning anchor not found');
  text = text.replace(oldCondition, newCondition);
}

fs.writeFileSync(target, text);
console.log('APPLIED rounded multinomial builder support');
