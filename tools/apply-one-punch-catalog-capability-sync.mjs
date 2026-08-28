import fs from 'node:fs';

const path='catalog.json';
const catalog=JSON.parse(fs.readFileSync(path,'utf8'));
const list=Array.isArray(catalog)?catalog:(catalog.machines??catalog.items??[]);
const item=list.find(x=>x.machineId==='L_ONE_PUNCH_MAN');
if(!item) throw new Error('L_ONE_PUNCH_MAN catalog entry missing');
const caps=item.requiredCapabilities??[];
if(!caps.includes('multinomial')) throw new Error('One Punch catalog must already require multinomial');
item.requiredCapabilities=caps.filter(x=>x!=='binomial');
if(item.requiredCapabilities.includes('binomial')) throw new Error('stale binomial capability remains');
fs.writeFileSync(path,JSON.stringify(catalog,null,2)+'\n');
console.log('UPDATED L_ONE_PUNCH_MAN requiredCapabilities:',item.requiredCapabilities.join(','));
