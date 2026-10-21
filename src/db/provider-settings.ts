import {eq} from 'drizzle-orm';import {db} from './index';import {organizations} from './schema';
export async function providerSettings(orgId:string){
 const [org]=db?await db.select({googleKey:organizations.googleMapsApiKey}).from(organizations).where(eq(organizations.id,orgId)).limit(1):[];
 return {googleKey:process.env.FUNNELCLOSER_GMAPS_API_KEY?.trim()||org?.googleKey?.trim()||undefined,publicWebKey:process.env.FIRECRAWL_API_KEY?.trim()||undefined};
}
