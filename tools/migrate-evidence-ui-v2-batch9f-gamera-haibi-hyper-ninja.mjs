#!/usr/bin/env node
import fs from 'node:fs';

const simpleConfigs=[
  {
    id:'S_HAIBI_RETURN_PA30',version:'0.1.1',legacyObsIds:['OBS_HAIBI_EVIDENCE','OBS_SETTING_EVIDENCE'],
    groups:[
      {groupId:'FEATHER_LAMP',label:'フェザーランプ',contractId:'EVI_UI_FEATHER_LAMP',obsId:'OBS_EVI_FEATHER_LAMP',sourceType:'END_EVENT',mode:'VISUAL_EVENT',timing:'フェザーランプ確認時',specs:[['RE_4PLUS','FEATHER_PURPLE'],['RE_6','FEATHER_RAINBOW']]}
    ]
  },
  {
    id:'S_HYPER_RUSH_SLC8',version:'0.1.2',legacyObsIds:['OBS_SETTING_EVIDENCE'],
    groups:[
      {groupId:'BONUS_END_LAMP',label:'ボーナス終了時ランプ',contractId:'EVI_UI_BONUS_END_LAMP',obsId:'OBS_EVI_BONUS_END_LAMP',sourceType:'END_EVENT',mode:'VISUAL_EVENT',timing:'ボーナス終了時ランプ確認時',specs:[['RE_4PLUS','LAMP_RAINBOW_PERFECT']]},
      {groupId:'TROPHY',label:'トロフィー',contractId:'EVI_UI_TROPHY',obsId:'OBS_EVI_TROPHY',sourceType:'END_EVENT',mode:'VISUAL_EVENT',timing:'トロフィー確認時',specs:[['RE_6','TROPHY_RAINBOW']]}
    ]
  },
  {
    id:'S_NINJA_JAJAMARU',version:'0.1.2',legacyObsIds:['OBS_SETTING_EVIDENCE'],
    groups:[
      {groupId:'REG_END_SCREEN',label:'REG終了画面',contractId:'EVI_UI_REG_END_SCREEN',obsId:'OBS_EVI_REG_END_SCREEN',sourceType:'END_EVENT',mode:'VISUAL_EVENT',timing:'REG終了画面確認時',specs:[['EV_REG_PURPLE_5PLUS','REG_PURPLE_5PLUS']]},
      {groupId:'BIG_CHARACTER_CONDITION',label:'BIG中キャラ条件',contractId:'EVI_UI_BIG_CHARACTER_CONDITION',obsId:'OBS_EVI_BIG_CHARACTER_CONDITION',sourceType:'DIRECT_PLAY',mode:'VISUAL_EVENT',timing:'同一BIG内のキャラ紹介確認時',specs:[['EV_BIG_THREE_CHAR_6','BIG_THREE_CHAR_6']]}
    ]
  }
];

function makeGroup(cfg,g,research){
  const em=new Map((research.evidenceCandidates??[]).map(x=>[x.researchEvidenceId,x]));
  return {
    groupId:g.groupId,label:g.label,selectionMode:'single',normalizationMode:'ALLOWED_SETTINGS',
    options:g.specs.map(([sourceEvidenceId,value])=>{
      const ev=em.get(sourceEvidenceId);
      if(!ev) throw new Error(`${cfg.id}: missing Research Evidence ${sourceEvidenceId}`);
      if(ev.factStatus && ev.factStatus!=='verified') throw new Error(`${cfg.id}: unverified Research Evidence ${sourceEvidenceId}`);
      if(!Array.isArray(ev.allowedSettings)||!Array.isArray(ev.deniedSettings)) throw new Error(`${cfg.id}: incomplete Research Evidence settings ${sourceEvidenceId}`);
      return {value,label:ev.name,allowedSettings:ev.allowedSettings,excludedSettings:ev.deniedSettings,sourceEvidenceIds:[sourceEvidenceId]};
    })
  };
}

