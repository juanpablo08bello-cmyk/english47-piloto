// Integracion HTTP local y adaptadores simulados. No llama proveedores reales.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, login } from './helpers.js';
import { openAiStt } from '../server/voice/providers.js';

test('audio HTTP: rechaza formato y duracion invalidos antes de llamar al proveedor',async()=>{
  let calls=0;
  const app=await startApp({services:{stt:{name:'fake',transcribe:async()=>{calls++;return {text:'One ribeye, no onions.'};}},tts:null,llm:null}});
  try{
    await login(app,'audio.validation');
    const loginRes=await fetch(app.base+'/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:'audio.validation',password:'password123'})});
    const cookie=loginRes.headers.get('set-cookie').split(';')[0];
    const send=async(ms,type='audio/mp4')=>{const r=await fetch(app.base+'/api/voice/transcribe',{method:'POST',headers:{cookie,'content-type':type,'x-audio-ms':String(ms)},body:Buffer.alloc(4000,7)});return {status:r.status,data:await r.json()};};
    for(const ms of ['NaN','Infinity',-1,0,100,60001])assert.equal((await send(ms)).status,400);
    assert.equal((await send(1500,'audio/unknown')).status,415);assert.equal(calls,0);
    const valid=await send(1500,'audio/webm;codecs=opus');assert.equal(valid.status,200);assert.equal(valid.data.requiresConfirmation,true);assert.equal(calls,1);
  }finally{await app.stop();app.db.close();}
});

test('adaptador STT: no presenta una respuesta vacia o JSON roto como transcripcion',async(t)=>{
  const stt=openAiStt({apiKey:'fake',baseUrl:'https://fake.invalid',model:'gpt-transcribe'});
  t.mock.method(globalThis,'fetch',async()=>new Response('{}',{headers:{'content-type':'application/json'}}));
  await assert.rejects(stt.transcribe({audio:Buffer.from('test'),mimeType:'audio/mp4'}),e=>e.code==='provider');
  t.mock.method(globalThis,'fetch',async()=>new Response('broken',{headers:{'content-type':'application/json'}}));
  await assert.rejects(stt.transcribe({audio:Buffer.from('test'),mimeType:'audio/mp4'}),e=>e.code==='provider');
});

