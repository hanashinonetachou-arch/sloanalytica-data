import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {backfillSelectionUserReasons} from '../tools/backfill-selection-user-reasons.mjs';

test('backfill copies only existing published adoption rationale and is dry-run by default',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'sel-reason-'));
  fs.mkdirSync(path.join(root,'research','M'),{recursive:true});
  fs.mkdirSync(path.join(root,'machines','M'),{recursive:true});
  const sp=path.join(root,'research','M','selection-data.json');
  fs.writeFileSync(sp,JSON.stringify({features:[{featureId:'FEAT_A',adoptionCategory:'INCLUDE_PRIMARY'},{featureId:'FEAT_B',adoptionCategory:'EXCLUDE'}]}));
  fs.writeFileSync(path.join(root,'machines','M','machine-package.json'),JSON.stringify({features:{features:[{featureId:'FEAT_A',selectionRationale:{adoptionReason:'公開済み理由'}}]}}));
  const dry=backfillSelectionUserReasons(root);
  assert.equal(dry.changeCount,1);
  assert.equal(JSON.parse(fs.readFileSync(sp)).features[0].userReason,undefined);
  const applied=backfillSelectionUserReasons(root,{apply:true});
  assert.equal(applied.changeCount,1);
  assert.equal(JSON.parse(fs.readFileSync(sp)).features[0].userReason,'公開済み理由');
});
