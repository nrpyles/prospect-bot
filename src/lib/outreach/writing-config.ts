type WritingEnvironment=Record<string,string|undefined>;

export function writingProvider(env:WritingEnvironment=process.env):'gemini'|'openai'|null{
 if(env.GEMINI_API_KEY?.trim())return 'gemini';
 if(env.OPENAI_API_KEY?.trim())return 'openai';
 return null;
}
