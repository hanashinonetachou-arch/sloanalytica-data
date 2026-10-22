import test from 'node:test';import assert from 'node:assert/strict';
import {derivePlayInfoRequirement} from '../src/canonical-ui-builder.ts';
import {playDataSourceForTrialUniverse} from '../src/app-runtime-builder.ts';
import fs from 'node:fs';import {validateCanonicalUiDocument} from '../src/canonical-ui-validator.ts';
test('A-type normal trials reuse one total-game input without changing the source trial universe',()=>{
 assert.equal(derivePlayInfoRequirement(['NORMAL_GAME_TRIAL'],'TOTAL_ONLY').mode,'TOTAL_ONLY');
 assert.equal(playDataSourceForTrialUniverse('NORMAL_GAME_TRIAL','TOTAL_ONLY'),'PLAY_TOTAL_GAME_DELTA');
 assert.equal(derivePlayInfoRequirement(['NORMAL_GAME_TRIAL']).mode,'NORMAL_ONLY');
 assert.equal(playDataSourceForTrialUniverse('NORMAL_GAME_TRIAL'),'PLAY_NORMAL_GAME_DELTA');
 assert.equal(derivePlayInfoRequirement(['NON_CHAIN_BONUS_INITIAL_GAME_TRIAL','NORMAL_GAME_TRIAL']).mode,'TOTAL_AND_NORMAL');
 assert.throws(()=>derivePlayInfoRequirement(['NON_CHAIN_BONUS_INITIAL_GAME_TRIAL'],'TOTAL_ONLY'),/EXCLUSION_CONFLICT/);
});
test('categorical source labels survive UI generation and tampering is rejected',()=>{
 const root=new URL('../batches/batch-20261022-025/artifacts/L_HANABI_KM/',import.meta.url),read=(stage:string)=>JSON.parse(fs.readFileSync(new URL(stage+'/result.json',root),'utf8'));
 const c=read('candidate_contract'),o=read('observation_evidence'),e=read('evaluation'),u=read('canonical_ui'),refs=u.sourceArtifacts;
 assert.doesNotThrow(()=>validateCanonicalUiDocument(u,c,o,e,refs.candidateContract,refs.observationEvidence,refs.evaluation));
 const bad=structuredClone(u);bad.numericSections.find((s:any)=>s.sourceFindingId==='HC_MISS').inputs.find((i:any)=>i.role==='categoryCount').label='別の結果';
 assert.throws(()=>validateCanonicalUiDocument(bad,c,o,e,refs.candidateContract,refs.observationEvidence,refs.evaluation),/CATEGORY_INPUT/);
});
