#!/usr/bin/env node
import fs from 'node:fs';

const configs={
  L_MADOKA_FORTE_UU:{
    version:'0.1.1',
    excludeEvidenceIds:new Set(['RE_VOICE_6']),
    classify:id=>{
      if(id.startsWith('RE_CZ_END_')) return ['CZ_END_SCREEN','CZ終了画面'];
      if(id.startsWith('RE_PETIT_')) return ['PETIT_CHARACTER','プチボーナス中キャラ紹介'];
      return null;
    },
    ownership:[{researchEvidenceId:'RE_VOICE_6',ownerFeatureId:'FEAT_BONUS_END_VOICE',reason:'設定6特殊ボイスは採用済みMultinomial Featureのカテゴリとして既に評価されるため、Evidenceとの二重評価を避ける。'}]
  },
  L_TOKYO_GHOUL:{
    version:'0.2.5',
    excludeEvidenceIds:new Set(),
    classify:id=>{
      if(id.startsWith('RE_AT_END_')) return ['AT_END_SCREEN','AT終了画面'];
      if(id.startsWith('RE_CZ_END_')) return ['CZ_END_SCREEN','CZ終了画面'];
      if(id.startsWith('RE_INVITE_')) return ['INVITE_DISPLAY','招待状・示唆表示'];
      if(id.startsWith('RE_PAYOUT_')) return ['PAYOUT_DISPLAY','獲得枚数表示'];
      if(id.startsWith('RE_ENDING_')) return ['ENDING_CARD','エンディングカード'];
      return null;
    },
    ownership:[]
  }
};

for(const [id,cfg] of Object.entries(configs)){
  const base=`research/${id}`;
  const sp=`${base}/selection-data.json`,rp=`${base}/research-data.json`,op=`${base}/machine-observation-data.json`,up=`${base}/ui-design-data.json`;
  const s=JSON.parse(fs.readFileSync(sp,'utf8'));
  const r=JSON.parse(fs.readFileSync(rp,'utf8'));
  const o=JSON.parse(fs.readFileSync(op,'utf8'));
  const u=JSON.parse(fs.readFileSync(up,'utf8'));
  const researchMap=new Map((r.evidenceCandidates??[]).map(e=>[e.researchEvidenceId,e]));
  const sourceIds=[];
  for(const g of s.evidenceUi?.groups??[]) for(const opt of g.options??[]) for(const eid of opt.sourceEvidenceIds??[]) if(eid&&!sourceIds.includes(eid)) sourceIds.push(eid);
  const groups=new Map();
  for(const eid of sourceIds){
    if(cfg.excludeEvidenceIds.has(eid)) continue;
    const ev=researchMap.get(eid); if(!ev) throw new Error(`${id}: missing Research Evidence ${eid}`);
    const klass=cfg.classify(eid); if(!klass) throw new Error(`${id}: cannot classify natural observation for ${eid}`);
    const [groupId,label]=klass;
    if(!groups.has(groupId)) groups.set(groupId,{groupId,label,selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',options:[]});
    const value=eid.replace(/^RE_/,'');
    groups.get(groupId).options.push({value,label:ev.name,allowedSettings:[...(ev.allowedSettings??[])],excludedSettings:[...(ev.deniedSettings??[])],sourceEvidenceIds:[eid]});
  }
  if(id==='L_TOKYO_GHOUL'){
    const oldRaw=JSON.stringify(s.evidenceUi);
    if(!oldRaw.includes('"sourceEvidenceIds": []')) throw new Error('Tokyo Ghoul expected source-less legacy options not found');
  }
  s.machineDataVersion=cfg.version;
  s.evidenceUi={groups:[...groups.values()]};
  s.evidenceReview={policyVersion:1,exclusions:cfg.ownership.map(x=>({...x,disposition:'EXCLUDE_FROM_EVIDENCE_UI'}))};
  fs.writeFileSync(sp,JSON.stringify(s,null,2)+'\n');

  o.observations=(o.observations??[]).filter(x=>!['OBS_MADOKA_EVIDENCE','OBS_SETTING_EVIDENCE'].includes(x.observationId));
  const existing=new Set(o.observations.map(x=>x.observationId));
  for(const g of groups.values()){
    const observationId=`OBS_EVI_${g.groupId}`;
    if(!existing.has(observationId)) o.observations.push({observationId,sourceType:'END_EVENT',observationMode:'VISUAL_EVENT',status:'FOUND',label:g.label,categories:g.options.map(x=>x.label),timing:[`${g.label}を実際に確認した時`],excludedConditions:['未確認を非発生とみなさない'],sourceRefs:[],notes:'Evidence UI v2 REVIEW解消。抽象的な設定下限・否定ではなくResearchにある自然観測Evidenceを記録する。'});
  }
  fs.writeFileSync(op,JSON.stringify(o,null,2)+'\n');

  const sec=u.sections['設定確定・否定情報']??{};
  u.sections['設定確定・否定情報']={...sec,inputIds:[],evidenceIds:[...groups.values()].map(g=>`EVI_UI_${g.groupId}`)};
  for(const key of Object.keys(u.inputContracts??{})) if(key.startsWith('INP_EVI_')) delete u.inputContracts[key];
  u.evidenceContracts=Object.fromEntries([...groups.values()].map(g=>[`EVI_UI_${g.groupId}`,{label:g.label,selectionMode:'single',sourceEvidenceGroupId:g.groupId,inheritOptions:true}]));
  u.auditNotes=[...(u.auditNotes??[]),id==='L_MADOKA_FORTE_UU'?'Evidence UI v2 REVIEW解消: ボーナス終了時設定6特殊ボイスは採用済みFeatureを唯一の計算所有者としEvidenceから除外した。':'Evidence UI v2 REVIEW解消: sourceEvidenceIdsを持たない抽象的な設定2以上・設定5否定を削除し、Research根拠のあるEvidenceだけを自然観測面へ再構成した。','Evidence制約はResearch EvidenceのallowedSettings / deniedSettingsのみから生成する。'];
  fs.writeFileSync(up,JSON.stringify(u,null,2)+'\n');
  console.log(`${id}: REVIEW remediation complete / groups=${groups.size}`);
}
