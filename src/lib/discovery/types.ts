import type {Candidate} from '../crm-types.ts';
export type SearchInput={city:string;industry:string;limit:number};
export type DiscoveryResult={candidates:Candidate[];warnings:string[]};
export type ProviderFetch=typeof fetch;
