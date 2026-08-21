import fs from 'node:fs';

const file='tools/build-machine-data.mjs';
let source=fs.readFileSync(file,'utf8');
if(source.includes('const sectionOptions=selection.uiSectionOptions?.[cat]??{};')){
  console.log('builder section options support already present');
  process.exit(0);
}
const marker1='    const categoryTitle=selection.uiCategoryLabels?.[cat]??defaultCategoryLabels[cat]??(cat==="PRIMARY"?null:cat);';
const insert1=marker1+'\n    const sectionOptions=selection.uiSectionOptions?.[cat]??{};';
if(!source.includes(marker1)) throw new Error('categoryTitle marker not found');
source=source.replace(marker1,insert1);
const marker2='      ...(selection.uiCategoryDescriptions?.[cat]?{description:selection.uiCategoryDescriptions[cat]}:{}),';
const insert2=marker2+'\n      ...(typeof sectionOptions.description==="string"&&sectionOptions.description?{description:sectionOptions.description}:{}),\n      ...(typeof sectionOptions.collapsible==="boolean"?{collapsible:sectionOptions.collapsible}:{}),\n      ...(typeof sectionOptions.defaultExpanded==="boolean"?{defaultExpanded:sectionOptions.defaultExpanded}:{}),\n      ...(Array.isArray(sectionOptions.summaryInputIds)?{summaryInputIds:sectionOptions.summaryInputIds}:{}),';
if(!source.includes(marker2)) throw new Error('section description marker not found');
source=source.replace(marker2,insert2);
fs.writeFileSync(file,source);
console.log('builder section options support added');
