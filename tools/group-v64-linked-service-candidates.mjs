#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? '.');
const debtPath = path.join(root, 'reports/v64-observation-debt-classification.json');
const outPath = path.join(root, 'reports/v64-linked-service-candidates-by-manufacturer.json');
const debt = JSON.parse(fs.readFileSync(debtPath, 'utf8'));

const candidates = (debt.items ?? []).filter(
  (item) => item.bucket === 'WEB_RESEARCH_CANDIDATE' && item.sourceSurface === 'linkedService'
);

const groups = new Map();
for (const item of candidates) {
  const researchPath = path.join(root, 'research', item.machineId, 'research-data.json');
  let manufacturer = 'UNKNOWN';
  let introductionDate = null;
  let formalName = item.displayName ?? item.machineId;
  if (fs.existsSync(researchPath)) {
    const research = JSON.parse(fs.readFileSync(researchPath, 'utf8'));
    manufacturer = research.machine?.manufacturer ?? manufacturer;
    introductionDate = research.machine?.introductionDate ?? null;
    formalName = research.machine?.formalName ?? research.machine?.displayName ?? formalName;
  }
  if (!groups.has(manufacturer)) groups.set(manufacturer, []);
  groups.get(manufacturer).push({
    machineId: item.machineId,
    displayName: item.displayName,
    formalName,
    introductionDate,
  });
}

const manufacturers = [...groups.entries()]
  .map(([manufacturer, machines]) => ({
    manufacturer,
    count: machines.length,
    machines: machines.sort((a, b) => (a.introductionDate ?? '').localeCompare(b.introductionDate ?? '') || a.machineId.localeCompare(b.machineId)),
  }))
  .sort((a, b) => b.count - a.count || a.manufacturer.localeCompare(b.manufacturer, 'ja'));

const report = {
  schemaVersion: 'v6.4-linked-service-candidates-by-manufacturer-v1',
  generatedAt: new Date().toISOString(),
  sourceDebtGeneratedAt: debt.generatedAt,
  totalCandidates: candidates.length,
  manufacturerCount: manufacturers.length,
  manufacturers,
};

fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');
console.log(`Grouped ${candidates.length} linked-service candidates into ${manufacturers.length} manufacturers.`);
for (const group of manufacturers) console.log(`${String(group.count).padStart(2)}  ${group.manufacturer}`);
