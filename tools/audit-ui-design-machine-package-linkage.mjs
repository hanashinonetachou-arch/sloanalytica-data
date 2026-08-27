#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyUiDesignToMachinePackage } from './apply-ui-design-to-machine-package.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ids=process.argv.slice(2).filter(a=>!a.startsWith('--'));
if(!ids.length){ console.error('Usage: node tools/audit-ui-design-machine-package-linkage.mjs <MACHINE_ID...>'); process.exit(2); }
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const stable=v=>JSON.stringify(v);
let failed=0;
for(const id of ids){
  try{
    const dir=path.join(ROOT,'research',id);
    const machinePath=path.join(ROOT,'machines',id,'machine-package.json');
    const uiPath=path.join(dir,'ui-design-data.json');
    const selectionPath=path.join(dir,'selection-data.json');
    if(!fs.existsSync(machinePath)) throw new Error('machine-package.json missing');
    const actual=read(machinePath);
    const expected=applyUiDesignToMachinePackage(structuredClone(actual),read(uiPath),read(selectionPath));
    if(stable(actual.ui)!==stable(expected.ui)) throw new Error('MachinePackage UI does not match current UI Design contract; run apply-ui-design-to-machine-package.mjs');
    console.log(`PASS UI Design -> MachinePackage: ${id}`);
  }catch(e){ failed++; console.error(`ERROR ${id}: ${e instanceof Error?e.message:String(e)}`); }
}
console.log(`UI Design -> MachinePackage linkage: ${failed?'FAIL':'PASS'} / machines ${ids.length} / errors ${failed}`);
if(failed) process.exit(1);
