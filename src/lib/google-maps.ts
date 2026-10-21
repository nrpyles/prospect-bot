import {searchGoogle} from './discovery/google';
export type GooglePlace={name:string;placeId:string;rating:number;reviewCount:number;phone:string;website:string;address:string;businessStatus?:string};
export class GoogleMapsError extends Error{apiStatus?:string;constructor(message:string,status?:string){super(message);this.name='GoogleMapsError';this.apiStatus=status;}}
export async function searchPlaces(opts:{apiKey:string;query:string;location:string;maxResults?:number;minRating?:number}):Promise<GooglePlace[]>{
 try{const result=await searchGoogle({city:opts.location,industry:opts.query,limit:opts.maxResults??10},{apiKey:opts.apiKey});return result.candidates.filter(p=>!opts.minRating||p.rating===undefined||Number(p.rating)>=opts.minRating).map(p=>({name:p.businessName!,placeId:p.placeId!,rating:Number(p.rating??0),reviewCount:p.reviewCount??0,phone:p.phone??'',website:p.website??'',address:p.address??''}));}catch(e){throw new GoogleMapsError(e instanceof Error?e.message:'Google search failed');}
}
