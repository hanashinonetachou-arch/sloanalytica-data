#!/usr/bin/env node
import fs from 'node:fs';

const id='L_CODE_GEASS_REVIVAL_ZS';
const base=`research/${id}`;
const sp=`${base}/selection-data.json`,rp=`${base}/research-data.json`,op=`${base}/machine-observation-data.json`,up=`${base}/ui-design-data.json`;
const selection=JSON.parse(fs.readFileSync(sp,'utf8'));
const research=JSON.parse(fs.readFileSync(rp,'utf8'));
const observation=JSON.parse(fs.readFileSync(op,'utf8'));
const ui=JSON.parse(fs.readFileSync(up,'utf8'));
const em=new Map((research.evidenceCandidates??[]).map(x=>[x.researchEvidenceId,x]));
const defs=[
  {groupId:'SAMMY_TROPHY',label:'サミートロフィー',contractId:'EVI_UI_SAMMY_TROPHY',obsId:'OBS_EVI_SAMMY_TROPHY',specs:[['RE_TROPHY_2PLUS','TROPHY_BRONZE'],['RE_TROPHY_3PLUS','TROPHY_SILVER'],['RE_TROPHY_4PLUS','TROPHY_GOLD'],['RE_TROPHY_5PLUS','TROPHY_KIRIN'],['RE_TROPHY_6','TROPHY_RAINBOW']]},
  {groupId:'AT_END_SCREEN',label:'AT終了画面',contractId:'EVI_UI_AT_END_SCREEN',obsId:'OBS_EVI_AT_END_SCREEN',specs:[['RE_AT_END_4PLUS','AT_END_4PLUS'],['RE_AT_END_5PLUS','AT_END_5PLUS']]}
];
const groups=defs.map(d=>({groupId:d.groupId,label:d.label,selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',options:d.specs.map(([sourceEvidenceId,value])=>{const ev=em.get(sourceEvidenceId);if(!ev||ev.factStatus!=='verified')throw new Error(`${id}: invalid Research Evidence ${sourceEvidenceId}`);return{value,label:ev.name,allowedSettings:ev.allowedSettings,excludedSettings:ev.deniedSettings??[],sourceEvidenceIds:[sourceEvidenceId]};})}));
selection.machineDataVersion='0.1.1';
selection.evidenceUi={groups};
fs.writeFileSync(sp,JSON.stringify(selection,null,2)+'\n');
observation.observations=(observation.observations??[]).filter(x=>!['OBS_SETTING_EVIDENCE',...defs.map(d=>d.obsId)].includes(x.observationId));
for(const d of defs){const g=groups.find(x=>x.groupId===d.groupId);observation.observations.push({observationId:d.obsId,sourceType:'END_EVENT',observationMode:'VISUAL_EVENT',status:'FOUND',label:d.label,categories:g.options.map(x=>x.label),timing:[`${d.label}を実際に確認した時`],excludedConditions:['未確認を非発生とみなさない'],sourceRefs:[],notes:'Evidence UI v2 Phase 2。設定下限ではなく自然観測を記録する。'});}
fs.writeFileSync(op,JSON.stringify(observation,null,2)+'\n');
const sec=ui.sections?.['設定確定・否定情報'];if(!sec)throw new Error(`${id}: evidence section missing`);
sec.inputIds=[];sec.evidenceIds=defs.map(d=>d.contractId);sec.description=sec.description??'';sec.collapsible=sec.collapsible??false;sec.defaultExpanded=sec.defaultExpanded??true;
delete ui.inputContracts?.INP_EVI_SETTING_FLOOR;
ui.evidenceContracts={};for(const d of defs)ui.evidenceContracts[d.contractId]={label:d.label,selectionMode:'single',sourceEvidenceGroupId:d.groupId,inheritOptions:true};
ui.auditNotes=['Evidence UI v2 Phase 2正式移行。旧設定下限をサミートロフィーとAT終了画面へ分離した。','Research EvidenceのallowedSettings / deniedSettingsを唯一の設定制約ソースとし、Feature再選定は行っていない。'];
fs.writeFileSync(up,JSON.stringify(ui,null,2)+'\n');
console.log(`${id}: Evidence UI v2 batch9h canonical migration complete`);
