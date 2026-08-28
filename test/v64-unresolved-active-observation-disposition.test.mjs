import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const cases={
  L_MOMOTARO_DENTETSU_TEIBAN_PU:{features:['FEAT_TOURISM_ITEM'],inputs:['INP_TOURISM_NONE','INP_TOURISM_MOMOTARO'],sections:['観光マス ご当地アイテム']},
  L_SMASLO_DUNBINE_MF:{features:['FEAT_AURA_11PT','FEAT_BILLBINE_CARRY','FEAT_CHAM_LAMP'],inputs:['INP_AURA_TRIAL','INP_BILLBINE_END','INP_CHAM_GREEN'],sections:['オーラカウンタ','ビルバインRUSH後','チャムランプ']},
  S_OVERLORD_II_SX:{features:['FEAT_TA_THRESHOLD'],inputs:['INP_TA_THRESHOLD_3'],sections:['タイムアクセラレータ天井']}
};

for(const [machineId,cfg] of Object.entries(cases)){
  test(`${machineId}: unresolved Observation candidates are not published as active inference inputs`,()=>{
    const s=JSON.parse(fs.readFileSync(`research/${machineId}/selection-data.json`,'utf8'));
    const u=JSON.parse(fs.readFileSync(`research/${machineId}/ui-design-data.json`,'utf8'));
    const o=JSON.parse(fs.readFileSync(`research/${machineId}/machine-observation-data.json`,'utf8'));
    for(const featureId of cfg.features){
      const f=s.features.find(x=>x.featureId===featureId);
      assert.ok(f,`${featureId} missing`);
      assert.equal(f.adoptionCategory,'EXCLUDE');
      assert.match(f.userFacingReason,/未確認|保証できるまで/);
      const m=o.featureMappings.find(x=>x.featureId===featureId);
      assert.ok(m,`${featureId} Observation mapping missing`);
      assert.equal(m.usableForInference,false);
      assert.equal(m.mappingType,'UNRESOLVED');
    }
    for(const inputId of cfg.inputs){
      assert.equal(s.inputs.some(x=>x.id===inputId),false,`${inputId} should be absent from Selection inputs`);
      assert.equal(Object.hasOwn(u.inputContracts??{},inputId),false,`${inputId} should be absent from UI contracts`);
    }
    for(const section of cfg.sections){
      assert.equal((u.sectionOrder??[]).includes(section),false,`${section} should be absent from sectionOrder`);
      assert.equal(Object.hasOwn(u.sections??{},section),false,`${section} should be absent from UI sections`);
    }
  });
}
