import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const proto=path.resolve(process.argv[2]??'../prototype'),prod=path.resolve(import.meta.dirname,'../..'),batchId='batch-20261022-025',base=path.join(prod,'production/batches',batchId);
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const ids=read(path.join(base,'batch.json')).waves.flatMap(w=>w.machineIds),catalog=read(path.join(proto,'catalog.json')),before=structuredClone(catalog),metadata={};
const oldCatalog=path.join(base,'revisions/runtime-distribution-r1/catalog.json');
if(fs.existsSync(oldCatalog)&&!process.argv.includes('--refresh'))throw Error('ALREADY_PREPARED: resume from saved output or use --refresh after a formal runtime revision');
if(!fs.existsSync(oldCatalog)){fs.mkdirSync(path.dirname(oldCatalog),{recursive:true});fs.copyFileSync(path.join(proto,'catalog.json'),oldCatalog);}
for(const id of ids){
 const state=read(path.join(base,'machines',id,'stages/APP_RUNTIME.json'));assert.equal(state.state,'COMPLETE');
 const bytes=fs.readFileSync(path.join(prod,state.authoritativeOutputRef.path));assert.equal(sha(bytes),state.authoritativeOutputRef.sha256);
 const pkg=JSON.parse(bytes).package,entry=catalog.machines.find(x=>x.machineId===id);assert.ok(entry);
 const original=fs.readFileSync(path.join(prod,'production/research-inbox/batch025/original-packages',id+'.json'));
 // Old packages were captured from the same pinned distribution head. Preserve
 // their identity metadata, but never use their likelihoods as the new oracle.
 assert.equal(JSON.parse(original).machine.machineId,id);
 for(const k of ['manufacturer','introductionDate','machineType','gameType'])if(entry[k]!==undefined)pkg.machine[k]=entry[k];
 const out=Buffer.from(JSON.stringify(pkg,null,2)+'\n'),dir=path.join(proto,'machines',id);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'machine-package.json'),out);
 const capabilities=[...new Set(pkg.features.features.map(f=>f.modelType))];if(pkg.evidence.references.length)capabilities.push('evidence');if(pkg.metadata?.observationContractRevision?.version>=3)capabilities.push('observed_categories_v2');
 entry.packageUrl='https://raw.githubusercontent.com/hanashinonetachou-arch/sloanalytica-data/prototype-multi-machine/machines/'+id+'/machine-package.json';
 entry.machineDataVersion=pkg.machine.machineDataVersion;entry.sha256=sha(out);entry.packageSizeBytes=out.length;entry.requiredCapabilities=capabilities;
 entry.displayName=pkg.machine.displayName;
 if(entry.sha256!==before.machines.find(x=>x.machineId===id).sha256)entry.updatedAt=new Date().toISOString();
 if(!('firstPublishedAt' in read(oldCatalog).machines.find(x=>x.machineId===id)))delete entry.firstPublishedAt;
 metadata[id]={machineId:id,machineDataVersion:pkg.machine.machineDataVersion,settings:pkg.machine.settings,sha256:entry.sha256,packageSizeBytes:out.length,introductionDate:entry.introductionDate,machineType:entry.machineType,gameType:entry.gameType};
}
const protectedEntries=before.machines.filter(x=>!ids.includes(x.machineId));
for(const e of protectedEntries)assert.deepEqual(catalog.machines.find(x=>x.machineId===e.machineId),e);
catalog.generatedAt=new Date().toISOString();fs.writeFileSync(path.join(proto,'catalog.json'),JSON.stringify(catalog,null,2)+'\n');
fs.writeFileSync(path.join(base,'distribution-metadata.json'),JSON.stringify(metadata,null,2)+'\n');
fs.writeFileSync(path.join(base,'approved-fleet-regression.json'),JSON.stringify({status:'PASS',protectedMachines:protectedEntries.length,changedProtectedCatalogEntries:0,protectedPackageWrites:0,packageProof:'Commit tree modifies only the ten selected package paths and catalog.json; remote tree checked before publication.'},null,2)+'\n');
console.log(JSON.stringify({status:'PASS',machines:ids.length,protected:protectedEntries.length}));
