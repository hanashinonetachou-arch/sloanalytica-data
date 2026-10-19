import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

// Presentation-only QA revision; retain the accepted pipeline outputs as history.
const root=path.resolve(import.meta.dirname,'../..');
const distribution=path.resolve(process.argv[2]??'../distribution');
const mid='L_MAHJONG_FIGHT_CLUB_KAKUSEI_KM';
const relative=`machines/${mid}/machine-package.json`;
const bytes=fs.readFileSync(path.join(distribution,relative));
const before=JSON.parse(bytes),pkg=structuredClone(before);
assert.equal(before.machine.machineDataVersion,'8.5.1-batch-20261018-023');
const meanings={
  'デフォルト':'基本画面（全設定で出現）',
  '女性プロ雀士':'偶数設定示唆',
  '男性プロ雀士':'奇数設定示唆',
};
let replacements=0;
function revise(value){
  if(Array.isArray(value))return value.map(revise);
  if(value&&typeof value==='object'){
    const out=Object.fromEntries(Object.entries(value).map(([k,v])=>[k,revise(v)]));
    if(out.meaning==='出現率確認済み'&&meanings[out.label]){out.meaning=meanings[out.label];replacements++;}
    return out;
  }
  if(typeof value==='string')for(const [label,meaning] of Object.entries(meanings))value=value.replaceAll(`${label}：出現率確認済み`,`${label}：${meaning}`);
  return value;
}
const revised=revise(pkg);
assert.equal(replacements,6);
revised.machine.machineDataVersion='8.5.2-batch-20261018-023';
assert(!JSON.stringify(revised).includes('出現率確認済み'));
// All changes must be display text or the package version, including nested models.
const differences=[];
function compare(a,b,p=''){
  if(a&&typeof a==='object'){assert.deepEqual(Object.keys(a),Object.keys(b),p);for(const k of Object.keys(a))compare(a[k],b[k],p+'/'+k);}
  else if(a!==b){assert(p==='/machine/machineDataVersion'||p.endsWith('/meaning')||p.endsWith('/description'),p);differences.push({path:p,before:a,after:b});}
}
compare(before,revised);
assert.equal(differences.length,8);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const output=Buffer.from(JSON.stringify(revised,null,2)+'\n');
const cp=path.join(distribution,'catalog.json'),catalog=JSON.parse(fs.readFileSync(cp));
const previous=structuredClone(catalog),entry=catalog.machines.find(x=>x.machineId===mid);
assert.equal(entry.sha256,sha(bytes));
const now=new Date().toISOString();
Object.assign(entry,{machineDataVersion:revised.machine.machineDataVersion,sha256:sha(output),packageSizeBytes:output.length,updatedAt:now});
catalog.generatedAt=now;
for(const old of previous.machines.filter(x=>x.machineId!==mid))assert.deepEqual(catalog.machines.find(x=>x.machineId===old.machineId),old);
fs.writeFileSync(path.join(distribution,relative),output);
fs.writeFileSync(cp,JSON.stringify(catalog,null,2)+'\n');
for(const e of catalog.machines.filter(x=>x.status==='available')){
  const b=fs.readFileSync(path.join(distribution,`machines/${e.machineId}/machine-package.json`));
  assert.equal(sha(b),e.sha256,e.machineId);assert.equal(b.length,e.packageSizeBytes,e.machineId);
}
const dir=path.join(root,'production/batches/batch-20261018-023/qa-revisions/20261020-mahjong-screen-copy');
fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'machine-package.json'),output);
fs.writeFileSync(path.join(dir,'revision.json'),JSON.stringify({
  schemaVersion:'device-qa-presentation-revision-v1',machineId:mid,recordedAt:now,
  reason:'Replace research-status placeholders with the actual ending-screen meanings.',
  sourceUrl:'https://nana-press.com/kaiseki/machine/604/16782/',
  baseDistributionCommit:'07140099196725512935711d6b8063b43cefec0d',
  previousSha256:sha(bytes),sha256:sha(output),machineDataVersion:entry.machineDataVersion,
  statisticalModelsUnchanged:true,inputIdsUnchanged:true,settingConstraintsUnchanged:true,
  protectedCatalogEntriesUnchanged:previous.machines.length-1,
  availablePackageIntegrityVerified:catalog.machines.filter(x=>x.status==='available').length,
  deviceQA:'AWAITING_USER_DEVICE_QA',differences,
},null,2)+'\n');
console.log(JSON.stringify({status:'PASS',version:entry.machineDataVersion,changes:differences.length,sha256:sha(output)}));
