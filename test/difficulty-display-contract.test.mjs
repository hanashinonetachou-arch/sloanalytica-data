import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {validateDifficultyDisplay} from '../tools/validate-difficulty-display.mjs';
test('all machine packages satisfy difficulty-display-v1',()=>{
 for(const e of fs.readdirSync('machines',{withFileTypes:true}).filter(x=>x.isDirectory())){
  const p=path.join('machines',e.name,'machine-package.json');if(!fs.existsSync(p))continue;
  const pkg=JSON.parse(fs.readFileSync(p));assert.deepEqual(validateDifficultyDisplay(pkg),[],e.name);
 }
});
test('evidence-dominant never requires a numeric score',()=>{
 const pkg={difficulty:{schemaVersion:'difficulty-display-v1',status:'EVIDENCE_DOMINANT',isProvisional:true,scoreModelVersion:null,scores:[],scoreRange:null,confidence:null,profile:'EVIDENCE_DOMINANT',uiPolicy:{showMachineGuideButton:true}}};
 assert.deepEqual(validateDifficultyDisplay(pkg),[]);
});
