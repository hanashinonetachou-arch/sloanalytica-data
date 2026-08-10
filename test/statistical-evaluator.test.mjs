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
test("unsupported model remains reportable but not calculable",()=>{
 const d={schemaVersion:"research-data-v1",machine:{machineId:"M"},features:[{
  researchFeatureId:"RF",name:"multi",candidateModel:"multinomial",
  settingValues:{}
 }]};
 assert.equal(evaluateResearchData(d).features[0].calculable,false);
});
