// Reproductor de ejercicios: una tarea por pantalla, retroalimentacion privada, sin vidas.
// Tras una correccion en respuesta abierta hay una oportunidad real de responder de nuevo.
import { esc, icons, toast } from './core.js';
import { deviceVoiceAvailable, micSupport, playLocal, speakDevice, stopPlayback, transcribe, TurnRecorder } from './audio.js';

const FEEDBACK = {
  correct: { title: 'Bien resuelto', icon: icons.check, cls: 'correct' },
  close: { title: 'Casi: compáralo', icon: icons.review, cls: 'close' },
  needs_review: { title: 'Necesita revisión', icon: icons.info, cls: 'needs-review' },
  review: { title: 'Para repasar', icon: icons.review, cls: 'review' },
};
const OPEN_TYPES = new Set(['recall', 'respond', 'fix_error', 'rephrase', 'confirm']);
const DIM_LABEL = {
  meaning: { ok: 'Significado: claro', partial: 'Significado: en parte', unclear: 'Significado: sin confirmar', contradiction: 'Significado: lo contradice', none: 'Significado: no identificado' },
  grammar: { none_detected: 'Gramática: sin errores comunes', issue: 'Gramática: revisar', unclear: 'Gramática: sin confirmar' },
  courtesy: { ok: 'Cortesía: adecuada', blunt: 'Cortesía: brusca', casual: 'Cortesía: informal' },
  goal: { met: 'Objetivo: cumplido', unmet: 'Objetivo: pendiente', violated: 'Objetivo: no cumplido', unclear: 'Objetivo: sin confirmar' },
};

function dimChips(dims = {}) {
  const chips = Object.entries(dims)
    .filter(([k, v]) => DIM_LABEL[k]?.[v])
    .map(([k, v]) => {
      const good = ['ok', 'none_detected', 'met'].includes(v);
      const bad = ['contradiction', 'violated', 'blunt', 'issue', 'none'].includes(v);
      return `<span class="chip ${good ? 'chip-green' : bad ? 'chip-amber' : ''}">${esc(DIM_LABEL[k][v])}</span>`;
    });
  return chips.length ? `<div class="row-wrap">${chips.join('')}</div>` : '';
}

export function feedbackHtml(result) {
  const f = FEEDBACK[result.status] ?? FEEDBACK.review;
  const fb = result.feedback ?? {};
  const parts = [];
  if (result.status !== 'correct' && fb.communicated) parts.push(`<p class="small"><b>Qué comunicaste:</b> ${esc(fb.communicated)}</p>`);
  if (fb.change) parts.push(`<p class="small"><b>${result.status === 'correct' ? 'Nota' : 'Qué cambiar'}:</b> ${esc(fb.change)}</p>`);
  if (fb.answer) parts.push(`<p class="small"><b>Respuesta correcta:</b> <span class="en">${esc(fb.answer)}</span></p>`);
  if (result.status !== 'correct' && fb.corrected) parts.push(`<p class="small"><b>Versión corregida:</b> <span class="en">${esc(fb.corrected)}</span></p>`);
  if (fb.natural && fb.natural !== fb.corrected) parts.push(`<p class="small"><b>Alternativa natural:</b> <span class="en">${esc(fb.natural)}</span></p>`);
  if (result.note) parts.push(`<p class="small">${esc(result.note)}</p>`);
  if (result.reviewScheduled) parts.push('<p class="small">Esta expresión volverá pronto en tu repaso.</p>');
  const evaluated = result.dims && Object.keys(result.dims).length ? '<p class="small muted">Revisado con reglas automáticas, sin IA. Pronunciación: no evaluada.</p>' : '';
  return `<div class="feedback feedback-${f.cls}" role="status">
    <b>${f.icon}${f.title}</b>
    ${dimChips(result.dims)}
    ${parts.join('')}
    ${evaluated}
  </div>`;
}

