// Mesas: solo voz. Genera una mesa al azar. En unos turnos se ve la frase en inglés; en otros se responde solo.
// Cada turno da hasta 5 estrellas y cada estrella es $2 de propina, que se guarda en las monedas.
import { api, confetti, esc, icons, playSfx, reportIssue, statIcons } from './core.js';
import { capybara } from './capybara.js';
import { bindGuide, guideHtml, guideSeen, markGuide } from './guia.js';
import { preloadSpeech, stopPlayback } from './audio.js';
import { bindWords, micProblem, mountMic, pronNote, resultActions, resultHtml, say, sayModel, showAudioBlocked, starsHtml } from './voz.js';

const HUES = ['coral', 'lilac', 'mint', 'pink'];
const hueOf = (name) => HUES[[...name].reduce((n, ch) => n + ch.charCodeAt(0), 0) % HUES.length];
const avatar = (p, extra = '') => `<span class="avatar avatar-${hueOf(p.name)} ${extra}" id="guest-avatar" aria-hidden="true">${esc(p.name[0])}</span>`;
// Cada turno es de uno de dos tipos: con la frase en inglés a la vista, o para responder solo con pista.
const LEVEL_UP = { 2: 'Más situaciones y más turnos con tus palabras', 3: 'Clientes más difíciles y casi la mitad con tus palabras', 4: 'Lo más difícil: casi todo con tus palabras' };
const showOf = (step, level) => step.show ?? (level <= 2 ? 'en' : 'free');
const firstWords = (en) => {
  const words = en.split(/\s+/);
  return `${words.slice(0, words.length > 3 ? 2 : 1).join(' ')}…`;
};
const ladderOf = (step, level) => (showOf(step, level) === 'en'
  ? (level === 1 ? [] : ['pron'])
  : ['hint', 'en', 'pron']);
const HELP_BUTTON = { hint: 'Dame una pista', en: 'Ver la frase completa', pron: 'Ver cómo suena' };

/** Tarjeta del turno. Sin objetivo escrito cae en la frase en español: nunca queda vacía. */
function turnCard(step, level, revealed) {
  const free = showOf(step, level) === 'free';
  const parts = new Set(revealed);
  if (!free) parts.add('en');
  if (!free && level === 1) parts.add('pron');
  const showsEnglish = parts.has('en');
  // Con la frase a la vista, la pista ya no hace falta.
  const next = ladderOf(step, level).find((x) => !parts.has(x) && !(x === 'hint' && showsEnglish));
  const prompt = step.say.goal ?? step.say.es;
  return `<p class="eyebrow eyebrow-dark">${free && !showsEnglish ? 'Responde con tus palabras' : 'Tú dices'}</p>
    ${free && !showsEnglish ? `<p class="say-goal">${esc(prompt)}</p>` : ''}
    ${free && !showsEnglish && parts.has('hint') ? `<p class="say-hint">${esc(firstWords(step.say.en))}</p>` : ''}
    ${showsEnglish ? `<p class="say-en">${esc(step.say.en)}</p>` : ''}
    ${parts.has('pron') && step.say.pron ? `<p class="say-pron" lang="es">${esc(step.say.pron)}</p>` : ''}
    ${showsEnglish ? `<p class="say-es">${esc(step.say.es)}</p>` : ''}
    <div class="row-wrap">
      ${showsEnglish ? `<button class="btn btn-ink btn-sm" id="model">${icons.sound}Escuchar cómo se dice</button>` : ''}
      ${next ? `<button class="btn btn-ink btn-sm" id="reveal">${HELP_BUTTON[next]}</button>` : ''}
    </div>`;
}

const starsOf = (attempt) => (!attempt ? 0 : attempt.selfCheck ? 1 : attempt.stars);

async function startNewMesa() {
  await api('POST', '/api/mesas/generar');
}

