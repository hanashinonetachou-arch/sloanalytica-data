import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const write = (p, s) => fs.writeFileSync(path.join(ROOT, p), s, 'utf8');

function replaceExact(text, before, after, label) {
  if (!text.includes(before)) throw new Error(`Expected source not found: ${label}`);
  return text.replace(before, after);
}

// 1) Builder: selection-only machineLinkRecommended flag -> user-facing suffix, flag stripped from package.
{
  const file = 'tools/build-machine-data.mjs';
  let s = read(file);
  const before = `function inputWithDefaults(x){\n  const defaultValue=x.defaultValue!==undefined?x.defaultValue:\n    x.type===\"boolean\"?false:x.type===\"multi_enum\"?[]:x.type===\"enum\"?\"__UNSET__\":0;\n  const y={...x,defaultValue,minimum:[\"integer\",\"number\",\"counter\"].includes(x.type)?0:undefined};\n  for(const k of Object.keys(y)) if(y[k]===undefined) delete y[k];\n  return y;\n}`;
  const after = `function inputWithDefaults(x){\n  const {machineLinkRecommended=false,...source}=x;\n  if(typeof machineLinkRecommended!==\"boolean\") fail(\`${'${x.id}'}: machineLinkRecommended must be boolean\`);\n  const defaultValue=source.defaultValue!==undefined?source.defaultValue:\n    source.type===\"boolean\"?false:source.type===\"multi_enum\"?[]:source.type===\"enum\"?\"__UNSET__\":0;\n  const y={...source,defaultValue,minimum:[\"integer\",\"number\",\"counter\"].includes(source.type)?0:undefined};\n  if(machineLinkRecommended){\n    const suffix=\"（実機連動機能推奨）\";\n    const description=typeof y.description===\"string\"?y.description.trim():\"\";\n    y.description=description?\`${'${description}'}${'${description.endsWith("。")?"":"。"}'}${'${suffix}'}\`:suffix;\n  }\n  for(const k of Object.keys(y)) if(y[k]===undefined) delete y[k];\n  return y;\n}`;
  s = replaceExact(s, before, after, 'build-machine-data inputWithDefaults');
  write(file, s);
}

// 2) Selection validator: forbid specific service brands in user-facing text, validate recommendation flag.
{
  const file = 'tools/validate-selection-data.mjs';
  let s = read(file);
  s = replaceExact(
    s,
    `function read(p){ return JSON.parse(fs.readFileSync(p,\"utf8\")); }\n`,
    `function read(p){ return JSON.parse(fs.readFileSync(p,\"utf8\")); }\nconst USER_FACING_SERVICE_NAME_RE=/(?:ユニメモ|打-WIN|打ＷＩＮ|スロプラ\\s*NEXT|マイスロ)/i;\nfunction hasServiceName(value){ return typeof value===\"string\" && USER_FACING_SERVICE_NAME_RE.test(value); }\n`,
    'validator helpers'
  );
  s = replaceExact(
    s,
    ` else for(const [k,v] of Object.entries(uiCategoryLabels)) if(!k||typeof v!==\"string\"||!v.trim()) errors.push(\`invalid uiCategoryLabels entry: ${'${k}'}\`);`,
    ` else for(const [k,v] of Object.entries(uiCategoryLabels)){\n   if(!k||typeof v!==\"string\"||!v.trim()) errors.push(\`invalid uiCategoryLabels entry: ${'${k}'}\`);\n   else if(hasServiceName(v)) errors.push(\`uiCategoryLabels.${'${k}'} must not expose a specific machine-linked service name\`);\n }`,
    'validator ui labels'
  );
  s = replaceExact(
    s,
    `   if(!i.name||!i.type||!i.category||!Number.isInteger(i.displayOrder)) errors.push(\`incomplete input: ${'${i.id}'}\`);\n   if(i.parentInputId && !idset.has(i.parentInputId)) errors.push(\`${'${i.id}'}: unknown parentInputId ${'${i.parentInputId}'}\`);`,
    `   if(!i.name||!i.type||!i.category||!Number.isInteger(i.displayOrder)) errors.push(\`incomplete input: ${'${i.id}'}\`);\n   if(i.machineLinkRecommended!==undefined && typeof i.machineLinkRecommended!==\"boolean\") errors.push(\`${'${i.id}'}: machineLinkRecommended must be boolean\`);\n   if(hasServiceName(i.name)) errors.push(\`${'${i.id}'}: input name must not expose a specific machine-linked service name\`);\n   if(hasServiceName(i.description)) errors.push(\`${'${i.id}'}: input description must not expose a specific machine-linked service name\`);\n   if(i.parentInputId && !idset.has(i.parentInputId)) errors.push(\`${'${i.id}'}: unknown parentInputId ${'${i.parentInputId}'}\`);`,
    'validator inputs'
  );
  s = replaceExact(
    s,
    ` for(const f of features){\n   if(f.suppressedByFeatureIds!==undefined){`,
    ` for(const f of features){\n   if(hasServiceName(f.userReason)||hasServiceName(f.rejectionReason)||hasServiceName(f.difficultyExclusionReason)) errors.push(\`${'${f.featureId}'}: user-facing feature text must not expose a specific machine-linked service name\`);\n   if(f.suppressedByFeatureIds!==undefined){`,
    'validator feature reasons'
  );
  s = replaceExact(
    s,
    ` for(const g of s.evidenceUi?.groups??[]){\n   if(evidenceGroupIds.has(g.groupId)) errors.push(\`duplicate evidenceUi groupId ${'${g.groupId}'}\`);`,
    ` for(const g of s.evidenceUi?.groups??[]){\n   if(hasServiceName(g.label)) errors.push(\`${'${g.groupId}'}: evidence group label must not expose a specific machine-linked service name\`);\n   if(evidenceGroupIds.has(g.groupId)) errors.push(\`duplicate evidenceUi groupId ${'${g.groupId}'}\`);`,
    'validator evidence groups'
  );
  s = replaceExact(
    s,
    `   for(const o of g.options??[]){\n     if(optionValues.has(o.value)) errors.push(\`${'${g.groupId}'}/${'${o.value}'}: duplicate evidenceUi option ${'${o.value}'}\`);`,
    `   for(const o of g.options??[]){\n     if(hasServiceName(o.label)) errors.push(\`${'${g.groupId}'}/${'${o.value}'}: evidence option label must not expose a specific machine-linked service name\`);\n     if(optionValues.has(o.value)) errors.push(\`${'${g.groupId}'}/${'${o.value}'}: duplicate evidenceUi option ${'${o.value}'}\`);`,
    'validator evidence options'
  );
  write(file, s);
}

