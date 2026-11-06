// Comprobacion privada del dispositivo. No concede XP ni califica pronunciacion.
import { esc } from './core.js';
import { deviceVoiceAvailable, micSupport, playLocal, speakCustomer, speakDevice, stopPlayback, transcribe, TurnRecorder } from './audio.js';

const SAMPLES = [
  'Good evening! Can I start you off with still or sparkling water?',
  'Let me confirm: one ribeye, medium rare, with asparagus, and dressing on the side.',
  'I cannot guarantee that myself. Let me double-check with the kitchen.',
];

export function mountVoiceLab(root, { voice }) {
  const caps = voice?.capabilities ?? {};
  const support = micSupport();
  let recorder = null, recording = null, controller = null;
  let active = false, permission = false, busy = false, destroyed = false, operation = 0;
  root.innerHTML = `<div class="stack-lg">
    <div><h1>Prueba de voz</h1><p>Comprueba tu micrófono y escucha las voces antes de atender una mesa.</p></div>
    <div class="notice small">No da XP ni modifica tu racha. Aquí no evaluamos pronunciación.</div>
    ${voice?.pilotFree ? '<p class="notice small">Al revisar tu voz, Microsoft Azure recibe la grabación. La app no la guarda. Practica con pedidos ficticios. Grabarte y escucharte aquí solo usa tu dispositivo.</p>' : ''}
    <section class="card stack"><h2>1. Escucha al cliente</h2>
      <label class="field">Frase de prueba<select class="input" data-sample>${SAMPLES.map((s,i)=>`<option value="${i}">${esc(s)}</option>`).join('')}</select></label>
      <label class="switch"><span>Más lento</span><input type="checkbox" data-slow></label>
      <button class="btn btn-block" data-device ${deviceVoiceAvailable()?'':'disabled'}>Escuchar voz del dispositivo</button>
      <button class="btn btn-help btn-block" data-server ${caps.speech?.available?'':'disabled'}>Escuchar voz del cliente</button>
      <p class="small muted">${caps.speech?.available?'Es una voz generada por computador.':'Puedes probar la voz de tu dispositivo.'}</p>
      <button class="btn btn-block" data-stop>Detener audio</button>
    </section>
    <section class="card stack"><h2>2. Graba una frase</h2><p class="small">Toca para empezar y vuelve a tocar para terminar. Máximo 30 segundos. Después puedes escucharte.</p>
      <button class="btn btn-primary btn-block" data-record ${support.ok?'':'disabled'}>Grabar mi voz</button>
      ${support.ok?'':`<p class="notice small">${esc(support.message)}</p>`}
      <button class="btn btn-block" data-self disabled>Escuchar mi grabación</button>
      <button class="btn btn-block" data-discard disabled>Descartar grabación</button>
      <p class="small muted">Se conserva solo en memoria mientras sigues aquí; no se guarda en el servidor.</p>
    </section>
    <section class="card stack"><h2>3. Comprueba lo que entiende</h2>
      <p class="small">${caps.transcription?.available?'Al pulsar este botón, enviarás la grabación al servicio de transcripción configurado. Puede consumir uso. No se envía una respuesta a una mesa.':'La transcripción no está configurada. Escucharte y practicar por texto siguen disponibles.'}</p>
      <button class="btn btn-help btn-block" data-transcribe disabled>Enviar audio para transcribir</button>
      <label class="field">Texto reconocido<textarea class="input" rows="3" data-transcript readonly placeholder="Aquí aparecerá la transcripción"></textarea></label>
      <p class="small muted">Que aparezca una frase correcta no significa que se haya evaluado tu pronunciación.</p>
    </section>
    <p class="notice" role="status" data-status>Listo. Empieza escuchando o grabando una frase.</p>
    <a class="btn btn-block" href="#/hablar">Volver a Hablar</a>
  </div>`;
  const get = (sel) => root.querySelector(sel);
  function status(text) { if (!destroyed) get('[data-status]').textContent = text; }
  function controls() {
    if (destroyed) return;
    const locked = busy || permission || active;
    get('[data-record]').disabled = !support.ok || busy || permission;
    get('[data-record]').textContent = active?'Terminar grabación':'Grabar mi voz';
    get('[data-device]').disabled = locked || !deviceVoiceAvailable();
    get('[data-server]').disabled = locked || !caps.speech?.available;
    get('[data-self]').disabled = locked || !recording;
    get('[data-discard]').disabled = locked || !recording;
    get('[data-transcribe]').disabled = locked || !recording || !caps.transcription?.available;
  }
  async function play(kind) {
    if (busy || permission || active) return;
    const id = ++operation;
    const text = SAMPLES[Number(get('[data-sample]').value)] ?? SAMPLES[0];
    const slow = get('[data-slow]').checked;
    status('Reproduciendo…');
    try {
      let fallback = false;
      const ok = kind==='self'?await playLocal(recording.blob):kind==='device'?await speakDevice(text,{slow}):await speakCustomer(text,{slow,useServer:true,onFallback:()=>{fallback=true;}});
      if (!destroyed && id === operation) status(ok?(fallback?'La voz falló; escuchaste la del dispositivo.':'Audio terminado.'):'Audio detenido o no disponible. Puedes volver a intentarlo.');
    } catch { if (!destroyed && id===operation) status('No se pudo reproducir. Prueba otra voz o revisa el volumen.'); }
  }
  async function finish() {
    if (!recorder || !active) return;
    const local = recorder;
    active = false; busy = true; controls();
    try {
      const out = await local.stop();
      if (destroyed || recorder !== local) return;
      recording = out && !out.silent?out:null;
      status(recording?'Grabación lista. Escúchate o envíala para transcribir.':'No detectamos una grabación audible. Inténtalo de nuevo.');
    } catch (err) { status(err.message); }
    finally { if (recorder===local) { recorder=null; busy=false; controls(); } }
  }
  get('[data-record]').addEventListener('click',async()=>{
    if(active){await finish();return;}
    if(busy||permission)return;
    stopPlayback(); operation++; permission=true; recording=null; get('[data-transcript]').value=''; controls();
    status('Esperando permiso del micrófono…');
    const id=operation;
    const local=new TurnRecorder({maxMs:30000,onAutoStop:finish}); recorder=local;
    try { await local.start(); if(destroyed||id!==operation||recorder!==local){local.abort();return;} active=true; status('Micrófono activo. Toca Terminar grabación.'); }
    catch(err){if(id===operation){status(err.message); if(recorder===local)recorder=null;}}
    finally{if(id===operation){permission=false;controls();}}
  });
  get('[data-device]').addEventListener('click',()=>play('device'));
  get('[data-server]').addEventListener('click',()=>play('server'));
  get('[data-self]').addEventListener('click',()=>play('self'));
  get('[data-stop]').addEventListener('click',()=>{operation++;stopPlayback();if(controller){controller.abort();controller=null;busy=false;controls();}status(active?'Micrófono activo. Toca Terminar grabación.':'Audio detenido.');});
  get('[data-discard]').addEventListener('click',()=>{operation++;stopPlayback();recording=null;get('[data-transcript]').value='';controls();status('Grabación descartada.');});
  get('[data-transcribe]').addEventListener('click',async()=>{
    if(!recording||busy||active)return;
    const id=++operation;stopPlayback();busy=true;controls();controller=new AbortController();const request=controller;
    status('Transcribiendo…');
    try{const result=await transcribe(recording,null,{signal:request.signal,asWav:voice?.pilotFree});if(destroyed||request.signal.aborted||id!==operation)return;get('[data-transcript]').value=result.text??'';status(result.status==='silence'||result.status==='unclear'?'No entendimos bien. Puedes volver a grabar.':'Transcripción recibida. Comprueba cantidades, platos y negaciones.');}
    catch(err){if(!destroyed&&!request.signal.aborted)status(err.message);}
    finally{if(controller===request){controller=null;busy=false;controls();}}
  });
  const cleanup=()=>{operation++;controller?.abort();controller=null;recorder?.abort();recorder=null;recording=null;active=false;permission=false;busy=false;stopPlayback();};
  const hidden=()=>{if(document.hidden){cleanup();controls();status('Audio detenido y grabación descartada al salir de esta pantalla.');}};
  document.addEventListener('visibilitychange',hidden);
  return()=>{destroyed=true;document.removeEventListener('visibilitychange',hidden);cleanup();};
}
