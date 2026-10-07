export function selectProductionBatch(machines:any[], completedThroughMachineId:string, records:any[], count=10) {
  const ids=machines.map(x=>x.machineId);
  if(new Set(ids).size!==ids.length) throw new Error('CANONICAL_DUPLICATE_ID');
  const cursor=ids.indexOf(completedThroughMachineId);
  if(cursor<0) throw new Error('CURSOR_NOT_IN_CANONICAL_SOURCE');
  const byId=new Map(records.map(x=>[x.machineId,x]));
  const gaps:string[]=[], inconsistencies:any[]=[];
  for(const machineId of ids.slice(0,cursor+1)) {
    const r=byId.get(machineId);
    if(!r) throw new Error('GAP_SCAN_RECORD_MISSING:'+machineId);
    if(['WITHDRAWN','INTENTIONALLY_EXCLUDED'].includes(r.status)) continue;
    const versionOk=String(r.machineDataVersion??'').startsWith('8.5.');
    const manifestOk=r.manifestVersion==='8.5';
    if(!versionOk||!manifestOk) gaps.push(machineId);
    else if(!r.productionArtifact&&!r.legacyMigrationAttestation) inconsistencies.push({machineId,reason:'V85_PACKAGE_WITHOUT_PRODUCTION_ARTIFACT'});
  }
  if(inconsistencies.length) throw new Error('PRODUCTION_PROVENANCE_GAP:'+JSON.stringify(inconsistencies));
  const remaining=ids.slice(cursor+1).filter(id=>!['WITHDRAWN','INTENTIONALLY_EXCLUDED'].includes(byId.get(id)?.status));
  return {completedThroughMachineId,gaps,selected:[...gaps,...remaining].slice(0,count),scanCount:cursor+1};
}