/**
 * exercises: lista publica; answered: {indice: resultado}.
 * submit(index, answer, ex, retry) debe devolver { result, retry? }.
 */
export function mountExercises(root, { title, exercises, answered = {}, submit, onDone, onClose, canTranscribe = false }) {
  const results = { ...answered };
  let index = exercises.findIndex((_, i) => !results[i]);
  if (index < 0) { onDone(); return () => {}; }
  let recorder = null;
  let recording = null;
  let localBlob = null;
  let picked = { option: null, reason: null };
  let built = [];

  const cleanup = () => {
    recorder?.abort();
    recorder = null;
    stopPlayback();
  };

  function guestBubble(ex) {
    return ex.guest ? `<div class="bubble bubble-guest"><small>${esc(ex.speaker ?? 'Cliente')}</small><span class="en">${esc(ex.guest)}</span></div>` : '';
  }

  function textAnswer(withMic, label = 'Tu respuesta') {
    return `<label class="field">${esc(label)}
        <textarea class="input" rows="2" data-text autocomplete="off" autocapitalize="sentences" spellcheck="false" placeholder="Escríbela en inglés"></textarea>
      </label>
      ${withMic ? `<button class="btn btn-block" data-dictate>${icons.talk}<span>Decirla con mi voz</span></button><div class="mic-state small" data-state></div>` : ''}
      <button class="btn btn-primary btn-block" data-send-text>Comprobar</button>`;
  }

  function bodyFor(ex) {
    const hasVoice = deviceVoiceAvailable();
    const listenOnly = ex.audio && !ex.guest && !ex.text;
    const listen = ex.audio ? `${hasVoice ? `<button class="btn btn-help btn-block" data-listen>${icons.sound}Escuchar</button>` : '<div class="notice notice-amber small">Este dispositivo no tiene voz disponible: lee el texto.</div>'}
      ${listenOnly ? `<p class="card card-quiet en" data-transcript ${hasVoice ? 'hidden' : ''}>${esc(ex.audio)}</p>${hasVoice ? '<button class="linkbtn" data-show-transcript>No puedo escuchar: mostrar el texto</button>' : ''}` : ''}` : '';
    switch (ex.type) {
      case 'listen_choose':
      case 'complete':
      case 'choice':
      case 'distinguish':
        return `${guestBubble(ex)}${listen}
          ${ex.text ? `<p class="gap-text">${esc(ex.text)}</p>` : ''}
          <div class="stack" data-options>${ex.options.map((o) => `<button class="option" data-option="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
      case 'best_choice':
        return `${guestBubble(ex)}${listen}
          <p class="small muted">Elige la respuesta:</p>
          <div class="stack" data-best>${ex.options.map((o) => `<button class="option" data-best-option="${esc(o)}" aria-pressed="false">${esc(o)}</button>`).join('')}</div>
          <p class="small muted">¿Por qué es la mejor?</p>
          <div class="stack" data-why>${ex.reasons.map((o) => `<button class="option" data-best-reason="${esc(o)}" aria-pressed="false">${esc(o)}</button>`).join('')}</div>
          <button class="btn btn-primary btn-block" data-send-best disabled>Comprobar</button>`;
      case 'order':
        return `${ex.cue ? `<p class="muted small">${esc(ex.cue)}</p>` : ''}
          <div class="order-built" data-built aria-live="polite"><span class="muted small">Toca las palabras en orden</span></div>
          <div class="row-wrap" data-tokens>${ex.tokens.map((t, i) => `<button class="chip token" data-token="${i}">${esc(t)}</button>`).join('')}</div>
          <div class="row"><button class="btn grow" data-clear>Borrar</button><button class="btn btn-primary grow" data-send-order disabled>Comprobar</button></div>`;
      case 'recall':
        return `<div class="card card-quiet"><p class="small muted">Di en inglés</p><p class="gap-text">${esc(ex.cue)}</p></div>${textAnswer(canTranscribe)}`;
      case 'respond':
        return `${guestBubble(ex)}${listen}
          ${ex.cue ? `<p class="small muted">${ex.vocabId ? 'Idea' : 'Tu objetivo'}: ${esc(ex.cue)}. Cualquier respuesta profesional que cumpla la intención vale.</p>` : ''}
          ${textAnswer(canTranscribe)}`;
      case 'fix_error':
        return `<div class="card card-quiet"><p class="small muted">Tiene un error</p><p class="gap-text">${esc(ex.text)}</p></div>${textAnswer(canTranscribe, 'Escríbela corregida')}`;
      case 'rephrase':
        return `<div class="card card-quiet"><p class="small muted">Suena brusco</p><p class="gap-text">${esc(ex.text)}</p></div>${textAnswer(canTranscribe, 'Dilo mejor')}`;
      case 'confirm':
        return `${guestBubble(ex)}${listen}
          <p class="small muted">${esc(ex.cue ?? 'Repítela con todos sus detalles.')}</p>
          ${textAnswer(canTranscribe, 'Tu confirmación')}`;
      case 'repeat':
        return `<p class="gap-text">${esc(ex.text)}</p>${listen}
          <div class="mic-wrap">
            <button class="mic" data-rec aria-label="Grabar">${icons.talk}</button>
            <div class="mic-state" data-state>Toca para grabar tu voz</div>
          </div>
          <button class="btn btn-block" data-play-self hidden>${icons.sound}Escuchar mi grabación</button>
          <p class="small muted">Tu grabación se queda en este dispositivo y se descarta. Aquí no se evalúa pronunciación.</p>
          <details><summary class="linkbtn">No puedo hablar ahora: escribirla</summary>
            <div class="stack"><input class="input" data-text aria-label="Escribe la frase" autocomplete="off" autocapitalize="none"><button class="btn btn-block" data-send-text>Comprobar</button></div>
          </details>
          <button class="btn btn-primary btn-block" data-confirm-rec hidden>Ya lo repetí</button>`;
      default:
        return `<div class="notice notice-amber">Este ejercicio no está disponible.</div>`;
    }
  }

  function render() {
    cleanup();
    localBlob = null;
    recording = null;
    picked = { option: null, reason: null };
    built = [];
    const ex = exercises[index];
    const pct = Math.round((Object.keys(results).length / exercises.length) * 100);
    root.innerHTML = `<div class="ex-top">
        <button class="iconbtn" data-close aria-label="Pausar y salir">${icons.close}</button>
        <div class="bar grow" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Avance"><i style="width:${pct}%"></i></div>
        <span class="small muted">${index + 1}/${exercises.length}</span>
      </div>
      <div class="stack">
        <p class="small muted">${esc(title)}</p>
        <h2>${esc(ex.prompt)}</h2>
        ${bodyFor(ex)}
        <div data-feedback></div>
        <button class="btn btn-help btn-block" data-retry hidden>Volver a intentarlo</button>
        <button class="btn btn-primary btn-block" data-next hidden>Continuar</button>
      </div>`;
    bind(ex);
    if (ex.audio && ex.type === 'listen_choose') speakDevice(ex.audio);
  }

  const inputs = () => root.querySelectorAll('[data-send-text], [data-option], [data-send-best], [data-best-option], [data-best-reason], [data-token], [data-send-order], [data-clear], textarea[data-text], input[data-text]');
  const setBusy = (on) => inputs().forEach((b) => { b.disabled = on; });

  async function send(ex, answer, optionEl, retry = false) {
    setBusy(true);
    try {
      const { result, retry: mustRetry } = await submit(index, answer, ex, retry);
      if (mustRetry) {
        toast(result.feedback?.change ?? result.note ?? 'Inténtalo de nuevo.');
        setBusy(false);
        return;
      }
      results[index] = result;
      if (optionEl) {
        root.querySelectorAll('[data-option]').forEach((b) => {
          if (b.dataset.option === result.expected) b.classList.add('is-right');
          else if (b === optionEl) b.classList.add('is-wrong');
        });
      }
      root.querySelector('[data-feedback]').innerHTML = feedbackHtml(result);
      root.querySelectorAll('[data-rec], [data-confirm-rec], [data-dictate], details').forEach((n) => n.remove());
      const canRetry = result.canRetry && OPEN_TYPES.has(ex.type);
      root.querySelector('[data-retry]').hidden = !canRetry;
      const next = root.querySelector('[data-next]');
      next.hidden = false;
      next.focus();
    } catch (err) {
      // Tu respuesta sigue en pantalla: reenviarla no la cuenta dos veces.
      root.querySelector('[data-feedback]').innerHTML = `<div class="notice notice-amber small" role="alert">${esc(err.message)} Tu respuesta sigue aquí: vuelve a tocar el botón.</div>`;
      setBusy(false);
    }
  }

  function bind(ex) {
    root.querySelector('[data-close]').addEventListener('click', () => { cleanup(); onClose(); });
    root.querySelector('[data-listen]')?.addEventListener('click', () => speakDevice(ex.audio));
    root.querySelector('[data-show-transcript]')?.addEventListener('click', (e) => {
      root.querySelector('[data-transcript]').hidden = false;
      e.currentTarget.remove();
    });
    root.querySelectorAll('[data-option]').forEach((b) => b.addEventListener('click', () => {
      b.classList.add('selected');
      send(ex, b.dataset.option, b);
    }));
    const textField = root.querySelector('[data-text]');
    let retrying = false;
    root.querySelector('[data-send-text]')?.addEventListener('click', () => {
      const value = textField?.value.trim();
      if (!value) { toast('Escribe tu respuesta para comprobarla.'); textField?.focus(); return; }
      send(ex, { text: value }, null, retrying);
    });
    root.querySelector('[data-retry]').addEventListener('click', (e) => {
      retrying = true;
      e.currentTarget.hidden = true;
      root.querySelector('[data-next]').hidden = true;
      root.querySelector('[data-feedback]').innerHTML = '<p class="small muted">Tu respuesta anterior ya está registrada. Inténtalo otra vez, con tus palabras.</p>';
      setBusy(false);
      if (textField) { textField.value = ''; textField.focus(); }
    });
    root.querySelector('[data-next]').addEventListener('click', () => {
      const next = exercises.findIndex((_, i) => !results[i]);
      if (next < 0) { cleanup(); onDone(); return; }
      index = next;
      render();
    });
    bindBest(ex);
    bindOrder(ex);
    bindRecord();
    bindDictate(textField);
  }

  function bindBest(ex) {
    const submitBtn = root.querySelector('[data-send-best]');
    if (!submitBtn) return;
    const refresh = () => {
      root.querySelectorAll('[data-best-option]').forEach((b) => {
        const on = b.dataset.bestOption === picked.option;
        b.classList.toggle('selected', on);
        b.setAttribute('aria-pressed', String(on));
      });
      root.querySelectorAll('[data-best-reason]').forEach((b) => {
        const on = b.dataset.bestReason === picked.reason;
        b.classList.toggle('selected', on);
        b.setAttribute('aria-pressed', String(on));
      });
      submitBtn.disabled = !(picked.option && picked.reason);
    };
    root.querySelectorAll('[data-best-option]').forEach((b) => b.addEventListener('click', () => { picked.option = b.dataset.bestOption; refresh(); }));
    root.querySelectorAll('[data-best-reason]').forEach((b) => b.addEventListener('click', () => { picked.reason = b.dataset.bestReason; refresh(); }));
    submitBtn.addEventListener('click', () => send(ex, { option: picked.option, reason: picked.reason }));
  }

  function bindOrder(ex) {
    const box = root.querySelector('[data-built]');
    if (!box) return;
    const sendBtn = root.querySelector('[data-send-order]');
    const draw = () => {
      box.innerHTML = built.length ? built.map((i) => `<span class="en">${esc(ex.tokens[i])}</span>`).join(' ') : '<span class="muted small">Toca las palabras en orden</span>';
      root.querySelectorAll('[data-token]').forEach((b) => { b.hidden = built.includes(Number(b.dataset.token)); });
      sendBtn.disabled = built.length !== ex.tokens.length;
    };
    root.querySelectorAll('[data-token]').forEach((b) => b.addEventListener('click', () => { built.push(Number(b.dataset.token)); draw(); }));
    root.querySelector('[data-clear]').addEventListener('click', () => { built = []; draw(); });
    sendBtn.addEventListener('click', () => send(ex, { tokens: built.map((i) => ex.tokens[i]) }));
  }

  function bindRecord() {
    const rec = root.querySelector('[data-rec]');
    if (!rec) return;
    const state = root.querySelector('[data-state]');
    const self = root.querySelector('[data-play-self]');
    const confirmBtn = root.querySelector('[data-confirm-rec]');
    const stopRec = async () => {
      const out = await recorder?.stop();
      recorder = null;
      rec.classList.remove('recording');
      if (!out) return;
      if (out.silent) {
        state.textContent = 'No se escuchó nada. Acércate al micrófono e inténtalo otra vez.';
        return;
      }
      recording = out;
      localBlob = out.blob;
      state.textContent = 'Grabado. Escúchate o vuelve a intentarlo.';
      self.hidden = false;
      confirmBtn.hidden = false;
    };
    rec.addEventListener('click', async () => {
      if (recorder) { await stopRec(); return; }
      stopPlayback();
      state.innerHTML = '<span class="spinner"></span>Pidiendo permiso del micrófono…';
      recorder = new TurnRecorder({ maxMs: 20000, onAutoStop: stopRec });
      try {
        await recorder.start();
        rec.classList.add('recording');
        state.innerHTML = '<span class="rec-dot"></span>Micrófono activo. Toca para terminar';
      } catch (err) {
        recorder = null;
        state.textContent = err.message;
      }
    });
    self.addEventListener('click', () => { if (localBlob) playLocal(localBlob).catch(() => toast('No se pudo reproducir la grabación.')); });
    confirmBtn.addEventListener('click', () => send(exercises[index], { recordedMs: recording?.ms ?? 0 }));
    if (!micSupport().ok) state.textContent = micSupport().message;
  }

  function bindDictate(textField) {
    const btn = root.querySelector('[data-dictate]');
    if (!btn) return;
    const state = root.querySelector('[data-state]');
    const label = btn.querySelector('span');
    const finish = async () => {
      const out = await recorder?.stop();
      recorder = null;
      label.textContent = 'Decirla con mi voz';
      if (!out) return;
      if (out.silent) { state.textContent = 'No se escuchó nada. Inténtalo otra vez.'; return; }
      btn.disabled = true;
      state.innerHTML = '<span class="spinner"></span>Enviando audio…';
      try {
        const r = await transcribe(out, () => { state.innerHTML = '<span class="spinner"></span>Procesando…'; });
        if (r.status === 'silence' || r.status === 'unclear') {
          state.textContent = 'No entendimos bien. Repítelo o escríbelo.';
        } else {
          textField.value = r.text;
          state.textContent = 'Revisa lo que escuchamos y pulsa Comprobar.';
        }
      } catch (err) {
        state.textContent = err.message;
      }
      btn.disabled = false;
    };
    btn.addEventListener('click', async () => {
      if (recorder) { await finish(); return; }
      recorder = new TurnRecorder({ maxMs: 30000, onAutoStop: finish });
      state.innerHTML = '<span class="spinner"></span>Pidiendo permiso del micrófono…';
      try {
        await recorder.start();
        label.textContent = 'Terminar y enviar';
        state.innerHTML = '<span class="rec-dot"></span>Micrófono activo';
      } catch (err) {
        recorder = null;
        state.textContent = err.message;
      }
    });
  }

  render();
  return cleanup;
}
