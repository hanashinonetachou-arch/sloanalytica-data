#!/usr/bin/env node
import fs from 'node:fs';

const id='L_GOD_EATER_RESURRECTION';
const base=`research/${id}`;
const sp=`${base}/selection-data.json`;
const op=`${base}/machine-observation-data.json`;
const up=`${base}/ui-design-data.json`;
const selection=JSON.parse(fs.readFileSync(sp,'utf8'));
const observation=JSON.parse(fs.readFileSync(op,'utf8'));
const ui=JSON.parse(fs.readFileSync(up,'utf8'));

selection.machineDataVersion='0.1.2';
selection.evidenceUi={groups:[
  {
    groupId:'ST_END_SCREEN',
    label:'ST終了画面',
    selectionMode:'single',
    normalizationMode:'ALLOWED_SETTINGS',
    options:[
      {value:'ST_END_YUU',label:'ユウ 設定2・3・4否定',allowedSettings:['SET_1','SET_5','SET_6'],excludedSettings:['SET_2','SET_3','SET_4'],sourceEvidenceIds:['EV_ST_END_NOT234']},
      {value:'ST_END_RINDOU',label:'リンドウ 設定3以上',allowedSettings:['SET_3','SET_4','SET_5','SET_6'],excludedSettings:['SET_1','SET_2'],sourceEvidenceIds:['EV_ST_END_3PLUS']},
      {value:'ST_END_SHIO',label:'シオ 設定4以上',allowedSettings:['SET_4','SET_5','SET_6'],excludedSettings:['SET_1','SET_2','SET_3'],sourceEvidenceIds:['EV_ST_END_4PLUS']},
      {value:'ST_END_ALL',label:'全員集合 設定5以上',allowedSettings:['SET_5','SET_6'],excludedSettings:['SET_1','SET_2','SET_3','SET_4'],sourceEvidenceIds:['EV_ST_END_5PLUS']},
      {value:'ST_END_DEFORMED',label:'デフォルメキャラ 設定6',allowedSettings:['SET_6'],excludedSettings:['SET_1','SET_2','SET_3','SET_4','SET_5'],sourceEvidenceIds:['EV_ST_END_6']}
    ]
  },
  {
    groupId:'PAYOUT_DISPLAY',
    label:'獲得枚数表示',
    selectionMode:'single',
    normalizationMode:'ALLOWED_SETTINGS',
    options:[
      {value:'PAYOUT_456',label:'456OVER 設定4以上',allowedSettings:['SET_4','SET_5','SET_6'],excludedSettings:['SET_1','SET_2','SET_3'],sourceEvidenceIds:['EV_PAYOUT_456']},
      {value:'PAYOUT_555',label:'555OVER 設定5以上',allowedSettings:['SET_5','SET_6'],excludedSettings:['SET_1','SET_2','SET_3','SET_4'],sourceEvidenceIds:['EV_PAYOUT_555']},
      {value:'PAYOUT_666',label:'666OVER 設定6',allowedSettings:['SET_6'],excludedSettings:['SET_1','SET_2','SET_3','SET_4','SET_5'],sourceEvidenceIds:['EV_PAYOUT_666']}
    ]
  }
]};
selection.evidenceReview={policyVersion:1,exclusions:[]};
fs.writeFileSync(sp,JSON.stringify(selection,null,2)+'\n');

const addObs=[
  {observationId:'OBS_EVI_ST_END_SCREEN',sourceType:'END_EVENT',observationMode:'VISUAL_EVENT',status:'FOUND',label:'ST終了画面',categories:['ユウ 設定2・3・4否定','リンドウ 設定3以上','シオ 設定4以上','全員集合 設定5以上','デフォルメキャラ 設定6'],timing:['ST終了画面を実際に確認した時'],excludedConditions:['未確認を非発生とみなさない'],sourceRefs:[],notes:'Evidence UI v2 REVIEW解消。floor/denialを分離せず同じ自然観測面として記録する。'},
  {observationId:'OBS_EVI_PAYOUT_DISPLAY',sourceType:'END_EVENT',observationMode:'VISUAL_EVENT',status:'FOUND',label:'獲得枚数表示',categories:['456OVER 設定4以上','555OVER 設定5以上','666OVER 設定6'],timing:['獲得枚数表示を実際に確認した時'],excludedConditions:['未確認を非発生とみなさない'],sourceRefs:[],notes:'Evidence UI v2 REVIEW解消。ST終了画面とは別の自然観測面として記録する。'}
];
const ids=new Set((observation.observations??[]).map(x=>x.observationId));
for(const row of addObs) if(!ids.has(row.observationId)) observation.observations.push(row);
fs.writeFileSync(op,JSON.stringify(observation,null,2)+'\n');

ui.sections['設定確定・否定情報']={...(ui.sections['設定確定・否定情報']??{}),inputIds:[],evidenceIds:['EVI_UI_ST_END_SCREEN','EVI_UI_PAYOUT_DISPLAY']};
delete ui.inputContracts.INP_EVI_SETTING_FLOOR;
delete ui.inputContracts.INP_EVI_DENIED_SETTINGS;
ui.evidenceContracts={
  EVI_UI_ST_END_SCREEN:{label:'ST終了画面',selectionMode:'single',sourceEvidenceGroupId:'ST_END_SCREEN',inheritOptions:true},
  EVI_UI_PAYOUT_DISPLAY:{label:'獲得枚数表示',selectionMode:'single',sourceEvidenceGroupId:'PAYOUT_DISPLAY',inheritOptions:true}
};
ui.auditNotes=[...(ui.auditNotes??[]),
  'Evidence UI v2 REVIEW解消: ST終了画面の設定下限・否定を同一自然観測グループへ統合した。',
  '獲得枚数表示はST終了画面と分離し、Research EvidenceのallowedSettings / deniedSettingsを設定制約ソースとして保持する。'
];
fs.writeFileSync(up,JSON.stringify(ui,null,2)+'\n');
console.log(`${id}: natural observation semantics remediation complete`);
