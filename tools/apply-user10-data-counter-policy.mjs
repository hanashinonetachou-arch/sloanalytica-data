#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const machineIds = [
  'S_YOUJO_SENKI_ZR',
  'S_HAIYORE_NYARUKO_SAN_Y',
  'S_TOARU_RAILGUN_FB',
  'S_TEKKEN4_ULTIMATE_DEVIL_TCD',
  'S_DANMACHI_GAIDEN_XR',
  'S_MAHOIKU_NB',
  'L_SHIMAMUSUME_L2',
  'L_SUPER_BLACKJACK_SLDC',
  'L_SHAMANKING_SS',
  'L_ARIFURETA_JA',
];

for (const machineId of machineIds) {
  const file = path.join(root, 'research', machineId, 'machine-observation-data.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (data.schemaVersion !== 'machine-observation-data-v2') throw new Error(`${machineId}: observation v2 required`);

  const directCounterObs = (data.observations ?? []).filter(o => o.sourceType === 'DATA_COUNTER' || o.observationMode === 'DATA_COUNTER_READ');
  const counterMappings = (data.featureMappings ?? []).filter(m => (m.collectionMethods ?? []).includes('DATA_COUNTER_READ'));
  if (directCounterObs.length || counterMappings.length) {
    throw new Error(`${machineId}: formal DATA_COUNTER dependency exists; manual review required`);
  }

  data.sourceCoverage.dataCounter = 'NOT_REQUIRED';
  data.fieldVerificationItems = (data.fieldVerificationItems ?? []).filter(v => v.sourceType !== 'DATA_COUNTER');
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

const validatorPath = path.join(root, 'tools', 'validate-machine-observation-data.mjs');
let validator = fs.readFileSync(validatorPath, 'utf8');
const oldStatus = "const V2_STATUS = new Set(['FOUND','CHECKED_NONE','UNRESOLVED','VERIFIED_ON_MACHINE']);";
const newStatus = "const V2_COVERAGE_STATUS = new Set(['FOUND','CHECKED_NONE','UNRESOLVED','VERIFIED_ON_MACHINE','NOT_REQUIRED']);\nconst V2_OBSERVATION_STATUS = new Set(['FOUND','CHECKED_NONE','UNRESOLVED','VERIFIED_ON_MACHINE']);";
if (!validator.includes(oldStatus)) throw new Error('validator status declaration changed; manual review required');
validator = validator.replace(oldStatus, newStatus);
validator = validator.replace(
  "else for (const key of COVERAGE_KEYS) if (!V2_STATUS.has(data.sourceCoverage[key])) errors.push(`${rel}: sourceCoverage.${key} invalid: ${data.sourceCoverage[key]}`);",
  "else for (const key of COVERAGE_KEYS) if (!V2_COVERAGE_STATUS.has(data.sourceCoverage[key])) errors.push(`${rel}: sourceCoverage.${key} invalid: ${data.sourceCoverage[key]}`);",
);
validator = validator.replace(
  "if (!V2_STATUS.has(o?.status)) errors.push(`${p}.status invalid: ${o?.status}`);",
  "if (!V2_OBSERVATION_STATUS.has(o?.status)) errors.push(`${p}.status invalid: ${o?.status}`);",
);
fs.writeFileSync(validatorPath, validator);

const checklistPath = path.join(root, 'reports', 'v65-user10-real-machine-verification-checklist.md');
let checklist = fs.readFileSync(checklistPath, 'utf8');
checklist = checklist.replace(/- 可能なら筐体メニューとデータカウンターは写真で残す。リセット条件がその場で確認不能なら「不明」でよい。\n/, '- 外部データカウンターは店舗ごとに仕様が異なるため、正式なObservation source・実機監査対象にしない。\n- 着席時入力は設定推測に利用価値がある機種にのみ設置し、データカウンター・筐体メニュー・履歴表示等を参考にした入力はユーザー自己責任とする。\n');
checklist = checklist.replace(/各機種で原則2点だけ確認する。\n\n1\. \*\*筐体メニュー\*\*: 総G\/通常G、ボーナス、CZ、AT、小役などの累計・履歴として何が表示されるか。\n2\. \*\*着席時データカウンター\*\*: 総G\/現在G、BIG\/REG、CZ\/AT等として何が表示され、どのイベントでリセットされるか。\n/, '各機種では、設定推測Featureの観測に有用な**筐体固有のメニュー・表示**だけを確認する。外部データカウンターの仕様確認は行わない。\n\n着席時入力欄は「前任者区間の値を推測に利用できるか」で設置を決め、値の取得元そのものはSloAnalyticaが保証しない。\n');
checklist = checklist.replace(/\| 機種 \| 筐体メニュー \| 着席時データカウンター \| 追加確認 \|[\s\S]*?\n\n## 写真を撮る場合の最小セット/, `| 機種 | 筐体固有の確認 | 追加確認 |\n|---|---|---|\n| パチスロ幼女戦記 | 設定推測に使える累計・小役表示の有無 | **マイスロ**結果画面で共通3枚ベル・共通9枚ベル・スイカ等の実際の項目名。マイカウンタLv4条件も確認できれば記録 |\n| パチスロ這いよれ！ニャル子さん | 設定推測に使える累計・履歴表示の有無 | なし |\n| SLOTとある科学の超電磁砲 | 設定推測に使える累計・履歴表示の有無 | 連動サービス確認不要（CHECKED_NONE） |\n| パチスロ鉄拳4アルティメットデビルVer. | 設定推測に使える累計・履歴表示の有無 | なし |\n| パチスロ ダンまち外伝 ソード・オラトリア | 設定推測に使える累計・履歴表示の有無 | なし |\n| パチスロ 魔法少女育成計画 | 設定推測に使える累計・履歴表示の有無 | なし |\n| L島娘 | 設定推測に使える累計・履歴表示の有無 | なし |\n| スマスロスーパーブラックジャック | サブ液晶「累積通常G」の意味とREG時の挙動 | **重点**: サブ液晶累積通常GはREGでリセットされない前提を実機表示で確認。外部データカウンターとの比較は不要 |\n| スマスロ シャーマンキング | 設定推測に使える累計・履歴表示の有無 | **ユニメモ**結果画面で通常G・通常時初当り・AT初当り・共通ベルA等のうち実際に個別記録される項目を確認 |\n| Lパチスロ ありふれた職業で世界最強 | 設定推測に使える累計・履歴表示の有無 | なし |\n\n## 写真を撮る場合の最小セット`);
checklist = checklist.replace(/- 各機種: 着席時データカウンター 1枚\n/, '');
checklist = checklist.replace(/- SBJ: サブ液晶の累積通常G \+ 外部データカウンターが同時に比較できる写真。可能ならREG前後\n/, '- SBJ: サブ液晶の累積通常G。可能ならREG前後\n');
fs.writeFileSync(checklistPath, checklist);

console.log(`Applied data-counter-independent observation policy to ${machineIds.length} machines.`);
