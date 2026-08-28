#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const cases={
  L_MOMOTARO_DENTETSU_TEIBAN_PU:{
    features:{FEAT_TOURISM_ITEM:'観光マスの対象条件となる都道府県カスタム有効を実機で確定できるか未確認です。公開確率と同じ試行母集団を保証できるまでResearch候補として保持し、現版の推測・入力UIからは除外します。'},
    inputs:['INP_TOURISM_NONE','INP_TOURISM_MOMOTARO','INP_TOURISM_YASHA','INP_TOURISM_KINTARO','INP_TOURISM_URASHIMA','INP_TOURISM_BINBO','INP_TOURISM_MINI','INP_TOURISM_KING'],
    sections:['観光マス ご当地アイテム']
  },
  L_SMASLO_DUNBINE_MF:{
    features:{
      FEAT_AURA_11PT:'規定11ptを偏りなく事後確定できる条件が実機未確認で、Observationでも推測利用不可です。正しい判別周期を分母にできることを確認するまでResearch候補として保持し、現版から除外します。',
      FEAT_BILLBINE_CARRY:'ビルバインRUSH終了ごとに63G+α超え持ち越しを毎回判定できるか実機未確認で、Observationでも推測利用不可です。観測漏れのない分母を保証できるまで現版から除外します。',
      FEAT_CHAM_LAMP:'設定推測対象となるチャムランプのカットイン条件と分類が実機未確認で、Observationでも推測利用不可です。公開分布と同じ試行母集団を確定するまで現版から除外します。'
    },
    inputs:['INP_AURA_TRIAL','INP_AURA_11PT','INP_BILLBINE_END','INP_BILLBINE_CARRY','INP_CHAM_GREEN','INP_CHAM_RED','INP_CHAM_OTHER'],
    sections:['オーラカウンタ','ビルバインRUSH後','チャムランプ']
  },
  S_OVERLORD_II_SX:{
    features:{FEAT_TA_THRESHOLD:'タイムアクセラレータ規定3回・6回・10回の選択値を実戦中に確定できる条件が実機未確認で、Observationでも推測利用不可です。公開分布と同じ周期だけを数えられることを確認するまで現版から除外します。'},
    inputs:['INP_TA_THRESHOLD_3','INP_TA_THRESHOLD_6','INP_TA_THRESHOLD_10'],
    sections:['タイムアクセラレータ天井']
  }
};

function read(p){return JSON.parse(fs.readFileSync(p,'utf8'));}
function write(p,v){fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');}
function stripFeature(f,reason){
  const keep={researchFeatureId:f.researchFeatureId,featureId:f.featureId,adoptionCategory:'EXCLUDE',userFacingReason:reason};
  return keep;
}

for(const [machineId,cfg] of Object.entries(cases)){
  const dir=path.join(root,'research',machineId);
  const sp=path.join(dir,'selection-data.json');
  const up=path.join(dir,'ui-design-data.json');
  const s=read(sp);
  const targetIds=new Set(Object.keys(cfg.features));
  let changed=0;
  s.features=s.features.map(f=>{
    if(!targetIds.has(f.featureId)) return f;
    changed++;
    return stripFeature(f,cfg.features[f.featureId]);
  });
  if(changed!==targetIds.size) throw new Error(`${machineId}: feature target mismatch ${changed}/${targetIds.size}`);
  const removeInputs=new Set(cfg.inputs);
  s.inputs=(s.inputs??[]).filter(i=>!removeInputs.has(i.id));
  write(sp,s);

  const u=read(up);
  const removeSections=new Set(cfg.sections);
  u.sectionOrder=(u.sectionOrder??[]).filter(x=>!removeSections.has(x));
  for(const sec of cfg.sections) delete u.sections?.[sec];
  for(const id of cfg.inputs) delete u.inputContracts?.[id];
  if(u.quickInputContract){
    u.quickInputContract.selectableSections=(u.quickInputContract.selectableSections??[]).filter(x=>!removeSections.has(x));
    u.quickInputContract.inputIds=(u.quickInputContract.inputIds??[]).filter(x=>!removeInputs.has(x));
  }
  u.unresolved=Array.from(new Set([...(u.unresolved??[]),'実機確認待ちの数値候補はResearch/Observationに保持し、公開試行母集団を保証できるまで現版の入力UI・推測から除外する。']));
  u.auditNotes=Array.from(new Set([...(u.auditNotes??[]),'v6.4 Observation整合監査: usableForInference=false / UNRESOLVED の数値候補をSelection INCLUDEのまま公開しない。']));
  write(up,u);
  console.log(`UPDATED ${machineId}`);
}
