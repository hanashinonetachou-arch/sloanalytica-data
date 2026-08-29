#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.cwd();
const researchRoot = path.join(root, 'research');
const V1_STATUS = new Set(['CHECKED', 'NOT_AVAILABLE', 'UNRESOLVED']);
const V2_COVERAGE_STATUS = new Set(['FOUND','CHECKED_NONE','UNRESOLVED','VERIFIED_ON_MACHINE','NOT_REQUIRED']);
const V2_OBSERVATION_STATUS = new Set(['FOUND','CHECKED_NONE','UNRESOLVED','VERIFIED_ON_MACHINE']);
const COVERAGE_KEYS = ['machineMenu','dataCounter','linkedService','directPlay','endEvent','seatedState'];
const SOURCE_TYPES = new Set(['MACHINE_MENU','DATA_COUNTER','LINKED_SERVICE','DIRECT_PLAY','END_EVENT','SEATED_STATE']);
const MODES = new Set(['MANUAL_COUNTER','MENU_READ','DATA_COUNTER_READ','LINKED_SERVICE_READ','DERIVED','VISUAL_EVENT','AUDIO_EVENT']);
const MAPPINGS = new Set(['EXACT','DERIVABLE','COMBINABLE','OPTIONAL_SOURCE','INCOMPATIBLE','UNRESOLVED']);
const VERIFY_STATUS = new Set(['WAITING_FOR_MACHINE','VERIFIED_ON_MACHINE','NOT_REQUIRED']);
const REOPEN_STATUS = new Set(['RESEARCH_REOPEN_REQUIRED','RESOLVED']);
const PRIORITY = new Set(['HIGH','MEDIUM','LOW']);

