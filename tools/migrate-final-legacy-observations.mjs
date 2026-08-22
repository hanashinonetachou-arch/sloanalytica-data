#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const researchRoot = path.join(root, 'research');
const TODAY = '2026-08-22';
const CHECKED = new Set(['checked','available','confirmed']);
const NOT_AVAILABLE = new Set(['not_available','not-available','unavailable','none','unavailable_or_ended']);
const UNRESOLVED = new Set(['unresolved','unknown','pending','not_checked','not-checked','not_confirmed','partially_confirmed','partial','partially_checked']);

function normalize(block) {
  if (!block || typeof block !== 'object') return 'UNRESOLVED';
  const raw = String(block.status ?? '').trim().toLowerCase();
  if (CHECKED.has(raw)) return 'CHECKED';
  if (NOT_AVAILABLE.has(raw)) return 'NOT_AVAILABLE';
  if (UNRESOLVED.has(raw) || !raw) return 'UNRESOLVED';
  return 'UNRESOLVED';
}
function items(block) {
  if (!block || typeof block !== 'object') return [];
  for (const key of ['availableData','retrievableItems','availableItems','displayItems']) if (Array.isArray(block[key])) return [...block[key]];
  return [];
}
function refs(block) { return Array.isArray(block?.sourceRefs) ? [...block.sourceRefs] : []; }
function notes(block, kind) {
  const existing = typeof block?.notes === 'string' ? block.notes.trim() : '';
  if (existing) return existing;
  return kind === 'menu'
    ? '旧ResearchDataからMachine Observation Researchへ構造移行。公開情報で確定していない事項はUNRESOLVEDとして維持する。'
    : '旧ResearchDataからMachine Observation Researchへ構造移行。実機連動機能の具体的取得項目は公開根拠のある範囲のみ保持する。';
}
function predecessorSignal(data) {
  const direct = ['predecessorDataResearch','seatedStartDataResearch','predecessorResearch','seatStartResearch'];
  if (direct.some((k) => data?.[k] && typeof data[k] === 'object')) return true;
  return /(着席|前任者|差分|predecessor|seat(?:ed)?\s*start)/i.test(JSON.stringify({
    machineMenuResearch:data?.machineMenuResearch ?? null,
    linkedMachineServiceResearch:data?.linkedMachineServiceResearch ?? null,
    features:data?.features ?? null,
    researchCompleteness:data?.researchCompleteness ?? null,
  }));
}

const migrated=[];
for (const entry of fs.readdirSync(researchRoot,{withFileTypes:true})) {
  if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
  const machineId=entry.name;
  const dir=path.join(researchRoot,machineId);
  const researchPath=path.join(dir,'research-data.json');
  const observationPath=path.join(dir,'machine-observation-data.json');
  if (!fs.existsSync(researchPath) || fs.existsSync(observationPath)) continue;
  let data; try { data=JSON.parse(fs.readFileSync(researchPath,'utf8')); } catch { continue; }
  const menu=data.machineMenuResearch;
  const service=data.linkedMachineServiceResearch;
  const menuRefs=refs(menu), serviceRefs=refs(service);
  const used=new Set([...menuRefs,...serviceRefs]);
  const sources=(Array.isArray(data.sources)?data.sources:[]).filter((s)=>used.has(s?.sourceId));
  const signal=predecessorSignal(data);
  const observation={
    schemaVersion:'machine-observation-data-v1',
    machineId,
    displayName:data?.machine?.displayName ?? machineId,
    researchedAt:TODAY,
    sources,
    machineMenu:{status:normalize(menu),availableData:items(menu),sourceRefs:menuRefs.filter((id)=>sources.some((s)=>s?.sourceId===id)),notes:notes(menu,'menu')},
    linkedService:{status:normalize(service),availableData:items(service),sourceRefs:serviceRefs.filter((id)=>sources.some((s)=>s?.sourceId===id)),notes:notes(service,'service')},
    predecessorData:{
      status:'UNRESOLVED',availableData:[],sourceRefs:[],
      notes:signal
        ? '旧ResearchDataには着席時／前任者データへの言及があるが、具体的な取得項目・取得元・Feature分子/分母との同値性はこの構造移行では確定しない。Machine Observation Researchで個別再調査する。'
        : '旧ResearchDataでは着席時／前任者データの取得可否が独立評価されていない。不存在とは判断せず、Machine Observation Researchで再調査する。',
      usableForInference:false,usableForSelfSessionDelta:false
    }
  };
  fs.writeFileSync(observationPath,`${JSON.stringify(observation,null,2)}\n`);
  migrated.push(machineId);
}
console.log(`Final legacy observations migrated: ${migrated.length}`);
for (const id of migrated) console.log(`- ${id}`);
if (migrated.length !== 37) { console.error(`Expected 37 migrations, got ${migrated.length}`); process.exit(1); }
