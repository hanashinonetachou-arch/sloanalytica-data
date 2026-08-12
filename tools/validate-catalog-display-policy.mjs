import fs from 'node:fs';
const c=JSON.parse(fs.readFileSync('catalog.json','utf8'));
const expected=['L_KAGUYA_SAMA_JA','L_TOKYO_GHOUL','L_SMASLO_BAKEMONOGATARI_KH','S_REVUE_STARLIGHT_CX','S_CODE_GEASS_3_CC_FS'];
const ids=c.machines.slice(0,5).map(x=>x.machineId);
if(expected.some((id,i)=>ids[i]!==id)){console.error('recent catalog order mismatch',ids);process.exit(1);}
for(const m of c.machines) if((m.requiredCapabilities||[]).includes('difficulty_display')){console.error('difficulty_display must be optional',m.machineId);process.exit(1);}
const k=c.machines.find(x=>x.machineId==='L_KAGUYA_SAMA_JA');
if(k?.minimumAppVersionCode!=null){console.error('Kaguya has unnecessary app-version gate');process.exit(1);}
console.log('Catalog display policy: PASS');