export function validateObservationObject(data, rel='machine-observation-data.json') {
  const errors=[], warnings=[];
  if (!data || typeof data !== 'object') return {ok:false, errors:[`${rel}: data must be an object`], warnings};
  if (data.schemaVersion === 'machine-observation-data-v1') {
    if (!data.machineId || typeof data.machineId !== 'string') errors.push(`${rel}: machineId is required`);
    if (!data.displayName || typeof data.displayName !== 'string') errors.push(`${rel}: displayName is required`);
    for (const key of ['machineMenu','linkedService','predecessorData']) {
      const block=data[key];
      if (!block || typeof block !== 'object') { errors.push(`${rel}: ${key} block is required`); continue; }
      if (!V1_STATUS.has(block.status)) errors.push(`${rel}: ${key}.status must be CHECKED / NOT_AVAILABLE / UNRESOLVED`);
      if (!Array.isArray(block.availableData)) errors.push(`${rel}: ${key}.availableData must be an array`);
      if (!Array.isArray(block.sourceRefs)) errors.push(`${rel}: ${key}.sourceRefs must be an array`);
      if (typeof block.notes !== 'string') errors.push(`${rel}: ${key}.notes must be a string`);
    }
    if (!Array.isArray(data.sources)) errors.push(`${rel}: sources must be an array`);
    warnings.push(`${rel}: v1 compatibility mode; migrate to v2 when this machine is next reviewed`);
    return {ok:errors.length===0,errors,warnings};
  }
  if (data.schemaVersion !== 'machine-observation-data-v2') errors.push(`${rel}: schemaVersion must be machine-observation-data-v2 or legacy v1`);
  if (!/^[A-Z0-9_]+$/.test(data.machineId??'')) errors.push(`${rel}: invalid machineId`);
  if (!data.displayName || typeof data.displayName !== 'string') errors.push(`${rel}: displayName is required`);
  if (data.provisionalRegistrationId != null && (!Number.isInteger(data.provisionalRegistrationId) || data.provisionalRegistrationId < 1)) errors.push(`${rel}: provisionalRegistrationId must be positive integer or null`);
  if (data.registrationId != null && (!Number.isInteger(data.registrationId) || data.registrationId < 1)) errors.push(`${rel}: registrationId must be positive integer or null`);
  if (data.releaseDate != null && !/^\d{4}-\d{2}-\d{2}$/.test(data.releaseDate)) errors.push(`${rel}: releaseDate must be YYYY-MM-DD or null`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.researchedAt??'')) errors.push(`${rel}: researchedAt must be YYYY-MM-DD`);
  if (!Array.isArray(data.sources)) errors.push(`${rel}: sources must be an array`);
  if (!data.sourceCoverage || typeof data.sourceCoverage !== 'object') errors.push(`${rel}: sourceCoverage required`);
  else for (const key of COVERAGE_KEYS) if (!V2_COVERAGE_STATUS.has(data.sourceCoverage[key])) errors.push(`${rel}: sourceCoverage.${key} invalid: ${data.sourceCoverage[key]}`);

  const observationIds=new Set();
  if (!Array.isArray(data.observations)) errors.push(`${rel}: observations must be an array`);
  for (const [i,o] of (data.observations??[]).entries()) {
    const p=`${rel}: observations[${i}]`;
    if (!o?.observationId) errors.push(`${p}.observationId required`); else if (observationIds.has(o.observationId)) errors.push(`${rel}: duplicate observationId ${o.observationId}`); else observationIds.add(o.observationId);
    if (!SOURCE_TYPES.has(o?.sourceType)) errors.push(`${p}.sourceType invalid: ${o?.sourceType}`);
    if (!MODES.has(o?.observationMode)) errors.push(`${p}.observationMode invalid: ${o?.observationMode}`);
    if (!V2_OBSERVATION_STATUS.has(o?.status)) errors.push(`${p}.status invalid: ${o?.status}`);
    if (!o?.label) errors.push(`${p}.label required`);
    for (const key of ['categories','timing','excludedConditions','sourceRefs']) if (o?.[key] != null && !Array.isArray(o[key])) errors.push(`${p}.${key} must be an array`);
  }

  if (!Array.isArray(data.featureMappings)) errors.push(`${rel}: featureMappings must be an array`);
  for (const [i,m] of (data.featureMappings??[]).entries()) {
    const p=`${rel}: featureMappings[${i}]`;
    if (!m?.featureId) errors.push(`${p}.featureId required`);
    if (!MAPPINGS.has(m?.mappingType)) errors.push(`${p}.mappingType invalid: ${m?.mappingType}`);
    if (!Array.isArray(m?.observationIds)) errors.push(`${p}.observationIds must be an array`); else for (const id of m.observationIds) if (!observationIds.has(id)) errors.push(`${p}: unknown observationId ${id}`);
    if (!Array.isArray(m?.collectionMethods) || m.collectionMethods.some(x=>!MODES.has(x))) errors.push(`${p}.collectionMethods invalid`);
    if (typeof m?.usableForInference !== 'boolean') errors.push(`${p}.usableForInference must be boolean`);
    if (m?.usableForDifficulty != null && typeof m.usableForDifficulty !== 'boolean') errors.push(`${p}.usableForDifficulty must be boolean when present`);
  }

  if (!Array.isArray(data.researchReopenRequests)) errors.push(`${rel}: researchReopenRequests must be an array`);
  const requestIds=new Set();
  for (const [i,r] of (data.researchReopenRequests??[]).entries()) {
    const p=`${rel}: researchReopenRequests[${i}]`;
    if (!r?.requestId) errors.push(`${p}.requestId required`); else if (requestIds.has(r.requestId)) errors.push(`${rel}: duplicate requestId ${r.requestId}`); else requestIds.add(r.requestId);
    if (!REOPEN_STATUS.has(r?.status)) errors.push(`${p}.status invalid: ${r?.status}`);
    if (!r?.reason) errors.push(`${p}.reason required`);
  }

  if (!Array.isArray(data.fieldVerificationItems)) errors.push(`${rel}: fieldVerificationItems must be an array`);
  const verificationIds=new Set();
  for (const [i,v] of (data.fieldVerificationItems??[]).entries()) {
    const p=`${rel}: fieldVerificationItems[${i}]`;
    if (!v?.verificationId) errors.push(`${p}.verificationId required`); else if (verificationIds.has(v.verificationId)) errors.push(`${rel}: duplicate verificationId ${v.verificationId}`); else verificationIds.add(v.verificationId);
    if (!VERIFY_STATUS.has(v?.status)) errors.push(`${p}.status invalid: ${v?.status}`);
    if (!SOURCE_TYPES.has(v?.sourceType)) errors.push(`${p}.sourceType invalid: ${v?.sourceType}`);
    if (!PRIORITY.has(v?.priority)) errors.push(`${p}.priority invalid: ${v?.priority}`);
    if (!v?.question) errors.push(`${p}.question required`);
  }
  return {ok:errors.length===0,errors,warnings};
}

export function validateObservationRepository({cwd=process.cwd(),emitWarnings=true}={}) {
  const repoResearchRoot=path.join(cwd,'research');
  const files=[];
  if (fs.existsSync(repoResearchRoot)) for (const entry of fs.readdirSync(repoResearchRoot,{withFileTypes:true})) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
    const file=path.join(repoResearchRoot,entry.name,'machine-observation-data.json');
    if (fs.existsSync(file)) files.push(file);
  }
  const errors=[],warnings=[];
  for (const file of files) {
    let data; const rel=path.relative(cwd,file);
    try { data=JSON.parse(fs.readFileSync(file,'utf8')); } catch(e) { errors.push(`${rel}: invalid JSON: ${e.message}`); continue; }
    const r=validateObservationObject(data,rel); errors.push(...r.errors); warnings.push(...r.warnings);
  }
  if (emitWarnings) for (const w of warnings) console.warn(`WARNING: ${w}`);
  return {ok:errors.length===0,files:files.length,errors,warnings};
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) {
  const r=validateObservationRepository({cwd:root,emitWarnings:true});
  console.log(`Machine Observation Data files: ${r.files}`);
  if (!r.ok) { console.error(`Validation errors: ${r.errors.length}`); for (const e of r.errors) console.error(`- ${e}`); process.exit(1); }
  console.log(`Machine Observation Data validation: PASS (${r.warnings.length} compatibility warnings)`);
}
