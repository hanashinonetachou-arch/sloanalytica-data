import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {execFileSync} from 'node:child_process';
test('display scores are derived from raw and reference only',()=>{
 const d=JSON.parse(fs.readFileSync('difficulty-catalog.json'));
 const geass=d.entries.find(e=>e.machineId==='S_CODE_GEASS_3_CC_FS').difficulty;
 assert.deepEqual(geass.rawScores,[{games:1500,rawScore:19},{games:3000,rawScore:29},{games:7000,rawScore:46}]);
 assert.deepEqual(geass.scores,[{games:1500,score:100},{games:3000,score:100},{games:7000,score:100}]);
});
test('changing reference recalibrates without changing raw',()=>{
 const tmp='reports/_difficulty-calibration-temp.json';
 const d=JSON.parse(fs.readFileSync('difficulty-catalog.json'));
 const before=JSON.stringify(d.entries.map(e=>[e.machineId,e.difficulty.rawScores]));
 d.calibration.targets['7000'].referenceRaw=92;
 fs.writeFileSync(tmp,JSON.stringify(d,null,2));
 execFileSync('node',['tools/recalibrate-difficulty-display.mjs',tmp]);
 const after=JSON.parse(fs.readFileSync(tmp));
 assert.equal(before,JSON.stringify(after.entries.map(e=>[e.machineId,e.difficulty.rawScores])));
 const geass=after.entries.find(e=>e.machineId==='S_CODE_GEASS_3_CC_FS').difficulty;
 assert.equal(geass.scores.find(s=>s.games===7000).score,50);
 fs.unlinkSync(tmp);
});
