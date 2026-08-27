#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const ids=process.argv.slice(2).filter(x=>!x.startsWith('--'));
if(!ids.length){ console.error('Usage: node tools/complete-selection-feature-dispositions.mjs MACHINE_ID...'); process.exit(2); }

const machineReasons={
  L_CHIBARIYO2_PLUS_ZC:'ボーナス合算を同一通常G分母の代表Featureとして採用しており、この候補を追加すると初当り・チェリー契機の同一当選系列を重複評価するため不採用です。',
  L_DUMBBELL_X:'AT初当りを通常G基準の代表Featureとして採用しており、CZ成功・上位CZ・終了時分布など同一当選過程の上流または下流情報を独立に加えると二重評価になるため不採用です。',
  L_INUYASHA2_FK:'AT初当りを通常G基準の代表Featureとして採用しており、CZ・天井選択・小役・内部状態・引き戻しなど同一遊技過程の上流情報を独立に加えると重複評価になるため不採用です。',
  L_TOARU_ACCELERATOR_RZ:'CZ合算を通常G基準の代表Featureとして採用しており、CZ種類別・AT初当り・シャッター関連抽選など同一CZ生成経路の上流下流を独立に加えると二重評価になるため不採用です。',
  S_MHW_ICEBORNE_ZF:'CZ合算を通常G基準の代表Featureとして採用しており、CZ種類別・状態別レア役抽選・AT直撃・ボーナス内訳など同一当選系列の上流下流を独立に加えると重複評価になるため不採用です。',
  S_MILKY_HOMES_GNB:'ボーナス合算・弱スイカ・通常時押し順ナビを独立した代表Featureとして採用しており、この候補は同一ボーナス系列の内訳、低頻度事象、または示唆分布として既採用情報と重複するため数値推測には追加採用しません。',
  S_SENGOKU_MUSOU3_ZYTCD:'初当りボーナスを通常G基準の代表Featureとして採用しており、AT初当り・ボーナス内訳・BIG/REG中の条件付き事象やボイス分布を独立に加えると同一当選系列を重複評価するため不採用です。'
};

for(const id of ids){
  const dir=path.join(ROOT,'research',id);
  const rp=path.join(dir,'research-data.json');
  const sp=path.join(dir,'selection-data.json');
  if(!fs.existsSync(rp)||!fs.existsSync(sp)){ console.error(`ERROR ${id}: missing research/selection`); process.exitCode=1; continue; }
  const research=JSON.parse(fs.readFileSync(rp,'utf8'));
  const selection=JSON.parse(fs.readFileSync(sp,'utf8'));
  const decided=new Set((selection.features??[]).map(f=>f.researchFeatureId).filter(Boolean));
  const reason=machineReasons[id]??'採用済みFeatureとの依存・重複、観測条件、必要試行量を踏まえ、独立した追加情報として扱う根拠が不足するため不採用です。';
  let added=0;
  for(const rf of research.features??[]){
    if(!rf?.researchFeatureId||decided.has(rf.researchFeatureId)) continue;
    selection.features.push({
      researchFeatureId:rf.researchFeatureId,
      featureId:`FEAT_${rf.researchFeatureId.replace(/^RF_/,'')}_EXCLUDED`,
      adoptionCategory:'EXCLUDE',
      userFacingReason:reason
    });
    decided.add(rf.researchFeatureId); added++;
  }
  fs.writeFileSync(sp,JSON.stringify(selection,null,2)+'\n');
  console.log(`${id}: added ${added} explicit EXCLUDE decisions`);
}
