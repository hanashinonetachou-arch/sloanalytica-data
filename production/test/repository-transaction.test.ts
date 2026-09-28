import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {captureRepository,planRepositoryTransaction,assertPublishableTransaction} from '../src/repository-transaction.ts';

const setup=()=>{const root=fs.mkdtempSync(path.join(os.tmpdir(),'repo-tx-'));fs.mkdirSync(path.join(root,'batches','b'),{recursive:true});fs.writeFileSync(path.join(root,'batches','b','state.json'),'{"revision":1}\n');return root};
const head='a'.repeat(40);

test('plans only changed repository state and binds it to branch HEAD',()=>{const root=setup();const before=captureRepository(root);fs.writeFileSync(path.join(root,'batches','b','state.json'),'{"revision":2}\n');fs.writeFileSync(path.join(root,'batches','b','event.json'),'{"ok":true}\n');const tx=planRepositoryTransaction(root,before,head);assert.equal(tx.baseHead,head);assert.deepEqual(tx.mutations.map(x=>x.path),['production/batches/b/event.json','production/batches/b/state.json']);assert.equal(assertPublishableTransaction(tx,head),tx)});

test('remote HEAD movement is a CAS conflict',()=>{const root=setup();const before=captureRepository(root);fs.writeFileSync(path.join(root,'batches','b','state.json'),'{"revision":2}\n');const tx=planRepositoryTransaction(root,before,head);assert.throws(()=>assertPublishableTransaction(tx,'b'.repeat(40)),/REMOTE_CAS_CONFLICT/)});

test('delete is forbidden by transaction boundary',()=>{const root=setup();const before=captureRepository(root);fs.unlinkSync(path.join(root,'batches','b','state.json'));assert.throws(()=>planRepositoryTransaction(root,before,head),/DELETE_FORBIDDEN/)});

test('mutation outside production state scope is rejected',()=>{const root=setup();const before=captureRepository(root);fs.writeFileSync(path.join(root,'README.md'),'x');assert.throws(()=>planRepositoryTransaction(root,before,head),/MUTATION_SCOPE_VIOLATION/)});

test('tampered transaction content is rejected before publish',()=>{const root=setup();const before=captureRepository(root);fs.writeFileSync(path.join(root,'batches','b','state.json'),'{"revision":2}\n');const tx=planRepositoryTransaction(root,before,head);tx.mutations[0].content='tampered';assert.throws(()=>assertPublishableTransaction(tx,head),/MUTATION_SHA256_MISMATCH/)});
