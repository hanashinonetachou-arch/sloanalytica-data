import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCalibrationReadiness} from '../tools/difficulty-calibration-readiness.mjs';

test('calibration readiness requires final-quality exposure and comparable game basis',()=>{
  const report=buildCalibrationReadiness(new URL('..',import.meta.url).pathname);
  assert.equal(report.reportVersion,'difficulty-calibration-readiness-v1.1');
  assert.equal(report.summary.targetMachineCount,4);
  const my=report.machines.find(m=>m.machineId==='S_MY_JUGGLER_V_KD');
  const geass=report.machines.find(m=>m.machineId==='S_CODE_GEASS_3_CC_FS');
  const tokyo=report.machines.find(m=>m.machineId==='L_TOKYO_GHOUL');
  const kaguya=report.machines.find(m=>m.machineKey==='KAGUYA_SAMA');
  assert.ok(my.blockers.includes('RESEARCH_DATA_MISSING'));
  assert.ok(my.blockers.includes('SELECTION_DATA_MISSING'));
  assert.equal(geass.selectionCheck.finalCalibrationUsableFeatureCount,1);
  assert.ok(geass.blockers.includes('DIFFICULTY_EXPOSURE_INCOMPLETE'));
  assert.equal(geass.selectionCheck.targetGameBasisUsableForFinalCalibration,true);
  assert.ok(tokyo.blockers.includes('TARGET_GAME_BASIS_NOT_FINAL_COMPARABLE'));
  assert.ok(tokyo.blockers.includes('NON_FINAL_EXPOSURE_QUALITY_PRESENT'));
  assert.equal(tokyo.selectionCheck.finalCalibrationUsableFeatureCount,0);
  assert.ok(kaguya.blockers.includes('MACHINE_ID_PENDING'));
  assert.equal(report.nextAction,'RESOLVE_BLOCKERS_BEFORE_SCORING');
});
