// Pruebas de logica de audio con APIs de navegador simuladas, NO pruebas de un telefono.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mountSim } from '../public/js/sim.js';
import { modelVoiceFor } from '../public/js/voz.js';
import { mountVoiceLab } from '../public/js/voice-lab.js';
import { speakCustomer, speakDevice, playLocal, stopPlayback, transcribe, TurnRecorder } from '../public/js/audio.js';

function browser(t, extra = {}) {
  const spoken = [], audios = [], revoked = [];
  let recorder;
  class MR {
    static isTypeSupported(t) { return t === 'audio/mp4'; }
    constructor(stream, options) { this.state = 'inactive'; this.mimeType = options?.mimeType; recorder = this; }
    start() { this.state = 'recording'; }
    stop() {
      this.state = 'inactive';
      queueMicrotask(() => { this.ondataavailable?.({data: new Blob(['test'])}); this.onstop?.(); });
    }
  }
  class Audio {
    constructor(src) { this.src = src; audios.push(this); }
    play() { return Promise.resolve(); }
    pause() {}
  }
  const window = { isSecureContext: true, MediaRecorder: MR, SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
    speechSynthesis: { getVoices: () => [{lang:'en-US',name:'Test'}], cancel() {}, speak: (u) => spoken.push(u) }, ...extra };
  const saved = [], cleanups = [];
  const property = (name, value) => { saved.push([name, Object.getOwnPropertyDescriptor(globalThis, name)]); Object.defineProperty(globalThis, name, { configurable: true, writable: true, value }); };
  property('window', window);
  const listeners = new Map();
  property('document', { hidden: false, addEventListener: (k,v)=>listeners.set(k,v), removeEventListener: (k)=>listeners.delete(k), getElementById: ()=>({append(){}}), createElement: ()=>({setAttribute(){},remove(){}}) });
  property('navigator', { mediaDevices: { getUserMedia: async () => ({getTracks: () => []}) } });
  property('Audio', Audio);
  property('requestAnimationFrame', () => 1);
  property('cancelAnimationFrame', () => {});
  t.mock.method(URL, 'createObjectURL', () => 'blob:test');
  t.mock.method(URL, 'revokeObjectURL', (u) => revoked.push(u));
  t.after(() => { for (const cleanup of cleanups) cleanup(); stopPlayback(); for (const [name, descriptor] of saved.reverse()) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name]; } });
  return {spoken,audios,revoked,window,listeners,cleanups,get recorder() { return recorder; }};
}

test('no se graba ni se avisa hasta que el microfono entrega sonido real', async (t) => {
  let flowing = false; let constraints;
  class Ctx {
    state = 'running';
    createMediaStreamSource() { return { connect() {} }; }
    createAnalyser() { return { getByteTimeDomainData: (d) => d.fill(flowing ? 130 : 128) }; }
    close() { return Promise.resolve(); }
  }
  const b = browser(t, { AudioContext: Ctx });
  navigator.mediaDevices.getUserMedia = async (c) => { constraints = c; return { getTracks: () => [] }; };
  const r = new TurnRecorder();
  const start = r.start();
  await new Promise((ok) => setTimeout(ok, 80));
  assert.equal(b.recorder, undefined, 'el microfono abierto todavia no escucha');
  assert.equal(r.active, false);
  flowing = true;
  await start;
  assert.equal(b.recorder.state, 'recording');
  assert.equal(r.active, true);
  assert.equal(constraints.audio.noiseSuppression, false, 'el filtro de ruido recorta el inicio');
  r.abort();
});

test('si el microfono nunca entrega sonido, se graba igual tras la espera maxima', async (t) => {
  class Ctx { state = 'running'; createMediaStreamSource() { return { connect() {} }; } createAnalyser() { return { getByteTimeDomainData: (d) => d.fill(128) }; } close() { return Promise.resolve(); } }
  const b = browser(t, { AudioContext: Ctx });
  const r = new TurnRecorder();
  await r.start();
  assert.equal(b.recorder.state, 'recording');
  r.abort();
});

test('la voz modelo alterna entre frases y no cambia al repetir la misma', () => {
  const a = modelVoiceFor('Frase uno.'); const b = modelVoiceFor('Frase dos.'); const c = modelVoiceFor('Frase tres.');
  assert.notEqual(a.azure, b.azure);
  assert.equal(a.azure, c.azure);
  assert.equal(modelVoiceFor('Frase uno.').azure, a.azure, 'repetir conserva la voz');
  assert.deepEqual([a.azure, b.azure].map((x) => x.slice(0, 5)).sort(), ['es-MX', 'es-VE']);
});

test('cancelar descarga de voz impide que una respuesta tardia empiece a hablar', async (t) => {
  const b=browser(t);let done;
  t.mock.method(globalThis,'fetch',()=>new Promise(r=>{done=r;}));
  const p=speakCustomer('Old turn',{useServer:true});stopPlayback();
  done(new Response(new Blob(['sound'],{type:'audio/mpeg'})));
  assert.equal(await p,false);assert.equal(b.audios.length,0);assert.equal(b.spoken.length,0);
});

