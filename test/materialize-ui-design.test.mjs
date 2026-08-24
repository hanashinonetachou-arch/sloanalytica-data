import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { materializeUiDesign } from '../tools/materialize-ui-design.mjs';

const root=new URL('../',import.meta.url);
function read(rel){return JSON.parse(fs.readFileSync(new URL(rel,root),'utf8'));}

for(const machineId of ['S_MY_JUGGLER_V_KD','LB_SLOT_GALFY_A4','L_INITIAL_D_2ND']){
  test(`${machineId}: materializes UI without changing inference payload`,()=>{
    const pkg=read(`machines/${machineId}/machine-package.json`);
    const design=read(`research/${machineId}/ui-design-data.json`);
    const out=materializeUiDesign(pkg,design);
    assert.deepEqual(out.features,pkg.features);
    assert.deepEqual(out.evidence,pkg.evidence);
    assert.equal(out.machine.machineDataVersion,pkg.machine.machineDataVersion);
    assert.deepEqual(out.ui.sections.map(s=>s.title),design.sectionOrder);
    for(const [id,c] of Object.entries(design.inputContracts)){
      const input=out.inputs.inputs.find(x=>x.id===id);
      assert.ok(input,`${id} exists`);
      assert.equal(input.name,c.name);
    }
  });
}

test('Initial D: compact 2-column end-screen counters are materialized',()=>{
  const pkg=read('machines/L_INITIAL_D_2ND/machine-package.json');
  const design=read('research/L_INITIAL_D_2ND/ui-design-data.json');
  const out=materializeUiDesign(pkg,design);
  const section=out.ui.sections.find(s=>s.title==='AT終了画面');
  assert.ok(section,'field-tested AT終了画面 section exists');
  assert.equal(section.items.length,4);
  for(const item of section.items){
    assert.equal(item.gridSpan,6);
    assert.equal(item.config.directInput,false);
    assert.equal(item.config.compact,true);
  }
});

test('GALFY: evidence contract resolves to generated evidence input',()=>{
  const pkg=read('machines/LB_SLOT_GALFY_A4/machine-package.json');
  const design=read('research/LB_SLOT_GALFY_A4/ui-design-data.json');
  const out=materializeUiDesign(pkg,design);
  const section=out.ui.sections.find(s=>s.title==='設定確定情報');
  assert.ok(section.items.some(x=>x.inputId==='INP_EVI_GALFY_SIDE_LAMP'));
});
