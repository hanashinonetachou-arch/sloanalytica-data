import fs from 'node:fs';
import path from 'node:path';

function readJson(file){return JSON.parse(fs.readFileSync(file,'utf8'));}
function exists(file){return fs.existsSync(file);}
function selectionStatus(selection){
  const numeric=(selection?.features??[]).filter(f=>['INCLUDE_PRIMARY','INCLUDE_SUPPORT'].includes(f.adoptionCategory));
  const missing=numeric.filter(f=>!f.difficultyExposure).map(f=>f.featureId??f.researchFeatureId??'UNKNOWN');
  return {
    numericFeatureCount:numeric.length,
    difficultyExposureConfiguredCount:numeric.length-missing.length,
    missingDifficultyExposureFeatureIds:missing,
    status:numeric.length===0?'NO_NUMERIC_FEATURES':missing.length===0?'READY':missing.length===numeric.length?'EXPOSURE_NOT_CONFIGURED':'EXPOSURE_PARTIAL'
  };
}

export function buildCalibrationReadiness(root='.', manifestPath='difficulty-calibration.json'){
  const manifest=readJson(path.resolve(root,manifestPath));
  const machines=manifest.machines.map(entry=>{
    if(!entry.machineId){
      return {...entry,readiness:'NOT_READY',blockers:['MACHINE_ID_PENDING','RESEARCH_DATA_MISSING','SELECTION_DATA_MISSING']};
    }
    const researchPath=path.join(root,'research',entry.machineId,'research-data.json');
    const selectionPath=path.join(root,'research',entry.machineId,'selection-data.json');
    const packagePath=path.join(root,'machines',entry.machineId,'machine-package.json');
    const hasResearch=exists(researchPath),hasSelection=exists(selectionPath),hasPackage=exists(packagePath);
    const blockers=[];
    if(!hasResearch)blockers.push('RESEARCH_DATA_MISSING');
    if(!hasSelection)blockers.push('SELECTION_DATA_MISSING');
    let selection=null,selectionCheck=null;
    if(hasSelection){
      selection=readJson(selectionPath);
      selectionCheck=selectionStatus(selection);
      if(['EXPOSURE_NOT_CONFIGURED','EXPOSURE_PARTIAL'].includes(selectionCheck.status))blockers.push('DIFFICULTY_EXPOSURE_INCOMPLETE');
    }
    return {
      ...entry,
      paths:{researchData:hasResearch?path.relative(root,researchPath):null,selectionData:hasSelection?path.relative(root,selectionPath):null,machinePackage:hasPackage?path.relative(root,packagePath):null},
      sourceAvailability:{researchData:hasResearch,selectionData:hasSelection,machinePackage:hasPackage},
      selectionCheck,
      readiness:blockers.length===0?'READY':'NOT_READY',
      blockers
    };
  });
  const readyCount=machines.filter(m=>m.readiness==='READY').length;
  return {
    reportVersion:'difficulty-calibration-readiness-v1.0',
    phase:manifest.phase,
    generatedAt:new Date().toISOString(),
    targetGames:manifest.targetGames,
    summary:{targetMachineCount:machines.length,readyMachineCount:readyCount,notReadyMachineCount:machines.length-readyCount,allReady:readyCount===machines.length},
    machines,
    nextAction:readyCount===machines.length?'RUN_CROSS_MACHINE_CALIBRATION':'RESOLVE_BLOCKERS_BEFORE_SCORING',
    policy:'Calibration scores must not be compared until every target machine has ResearchData, SelectionData, and explicit difficultyExposure for all included numeric features. Missing exposure must never be inferred.'
  };
}

if(import.meta.url===`file://${process.argv[1]}`){
  const root=process.argv[2]??'.';
  const out=process.argv[3];
  const report=buildCalibrationReadiness(root);
  const text=JSON.stringify(report,null,2)+'\n';
  if(out){fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,text);console.log(`Calibration readiness: ${out}`);}else process.stdout.write(text);
}
