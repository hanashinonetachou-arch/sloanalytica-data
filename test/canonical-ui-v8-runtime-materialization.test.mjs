import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
import {materializeCanonicalUiV8,assertCanonicalRuntimeUiEquality} from "../tools/materialize-canonical-ui-v8-runtime.mjs";
const ui=JSON.parse(fs.readFileSync(new URL("../validation/v8/L_LOVEJOU3_M4/canonical-ui.json",import.meta.url),"utf8"));
test("v8 runtime UI is a lossless canonical translation",()=>{const r=materializeCanonicalUiV8(ui);assert.equal(r.source,"CANONICAL_UI");assert.equal(r.accordion.singleOpen,true);assert.equal(r.sections[0].groups[0].inputs[0].label,"通常時ゲーム数");assert.equal(r.sections[1].items[0].interaction.type,"CATEGORY_COUNTERS");assert.equal(r.sections[1].items[0].interaction.totalOpportunities,"SEPARATE_COUNTER");assertCanonicalRuntimeUiEquality(ui,r);});
test("runtime mutation fails semantic equality",()=>{const r=materializeCanonicalUiV8(ui);r.sections[0].groups[0].inputs[0].label="母数";assert.throws(()=>assertCanonicalRuntimeUiEquality(ui,r));});
