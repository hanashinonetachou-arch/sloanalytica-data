import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT=path.resolve(import.meta.dirname,'..');
const ALLOWED=new Set(['PREDECESSOR_SNAPSHOT','SELF_PLAY','REFERENCE_TOTAL']);

test('SelectionData observationScope values stay compatible with App validator',()=>{
  const bad=[];
  for(const entry of fs.readdirSync(path.join(ROOT,'research'),{withFileTypes:true})){
    if(!entry.isDirectory())continue;
    const p=path.join(ROOT,'research',entry.name,'selection-data.json');
    if(!fs.existsSync(p))continue;
    const s=JSON.parse(fs.readFileSync(p,'utf8'));
    for(const input of s.inputs??[]){
      if(input.observationScope!==undefined && !ALLOWED.has(input.observationScope)) bad.push(`${s.machineId}/${input.id}=${input.observationScope}`);
    }
  }
  assert.deepEqual(bad,[],`App-incompatible observationScope: ${bad.join(', ')}`);
});
