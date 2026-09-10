#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { validateUiDesignData } from './validate-ui-design-data.mjs';

const ROOT=process.cwd();
const BATCH='20260910-next10-v7';
const IDS=['L_YABACHIBA_ZM','L_NANGOKU_SPECIAL_M1','L_SENGOKU_COLLECTION6_KS','L_KARAKURI_CIRCUS2_JG','L_ULTRAMAN_FINAL_BATTLE_ME','L_WORLD_DAI_STAR_PA3','L_YAJIKITA_MAIRU_BG','L_TONDEMO_SKILL_KM','LB_TRIPLE_CROWN_X300','L_TOARU_INDEX2_FA'];
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const uniq=a=>[...new Set((a??[]).filter(Boolean))];
const internalText=/Gate|Feature|Evidence|Selection|Research|schema|enum|推測尤度/i;
const isLargeGameInput=input=>/ゲーム数|G数|プレイ数/.test(String(input?.name??''));

function evidenceBucket(label=''){
 if(/終了画面/.test(label)) return '終了画面・終了時示唆';
 if(/トロフィ|コイン|枚表示|獲得枚数|プレート/.test(label)) return '確定・示唆演出';
 if(/ボイス|音声|PUSH/.test(label)) return 'ボイス・PUSH示唆';
 return '設定示唆・確定演出';
}
function sectionTitle(denomName,labels){
 const d=String(denomName??'');
 if(/通常ゲーム/.test(d)) return '通常時';
 if(/AT.*ゲーム/.test(d)) return 'AT中';
 if(/上位ST/.test(d)) return '上位ST終了時';
 if(labels.length===1) return labels[0];
 return d.replace(/回数$/,'').replace(/ゲーム数$/,'').trim()||'実戦中の設定推測要素';
}
function inputContract(input){
 const select=String(input.type??'').toLowerCase()==='select';
 if(select) return {name:input.name,mode:'SELECT',gridSpan:12,directInput:true,emptyMeansUnobserved:true,observedZeroAllowed:true};
 const large=isLargeGameInput(input);
 return {name:input.name,mode:'NUMBER',gridSpan:12,directInput:true,emptyMeansUnobserved:true,observedZeroAllowed:true,quickAdd:[large?50:1]};
}
function cleanConditions(values){return uniq(values).filter(x=>!internalText.test(String(x)));}
function executableInputIds(feat){
 const ids=[];
 for(const key of ['denominatorInputId','numeratorInputId','conditionedOnInputId']) if(feat[key]) ids.push(feat[key]);
 for(const key of ['denominatorInputIds','numeratorInputIds','categoryInputIds']) ids.push(...(feat[key]??[]));
 return uniq(ids);
}
function build(id){
 const dir=path.join(ROOT,'research',id); const sel=read(path.join(dir,'selection-data.json')); const obs=read(path.join(dir,'machine-observation-data.json'));
 const inputById=new Map((sel.inputs??[]).map(x=>[x.id,x])); const mapByFeat=new Map((obs.featureMappings??[]).map(x=>[x.featureId,x]));
 const observationById=new Map((obs.observations??[]).map(x=>[x.observationId,x]));
 const sections={},sectionOrder=[],inputContracts={},evidenceContracts={}; const grouped=new Map();
 for(const feat of sel.features??[]){
   if(!/^INCLUDE_/.test(feat.adoptionCategory??'')) continue;
   const map=mapByFeat.get(feat.featureId); if(!map||map.mappingType!=='EXACT') throw new Error(`${id}/${feat.featureId}: active feature lacks EXACT observation mapping`);
   const key=feat.denominatorInputId||`NO_DEN_${feat.featureId}`; if(!grouped.has(key)) grouped.set(key,[]); grouped.get(key).push({feat,map});
 }
 for(const [denId,rows] of grouped){
   const labels=rows.map(r=>observationById.get(r.map.primaryObservationId)?.label).filter(Boolean);
   const denInput=!denId.startsWith('NO_DEN_')?inputById.get(denId):null;
   let title=sectionTitle(denInput?.name,labels),base=title,n=2; while(sections[title]) title=`${base} ${n++}`;
   const ids=[]; if(denInput) ids.push(denId); for(const {feat} of rows) for(const iid of executableInputIds(feat)) if(!ids.includes(iid)) ids.push(iid);
   const excluded=cleanConditions(rows.flatMap(r=>observationById.get(r.map.primaryObservationId)?.excludedConditions??[]));
   const parts=[];
   if(denInput) parts.push(`「${denInput.name}」と、同じ実戦区間で確認した回数を入力します。`);
   if(excluded.length) parts.push(`数えないもの：${excluded.join('、')}。`);
   if(id==='L_TOARU_INDEX2_FA'&&rows.some(r=>r.feat.featureId==='FEAT_AT_DIRECT')) parts.push('AT直撃は天井到達・超レア小役によるAT当選を直撃回数に含めません。');
   if(id==='L_WORLD_DAI_STAR_PA3'&&rows.some(r=>r.feat.featureId==='FEAT_UPPER_ST_CLIMAX_OTHER')) parts.push('上位ST終了時は「オペラ座の怪人」を除いた回数だけを対象にします。');
   parts.push('着席後、自分で確認できた区間だけを入力してください。');
   sections[title]={inputIds:ids,description:parts.join(''),collapsible:false,defaultExpanded:true,observationRole:'DIRECT_PLAY',suppressInputDescriptions:true}; sectionOrder.push(title);
   for(const iid of ids){const inp=inputById.get(iid); if(!inp) throw new Error(`${id}: unknown input ${iid}`); inputContracts[iid]=inputContract(inp);}
 }
 const buckets=new Map();
 for(const g of sel.evidenceUi?.groups??[]){const bucket=evidenceBucket(g.label); if(!buckets.has(bucket)) buckets.set(bucket,[]); const cid=`EVC_${g.groupId.replace(/^EVI_/,'')}`; buckets.get(bucket).push(cid); evidenceContracts[cid]={label:g.label,selectionMode:g.selectionMode??'multi',sourceEvidenceGroupId:g.groupId,inheritOptions:true};}
 for(const [title0,evidenceIds] of buckets){let title=title0,base=title,n=2; while(sections[title]) title=`${base} ${n++}`; sections[title]={inputIds:[],evidenceIds,description:'実戦中に実際に確認できた設定示唆・設定確定演出だけを選択してください。見逃しや未確認は入力しません。',collapsible:true,defaultExpanded:false,observationRole:'DIRECT_PLAY'}; sectionOrder.push(title);}
 const design={schemaVersion:'ui-design-data-v1',machineId:id,status:'PASS',generatedFrom:{selection:`research/${id}/selection-data.json`,observation:`research/${id}/machine-observation-data.json`,manifest:'SloAnalytica_MachineData_UX_Construction_Manifest_v7_1'},sectionOrder,sections,inputContracts,evidenceContracts,unresolved:[],auditNotes:['UX v7.1準拠。新規の小回数入力はNUMBER・直接入力・+1とし、COUNTER専用UIには固定しない。','ゲーム数など大きな数値はNUMBER・直接入力・+50を使用する。','入力欄は原則1列幅で、ラベル可読性・タップ領域・オーバーフロー防止を優先する。','共通条件はSection説明へまとめ、入力欄ごとに同じ説明を重複しない。','設定確定・下限演出は数値Featureと分離する。']};
 const errors=validateUiDesignData(design,{expectedMachineId:id}); if(errors.length) throw new Error(`${id}: ${errors.join('; ')}`);
 fs.writeFileSync(path.join(dir,'ui-design-data.json'),JSON.stringify(design,null,2)+'\n');
 return {machineId:id,sections:sectionOrder.length,inputContracts:Object.keys(inputContracts).length,evidenceContracts:Object.keys(evidenceContracts).length,activeFeatures:(sel.features??[]).filter(f=>/^INCLUDE_/.test(f.adoptionCategory??'')).length,smallNumberInputs:Object.values(inputContracts).filter(c=>c.mode==='NUMBER'&&c.quickAdd?.[0]===1).length,largeNumberInputs:Object.values(inputContracts).filter(c=>c.mode==='NUMBER'&&c.quickAdd?.[0]===50).length};
}
const rows=IDS.map(build); const report={schemaVersion:'gate-d-ui-materialization-report-v1',batchId:BATCH,checkedAt:'2026-09-11T01:30:00+09:00',status:'PASS',manifest:'UX_v7.1',machines:rows,summary:{machines:rows.length,sections:rows.reduce((a,x)=>a+x.sections,0),inputContracts:rows.reduce((a,x)=>a+x.inputContracts,0),evidenceContracts:rows.reduce((a,x)=>a+x.evidenceContracts,0),activeFeatures:rows.reduce((a,x)=>a+x.activeFeatures,0),smallNumberInputs:rows.reduce((a,x)=>a+x.smallNumberInputs,0),largeNumberInputs:rows.reduce((a,x)=>a+x.largeNumberInputs,0)},errors:[]};
fs.writeFileSync(path.join(ROOT,'batches',BATCH,'gate-d-ui-materialization-report.json'),JSON.stringify(report,null,2)+'\n'); console.log('GATE D UI MATERIALIZE PASS',JSON.stringify(report.summary));
