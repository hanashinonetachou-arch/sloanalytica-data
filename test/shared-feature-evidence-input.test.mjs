import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildMachineData } from '../tools/build-machine-data.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));

test('Shin Eva shares one observation input between numeric Feature and Evidence',()=>{
  const research=read(path.join(ROOT,'research/L_SHIN_EVANGELION/research-data.json'));
  const selection=read(path.join(ROOT,'research/L_SHIN_EVANGELION/selection-data.json'));
  const pkg=buildMachineData(research,selection,null);

  const rei=pkg.features.features.find(f=>f.featureId==='FEAT_REI_CHANCE_PICTURE');
  const bonus=pkg.features.features.find(f=>f.featureId==='FEAT_BONUS_END_SCREEN');
  assert.ok(rei,'Rei success picture must be a numeric Feature');
  assert.ok(bonus,'Bonus end screen must be a numeric Feature');

  const eviById=new Map(pkg.evidence.evidences.map(e=>[e.id,e]));
  assert.equal(eviById.get('EVI_REI_MOON')?.inputId,'INP_REI_PIC_MOON');
  assert.equal(eviById.get('EVI_REI_LONG_HAIR')?.inputId,'INP_REI_PIC_LONG_HAIR');
  assert.equal(eviById.get('EVI_BONUS_END_NOT_1')?.inputId,'INP_BONUS_END_PURPLE1');
  assert.equal(eviById.get('EVI_BONUS_END_SILVER')?.inputId,'INP_BONUS_END_SILVER');
  assert.equal(eviById.get('EVI_BONUS_END_GOLD')?.inputId,'INP_BONUS_END_GOLD');
  assert.equal(eviById.get('EVI_BONUS_END_RAINBOW')?.inputId,'INP_BONUS_END_RAINBOW');
  assert.deepEqual(eviById.get('EVI_REI_MOON')?.sharedFeatureIds,['FEAT_REI_CHANCE_PICTURE']);
  assert.deepEqual(eviById.get('EVI_BONUS_END_SILVER')?.sharedFeatureIds,['FEAT_BONUS_END_SCREEN']);

  const inputById=new Map(pkg.inputs.inputs.map(i=>[i.id,i]));
  assert.equal(inputById.get('INP_REI_NAV_FOUR_CHOICE')?.name,'4択ナビ');
  assert.equal(inputById.get('INP_REI_NAV_TWO_CHOICE')?.name,'2択ナビ');
  assert.equal(inputById.get('INP_REI_NAV_FULL_NAV')?.name,'全ナビ');

  const sectionTitles=pkg.ui.sections.map(s=>s.title);
  assert.ok(sectionTitles.includes('レイチャンス成功画面'));
  assert.ok(sectionTitles.includes('ボーナス終了画面'));
});


test('Discup REG hint shares one observation input between numeric Feature and Evidence',()=>{
  const research=read(path.join(ROOT,'research/L_DISCUP_ULTRA_REMIX_XR/research-data.json'));
  const selection=read(path.join(ROOT,'research/L_DISCUP_ULTRA_REMIX_XR/selection-data.json'));
  const pkg=buildMachineData(research,selection,null);

  const feature=pkg.features.features.find(f=>f.featureId==='FEAT_REG_HINT_MODE');
  assert.ok(feature,'REG hint must be a numeric Feature');
  assert.deepEqual(feature.categoryLabels,['ODD','EVEN','SET2PLUS','SET5PLUS','SET6']);
  for(const probs of Object.values(feature.categoryProbabilities)){
    const sum=probs.reduce((a,b)=>a+b,0);
    assert.ok(Math.abs(sum-1)<1e-9,'REG hint probabilities must sum to 1');
  }

  const evidence=new Map(pkg.evidence.evidences.map(e=>[e.id,e]));
  assert.equal(evidence.get('EVI_REG_HINT_2PLUS')?.inputId,'INP_REG_HINT_2PLUS');
  assert.equal(evidence.get('EVI_REG_HINT_5PLUS')?.inputId,'INP_REG_HINT_5PLUS');
  assert.equal(evidence.get('EVI_REG_HINT_6')?.inputId,'INP_REG_HINT_6');
  assert.deepEqual(evidence.get('EVI_REG_HINT_2PLUS')?.sharedFeatureIds,['FEAT_REG_HINT_MODE']);
  assert.deepEqual(evidence.get('EVI_REG_HINT_5PLUS')?.sharedFeatureIds,['FEAT_REG_HINT_MODE']);
  assert.deepEqual(evidence.get('EVI_REG_HINT_6')?.sharedFeatureIds,['FEAT_REG_HINT_MODE']);

  const inputById=new Map(pkg.inputs.inputs.map(i=>[i.id,i]));
  assert.equal(inputById.get('INP_REG_HINT_ODD')?.name,'奇数設定示唆');
  assert.equal(inputById.get('INP_REG_HINT_EVEN')?.name,'偶数設定示唆');
  assert.equal(inputById.get('INP_REG_HINT_2PLUS')?.name,'設定2以上');
});
