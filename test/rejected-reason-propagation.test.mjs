import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildMachineData } from '../tools/build-machine-data.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const MACHINE_IDS=[
  'S_FAMISTA_KAIDO_FB',
  'S_GRANBELM_ZX',
  'S_SUPER_BINGO_NEO_CLASSIC_HH1',
  'S_ODANOBUNA_ZENKOKU_SNT',
  'S_SENGOKU_KOIHIME_FC',
  'S_NIGHTS_YTCC',
  'L_KOMONCHAMA_TEN_L2',
  'L_SHIN_IKKITOUSEN_V',
  'L_KYOUKARA_OREHA_FE',
  'L_ONIMUSHA3_XA'
];
const EMPTY_REASONS=new Set(['推測計算には使用していません。','不採用です。','参考情報です。']);

for(const machineId of MACHINE_IDS){
  test(`${machineId}: rejected reasons preserve Selection user-facing rationale`,()=>{
    const research=read(`research/${machineId}/research-data.json`);
    const selection=read(`research/${machineId}/selection-data.json`);
    const pkg=buildMachineData(research,selection);
    const rejectedById=new Map((pkg.selectionSummary?.rejected??[]).map(x=>[x.featureId,x]));

    for(const sf of selection.features??[]){
      if(sf.adoptionCategory!=='EXCLUDE') continue;
      const expected=(sf.userFacingReason??sf.userReason??sf.rejectionReason)?.trim();
      assert.ok(expected,`${sf.featureId}: Selection must define a user-facing rejection reason`);
      assert.equal(rejectedById.get(sf.featureId)?.reason,expected,`${sf.featureId}: generated reason must preserve Selection rationale`);
    }

    for(const item of pkg.selectionSummary?.rejected??[]){
      assert.ok(typeof item.reason==='string'&&item.reason.trim(),`${item.featureId}: rejected reason must not be empty`);
      assert.ok(!EMPTY_REASONS.has(item.reason.trim()),`${item.featureId}: rejected reason must explain why, not merely state rejection`);
    }
  });
}

test('Builder blocks EXCLUDE without a user-facing reason',()=>{
  const machineId='S_FAMISTA_KAIDO_FB';
  const research=read(`research/${machineId}/research-data.json`);
  const selection=read(`research/${machineId}/selection-data.json`);
  const broken=structuredClone(selection);
  const target=broken.features.find(x=>x.adoptionCategory==='EXCLUDE');
  delete target.userFacingReason;
  delete target.userReason;
  delete target.rejectionReason;
  assert.throws(()=>buildMachineData(research,broken),/EXCLUDE requires a user-facing reason/);
});
