#!/usr/bin/env node
import fs from 'node:fs';

const id='L_SMASLO_BAKEMONOGATARI_KH';
const base=`research/${id}`;
const sp=`${base}/selection-data.json`,rp=`${base}/research-data.json`,op=`${base}/machine-observation-data.json`,up=`${base}/ui-design-data.json`;
const selection=JSON.parse(fs.readFileSync(sp,'utf8'));
const research=JSON.parse(fs.readFileSync(rp,'utf8'));
const observation=JSON.parse(fs.readFileSync(op,'utf8'));
const ui=JSON.parse(fs.readFileSync(up,'utf8'));
const em=new Map((research.evidenceCandidates??[]).map(x=>[x.researchEvidenceId,x]));

const defs=[
  {groupId:'SAMMY_TROPHY',label:'サミートロフィー',contractId:'EVI_UI_SAMMY_TROPHY',obsId:'OBS_EVI_SAMMY_TROPHY',specs:[['RE_TROPHY_2','TROPHY_BRONZE'],['RE_TROPHY_3','TROPHY_SILVER'],['RE_TROPHY_4','TROPHY_GOLD'],['RE_TROPHY_5','TROPHY_KIRIN'],['RE_TROPHY_6','TROPHY_RAINBOW']]},
  {groupId:'AT_END_SCREEN',label:'AT終了画面',contractId:'EVI_UI_AT_END_SCREEN',obsId:'OBS_EVI_AT_END_SCREEN',specs:[['RE_END_4','END_FIRST_GEN_3'],['RE_END_5','END_FIRST_GEN_HEROINES'],['RE_END_6','END_I_LOVE_YOU']]},
  {groupId:'PAYOUT_DISPLAY',label:'獲得枚数表示',contractId:'EVI_UI_PAYOUT_DISPLAY',obsId:'OBS_EVI_PAYOUT_DISPLAY',specs:[['RE_PAYOUT_174','PAYOUT_174'],['RE_PAYOUT_543','PAYOUT_543'],['RE_PAYOUT_331','PAYOUT_331']]},
  {groupId:'BONUS_CONFIRM_SCREEN',label:'ボーナス確定画面',contractId:'EVI_UI_BONUS_CONFIRM_SCREEN',obsId:'OBS_EVI_BONUS_CONFIRM_SCREEN',specs:[['RE_BONUS_SHINOBU_RED7','BONUS_SHINOBU_RED7']]}
];

const groups=defs.map(d=>({
  groupId:d.groupId,label:d.label,selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',
  options:d.specs.map(([sourceEvidenceId,value])=>{
    const ev=em.get(sourceEvidenceId);
    if(!ev) throw new Error(`${id}: missing Research Evidence ${sourceEvidenceId}`);
    if(ev.factStatus!=='verified') throw new Error(`${id}: unverified Research Evidence ${sourceEvidenceId}`);
    if(!Array.isArray(ev.allowedSettings)||!Array.isArray(ev.deniedSettings)) throw new Error(`${id}: incomplete settings ${sourceEvidenceId}`);
    return {value,label:ev.name,allowedSettings:ev.allowedSettings,excludedSettings:ev.deniedSettings,sourceEvidenceIds:[sourceEvidenceId]};
  })
}));

selection.machineDataVersion='0.1.7';
selection.inputs=(selection.inputs??[]).filter(x=>x.id!=='INP_SETTING_FLOOR'&&x.id!=='INP_EVI_SETTING_FLOOR');
selection.evidence=[];
selection.evidenceUi={groups};
fs.writeFileSync(sp,JSON.stringify(selection,null,2)+'\n');

const newObsIds=new Set(defs.map(x=>x.obsId));
observation.observations=(observation.observations??[]).filter(x=>x.observationId!=='OBS_BAKE_EVIDENCE'&&x.observationId!=='OBS_SETTING_EVIDENCE'&&!newObsIds.has(x.observationId));
for(const d of defs){
  const group=groups.find(g=>g.groupId===d.groupId);
  observation.observations.push({
    observationId:d.obsId,sourceType:'END_EVENT',observationMode:'VISUAL_EVENT',status:'FOUND',label:d.label,
    categories:group.options.map(x=>x.label),timing:[`${d.label}を実際に確認した時`],excludedConditions:['未確認を非発生とみなさない'],sourceRefs:[],
    notes:'Evidence UI v2 Phase 2。設定下限ではなく、実際に確認した自然観測を記録する。'
  });
}
fs.writeFileSync(op,JSON.stringify(observation,null,2)+'\n');

const sec=ui.sections?.['設定確定・否定情報'];
if(!sec) throw new Error(`${id}: evidence section missing`);
sec.inputIds=[];
sec.evidenceIds=defs.map(x=>x.contractId);
sec.description=sec.description??'';
sec.collapsible=sec.collapsible??false;
sec.defaultExpanded=sec.defaultExpanded??true;
delete ui.inputContracts?.INP_SETTING_FLOOR;
delete ui.inputContracts?.INP_EVI_SETTING_FLOOR;
ui.evidenceContracts={};
for(const d of defs) ui.evidenceContracts[d.contractId]={label:d.label,selectionMode:'single',sourceEvidenceGroupId:d.groupId,inheritOptions:true};
ui.auditNotes=[
  'Evidence UI v2 Phase 2正式移行。旧INP_SETTING_FLOOR / legacy evidence[]を廃止し、Researchで分離済みの自然観測面へ移行した。',
  'サミートロフィー・AT終了画面・獲得枚数表示・ボーナス確定画面を独立Evidence Groupとして入力する。',
  'Research EvidenceのallowedSettings / deniedSettingsを唯一の設定制約ソースとし、既存Featureの再選定は行っていない。'
];
fs.writeFileSync(up,JSON.stringify(ui,null,2)+'\n');
console.log(`${id}: Evidence UI v2 batch9g canonical migration complete`);
