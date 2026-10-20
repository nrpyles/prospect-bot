import {randomUUID} from 'node:crypto';
import {getIndustryQueries} from '../seasonal-trades.ts';
import {standaloneWebsite} from './normalize.ts';
import type {DiscoveryResult,SearchInput,ProviderFetch} from './types.ts';
export async function searchGoogle(config:SearchInput,credentials:{apiKey?:string},signal?:AbortSignal,request:ProviderFetch=fetch):Promise<DiscoveryResult>{
 if(!credentials.apiKey)throw new Error('Google Places is not configured');
 const candidates:DiscoveryResult['candidates']=[];const limit=Math.max(1,Math.min(config.limit,20));
 const query=`${getIndustryQueries(config.industry)[0]} in ${config.city}`;let pageToken:string|undefined;
 do{
  const response=await request('https://places.googleapis.com/v1/places:searchText',{method:'POST',signal:AbortSignal.any([AbortSignal.timeout(20000),...(signal?[signal]:[])]),headers:{'Content-Type':'application/json','X-Goog-Api-Key':credentials.apiKey,'X-Goog-FieldMask':'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.businessStatus,nextPageToken'},body:JSON.stringify({textQuery:query,pageSize:Math.min(20,limit-candidates.length),includePureServiceAreaBusinesses:true,...(pageToken?{pageToken}:{})})});
  if(!response.ok)throw new Error(`Google Places returned HTTP ${response.status}`);
  const data=await response.json();
  if(!Array.isArray(data.places)&&data.places!==undefined)throw new Error('Google returned an invalid search response');
  for(const place of data.places??[]){
   if(!place.id||!place.displayName?.text||place.businessStatus==='CLOSED_PERMANENTLY')continue;
   const now=new Date().toISOString();
   candidates.push({id:randomUUID(),displayTitle:place.displayName.text,businessName:place.displayName.text,city:config.city,industry:config.industry,
    website:standaloneWebsite(place.websiteUri),phone:place.nationalPhoneNumber??null,email:null,placeId:place.id,rating:place.rating!==undefined?String(place.rating):undefined,reviewCount:place.userRatingCount,address:place.formattedAddress,
    providerStatus:'provider',reviewRequired:false,evidence:[{id:randomUUID(),source:'google',url:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.displayName.text)}&query_place_id=${encodeURIComponent(place.id)}`,query,observedAt:now,publishedAt:null,verifiedAt:now,freshness:'current',snippet:place.displayName.text,verifiedFields:['businessName',...(place.websiteUri?['website']:[]),...(place.nationalPhoneNumber?['phone']:[])]}]});
   if(candidates.length>=limit)break;
  }
  pageToken=data.nextPageToken;
 }while(pageToken&&candidates.length<limit);
 return {candidates,warnings:[]};
}
