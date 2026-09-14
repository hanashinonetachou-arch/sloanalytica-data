#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root='research';
const legacySelection=[];
const legacyUi=[];
const legacyOtherAbstract=[];

for (const ent of fs.readdirSync(root,{withFileTypes:true})) {
  if (!ent.isDirectory()) continue;
  const id=ent.name;
  const sp=path.join(root,id,'selection-data.json');
  const up=path.join(root,id,'ui-design-data.json');
  if (fs.existsSync(sp)) {
    const s=JSON.parse(fs.readFileSync(sp,'utf8'));
    const groups=s.evidenceUi?.groups??[];
    if (groups.some(g=>g.groupId==='SETTING_FLOOR'||g.label==='確認した設定下限')) legacySelection.push(id);
    for (const g of groups) {
      if (g.groupId==='SETTING_FLOOR'||g.label==='確認した設定下限') continue;
      const labels=(g.options??[]).map(o=>String(o.label??''));
      if (labels.length && labels.every(x=>/^設定(?:[1-6]|[1-6]以上|[1-6]以下|[1-6]否定)/.test(x))) {
        legacyOtherAbstract.push({machineId:id,groupId:g.groupId,label:g.label});
      }
    }
  }
  if (fs.existsSync(up)) {
    const ui=JSON.parse(fs.readFileSync(up,'utf8'));
    const contracts=ui.inputContracts??{};
    const sec=ui.sections?.['設定確定・否定情報'];
    const ids=[...(sec?.inputIds??[]),...Object.keys(contracts)];
    if (ids.includes('INP_EVI_SETTING_FLOOR') || Object.values(contracts).some(c=>c?.name==='確認した設定下限')) legacyUi.push(id);
  }
}

legacySelection.sort();
legacyUi.sort();
legacyOtherAbstract.sort((a,b)=>a.machineId.localeCompare(b.machineId)||a.groupId.localeCompare(b.groupId));
console.log(JSON.stringify({
  scannedAt:new Date().toISOString(),
  legacySelectionCount:legacySelection.length,
  legacyUiCount:legacyUi.length,
  legacyOtherAbstractCount:legacyOtherAbstract.length,
  legacySelection,
  legacyUi,
  legacyOtherAbstract
},null,2));