export async function viewMesas(ctx) {
  const { mesa, count, goal, progress } = await api('GET', '/api/mesas');
  const problem = micProblem();
  const main = ctx.shell(`<div class="page page-wide">
    <header class="hero hero-table">
      <div class="grow"><h1 class="display">Mesas</h1><p class="hero-count"><b>${count < goal ? `${count}/${goal}` : count}</b> ${count === 1 ? 'mesa' : 'mesas'} hoy</p></div>
      ${capybara({ mood: 'cheer', size: 92, equipped: ctx.state.me?.equipped })}
    </header>
    <div class="tiles tiles-2">
      <div class="tile tile-level tile-word"><b>Dificultad ${progress.level}</b><span>${progress.toNext ? `Sube en ${progress.toNext} ${progress.toNext === 1 ? 'mesa' : 'mesas'}` : 'La más alta'}</span></div>
      <div class="tile tile-tips"><b>$${progress.tips}</b><span>En propinas</span></div>
    </div>
    ${problem ? `<p class="notice notice-amber">${esc(problem)}</p>` : ''}
    <button class="btn btn-primary btn-xxl btn-block" id="gen" ${problem ? 'disabled' : ''}>${icons.plate}GENERAR MESA</button>
    ${guideHtml('mesas', ['Toca <b>Generar mesa</b> y llega un cliente.', 'Lee y escucha lo que te dice.', 'Toca el <b>micrófono</b>, espera <b>Habla ahora</b> y responde en inglés.', 'Ganas hasta <b>5 estrellas</b> por turno. Cada estrella es <b>$2 de propina</b>, y tus propinas se guardan como monedas para la Tienda.', `Haz <b>${goal} mesas al día</b> para cumplir esta sección. Al atender más, sube la dificultad y verás menos ayuda.`])}
    ${mesa ? `<a class="btn btn-block" href="#/mesas/atender">${avatar(mesa.persona)}Seguir con ${esc(mesa.persona.name)}</a>` : ''}
    <p class="small muted center">Tu voz va a Microsoft Azure para revisarla y la app no la guarda. Los pedidos y las propinas son de práctica.</p>
    ${pronNote()}
    <p id="err" class="notice notice-amber" hidden role="alert"></p>
  </div>`, { tab: '#/mesas' });
  bindGuide(main);
  main.querySelector('#gen').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>Llega un cliente…';
    try {
      await startNewMesa();
      location.hash = '#/mesas/atender';
    } catch (err) {
      const box = main.querySelector('#err');
      box.textContent = err.message;
      box.hidden = false;
      btn.disabled = false;
      btn.innerHTML = `${icons.plate}GENERAR MESA`;
    }
  });
}

