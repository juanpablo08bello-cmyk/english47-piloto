// Pronunciar y escuchar: solo voz e infinito. Cada toque genera algo nuevo al azar.
// Escuchar: oyes un audio sin verlo y lo repites. Pronunciar: lees algo y respondes con tus palabras.
import { api, esc, icons, playSfx } from './core.js';
import { capybara } from './capybara.js';
import { bindGuide, guideHtml } from './guia.js';
import { stopPlayback } from './audio.js';
import { bindWords, micProblem, mountMic, pronNote, resultActions, resultHtml, say, sayModel, showAudioBlocked } from './voz.js';

const MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';

export async function viewMejorar(ctx) {
  const data = await api('GET', '/api/mejorar');
  const voice = ctx.state.voice ?? await api('GET', '/api/voice/status');
  ctx.state.voice = voice;
  const problem = micProblem();
  const home = ctx.shell(`<div class="page page-wide">
    <header class="hero hero-improve">
      <div class="grow"><h1 class="display display-long">Pronunciar y escuchar</h1><p class="hero-count"><b>${Math.min(data.attempts, data.goal)}/${data.goal}</b> de hoy</p></div>
      ${capybara({ mood: 'focus', size: 92, equipped: ctx.state.me?.equipped })}
    </header>
    ${guideHtml('mejorar', ['<b>Escuchar</b> entrena tu oído con voces de clientes de muchos países. <b>Pronunciar</b> entrena tu voz: respondes con tus palabras.', 'Las dos cuentan igual. Toca el micrófono y espera <b>Habla ahora</b>.', 'Recibes estrellas y puedes oír tu propia voz.', `Haz <b>${data.goal} al día</b> para cumplir esta sección. Puedes seguir todo lo que quieras.`])}
    ${problem ? `<p class="notice notice-amber">${esc(problem)}</p>` : ''}
    <div class="modes">
      <a class="mode mode-speak" ${problem ? 'aria-disabled="true"' : 'href="#/mejorar/pronunciar"'}>
        <span class="mode-icon">${MIC}</span>
        <span class="mode-text"><b>Pronunciar</b><small>Lee lo que te dicen y responde con tus palabras</small></span>
      </a>
      <a class="mode mode-listen" ${problem ? 'aria-disabled="true"' : 'href="#/mejorar/escuchar"'}>
        <span class="mode-icon">${icons.sound}</span>
        <span class="mode-text"><b>Escuchar</b><small>Oye un audio sin ver el texto y repítelo</small></span>
      </a>
    </div>
    <p class="small muted center">${voice.capabilities?.pronunciation?.available ? 'Tener acento está bien: lo que buscamos es que te entiendan.' : 'Compara las palabras que se entendieron. No mide tu acento.'}</p>
    ${pronNote()}
  </div>`, { tab: '#/mejorar' });
  bindGuide(home);
}

