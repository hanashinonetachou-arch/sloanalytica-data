/** Validate categorical setting probabilities before numerical promotion. */
export type RateTable={settings:string[],categories:string[],percentRows:number[][]};
export function validateCategoryRates(table:RateTable):string[]{
 const errors:string[]=[];
 if(!Array.isArray(table.settings)||!Array.isArray(table.categories)||!Array.isArray(table.percentRows)||!table.settings.length||!table.categories.length){return ['RATE_MATRIX_SHAPE'];}
 if(table.settings.length!==table.percentRows.length)errors.push('SETTING_ROW_COUNT_MISMATCH');
 if(new Set(table.settings).size!==table.settings.length)errors.push('DUPLICATE_SETTINGS');
 if(new Set(table.categories).size!==table.categories.length)errors.push('DUPLICATE_CATEGORIES');
 for(let i=0;i<table.percentRows.length;i++){
  const row=table.percentRows[i];
  if(!Array.isArray(row)||row.length!==table.categories.length){errors.push('RATE_ROW_WIDTH_'+i);continue;}
  if(row.some(value=>typeof value!=='number'||!Number.isFinite(value)||value<0||value>100)){errors.push('RATE_VALUE_INVALID_'+i);continue;}
  const total=row.reduce((a,b)=>a+b,0);
  // Decimal display precision is typically one decimal place per source category.
  // Avoid silent normalization, but allow cumulative per-category rounding.
  const tolerance=Math.max(0.05,table.categories.length*0.05+0.0001);
  if(Math.abs(total-100)>tolerance)errors.push('RATE_SUM_MISMATCH_'+i+':'+total.toFixed(4));
 }
 return errors;
}
