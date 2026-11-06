import test from 'node:test';
import assert from 'node:assert/strict';
import { geminiPilot } from '../server/voice/gemini.js';
import { createVoiceServices } from '../server/voice/index.js';
import { loadConfig } from '../server/config.js';
import { SCENARIOS } from '../content/scenarios.js';
import { pilotWav } from '../public/js/pilot-wav.js';
import { pilotWavSeconds } from '../server/voice/wav.js';

const scenario=SCENARIOS[0];
const enabled=loadConfig({PILOT_FREE:'true',GEMINI_FREE_VERIFIED:'true',GEMINI_API_KEY:'testing',FREE_STT_CALLS_DAY:'5',FREE_TTS_CALLS_DAY:'5',FREE_LLM_CALLS_DAY:'5'});
function result(parts,finishReason='STOP'){
  return Response.json({candidates:[{finishReason,content:{parts}}],usageMetadata:{totalTokenCount:54}});
}
test('El piloto nunca elige proveedores de pago aunque existan claves anteriores',()=>{
  const config=loadConfig({PILOT_FREE:'true',OPENAI_API_KEY:'fake',ANTHROPIC_API_KEY:'fake'});
  assert.equal(config.storage,'postgres');
  const services=createVoiceServices(config);
  assert.ok(!services.llm&&!services.stt&&!services.tts);
  assert.equal(createVoiceServices({...enabled,freeVerified:false},()=>{}).tts,null);
  assert.equal(createVoiceServices({...enabled,freeLimits:{...enabled.freeLimits,tts:0}},()=>{}).tts,null);
});
test('Gemini transcribe el turno y reserva una llamada antes de enviar audio', async()=>{
  const sequence=[];
  const services=geminiPilot(enabled,async kind=>sequence.push(kind),async (url,req)=>{
    sequence.push('sent');assert.equal(new URL(url).hostname,'generativelanguage.googleapis.com');
    assert.equal(req.headers['x-goog-api-key'],'testing');
    const body=JSON.parse(req.body);assert.equal(body.contents[0].parts[0].inlineData.mimeType,'audio/wav');
    return result([{text:JSON.stringify({text:'No onions, please.'})}]);
  });
  assert.deepEqual(await services.stt.transcribe({audio:Buffer.from('sample'),mimeType:'audio/wav'}),{text:'No onions, please.'});
  assert.deepEqual(sequence,['stt','sent']);
});
test('El cliente y la evaluación usan reglas distintas; un criterio inventado se rechaza',async()=>{
  let i=0;const calls=[];
  const s=geminiPilot(enabled,async(kind,opening)=>calls.push([kind,opening]),async(_url,req)=>{
    const body=JSON.parse(req.body);
    const output=i++===0?{say:'A table for two, please.',done:false,confirmed_facts:'two'}:
      {did_well:'Confirmaste.',improvements:[],criteria:[{id:'inventado',met:true}]};
    assert.match(body.systemInstruction.parts[0].text,i===1?/restaurant guest/:/You evaluate/);
    return result([{text:JSON.stringify(output)}]);
  });
  assert.equal((await s.llm.customerTurn({scenario,turns:[]})).say,'A table for two, please.');
  await assert.rejects(s.llm.evaluate({scenario,turns:[],heardVia:'audio'}),e=>e.code==='provider');
  assert.deepEqual(calls,[['llm',true],['llm',false]]);
});
test('TTS devuelve WAV y rechaza respuestas de audio truncadas',async()=>{
  let i=0;
  const s=geminiPilot(enabled,async()=>{},async()=>result([{inlineData:{mimeType:'audio/L16;codec=pcm;rate=24000',data:'AAEAAg=='}}],i++===0?'STOP':'MAX_TOKENS'));
  const speech=await s.tts.speak({text:'Good evening.'});assert.equal(speech.audio.toString('ascii',0,4),'RIFF');assert.equal(speech.audio.readUInt32LE(40),4);
  await assert.rejects(s.tts.speak({text:'Hello'}),e=>e.code==='provider');
});
test('Una reserva rechazada evita la llamada; un 429 de Google se devuelve sin repetir',async()=>{
  let sent=0;
  const blocked=geminiPilot(enabled,async()=>{throw Error('quota');},()=>{sent++;});
  await assert.rejects(blocked.tts.speak({text:'Hello'}),/quota/);assert.equal(sent,0);
  const limited=geminiPilot(enabled,async()=>{},async()=>{sent++;return new Response(null,{status:429});});
  await assert.rejects(limited.tts.speak({text:'Hello'}),e=>e.code==='rate_limited');
  assert.equal(sent,1);
});
test('Preparación de clip móvil: mezcla en mono y duración medible antes de subir',async()=>{
  const old=globalThis.window;
  globalThis.window={OfflineAudioContext:class { async decodeAudioData() {
    return {numberOfChannels:2,duration:1,length:16000,getChannelData:i=>new Float32Array(16000).fill(i?0.5:1)};
  }}};
  try {
    const clip=await pilotWav(new Blob(['test']));const bytes=Buffer.from(await clip.blob.arrayBuffer());
    assert.equal(clip.ms,1000);assert.equal(pilotWavSeconds(bytes),1);assert.equal(bytes.readInt16LE(44),24575);
    bytes.writeUInt32LE(960000,40);assert.equal(pilotWavSeconds(bytes),0);
  } finally {if(old===undefined)delete globalThis.window;else globalThis.window=old;}
});
