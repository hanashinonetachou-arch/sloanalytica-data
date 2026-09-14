#!/usr/bin/env node
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const id='L_MACROSS_FRONTIER4_BA';
const base='5f8940a787c787dc4cb477c2c0a52e42c7c8a29d';
for(const rel of [`research/${id}/selection-data.json`,`research/${id}/machine-observation-data.json`,`research/${id}/ui-design-data.json`]){
  const content=execSync(`git show ${base}:${rel}`,{encoding:'utf8'});
  fs.writeFileSync(rel,content);
}
console.log(`${id}: restored canonical files to pre-batch9i state ${base}`);
