// Pantalla de simulacion por turnos. Estados visibles: inactivo, permiso, grabando,
// enviando, procesando, reproduciendo y error. Nunca se reproduce mientras se graba.
import { api, esc, icons, toast } from './core.js';
import { capybara } from './capybara.js';
import { deviceVoiceAvailable, playLocal, speakCustomer, stopPlayback, transcribe, TurnRecorder } from './audio.js';

const STATE_LABEL = {
  idle: 'Toca para hablar',
  permission: 'Pidiendo permiso del micrófono…',
  recording: 'Micrófono activo. Toca para terminar y revisar',
  sending: 'Enviando…',
  processing: 'Procesando…',
  playing: 'Reproduciendo al cliente…',
  error: 'Hubo un problema',
};

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

export function modeBanner(mode, voice) {
  if (mode === 'demo') {
    return `<div class="status-mode status-demo" role="note">${icons.info}<span><b>DEMO: práctica guiada.</b> El cliente sigue un guion con respuestas de ejemplo y la corrección usa reglas automáticas. No entiende voz ni conversación libre, no es IA.</span></div>`;
  }
  const speech = voice?.capabilities?.speech;
  const stt = voice?.capabilities?.transcription;
  return `<div class="status-mode status-ai" role="note">${icons.info}<span><b>Conversación con IA conectada.</b> ${stt?.available ? 'Tu audio se envía para transcribirlo y no se guarda.' : 'La transcripción no está conectada: responde por texto.'} ${speech?.available ? 'La voz del cliente es generada por IA.' : 'La voz del cliente es la de tu dispositivo.'}</span></div>`;
}

