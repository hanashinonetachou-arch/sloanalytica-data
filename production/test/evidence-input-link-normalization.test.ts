import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveEvidenceInputLinks} from '../src/app-runtime-builder.ts';

function projection(label:string, inputLabels:string[]){
 return {runtimeUi:{numericSections:[{sourceFindingId:'screen',model:'CATEGORICAL',
  inputs:inputLabels.map((label,i)=>({id:'screen.'+i,label,role:'categoryCount'}))}]},
  evidence:[{evidenceItems:[{findingId:'hint',semanticCategories:[{
   label,meaning:'設定6',semanticType:'EXACT_CONSTRAINT',linkedFindingId:'screen'}]}]}]};
}

test('Whitespace differences in an explicit category link reuse the same observation',()=>{
 for(const label of ['水晶姫 クレア','水晶姫\tクレア','水晶姫　クレア']){
  const links=resolveEvidenceInputLinks(projection(label,['平原','水晶姫クレア']));
  assert.equal(links.categoryInputIdByKey.get('hint:0'),'screen.1');
  assert.equal(links.linkedEvidenceIds.has('hint'),true);
 }
});

test('The letter s remains part of a category name and cannot create a false exact match',()=>{
 const links=resolveEvidenceInputLinks(projection('Rose',['Roe','Rose']));
 assert.equal(links.categoryInputIdByKey.get('hint:0'),'screen.1');
});

test('Normalization does not choose between two indistinguishable category inputs',()=>{
 const links=resolveEvidenceInputLinks(projection('水晶姫 クレア',['水晶姫クレア','水晶姫　クレア']));
 assert.equal(links.categoryInputIdByKey.has('hint:0'),false);
 assert.equal(links.linkedEvidenceIds.has('hint'),false);
});
