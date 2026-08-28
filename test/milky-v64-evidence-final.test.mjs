import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const s=JSON.parse(fs.readFileSync('research/S_MILKY_HOMES_GNB/selection-data.json','utf8'));
const o=JSON.parse(fs.readFileSync('research/S_MILKY_HOMES_GNB/machine-observation-data.json','utf8'));
const ui=JSON.parse(fs.readFileSync('research/S_MILKY_HOMES_GNB/ui-design-data.json','utf8'));

test('Milky MMB panel is a complete shared-input numeric Feature',()=>{ const f=s.features.find(x=>x.featureId==='FEAT_MMB_PANEL'); assert.ok(f); assert.equal(f.adoptionCategory,'INCLUDE_SUPPORT'); assert.equal(f.categoryInputIds.length,5); assert.equal(f.normalizeRoundedCategoryProbabilities,true); for(const id of ['RE_MMB_RED','RE_MMB_RAINBOW']){ const e=s.evidence.find(x=>x.researchEvidenceId===id); assert.ok(e); assert.deepEqual(e.sharedFeatureIds,['FEAT_MMB_PANEL']); }});

test('Milky SmartTALK and Gacha are explicitly held pending menu session-boundary verification',()=>{ for(const id of ['RF_SMART_A','RF_SMART_B','RF_SMART_C','RF_GACHA']){ const f=s.features.find(x=>x.researchFeatureId===id); assert.equal(f.adoptionCategory,'EXCLUDE'); assert.match(f.userFacingReason,/試行母集団とセッション境界が未解決/); } for(const id of ['RE_SMART_A_RED','RE_SMART_B_BLUE','RE_SMART_B_RED','RE_SMART_C_BLUE','RE_SMART_C_RED','RE_GACHA_A','RE_GACHA_S','RE_GACHA_SS']) assert.ok(s.evidenceReview.exclusions.some(x=>x.researchEvidenceId===id)); assert.ok(!(s.evidenceUi.groups??[]).some(g=>['EVID_SMART_TALK','EVID_GACHA'].includes(g.groupId))); });

test('Milky Observation and UI expose shared MMB and full bonus-end counters',()=>{ assert.ok(o.featureMappings.some(x=>x.featureId==='FEAT_MMB_PANEL'&&x.observationIds.includes('OBS_MMB_PANEL_DIRECT'))); assert.ok(o.featureMappings.some(x=>x.featureId==='FEAT_BONUS_END')); const end=ui.sections['ボーナス終了画面（割合）']; assert.deepEqual(end.inputIds,['INP_END_WHITE1','INP_END_WHITE2','INP_END_WHITE3','INP_END_COPPER','INP_END_GOLD','INP_END_STAR','INP_END_RAINBOW']); assert.equal(ui.sections['スマTALK'],undefined); assert.equal(ui.sections['スマコレ・ガチャ'],undefined); });
