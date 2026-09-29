import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const source=fs.readFileSync(new URL('../src/migration-sync-manifest.ts',import.meta.url),'utf8');
test('migration sync allowlist excludes artifacts and unrelated files',()=>{const allowlist=source.match(/const ALLOWED=\[[\s\S]*?\n\];/)?.[0]??'';assert.match(allowlist,/stages\\\/\(RESEARCH\|EVALUATION\)/);assert.doesNotMatch(allowlist,/artifacts/);assert.match(source,/MIGRATION_SYNC_ARTIFACT_FORBIDDEN/);});
