import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {buildRuntimeProjection} from '../src/runtime-projection-builder.ts';import {buildObservationDescription} from '../src/canonical-ui-builder.ts';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../batches/batch-20261016-018/artifacts');const doc=(m:string,s:string)=>JSON.parse(fs.readFileSync(path.join(base,m,s,'result.json'),'utf8'));
test('inactive bonus-only rate cannot relabel the active total-games input',()=>{
 const m='L_HOKUTO_MUSOU_FS',d=buildRuntimeProjection(doc(m,'machine_data'),doc(m,'runtime_policy'),{},{});
 assert.ok(d.activeFeatures.some((f:any)=>f.findingId==='M07-C02'));
 assert.ok(d.inactiveFeatures.some((f:any)=>f.findingId==='M07-C03'));
 assert.equal(d.runtimeUi.playInfo.totalGamesLabel,undefined);assert.equal(d.runtimeUi.playInfo.totalGamesDescription,undefined);
});
test('scope explanation preserves conditions without repeating the count field label',()=>{
 const text=buildObservationDescription({label:'スイカ',trialUniverse:'TOTAL_GAME_TRIAL',denominatorSemantics:'通常時・ボーナス・STを含む実消化総ゲーム数と通常のスイカ回数を記録。無双スイカは別に分類。',details:['通常時・ボーナス・STを含む実消化総ゲーム数と通常のスイカ回数を記録。無双スイカは別に分類。']},'BERNOULLI',null);
 assert.ok(text.includes('ボーナス・ST'));assert.ok(text.includes('無双スイカ'));assert.ok(!text.includes('スイカ回数'));
});
test('Aoharu targeting methods use separate scoped game denominators',()=>{
 const p=doc('S_AOHARU_MISAO_A2','app_runtime').package;
 for(const [id,u] of [['M03-C03','AOHARU_WHITE7_GAME_TRIAL'],['M03-C05','AOHARU_PINK7_GAME_TRIAL']]){
  const f=p.features.features.find((x:any)=>x.featureId===id);assert.equal(f.trialUniverse,u);
  const inp=p.inputs.inputs.find((x:any)=>x.id===f.denominatorInputId);assert.ok(!inp.derivedCalculation,'scoped games must not use all normal games');
 }
});
test('Bofuri and Symphogear share their presentation opportunity through tabs',()=>{
 const b=doc('L_BOFURI_FN','app_runtime').package.ui.v8Sections.filter((s:any)=>s.tabGroup?.id==='OPPORTUNITY_bofuri_bonus_end');assert.equal(b.length,3);
 const s=doc('L_SYMPHOGEAR_SEIGI_JA','app_runtime').package.ui.v8Sections.filter((s:any)=>s.tabGroup?.id==='OPPORTUNITY_sympho_at_end');assert.equal(s.length,2);
});
