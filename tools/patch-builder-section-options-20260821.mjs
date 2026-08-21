import fs from 'node:fs';

const file='tools/build-machine-data.mjs';
let source=fs.readFileSync(file,'utf8');
const before=`  const categoryLabels = selection.uiCategoryLabels || {};
  let generatedSectionIndex = 0;
  for (const [category, inputIds] of autoSectionInputIdsByCategory.entries()) {
    const missingIds = inputIds.filter((id) => !manualInputIds.has(id));
    if (missingIds.length === 0) continue;
    while (uiSections.some((section) => section.id === \`AUTO_\${generatedSectionIndex}\`)) {
      generatedSectionIndex += 1;
    }
    uiSections.push({
      id: \`AUTO_\${generatedSectionIndex}\`,
      title: categoryLabels[category] || category,
      inputIds: missingIds,
    });
    generatedSectionIndex += 1;
  }`;
const after=`  const categoryLabels = selection.uiCategoryLabels || {};
  const sectionOptionsByCategory = selection.uiSectionOptions || {};
  let generatedSectionIndex = 0;
  for (const [category, inputIds] of autoSectionInputIdsByCategory.entries()) {
    const missingIds = inputIds.filter((id) => !manualInputIds.has(id));
    if (missingIds.length === 0) continue;
    const sectionOptions = sectionOptionsByCategory[category] || {};
    while (uiSections.some((section) => section.id === \`AUTO_\${generatedSectionIndex}\`)) {
      generatedSectionIndex += 1;
    }
    uiSections.push({
      id: \`AUTO_\${generatedSectionIndex}\`,
      title: categoryLabels[category] || category,
      inputIds: missingIds,
      ...(typeof sectionOptions.description === 'string' && sectionOptions.description ? { description: sectionOptions.description } : {}),
      ...(typeof sectionOptions.collapsible === 'boolean' ? { collapsible: sectionOptions.collapsible } : {}),
      ...(typeof sectionOptions.defaultExpanded === 'boolean' ? { defaultExpanded: sectionOptions.defaultExpanded } : {}),
      ...(Array.isArray(sectionOptions.summaryInputIds) ? { summaryInputIds: sectionOptions.summaryInputIds } : {}),
    });
    generatedSectionIndex += 1;
  }`;
if (source.includes(before)) {
  source=source.replace(before,after);
  fs.writeFileSync(file,source);
  console.log('builder section options support added');
} else if (source.includes('const sectionOptionsByCategory = selection.uiSectionOptions || {};')) {
  console.log('builder section options support already present');
} else {
  throw new Error('builder auto-section block not found');
}
