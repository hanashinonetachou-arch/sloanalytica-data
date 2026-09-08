#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { validateUiDesignData } from './validate-ui-design-data.mjs';

const ROOT=process.cwd();
const BATCH='20260908-manifest-v7-first10';
const IDS=['L_ANIMAL_SLOT_DOCCHI_ZT','L_BIG_DREAM_GOLDEN_PUSHER_KR','L_BIOHAZARD_RE3_ZD','L_TAKT_OP_DESTINY_M1','L_SUPER_RIO_ACE2_ND02H','L_BIRDIE_WING_BC','L_SAO2_PA1','L_SENGOKU_OTOME5_L8','L_DARK_HAIBI_SB','L_LOTIS_TN'];
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const uniq=a=>[...new Set((a??[]).filter(Boolean))];
const internalText=/Gate|Feature|Evidence|Selection|Research|schema|enum|希少事象だが試行数|推測尤度|公開値不足/i;

function evidenceBucket(label=''){
 if(/終了画面/.test(label)) return '終了画面・終了時示唆';
 if(/トロフィ|スタンプ|OVER|枚OVER|獲得枚数|表示/.test(label)) return '獲得枚数・トロフィー';
 if(/ボイス|音声|PUSH/.test(label)) return 'ボイス・PUSH示唆';
 if(/シナリオ|キャラ紹介|紹介/.test(label)) return 'キャラ紹介・シナリオ';
 if(/カード|フィギュア|パネル|ランプ/.test(label)) return 'カード・ランプ示唆';
 return '設定示唆・確定演出';
}
function sectionTitle(denom,labels){
 const d=String(denom??'');
 if(/通常ゲーム/.test(d)) return '通常時';
 if(labels.length===1) return labels[0];
 return d.replace(/回数$/,'').replace(/成立回数$/,'成立時').replace(/ゲーム数$/,'').trim()||'実戦中の設定推測要素';
}
function inputContract(input){
 const type=String(input.type??'').toLowerCase();
 const counter=type==='counter';
 const select=type==='select';
 return {
  name:input.name,
  mode:counter?'COUNTER':select?'SELECT':'NUMBER',
  gridSpan:counter?6:12,
  directInput:!counter,
  ...(counter?{compact:true,step:1}:{}),
  emptyMeansUnobserved:true,
  observedZeroAllowed:true,
  quickAdd:counter?[1]:[50]
 };
}
function cleanConditions(values){
 return uniq(values).filter(x=>!internalText.test(String(x)));
}
function executableInputIds(feat){
 const ids=[];
 for(const key of ['denominatorInputId','numeratorInputId','conditionedOnInputId']) if(feat[key]) ids.push(feat[key]);
 for(const key of ['denominatorInputIds','numeratorInputIds','categoryInputIds']) ids.push(...(feat[key]??[]));
 return uniq(ids);
}
function build(id){
 const dir=path.join(ROOT,'research',id);
 const sel=read(path.join(dir,'selection-data.json'));
 const obs=read(path.join(dir,'machine-observation-data.json'));
 if(obs.schemaVersion!=='machine-observation-data-v2') throw new Error(`${id}: Observation v2 required`);
 const inputById=new Map((sel.inputs??[]).map(x=>[x.id,x]));
 const mapByFeat=new Map((obs.featureMappings??[]).map(x=>[x.featureId,x]));
 const sections={}; const sectionOrder=[]; const inputContracts={}; const evidenceContracts={};
 const grouped=new Map();
 for(const feat of sel.features??[]){
  if(!/^INCLUDE_/.test(feat.adoptionCategory??'')) continue;
  const map=mapByFeat.get(feat.featureId);
  if(!map||map.mappingType!=='EXACT') throw new Error(`${id}/${feat.featureId}: adopted Feature lacks exact Observation mapping`);
  const den=feat.denominatorInputId;
  const key=den||`NO_DEN_${feat.featureId}`;
  if(!grouped.has(key)) grouped.set(key,[]);
  grouped.get(key).push({feat,map});
 }
 for(const [denId,rows] of grouped){
  const labels=rows.map(r=>obs.observations?.find(o=>o.observationId===r.map.primaryObservationId)?.label).filter(Boolean);
  let title=sectionTitle(rows[0]?.map?.denominatorDefinition,labels);
  let base=title,n=2; while(sections[title]) title=`${base} ${n++}`;
  const ids=[];
  if(!denId.startsWith('NO_DEN_')) ids.push(denId);
  for(const {feat} of rows) for(const iid of executableInputIds(feat)) if(!ids.includes(iid)) ids.push(iid);
  const included=cleanConditions(rows.flatMap(r=>r.map.includedConditions??[]));
  const excluded=cleanConditions(rows.flatMap(r=>r.map.excludedConditions??[]));
  const denomName=!denId.startsWith('NO_DEN_')?(inputById.get(denId)?.name??rows[0].map.denominatorDefinition):null;
  const parts=[];
  if(denomName) parts.push(`「${denomName}」を分母として、同じ観測区間で各項目を数えます。`);
  if(included.length&&!(included.length===1&&included[0]===denomName)) parts.push(`数える範囲：${included.join('、')}。`);
  if(excluded.length) parts.push(`数えない範囲：${excluded.join('、')}。`);
  parts.push('実戦を開始した時点から自分で確認できた区間だけを入力してください。');
  sections[title]={inputIds:ids,description:parts.join(''),collapsible:false,defaultExpanded:true,observationRole:'DIRECT_PLAY',suppressInputDescriptions:true};
  sectionOrder.push(title);
  for(const iid of ids){const inp=inputById.get(iid);if(!inp) throw new Error(`${id}: unknown Selection input ${iid}`); inputContracts[iid]=inputContract(inp);}
 }
 const eGroups=sel.evidenceUi?.groups??[];
 const buckets=new Map();
 for(const g of eGroups){
  const bucket=evidenceBucket(g.label);
  if(!buckets.has(bucket)) buckets.set(bucket,[]);
  const cid=`EVC_${g.groupId.replace(/^EVI_/,'')}`;
  buckets.get(bucket).push(cid);
  evidenceContracts[cid]={label:g.label,selectionMode:g.selectionMode??'multi',sourceEvidenceGroupId:g.groupId,inheritOptions:true};
 }
 for(const [title0,evidenceIds] of buckets){
  let title=title0,base=title,n=2;while(sections[title]) title=`${base} ${n++}`;
  sections[title]={inputIds:[],evidenceIds,description:'実戦中に確認できた設定示唆・設定確定演出だけを選択してください。見逃したものや未確認のものは入力しません。',collapsible:true,defaultExpanded:false,observationRole:'DIRECT_PLAY'};
  sectionOrder.push(title);
 }
 const design={schemaVersion:'ui-design-data-v1',machineId:id,status:'PASS',generatedFrom:{selection:`research/${id}/selection-data.json`,observation:`research/${id}/machine-observation-data.json`,manifest:'SloAnalytica_MachineData_UX_Construction_Manifest_v7_0'},sectionOrder,sections,inputContracts,evidenceContracts,unresolved:[],auditNotes:['正式SelectionとObservationから生成し、UI構築段階では推測要素の採否を変更していない。','同一の観測母集団は共有分母を1回だけ入力し、条件の異なる分母は別Sectionに分離する。','共通の観測条件・除外条件はSection説明へ集約し、各入力欄で同じ説明を繰り返さない。','設定示唆・確定演出は通常の数値入力より後段に配置し、確率推測とは独立して扱う。']};
 const errors=validateUiDesignData(design,{expectedMachineId:id});
 if(errors.length) throw new Error(`${id}: ${errors.join('; ')}`);
 fs.writeFileSync(path.join(dir,'ui-design-data.json'),JSON.stringify(design,null,2)+'\n');
 return {machineId:id,sections:sectionOrder.length,inputContracts:Object.keys(inputContracts).length,evidenceContracts:Object.keys(evidenceContracts).length,adoptedFeatures:(sel.features??[]).filter(f=>/^INCLUDE_/.test(f.adoptionCategory??'')).length};
}
const rows=IDS.map(build);
const report={schemaVersion:'gate-d-ui-materialization-report-v1',batchId:BATCH,status:'PASS',machines:rows,summary:{machines:rows.length,sections:rows.reduce((a,x)=>a+x.sections,0),inputContracts:rows.reduce((a,x)=>a+x.inputContracts,0),evidenceContracts:rows.reduce((a,x)=>a+x.evidenceContracts,0),adoptedFeatures:rows.reduce((a,x)=>a+x.adoptedFeatures,0)},errors:[]};
fs.writeFileSync(path.join(ROOT,'batches',BATCH,'gate-d-ui-materialization-report.json'),JSON.stringify(report,null,2)+'\n');
console.log('GATE D UI MATERIALIZE PASS',JSON.stringify(report.summary));