function applyCanonical(cfg,groups,observation,ui){
  const allNewObs=new Set(cfg.groups.map(g=>g.obsId));
  observation.observations=(observation.observations??[]).filter(o=>!(cfg.legacyObsIds??[]).includes(o.observationId)&&!allNewObs.has(o.observationId));
  for(const g of cfg.groups){
    const group=groups.find(x=>x.groupId===g.groupId);
    observation.observations.push({
      observationId:g.obsId,sourceType:g.sourceType,observationMode:g.mode,status:'FOUND',label:g.label,
      categories:group.options.map(x=>x.label),timing:[g.timing],excludedConditions:['未確認を非発生とみなさない'],sourceRefs:[],
      notes:'Evidence UI v2 Phase 2。設定下限ではなく、実際に確認した自然観測を記録する。'
    });
  }
  const sec=ui.sections?.['設定確定・否定情報'];
  if(!sec) throw new Error(`${cfg.id}: evidence section missing`);
  sec.inputIds=[];
  sec.evidenceIds=cfg.groups.map(g=>g.contractId);
  sec.description=sec.description??'';
  sec.collapsible=sec.collapsible??false;
  sec.defaultExpanded=sec.defaultExpanded??true;
  delete ui.inputContracts?.INP_EVI_SETTING_FLOOR;
  ui.evidenceContracts={};
  for(const g of cfg.groups) ui.evidenceContracts[g.contractId]={label:g.label,selectionMode:'single',sourceEvidenceGroupId:g.groupId,inheritOptions:true};
  ui.auditNotes=[
    'Evidence UI v2 Phase 2正式移行。設定結果ではなく、実際に観測したランプ・トロフィー・終了画面・キャラ条件等を入力する。',
    'Research EvidenceのallowedSettings / deniedSettingsを唯一の設定制約ソースとし、既存Featureの再選定は行っていない。',
    'Legacyの設定下限圧縮をResearchで分離済みの自然観測面へ移行した。'
  ];
}

for(const cfg of simpleConfigs){
  const base=`research/${cfg.id}`;
  const sp=`${base}/selection-data.json`,rp=`${base}/research-data.json`,op=`${base}/machine-observation-data.json`,up=`${base}/ui-design-data.json`;
  const selection=JSON.parse(fs.readFileSync(sp,'utf8'));
  const research=JSON.parse(fs.readFileSync(rp,'utf8'));
  const observation=JSON.parse(fs.readFileSync(op,'utf8'));
  const ui=JSON.parse(fs.readFileSync(up,'utf8'));
  const groups=cfg.groups.map(g=>makeGroup(cfg,g,research));
  selection.machineDataVersion=cfg.version;
  selection.evidenceUi={groups};
  applyCanonical(cfg,groups,observation,ui);
  fs.writeFileSync(sp,JSON.stringify(selection,null,2)+'\n');
  fs.writeFileSync(op,JSON.stringify(observation,null,2)+'\n');
  fs.writeFileSync(up,JSON.stringify(ui,null,2)+'\n');
  console.log(`${cfg.id}: Evidence UI v2 batch9f canonical migration complete`);
}

