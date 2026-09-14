#!/usr/bin/env node
import fs from 'node:fs';
const id='L_MAGICAL_HALLOWEEN8_FE';
const base=`research/${id}`;
const sp=`${base}/selection-data.json`,rp=`${base}/research-data.json`,op=`${base}/machine-observation-data.json`,up=`${base}/ui-design-data.json`;
const selection=JSON.parse(fs.readFileSync(sp,'utf8'));
const research=JSON.parse(fs.readFileSync(rp,'utf8'));
const observation=JSON.parse(fs.readFileSync(op,'utf8'));
const ui=JSON.parse(fs.readFileSync(up,'utf8'));
const em=new Map((research.evidenceCandidates??[]).map(x=>[x.researchEvidenceId,x]));
const defs=[
  {groupId:'TROPHY',label:'トロフィー',contractId:'EVI_UI_TROPHY',obsId:'OBS_EVI_TROPHY',specs:[['RE_TROPHY_2PLUS','TROPHY_2PLUS'],['RE_TROPHY_3PLUS','TROPHY_3PLUS'],['RE_TROPHY_4PLUS','TROPHY_4PLUS'],['RE_TROPHY_5PLUS','TROPHY_5PLUS'],['RE_TROPHY_6','TROPHY_6']]},
  {groupId:'PAYOUT_DISPLAY',label:'獲得枚数表示',contractId:'EVI_UI_PAYOUT_DISPLAY',obsId:'OBS_EVI_PAYOUT_DISPLAY',specs:[['RE_PAYOUT_2PLUS','PAYOUT_2PLUS'],['RE_PAYOUT_4PLUS','PAYOUT_4PLUS'],['RE_PAYOUT_6','PAYOUT_6']]},
  {groupId:'ALICE_PATTERN',label:'アリスインワンダーランド確認パターン',contractId:'EVI_UI_ALICE_PATTERN',obsId:'OBS_EVI_ALICE_PATTERN',specs:[['RE_ALICE_END_2PLUS','ALICE_END_2PLUS'],['RE_ALICE_BOTH_5PLUS','ALICE_BOTH_5PLUS']]},
  {groupId:'ART_END_SCREEN',label:'ART終了画面',contractId:'EVI_UI_ART_END_SCREEN',obsId:'OBS_EVI_ART_END_SCREEN',specs:[['RE_ART_END_2PLUS','ART_END_2PLUS'],['RE_ART_END_4PLUS','ART_END_4PLUS'],['RE_ART_END_6','ART_END_6']]}
];
const groups=defs.map(d=>({groupId:d.groupId,label:d.label,selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',options:d.specs.map(([sourceEvidenceId,value])=>{const ev=em.get(sourceEvidenceId);if(!ev||ev.factStatus!=='verified')throw new Error(`${id}: invalid Research Evidence ${sourceEvidenceId}`);if(!Array.isArray(ev.allowedSettings)||!ev.allowedSettings.length)throw new Error(`${id}: missing allowedSettings ${sourceEvidenceId}`);return{value,label:ev.name,allowedSettings:ev.allowedSettings,excludedSettings:ev.deniedSettings??[],sourceEvidenceIds:[sourceEvidenceId]};})}));
selection.machineDataVersion='0.1.1';selection.evidence=[];selection.evidenceUi={groups};fs.writeFileSync(sp,JSON.stringify(selection,null,2)+'\n');
const replace=new Set(['OBS_SETTING_EVIDENCE',...defs.map(d=>d.obsId)]);observation.observations=(observation.observations??[]).filter(x=>!replace.has(x.observationId));
for(const d of defs){const g=groups.find(x=>x.groupId===d.groupId);observation.observations.push({observationId:d.obsId,sourceType:'END_EVENT',observationMode:'VISUAL_EVENT',status:'FOUND',label:d.label,categories:g.options.map(x=>x.label),timing:[`${d.label}を実際に確認した時`],excludedConditions:['未確認を非発生とみなさない'],sourceRefs:[],notes:'Evidence UI v2 Phase 2。抽象的な設定下限ではなくResearchで定義された自然観測を記録する。'});}fs.writeFileSync(op,JSON.stringify(observation,null,2)+'\n');
const sec=ui.sections?.['設定確定・否定情報'];if(!sec)throw new Error(`${id}: evidence section missing`);sec.inputIds=[];sec.evidenceIds=defs.map(d=>d.contractId);sec.description=sec.description??'';sec.collapsible=sec.collapsible??false;sec.defaultExpanded=sec.defaultExpanded??true;delete ui.inputContracts?.INP_EVI_SETTING_FLOOR;ui.evidenceContracts={};for(const d of defs)ui.evidenceContracts[d.contractId]={label:d.label,selectionMode:'single',sourceEvidenceGroupId:d.groupId,inheritOptions:true};ui.auditNotes=['Evidence UI v2 Phase 2正式移行。旧設定下限をトロフィー、獲得枚数、アリス確認パターン、ART終了画面へ分離した。','アリスはResearch記載どおり「終了画面のみ」と「確定・終了とも」の相互排他的パターンとして扱う。','Feature再選定は行っていない。'];fs.writeFileSync(up,JSON.stringify(ui,null,2)+'\n');
console.log(`${id}: Evidence UI v2 batch9j canonical migration complete`);
