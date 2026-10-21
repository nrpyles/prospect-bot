import {randomUUID} from 'node:crypto';
import {NextResponse} from 'next/server';
import {getUserContext} from '@/lib/server-context';
import {getSearchJob} from '@/db/discovery';
import {processNextSearchUnit} from '@/lib/discovery/worker';

export const runtime='nodejs';
export const maxDuration=300;

export async function POST(_req:Request,{params}:{params:Promise<{id:string}>}){
 const ctx=await getUserContext();
 if(!ctx)return NextResponse.json({error:'Unauthorized'},{status:401});
 const {id}=await params;
 if(!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id))return NextResponse.json({error:'Invalid search ID'},{status:400});
 const job=await getSearchJob(ctx.orgId,id);
 if(!job)return NextResponse.json({error:'Search not found'},{status:404});
 if(!['queued','running'].includes(job.state))return NextResponse.json({job});
 try{
  await processNextSearchUnit(randomUUID(),{
   scope:{orgId:ctx.orgId,jobId:id},
   signal:AbortSignal.timeout(240000),
   auditTimeoutMs:8000,
  });
  return NextResponse.json({job:await getSearchJob(ctx.orgId,id)});
 }catch{
  return NextResponse.json({error:'This search batch could not finish. Refresh to check saved progress before resuming.'},{status:503});
 }
}
