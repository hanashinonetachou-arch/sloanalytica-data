import assert from 'node:assert/strict';
import fs from 'node:fs';

const lock = JSON.parse(fs.readFileSync('research/S_REVUE_STARLIGHT_CX/user-verified-ui-lock.json', 'utf8'));
assert.equal(lock.status, 'USER_VERIFIED_UI_LOCKED');
assert.deepEqual(lock.sectionItems['着席時データ'], ['INP_SEATED_NORMAL_GAMES', 'INP_SEATED_CZ_COUNT']);
assert.match(lock.policy.reason, /再確認済み/);
console.log('PASS Revue user-verified UI lock');
