import {NextResponse} from 'next/server';import {and,eq} from 'drizzle-orm';import {getUserContext} from '@/lib/server-context';import {db} from '@/db';import {prospects} from '@/db/schema';import {getResearch,listEvidence,saveFindings} from '@/db/research';import {inspectWebsite} from '@/lib/research/website-audit';
import {researchWebsite} from '@/lib/research/site-research';import {z} from 'zod';
export const runtime='nodejs';export const maxDuration=300;
async function owned(orgId:string,id:string){if(!db||!/^[\da-f-]{36}$/i.test(id))return null;const [p]=await db.select().from(prospects).where(and(eq(prospects.id,id),eq(prospects.orgId,orgId))).limit(1);return p??null;}
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){const ctx=await getUserContext();if(!ctx)return NextResponse.json({error:'Unauthorized'},{status:401});const {id}=await params;if(!await owned(ctx.orgId,id))return NextResponse.json({error:'Prospect not found'},{status:404});return NextResponse.json({audit:await getResearch(ctx.orgId,id),evidence:await listEvidence(ctx.orgId,id)});}
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const ctx=await getUserContext();if(!ctx)return NextResponse.json({error:'Unauthorized'},{status:401});
 const {id}=await params;const p=await owned(ctx.orgId,id);if(!p)return NextResponse.json({error:'Prospect not found'},{status:404});
 try{
  const input=z.object({sitewide:z.boolean().optional(),pageLimit:z.number().int().min(1).max(100).optional()}).parse(await req.json().catch(()=>({})));
  let audit;
  if(input.sitewide&&p.website){
   const {homeHtml,homeUrl,...siteResearch}=await researchWebsite(p.website,{apiKey:process.env.FIRECRAWL_API_KEY,pageLimit:input.pageLimit??50});
   audit=await inspectWebsite(p.website,{signal:AbortSignal.timeout(15000),page:homeHtml&&homeUrl?{html:homeHtml,url:homeUrl}:undefined});
   audit={...audit,siteResearch,checksRun:[...audit.checksRun,`Business content researched: ${siteResearch.pages.length} pages`]};
  }else audit=await inspectWebsite(p.website);
  await saveFindings(ctx.orgId,id,audit);return NextResponse.json({audit,evidence:await listEvidence(ctx.orgId,id)});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Website research could not finish'},{status:400});}
}
