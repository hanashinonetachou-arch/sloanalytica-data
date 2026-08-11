import test from "node:test";
import assert from "node:assert/strict";
import { validateMachineRegistry } from "../tools/validate-machine-registry.mjs";

test("valid registry passes",()=>{
 const r=validateMachineRegistry({schemaVersion:"machine-registry-v1",generatedAt:"x",machines:[{
  machineId:"M_TEST",displayName:"Test",manufacturer:"Maker",introducedAt:null,marketStatus:"UNKNOWN",marketLastCheckedAt:null,marketSources:[],
  appStatus:"INCLUDED",researchStatus:"UNKNOWN",fieldTestStatus:"UNKNOWN",machineDataVersion:"0.1.0",priority:"NONE",notes:""
 }]});
 assert.equal(r.ok,true);
});
test("duplicate ids fail",()=>{
 const m={machineId:"M_TEST",displayName:"Test",manufacturer:"Maker",marketStatus:"UNKNOWN",appStatus:"NOT_STARTED",researchStatus:"UNKNOWN",fieldTestStatus:"UNKNOWN",priority:"NONE"};
 assert.equal(validateMachineRegistry({schemaVersion:"machine-registry-v1",machines:[m,{...m}]}).ok,false);
});
test("included requires version",()=>{
 const m={machineId:"M_TEST",displayName:"Test",manufacturer:"Maker",marketStatus:"UNKNOWN",appStatus:"INCLUDED",researchStatus:"UNKNOWN",fieldTestStatus:"UNKNOWN",priority:"NONE"};
 assert.equal(validateMachineRegistry({schemaVersion:"machine-registry-v1",machines:[m]}).ok,false);
});
