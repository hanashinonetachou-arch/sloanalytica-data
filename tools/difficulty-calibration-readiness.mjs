import fs from 'node:fs';
import path from 'node:path';

const FINAL_QUALITIES=new Set(['EXACT','DERIVED']);
function readJson(file){return JSON.parse(fs.readFileSync(file,'utf8'));}
function exists(file){return fs.existsSync(file);}
function selectionStatus(selection){
  const inferenceNumeric=(selection?.features??[]).filter(f=>['INCLUDE_PRIMARY','INCLUDE_SUPPORT'].includes(f.adoptionCategory));
  const excluded=inferenceNumeric.filter(f=>f.difficultyParticipation==='EXCLUDE');
  const numeric=inferenceNumeric.filter(f=>f.difficultyParticipation!=='EXCLUDE');
  const missing=numeric.filter(f=>!f.difficultyExposure).map(f=>f.featureId??f.researchFeatureId??'UNKNOWN');
  const blocked=numeric.filter(f=>f.difficultyExposure&&!FINAL_QUALITIES.has(f.difficultyExposure.quality??'EXACT')).map(f=>({featureId:f.featureId??f.researchFeatureId??'UNKNOWN',quality:f.difficultyExposure.quality??'EXACT'}));
  const usable=numeric.filter(f=>f.difficultyExposure&&FINAL_QUALITIES.has(f.difficultyExposure.quality??'EXACT'));
  const basis=selection?.difficultyAnalysis?.targetGameBasis??null;
  const basisUsable=numeric.length===0?null:(!!basis&&FINAL_QUALITIES.has(basis.quality)&&basis.crossMachineComparable===true);
  let status='READY';
  if(numeric.length===0)status='CALIBRATION_NOT_APPLICABLE';
  else if(missing.length===numeric.length)status='EXPOSURE_NOT_CONFIGURED';
  else if(missing.length||blocked.length)status='EXPOSURE_PARTIAL';
  if(!basisUsable&&status==='READY')status='GAME_BASIS_NOT_COMPARABLE';
  return {
    inferenceNumericFeatureCount:inferenceNumeric.length,
    explicitlyExcludedNumericFeatureCount:excluded.length,
    explicitlyExcludedNumericFeatures:excluded.map(f=>({featureId:f.featureId??f.researchFeatureId??'UNKNOWN',reason:f.difficultyExclusionReason??null})),
    numericFeatureCount:numeric.length,
    difficultyExposureConfiguredCount:numeric.length-missing.length,
    finalCalibrationUsableFeatureCount:usable.length,
    missingDifficultyExposureFeatureIds:missing,
    blockedDifficultyExposureFeatures:blocked,
    targetGameBasis:basis,
    targetGameBasisUsableForFinalCalibration:basisUsable,
    status
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
    let selectionCheck=null;
    if(hasSelection){
      selectionCheck=selectionStatus(readJson(selectionPath));
      if(['EXPOSURE_NOT_CONFIGURED','EXPOSURE_PARTIAL'].includes(selectionCheck.status))blockers.push('DIFFICULTY_EXPOSURE_INCOMPLETE');
      if(selectionCheck.status!=='CALIBRATION_NOT_APPLICABLE' && !selectionCheck.targetGameBasisUsableForFinalCalibration)blockers.push('TARGET_GAME_BASIS_NOT_FINAL_COMPARABLE');
      if(selectionCheck.status!=='CALIBRATION_NOT_APPLICABLE' && selectionCheck.blockedDifficultyExposureFeatures.length)blockers.push('NON_FINAL_EXPOSURE_QUALITY_PRESENT');
    }
    return {
      ...entry,
      paths:{researchData:hasResearch?path.relative(root,researchPath):null,selectionData:hasSelection?path.relative(root,selectionPath):null,machinePackage:hasPackage?path.relative(root,packagePath):null},
      sourceAvailability:{researchData:hasResearch,selectionData:hasSelection,machinePackage:hasPackage},
      selectionCheck,
      readiness:selectionCheck?.status==='CALIBRATION_NOT_APPLICABLE'?'NOT_APPLICABLE':(blockers.length===0?'READY':'NOT_READY'),
      blockers
    };
  });
  const readyCount=machines.filter(m=>m.readiness==='READY').length;
  const notApplicableCount=machines.filter(m=>m.readiness==='NOT_APPLICABLE').length;
  const eligibleCount=machines.length-notApplicableCount;
  const notReadyEligibleCount=machines.filter(m=>m.readiness==='NOT_READY').length;
  return {
    reportVersion:'difficulty-calibration-readiness-v1.1',
    phase:manifest.phase,
    generatedAt:new Date().toISOString(),
    targetGames:manifest.targetGames,
    summary:{targetMachineCount:machines.length,scoreEligibleMachineCount:eligibleCount,readyMachineCount:readyCount,notApplicableMachineCount:notApplicableCount,notReadyEligibleMachineCount:notReadyEligibleCount,allScoreEligibleReady:notReadyEligibleCount===0},
    machines,
    nextAction:notReadyEligibleCount===0?'RUN_CROSS_MACHINE_CALIBRATION':'RESOLVE_BLOCKERS_BEFORE_SCORING',
    policy:'Final cross-machine calibration requires ResearchData, SelectionData, explicit difficultyExposure, EXACT/DERIVED exposure quality, and an EXACT/DERIVED cross-machine-comparable target game basis for score-eligible machines. Machines with no adopted numeric inference Feature are NOT_APPLICABLE rather than blockers. PROVISIONAL and unresolved exposure must never be silently promoted.'
  };
}

if(import.meta.url===`file://${process.argv[1]}`){
  const root=process.argv[2]??'.';
  const out=process.argv[3];
  const report=buildCalibrationReadiness(root);
  const text=JSON.stringify(report,null,2)+'\n';
  if(out){fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,text);console.log(`Calibration readiness: ${out}`);}else process.stdout.write(text);
}
