// Mesas: solo voz. Genera una mesa al azar y guía al alumno en cada turno con la frase que debe decir.
// Cada turno suma propina según las estrellas; encadenar turnos perfectos da una racha.
import { api, confetti, esc, icons, playSfx, reportIssue, statIcons } from './core.js';
import { capybara } from './capybara.js';
import { preloadSpeech, stopPlayback } from './audio.js';
import { bindWords, micProblem, mountMic, resultActions, resultHtml, say, showAudioBlocked, starsHtml } from './voz.js';

const HUES = ['coral', 'lilac', 'mint', 'pink'];
const hueOf = (name) => HUES[[...name].reduce((n, ch) => n + ch.charCodeAt(0), 0) % HUES.length];
const avatar = (p, extra = '') => `<span class="avatar avatar-${hueOf(p.name)} ${extra}" id="guest-avatar" aria-hidden="true">${esc(p.name[0])}</span>`;
const tipFor = (attempt) => (!attempt ? 0 : attempt.selfCheck ? 1 : attempt.stars);

async function startNewMesa() {
  await api('POST', '/api/mesas/generar');
}

export async function viewMesas(ctx) {
  const { mesa, count, progress } = await api('GET', '/api/mesas');
  const problem = micProblem();
  const main = ctx.shell(`<div class="page">
    <header class="hero hero-table">
      <div class="grow"><h1 class="display">Mesas</h1><p class="hero-count"><b>${count}</b> ${count === 1 ? 'atendida' : 'atendidas'} hoy</p></div>
      ${capybara({ mood: 'cheer', size: 92, equipped: ctx.state.me?.equipped })}
    </header>
    <div class="tiles tiles-2">
      <div class="tile tile-level"><b>Nivel ${progress.level}</b><span>${progress.toNext ? `Faltan ${progress.toNext} ${progress.toNext === 1 ? 'mesa' : 'mesas'}` : 'Nivel máximo'}</span></div>
      <div class="tile tile-tips"><b>$${progress.tips}</b><span>En propinas</span></div>
    </div>
    ${problem ? `<p class="notice notice-amber">${esc(problem)}</p>` : ''}
    <button class="btn btn-primary btn-xxl btn-block" id="gen" ${problem ? 'disabled' : ''}>${icons.plate}GENERAR MESA</button>
    ${mesa ? `<a class="btn btn-block" href="#/mesas/atender">${avatar(mesa.persona)}Seguir con ${esc(mesa.persona.name)}</a>` : ''}
    ${progress.done < 3 ? `<div class="howto">
      <div><b>1</b><span>Escucha</span></div>
      <div><b>2</b><span>Lee</span></div>
      <div><b>3</b><span>Habla</span></div>
    </div>` : ''}
    <p class="small muted center">Tu voz va a Microsoft Azure para revisarla y la app no la guarda. Los pedidos y las propinas son de práctica.</p>
    <p id="err" class="notice notice-amber" hidden role="alert"></p>
  </div>`, { tab: '#/mesas' });
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
  Object.entries(mesa.attempts ?? {}).forEach(([i, a]) => { earned[i] = tipFor(a); });
  const totalTip = () => Object.values(earned).reduce((n, v) => n + v, 0);
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
        <p class="muted">${mesa.steps.length} turnos · nivel ${mesa.level}</p>
      </div>
      <button class="btn btn-primary btn-xxl btn-block" id="go">Atender</button>`;
    preloadTurn(index);
    main.querySelector('#go').addEventListener('click', turn);
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
      <div class="guest">
        <div class="grow"><p class="guest-en">${esc(step.guest.en)}</p><p class="guest-es">${esc(step.guest.es)}</p></div>
        <div class="stack-tight">
          <button class="iconbtn iconbtn-fill" id="again" aria-label="Escuchar otra vez">${icons.sound}</button>
          <button class="iconbtn" id="slow" aria-label="Más lento"><span class="slow-mark">x½</span></button>
        </div>
      </div>
      <p class="small muted center" id="voicenote" hidden>Ahora suena con la voz de tu teléfono, sin acento.</p>
      <div class="yourturn">
        <p class="eyebrow eyebrow-dark">Di esto</p>
        <p class="say-en">${esc(step.say.en)}</p>
        <p class="say-es">${esc(step.say.es)}</p>
        <button class="btn btn-ink btn-sm" id="model">${icons.sound}Escuchar cómo se dice</button>
      </div>
      <div id="micbox"></div>
      <div id="result"></div>`;
    main.querySelector('#again').addEventListener('click', () => speakGuest(step));
    main.querySelector('#slow').addEventListener('click', () => speakGuest(step, true));
    main.querySelector('#model').addEventListener('click', () => say(step.say.en, voice).catch(() => {}));
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
      const gained = selfCheck ? 1 : result.stars;
      const before = earned[index] ?? 0;
      earned[index] = Math.max(before, gained);
      combo = !selfCheck && result.stars === 3 ? combo + 1 : 0;
      playSfx(selfCheck ? 'good' : result.stars === 3 ? 'great' : result.stars ? 'good' : 'miss');
      const pill = main.querySelector('#tips');
      if (pill) {
        pill.textContent = `$${totalTip()}`;
        if (earned[index] > before) { pill.classList.remove('tip-pop'); void pill.offsetWidth; pill.classList.add('tip-pop'); }
      }
      // El micrófono se aparta: el resultado y "Seguir" quedan a la vista sin bajar la pantalla.
      micBox.hidden = true;
      const extra = `${earned[index] > before ? `<span class="chip chip-coin">+$${earned[index] - before}</span>` : ''}${combo >= 2 ? `<span class="chip chip-combo">${statIcons.flame}${combo} seguidas</span>` : ''}`;
      box.innerHTML = `${resultHtml(result, text, extra)}${resultActions(result, index + 1 < mesa.steps.length ? 'Seguir' : 'Terminar')}`;
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
      if (out.levelUp || s.perfect || (s.stars ?? 0) >= 2) confetti();
      playSfx(out.levelUp ? 'level' : 'great');
      main.innerHTML = `<div class="stage center">
          ${capybara({ mood: 'celebrate', size: 112, equipped: ctx.state.me?.equipped, label: 'Capibara celebrando' })}
          <h1 class="display">${out.levelUp ? `¡Nivel ${out.progress.level}!` : s.perfect ? '¡Mesa perfecta!' : '¡Mesa atendida!'}</h1>
          ${out.levelUp ? '<p class="scene-title">Mesas nuevas y más largas</p>' : ''}
          <p class="guest-en">${esc(mesa.closing.en)}</p>
          <p class="muted">${esc(mesa.closing.es)}</p>
          ${s.selfCheck ? '' : starsHtml(s.stars)}
          <div class="tip-total"><span>Propina</span><b>$${s.tip}</b>${s.perfect ? '<small>Incluye bono por mesa perfecta</small>' : ''}</div>
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
