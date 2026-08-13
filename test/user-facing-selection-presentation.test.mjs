import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT=path.resolve(import.meta.dirname,'..');
const machineDirs=fs.readdirSync(path.join(ROOT,'machines'));
const internalTitle=/^(?:AUTO_|PRIMARY(?:_|$)|PREDECESSOR$|SELF_PLAY$|DISPLAY_ONLY(?:_|$)|REFERENCE_TOTAL$)/;
const placeholderUnit=/既存MachineData定義|existing machine data/i;

test('published machine UI section titles never expose internal category identifiers',()=>{
  for(const machineId of machineDirs){
    const p=path.join(ROOT,'machines',machineId,'machine-package.json');
    if(!fs.existsSync(p)) continue;
    const pkg=JSON.parse(fs.readFileSync(p,'utf8'));
    for(const section of pkg.ui?.sections??[]){
      if(section.title) assert.equal(internalTitle.test(section.title),false,`${machineId}: ${section.title}`);
    }
  }
});

test('selection summary requiredTrials never publishes migration placeholder units',()=>{
  for(const machineId of machineDirs){
    const p=path.join(ROOT,'machines',machineId,'machine-package.json');
    if(!fs.existsSync(p)) continue;
    const pkg=JSON.parse(fs.readFileSync(p,'utf8'));
    const summary=pkg.selectionSummary;
    if(!summary) continue;
    for(const item of [...(summary.selected??[]),...(summary.rejected??[])]){
      if(item.requiredTrials) assert.equal(placeholderUnit.test(String(item.requiredTrials.unit)),false,`${machineId}/${item.featureId}: ${item.requiredTrials.unit}`);
    }
  }
});

test('Eureka legacy reference-only inputs are not published after selection-policy migration',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(ROOT,'machines','S_EUREKA_SEVEN_HIEVO_XS','machine-package.json'),'utf8'));
  const ids=new Set(pkg.inputs.inputs.map(x=>x.id));
  for(const id of ['INP_WEAK_CHERRY_WHITE_BIG_COUNT','INP_WEAK_WATERMELON_RED_REG_COUNT','INP_WEAK_WATERMELON_WHITE_REG_COUNT','INP_HINT_CHARLES_RAY','INP_HINT_ANEMONE_DOMINIC','INP_HINT_AGEHA','INP_HINT_HOLLAND_TALHO']) assert.equal(ids.has(id),false,id);
});
