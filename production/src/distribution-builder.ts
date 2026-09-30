export function buildDistribution(appRuntime:any,appRuntimeArtifact:any,attestation:any){
 if(!attestation||typeof attestation!=='object')throw new Error('DISTRIBUTION_ATTESTATION_REQUIRED');
 return {schemaVersion:'distribution-v1',manifestVersion:'8.5',batchId:appRuntime.batchId,machineId:appRuntime.machineId,machineName:appRuntime.machineName,machineIdentity:structuredClone(appRuntime.machineIdentity),sourceArtifact:appRuntimeArtifact,integration:attestation.integration,package:attestation.package,checks:attestation.checks};
}
