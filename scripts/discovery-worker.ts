import {config} from 'dotenv';config({path:'.env.local'});
const {processNextSearchUnit}=await import('../src/lib/discovery/worker');
const {randomUUID}=await import('node:crypto');const workerId=randomUUID();let stopping=false;
process.on('SIGINT',()=>{stopping=true;});process.on('SIGTERM',()=>{stopping=true;});
console.log('Private CRM search worker started');
while(!stopping){try{if(!await processNextSearchUnit(workerId))await new Promise(r=>setTimeout(r,1500));}catch(error){console.error(error instanceof Error?error.message:'Worker error');await new Promise(r=>setTimeout(r,5000));}}