// 3) Pipeline: run repository-wide user-facing service-name audit.
{
  const file = 'tools/machine-pipeline.mjs';
  let s = read(file);
  s = replaceExact(
    s,
    `  runNpm('test', 'test');\n  runNpm('audit', 'audit');`,
    `  runNpm('test', 'test');\n  runNpm('audit', 'audit');\n  runNpm('audit:ui-service-names', 'user-facing service-name audit');`,
    'pipeline audits'
  );
  write(file, s);
}

// 4) package.json script.
{
  const file = 'package.json';
  const pkg = JSON.parse(read(file));
  pkg.scripts['audit:ui-service-names'] = 'node tools/audit-user-facing-service-names.mjs';
  write(file, JSON.stringify(pkg, null, 2) + '\n');
}

// 5) Smart Hanabi wording + recommendation metadata.
{
  const file = 'research/L_HANABI_KM/selection-data.json';
  const selection = JSON.parse(read(file));
  Object.assign(selection.uiCategoryLabels, {
    BIG_GAME: 'BIG中',
    REG_GAME: 'REG中',
    HC: '花火チャレンジ',
    HG: '花火GAME',
  });

  const byId = new Map(selection.inputs.map(input => [input.id, input]));
  const recommend = [
    'INP_NORMAL_BELL_GAMES','INP_NORMAL_BELL_TOTAL',
    'INP_BIG_GAME_TRIALS','INP_BIG_BELL_B','INP_BIG_SCATTER',
    'INP_REG_GAME_TRIALS','INP_REG_ONE_COIN','INP_REG_SCATTER',
    'INP_HC_GAMES','INP_HC_MISS','INP_HG_GAMES','INP_HG_MISS',
  ];
  for (const id of recommend) {
    const input = byId.get(id);
    if (!input) throw new Error(`Hanabi input not found: ${id}`);
    input.machineLinkRecommended = true;
  }

  byId.get('INP_NORMAL_BELL_GAMES').description = '通常時の風鈴を観測したゲーム数を入力してください。RT中は含めません。';
  byId.get('INP_NORMAL_BELL_TOTAL').description = '通常時の風鈴A＋風鈴Bの合計回数を入力してください。未取得の場合は空欄のままにしてください。';
  byId.get('INP_BIG_GAME_TRIALS').description = '実際に消化したBIG中の総ゲーム数を入力してください。初版ではBIG回数から自動計算しません。';
  byId.get('INP_BIG_BELL_B').description = 'BIG中の斜め風鈴（風鈴B）の回数を入力してください。';
  byId.get('INP_BIG_SCATTER').description = 'BIG中のバラケ目の回数を入力してください。';
  byId.get('INP_REG_GAME_TRIALS').description = '実際に消化したREG中の総ゲーム数を入力してください。1枚役ハズシで変動するためREG回数から自動計算しません。';
  byId.get('INP_REG_ONE_COIN').description = 'REG中の1枚役成立回数を入力してください。';
  byId.get('INP_REG_SCATTER').description = 'REG中のバラケ目の回数を入力してください。';
  byId.get('INP_HC_GAMES').description = '実際に消化した花火チャレンジの総ゲーム数を入力してください。';
  byId.get('INP_HC_MISS').description = '花火チャレンジ中のハズレ回数を入力してください。';
  byId.get('INP_HG_GAMES').description = '実際に消化した花火GAMEの総ゲーム数を入力してください。';
  byId.get('INP_HG_MISS').description = '花火GAME中のハズレ回数を入力してください。';

  for (const feature of selection.features) {
    if (feature.featureId === 'FEAT_BONUS_OUTCOME') {
      feature.userReason = '特にREGに段階的な設定差があり、通常時小役データが未取得でも利用できるため採用します。通常時風鈴を観測した場合は二重評価を避けてフォールバック停止します。';
    }
  }
  write(file, JSON.stringify(selection, null, 2) + '\n');
}

console.log('Applied machine-linked UI wording policy and Smart Hanabi wording updates.');
