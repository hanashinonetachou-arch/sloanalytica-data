import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface RepositoryMutation {
 path:string;
 content:string;
 sha256:string;
}
export interface RepositoryTransaction {
 baseHead:string;
 mutations:RepositoryMutation[];
}
const digest=(b:Buffer|string)=>crypto.createHash('sha256').update(b).digest('hex');

function walk(root:string,dir=root,out=new Map<string,string>()){
 if(!fs.existsSync(dir)) return out;
 for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
  const full=path.join(dir,ent.name);
  if(ent.isDirectory()) walk(root,full,out);
  else {
   const rel=path.relative(root,full).replaceAll(path.sep,'/');
   out.set(rel,digest(fs.readFileSync(full)));
  }
 }
 return out;
}

export function captureRepository(root:string){return walk(root)}

export function planRepositoryTransaction(
 root:string,
 before:Map<string,string>,
 baseHead:string,
 allowedPrefixes=['batches/','config/']
):RepositoryTransaction{
 if(!/^[0-9a-f]{40}$/i.test(baseHead)) throw new Error('INVALID_BASE_HEAD');
 const after=walk(root);
 for(const rel of before.keys()) if(!after.has(rel)) throw new Error('DELETE_FORBIDDEN:'+rel);
 const mutations:RepositoryMutation[]=[];
 for(const [rel,sha256] of after){
  if(before.get(rel)===sha256) continue;
  if(!allowedPrefixes.some(p=>rel.startsWith(p))) throw new Error('MUTATION_SCOPE_VIOLATION:'+rel);
  const content=fs.readFileSync(path.join(root,...rel.split('/')),'utf8');
  mutations.push({path:'production/'+rel,content,sha256});
 }
 mutations.sort((a,b)=>a.path.localeCompare(b.path));
 return {baseHead,mutations};
}

export function assertPublishableTransaction(tx:RepositoryTransaction,currentHead:string){
 if(tx.baseHead!==currentHead) throw new Error('REMOTE_CAS_CONFLICT');
 if(tx.mutations.length===0) throw new Error('EMPTY_TRANSACTION');
 const seen=new Set<string>();
 for(const m of tx.mutations){
  if(seen.has(m.path)) throw new Error('DUPLICATE_MUTATION_PATH:'+m.path);
  seen.add(m.path);
  if(!m.path.startsWith('production/batches/')&&!m.path.startsWith('production/config/')) throw new Error('REMOTE_MUTATION_SCOPE_VIOLATION:'+m.path);
  if(digest(m.content)!==m.sha256) throw new Error('MUTATION_SHA256_MISMATCH:'+m.path);
 }
 return tx;
}
