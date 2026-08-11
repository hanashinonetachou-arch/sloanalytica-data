import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCalibrationReadiness} from '../tools/difficulty-calibration-readiness.mjs';

test('calibration readiness detects missing research and exposure without inferring',()=>{
  const report=buildCalibrationReadiness(new URL('..',import.meta.url).pathname);
  assert.equal(report.summary.targetMachineCount,4);
  const my=report.machines.find(m=>m.machineId==='S_MY_JUGGLER_V_KD');
  const geass=report.machines.find(m=>m.machineId==='S_CODE_GEASS_3_CC_FS');
  const tokyo=report.machines.find(m=>m.machineId==='L_TOKYO_GHOUL');
  const kaguya=report.machines.find(m=>m.machineKey==='KAGUYA_SAMA');
  assert.ok(my.blockers.includes('RESEARCH_DATA_MISSING'));
  assert.ok(my.blockers.includes('SELECTION_DATA_MISSING'));
  assert.ok(geass.blockers.includes('DIFFICULTY_EXPOSURE_INCOMPLETE'));
  assert.ok(tokyo.blockers.includes('DIFFICULTY_EXPOSURE_INCOMPLETE'));
  assert.ok(kaguya.blockers.includes('MACHINE_ID_PENDING'));
  assert.equal(report.nextAction,'RESOLVE_BLOCKERS_BEFORE_SCORING');
});
