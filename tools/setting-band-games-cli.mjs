import fs from 'node:fs';
import path from 'node:path';
import { evaluateSettingBandGames } from './evaluate-setting-band-games.mjs';

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
function writeJson(p, value) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n');
}

const [researchPath, selectionPath, outputPath] = process.argv.slice(2);
if (!researchPath || !selectionPath) {
  console.error('Usage: node tools/setting-band-games-cli.mjs <research-data.json> <selection-data.json> [output.json]');
  process.exit(1);
}

try {
  const result = evaluateSettingBandGames(readJson(researchPath), readJson(selectionPath));
  if (outputPath) {
    writeJson(outputPath, result);
    console.log(`Setting band discrimination report: ${outputPath}`);
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
} catch (error) {
  console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
