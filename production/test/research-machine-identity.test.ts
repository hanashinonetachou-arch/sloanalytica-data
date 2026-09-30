import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {RepoStore} from '../src/core.ts';
import {validateResearchArtifacts} from '../src/research-validator.ts';

const sha=(b:Buffer)=>crypto.createHash('sha256').update(b).digest('hex');

function run(doc:any){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'identity-gate-'));
  const s=new RepoStore(root);
  const p=s.p('artifacts','research.json');
  fs.mkdirSync(path.dirname(p),{recursive:true});
  const bytes=Buffer.from(JSON.stringify(doc));
  fs.writeFileSync(p,bytes);
  const attempt:any={stage:'RESEARCH',batchId:doc.batchId,machineId:doc.machineId};
  const result:any={status:'SUCCESS',workId:doc.workId,producedArtifacts:[{kind:'research',producerWorkId:doc.workId,sha256:sha(bytes),path:'production/artifacts/research.json'}]};
  return validateResearchArtifacts(s,attempt,result);
}

const base=()=>({
  schemaVersion:'research-v1',
  manifestVersion:'8.5',
  batchId:'b',
  machineId:'S_CODE_GEASS3_CC_FS',
  machineName:'パチスロ コードギアス 反逆のルルーシュ3 C.C.&Kallen ver.',
  workId:'w',
  machineIdentity:{
    formalName:'パチスロ コードギアス 反逆のルルーシュ3 C.C.&Kallen ver.',
    typeCode:'2S1060',
    manufacturer:'株式会社ロデオ',
    introduced:'2023-06-05',
    generation:'6.5号機',
    gameType:'ボーナス+AT'
  },
  sources:[
    {sourceId:'official',url:'https://www.sammy.co.jp/example',title:'official',sourceType:'official',claims:['identity'],sourceMachineIdentity:{machineName:'パチスロ コードギアス 反逆のルルーシュ3 C.C.&Kallen ver.',manufacturer:'株式会社ロデオ',introduced:'2023-06',generation:'6.5号機',gameType:'ボーナス+AT',matchStatus:'MATCH'}},
    {sourceId:'regulatory',url:'https://police.example.jp/example.pdf',title:'regulatory',sourceType:'regulatory',claims:['identity'],sourceMachineIdentity:{machineName:'S コードギアス3C.C. FS',typeCode:'2S1060',manufacturer:'株式会社ロデオ',matchStatus:'MATCH'}}
  ],
  findings:[{findingId:'f',label:'rate',observationType:'probability',sourceIds:['official'],settingDistribution:{'1':'1/100','6':'1/80'}}],
  blockedItems:[]
});

test('machine identity gate accepts independently corroborated Code Geass 3 C.C.&Kallen identity',()=>{
  assert.equal(run(base())[0].ok,true);
});

test('machine identity gate rejects R2 C.C. source contamination for Code Geass 3 target',()=>{
  const d=base();
  d.sources[1].sourceMachineIdentity={machineName:'パチスロ コードギアス 反逆のルルーシュR2 C.C.ver.',typeCode:'7S1251',manufacturer:'Sammy',introduced:'2018-01',generation:'5号機',gameType:'ボーナス+RT',matchStatus:'MATCH'};
  assert.throws(()=>run(d),/SOURCE_MACHINE_(NAME|TYPE|MANUFACTURER|INTRODUCED|GENERATION|GAME_TYPE)_MISMATCH/);
});