export async function viewMesaAtender(ctx) {
  const { mesa } = await api('GET', '/api/mesas');
  if (!mesa) { location.hash = '#/mesas'; return; }
  const main = ctx.shell('', { focus: true, section: 'table' });
  const voice = ctx.state.voice ?? await api('GET', '/api/voice/status');
  ctx.state.voice = voice;
  const useServer = Boolean(voice?.capabilities?.speech?.available);
  const firstOpen = mesa.steps.findIndex((_, i) => !mesa.attempts?.[i]);
  let index = firstOpen === -1 ? mesa.steps.length - 1 : firstOpen;
  const earned = {};
  Object.entries(mesa.attempts ?? {}).forEach(([i, a]) => { earned[i] = starsOf(a); });
  // Misma cuenta que el servidor, sin el bono de mesa perfecta: ese llega al terminar.
  const totalTip = () => Object.values(earned).reduce((n, v) => n + v, 0) * 2;
  let combo = 0;
  let mic = null;
  const cleanup = () => { mic?.destroy(); mic = null; stopPlayback(); };
  ctx.setTeardown(cleanup);
  // Sin la voz del servidor no hay acento: se avisa en vez de prometer algo que no suena.
  const noteFallback = () => {
    reportIssue('speech_fallback');
    const note = main.querySelector('#voicenote');
    if (note) note.hidden = false;
  };
  const speakGuest = async (step, slow = false) => {
    const face = main.querySelector('#guest-avatar');
    face?.classList.add('is-speaking');
    const speaker = main.querySelector('#again');
    if (speaker?.classList.contains('attention')) {
      speaker.classList.remove('attention');
      main.querySelector('#voicenote').hidden = true;
    }
    try { await say(step.guest.en, voice, { persona: mesa.persona, slow, onFallback: noteFallback }); } catch (err) { if (err?.name === 'NotAllowedError') showAudioBlocked(main, main.querySelector('#again')); }
    face?.classList.remove('is-speaking');
  };
  const preloadTurn = (i) => {
    const step = mesa.steps[i];
    if (step && useServer) preloadSpeech(step.guest.en, { persona: mesa.persona });
  };
  if (!useServer) mesa.persona.accentEs = null;

  const intro = () => {
    main.innerHTML = `<div class="ex-top"><a class="iconbtn" href="#/mesas" aria-label="Salir">${icons.close}</a><span class="grow"></span></div>
      <div class="stage center">
        <p class="scene-title">${esc(mesa.sceneEs ?? '')}</p>
        <span class="avatar avatar-xl avatar-${hueOf(mesa.persona.name)}" aria-hidden="true">${esc(mesa.persona.name[0])}</span>
        <h1 class="display">${esc(mesa.persona.name)}</h1>
        <div class="row-center">
          <span class="chip chip-table">${mesa.party} ${mesa.party === 1 ? 'persona' : 'personas'}</span>
          ${mesa.persona.accentEs ? `<span class="chip chip-table">${esc(mesa.persona.accentEs)}</span>` : ''}
          <span class="chip chip-table">${esc(mesa.persona.moodEs)}</span>
        </div>
        <p class="muted">${mesa.steps.length} turnos · dificultad ${mesa.level}</p>
        <p class="help-level">${mesa.steps.every((s) => showOf(s, mesa.level) === 'en') ? 'Te mostramos qué decir en cada turno' : 'En unos turnos ves la frase. En otros respondes con tus palabras: hay varias formas correctas'}</p>
      </div>
      <button class="btn btn-primary btn-xxl btn-block" id="go">Atender</button>`;
    preloadTurn(index);
    main.querySelector('#go').addEventListener('click', turn);
  };

  let revealed = new Set();
  let helpUsed = false;
  // Dibuja solo la tarjeta: abrir una ayuda no interrumpe al cliente ni al micrófono.
  const paintCard = (step) => {
    const card = main.querySelector('#card');
    card.innerHTML = turnCard(step, mesa.level, revealed);
    card.querySelector('#model')?.addEventListener('click', () => sayModel(step.say.en, voice).catch(() => {}));
    card.querySelector('#reveal')?.addEventListener('click', () => {
      const shown = showOf(step, mesa.level) === 'en' ? ['en', ...revealed] : [...revealed];
      const next = ladderOf(step, mesa.level).find((x) => !shown.includes(x) && !(x === 'hint' && shown.includes('en')));
      if (next) revealed.add(next);
      helpUsed = true;
      paintCard(step);
    });
  };

  const turn = () => {
    cleanup();
    ctx.setTeardown(cleanup);
    const step = mesa.steps[index];
    main.innerHTML = `<div class="ex-top">
        <a class="iconbtn" href="#/mesas" aria-label="Salir">${icons.close}</a>
        <div class="bar bar-table grow"><i style="width:${(index / mesa.steps.length) * 100}%"></i></div>
        <span class="tip-pill" id="tips" title="Propina de esta mesa">$${totalTip()}</span>
        ${avatar(mesa.persona)}
      </div>
      ${index > 0 ? `<p class="turn-prev"><b>Tú:</b> ${esc(mesa.steps[index - 1].say.en)}</p>` : ''}
      <div class="guest">
        <div class="grow"><p class="eyebrow">${esc(mesa.persona.name)} dice</p><p class="guest-en">${esc(step.guest.en)}</p><p class="guest-es">${esc(step.guest.es)}</p></div>
        <button class="iconbtn iconbtn-fill" id="again" aria-label="Escuchar otra vez, más lento">${icons.sound}</button>
      </div>
      <p class="small muted center" id="voicenote" hidden>Ahora suena con la voz de tu teléfono, sin acento.</p>
      <div class="turn-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v15M5 12l7 7 7-7"/></svg></div>
      <div class="yourturn" id="card"></div>
      ${guideSeen('mic') ? '' : '<p class="coach" id="coach">Toca el micrófono, espera <b>Habla ahora</b> y dilo en inglés<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v15M5 12l7 7 7-7"/></svg></p>'}
      <div id="micbox"></div>
      <div id="result"></div>`;
    // Una sola bocina: al repetir suena más lento, y así se va alternando.
    let replays = 0;
    main.querySelector('#again').addEventListener('click', () => { speakGuest(step, replays % 2 === 0); replays += 1; });
    revealed = new Set();
    helpUsed = false;
    paintCard(step);
    mic = mountMic(main.querySelector('#micbox'), { voice, onResult: (r) => heard(step, r), assessQuery: { tipo: 'mesa', id: mesa.id, index } });
    speakGuest(step);
    window.scrollTo(0, 0);
  };

  const heard = async (step, { heard: text, selfCheck, result: assessed }) => {
    const box = main.querySelector('#result');
    const micBox = main.querySelector('#micbox');
    try {
      const { result } = assessed ? { result: assessed } : await api('POST', `/api/mesas/${mesa.id}/turno`, { index, heard: text, selfCheck });
      mic?.reset();
      markGuide('mic');
      main.querySelector('#coach')?.remove();
      const free = showOf(step, mesa.level) === 'free';
      const gained = selfCheck ? 1 : result.stars;
      const before = totalTip();
      earned[index] = Math.max(earned[index] ?? 0, gained);
      const after = totalTip();
      combo = !selfCheck && result.stars >= 4 ? combo + 1 : 0;
      playSfx(selfCheck ? 'good' : result.stars >= 4 ? 'great' : result.stars ? 'good' : 'miss');
      const pill = main.querySelector('#tips');
      if (pill) {
        pill.textContent = `$${after}`;
        if (after > before) { pill.classList.remove('tip-pop'); void pill.offsetWidth; pill.classList.add('tip-pop'); }
      }
      // El micrófono se aparta: el resultado y "Seguir" quedan a la vista sin bajar la pantalla.
      micBox.hidden = true;
      // Lo que se quitó de la vista se muestra al responder: siempre se ve el modelo.
      const noHelp = free && !helpUsed && !selfCheck && result.stars >= 3;
      // Si dijo otra cosa no se le regaña: se le muestra una forma de decirlo. Las mesas viejas no traen esta marca.
      const compare = free && !selfCheck && (result.matched === false || (result.matched === undefined && !helpUsed && result.stars <= 2));
      helpUsed = true; // Ya vio el modelo: el siguiente intento se revisa como normal.
      ['en', 'pron', 'es'].forEach((x) => revealed.add(x));
      paintCard(step);
      const extra = `${after > before ? `<span class="chip chip-coin">+$${after - before}</span>` : ''}${noHelp ? '<span class="chip chip-combo">Sin ayuda</span>' : ''}${combo >= 2 ? `<span class="chip chip-combo">${statIcons.flame}${combo} seguidas</span>` : ''}`;
      box.innerHTML = `${resultHtml(result, text, extra, { compare })}${resultActions(result, index + 1 < mesa.steps.length ? 'Seguir' : 'Terminar', mic?.hasClip())}`;
      box.querySelector('#me')?.addEventListener('click', () => mic?.playLast());
      bindWords(box, voice);
      box.querySelector('#retry').addEventListener('click', () => { box.innerHTML = ''; micBox.hidden = false; });
      box.querySelector('#next').addEventListener('click', advance);
      preloadTurn(index + 1);
      box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } catch (err) {
      mic?.reset();
      box.innerHTML = `<p class="notice notice-amber small">${esc(err.message)}</p>`;
    }
  };

  const advance = () => {
    index += 1;
    if (index < mesa.steps.length) { turn(); return; }
    finish();
  };

  const finish = async () => {
    cleanup();
    ctx.setTeardown(cleanup);
    main.innerHTML = '<div class="stage center"><span class="spinner spinner-lg"></span></div>';
    try {
      const out = await api('POST', `/api/mesas/${mesa.id}/terminar`);
      ctx.state.stats = out.stats;
      say(mesa.closing.en, voice, { persona: mesa.persona }).catch(() => {});
      const s = out.summary;
      if (out.levelUp || s.perfect || (s.stars ?? 0) >= 3) confetti();
      playSfx(out.levelUp ? 'level' : 'great');
      main.innerHTML = `<div class="stage center">
          ${capybara({ mood: 'celebrate', size: 112, equipped: ctx.state.me?.equipped, label: 'Capibara celebrando' })}
          <h1 class="display">${out.levelUp ? `¡Dificultad ${out.progress.level}!` : s.perfect ? '¡Mesa perfecta!' : '¡Mesa atendida!'}</h1>
          ${out.levelUp ? `<p class="scene-title">${esc(LEVEL_UP[out.progress.level] ?? 'Mesas nuevas y más largas')}</p>` : ''}
          <p class="guest-en">${esc(mesa.closing.en)}</p>
          <p class="muted">${esc(mesa.closing.es)}</p>
          ${s.selfCheck ? '' : starsHtml(s.stars)}
          ${out.plan.tables.done ? '' : `<p class="hero-count"><b>${out.plan.tables.count}/${out.plan.tables.goal}</b> hoy</p>`}
          <div class="tip-total"><span>Propina</span><b>$${s.tip}</b><small>${s.perfect ? 'Con bono de mesa perfecta · ' : ''}Ya está en tus monedas</small></div>
          <div class="row-center">
            ${out.rewards.xp ? `<span class="chip chip-xp">${statIcons.xp}+${out.rewards.xp} XP</span>` : ''}
            ${out.rewards.coins ? `<span class="chip chip-coin">${statIcons.coin}+${out.rewards.coins}</span>` : ''}
          </div>
        </div>
        <div class="stack">
          <button class="btn btn-primary btn-xl btn-block" id="another">Otra mesa</button>
          <a class="btn btn-block" href="#/hoy">Terminar</a>
          <p id="err" class="notice notice-amber" hidden role="alert"></p>
        </div>`;
      main.querySelector('#another').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span>Llega un cliente…';
        try {
          stopPlayback();
          await startNewMesa();
          await viewMesaAtender(ctx);
        } catch (err) {
          const box = main.querySelector('#err');
          box.textContent = err.message;
          box.hidden = false;
          btn.disabled = false;
          btn.textContent = 'Otra mesa';
        }
      });
      ctx.afterReward(out.rewards);
    } catch (err) {
      main.innerHTML = `<div class="stage center"><p class="notice notice-amber">${esc(err.message)}</p><a class="btn btn-primary" href="#/mesas">Volver</a></div>`;
    }
  };

  if (index === 0 && !mesa.attempts?.[0]) intro();
  else turn();
}
