import test from "node:test";
import assert from "node:assert/strict";
import { evaluateResearchData } from "../tools/evaluate-research-statistics.mjs";

test("binomial feature produces objective metrics",()=>{
 const d={schemaVersion:"research-data-v1",machine:{machineId:"M"},features:[{
  researchFeatureId:"RF01",name:"X",candidateModel:"binomial",
  settingValues:{SET_1:{probability:0.01},SET_2:{probability:0.02},SET_6:{probability:0.04}}
 }]};
 const r=evaluateResearchData(d);
 assert.equal(r.machineId,"M");
 assert.equal(r.features[0].calculable,true);
 assert.equal(r.features[0].pairwise.length,3);
 assert.ok(r.features[0].hardestAdjacentPair.approxTrials95>0);
});
test("equal probabilities do not invent trial count",()=>{
 const d={schemaVersion:"research-data-v1",machine:{machineId:"M"},features:[{
  researchFeatureId:"RF",name:"same",candidateModel:"binomial",
  settingValues:{SET_1:{probability:.1},SET_6:{probability:.1}}
 }]};
 const r=evaluateResearchData(d);
 assert.equal(r.features[0].pairwise[0].approxTrials95,null);
});
test("multinomial feature produces categorical distance metrics",()=>{
 const d={schemaVersion:"research-data-v1",machine:{machineId:"M",settings:["SET_1","SET_2","SET_6"]},features:[{
  researchFeatureId:"RF",name:"screen",candidateModel:"multinomial",categories:["A","B","C"],settingValues:{},
  settingDistributions:{SET_1:{A:.7,B:.2,C:.1},SET_2:{A:.65,B:.2,C:.15},SET_6:{A:.4,B:.2,C:.4}}
 }]};
 const f=evaluateResearchData(d).features[0];
 assert.equal(f.calculable,true);
 assert.equal(f.pairwise.length,3);
 assert.ok(f.pairwise[0].jsDivergenceNats>0);
 assert.ok(f.pairwise[0].approxTrialsBayesErrorUpper5pct>0);
 assert.deepEqual(f.hardestAdjacentPair.settings,["SET_1","SET_2"]);
});

test("incomplete multinomial distribution is not invented",()=>{
 const d={schemaVersion:"research-data-v1",machine:{machineId:"M",settings:["SET_1","SET_6"]},features:[{
  researchFeatureId:"RF",name:"screen",candidateModel:"multinomial",categories:["A","B","C"],settingValues:{},
  settingDistributions:{SET_1:{A:.7,B:.3},SET_6:{A:.4,B:.2,C:.4}}
 }]};
 assert.equal(evaluateResearchData(d).features[0].calculable,false);
});

test("implicit residual multinomial is evaluated with residual category",()=>{
 const d={schemaVersion:"research-data-v1",machine:{machineId:"M",settings:["SET_1","SET_6"]},features:[{
  researchFeatureId:"RF",name:"partial",candidateModel:"multinomial",distributionMode:"implicit_residual",
  categories:["A","B"],settingDistributions:{SET_1:{A:.1,B:.2},SET_6:{A:.2,B:.3}}
 }]};
 const f=evaluateResearchData(d).features[0];
 assert.equal(f.calculable,true);
 assert.equal(f.categories.at(-1),"__RESIDUAL__");
});