export async function viewMejorarJugar(ctx, mode) {
  const main = ctx.shell('<div class="stage center"><span class="spinner spinner-lg"></span></div>', { focus: true, section: 'improve' });
  const [{ attempts, goal }, voice] = await Promise.all([api('GET', '/api/mejorar'), ctx.state.voice ?? api('GET', '/api/voice/status')]);
  ctx.state.voice = voice;
  const listen = mode === 'escuchar';
  const nextLabel = listen ? 'Otro audio' : 'Otra situación';
  let count = attempts;
  let item = null;
  let mic = null;
  let gone = false;
  let busy = false;
  const stopAll = () => { mic?.destroy(); mic = null; stopPlayback(); };
  ctx.setTeardown(() => { gone = true; stopAll(); });

  const counter = () => (count < goal ? `${count}/${goal} hoy` : `${count} hoy`);
  const top = () => `<div class="ex-top">
      <a class="iconbtn" href="#/mejorar" aria-label="Salir">${icons.close}</a>
      <span class="grow"></span>
      <span class="count-pill" id="count">${counter()}</span>
    </div>`;

  const next = async () => {
    if (busy) return;
    busy = true;
    stopAll();
    main.innerHTML = '<div class="stage center"><span class="spinner spinner-lg"></span></div>';
    try {
      ({ item } = await api('POST', '/api/mejorar/generar', { modo: mode }));
    } catch (err) {
      busy = false;
      if (gone) return;
      main.innerHTML = `${top()}<div class="stage center"><p class="notice notice-amber">${esc(err.message)}</p></div>
        <button class="btn btn-primary btn-xl btn-block" id="again">Reintentar</button>`;
      main.querySelector('#again').addEventListener('click', next);
      return;
    }
    busy = false;
    if (gone) return;
    if (listen) drawListen();
    else drawReply();
    window.scrollTo(0, 0);
  };

  /** Reproduce con la voz de este personaje y hace latir el botón mientras suena. */
  let replays = 0;
  const playItem = (text, options = {}) => {
    const button = main.querySelector('#play');
    button?.classList.add('playing');
    return say(text, voice, { persona: item.persona, ...options })
      .catch((err) => { if (err?.name === 'NotAllowedError') showAudioBlocked(main, button, 'Toca el botón para oír el audio.'); })
      .finally(() => button?.classList.remove('playing'));
  };

  const mountBottom = () => {
    mic = mountMic(main.querySelector('#micbox'), { voice, onResult: heard, label: listen ? 'Toca y repítelo' : 'Toca y responde en inglés', assessQuery: { tipo: 'mejorar', id: item.id, index: 0 } });
    main.querySelector('#skip').addEventListener('click', next);
  };

  const bottom = `<p class="small muted center" id="voicenote" hidden></p>
    <div id="micbox"></div>
    <div id="result"></div>
    <button class="skip-link" id="skip">Saltar: ${nextLabel.toLowerCase()}</button>`;

  const drawListen = () => {
    main.innerHTML = `${top()}
      <div class="stage">
        <p class="eyebrow center">Escucha y repite</p>
        <button class="ear" id="play" aria-label="Escuchar otra vez">${icons.sound}</button>
        <p class="small muted center">Tócalo otra vez para oírlo más lento</p>
        <div id="text" hidden>
          <p class="eyebrow">${item.who === 'cliente' ? 'Esto dijo un cliente' : 'Esto dijo un mesero'}</p>
          <h1 class="phrase phrase-sm">${esc(item.en)}</h1>
          ${item.pron ? `<p class="phrase-pron" lang="es">${esc(item.pron)}</p>` : ''}
          <p class="phrase-es">${esc(item.es)}</p>
        </div>
      </div>
      ${bottom}`;
    replays = 0;
    main.querySelector('#play').addEventListener('click', () => { playItem(item.en, { slow: replays % 2 === 0 }); replays += 1; });
    mountBottom();
    playItem(item.en);
  };

  const drawReply = () => {
    const isClient = item.kind === 'cliente';
    main.innerHTML = `${top()}
      <div class="stage">
        <div class="reply-card">
          <p class="eyebrow">${isClient ? 'El cliente dice' : 'Situación'}</p>
          <h1 class="phrase phrase-sm">${esc(item.text)}</h1>
          ${isClient ? `<p class="phrase-es" id="es" hidden>${esc(item.es)}</p>
            <div class="reply-tools"><button class="iconbtn iconbtn-dark" id="play" aria-label="Oír al cliente">${icons.sound}</button><button class="text-btn" id="tr">¿Qué significa?</button></div>` : ''}
        </div>
        ${item.guide ? `<p class="reply-guide"><b>Tú:</b> ${esc(item.guide)}</p>` : ''}
        <button class="text-btn text-btn-light" id="hint">Dame una pista</button>
        <div class="hint-box" id="hintbox" hidden>${esc(item.hint)}…${item.hintPron ? `<p class="phrase-pron" lang="es">${esc(item.hintPron)}</p>` : ''}</div>
      </div>
      ${bottom}`;
    main.querySelector('#play')?.addEventListener('click', () => playItem(item.text));
    main.querySelector('#tr')?.addEventListener('click', (e) => { main.querySelector('#es').hidden = false; e.currentTarget.hidden = true; });
    main.querySelector('#hint').addEventListener('click', (e) => { main.querySelector('#hintbox').hidden = false; e.currentTarget.hidden = true; });
    mountBottom();
  };

  const replyExtras = (r, text) => `
    ${text ? `<p class="heard">Se entendió: «${esc(text)}»</p>` : ''}
    <div class="reply-sample">
      <p class="eyebrow">Una respuesta posible</p>
      <b>${esc(r.sample)}</b>
      ${r.samplePron ? `<p class="phrase-pron" lang="es">${esc(r.samplePron)}</p>` : ''}
      <button class="btn btn-sm" id="sample">${icons.sound}Escuchar</button>
    </div>`;

  const heard = async ({ heard: text, selfCheck, result: assessed, daily: paid, attempts: total }) => {
    const box = main.querySelector('#result');
    try {
      const out = assessed ? { result: assessed, daily: paid, attempts: total } : await api('POST', '/api/mejorar/intento', { id: item.id, heard: text, selfCheck });
      const { result } = out;
      if (gone) return;
      count = out.attempts ?? count;
      main.querySelector('#count').textContent = counter();
      mic?.reset();
      playSfx(selfCheck ? 'good' : result.stars >= 4 ? 'great' : result.stars ? 'good' : 'miss');
      const micBox = main.querySelector('#micbox');
      const skip = main.querySelector('#skip');
      micBox.hidden = true;
      skip.hidden = true;
      main.querySelector('#hint')?.setAttribute('hidden', '');
      main.querySelector('#hintbox')?.setAttribute('hidden', '');
      if (listen) main.querySelector('#text').hidden = false;
      const off = !listen && !selfCheck && result.answered === false;
      const reply = listen ? '' : replyExtras(result, selfCheck ? '' : text);
      box.innerHTML = `${resultHtml(result, listen ? text : '', '', { title: off ? 'Bien dicho, pero revisa la respuesta' : null })}${reply}${resultActions(result, nextLabel, mic?.hasClip())}`;
      box.querySelector('#me')?.addEventListener('click', () => mic?.playLast());
      box.querySelector('#sample')?.addEventListener('click', () => sayModel(result.sample, voice).catch(() => {}));
      bindWords(box, voice);
      box.querySelector('#retry').addEventListener('click', () => { box.innerHTML = ''; micBox.hidden = false; skip.hidden = false; });
      box.querySelector('#next').addEventListener('click', next);
      box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      if (out.daily) {
        ctx.state.stats = out.daily.stats;
        ctx.reward(out.daily.rewards, { title: '¡Tu voz sigue mejorando!', fallback: 'Sigue así' });
      }
    } catch (err) {
      mic?.reset();
      box.innerHTML = `<p class="notice notice-amber small">${esc(err.message)}</p>`;
    }
  };

  next();
}
