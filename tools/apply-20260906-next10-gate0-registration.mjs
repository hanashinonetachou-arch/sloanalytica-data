import fs from 'node:fs';

const identityPath='research/batches/20260907-next10/gate0-machine-identity.json';
const registryPath='machine-registry.json';
const identity=JSON.parse(fs.readFileSync(identityPath,'utf8'));
const registry=JSON.parse(fs.readFileSync(registryPath,'utf8'));

const targets=identity.machines??[];
if(targets.length!==10) throw new Error(`expected 10 Gate0 targets, got ${targets.length}`);
const expectedIds=targets.map(x=>x.provisionalRegistrationId);
if(expectedIds.join(',')!=='250,251,252,253,254,255,256,257,258,259') throw new Error(`unexpected provisional ID reservation: ${expectedIds.join(',')}`);

const existingIds=new Map((registry.machines??[]).map(x=>[x.machineId,x]));
const existingProv=new Map((registry.machines??[]).filter(x=>Number.isInteger(x.provisionalRegistrationId)).map(x=>[x.provisionalRegistrationId,x]));
const normalize=s=>String(s??'').normalize('NFKC').replace(/[\s・･!！ⅡII]/g,'').toLowerCase();
const existingNames=new Map((registry.machines??[]).map(x=>[normalize(x.displayName),x]));

const duplicateFindings=[];
for(const t of targets){
  if(existingIds.has(t.machineId)) duplicateFindings.push(`${t.machineId}: machineId already exists`);
  if(existingProv.has(t.provisionalRegistrationId)) duplicateFindings.push(`${t.machineId}: provisionalRegistrationId ${t.provisionalRegistrationId} already used by ${existingProv.get(t.provisionalRegistrationId).machineId}`);
  const sameName=existingNames.get(normalize(t.displayName));
  if(sameName) duplicateFindings.push(`${t.machineId}: normalized displayName collides with ${sameName.machineId}`);
}
if(duplicateFindings.length) throw new Error(`Gate0 duplicate audit failed:\n${duplicateFindings.join('\n')}`);

for(const t of targets){
  registry.machines.push({
    provisionalRegistrationId:t.provisionalRegistrationId,
    registrationId:null,
    machineId:t.machineId,
    displayName:t.displayName,
    manufacturer:t.manufacturer,
    releaseDate:t.releaseDate,
    releaseDateStatus:t.releaseDateStatus,
    introducedAt:null,
    marketStatus:'UNKNOWN',
    marketLastCheckedAt:null,
    marketSources:[],
    appStatus:'RESEARCHING',
    researchStatus:'NOT_RESEARCHED',
    fieldTestStatus:'NOT_TESTED',
    machineDataVersion:null,
    priority:'NONE',
    notes:'20260907-next10 Gate 0 canonical identity registration. Research/Selection/Observation/MachineData pending.'
  });
}
registry.machines.sort((a,b)=>String(a.displayName).localeCompare(String(b.displayName),'ja'));
registry.generatedAt=new Date().toISOString();
fs.writeFileSync(registryPath,JSON.stringify(registry,null,2)+'\n');

identity.status='IDENTITY_PASS_DISCOVERY_SEEDED';
identity.gate0Audit={
  auditedAt:new Date().toISOString(),
  targetCount:10,
  provisionalRegistrationIds:[250,251,252,253,254,255,256,257,258,259],
  duplicateMachineIdCount:0,
  duplicateProvisionalIdCount:0,
  normalizedDisplayNameCollisionCount:0,
  identityStatus:'PASS',
  registryRegistrationStatus:'REGISTERED',
  discoveryStatus:'SEEDED',
  note:'Formal Discovery Completeness transfer is evaluated once ResearchData discoveryInventory is materialized; no Selection decisions were made in Discovery.'
};
fs.writeFileSync(identityPath,JSON.stringify(identity,null,2)+'\n');
console.log('PASS 20260907 Next10 Gate0 identity registration: 10 targets / provisional IDs 250-259 / duplicates 0');
