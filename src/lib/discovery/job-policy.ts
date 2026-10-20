import {INDUSTRIES,QUALITIES} from '../pipeline.ts';
import type {JobState,SearchJobConfig} from '../crm-types.ts';
export function validateSearchConfig(input:Record<string,unknown>):SearchJobConfig{
 const strings=(key:string)=>{const x=input[key];if(!Array.isArray(x)||!x.length||x.some(v=>typeof v!=='string'||!v.trim()||v.length>120))throw new Error(`Choose valid ${key}`);return x.map(v=>(v as string).trim());};
 const cities=strings('cities'),industries=strings('industries'),sources=strings('sources');
 if(cities.length>20||industries.length>20)throw new Error('Search exceeds the combination budget');
 if(industries.some(i=>!INDUSTRIES.includes(i as typeof INDUSTRIES[number])))throw new Error('Choose a supported industry');
 if(sources.some(s=>!['google','facebook','craigslist'].includes(s)))throw new Error('Choose a supported source');
 const number=(key:string,def:number,max:number)=>{const x=input[key]??def;if(typeof x!=='number'||!Number.isInteger(x)||x<1||x>max)throw new Error(`Invalid ${key} budget`);return x;};
 const maxUnits=number('maxUnits',30,100);
 if(cities.length*industries.length*sources.length>maxUnits)throw new Error('Search exceeds the selected combination budget. Choose fewer cities or trades.');
 const quality=input.qualityFilter??null;if(quality!==null&&(!Array.isArray(quality)||quality.some(q=>!QUALITIES.includes(q as typeof QUALITIES[number]))))throw new Error('Invalid website quality filter');
 return {cities:[...new Set(cities)],industries:[...new Set(industries)],sources:[...new Set(sources)] as SearchJobConfig['sources'],qualityFilter:quality as string[]|null,maxUnits,maxCandidates:number('maxCandidates',50,200),maxResultsPerQuery:number('maxResultsPerQuery',10,20)};
}
export function deriveJobState(states:string[],cancelled:boolean):JobState{
 if(cancelled)return 'cancelled';
 if(states.some(s=>s==='running'))return 'running';
 if(states.some(s=>s==='queued'))return 'queued';
 if(states.every(s=>s==='failed'))return 'failed';
 if(states.some(s=>s==='failed'))return 'partial';return 'complete';
}
