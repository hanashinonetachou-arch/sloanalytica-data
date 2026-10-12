import test from 'node:test';
import assert from 'node:assert/strict';
import {validateResearchProbabilityRouteContract,validateResearchBlockedUserFacingTextContract} from '../src/research-validator.ts';
import {validateResearchCandidateLedger} from '../src/research-validator.ts';
import {validateResearchProcessContract} from '../src/research-process-contract.ts';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {RepoStore} from '../src/core.ts';
import {initializeBatch} from '../src/runtime.ts';

const fixtures=path.resolve('test/fixtures/batch013-quality-repair');
test('actual incomplete Batch013 drafts cannot be accepted as completed Research',()=>{
 for(const file of fs.readdirSync(path.join(fixtures,'rejected'))){
  const d=JSON.parse(fs.readFileSync(path.join(fixtures,'rejected',file),'utf8'));
  assert.throws(()=>validateResearchCandidateLedger(d,new Set(d.sources.map((s:any)=>s.sourceId))),/RESEARCH_DOMAIN_(REVIEW_PLACEHOLDER|APPLICABILITY_IS_NOT_ELIGIBILITY)/,file);
 }
});
test('source-reviewed Batch012 candidates and bounded exclusions remain valid',()=>{
 for(const name of ['S_MOMOKYUN_SWORD_DX','S_SHIN_ORE_NO_SORA_ST']){
  const d=JSON.parse(fs.readFileSync(path.join(fixtures,name+'.json'),'utf8'));
  assert.doesNotThrow(()=>validateResearchCandidateLedger(d,new Set(d.sources.map((s:any)=>s.sourceId))));
 }
});
test('a one-candidate machine and structural inapplicability need no candidate quota',()=>{
 assert.doesNotThrow(()=>validateResearchProcessContract({researchCompleteness:{candidateLedger:[{candidateId:'only'}],domains:[{domain:'CZ',status:'NOT_APPLICABLE',note:'本機にはCZを搭載していない。',sourceIds:[]}]}}));
});
test('materialization rejects the actual deficient draft before overwriting prior Research or leasing',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'research-preflight-'));
 try{
  const names=fs.readdirSync(path.join(fixtures,'rejected')).map(f=>f.slice(0,-5));
  const store=new RepoStore(root),batchId='preflight';
  initializeBatch(store,{batchId,manifestVersion:'8.5',waves:[{waveId:'wave-1',machineIds:names.slice(0,5)},{waveId:'wave-2',machineIds:names.slice(5)}]});
  const draft=JSON.parse(fs.readFileSync(path.join(fixtures,'rejected',names[0]+'.json'),'utf8'));
  store.write({concurrency:{semanticSlots:1,productionSlots:1,validationSlots:1,integrationSlots:1},manifestVersion:'8.5'},'config','orchestrator.json');
  store.write(draft,'batches',batchId,'research-drafts','wave-1',names[0]+'.json');
  const prior=store.p('batches',batchId,'artifacts',names[0],'research','result.json');
  fs.mkdirSync(path.dirname(prior),{recursive:true});fs.writeFileSync(prior,'previous authoritative bytes');
  const before=store.read('batches',batchId,'machines',names[0],'stages','RESEARCH.json');
  const run=spawnSync(process.execPath,['--experimental-strip-types',path.resolve('src/materialize-research-drafts.ts'),batchId,'wave-1','--force-machine='+names[0],'--force-only'],{cwd:root,encoding:'utf8'});
  assert.notEqual(run.status,0);assert.match(run.stderr,/RESEARCH_DOMAIN_/);
  assert.equal(fs.readFileSync(prior,'utf8'),'previous authoritative bytes');
  assert.deepEqual(store.read('batches',batchId,'machines',names[0],'stages','RESEARCH.json'),before);
  assert.equal(fs.existsSync(store.p('batches',batchId,'leases')),false);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});

test('probability-known distributions cannot remain evidence-only',()=>{
  assert.throws(
    ()=>validateResearchProbabilityRouteContract({findingId:'known',observationType:'evidence',settingDistribution:{'1':'A 50% / B 50%','6':'A 30% / B 70%'}}),
    /PROBABILITY_KNOWN_EVIDENCE_ONLY/
  );
  assert.doesNotThrow(()=>validateResearchProbabilityRouteContract({findingId:'unknown',observationType:'evidence'}));
});

test('blocked research reasons do not expose implementation-only UI contracts',()=>{
  assert.throws(
    ()=>validateResearchBlockedUserFacingTextContract({blockId:'ui-only',reason:'現行の数値入力ContractではUIを生成できない。',reevaluationCondition:'UI Contractが固定されること。'}),
    /BLOCK_INTERNAL_IMPLEMENTATION_TEXT/
  );
  assert.doesNotThrow(()=>validateResearchBlockedUserFacingTextContract({blockId:'data-gap',reason:'設定別の数値が公開されていない。',reevaluationCondition:'設定別の出現率が確認できること。'}));
});

