import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STATUS_FILE = path.join(ROOT, 'machine-verification-status.json');
const CATALOG_FILE = path.join(ROOT, 'catalog.json');
const ALLOWED = new Set(['PENDING_REAL_DEVICE','VERIFIED','NEEDS_FIX','REVERIFY']);

function read(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }

export function validateVerificationStatus(doc, catalog){
  const errors=[];
  if(doc.schemaVersion!=='machine-verification-status-v1') errors.push('schemaVersion must be machine-verification-status-v1');
  if(!Array.isArray(doc.entries)) errors.push('entries must be an array');
  const ids=(doc.entries??[]).map(e=>e.machineId);
  if(new Set(ids).size!==ids.length) errors.push('duplicate machineId');
  const catalogIds=new Set((catalog?.machines??[]).map(m=>m.machineId));
  for(const e of doc.entries??[]){
    if(!/^[A-Z0-9_]+$/.test(e.machineId??'')) errors.push(`invalid machineId: ${e.machineId}`);
    if(!ALLOWED.has(e.status)) errors.push(`${e.machineId}: invalid status ${e.status}`);
    if(!catalogIds.has(e.machineId)) errors.push(`${e.machineId}: not published in catalog.json`);
  }
  return {status:errors.length?'FAIL':'PASS',errors};
}

function validate(){
  const doc=read(STATUS_FILE), catalog=read(CATALOG_FILE);
  const result=validateVerificationStatus(doc,catalog);
  if(result.status!=='PASS'){
    for(const e of result.errors) console.error(`ERROR: ${e}`);
    process.exit(1);
  }
  console.log(`OK: 実機検証ステータス ${doc.entries.length}件を検証しました。`);
}

function status(){
  const doc=read(STATUS_FILE);
  const groups={};
  for(const e of doc.entries??[]){
    (groups[e.status]??=[]).push(e.machineId);
  }
  console.log(JSON.stringify({updatedAt:doc.updatedAt,total:doc.entries?.length??0,groups},null,2));
}

function help(){
  console.log(`SloAnalytica Real-device Verification Status v1\nUsage:\n  npm run verification:validate\n  npm run verification:status\n\nStatuses:\n  PENDING_REAL_DEVICE  公開済み・実機確認待ち\n  VERIFIED             実機確認済み\n  NEEDS_FIX            実機確認で修正必要\n  REVERIFY             修正後の再確認待ち`);
}

const cmd=process.argv[2]??'help';
if(cmd==='validate') validate();
else if(cmd==='status') status();
else if(cmd==='help'||cmd==='--help') help();
else { console.error(`unknown command: ${cmd}`); process.exit(2); }
