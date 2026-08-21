import fs from 'node:fs';

const file='tools/build-machine-data.mjs';
let source=fs.readFileSync(file,'utf8');

if (source.includes('sectionOptionsByCategory')) {
  console.log('builder section options support already present');
  process.exit(0);
}

const idx=source.indexOf('uiCategoryLabels');
if(idx<0) throw new Error('uiCategoryLabels marker not found');
console.log('BUILDER_CONTEXT_START');
console.log(source.slice(Math.max(0,idx-240),idx+1200));
console.log('BUILDER_CONTEXT_END');
throw new Error('builder context captured; update patch markers');
