// Real local WebSocket transport with fake provider; no paid API calls/audio audition.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WebSocketServer } from 'ws';
import { openAiRealtimeTts } from '../server/voice/realtime.js';
import { loadConfig } from '../server/config.js';

async function fixture(t, onResponse, { timeoutMs = 1000, handshake = true } = {}) {
  const server = new WebSocketServer({ port: 0, host: '127.0.0.1' });
  await new Promise(r => server.once('listening',r));
  const events=[];
  server.on('connection',(ws,req)=>{
    assert.equal(req.headers.authorization,'Bearer fake-secret');
    assert.equal(req.url,'/v1/realtime?model=gpt-realtime-2.1-mini');
    const send=x=>ws.send(JSON.stringify(x));
    if(handshake)send({type:'session.created'});
    ws.on('message',raw=>{
      const e=JSON.parse(raw);events.push(e);
      if(e.type==='session.update')send({type:'session.updated'});
      if(e.type==='response.create')onResponse({ws,send,e});
    });
  });
  t.after(async()=>{for(const c of server.clients)c.terminate();await new Promise(r=>server.close(r));});
  const tts=openAiRealtimeTts({apiKey:'fake-secret',baseUrl:`http://127.0.0.1:${server.address().port}/v1`,model:'gpt-realtime-2.1-mini',voice:'marin',timeoutMs});
  return {tts,events};
}
const audio = send => send({type:'response.output_audio.delta',delta:Buffer.from([0,1,2,3]).toString('base64')});
const done = (send,text='No onions, please.') => {send({type:'response.output_audio_transcript.done',transcript:text});send({type:'response.done',response:{status:'completed'}});};

test('Realtime: handshake, lectura aislada, audio PCM convertido a WAV',async t=>{
  const {tts,events}=await fixture(t,({send})=>{audio(send);audio(send);done(send);});
  const result=await tts.speak({text:'No onions, please.'});
  assert.equal(result.mimeType,'audio/wav');assert.equal(result.audio.toString('ascii',0,4),'RIFF');
  assert.equal(result.audio.readUInt32LE(24),24000);assert.equal(result.audio.readUInt32LE(40),8);
  assert.equal(events[0].session.audio.output.voice,'marin');assert.equal(events[0].session.audio.input.turn_detection,null);
  assert.equal(events[1].response.conversation,'none');
  assert.deepEqual(JSON.parse(events[1].response.input[0].content[0].text),{text_to_read:'No onions, please.'});
});
for(const [name,respond] of [
  ['negación perdida',({send})=>{audio(send);done(send,'Onions, please.');}],
  ['audio vacío',({send})=>done(send)],
  ['respuesta incompleta',({send})=>{audio(send);send({type:'response.done',response:{status:'incomplete'}});}],
  ['error proveedor',({send})=>send({type:'error',error:{message:'do not expose'}})],
  ['JSON roto',({ws})=>ws.send('{broken')],
  ['base64 inválido',({send})=>send({type:'response.output_audio.delta',delta:'%%%bad'})],
  ['cierre anticipado',({ws})=>ws.close()],
]) test(`Realtime rechaza ${name}`,async t=>{
  const {tts}=await fixture(t,respond);await assert.rejects(tts.speak({text:'No onions, please.'}),e=>['provider','network'].includes(e.code)&&!e.message.includes('do not expose'));
});
test('Realtime timeout sin session.created',async t=>{
  const {tts}=await fixture(t,()=>{},{timeoutMs:30,handshake:false});
  await assert.rejects(tts.speak({text:'Hello'}),e=>e.code==='network');
});
test('Realtime cancelación durante generación y antes de conectar',async t=>{
  const controller=new AbortController();
  const {tts}=await fixture(t,()=>controller.abort());
  await assert.rejects(tts.speak({text:'Hello',signal:controller.signal}),e=>e.code==='cancelled');
  await assert.rejects(tts.speak({text:'Hello',signal:controller.signal}),e=>e.code==='cancelled');
});
test('Configuración migra modelos retirados y descarta tarifa incompatible',()=>{
  for(const TTS_MODEL of [undefined,'tts-1','tts-1-hd','gpt-4o-mini-tts','gpt-4o-mini-tts-2025-12-15']) {
    const c=loadConfig({TTS_MODEL,RATE_TTS_PER_CHAR:'3'});
    assert.equal(c.ttsModel,'gpt-realtime-2.1-mini');assert.equal(c.rates.ttsPerChar,null);
  }
});
