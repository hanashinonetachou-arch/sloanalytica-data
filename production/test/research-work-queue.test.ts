import test from 'node:test';import assert from 'node:assert/strict';import {buildResearchWorkQueue} from '../src/research-work-queue.ts';
const fixture=()=>({machineId:'machine',sources:[{sourceId:'source',url:'https://example.test/current'}],findings:[],blockedItems:[],researchCompleteness:{domains:[{domain:'CZ',status:'PARTIAL',sourceIds:['source'],note:'fresh trial condition'}]}});
test('research queue uses current notes and sources; a completed domain leaves the queue',()=>{
 const d=fixture();const first=buildResearchWorkQueue([d],'audit');assert.equal(first.rows.find(r=>r.domain==='CZ')?.note,'fresh trial condition');
 d.researchCompleteness.domains[0].note='corrected scope';assert.equal(buildResearchWorkQueue([d],'next').rows.find(r=>r.domain==='CZ')?.note,'corrected scope');
 d.researchCompleteness.domains[0].status='CHECKED';assert.ok(!buildResearchWorkQueue([d],'next').rows.some(r=>r.domain==='CZ'));
 assert.equal(first.machineWorkPacks[0].machineWideUnresolvedNumericCandidates.length,0);
});
test('queue rejects unregistered sources in partial domains instead of silently losing research links',()=>{
 const d=fixture();d.researchCompleteness.domains[0].sourceIds=['missing'];assert.throws(()=>buildResearchWorkQueue([d],'audit'),/QUEUE_UNREGISTERED_SOURCE/);
});
