import fs from 'node:fs';
import {RepoStore,renewLease} from './core.ts';
import type {Lease} from './core.ts';

const batchId=process.argv[2];
const intervalMs=Number(process.argv[3]??30000);
const ttlMs=Number(process.argv[4]??60000);
if(!batchId) throw new Error('USAGE: lease-heartbeat <batch-id> [interval-ms] [ttl-ms]');
if(!Number.isFinite(intervalMs)||intervalMs<=0||!Number.isFinite(ttlMs)||ttlMs<=intervalMs) throw new Error('INVALID_HEARTBEAT_TIMING');

const s=new RepoStore(process.cwd());
const leaseDir=s.p('batches',batchId,'leases');
if(!fs.existsSync(leaseDir)) throw new Error('LEASE_DIRECTORY_NOT_FOUND');

const beat=()=>{
  const now=new Date();
  const renewed:string[]=[];
  for(const file of fs.readdirSync(leaseDir).filter(f=>f.endsWith('.json'))){
    const l=s.read<Lease>('batches',batchId,'leases',file);
    if(l.status!=='ACTIVE') continue;
    try {
      renewLease(s,l,now,ttlMs);
      renewed.push(l.leaseId);
    } catch(e) {
      if(!(e instanceof Error)||e.message!=='LEASE_NOT_RENEWABLE') throw e;
    }
  }
  console.log(JSON.stringify({batchId,heartbeatAt:now.toISOString(),renewed},null,2));
};

beat();
const timer=setInterval(beat,intervalMs);
process.on('SIGINT',()=>{clearInterval(timer);process.exit(0)});
process.on('SIGTERM',()=>{clearInterval(timer);process.exit(0)});
