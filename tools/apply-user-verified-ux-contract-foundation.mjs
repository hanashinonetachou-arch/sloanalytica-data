import fs from 'node:fs';

function readJson(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }
function writeJson(p,v){ fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n'); }
function replaceOnce(text, from, to, label){
  if(!text.includes(from)) throw new Error(`cannot find ${label}`);
  return text.replace(from,to);
}

const builderPath='tools/build-machine-data.mjs';
let builder=fs.readFileSync(builderPath,'utf8');
const oldUi=`        ...((i.uiDirectInput===false||i.uiCompactCounter===true)?{config:{...(i.uiDirectInput===false?{directInput:false}:{}),...(i.uiCompactCounter===true?{compact:true}:{})}}:{}),`;
const newUi=`        ...((i.uiDirectInput===false||i.uiCompactCounter===true||i.uiQuickAdd!==undefined)?{config:{...(i.uiDirectInput===false?{directInput:false}:{}),...(i.uiCompactCounter===true?{compact:true}:{}),...(i.uiQuickAdd!==undefined?{quickAdd:i.uiQuickAdd}:{})}}:{}),`;
builder=replaceOnce(builder,oldUi,newUi,'builder UI config mapping');
fs.writeFileSync(builderPath,builder);

const validatorPath='tools/validate-selection-data.mjs';
let validator=fs.readFileSync(validatorPath,'utf8');
const oldInputCheck=`   if(i.parentInputId && !idset.has(i.parentInputId)) errors.push(\`${'${i.id}'}: unknown parentInputId ${'${i.parentInputId}'}\`);\n }`;
const newInputCheck=`   if(i.parentInputId && !idset.has(i.parentInputId)) errors.push(\`${'${i.id}'}: unknown parentInputId ${'${i.parentInputId}'}\`);\n   if(i.uiQuickAdd!==undefined){\n     const values=Array.isArray(i.uiQuickAdd)?i.uiQuickAdd:[i.uiQuickAdd];\n     if(values.length===0||values.some(v=>!Number.isFinite(Number(v))||Number(v)<=0)) errors.push(\`${'${i.id}'}: uiQuickAdd must be a positive number or non-empty positive-number array\`);\n   }\n }`;
validator=replaceOnce(validator,oldInputCheck,newInputCheck,'selection uiQuickAdd validation');
fs.writeFileSync(validatorPath,validator);

const guardPath='tools/guard-machine-pipeline.mjs';
let guard=fs.readFileSync(guardPath,'utf8');
const oldImport=`import { validateResearchCompleteness, validateSelectionEvidenceCoverage } from './batch-completeness-gates.mjs';`;
const newImport=`import { validateResearchCompleteness, validateSelectionEvidenceCoverage } from './batch-completeness-gates.mjs';\nimport { auditUserVerifiedUxContracts } from './audit-user-verified-ux-contracts.mjs';`;
guard=replaceOnce(guard,oldImport,newImport,'guard audit import');
const oldFinally=`  status = r.status ?? 1;\n} finally {`;
const newFinally=`  status = r.status ?? 1;\n  if(status===0){\n    const ux=auditUserVerifiedUxContracts({ machineIds: machineIds.length ? machineIds : null });\n    for(const review of ux.reviews) console.warn(\`REVIEW [user-verified UX] ${'${review}'}\`);\n    for(const error of ux.errors) console.error(\`ERROR [user-verified UX] ${'${error}'}\`);\n    if(!ux.ok) status=1;\n  }\n} finally {`;
guard=replaceOnce(guard,oldFinally,newFinally,'guard post-build UX audit');
fs.writeFileSync(guardPath,guard);

const packagePath='package.json';
const pkg=readJson(packagePath);
pkg.scripts['ux-contract:audit']='node tools/audit-user-verified-ux-contracts.mjs';
writeJson(packagePath,pkg);

const selectionPath='research/S_CODE_GEASS_3_CC_FS/selection-data.json';
const selection=readJson(selectionPath);
const highGames=selection.inputs.find(i=>i.id==='INP_RB_CC_HIGH_GAMES');
if(!highGames) throw new Error('INP_RB_CC_HIGH_GAMES missing');
highGames.uiQuickAdd=50;
selection.machineDataVersion='0.1.10';
writeJson(selectionPath,selection);

console.log('Applied user-verified UX contract foundation and C.C. +50G restoration.');
