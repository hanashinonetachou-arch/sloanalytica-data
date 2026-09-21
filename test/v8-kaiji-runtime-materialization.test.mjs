import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { materializeCanonicalUiV8 } from "../tools/materialize-canonical-ui-v8-runtime.mjs";

const read=p=>JSON.parse(fs.readFileSync(new URL("../"+p,import.meta.url),"utf8"));
const base="repro-v8/L_SMASLO_KAIJI_KYOEN_FJ/";
test("Kaiji v8 runtime UI is deterministically wired from upstream contracts",()=>{
 const canonical=read(base+"canonical-ui.json");
 const observation=read(base+"observation-contract.json");
 const evidence=read(base+"evidence-contract.json");
 const machinePackage=read("machines/L_SMASLO_KAIJI_KYOEN_FJ/machine-package.json");
 const ui=materializeCanonicalUiV8(canonical,{observationContract:observation,evidenceContract:evidence,machinePackage});
 const normal=ui.sections.find(s=>s.id==="SEC_NORMAL").items[0].inputs;
 assert.deepEqual(normal.find(x=>x.id==="INP_NORMAL_GAMES").engineBinding,{inputIds:["INP_FEAT_CZ_INITIAL_GAMES","INP_FEAT_BONUS_INITIAL_GAMES"]});
 assert.deepEqual(normal.find(x=>x.id==="INP_CZ_INITIAL").engineBinding,{inputId:"INP_FEAT_CZ_INITIAL_COUNT"});
 const roles=ui.sections.find(s=>s.id==="SEC_ROLES").items[0].inputs;
 assert.equal(roles.find(x=>x.id==="INP_WATERMELON").engineBinding.inputId,"INP_FEAT_RARE_ROLE_MULTI_WATERMELON");
 const payout=ui.sections.find(s=>s.id==="SEC_PAYOUT").items[0];
 assert.equal(payout.interaction.totalOpportunities,"NONE");
 assert.equal(payout.interaction.opportunityTracking,undefined);
 const c456=payout.interaction.categories.find(x=>x.label==="456突破");
 assert.deepEqual(c456.engineBinding,{mode:"MULTI_ENUM_PRESENCE",inputId:"INP_EVI_PAYOUT",triggerValue:"456枚突破"});
 const tr=ui.sections.find(s=>s.id==="SEC_TR_RESET").items[0];
 assert.equal(tr.interaction.totalOpportunities,"NONE");
 assert.equal(tr.interaction.categories[0].engineBinding,undefined);
});
