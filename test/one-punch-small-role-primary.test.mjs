import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve('.');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const research=read(path.join(root,'research/L_ONE_PUNCH_MAN/research-data.json'));
const selection=read(path.join(root,'research/L_ONE_PUNCH_MAN/selection-data.json'));

const rf=id=>(research.features??[]).find(f=>f.researchFeatureId===id);
const sf=id=>(selection.features??[]).find(f=>f.researchFeatureId===id);

function kl(P,Q){return P.reduce((s,p,i)=>s+p*Math.log(p/Q[i]),0);}
function symKl(P,Q){return (kl(P,Q)+kl(Q,P))/2;}

test('small-role multinomial is primary and AT is excluded',()=>{
  const small=sf('RF_SMALL_ROLE_MULTI');
  assert.equal(small.adoptionCategory,'INCLUDE_PRIMARY');
  assert.equal(small.denominatorInputId,'INP_ROLE_GAMES');
  assert.equal(small.numeratorInputId,'INP_WEAK_CHERRY');
  assert.deepEqual(small.categoryInputIds,['INP_WATERMELON']);
  assert.equal(small.residualCategoryLabel,'OTHER');
  assert.equal(small.weight,1);
  assert.equal(small.difficultyExposure?.quality,'EXACT');
  assert.equal(sf('RF_AT_INITIAL').adoptionCategory,'EXCLUDE');
});

test('small-role inputs preserve unobserved versus observed zero semantics',()=>{
  for(const id of ['INP_ROLE_GAMES','INP_WEAK_CHERRY','INP_WATERMELON']){
    const input=(selection.inputs??[]).find(x=>x.id===id);
    assert.ok(input,id);
    assert.equal(input.defaultValue,null,`${id} defaultValue`);
  }
});

test('Research multinomial is complete and materially stronger than AT endpoint information',()=>{
  const multi=rf('RF_SMALL_ROLE_MULTI');
  const at=rf('RF_AT_INITIAL');
  for(const setting of research.machine.settings){
    const d=multi.settingDistributions[setting];
    const sum=d.WEAK_CHERRY+d.WATERMELON+d.OTHER;
    assert.ok(Math.abs(sum-1)<1e-12,`${setting} complete distribution`);
  }
  const P=Object.values(multi.settingDistributions.SET_1);
  const Q=Object.values(multi.settingDistributions.SET_6);
  const p1=at.settingValues.SET_1.probability, p6=at.settingValues.SET_6.probability;
  const atInfo=symKl([p1,1-p1],[p6,1-p6]);
  const roleInfo=symKl(P,Q);
  assert.ok(roleInfo/atInfo>5,`expected >5x endpoint information, got ${roleInfo/atInfo}`);
});

test('scalar weak-cherry and watermelon features remain excluded to prevent duplicate likelihoods',()=>{
  assert.equal(sf('RF_WEAK_CHERRY').adoptionCategory,'EXCLUDE');
  assert.equal(sf('RF_WATERMELON').adoptionCategory,'EXCLUDE');
});
