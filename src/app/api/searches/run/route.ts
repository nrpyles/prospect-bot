import {NextResponse} from 'next/server';
import {getUserContext} from '@/lib/server-context';
import {providerSettings} from '@/db/provider-settings';
import {enqueueSearch} from '@/db/discovery';
import {validateSearchConfig} from '@/lib/discovery/job-policy';
export const runtime='nodejs';
export async function POST(req:Request){
 const ctx=await getUserContext();if(!ctx)return NextResponse.json({error:'Unauthorized'},{status:401});
 try{const input=await req.json();const config=validateSearchConfig({...input,sources:input.sources??['google']});
  const credentials=await providerSettings(ctx.orgId);
  for(const source of config.sources){if(source==='google'&&!credentials.googleKey)return NextResponse.json({error:'Google Places is not configured. Add the server key in your deployment settings.'},{status:400});if(source!=='google'&&!credentials.publicWebKey)return NextResponse.json({error:'Public web search is not configured. Add a Firecrawl key in your deployment settings.'},{status:400});}
  return NextResponse.json(await enqueueSearch(ctx.orgId,config),{status:202});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Search could not start'},{status:400});}
}
