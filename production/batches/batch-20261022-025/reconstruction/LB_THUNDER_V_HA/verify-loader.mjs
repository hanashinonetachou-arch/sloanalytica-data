import fs from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
export async function resolve(specifier,context,next){
 try{return await next(specifier,context);}catch(error){
  if(specifier.startsWith('.')&&!/\.[a-z]+$/i.test(specifier))return next(specifier+'.ts',context);
  throw error;
 }
}
export async function load(url,context,next){
 if(url.endsWith('.ts')){
  let source=await fs.readFile(new URL(url),'utf8');
  // The pinned App uses tsx-style interface imports; there are no runtime exports in types.ts.
  source=source.replace(/import\s+\{[^}]+\}\s+from\s+['"]\.\/types['"];?/g,'');
  return {format:'module',source:stripTypeScriptTypes(source,{mode:'transform'}),shortCircuit:true};
 }
 return next(url,context);
}
