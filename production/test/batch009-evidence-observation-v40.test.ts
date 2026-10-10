// Historical v48 input fixture. Current production routes are tested in batch009-process-resumption.test.ts.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditBatch009Staging} from '../src/batch009-staging-integrity.ts';
const root='batches/batch-20261008-009/';
const read=(p:string)=>JSON.parse(fs.readFileSync(root+p,'utf8'));
function drafts(id:string){
 const w=read(`research-history/v48/research-working/wave-2/${id}.json`),s=read(`research-history/v48/research-evidence-staged/wave-2/${id}.json`),r=read(`research-history/v48/research-evidence-reviewed/${id}.json`);
 assert.deepEqual(auditBatch009Staging(w,r,s),[]);
 return {w,s,r};
}
test('DenO preserves all 25 concrete categories with bonus-specific observed inputs',()=>{
 const {s,r}=drafts('L_KAMEN_RIDER_DEN_O_UD');
 assert.equal(r.evidenceCandidates.reduce((n:number,f:any)=>n+f.semanticCategories.length,0),25);
 const points=s.findings.find((f:any)=>f.findingId==='reviewed-evidence-5');
 assert.deepEqual(points.semanticCategories.map((c:any)=>c.label),['11%','22%','44%','55%','66%']);
 assert.deepEqual(points.semanticCategories.slice(0,2).map((c:any)=>c.semanticType),['PROBABILITY_UNKNOWN','PROBABILITY_UNKNOWN']);
 assert.match(points.details[0],/累積.*だけでは加算しません/);
 const trophy=s.findings.find((f:any)=>f.findingId==='reviewed-evidence-2');
 assert.match(trophy.details[0],/イマジン.*プリン.*ボーナス終了画面/);
 assert.equal(trophy.sourceIds.includes('reviewed-evidence-source-2'),false);
 assert.ok(trophy.sourceIds.includes('deno-v40-trophy-timing'));
 const timing=s.findings.find((f:any)=>f.findingId==='reviewed-evidence-4');
 assert.equal(timing.semanticCategories.at(-1).semanticType,'DISPLAY_ONLY');
 for(const f of s.findings.filter((f:any)=>f.observationType==='evidence'))assert.equal(f.settingDistribution,undefined);
});
test('RE2 figure coverage does not resolve acquisition-rate conflicts or latent state inference',()=>{
 const {s,r}=drafts('S_BIOHAZARD_RE2_XB');
 const f=s.findings.find((f:any)=>f.observationType==='evidence');
 assert.equal(f.semanticCategories.length,24);
 assert.equal(f.semanticCategories.filter((c:any)=>c.semanticType==='EXACT_CONSTRAINT').length,8);
 assert.ok(r.openChecks.some((s:string)=>/一部\/必ず/.test(s)));
 const block=s.blockedItems.find((b:any)=>b.blockId==='re2-v40-figure-observation');
 assert.match(block.reason,/非表示や一覧の再閲覧を加算しない/);
 assert.equal(s.researchCompleteness.status,'INCOMPLETE');
 assert.equal(s.findings.find((f:any)=>f.findingId==='at-initial').liveObservation.status,'UNRESOLVED');
});
