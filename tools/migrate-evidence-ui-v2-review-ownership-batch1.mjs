#!/usr/bin/env node
import fs from 'node:fs';

const machines=[
  {
    id:'L_ENEN_NO_SHOUBOUTAI_JG',
    version:'0.1.8',
    owned:[
      ['RE_2PLUS','FEAT_ADORA_JAC_CHAR'],
      ['RE_4PLUS','FEAT_FF_BONUS_END'],
      ['RE_5PLUS','FEAT_FF_BONUS_END'],
      ['RE_6','FEAT_FF_BONUS_END']
    ],
    removeObservationIds:[]
  },
  {
    id:'S_HARD_BOILED_XX',
    version:'0.1.4',
    owned:[['RE_2PLUS','FEAT_BIG_JAC_MISS_VOICE']],
    removeObservationIds:['OBS_HARDBOILED_EVIDENCE']
  }
];

for(const m of machines){
  const base=`research/${m.id}`;
  const sp=`${base}/selection-data.json`;
  const rp=`${base}/research-data.json`;
  const op=`${base}/machine-observation-data.json`;
  const up=`${base}/ui-design-data.json`;
  const selection=JSON.parse(fs.readFileSync(sp,'utf8'));
  const research=JSON.parse(fs.readFileSync(rp,'utf8'));
  const observation=JSON.parse(fs.readFileSync(op,'utf8'));
  const ui=JSON.parse(fs.readFileSync(up,'utf8'));

  const researchEvidence=new Set((research.evidenceCandidates??[]).map(x=>x.researchEvidenceId));
  const featureIds=new Set((selection.features??[]).filter(x=>String(x.adoptionCategory??'').startsWith('INCLUDE')).map(x=>x.featureId));
  for(const [evidenceId,featureId] of m.owned){
    if(!researchEvidence.has(evidenceId)) throw new Error(`${m.id}: missing Research Evidence ${evidenceId}`);
    if(!featureIds.has(featureId)) throw new Error(`${m.id}: ownership target is not an adopted Feature ${featureId}`);
  }

  selection.machineDataVersion=m.version;
  selection.evidenceUi={groups:[]};
  selection.evidenceReview={
    policyVersion:1,
    ownershipPolicy:'FEATURE_OWNS_OVERLAPPING_OBSERVATION',
    exclusions:m.owned.map(([researchEvidenceId,ownerFeatureId])=>({
      researchEvidenceId,
      disposition:'EXCLUDE_FROM_EVIDENCE_UI',
      ownerFeatureId,
      reason:'同一自然観測を採用済み統計Featureが評価しているため、Evidenceとの二重評価を避ける。Research Evidence候補は保持する。'
    }))
  };
  fs.writeFileSync(sp,JSON.stringify(selection,null,2)+'\n');

  if(m.removeObservationIds.length){
    const remove=new Set(m.removeObservationIds);
    observation.observations=(observation.observations??[]).filter(x=>!remove.has(x.observationId));
  }
  fs.writeFileSync(op,JSON.stringify(observation,null,2)+'\n');

  ui.sectionOrder=(ui.sectionOrder??[]).filter(x=>x!=='設定確定・否定情報');
  if(ui.sections) delete ui.sections['設定確定・否定情報'];
  if(ui.inputContracts) delete ui.inputContracts.INP_EVI_SETTING_FLOOR;
  ui.evidenceContracts={};
  ui.auditNotes=[...(ui.auditNotes??[]),
    'Evidence UI v2 REVIEW解消: 同一自然観測を採用済み統計FeatureとEvidenceで二重評価しないため、Featureを唯一の計算所有者とした。',
    'Research Evidence候補は削除せず保持し、Selection evidenceReview にFeature ownershipを明記した。'
  ];
  fs.writeFileSync(up,JSON.stringify(ui,null,2)+'\n');
  console.log(`${m.id}: Feature/Evidence ownership remediation complete`);
}
