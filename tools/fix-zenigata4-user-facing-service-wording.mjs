#!/usr/bin/env node
import fs from 'node:fs';

const id='L_ZENIGATA4_L1';
const rp=`research/${id}/research-data.json`;
const sp=`research/${id}/selection-data.json`;
const up=`research/${id}/ui-design-data.json`;

const research=JSON.parse(fs.readFileSync(rp,'utf8'));
const names={
  RE_DWIN_2PLUS:'一味違うね',
  RE_DWIN_3PLUS:'何やら不思議な気配です',
  RE_DWIN_4PLUS:'良い予感がします',
  RE_DWIN_5PLUS:'遊び尽くしちゃいましょう',
  RE_DWIN_6:'お肉～ お肉～'
};
for(const ev of research.evidenceCandidates??[]){
  if(names[ev.researchEvidenceId]){
    ev.name=names[ev.researchEvidenceId];
    ev.observationScope='1000Gごとのボイス';
  }
}
fs.writeFileSync(rp,JSON.stringify(research,null,2)+'\n');

const selection=JSON.parse(fs.readFileSync(sp,'utf8'));
const group=(selection.evidenceUi?.groups??[]).find(g=>g.groupId==='DWIN_LITE_1000G_VOICE');
if(!group) throw new Error(`${id}: evidence group missing`);
group.label='1000Gごとのボイス';
for(const opt of group.options??[]){
  const ref=opt.sourceEvidenceIds?.[0];
  if(names[ref]) opt.label=names[ref];
}
fs.writeFileSync(sp,JSON.stringify(selection,null,2)+'\n');

const ui=JSON.parse(fs.readFileSync(up,'utf8'));
const c=ui.evidenceContracts?.EVI_UI_DWIN_LITE_1000G_VOICE;
if(!c) throw new Error(`${id}: evidence UI contract missing`);
c.label='1000Gごとのボイス';
ui.auditNotes=(ui.auditNotes??[]).map(x=>String(x).replaceAll('打-WIN LITEで実際に確認した1000Gごとのボイス','1000Gごとに実際に確認したボイス'));
fs.writeFileSync(up,JSON.stringify(ui,null,2)+'\n');

console.log(`${id}: neutralized user-facing service wording; provenance/linked-service research retained`);