export function mountSim(root, { simId, voice, onFinished, onExit }) {
  let sim = null;
  let state = 'idle';
  let errorMessage = '';
  let recorder = null;
  let showTranscript = true;
  let showText = false;
  let demoRecording = null;
  let pending = null; // toda transcripcion se revisa antes de enviar
  let failedRecording = null;
  let uploadController = null;
  let playId = 0;
  let hint = null;
  let draft = '';
  let attempt = null;
  let busy = false;
  let destroyed = false;
  let recStart = 0;
  let recTimer = null;

  const canUseStt = () => sim?.mode === 'ai' && voice?.capabilities?.transcription?.available;
  const useServerVoice = () => sim?.mode === 'ai' && voice?.capabilities?.speech?.available;
  const lastGuest = () => [...(sim?.turns ?? [])].reverse().find((t) => t.role === 'guest')?.text ?? '';

  function setState(next, message = '') {
    state = next;
    errorMessage = message;
    renderStatus();
  }

  function renderStatus() {
    const box = root.querySelector('[data-mic-state]');
    const mic = root.querySelector('[data-mic]');
    const stopBtn = root.querySelector('[data-stop-audio]');
    if (stopBtn) stopBtn.hidden = state !== 'playing';
    if (!box || !mic) return;
    const locked = ['permission', 'sending', 'processing'].includes(state);
    mic.disabled = locked || busy;
    mic.classList.toggle('recording', state === 'recording');
    mic.setAttribute('aria-label', state === 'recording' ? 'Terminar y revisar' : 'Hablar');
    mic.innerHTML = state === 'recording' ? icons.stop : icons.talk;
    const spin = locked ? '<span class="spinner"></span>' : '';
    const dot = state === 'recording' ? '<span class="rec-dot"></span>' : '';
    const seconds = state === 'recording' ? ` · ${Math.round((performance.now() - recStart) / 1000)} s` : '';
    box.innerHTML = state === 'error' ? esc(errorMessage) : `${spin}${dot}${STATE_LABEL[state]}${seconds}`;
  }

  async function play(text, slow = false) {
    if (destroyed || state === 'recording') return;
    const id = ++playId;
    setState('playing');
    try {
      const played = await speakCustomer(text, { slow, useServer: useServerVoice(), onFallback: () => {
        if (!destroyed && id === playId) toast('La voz IA no respondió. Usamos la voz de tu dispositivo.');
      } });
      if (!played && !destroyed && id === playId && state === 'playing') toast('No se pudo escuchar. Toca Escuchar otra vez o muestra el texto.');
    } finally {
      if (!destroyed && id === playId && state === 'playing') setState('idle');
    }
  }

  function stopAudio() {
    playId += 1;
    stopPlayback();
    if (state === 'playing') setState('idle');
  }

  function chatHtml() {
    const turns = sim.turns.map((t) => (t.role === 'guest'
      ? `<div class="bubble bubble-guest"><small>Cliente</small>${showTranscript ? `<span class="en">${esc(t.text)}</span>` : '<span class="muted">Transcripción oculta</span>'}</div>`
      : `<div class="bubble bubble-me"><small>Tú${t.source === 'audio' ? ' · transcripción de tu voz' : ''}</small>${esc(t.text)}</div>`));
    return `<div class="chat" aria-live="polite">${turns.join('')}</div>`;
  }

  function render() {
    if (destroyed) return;
    const help = sim.helpMode === 'help';
    root.innerHTML = `
      <div class="stack">
        <div class="spread">
          <div class="grow"><h2>${esc(sim.title)}</h2><p class="small muted">${esc(sim.titleEs)} · ${help ? 'Con ayuda' : 'Como en el trabajo'}</p></div>
          ${capybara({ mood: 'focus', size: 56, label: 'Capibara atento' })}
        </div>
        ${modeBanner(sim.mode, voice)}
        ${sim.goal ? `<div class="notice small"><b>Tu tarea:</b> ${esc(sim.goal)}</div>` : ''}
        ${chatHtml()}
        ${hint ? `<div class="notice notice-green small"><b>Pista${hint.generic ? ' orientativa' : ''}:</b> <span class="en">${esc(hint.hint)}</span></div>` : ''}
        ${sim.done ? doneHtml() : inputHtml()}
        ${controlsHtml(help)}
        ${voice?.pilotFree && sim.mode === 'ai' ? '<a class="btn btn-block" href="#/hablar">Elegir una mesa guiada sin IA</a>' : ''}
      </div>`;
    bind();
    renderStatus();
    root.querySelector('.chat')?.lastElementChild?.scrollIntoView({ block: 'nearest' });
  }

  function doneHtml() {
    return `<div class="notice notice-green"><b>La escena terminó.</b> Veamos cómo te fue.</div>
      <button class="btn btn-primary btn-block" data-finish>Ver mi corrección</button>`;
  }

  function inputHtml() {
    if (pending) {
      return `<div class="card card-hl stack">
        <label class="field">Esto fue lo que escuchamos<textarea class="input" rows="3" data-transcript spellcheck="false" autocapitalize="sentences">${esc(pending)}</textarea></label>
        <p class="small muted">Revisa nombres de platos, cantidades y palabras como «no». Puedes corregir el texto antes de enviarlo. La transcripción no evalúa tu pronunciación.</p>
        <div class="row"><button class="btn btn-primary grow" data-confirm-yes>Sí, enviar</button><button class="btn grow" data-confirm-no>Repetir</button></div>
      </div>`;
    }
    if (demoRecording) {
      return `<div class="card card-hl stack">
        <p><b>Te grabamos.</b> La demo no entiende voz: elige lo más parecido a lo que dijiste, o escríbelo.</p>
        <button class="btn btn-help btn-block" data-play-own>${icons.sound}Escuchar mi grabación</button>
        ${sim.demoOptions.map((o) => `<button class="option" data-demo-option="${esc(o)}">${esc(o)}</button>`).join('')}
        <div class="row"><input class="input grow" data-text-input aria-label="Lo que dijiste" placeholder="O escríbelo" autocomplete="off"><button class="btn" data-send-text>Enviar</button></div>
        <button class="linkbtn" data-discard>Volver a grabar</button>
      </div>`;
    }
    const micArea = `<div class="mic-wrap">
        ${canUseStt() ? '' : '<p class="small muted center">Opcional: decirlo en voz alta. Tu grabación se queda en este dispositivo y no se evalúa.</p>'}
        <button class="mic" data-mic aria-label="Hablar">${icons.talk}</button>
        <div class="mic-state" data-mic-state role="status"></div>
      </div>`;
    const textRow = `<div class="stack" style="gap:8px">
        <label class="field" for="sim-text">Tu respuesta en inglés</label>
        <div class="row"><input class="input grow" id="sim-text" data-text-input placeholder="Escribe aquí" autocomplete="off" autocapitalize="sentences" value="${esc(draft)}"><button class="btn btn-primary" data-send-text>Enviar</button></div>
      </div>`;
    const examples = sim.mode === 'demo' ? `<details class="card card-quiet"><summary>Ver respuestas de ejemplo</summary><div class="stack">${sim.demoOptions.map((o) => `<button class="option" data-demo-option="${esc(o)}">${esc(o)}</button>`).join('')}</div></details>` : '';
    // Sin transcripcion conectada, la practica principal es por texto.
    if (!canUseStt()) return `${textRow}${examples}${micArea}`;
    return `${failedRecording ? '<button class="btn btn-help btn-block" data-retry-upload>Reintentar el envío de mi audio</button><p class="small muted">Conservamos esta grabación solo en memoria mientras sigues aquí.</p>' : ''}${micArea}${showText ? `${textRow}${examples}` : '<button class="linkbtn center" data-show-text>No puedo hablar ahora: responder por texto</button>'}`;
  }

  function controlsHtml(help) {
    if (sim.done) return '<button class="btn btn-block" data-restart>Repetir situación</button>';
    const hasAudio = deviceVoiceAvailable() || useServerVoice();
    return `<div class="controls">
      <button class="btn btn-sm" data-stop-audio hidden>${icons.stop}Detener audio</button>
      ${hasAudio ? `<button class="btn btn-sm" data-replay>${icons.sound}Escuchar otra vez</button>
      <button class="btn btn-sm" data-slow>${icons.sound}Más lento</button>
      <button class="btn btn-sm" data-toggle-transcript>${showTranscript ? 'Ocultar texto' : 'Mostrar texto'}</button>` : '<p class="small muted" style="grid-column:1/-1">Este dispositivo no tiene voz disponible: lee al cliente en pantalla.</p>'}
      ${help ? '<button class="btn btn-sm btn-help" data-hint>Pedir pista</button>' : ''}
      <button class="btn btn-sm" data-rephrase>Decirlo de otra forma</button>
      <button class="btn btn-sm" data-restart>Repetir situación</button>
      <button class="btn btn-sm" data-finish style="grid-column:1/-1">Terminar y ver corrección</button>
    </div>`;
  }

  async function submitText(text, source) {
    if (busy || destroyed || ['permission', 'recording', 'sending'].includes(state)) return;
    stopAudio();
    busy = true;
    pending = null;
    demoRecording = null;
    failedRecording = null;
    // El mismo intento conserva su identificador: reenviarlo tras un corte no duplica el turno.
    if (attempt?.text !== text) attempt = { text, id: newId() };
    setState('processing');
    try {
      const out = await api('POST', `/api/sim/${simId}/turn`, { text, source, requestId: attempt.id });
      sim = out.sim;
      hint = null;
      busy = false;
      draft = '';
      attempt = null;
      state = 'idle';
      render();
      if (!destroyed) await play(lastGuest());
    } catch (err) {
      busy = false;
      draft = text;
      state = 'error';
      errorMessage = `${err.message} Tu respuesta sigue aquí: vuelve a enviarla.`;
      render();
    }
  }

  async function toggleMic() {
    if (busy || destroyed || ['permission', 'sending', 'processing'].includes(state)) return;
    if (state === 'recording') { await finishRecording(); return; }
    stopAudio();
    setState('permission');
    recorder = new TurnRecorder({ maxMs: voice?.pilotFree ? 30000 : 60000, onAutoStop: finishRecording });
    try {
      const startingRecorder = recorder;
      await startingRecorder.start();
      if (destroyed || recorder !== startingRecorder) { startingRecorder.abort(); return; }
      recStart = performance.now();
      setState('recording');
      recTimer = setInterval(renderStatus, 1000);
    } catch (err) {
      recorder = null;
      showText = true;
      state = 'error';
      errorMessage = err.message;
      render();
    }
  }

  async function finishRecording() {
    clearInterval(recTimer);
    const stoppingRecorder = recorder;
    if (!stoppingRecorder) return;
    setState('sending');
    let out;
    try { out = await stoppingRecorder.stop(); } catch (err) {
      recorder = null;
      if (!destroyed) { showText = true; state = 'error'; errorMessage = err.message; render(); }
      return;
    }
    recorder = null;
    if (!out || destroyed) return;
    if (out.silent) {
      setState('error', 'No se escuchó nada. Revisa el micrófono e inténtalo otra vez.');
      return;
    }
    if (canUseStt()) { await uploadRecording(out); return; }
    // Demo, o IA sin transcripcion: el audio se queda en el dispositivo.
    if (sim.mode === 'demo') {
      demoRecording = out;
      state = 'idle';
      render();
    } else {
      showText = true;
      state = 'error';
      errorMessage = 'La transcripción no está conectada. Escribe tu respuesta.';
      render();
    }
  }

  async function uploadRecording(out) {
    if (destroyed || busy) return;
    uploadController?.abort();
    const controller = new AbortController();
    uploadController = controller;
    failedRecording = out;
    setState('sending');
    try {
      const r = await transcribe(out, () => { if (!destroyed) setState('processing'); }, { signal: controller.signal, asWav: voice?.pilotFree });
      if (destroyed || controller.signal.aborted) return;
      if (r.status === 'silence' || r.status === 'unclear' || !r.text?.trim()) {
        failedRecording = null;
        state = 'error'; errorMessage = 'No entendimos bien el audio. Vuelve a grabarlo o responde por texto.';
        showText = true; render(); return;
      }
      pending = r.text;
      failedRecording = null;
      state = 'idle'; render();
    } catch (err) {
      if (destroyed || controller.signal.aborted) return;
      showText = true; state = 'error'; errorMessage = err.message; render();
    } finally {
      if (uploadController === controller) uploadController = null;
    }
  }

  function bind() {
    const on = (sel, fn) => root.querySelectorAll(sel).forEach((b) => b.addEventListener('click', (e) => {
      if (sel !== '[data-mic]' && sel !== '[data-stop-audio]' && (busy || ['permission', 'recording', 'sending', 'processing'].includes(state))) return;
      fn(e);
    }));
    on('[data-mic]', toggleMic);
    on('[data-stop-audio]', stopAudio);
    on('[data-show-text]', () => { showText = true; render(); root.querySelector('[data-text-input]')?.focus(); });
    on('[data-send-text]', () => {
      const v = root.querySelector('[data-text-input]')?.value.trim();
      if (!v) { toast('Escribe tu respuesta primero.'); return; }
      submitText(v, 'text');
    });
    root.querySelector('[data-text-input]')?.addEventListener('input', (e) => { draft = e.target.value; });
    root.querySelector('[data-text-input]')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.isComposing) root.querySelector('[data-send-text]')?.click();
    });
    on('[data-demo-option]', (e) => submitText(e.currentTarget.dataset.demoOption, 'text'));
    on('[data-play-own]', () => { if (demoRecording) playLocal(demoRecording.blob).catch(() => toast('No se pudo reproducir.')); });
    on('[data-discard]', () => { demoRecording = null; render(); });
    on('[data-confirm-yes]', () => {
      const text = root.querySelector('[data-transcript]')?.value.trim();
      if (!text) { toast('Revisa el texto antes de enviarlo.'); return; }
      submitText(text, 'audio');
    });
    root.querySelector('[data-transcript]')?.addEventListener('input', (e) => { pending = e.target.value; });
    on('[data-retry-upload]', () => { if (failedRecording) uploadRecording(failedRecording); });
    on('[data-confirm-no]', () => { pending = null; render(); });
    on('[data-replay]', () => { if (state !== 'recording') play(lastGuest()); });
    on('[data-slow]', () => { if (state !== 'recording') play(lastGuest(), true); });
    on('[data-toggle-transcript]', () => { showTranscript = !showTranscript; render(); });
    on('[data-hint]', async () => {
      try { hint = await api('POST', `/api/sim/${simId}/hint`); render(); } catch (err) { toast(err.message); }
    });
    on('[data-rephrase]', async () => {
      if (busy || state === 'recording') return;
      busy = true;
      setState('processing');
      try {
        sim = (await api('POST', `/api/sim/${simId}/rephrase`)).sim;
        busy = false;
        state = 'idle';
        render();
        await play(lastGuest());
      } catch (err) {
        busy = false;
        setState('error', err.message);
      }
    });
    on('[data-restart]', () => { cleanup(); onExit({ restart: true, sim }); });
    on('[data-finish]', async (e) => {
      if (!sim.waiterTurns) { toast('Responde al menos una vez para poder darte una corrección.'); return; }
      e.currentTarget.disabled = true;
      cleanup();
      try {
        const out = await api('POST', `/api/sim/${simId}/finish`);
        onFinished(out);
      } catch (err) {
        toast(err.message);
        e.currentTarget.disabled = false;
      }
    });
  }

  function cleanup() {
    playId += 1;
    uploadController?.abort(); uploadController = null;
    failedRecording = null; demoRecording = null;
    clearInterval(recTimer);
    recorder?.abort();
    recorder = null;
    stopPlayback();
  }

  // Si la pantalla pasa a segundo plano, se libera el microfono de inmediato.
  const onHidden = () => {
    if (document.hidden && ['permission', 'recording', 'sending', 'processing', 'playing'].includes(state)) {
      cleanup();
      setState('error', 'Se detuvo el audio al salir de la pantalla. Puedes volver a intentarlo.');
    }
  };
  document.addEventListener('visibilitychange', onHidden);

  (async () => {
    try {
      sim = (await api('GET', `/api/sim/${simId}`)).sim;
      if (sim.status === 'finished') { onFinished({ sim, rewards: null }); return; }
      if (sim.waiterTurns === 0 && !sim.done) showTranscript = sim.helpMode === 'help';
      render();
      if (sim.waiterTurns === 0) await play(lastGuest());
    } catch (err) {
      root.innerHTML = `<div class="notice notice-amber">${esc(err.message)}</div>`;
    }
  })();

  return () => {
    destroyed = true;
    document.removeEventListener('visibilitychange', onHidden);
    cleanup();
  };
}
