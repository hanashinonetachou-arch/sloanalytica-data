import fs from 'node:fs';
const p='research/S_HARD_BOILED_XX/selection-data.json';
const d=JSON.parse(fs.readFileSync(p,'utf8'));
d.machineDataVersion='0.1.2';
for(const i of d.inputs??[]){
  if(['INP_JAC_VOICE_GOOD','INP_JAC_VOICE_GREAT','INP_JAC_VOICE_MARVELOUS','INP_JAC_VOICE_EXCELLENT','INP_JAC_VOICE_UNBELIEVABLE'].includes(i.id)){
    i.uiGridSpan=6;
    i.uiCompactCounter=true;
    i.uiDirectInput=false;
  }
}
fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n');
