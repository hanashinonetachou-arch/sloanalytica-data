import test from 'node:test';
import assert from 'node:assert/strict';
import { applyUiDesignToMachinePackage } from '../tools/apply-ui-design-to-machine-package.mjs';

test('UI Design compiles section descriptions, input contracts, evidence placement and quick input into MachinePackage',()=>{
  const pkg={machine:{machineId:'TEST_MACHINE'},inputs:{inputs:[
    {id:'INP_GAMES',name:'Games',type:'integer'},
    {id:'INP_COUNT',name:'Count',type:'counter'},
    {id:'INP_EVI_TEST_GROUP',name:'Evidence',type:'multi_enum'},
  ]},ui:{sections:[{id:'OLD',title:'Old',items:[]}]}};
  const selection={machineId:'TEST_MACHINE',evidenceUi:{groups:[{groupId:'TEST_GROUP',label:'Evidence',options:[]}]}};
  const ui={schemaVersion:'ui-design-data-v1',machineId:'TEST_MACHINE',status:'PASS_WITH_UNRESOLVED',
    sectionOrder:['通常時','確定情報'],sections:{
      '通常時':{inputIds:['INP_GAMES','INP_COUNT'],evidenceIds:[],description:'通常時を記録。',collapsible:true},
      '確定情報':{inputIds:[],evidenceIds:['EV_TEST'],description:'確定情報。',collapsible:true},
    },
    inputContracts:{
      INP_GAMES:{name:'通常ゲーム数',mode:'NUMBER',gridSpan:12,directInput:true},
      INP_COUNT:{name:'回数',mode:'COUNTER',gridSpan:6,directInput:true,compact:true,quickInput:true,quickStep:1},
    },
    evidenceContracts:{EV_TEST:{label:'確定情報',selectionMode:'multi',sourceEvidenceGroupId:'TEST_GROUP',inheritOptions:true}},
    quickInputContract:{enabled:true,selectableSections:['通常時'],inputIds:['INP_COUNT']},unresolved:['実機確認待ち'],auditNotes:[]};
  const out=applyUiDesignToMachinePackage(structuredClone(pkg),ui,selection);
  assert.equal(out.ui.sections.length,2);
  assert.equal(out.ui.sections[0].description,'通常時を記録。');
  assert.equal(out.ui.sections[0].items[1].config.compact,true);
  assert.equal(out.ui.sections[0].items[1].config.quickAdd,1);
  assert.equal(out.ui.sections[1].items[0].inputId,'INP_EVI_TEST_GROUP');
  assert.equal(out.ui.quickInputContract.enabled,true);
  assert.equal(out.ui.designContract.source,'research/TEST_MACHINE/ui-design-data.json');
});
