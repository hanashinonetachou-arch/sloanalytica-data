#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { buildMachineData } from './build-machine-data.mjs';
import { materializeUiDesignIntoPackage } from './materialize-ui-design-into-machine-package.mjs';

function read(p){return JSON.parse(fs.readFileSync(p,'utf8'))}

export function buildMachineDataWithUi(research,selection,uiDesign,statistics=null){
  const pkg=buildMachineData(research,selection,statistics);
  return materializeUiDesignIntoPackage(pkg,uiDesign);
}

if(import.meta.url===`file://${process.argv[1]}`){
  const [researchPath,selectionPath,uiPath,outPath,statisticsPath]=process.argv.slice(2);
  if(!researchPath||!selectionPath||!uiPath||!outPath){
    console.error('Usage: node tools/build-machine-data-with-ui.mjs <research-data.json> <selection-data.json> <ui-design-data.json> <output-machine-package.json> [statistics-report.json]');
    process.exit(2);
  }
  try{
    const pkg=buildMachineDataWithUi(read(researchPath),read(selectionPath),read(uiPath),statisticsPath?read(statisticsPath):null);
    fs.mkdirSync(path.dirname(outPath),{recursive:true});
    fs.writeFileSync(outPath,JSON.stringify(pkg,null,2)+'\n');
    console.log(`MachineData + canonical UI: ${outPath}`);
  }catch(e){console.error(e.stack??e.message);process.exit(1)}
}
