import test from 'node:test';import assert from 'node:assert/strict';import {validateMachineQaReadiness,QA_REQUIRED_STAGES} from '../src/qa-readiness-validator.ts';
const stages=Object.fromEntries(QA_REQUIRED_STAGES.map(s=>[s,{state:'COMPLETE',authoritativeOutputRef:{path:'p/'+s}}]));
const pkg:any={schemaVersion:1,provenance:{manifestVersion:'8.5',generationPath:'V8_5_PRODUCTION_PIPELINE',legacyOracleUsed:false},machine:{machineId:'M',machineDataVersion:'8.5.0-batch-x'},ui:{contractVersion:'runtime-ui-v8',source:'CANONICAL_UI',v8Sections:[{id:'EVI_e',items:[{evidenceId:'e'}]}]},evidence:{references:[{evidenceItems:[{findingId:'e'}]}],evidences:[{id:'e'}]}};
const renderReport:any={schemaVersion:'rendered-ui-validation-v1',machineId:'M',status:'PASS',contractVersion:'rendered-canonical-ui-v1',renderer:'MANIFEST_V8',source:'CANONICAL_UI',manifestRevision:'8.5',checks:{noDuplicateUi:true,noEmptySections:true,evidenceCoverage:true,summaryCoverage:true,noInternalWording:true,noLegacyRendererFallback:true,denominatorBinding:true,importanceCoverage:true,explanationCoverage:true,evidenceBodyCoverage:true,sectionGuidance:true,conciseInputLabels:true,compactTwoColumnLayout:true,evidenceCounterCoverage:true}};
test('accepts only fully completed v8.5 package with rendered UI PASS',()=>{assert.equal(validateMachineQaReadiness('M',stages,pkg,renderReport).status,'QA_READY')});
test('rejects old package even when files exist',()=>{assert.throws(()=>validateMachineQaReadiness('M',stages,{...pkg,provenance:undefined,machine:{machineId:'M',machineDataVersion:'0.1.0'},ui:{}},renderReport),/V8_PROVENANCE/)});
test('rejects pending downstream stage',()=>{assert.throws(()=>validateMachineQaReadiness('M',{...stages,APP_RUNTIME:{state:'PENDING'}},pkg,renderReport),/STAGE_APP_RUNTIME/)});
test('rejects Evidence references without materialized definitions',()=>{assert.throws(()=>validateMachineQaReadiness('M',stages,{...pkg,evidence:{...pkg.evidence,evidences:[]}},renderReport),/EVIDENCE_MATERIALIZATION/)});
test('rejects missing rendered UI report',()=>{assert.throws(()=>validateMachineQaReadiness('M',stages,pkg,null),/RENDER_REPORT_IDENTITY/)});
test('rejects rendered UI failure',()=>{assert.throws(()=>validateMachineQaReadiness('M',stages,pkg,{...renderReport,status:'FAIL'}),/RENDERED_UI_VALIDATION/)});
test('rejects legacy renderer fallback',()=>{assert.throws(()=>validateMachineQaReadiness('M',stages,pkg,{...renderReport,renderer:'LEGACY'}),/RENDER_CONTRACT/)});
test('rejects failed render contract check',()=>{assert.throws(()=>validateMachineQaReadiness('M',stages,pkg,{...renderReport,checks:{...renderReport.checks,noInternalWording:false}}),/RENDER_CHECK_noInternalWording/)});

test('rejects missing denominator binding contract check',()=>{assert.throws(()=>validateMachineQaReadiness('M',stages,pkg,{...renderReport,checks:{...renderReport.checks,denominatorBinding:false}}),/RENDER_CHECK_denominatorBinding/)});

test('rejects missing device-visible UI completeness check',()=>{assert.throws(()=>validateMachineQaReadiness('M',stages,pkg,{...renderReport,checks:{...renderReport.checks,evidenceBodyCoverage:false}}),/RENDER_CHECK_evidenceBodyCoverage/)});

test('rejects verbose input labels or broken compact layout checks',()=>{assert.throws(()=>validateMachineQaReadiness('M',stages,pkg,{...renderReport,checks:{...renderReport.checks,conciseInputLabels:false}}),/RENDER_CHECK_conciseInputLabels/);assert.throws(()=>validateMachineQaReadiness('M',stages,pkg,{...renderReport,checks:{...renderReport.checks,compactTwoColumnLayout:false}}),/RENDER_CHECK_compactTwoColumnLayout/)});

test('rejects non-counter setting-hint coverage',()=>{assert.throws(()=>validateMachineQaReadiness('M',stages,pkg,{...renderReport,checks:{...renderReport.checks,evidenceCounterCoverage:false}}),/RENDER_CHECK_evidenceCounterCoverage/)});
