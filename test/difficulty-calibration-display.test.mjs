import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {execFileSync} from 'node:child_process';
test('display scores are derived from fixed My Juggler V 7000G benchmark',()=>{
 const d=JSON.parse(fs.readFileSync('difficulty-catalog.json'));
 assert.equal(d.calibration.method,'FIXED_BENCHMARK_RAW_SCALE');
 assert.equal(d.calibration.referenceMachineId,'S_MY_JUGGLER_V_KD');
 assert.equal(d.calibration.referenceGames,7000);
 assert.equal(d.calibration.referenceRaw,31);
 assert.equal(d.calibration.displayReference,80);
 assert.equal(d.calibration.unboundedAbove,true);
 const my=d.entries.find(e=>e.machineId==='S_MY_JUGGLER_V_KD').difficulty;
 assert.deepEqual(my.scores,[{games:1500,score:31},{games:3000,score:52},{games:7000,score:80}]);
 const geass=d.entries.find(e=>e.machineId==='S_CODE_GEASS_3_CC_FS').difficulty;
 assert.deepEqual(geass.rawScores,[{games:1500,rawScore:19},{games:3000,rawScore:29},{games:7000,rawScore:46}]);
 assert.deepEqual(geass.scores,[{games:1500,score:49},{games:3000,score:75},{games:7000,score:119}]);
});
test('changing benchmark display reference recalibrates without changing raw or imposing a 100 cap',()=>{
 const tmp='reports/_difficulty-calibration-temp.json';
 const d=JSON.parse(fs.readFileSync('difficulty-catalog.json'));
 const before=JSON.stringify(d.entries.map(e=>[e.machineId,e.difficulty.rawScores]));
 d.calibration.displayReference=100;
 fs.writeFileSync(tmp,JSON.stringify(d,null,2));
 execFileSync('node',['tools/recalibrate-difficulty-display.mjs',tmp]);
 const after=JSON.parse(fs.readFileSync(tmp));
 assert.equal(before,JSON.stringify(after.entries.map(e=>[e.machineId,e.difficulty.rawScores])));
 const my=after.entries.find(e=>e.machineId==='S_MY_JUGGLER_V_KD').difficulty;
 assert.equal(my.scores.find(s=>s.games===7000).score,100);
 const geass=after.entries.find(e=>e.machineId==='S_CODE_GEASS_3_CC_FS').difficulty;
 assert.ok(geass.scores.find(s=>s.games===7000).score>100);
 fs.unlinkSync(tmp);
});
test('all scored display scores are non-decreasing with more games and non-negative',()=>{
 const d=JSON.parse(fs.readFileSync('difficulty-catalog.json'));
 for(const e of d.entries){if(e.difficulty?.status!=='SCORED')continue; const a=e.difficulty.scores; assert.ok(a[0].score<=a[1].score&&a[1].score<=a[2].score,e.machineId); assert.ok(a.every(x=>x.score>=0),e.machineId);}
});
