// Micrófono guiado para Mesas y Mejorar: tocar, hablar, tocar. No hay escritura en estas secciones.
import { ApiError, esc, icons, reportIssue } from './core.js';
import { assessSpeech, micSupport, playLocal, speakCustomer, stopPlayback, transcribe, TurnRecorder } from './audio.js';

const MIC_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>`;

const MIC_HELP = {
  denied: 'Activa el micrófono: toca el candado junto a la dirección y permite el micrófono.',
  no_mic: 'No encontramos un micrófono en este equipo.',
  busy: 'Otra app está usando el micrófono. Ciérrala y vuelve a intentar.',
  insecure: 'El micrófono necesita una conexión segura (https).',
  unsupported: 'Este navegador no permite grabar. Abre la app en Chrome o Safari.',
};

const MIC_REPORT = { denied: 'mic_denied', no_mic: 'mic_no_device', busy: 'mic_busy' };

/** Si el teléfono bloquea el sonido, se señala el altavoz en vez de quedarse en silencio. */
export function showAudioBlocked(root, button, message = 'Toca el altavoz para oír al cliente.') {
  reportIssue('audio_blocked');
  button?.classList.add('attention');
  const note = root.querySelector('#voicenote');
  if (note) { note.textContent = message; note.hidden = false; }
}

/** Una palabra por mejorar se puede tocar para oírla despacio. */
export function bindWords(box, voice) {
  box.querySelectorAll('[data-word]').forEach((b) => b.addEventListener('click', () => {
    say(b.dataset.word, voice, { slow: true }).catch(() => {});
  }));
}

/** Deja claro que la pronunciación escrita es una ayuda: lo que se aprende es la palabra en inglés. */
export const pronNote = () => `<aside class="pron-note">
    <b>Sobre la pronunciación</b>
    <p>Lo que ves entre / / es cómo suena, con letras del español. Es solo una ayuda: <b>lo importante es aprender la palabra en inglés.</b></p>
    <p class="pron-example"><span>water</span> se escribe así · <span class="say-pron-mini">/ uóter /</span> así suena</p>
  </aside>`;

export const micProblem = () => {
  const s = micSupport();
  return s.ok ? null : (MIC_HELP[s.code] ?? s.message);
};

/** Reproduce una línea. La voz del servidor se usa si existe; si falla, la del dispositivo. */
export function say(text, voice, { persona = null, slow = false, onFallback } = {}) {
  return speakCustomer(text, { slow, persona, onFallback, useServer: Boolean(voice?.capabilities?.speech?.available) });
}

/**
 * Monta el botón grande. onResult recibe { heard } o { selfCheck: true }.
 * Con evaluación de pronunciación recibe además { result }, ya calculado y guardado por el servidor.
 * Sin transcripción disponible, el alumno se escucha y decide: la app no inventa una corrección.
 */
export function mountMic(root, { voice, onResult, label = 'Toca y habla', assessQuery = null }) {
  const canAssess = Boolean(voice?.capabilities?.pronunciation?.available && assessQuery);
  const canTranscribe = canAssess || Boolean(voice?.capabilities?.transcription?.available);
  let recorder = null;
  let aborted = false;
  let quotaOut = false;
  let lastClip = null;

  const paint = (status, html = '') => {
    if (aborted) return;
    root.innerHTML = `<div class="mic-wrap">
      <button class="mic mic-${status}" id="mic" aria-label="${status === 'recording' ? 'Terminar de hablar' : 'Hablar'}" ${status === 'sending' ? 'disabled' : ''}>
        ${status === 'recording' ? icons.stop : status === 'sending' ? '<span class="spinner"></span>' : MIC_ICON}
      </button>
      <p class="mic-label" role="status">${esc(status === 'recording' ? 'Te escucho…' : status === 'sending' ? 'Revisando…' : label)}</p>
      ${html}
    </div>`;
    root.querySelector('#mic').addEventListener('click', toggle);
    root.querySelector('[data-clip]')?.addEventListener('click', () => { if (lastClip) playLocal(lastClip.blob).catch(() => {}); });
    root.querySelector('[data-self]')?.addEventListener('click', () => onResult({ selfCheck: true }));
    root.querySelector('[data-resend]')?.addEventListener('click', () => { if (lastClip) send(lastClip); });
  };

  const selfCheck = (note = '') => paint('idle', `${note ? `<p class="notice small">${esc(note)}</p>` : ''}
    <div class="row-center"><button class="btn" data-clip>${icons.sound}Escucharme</button><button class="btn btn-primary" data-self>${icons.check}Me salió bien</button></div>`);

  async function send(clip) {
    paint('sending');
    try {
      if (canAssess) {
        const assessed = await assessSpeech(clip, assessQuery);
        if (aborted) return;
        if (assessed.status === 'silence') { paint('idle', '<p class="notice notice-amber small">No te escuché. Inténtalo otra vez, más cerca.</p>'); return; }
        onResult({ heard: assessed.heard, result: assessed.result });
        return;
      }
      const out = await transcribe(clip, null, { asWav: Boolean(voice?.pilotFree) });
      if (aborted) return;
      if (out.status === 'silence' || !out.text) { paint('idle', '<p class="notice notice-amber small">No te escuché. Inténtalo otra vez, más cerca.</p>'); return; }
      onResult({ heard: out.text });
    } catch (err) {
      if (aborted || err?.code === 'cancelled') return;
      if (err?.status === 429) { reportIssue('voice_limit'); quotaOut = true; selfCheck('Por ahora se acabó la revisión automática. Escúchate y decide.'); return; }
      reportIssue('assess_failed');
      paint('idle', `<p class="notice notice-amber small">No pudimos revisar tu voz.</p><button class="btn" data-resend>Reintentar</button>`);
    }
  }

  async function toggle() {
    stopPlayback();
    if (recorder?.active) {
      const current = recorder;
      recorder = null;
      try {
        const clip = await current.stop();
        if (aborted || !clip) return;
        if (clip.silent) { paint('idle', '<p class="notice notice-amber small">No te escuché. Inténtalo otra vez, más cerca.</p>'); return; }
        lastClip = clip;
        if (!canTranscribe || quotaOut) { selfCheck(); return; }
        await send(clip);
      } catch { paint('idle', '<p class="notice notice-amber small">Se interrumpió la grabación. Otra vez.</p>'); }
      return;
    }
    recorder = new TurnRecorder({
      maxMs: 20000,
      stopOnSilenceMs: 1700,
      onAutoStop: () => { if (recorder?.active) toggle(); },
      onLevel: (level) => root.querySelector('#mic')?.style.setProperty('--level', level.toFixed(2)),
    });
    paint('recording');
    try {
      await recorder.start();
    } catch (err) {
      recorder = null;
      if (err instanceof ApiError && err.code === 'cancelled') return;
      reportIssue(MIC_REPORT[err?.code] ?? 'mic_error');
      paint('idle', `<p class="notice notice-amber small">${esc(MIC_HELP[err?.code] ?? 'No pudimos usar el micrófono. Inténtalo otra vez.')}</p>`);
    }
  }

  paint('idle');
  return {
    reset: () => paint('idle'),
    hasClip: () => Boolean(lastClip),
    playLast: () => (lastClip ? playLocal(lastClip.blob).catch(() => {}) : null),
    destroy: () => { aborted = true; recorder?.abort(); recorder = null; },
  };
}

const star = (on) => `<svg viewBox="0 0 24 24" class="star ${on ? 'on' : ''}" aria-hidden="true"><path d="M12 2.500l3 6.200 6.800.9-5 4.700 1.300 6.700-6.100-3.300-6.100 3.300 1.300-6.700-5-4.700 6.800-.9z"/></svg>`;
export const starsHtml = (n) => `<div class="stars" role="img" aria-label="${n} de 3 estrellas">${[1, 2, 3].map((i) => star(i <= n)).join('')}</div>`;

const CHEERS = { 3: '¡Excelente!', 2: '¡Muy bien!', 1: '¡Vas bien! Otra vez', 0: 'Otra vez, tranquilo' };

/** Resultado de la frase guía: palabras en verde o por mejorar, sin juzgar el acento. */
export function resultHtml(r, heard = '', extra = '', { compare = false } = {}) {
  // Sin haber visto la frase, otras palabras también pueden estar bien: no se castiga, se muestra el modelo.
  if (compare) return `<div class="result"><p class="result-title">Compáralo con el modelo</p><p class="heard">Hay otras formas de decirlo. La app revisa esta: dila para ganar la propina.</p>${extra ? `<div class="row-center">${extra}</div>` : ''}</div>`;
  if (r.selfCheck) return `<div class="result"><p class="result-title">¡Listo!</p>${extra ? `<div class="row-center">${extra}</div>` : ''}</div>`;
  return `<div class="result">
    ${starsHtml(r.stars)}
    <p class="result-title">${CHEERS[r.stars]}</p>
    ${r.stars < 3 ? `<p class="said">${r.words.map((x) => (x.ok ? `<span class="w-ok">${esc(x.w)}</span>` : `<button type="button" class="w-no" data-word="${esc(x.w.replace(/[^\p{L}\p{N}' -]/gu, ''))}" aria-label="Escuchar ${esc(x.w)}">${esc(x.w)}</button>`)).join(' ')}</p>` : ''}
    ${heard && !r.assessed && r.stars < 3 ? `<p class="heard">Se entendió: «${esc(heard)}»</p>` : ''}
    ${r.stars < 3 && r.words.some((x) => !x.ok) ? '<p class="heard">Toca una palabra para oírla.</p>' : ''}
    ${extra ? `<div class="row-center">${extra}</div>` : ''}
    ${r.tip && r.stars < 3 ? `<p class="tip">${r.tip.word ? `<b>${esc(r.tip.word)}</b> ` : ''}${esc(r.tip.text)}</p>` : ''}
  </div>`;
}

/** Con 0 estrellas, repetir es lo principal. Nunca se bloquea: siempre se puede seguir. */
export function resultActions(r, nextLabel = 'Seguir', hasClip = false) {
  const again = !r.selfCheck && r.stars === 0;
  return `<div class="result-actions ${hasClip ? 'has-clip' : ''}">
    <button class="btn ${again ? 'btn-primary' : ''}" id="retry">Otra vez</button>
    ${hasClip ? `<button class="btn" id="me" aria-label="Escuchar mi grabación">${icons.sound}Mi voz</button>` : ''}
    <button class="btn ${again ? '' : 'btn-primary'}" id="next">${esc(nextLabel)}</button>
  </div>`;
}