test('la frase nueva gana si dos descargas llegan fuera de orden', async(t)=>{
  const b=browser(t);const pending=[];
  t.mock.method(globalThis,'fetch',()=>new Promise(r=>pending.push(r)));
  const old=speakCustomer('old',{useServer:true});
  const fresh=speakCustomer('new',{useServer:true});
  pending[0]({ok:true,blob:async()=>new Blob(['old'])});assert.equal(await old,false);
  pending[1]({ok:true,blob:async()=>new Blob(['new'])});
  await new Promise(r=>setImmediate(r));assert.equal(b.audios.length,1);
  b.audios[0].onended();assert.equal(await fresh,true);
});

test('detener reproduccion resuelve la espera y libera el blob',async(t)=>{
  const b=browser(t);const p=playLocal(new Blob(['sound']));
  stopPlayback();assert.equal(await p,false);assert.deepEqual(b.revoked,['blob:test']);
});

test('voz del dispositivo no informa exito al vencer el tiempo',async(t)=>{
  const b=browser(t);t.mock.timers.enable({apis:['setTimeout']});
  const p=speakDevice('Hi');assert.equal(b.spoken.length,1);
  t.mock.timers.tick(10001);assert.equal(await p,false);
});

test('voz del dispositivo solo confirma exito al terminar',async(t)=>{
  const b=browser(t);const p=speakDevice('Good evening');b.spoken[0].onend();assert.equal(await p,true);
});

test('un error del proveedor activa una alternativa audible identificable',async(t)=>{
  const b=browser(t);let fallback=0;
  t.mock.method(globalThis,'fetch',async()=>new Response('',{status:502}));
  const p=speakCustomer('Hello',{useServer:true,onFallback:()=>fallback++});
  await new Promise(r=>setImmediate(r));assert.equal(fallback,1);b.spoken[0].onend();assert.equal(await p,true);
});

test('salir mientras se concede permiso libera el microfono tardio',async(t)=>{
  browser(t);let permit,stopped=0;
  navigator.mediaDevices.getUserMedia=()=>new Promise(r=>permit=r);
  const r=new TurnRecorder();const p=r.start();r.abort();
  permit({getTracks:()=>[{stop:()=>stopped++}]});
  await assert.rejects(p,e=>e.code==='cancelled');assert.equal(stopped,1);assert.equal(r.active,false);
});

test('si MediaRecorder falla al crearse, el microfono tambien se libera',async(t)=>{
  browser(t,{MediaRecorder:class { static isTypeSupported(){return false;} constructor(){throw Error('codec');} }});
  let stopped=0;navigator.mediaDevices.getUserMedia=async()=>({getTracks:()=>[{stop:()=>stopped++}]});
  await assert.rejects(new TurnRecorder().start(),e=>e.code==='mic_error');assert.equal(stopped,1);
});

test('dos toques en terminar comparten el mismo resultado y cierran el microfono',async(t)=>{
  browser(t);let stopped=0;navigator.mediaDevices.getUserMedia=async()=>({getTracks:()=>[{stop:()=>stopped++}]});
  const r=new TurnRecorder();await r.start();r.startedAt=performance.now()-1500;
  const a=r.stop(),b=r.stop();assert.equal(a,b);const out=await a;
  assert.equal(out.silent,false);assert.equal(out.mimeType,'audio/mp4');assert.equal(stopped,1);
});

test('contexto de audio suspendido no se interpreta como silencio seguro',async(t)=>{
  browser(t,{AudioContext:class {state='suspended';close(){return Promise.resolve();}}});
  const r=new TurnRecorder();await r.start();r.startedAt=performance.now()-1500;
  assert.equal(r.levelKnown,false);assert.equal((await r.stop()).silent,false);
});

test('el limite de grabacion sin callback tambien detiene el microfono',async(t)=>{
  const b=browser(t);t.mock.timers.enable({apis:['setTimeout']});
  const r=new TurnRecorder({maxMs:500});await r.start();t.mock.timers.tick(501);
  await new Promise(r=>setImmediate(r));assert.equal(b.recorder.state,'inactive');assert.equal(r.active,false);
});

test('una transcripcion con JSON roto devuelve error recuperable',async(t)=>{
  browser(t);t.mock.method(globalThis,'fetch',async()=>new Response('bad',{status:502}));
  await assert.rejects(transcribe({blob:new Blob(['voice']),ms:1000,mimeType:'audio/mp4'}),e=>e.code==='bad_response');
});

