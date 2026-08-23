import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const researchRoot = path.join(root, 'research');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function lockFiles() {
  if (!fs.existsSync(researchRoot)) return [];
  return fs.readdirSync(researchRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(researchRoot, entry.name, 'user-verified-ui-lock.json'))
    .filter(file => fs.existsSync(file));
}

function assertInputContract(machineId, input, contract) {
  assert.ok(input, `${machineId}: locked input is missing`);
  if (contract.name !== undefined) assert.equal(input.name, contract.name, `${machineId}/${input.id}: name changed`);
  if (contract.derivedCalculation !== undefined) assert.equal(input.derivedCalculation, contract.derivedCalculation, `${machineId}/${input.id}: derivedCalculation changed`);
  if (contract.derivedFromInputIds !== undefined) assert.deepEqual(input.derivedFromInputIds, contract.derivedFromInputIds, `${machineId}/${input.id}: derivedFromInputIds changed`);
}

for (const lockFile of lockFiles()) {
  const lock = readJson(lockFile);
  const machineId = lock.machineId;
  const packageFile = path.join(root, 'machines', machineId, 'machine-package.json');

  test(`${machineId} user-verified UI lock`, () => {
    assert.equal(lock.status, 'USER_VERIFIED_UI_LOCKED');
    assert.ok(fs.existsSync(packageFile), `${machineId}: machine package missing`);

    const pkg = readJson(packageFile);
    const sections = pkg.ui?.sections ?? [];
    const inputs = pkg.inputs?.inputs ?? [];
    const inputById = new Map(inputs.map(input => [input.id, input]));
    const sectionByTitle = new Map(sections.map(section => [section.title, section]));

    assert.deepEqual(sections.map(section => section.title), lock.sectionOrder, `${machineId}: locked section order changed`);

    for (const [title, description] of Object.entries(lock.sectionDescriptions ?? {})) {
      assert.equal(sectionByTitle.get(title)?.description, description, `${machineId}/${title}: description changed`);
    }

    for (const [title, expectedIds] of Object.entries(lock.sectionItems ?? {})) {
      const section = sectionByTitle.get(title);
      assert.ok(section, `${machineId}: locked section missing: ${title}`);
      const actualIds = (section.items ?? []).map(item => item.inputId).filter(Boolean);
      assert.deepEqual(actualIds, expectedIds, `${machineId}/${title}: input order or membership changed`);
    }

    for (const [inputId, contract] of Object.entries(lock.inputContracts ?? {})) {
      const input = inputById.get(inputId);
      assertInputContract(machineId, input, contract);

      if (contract.gridSpan !== undefined || contract.directInput !== undefined || contract.compact !== undefined) {
        const sectionItem = sections.flatMap(section => section.items ?? []).find(item => item.inputId === inputId);
        assert.ok(sectionItem, `${machineId}/${inputId}: UI item missing`);
        if (contract.gridSpan !== undefined) assert.equal(sectionItem.gridSpan, contract.gridSpan, `${machineId}/${inputId}: gridSpan changed`);
        if (contract.directInput !== undefined) assert.equal(sectionItem.config?.directInput, contract.directInput, `${machineId}/${inputId}: directInput changed`);
        if (contract.compact !== undefined) assert.equal(sectionItem.config?.compact, contract.compact, `${machineId}/${inputId}: compact changed`);
      }
    }
  });
}
