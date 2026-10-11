import test from 'node:test';
import assert from 'node:assert/strict';
import {applyUiPresentation,validateUiPresentation} from '../src/ui-presentation.ts';

const numeric=[{id:'OBS_a',inputs:[{id:'a.trial',role:'trial'},{id:'a.success',role:'success'}]},{id:'OBS_b',inputs:[{id:'b.trial',role:'trial'},{id:'b.success',role:'success'}]},{id:'OBS_c',inputs:[{id:'c.trial',role:'trial'}]}];
const policy=(groups:any[])=>({hiddenDerivedFindingIds:[],sectionOrder:[],evidenceSectionMerges:[],tabGroups:groups});
const group=(id:string,ids:string[])=>({id,title:'同一観測機会',tabs:ids.map((sectionId,i)=>({sectionId,label:'条件'+i}))});
test('tabbed sections retain their independent input identities',()=>{
 const p=policy([group('g1',['OBS_a','OBS_b'])]);
 validateUiPresentation(p,numeric,[]);
 const result=applyUiPresentation(numeric,p);
 assert.deepEqual(result.map(x=>x.inputs.map((i:any)=>i.id)),numeric.map(x=>x.inputs.map((i:any)=>i.id)));
 assert.equal(result[0].tabGroup.id,'g1');
 assert.equal(result[1].tabGroup.id,'g1');
 assert.equal(result[2].tabGroup,undefined);
});
test('rejects a section appearing in two groups',()=>{
 const p=policy([group('g1',['OBS_a','OBS_b']),group('g2',['OBS_a','OBS_c'])]);
 assert.throws(()=>validateUiPresentation(p,numeric,[]),/SECTION_IN_MULTIPLE_GROUPS/);
});
test('rejects duplicate group identities and indistinguishable tab labels',()=>{
 assert.throws(()=>validateUiPresentation(policy([group('g1',['OBS_a','OBS_b']),group('g1',['OBS_b','OBS_c'])]),numeric,[]),/GROUP_ID_DUPLICATE/);
 const duplicate=group('g1',['OBS_a','OBS_b']);duplicate.tabs[1].label=duplicate.tabs[0].label;
 assert.throws(()=>validateUiPresentation(policy([duplicate]),numeric,[]),/TAB_LABEL_DUPLICATE/);
});
