export const DISTRIBUTION_VALIDATOR_CONTRACT='distribution-v1';
const canonical=(v:any):string=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const fail=(m:string):never=>{throw new Error('DISTRIBUTION_VALIDATION_FAILED:'+m)};
const validDate=(v:any)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v);
export function validateDistributionDocument(doc:any,appRuntime:any,appRuntimeArtifact:any){
 if(doc?.schemaVersion!=='distribution-v1'||doc?.manifestVersion!=='8.5')fail('HEADER');
 if(doc.batchId!==appRuntime.batchId||doc.machineId!==appRuntime.machineId||doc.machineName!==appRuntime.machineName)fail('IDENTITY');
 if(canonical(doc.sourceArtifact)!==canonical(appRuntimeArtifact))fail('LINKAGE');
 const integration=doc.integration??{};
 if(integration.repository!=='hanashinonetachou-arch/sloanalytica-data'||integration.branch!=='prototype-multi-machine'||typeof integration.commit!=='string'||!/^[0-9a-f]{40}$/.test(integration.commit))fail('INTEGRATION_TARGET');
 if(integration.packagePath!=='machines/'+doc.machineId+'/machine-package.json'||integration.catalogPath!=='catalog.json')fail('INTEGRATION_PATH');
 const pkg=doc.package??{},sourcePkg=appRuntime.package;
 if(pkg.machineDataVersion!==sourcePkg?.machine?.machineDataVersion||pkg.machineId!==doc.machineId)fail('PACKAGE_VERSION');
 if(canonical(pkg.settings)!==canonical(sourcePkg?.machine?.settings))fail('SETTINGS');
 if(typeof pkg.sha256!=='string'||!/^[0-9a-f]{64}$/.test(pkg.sha256)||!Number.isSafeInteger(pkg.packageSizeBytes)||pkg.packageSizeBytes<=0)fail('PACKAGE_INTEGRITY');
 if(!validDate(pkg.introductionDate)||!['SMART_SLOT','MEDAL'].includes(pkg.machineType)||!['A_TYPE','AT','A_AT','A_ART','BT'].includes(pkg.gameType))fail('IDENTITY_METADATA');
 const checks=doc.checks??{};
 if(checks.catalogIntegrity!==true||checks.pagesDeployment?.conclusion!=='success'||checks.uxContractAudit?.conclusion!=='success')fail('BOUNDARY_CHECKS');
 const mi=checks.machineIdentityConsistency;
 if(mi?.batchMachineVerified!==true)fail('MACHINE_IDENTITY_BATCH');
 if(mi.conclusion!=='success'&&mi.conclusion!=='baseline_failure_unrelated')fail('MACHINE_IDENTITY_CONCLUSION');
 if(mi.conclusion==='baseline_failure_unrelated'&&(!Array.isArray(mi.unrelatedMissingAuditEntries)||mi.unrelatedMissingAuditEntries.includes(doc.machineId)))fail('MACHINE_IDENTITY_EXCEPTION');
 return [{validator:DISTRIBUTION_VALIDATOR_CONTRACT,branch:integration.branch,commit:integration.commit,pagesRunId:checks.pagesDeployment.runId,identityConclusion:mi.conclusion}];
}
export function validateDistributionArtifacts(s:any,a:any,r:any){const out=r.producedArtifacts??[];if(out.length!==1)fail('OUTPUT_COUNT');const ref=out[0];if(ref.kind!=='distribution'||typeof ref.path!=='string'||!ref.path.startsWith('production/batches/'+a.batchId+'/artifacts/'+a.machineId+'/distribution/'))fail('OUTPUT_REF');const prefix='production/';const doc=s.read(...ref.path.slice(prefix.length).split('/')),as=s.read('batches',a.batchId,'machines',a.machineId,'stages','APP_RUNTIME.json');if(!as.authoritativeOutputRef?.path)fail('APP_RUNTIME_AUTHORITY_MISSING');const appRuntime=s.read(...String(as.authoritativeOutputRef.path).slice(prefix.length).split('/'));return validateDistributionDocument(doc,appRuntime,as.authoritativeOutputRef)}
