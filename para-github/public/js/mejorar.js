// Mejorar: solo voz. Pronunciar con la frase a la vista, o escuchar y repetir sin verla.
// Compara lo que se entendió con la frase; no mide el acento ni la fonética.
import { api, esc, icons, playSfx } from './core.js';
import { capybara } from './capybara.js';
import { stopPlayback } from './audio.js';
import { micProblem, mountMic, resultActions, resultHtml, say } from './voz.js';

export async function viewMejorar(ctx) {
  const data = await api('GET', '/api/mejorar');
  const voice = ctx.state.voice ?? await api('GET', '/api/voice/status');
  ctx.state.voice = voice;
  const problem = micProblem();
  ctx.shell(`<div class="page">
    <header class="hero hero-improve">
      <div class="grow"><h1 class="display">Mejorar</h1><p class="hero-count"><b>${data.items.length}</b> frases para ti</p></div>
      ${capybara({ mood: 'focus', size: 92, equipped: ctx.state.me?.equipped })}
    </header>
    ${problem ? `<p class="notice notice-amber">${esc(problem)}</p>` : ''}
    <a class="mode mode-speak" ${problem ? 'aria-disabled="true"' : 'href="#/mejorar/pronunciar"'}>
      <span class="mode-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></span>
      <b>Pronunciar</b>
    </a>
    <a class="mode mode-listen" ${problem ? 'aria-disabled="true"' : 'href="#/mejorar/escuchar"'}>
      <span class="mode-icon">${icons.sound}</span>
      <b>Escuchar</b>
    </a>
    <p class="small muted center">${voice.capabilities?.pronunciation?.available ? 'Te compara con un hablante nativo. Tener acento está bien.' : 'Compara las palabras que se entendieron. No mide tu acento.'}</p>
  </div>`, { tab: '#/mejorar' });
}

export async function viewMejorarJugar(ctx, mode) {
  const { items } = await api('GET', '/api/mejorar');
  const voice = ctx.state.voice ?? await api('GET', '/api/voice/status');
  ctx.state.voice = voice;
  const main = ctx.shell('', { focus: true, section: 'improve' });
  const listen = mode === 'escuchar';
  let index = 0;
  let mic = null;
  const cleanup = () => { mic?.destroy(); mic = null; stopPlayback(); };
  ctx.setTeardown(cleanup);

  const draw = () => {
    cleanup();
    ctx.setTeardown(cleanup);
    const item = items[index];
    main.innerHTML = `<div class="ex-top">
        <a class="iconbtn" href="#/mejorar" aria-label="Salir">${icons.close}</a>
        <div class="bar bar-improve grow"><i style="width:${(index / items.length) * 100}%"></i></div>
      </div>
      <div class="stage">
        <p class="eyebrow">${listen ? 'Escucha y repite' : 'Dilo en voz alta'}</p>
        <div id="text" ${listen ? 'hidden' : ''}>
          <h1 class="phrase">${esc(item.en)}</h1>
          <p class="phrase-es">${esc(item.es)}</p>
        </div>
        <div class="row-center">
          <button class="btn btn-improve" id="play">${icons.sound}Escuchar</button>
          <button class="btn" id="slow"><span class="slow-mark">x½</span>Lento</button>
        </div>
      </div>
      <div id="micbox"></div>
      <div id="result"></div>`;
    main.querySelector('#play').addEventListener('click', () => say(item.en, voice).catch(() => {}));
    main.querySelector('#slow').addEventListener('click', () => say(item.en, voice, { slow: true }).catch(() => {}));
    mic = mountMic(main.querySelector('#micbox'), { voice, onResult: (r) => heard(item, r), assessQuery: { tipo: 'mejorar', id: 0, index } });
    say(item.en, voice).catch(() => {});
    window.scrollTo(0, 0);
  };

  const heard = async (item, { heard: text, selfCheck, result: assessed }) => {
    const box = main.querySelector('#result');
    try {
      const { result } = assessed ? { result: assessed } : await api('POST', '/api/mejorar/intento', { index, heard: text, selfCheck });
      main.querySelector('#text').hidden = false;
      mic?.reset();
      playSfx(selfCheck ? 'good' : result.stars === 3 ? 'great' : result.stars ? 'good' : 'miss');
      const micBox = main.querySelector('#micbox');
      micBox.hidden = true;
      box.innerHTML = `${resultHtml(result, text)}${resultActions(result, index + 1 < items.length ? 'Seguir' : 'Terminar')}`;
      box.querySelector('#retry').addEventListener('click', () => { box.innerHTML = ''; micBox.hidden = false; });
      box.querySelector('#next').addEventListener('click', () => {
        index += 1;
        if (index < items.length) draw();
        else finish();
      });
      box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } catch (err) {
      mic?.reset();
      box.innerHTML = `<p class="notice notice-amber small">${esc(err.message)}</p>`;
    }
  };

  let finishing = false;
  const finish = async () => {
    if (finishing) return; // Un doble toque no repite la celebración.
    finishing = true;
    cleanup();
    main.innerHTML = '<div class="stage center"><span class="spinner spinner-lg"></span></div>';
    try {
      const out = await api('POST', '/api/mejorar/terminar');
      ctx.state.stats = out.stats;
      ctx.reward(out.rewards, { title: '¡Tu voz sigue mejorando!', fallback: 'Sigue así' });
    } catch (err) { ctx.toast(err.message); }
    location.hash = '#/hoy';
  };

  draw();
}
