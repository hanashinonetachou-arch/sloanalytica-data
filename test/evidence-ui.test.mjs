import test from"node:test";import assert from"node:assert/strict";import{validateEvidenceUi}from"../tools/validate-evidence-ui.mjs";const r={machine:{settings:["SET_1","SET_2"]},evidenceCandidates:[{researchEvidenceId:"E1"}]};test("evidence ui validates",()=>assert.equal(validateEvidenceUi({schemaVersion:"evidence-ui-v1",groups:[{groupId:"G",options:[{value:"V",allowedSettings:["SET_2"],sourceEvidenceIds:["E1"]}]}]},r).ok,true));test("unknown evidence fails",()=>assert.equal(validateEvidenceUi({schemaVersion:"evidence-ui-v1",groups:[{groupId:"G",options:[{value:"V",sourceEvidenceIds:["BAD"]}]}]},r).ok,false));
test("explicit NONE is rejected",()=>{
 const d={schemaVersion:"evidence-ui-v1",groups:[{groupId:"G",options:[{value:"NONE",sourceEvidenceIds:[]}]}]};
 assert.equal(validateEvidenceUi(d,r).ok,false);
});
