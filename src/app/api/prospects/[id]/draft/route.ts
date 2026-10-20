import {websiteChanged} from '@/lib/crm-guards';
import {NextResponse} from 'next/server';import {and,eq} from 'drizzle-orm';import {z} from 'zod';
import {getUserContext} from '@/lib/server-context';import {db} from '@/db';import {prospects} from '@/db/schema';import {toUiProspect} from '@/db/prospects';import {listFindings} from '@/db/research';import {buildTemplateDraft} from '@/lib/outreach/agency-draft';import {draftEmail} from '@/lib/ai-drafter';
export const runtime='nodejs';
const schema=z.object({ai:z.boolean().optional(),offerType:z.enum(['website_build','website_refresh','seo_improvements','website_plus_seo']).optional()});
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const ctx=await getUserContext();if(!ctx)return NextResponse.json({error:'Unauthorized'},{status:401});if(!db)return NextResponse.json({error:'Database is not configured'},{status:503});
 try{const {id}=await params;z.uuid().parse(id);const input=schema.parse(await req.json().catch(()=>({})));const [row]=await db.select().from(prospects).where(and(eq(prospects.orgId,ctx.orgId),eq(prospects.id,id))).limit(1);if(!row)return NextResponse.json({error:'Prospect not found'},{status:404});
 const prospect=toUiProspect(row);const findings=await listFindings(ctx.orgId,id);const offerType=input.offerType??prospect.offerType??'website_plus_seo';
 if(input.ai&&!process.env.ANTHROPIC_API_KEY)return NextResponse.json({error:'AI drafting is optional and is not configured. Use the free template draft.'},{status:400});
 const draft=input.ai?await draftEmail({prospect,findings,offerType,mode:'agency',senderName:'Neal Pyles'}):buildTemplateDraft({prospect,findings,offerType,senderName:'Neal Pyles'});
 const [current]=await db.select({website:prospects.website}).from(prospects).where(and(eq(prospects.orgId,ctx.orgId),eq(prospects.id,id))).limit(1);if(!current||websiteChanged(row.website,current.website))return NextResponse.json({error:'The website changed while this draft was being prepared. Review the current website and prepare a new draft.'},{status:409});
 return NextResponse.json({...draft,isTemplate:!input.ai});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Draft could not be prepared'},{status:400});}
}