test('cancelar la transcripcion comunica cancelacion sin afirmar fallo de red',async(t)=>{
  browser(t);t.mock.method(globalThis,'fetch',async(_url,{signal})=>{
    if(signal.aborted)throw new DOMException('Aborted','AbortError');
    return new Promise((_r,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError'))));
  });
  const controller=new AbortController();const p=transcribe({blob:new Blob(['voice']),ms:1000,mimeType:'audio/mp4'},null,{signal:controller.signal});
  controller.abort();await assert.rejects(p,e=>e.code==='cancelled');
});


// DOM minimo para ejecutar handlers: no es un navegador ni verifica el layout.
class RootDouble {
  constructor(){this.nodes=new Map();this.html='';}
  set innerHTML(value){this.html=value;this.nodes.clear();}
  get innerHTML(){return this.html;}
  querySelector(selector){
    if(selector==='.chat')return {lastElementChild:{scrollIntoView(){}}};
    if(!selector.startsWith('['))return null;
    const name=selector.slice(1,-1);
    if(!this.html.includes(name))return null;
    if(!this.nodes.has(selector)){
      const text=this.html.match(new RegExp('<textarea[^>]*'+name+'[^>]*>([^<]*)</textarea>'))?.[1]??'';
      const node={value:text,checked:false,hidden:false,disabled:false,textContent:'',innerHTML:'',handlers:{},classList:{toggle(){}},setAttribute(){},focus(){},addEventListener(k,fn){this.handlers[k]=fn;}};
      this.nodes.set(selector,node);
    }
    return this.nodes.get(selector);
  }
  querySelectorAll(selector){const n=this.querySelector(selector);return n?[n]:[];}
  click(selector){const n=this.querySelector(selector);assert.ok(n,'Existe '+selector);return n.handlers.click?.({currentTarget:n});}
}
const flush=()=>new Promise(r=>setImmediate(r));
const json=(data)=>({ok:true,status:200,headers:new Headers({'content-type':'application/json'}),json:async()=>data});

test('simulacion: lo entendido espera confirmacion, se puede escuchar y no se escribe',async(t)=>{
  const b=browser(t);let now=1000;t.mock.method(performance,'now',()=>now);
  const root=new RootDouble();const turns=[];
  const sim={id:1,mode:'ai',helpMode:'help',status:'active',title:'Dinner',titleEs:'Cena',turns:[{role:'guest',text:'Hello'}],waiterTurns:0,done:false};
  t.mock.method(globalThis,'fetch',async(path,options)=>{
    if(path==='/api/voice/transcribe')return json({text:'Two steaks, onions on the side.',status:'ok'});
    if(path==='/api/sim/1/turn'){turns.push(JSON.parse(options.body));return json({sim:{...sim,waiterTurns:1,turns:[...sim.turns,{role:'guest',text:'Thanks'}]}});}
    return json({sim});
  });
  const cleanup=mountSim(root,{simId:1,voice:{capabilities:{transcription:{available:true},speech:{available:false}}},onFinished(){},onExit(){}});b.cleanups.push(cleanup);
  await flush();root.click('[data-mic]');await flush();now=2600;
  root.click('[data-mic]');await flush();
  assert.equal(turns.length,0,'No envio automatico aunque status sea ok');
  assert.match(root.innerHTML,/Se entendió/);
  assert.match(root.innerHTML,/Two steaks, onions on the side\./);
  assert.match(root.innerHTML,/data-play-own/,'puede escuchar su grabacion');
  assert.doesNotMatch(root.innerHTML,/<textarea|<input/,'no hay donde escribir');
  root.click('[data-confirm-yes]');await flush();
  assert.equal(turns.length,1);assert.equal(turns[0].text,'Two steaks, onions on the side.');assert.equal(turns[0].source,'audio');
});

test('prueba de voz: grabarse es local y transcribir requiere un toque separado',async(t)=>{
  const b=browser(t);let now=1000;t.mock.method(performance,'now',()=>now);
  const root=new RootDouble();let uploads=0;
  t.mock.method(globalThis,'fetch',async(path)=>{assert.equal(path,'/api/voice/transcribe');uploads++;return json({text:'Medium rare, please.',status:'ok'});});
  const cleanup=mountVoiceLab(root,{voice:{capabilities:{transcription:{available:true},speech:{available:false}}}});b.cleanups.push(cleanup);
  await root.click('[data-record]');now=2600;await root.click('[data-record]');
  assert.equal(uploads,0);assert.equal(root.querySelector('[data-self]').disabled,false);
  await root.click('[data-transcribe]');assert.equal(uploads,1);
  assert.equal(root.querySelector('[data-transcript]').textContent,'Medium rare, please.');
});


test('terminar antes de conceder permiso tambien cancela la futura grabacion',async(t)=>{
  browser(t);let permit,stopped=0;navigator.mediaDevices.getUserMedia=()=>new Promise(r=>permit=r);
  const recorder=new TurnRecorder();const start=recorder.start();assert.equal(await recorder.stop(),null);
  permit({getTracks:()=>[{stop:()=>stopped++}]});await assert.rejects(start,e=>e.code==='cancelled');assert.equal(stopped,1);
});
