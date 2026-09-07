#!/usr/bin/env node
import fs from 'node:fs';

const path='research/L_JORMUNGAND_ND01G/selection-data.json';
const data=JSON.parse(fs.readFileSync(path,'utf8'));
const feature=(data.features??[]).find(f=>f.featureId==='FEAT_BONUS_END_SCREEN');
if(!feature) throw new Error('FEAT_BONUS_END_SCREEN not found');
const expected=['HANDGUN_SHELL','OLD_KOKO_TEAM','KASPER','GOLDEN_SCARECROW'];
if(JSON.stringify(feature.categoryExcludeLabels??[])!==JSON.stringify(expected)) {
  throw new Error(`unexpected categoryExcludeLabels: ${JSON.stringify(feature.categoryExcludeLabels)}`);
}
if(feature.adoptionCategory!=='INCLUDE_SUPPORT') throw new Error(`unexpected adoptionCategory: ${feature.adoptionCategory}`);
// These four categories are intentionally removed because they are Hard Evidence.
// build-machine-data already renormalizes included categories whenever categoryExcludeLabels is present.
// normalizeRoundedCategoryProbabilities is only the small-rounding-error guard and must not treat
// the deliberate Evidence mass removal as a rounding deviation.
feature.normalizeRoundedCategoryProbabilities=false;
fs.writeFileSync(path,JSON.stringify(data,null,2)+'\n','utf8');
console.log('Jormungand Selection execution contract refined: non-Evidence categories will be conditionally renormalized.');
