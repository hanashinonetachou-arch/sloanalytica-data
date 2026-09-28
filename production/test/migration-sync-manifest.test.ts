import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
const source=fs.readFileSync(new URL('../src/migration-sync-manifest.ts',import.meta.url),'utf8');
test('migration sync allowlist excludes artifacts and unrelated files',()=>{assert.match(source,/stages\\\/\(RESEARCH\|EVALUATION\)/);assert.doesNotMatch(source,/ALLOWED=\[[\s\S]*artifacts/);assert.match(source,/MIGRATION_SYNC_ARTIFACT_FORBIDDEN/)});