// Gamera2: preserve the already-natural SAMMY_TROPHY group exactly as Selection defines it.
{
  const cfg={
    id:'S_GAMERA2',version:'0.1.3',legacyObsIds:['OBS_SETTING_EVIDENCE'],
    groups:[
      {groupId:'PAYOUT_DISPLAY',label:'獲得枚数表示',contractId:'EVI_UI_PAYOUT_DISPLAY',obsId:'OBS_EVI_PAYOUT_DISPLAY',sourceType:'DIRECT_PLAY',mode:'VISUAL_EVENT',timing:'456枚/666枚突破表示確認時',specs:[['EV_456','PAYOUT_456'],['EV_666','PAYOUT_666']]},
      {groupId:'REG_END_SCREEN',label:'REG終了画面',contractId:'EVI_UI_REG_END_SCREEN',obsId:'OBS_EVI_REG_END_SCREEN',sourceType:'END_EVENT',mode:'VISUAL_EVENT',timing:'REG終了画面確認時',specs:[['EV_REG_MONSTERS','REG_MONSTERS'],['EV_REG_NO1','REG_YOU_ARE_NO1']]},
      {groupId:'SAMMY_TROPHY',label:'サミートロフィー',contractId:'EVI_UI_SAMMY_TROPHY',obsId:'OBS_EVI_SAMMY_TROPHY',sourceType:'END_EVENT',mode:'VISUAL_EVENT',timing:'サミートロフィー確認時',specs:[]}
    ]
  };
  const base=`research/${cfg.id}`;
  const sp=`${base}/selection-data.json`,rp=`${base}/research-data.json`,op=`${base}/machine-observation-data.json`,up=`${base}/ui-design-data.json`;
  const selection=JSON.parse(fs.readFileSync(sp,'utf8'));
  const research=JSON.parse(fs.readFileSync(rp,'utf8'));
  const observation=JSON.parse(fs.readFileSync(op,'utf8'));
  const ui=JSON.parse(fs.readFileSync(up,'utf8'));
  const trophy=(selection.evidenceUi?.groups??[]).find(g=>g.groupId==='SAMMY_TROPHY');
  if(!trophy) throw new Error(`${cfg.id}: existing SAMMY_TROPHY group missing`);
  const natural=cfg.groups.slice(0,2).map(g=>makeGroup(cfg,g,research));
  const groups=[...natural,trophy];
  selection.machineDataVersion=cfg.version;
  selection.evidenceUi={groups};
  // Add natural observations for new groups and for preserved trophy group.
  const obsCfg={...cfg,groups:cfg.groups};
  const allNewObs=new Set(cfg.groups.map(g=>g.obsId));
  observation.observations=(observation.observations??[]).filter(o=>!allNewObs.has(o.observationId));
  for(const g of cfg.groups){
    const group=g.groupId==='SAMMY_TROPHY'?trophy:groups.find(x=>x.groupId===g.groupId);
    observation.observations.push({observationId:g.obsId,sourceType:g.sourceType,observationMode:g.mode,status:'FOUND',label:g.label,categories:(group.options??[]).map(x=>x.label),timing:[g.timing],excludedConditions:['未確認を非発生とみなさない'],sourceRefs:[],notes:'Evidence UI v2 Phase 2自然観測。'});
  }
  const sec=ui.sections?.['設定確定・否定情報'];
  if(!sec) throw new Error(`${cfg.id}: evidence section missing`);
  sec.inputIds=[];
  sec.evidenceIds=cfg.groups.map(g=>g.contractId);
  sec.description=sec.description??''; sec.collapsible=sec.collapsible??false; sec.defaultExpanded=sec.defaultExpanded??true;
  delete ui.inputContracts?.INP_EVI_SETTING_FLOOR;
  delete ui.inputContracts?.INP_EVI_SAMMY_TROPHY;
  ui.evidenceContracts={};
  for(const g of cfg.groups) ui.evidenceContracts[g.contractId]={label:g.label,selectionMode:'single',sourceEvidenceGroupId:g.groupId,inheritOptions:true};
  ui.auditNotes=[
    'Evidence UI v2 Phase 2正式移行。旧SETTING_FLOORのみを獲得枚数表示とREG終了画面へ分離した。',
    '既存SAMMY_TROPHY Selection Groupは内容を変更せず自然観測契約へ接続した。',
    'BIG終了画面およびREG中怪獣紹介の既存Numeric/Evidence共有契約は変更していない。'
  ];
  fs.writeFileSync(sp,JSON.stringify(selection,null,2)+'\n');
  fs.writeFileSync(op,JSON.stringify(observation,null,2)+'\n');
  fs.writeFileSync(up,JSON.stringify(ui,null,2)+'\n');
  console.log(`${cfg.id}: Evidence UI v2 batch9f canonical migration complete`);
}
