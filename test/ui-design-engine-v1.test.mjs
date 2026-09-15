import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateUiDesignData, gateUiDesignData } from '../tools/validate-ui-design-data.mjs';
import { materializeUiDesign } from '../tools/materialize-ui-design.mjs';

function read(machineId){
  return JSON.parse(fs.readFileSync(new URL(`../research/${machineId}/ui-design-data.json`,import.meta.url),'utf8'));
}

function quickAddFixture(quickAdd){
  return {
    pkg:{
      machine:{machineId:'TEST_QUICK_ADD'},
      inputs:{inputs:[{id:'INP_X',name:'old',type:'number'}]},
      ui:{sections:[]},
    },
    design:{
      schemaVersion:'ui-design-data-v1',
      machineId:'TEST_QUICK_ADD',
      status:'PASS',
      sectionOrder:['入力'],
      sections:{'入力':{inputIds:['INP_X']}},
      inputContracts:{INP_X:{name:'入力',mode:'NUMBER',quickAdd}},
      evidenceContracts:{},
      unresolved:[],
      auditNotes:[],
    },
  };
}

const reference=read('S_REVUE_STARLIGHT_CX');

test('reference UI design validates',()=>{
  assert.deepEqual(validateUiDesignData(reference,{expectedMachineId:'S_REVUE_STARLIGHT_CX'}),[]);
  assert.equal(gateUiDesignData(reference).gate,'PASS');
});

test('derived input requires valid sources',()=>{
  const x=structuredClone(reference);
  x.inputContracts.INP_BLUE_BIG_COUNT.derivedFromInputIds=['MISSING'];
  assert.ok(validateUiDesignData(x).some(e=>e.includes('unknown derived source')));
});

test('unresolved UI design is non-blocking',()=>{
  const x=structuredClone(reference);
  x.status='PASS_WITH_UNRESOLVED';
  x.unresolved=[{id:'UI_X',reason:'observation detail unresolved'}];
  assert.equal(gateUiDesignData(x).gate,'PASS_WITH_UNRESOLVED');
});

test('manual review is distinct from research reopen',()=>{
  const x=structuredClone(reference);
  x.status='MANUAL_UI_REVIEW_REQUIRED';
  assert.equal(gateUiDesignData(x).gate,'MANUAL_UI_REVIEW_REQUIRED');
});

test('pilot designs validate across A-type, BT and smart-slot AT',()=>{
  for(const machineId of ['S_MY_JUGGLER_V_KD','LB_SLOT_GALFY_A4','L_INITIAL_D_2ND']){
    const data=read(machineId);
    assert.deepEqual(validateUiDesignData(data,{expectedMachineId:machineId}),[],machineId);
    assert.equal(gateUiDesignData(data).gate,'PASS_WITH_UNRESOLVED',machineId);
  }
});

test('independent evidence group requires Selection source id',()=>{
  const x=structuredClone(read('LB_SLOT_GALFY_A4'));
  delete x.evidenceContracts.EVID_GALFY_SIDE_LAMP.sourceEvidenceGroupId;
  assert.ok(validateUiDesignData(x).some(e=>e.includes('sourceEvidenceGroupId is required')));
});

test('materializer preserves scalar quickAdd representation',()=>{
  const {pkg,design}=quickAddFixture(50);
  const out=materializeUiDesign(pkg,design);
  assert.equal(out.ui.sections[0].items[0].config.quickAdd,50);
});

test('materializer preserves array quickAdd representation',()=>{
  const {pkg,design}=quickAddFixture([1]);
  const out=materializeUiDesign(pkg,design);
  assert.deepEqual(out.ui.sections[0].items[0].config.quickAdd,[1]);
});

test('materializer rejects invalid quickAdd instead of dropping it silently',()=>{
  const {pkg,design}=quickAddFixture('50');
  assert.throws(
    ()=>materializeUiDesign(pkg,design),
    /quickAdd must be a finite number or a non-empty array of finite numbers/,
  );
});

test('materializer preserves canonical runtime compatibility metadata and section identity',()=>{
  const pkg={
    machine:{machineId:'TEST_CANONICAL_COMPAT'},
    inputs:{inputs:[
      {id:'INP_GAMES',name:'old games',type:'number'},
      {id:'INP_COUNT',name:'old count',type:'counter'},
      {id:'INP_EVI_END',name:'old evidence',type:'enum'},
    ]},
    ui:{sections:[]},
  };
  const design={
    schemaVersion:'ui-design-data-v1',
    machineId:'TEST_CANONICAL_COMPAT',
    status:'PASS',
    sectionOrder:['主要入力','設定確定・否定情報'],
    sections:{
      '主要入力':{inputIds:['INP_GAMES','INP_COUNT'],collapsible:false},
      '設定確定・否定情報':{inputIds:[],evidenceIds:['EVI_UI_END'],collapsible:false},
    },
    inputContracts:{
      INP_GAMES:{name:'通常ゲーム数',mode:'NUMBER',gridSpan:12,directInput:true},
      INP_COUNT:{name:'初当り回数',mode:'COUNTER',gridSpan:6,directInput:true,compact:true},
    },
    evidenceContracts:{EVI_UI_END:{label:'終了画面',selectionMode:'single',sourceEvidenceGroupId:'END'}},
    unresolved:[],
    auditNotes:[],
  };
  const out=materializeUiDesign(pkg,design);
  assert.equal(out.inputs.inputs[0].uiGridSpan,12);
  assert.equal(out.inputs.inputs[1].uiGridSpan,6);
  assert.equal(out.inputs.inputs[1].uiCompactCounter,true);
  assert.equal(out.inputs.inputs[0].uiDirectInput,undefined);
  assert.equal(out.ui.sections[0].id,'UID_主要入力_1');
  assert.equal(out.ui.sections[1].id,'UID_設定確定_否定情報_2');
  assert.equal(out.ui.sections[0].items[0].config,undefined);
  assert.deepEqual(out.ui.sections[0].items[1].config,{compact:true});
  assert.deepEqual(out.ui.canonicalUiDesign,{schemaVersion:'ui-design-data-v1',materialized:true});
  assert.equal(out.metadata.uiDesignMaterialized,true);
});

test('canonical materialization is idempotent',()=>{
  const {pkg,design}=quickAddFixture([1,50]);
  design.inputContracts.INP_X.gridSpan=6;
  design.inputContracts.INP_X.compact=true;
  const once=materializeUiDesign(pkg,design);
  const twice=materializeUiDesign(once,design);
  assert.deepEqual(twice,once);
});
