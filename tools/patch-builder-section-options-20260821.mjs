import fs from 'node:fs';

const file='tools/build-machine-data.mjs';
let source=fs.readFileSync(file,'utf8');

if (source.includes('const sectionOptionsByCategory = selection.uiSectionOptions || {};')) {
  console.log('builder section options support already present');
  process.exit(0);
}

const edits=[
  [
    '  const categoryLabels = selection.uiCategoryLabels || {};\n  let generatedSectionIndex = 0;',
    '  const categoryLabels = selection.uiCategoryLabels || {};\n  const sectionOptionsByCategory = selection.uiSectionOptions || {};\n  let generatedSectionIndex = 0;',
  ],
  [
    '    if (missingIds.length === 0) continue;\n    while (uiSections.some((section) => section.id === `AUTO_${generatedSectionIndex}`)) {',
    '    if (missingIds.length === 0) continue;\n    const sectionOptions = sectionOptionsByCategory[category] || {};\n    while (uiSections.some((section) => section.id === `AUTO_${generatedSectionIndex}`)) {',
  ],
  [
    '      inputIds: missingIds,\n    });',
    "      inputIds: missingIds,\n      ...(typeof sectionOptions.description === 'string' && sectionOptions.description ? { description: sectionOptions.description } : {}),\n      ...(typeof sectionOptions.collapsible === 'boolean' ? { collapsible: sectionOptions.collapsible } : {}),\n      ...(typeof sectionOptions.defaultExpanded === 'boolean' ? { defaultExpanded: sectionOptions.defaultExpanded } : {}),\n      ...(Array.isArray(sectionOptions.summaryInputIds) ? { summaryInputIds: sectionOptions.summaryInputIds } : {}),\n    });",
  ],
];

for (const [before,after] of edits) {
  if (!source.includes(before)) throw new Error(`builder patch marker not found: ${before.slice(0,60)}`);
  source=source.replace(before,after);
}
fs.writeFileSync(file,source);
console.log('builder section options support added');
