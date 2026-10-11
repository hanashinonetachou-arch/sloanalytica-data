import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {verifyApprovedRationaleFleet} from '../tools/guard-approved-adoption-reasons.mjs';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function fixture(oldReason,newReason) {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'slo-reason-guard-'));
 const dir=n=>{const p=path.join(root,n,'machines','S_TEST');fs.mkdirSync(p,{recursive:true});return path.join(p,'machine-package.json')};
 const pkg=reason=>({machine:{machineId:'S_TEST',machineDataVersion:'8.5.1-test'},v8:{machineResearchSummary:{adopted:[{featureId:'F',reason}]}}});
 fs.writeFileSync(dir('baseline'),JSON.stringify(pkg(oldReason)));fs.writeFileSync(dir('candidate'),JSON.stringify(pkg(newReason)));
 return {old:path.join(root,'baseline'),current:path.join(root,'candidate'),cleanup:()=>fs.rmSync(root,{recursive:true,force:true})};
}
test('unchanged approved explanation passes',t=>{const f=fixture('設定1は1/200、設定6は1/150。','設定1は1/200、設定6は1/150。');t.after(f.cleanup);assert.equal(verifyApprovedRationaleFleet(f.old,f.current).protectedReasons,1)});
test('generic regression stops publication',t=>{const f=fixture('設定1は1/200、設定6は1/150。','現在の採用基準を満たしているため');t.after(f.cleanup);assert.throws(()=>verifyApprovedRationaleFleet(f.old,f.current),/ADOPTION_GUARD_UNREVIEWED/)});
test('non-generic explanation rewrite also requires review',t=>{const f=fixture('以前の監査済み説明','異なる説明');t.after(f.cleanup);assert.throws(()=>verifyApprovedRationaleFleet(f.old,f.current),/ADOPTION_GUARD_UNREVIEWED/)});
test('exact reviewed new reason is permitted',t=>{const f=fixture('旧説明','監査承認された新説明');t.after(f.cleanup);assert.equal(verifyApprovedRationaleFleet(f.old,f.current,[{machineId:'S_TEST',featureId:'F',newReasonSha256:sha('監査承認された新説明'),reviewReason:'verified public source'}]).status,'PASS')});
test('unrelated approval cannot bypass changed explanation',t=>{const f=fixture('旧説明','新説明');t.after(f.cleanup);assert.throws(()=>verifyApprovedRationaleFleet(f.old,f.current,[{machineId:'S_TEST',featureId:'OTHER',newReasonSha256:sha('新説明'),reviewReason:'wrong feature'}]),/ADOPTION_GUARD_UNREVIEWED/)});
test('stale approval fails to prevent accidental bypass',t=>{const f=fixture('旧説明','旧説明');t.after(f.cleanup);assert.throws(()=>verifyApprovedRationaleFleet(f.old,f.current,[{machineId:'S_TEST',featureId:'F',newReasonSha256:sha('別'),reviewReason:'stale'}]),/ADOPTION_GUARD_UNUSED_APPROVAL/)});
