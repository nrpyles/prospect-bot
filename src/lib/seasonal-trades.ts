import {INDUSTRY_PRESETS} from './pipeline.ts';
import type {Industry} from './pipeline.ts';
export const SEASONAL_TRADES:Industry[]=['Christmas Light Installation','Holiday Decorating','Permanent Outdoor Lighting','Gutter Cleaning','Leaf Cleanup','Fall Yard Cleanup','Snow and Ice Removal','Pool Winterization','Chimney Cleaning'];
export const SEARCH_PRESETS:Record<string,{label:string;industries:Industry[]}>= {
 original:{label:'Original businesses',industries:INDUSTRY_PRESETS.agency.industries},
 holiday:{label:'Fall + holiday',industries:['Christmas Light Installation','Holiday Decorating','Permanent Outdoor Lighting','Gutter Cleaning','Leaf Cleanup','Fall Yard Cleanup','Landscaping','Pressure Washing','Window Cleaning','Junk Removal']},
 winter:{label:'Winter trades',industries:['Snow and Ice Removal','Pool Winterization','Chimney Cleaning','HVAC','Tree Service']},
};
const QUERIES:Record<string,string[]>={
 'Christmas Light Installation':['christmas light installation','holiday light installation'],
 'Holiday Decorating':['holiday decorating service','christmas decorating company'],
 'Permanent Outdoor Lighting':['permanent outdoor lighting installation'],
 'Gutter Cleaning':['gutter cleaning service'],'Leaf Cleanup':['leaf removal service'],
 'Fall Yard Cleanup':['fall yard cleanup service'],'Snow and Ice Removal':['snow removal service','ice removal contractor'],
 'Pool Winterization':['pool winterization service'],'Chimney Cleaning':['chimney cleaning service'],
};
export function getIndustryQueries(industry:string):string[]{return QUERIES[industry]??[`${industry.toLowerCase()} company`];}
export function craigslistRegion(city:string):string|null{
 const value=city.toLowerCase();
 if(/dallas|fort worth|frisco|plano|mckinney|prosper|celina|denton|allen|arlington|irving|garland|dfw/.test(value))return 'dallas';
 for(const [term,region] of [['austin','austin'],['houston','houston'],['san antonio','sanantonio'],['phoenix','phoenix'],['denver','denver'],['chicago','chicago']])if(value.includes(term))return region;
 return null;
}
