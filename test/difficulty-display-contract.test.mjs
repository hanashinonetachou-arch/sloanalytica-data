import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('standalone Difficulty Catalog covers all catalog machines',()=>{
 const c=JSON.parse(fs.readFileSync('catalog.json'));
 const d=JSON.parse(fs.readFileSync('difficulty-catalog.json'));
 assert.equal(d.entries.length,c.machines.length);
 const ids=new Set(d.entries.map(e=>e.machineId));
 for(const m of c.machines)assert.ok(ids.has(m.machineId),m.machineId);
});
test('MachineData no longer embeds difficulty display metadata',()=>{
 for(const dir of fs.readdirSync('machines')){
  const p=`machines/${dir}/machine-package.json`;if(!fs.existsSync(p))continue;
  const pkg=JSON.parse(fs.readFileSync(p));
  assert.equal(pkg.difficulty,undefined,dir);
 }
});
test('Kaguya evidence-dominant catalog entry has no numeric score and no internal wording',()=>{
 const d=JSON.parse(fs.readFileSync('difficulty-catalog.json'));
 const k=d.entries.find(e=>e.machineId==='L_KAGUYA_SAMA_JA').difficulty;
 assert.equal(k.status,'EVIDENCE_DOMINANT');
 assert.deepEqual(k.scores,[]);
 assert.ok((k.rejectedFeatures||[]).every(r=>!/Hard\s*Evidence/i.test(r.reason||'')));
});

test('catalog recent order follows addedAt and Funky Juggler 2 is newest',()=>{
 const c=JSON.parse(fs.readFileSync('catalog.json'));
 const sorted=[...c.machines].sort((a,b)=>(b.addedAt??'').localeCompare(a.addedAt??''));
 assert.deepEqual(c.machines.slice(0,5).map(x=>x.machineId),sorted.slice(0,5).map(x=>x.machineId));
 assert.equal(c.machines[0].machineId,'S_FUNKY_JUGGLER_2_KT');
});

test('difficulty catalog machineDataVersion matches catalog',()=>{
 const c=JSON.parse(fs.readFileSync('catalog.json'));
 const d=JSON.parse(fs.readFileSync('difficulty-catalog.json'));
 const byId=new Map(d.entries.map(e=>[e.machineId,e]));
 for(const m of c.machines){
  const entry=byId.get(m.machineId);
  if(entry?.machineDataVersion!==undefined) assert.equal(entry.machineDataVersion,m.machineDataVersion,m.machineId);
 }
});
