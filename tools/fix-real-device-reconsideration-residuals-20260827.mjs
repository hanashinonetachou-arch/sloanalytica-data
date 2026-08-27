#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const write=(p,v)=>fs.writeFileSync(path.join(ROOT,p),JSON.stringify(v,null,2)+'\n','utf8');
function fix(machineId,prefix,featureId){
 const base=`research/${machineId}`;const s=read(`${base}/selection-data.json`),u=read(`${base}/ui-design-data.json`);
 const other=`${prefix}_OTHER`;
 s.inputs=(s.inputs??[]).filter(x=>x.id!==other);
 const f=(s.features??[]).find(x=>x.featureId===featureId);
 if(!f)throw new Error(`${machineId}: ${featureId} missing`);
 const ids=[f.numeratorInputId,...(f.categoryInputIds??[])].filter(id=>id!==other);
 f.numeratorInputId=ids[0];f.categoryInputIds=ids.slice(1);f.residualCategoryLabel='OTHER';f.denominatorInputId='INP_NORMAL_GAMES';delete f.denominatorInputIds;delete f.inputTransform;
 for(const sec of Object.values(u.sections??{}))sec.inputIds=(sec.inputIds??[]).filter(id=>id!==other);
 if(u.inputContracts)delete u.inputContracts[other];
 if(u.quickInputContract)u.quickInputContract.inputIds=(u.quickInputContract.inputIds??[]).filter(id=>id!==other);
 const sectionName=machineId==='S_MHW_ICEBORNE_ZF'?'通常時小役':'通常時レア小役';
 if(u.sections?.[sectionName])u.sections[sectionName].description=(machineId==='S_MHW_ICEBORNE_ZF'?'通常時の共通ベル・弱チャンス目・スイカを記録します。':'通常時の弱チェリー・強チェリー・スイカ・チャンス目A/Bを記録します。斬レア小役は対象外です。')+' 「その他」は通常ゲーム数から対象小役回数を差し引いて自動的に残差として扱うため入力不要です。';
 write(`${base}/selection-data.json`,s);write(`${base}/ui-design-data.json`,u);
}
fix('S_MHW_ICEBORNE_ZF','INP_SMALLROLE','FEAT_SMALL_ROLE_COMPOSITION');
fix('L_INUYASHA2_FK','INP_RARE','FEAT_SMALL_ROLE_COMPOSITION');
console.log('Fixed residual small-role categories to derive OTHER from INP_NORMAL_GAMES.');
