import {validateCategoryRates} from './batch009-rate-matrix.ts';
const sample={settings:['1','2'],categories:['a','b'],percentRows:[[59.4,40.6],[50,50]]};
if(validateCategoryRates(sample).length)throw Error('VALID_TABLE_REJECTED');
for(const bad of [
 {...sample,percentRows:[[101,-1],[50,50]]},
 {...sample,percentRows:[[30,30],[50,50]]},
 {...sample,percentRows:[[50],[50,50]]},
 {...sample,settings:['1','1']}
]){
 if(!validateCategoryRates(bad).length)throw Error('INVALID_TABLE_ACCEPTED');
}
console.log('batch009-rate-matrix PASS');
