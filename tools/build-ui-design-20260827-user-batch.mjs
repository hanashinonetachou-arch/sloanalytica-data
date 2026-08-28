#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const IDS=[
'S_MOMOKYUN_SWORD_DX','S_SHIN_ORE_NO_SORA_ST','S_MORE_CHIBARIYO_NB_30','S_OKIDOKI_GOLD_GS','L_SALARYMAN_KINTARO_ET','L_NYANKO_DAISENSO_CHOSHINSOKU_KB','L_NANATSU_NO_MAKEN_PU','L_DISCUP_ULTRA_REMIX_XR','L_STAR_HANAHANA_MX','L_SHIN_EVANGELION'
];
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>{fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n','utf8');};

const SECTION_RULES={
 S_MOMOKYUN_SWORD_DX:[['通常時',/通常ゲーム|AT初当り/],['AT',/ATゲーム|AT中|桃剣ATTACK/]],
 S_SHIN_ORE_NO_SORA_ST:[['通常時',/通常ゲーム|AT初当り/]],
 S_MORE_CHIBARIYO_NB_30:[['通常時・ボーナス',/通常ゲーム|ボーナス初当り/]],
 S_OKIDOKI_GOLD_GS:[['通常時・ボーナス',/通常ゲーム|ボーナス初当り/]],
 L_SALARYMAN_KINTARO_ET:[['通常時',/通常ゲーム|AT初当り|金太郎チャンス/]],
 L_NYANKO_DAISENSO_CHOSHINSOKU_KB:[['通常時',/通常ゲーム|AT初当り/]],
 L_NANATSU_NO_MAKEN_PU:[['通常時',/通常ゲーム|ST初当り/]],
 L_DISCUP_ULTRA_REMIX_XR:[['通常時',/通常ゲーム/],['小役',/3枚役/],['ボーナス',/BIG|REG/],['REG中設定示唆',/奇数設定示唆|偶数設定示唆|設定2以上|設定5以上|設定6/]],
 L_STAR_HANAHANA_MX:[['通常時',/通常ゲーム/],['ボーナス',/BIG|REG/]],
 L_SHIN_EVANGELION:[['通常時',/通常ゲーム|初当り|150G/],['レイチャンス',/レイ|ナビ/],['終了・示唆',/終了画面|成功画面/]]
};

function inputMode(inp){
 if(inp.type==='integer') return 'NUMBER';
 if(inp.type==='counter') return 'COUNTER';
 return 'NUMBER';
}
function buildSections(machineId,selection){
  // Shared Feature + Evidence surfaces must stay together by Selection category.
  // Shin Eva is the first canonical application of this contract.
  if(machineId==='L_SHIN_EVANGELION'){
    const categoryOrder=['NUMERIC','REI_NAV','REI_SUCCESS','BONUS_END'];
    const sections={}; const order=[];
    for(const category of categoryOrder){
      const ids=(selection.inputs??[])
        .filter(inp=>inp.category===category)
        .sort((a,b)=>(a.displayOrder??0)-(b.displayOrder??0))
        .map(inp=>inp.id);
      if(!ids.length) continue;
      const label=selection.uiCategoryLabels?.[category] ?? category;
      order.push(label);
      sections[label]={inputIds:ids,observationRole:'DIRECT_PLAY'};
    }
    const evidenceGroups=selection.evidenceUi?.groups??[];
    if(evidenceGroups.length){
      const label=selection.uiCategoryLabels?.EVIDENCE ?? '設定確定・示唆';
      order.push(label);
      sections[label]={inputIds:[],evidenceIds:evidenceGroups.map((g,i)=>`EVIDENCE_${String(i+1).padStart(2,'0')}`),observationRole:'END_EVENT'};
    }
    return {order,sections};
  }

 const rules=SECTION_RULES[machineId]??[['設定推測要素',/.*/]];
 const remaining=new Map((selection.inputs??[]).map(i=>[i.id,i]));
 const sections={}; const order=[];
 for(const [label,re] of rules){
   const ids=[];
   for(const [id,inp] of remaining){ if(re.test(inp.name??'')){ids.push(id);remaining.delete(id);} }
   if(ids.length){order.push(label);sections[label]={inputIds:ids,observationRole:'DIRECT_PLAY'};}
 }
 if(remaining.size){
   const label='その他の数値入力'; order.push(label); sections[label]={inputIds:[...remaining.keys()],observationRole:'DIRECT_PLAY'};
 }
 const evidenceGroups=selection.evidenceUi?.groups??[];
 if(evidenceGroups.length){
   const label='設定確定・示唆';
   order.push(label);
   sections[label]={inputIds:[],evidenceIds:evidenceGroups.map((g,i)=>`EVIDENCE_${String(i+1).padStart(2,'0')}`),observationRole:'END_EVENT'};
 }
 return {order,sections};
}

for(const machineId of IDS){
 const dir=path.join(ROOT,'research',machineId);
 const selection=read(path.join(dir,'selection-data.json'));
 const observation=read(path.join(dir,'machine-observation-data.json'));
 const {order,sections}=buildSections(machineId,selection);
 const inputContracts={};
 for(const inp of selection.inputs??[]){
   const mode=inputMode(inp);
   inputContracts[inp.id]={
     name:inp.name,
     mode,
     gridSpan:inp.uiGridSpan ?? (mode==='COUNTER'?6:12),
     directInput:inp.uiDirectInput ?? (mode==='NUMBER'),
     ...(mode==='COUNTER'?{compact:inp.uiCompactCounter ?? true}:{}),
     observationSemantics:'blank=unobserved; zero=observed-zero'
   };
 }
 const evidenceContracts={};
 for(const [i,g] of (selection.evidenceUi?.groups??[]).entries()){
   evidenceContracts[`EVIDENCE_${String(i+1).padStart(2,'0')}`]={
     label:g.label,
     selectionMode:g.selectionMode??'multi',
     sourceEvidenceGroupId:g.groupId,
     inheritOptions:true
   };
 }
 const unresolved=(observation.fieldVerificationItems??[])
   .filter(v=>v.status==='WAITING_FOR_MACHINE')
   .map(v=>({verificationId:v.verificationId,priority:v.priority,sourceType:v.sourceType,question:v.question}));
 const data={
   schemaVersion:'ui-design-data-v1',
   machineId,
   status:unresolved.length?'PASS_WITH_UNRESOLVED':'PASS',
   generatedFrom:{selection:`research/${machineId}/selection-data.json`,observation:`research/${machineId}/machine-observation-data.json`},
   sectionOrder:order,
   sections,
   inputContracts,
   ...(Object.keys(evidenceContracts).length?{evidenceContracts}:{}),
   unresolved,
   auditNotes:[
     'Section order follows actual play flow rather than internal Feature classification.',
     'Blank means unobserved and explicit 0 means observed zero; UI must preserve this distinction.',
     'Shared Feature + Evidence observations are entered once in their natural event section and reused by both inference layers.',
     'Only Selection-adopted numeric inputs and separate Evidence groups are exposed. Observation unresolved items remain field-verification items and are not invented into UI.'
   ]
 };
 write(path.join(dir,'ui-design-data.json'),data);
 console.log(`built UI design: ${machineId} / ${data.status}`);
}
