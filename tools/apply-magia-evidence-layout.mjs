#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const designPath = path.join(root, 'research', 'L_MAGIA_RECORD_RN', 'ui-design-data.json');
const materializerPath = path.join(root, 'tools', 'materialize-ui-design.mjs');

const design = JSON.parse(fs.readFileSync(designPath, 'utf8'));
const evidence = design.sections['設定示唆・確定情報'];
if (!evidence) throw new Error('Magia evidence section not found');

evidence.collapsible = false;
evidence.defaultExpanded = true;
evidence.subgroups = [
  {
    id: 'BIG_END_SCREEN',
    title: 'BIG終了画面',
    inputIds: [
      'INP_BIG_END_2PLUS_COUNT',
      'INP_BIG_END_4PLUS_COUNT',
      'INP_BIG_END_5PLUS_COUNT',
      'INP_BIG_END_6_COUNT',
    ],
    collapsible: false,
    defaultExpanded: true,
  },
  {
    id: 'AT_END_SCREEN',
    title: 'AT終了画面',
    inputIds: ['INP_AT_END_6_COUNT'],
    collapsible: false,
    defaultExpanded: true,
  },
  {
    id: 'ENDING_CARD',
    title: 'エンディングカード',
    inputIds: [
      'INP_END_CARD_4PLUS_COUNT',
      'INP_END_CARD_DENY1_COUNT',
      'INP_END_CARD_DENY2_COUNT',
      'INP_END_CARD_DENY3_COUNT',
      'INP_END_CARD_DENY4_PENDULUM_COUNT',
      'INP_END_CARD_DENY4_NIGHTJAR_COUNT',
    ],
    collapsible: true,
    defaultExpanded: false,
  },
  {
    id: 'STORY_COMPLETE',
    title: 'ストーリーコンプリート',
    inputIds: ['INP_STORY_5PLUS_COUNT'],
    collapsible: true,
    defaultExpanded: false,
  },
  {
    id: 'STORY_ORDER',
    title: 'ストーリー5話開始',
    inputIds: [
      'INP_STORY_ORDER_DENY1_COUNT',
      'INP_STORY_ORDER_DENY2_COUNT',
      'INP_STORY_ORDER_DENY3_COUNT',
      'INP_STORY_ORDER_5PLUS_COUNT',
    ],
    collapsible: true,
    defaultExpanded: false,
  },
];

const labels = {
  INP_BIG_END_2PLUS_COUNT: '水着みかづき荘',
  INP_BIG_END_4PLUS_COUNT: '2nd Seasonキービジュアル',
  INP_BIG_END_5PLUS_COUNT: '1st Seasonキービジュアル',
  INP_BIG_END_6_COUNT: '小さいキュゥべえ',
  INP_AT_END_6_COUNT: 'まどか＆いろは',
  INP_END_CARD_4PLUS_COUNT: '舞台装置の魔女',
  INP_END_CARD_DENY1_COUNT: '委員長の魔女',
  INP_END_CARD_DENY2_COUNT: '石中魚の魔女',
  INP_END_CARD_DENY3_COUNT: '立ち耳の魔女',
  INP_END_CARD_DENY4_PENDULUM_COUNT: '振子の魔女',
  INP_END_CARD_DENY4_NIGHTJAR_COUNT: 'ヨダカの魔女',
  INP_STORY_5PLUS_COUNT: 'シナリオ⑨（小さいキュゥべえ）',
  INP_STORY_ORDER_DENY1_COUNT: '設定1否定パターン',
  INP_STORY_ORDER_DENY2_COUNT: '設定2否定パターン',
  INP_STORY_ORDER_DENY3_COUNT: '設定3否定パターン',
  INP_STORY_ORDER_5PLUS_COUNT: '設定5以上パターン',
};
for (const [id, name] of Object.entries(labels)) {
  const contract = design.inputContracts[id];
  if (!contract) throw new Error(`missing input contract: ${id}`);
  contract.name = name;
}

for (const id of evidence.subgroups.flatMap((group) => group.inputIds)) {
  const contract = design.inputContracts[id];
  if (!contract) throw new Error(`missing subgroup contract: ${id}`);
  if (id !== 'INP_STORY_5PLUS_COUNT') contract.gridSpan = 6;
}

fs.writeFileSync(designPath, JSON.stringify(design, null, 2) + '\n');

let materializer = fs.readFileSync(materializerPath, 'utf8');
const needle = "      ...(Array.isArray(section.summaryInputIds)?{summaryInputIds:[...section.summaryInputIds]}:{}),\n      items,";
const replacement = "      ...(Array.isArray(section.summaryInputIds)?{summaryInputIds:[...section.summaryInputIds]}:{}),\n      ...(Array.isArray(section.subgroups)?{subgroups:section.subgroups.map((group)=>({id:group.id,title:group.title,inputIds:[...(group.inputIds??[])],...(typeof group.collapsible==='boolean'?{collapsible:group.collapsible}:{}),...(typeof group.defaultExpanded==='boolean'?{defaultExpanded:group.defaultExpanded}:{})}))}:{}),\n      items,";
if (!materializer.includes(replacement)) {
  if (!materializer.includes(needle)) throw new Error('materializer insertion point not found');
  materializer = materializer.replace(needle, replacement);
  fs.writeFileSync(materializerPath, materializer);
}

console.log('Applied Magia evidence subgroup layout and generic materializer support.');
