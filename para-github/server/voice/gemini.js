import { ProviderError } from './providers.js';
import { wav } from './wav.js';
import { customerSystemPrompt, evaluatorSystemPrompt, CUSTOMER_SCHEMA, EVALUATOR_SCHEMA } from '../sim/prompts.js';

const TEXT = 'gemini-3.5-flash';
const SPEECH = 'gemini-3.1-flash-tts-preview';
const badResponse = () => new ProviderError('provider','La IA no devolvió una respuesta utilizable.');

function matches(schema, value) {
  if (schema.type === 'array') return Array.isArray(value) && value.every(v => matches(schema.items, v));
  if (schema.type === 'object') return value && typeof value === 'object' &&
    schema.required.every(k => matches(schema.properties[k], value[k]));
  return typeof value === schema.type;
}

export function geminiPilot(config, reserve, transport = fetch) {
  const services = { stt:null, llm:null, tts:null, pronunciation:null };
  if (!config.voiceEnabled || !config.freeVerified || !config.geminiKey || !reserve) return services;
  async function generate(kind, model, payload, {signal,opening=false} = {}) {
    if (signal?.aborted) throw new ProviderError('cancelled','Reproducción cancelada.');
    await reserve(kind, opening);
    const timeout = AbortSignal.timeout(kind === 'tts' ? 17500 : 35000);
    let response, body;
    try {
      response = await transport('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent',{
        method:'POST', headers:{'content-type':'application/json','x-goog-api-key':config.geminiKey},
        body:JSON.stringify(payload), signal:signal ? AbortSignal.any([signal,timeout]) : timeout,
        redirect:'error',
      });
      if (!response.ok) {
        const code = response.status===429 ? 'rate_limited' : [401,403].includes(response.status) ? 'auth' : 'provider';
        throw new ProviderError(code,'Gemini no pudo completar este turno.');
      }
      body=await response.json();
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError(signal?.aborted?'cancelled':'network','No recibimos la respuesta de Gemini.');
    }
    const candidate=body?.candidates?.[0];
    if (candidate?.finishReason !== 'STOP' || !Array.isArray(candidate.content?.parts)) throw badResponse();
    return {parts:candidate.content.parts.filter(p=>!p.thought), tokens:Number(body.usageMetadata?.totalTokenCount)||0};
  }
  async function structured(system, parts, schema, kind, opening=false) {
    const {parts:out,tokens}=await generate(kind,TEXT,{
      systemInstruction:{parts:[{text:system}]},contents:[{role:'user',parts}],
      generationConfig:{responseMimeType:'application/json',responseJsonSchema:schema,maxOutputTokens:kind==='stt'?1500:4000},
    },{opening});
    let data;
    try { data=JSON.parse(out.map(p=>p.text??'').join('')); } catch { throw badResponse(); }
    if (!matches(schema,data)) throw badResponse();
    return {data,tokens};
  }
  if(config.freeLimits.stt) services.stt={
    name:'gemini:'+TEXT,
    async transcribe({audio,mimeType}) {
      if(mimeType.split(';')[0]!=='audio/wav') throw new ProviderError('provider','Se requiere WAV para el piloto.');
      const {data}=await structured('Transcribe this restaurant server exactly in English. Preserve mistakes, quantities and negations. For silence or unintelligible audio return empty text. Never answer the speaker.',[
        {inlineData:{mimeType:'audio/wav',data:audio.toString('base64')}},
      ],{type:'object',properties:{text:{type:'string'}},required:['text']},'stt');
      return {text:data.text.trim()};
    },
  };
  const dialogue = turns => turns.map(({role,text})=>({speaker:role==='waiter'?'server':'guest',text}));
  if(config.freeLimits.llm) services.llm={
    name:'gemini:'+TEXT,
    async customerTurn({scenario,turns,ledger,instruction}) {
      const {data,tokens}=await structured(customerSystemPrompt(scenario),[{text:JSON.stringify({
        dialogue:dialogue(turns),confirmedFacts:ledger,direction:instruction||(!turns.length?'Say your opening line.':'Continue the scene.'),
      })}],CUSTOMER_SCHEMA,'llm',!turns.length);
      if(!data.say.trim())throw badResponse();
      return {say:data.say.trim(),done:data.done,ledger:data.confirmed_facts,tokens};
    },
    async evaluate({scenario,turns,heardVia}) {
      const {data,tokens}=await structured(evaluatorSystemPrompt(scenario,null,heardVia),[{text:JSON.stringify(dialogue(turns))}],EVALUATOR_SCHEMA,'llm');
      const ids=data.criteria.map(c=>c.id);
      if (ids.length!==scenario.criteria.length || !scenario.criteria.every(c=>ids.includes(c.id))) throw badResponse();
      return {summary:data,tokens};
    },
  };
  if(config.freeLimits.tts) services.tts={
    name:'gemini:'+SPEECH,
    async speak({text,signal}) {
      const {parts}=await generate('tts',SPEECH,{
        contents:[{parts:[{text:'Read exactly the following line in clear American English:\n'+text}]}],
        generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:'Kore'}}}},
      },{signal});
      const inline=parts.find(p=>p.inlineData)?.inlineData;
      if(!inline || !/^audio\/(?:l16|pcm)(?:;|$)/i.test(inline.mimeType) || typeof inline.data!=='string' || inline.data.length>6000000) throw badResponse();
      if (/rate=/i.test(inline.mimeType) && !/rate=24000(?:;|$)/i.test(inline.mimeType)) throw badResponse();
      const pcm=Buffer.from(inline.data,'base64');
      if(!pcm.length || pcm.length%2 || pcm.toString('base64')!==inline.data) throw badResponse();
      return {audio:wav(pcm),mimeType:'audio/wav'};
    },
  };
  return services;
}
