import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectResearchPageRetrieval} from '../src/research-source-retrieval.ts';

test('A successful outage page cannot certify machine research content',()=>{
 const result=inspectResearchPageRetrieval(200,
  '<title>パチマガスロマガMobileの接続障害に関するお詫びと進捗状況</title>',
  ['スマスロ 緑ドン VIVA!情熱南米編 REVIVAL']);
 assert.equal(result.status,'SERVICE_NOTICE_NOT_MACHINE_CONTENT');
});
test('Search-related words elsewhere do not substitute for the retrieved machine identity',()=>{
 const result=inspectResearchPageRetrieval(200,
  '<title>Lパチスロ 炎炎ノ消防隊2</title><p>エンディング中レア役設定示唆</p>',
  ['シスタークエスト']);
 assert.equal(result.status,'MACHINE_TITLE_NOT_CONFIRMED');
});
test('A matching title remains unreviewed, while HTTP errors and empty aliases fail closed',()=>{
 const html='<title>スマスロ 緑ドン VIVA！情熱南米編 REVIVAL（パチスロ）</title>';
 assert.equal(inspectResearchPageRetrieval(200,html,['スマスロ 緑ドン VIVA!情熱南米編 REVIVAL']).status,
  'MACHINE_TITLE_CONFIRMED_CLAIMS_UNREVIEWED');
 assert.equal(inspectResearchPageRetrieval(403,html,['緑ドン']).status,'HTTP_ERROR');
 assert.throws(()=>inspectResearchPageRetrieval(200,html,[]),/ALIASES_REQUIRED/);
});
