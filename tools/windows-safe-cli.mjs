import fs from 'node:fs';
import path from 'node:path';
import { validateSelectionData } from './validate-selection-data.mjs';
import { evaluateResearchData } from './evaluate-research-statistics.mjs';
import { buildMachineData } from './build-machine-data.mjs';
import { evaluateMachineDifficulty } from './evaluate-machine-difficulty.mjs';

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, value) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n');
}

const [command, ...args] = process.argv.slice(2);

try {
  if (command === 'selection:validate') {
    const [selectionPath, researchPath] = args;
    if (!selectionPath) throw new Error('Usage: selection:validate <selection-data.json> [research-data.json]');
    const result = validateSelectionData(readJson(selectionPath), researchPath ? readJson(researchPath) : null);
    for (const warning of result.warnings) console.warn(`WARNING: ${warning}`);
    if (!result.ok) {
      for (const error of result.errors) console.error(`ERROR: ${error}`);
      process.exit(1);
    }
    console.log(`OK: SelectionDataを検証しました（警告 ${result.warnings.length}件）`);
  } else if (command === 'stats:evaluate') {
    const [researchPath, outputPath] = args;
    if (!researchPath) throw new Error('Usage: stats:evaluate <research-data.json> [output.json]');
    const result = evaluateResearchData(readJson(researchPath));
    if (outputPath) {
      writeJson(outputPath, result);
      console.log(`Statistical report: ${outputPath}`);
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
  } else if (command === 'machine:build') {
    const [researchPath, selectionPath, outputPath, statisticsPath] = args;
    if (!researchPath || !selectionPath || !outputPath) {
      throw new Error('Usage: machine:build <research-data.json> <selection-data.json> <output-machine-package.json> [statistics-report.json]');
    }
    const result = buildMachineData(
      readJson(researchPath),
      readJson(selectionPath),
      statisticsPath ? readJson(statisticsPath) : null,
    );
    writeJson(outputPath, result);
    console.log(`MachineData draft: ${outputPath}`);
  } else if (command === 'difficulty:evaluate') {
    const [researchPath, selectionPath, outputPath] = args;
    if (!researchPath || !selectionPath) {
      throw new Error('Usage: difficulty:evaluate <research-data.json> <selection-data.json> [output.json]');
    }
    const result = evaluateMachineDifficulty(readJson(researchPath), readJson(selectionPath));
    if (outputPath) {
      writeJson(outputPath, result);
      console.log(`Difficulty report: ${outputPath}`);
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
  } else {
    throw new Error(`Unknown command: ${command ?? '(none)'}`);
  }
} catch (error) {
  console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
