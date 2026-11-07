// Aprender palabras: solo texto. Frase, sus palabras y un repaso tocando. Sin audio ni micrófono.
import { api, esc, icons, playSfx } from './core.js';
import { capybara } from './capybara.js';
import { bindGuide, foldHtml, guideHtml } from './guia.js';

const shuffle = (list) => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

export async function viewAprender(ctx) {
  const data = await api('GET', '/api/aprender');
  const pct = Math.round((data.seen / data.total) * 100);
  const home = ctx.shell(`<div class="page page-wide">
    <header class="hero hero-learn">
      <div class="grow"><h1 class="display display-long">Aprender palabras</h1><p class="hero-count"><b>${Math.min(data.count, data.goal)}/${data.goal}</b> tandas hoy</p></div>
      ${capybara({ mood: 'welcome', size: 92, equipped: ctx.state.me?.equipped })}
    </header>
    <div class="learn-progress"><span class="spread small"><b>Frases vistas</b><span>${data.seen} de ${data.total}</span></span><div class="bar bar-learn"><i style="width:${pct}%"></i></div></div>
    ${guideHtml('aprender', ['Toca <b>Generar frases</b>: salen 5 al azar.', 'Lee cada frase y mira qué significa cada palabra.', 'Repásalas tocando la respuesta. Aquí no se habla.', `Haz <b>${data.goal} tandas al día</b> para cumplir esta sección.`])}
    <a class="btn btn-primary btn-xl btn-block" href="#/aprender/jugar">${icons.dice}Generar frases</a>
    <div class="fold-list">
      ${foldHtml({ title: 'O elige un tema', icon: icons.book, meta: `${data.topics.length} temas`, body: `<div class="topics">${data.topics.map((t, i) => `<a class="topic topic-${(i % 4) + 1}" href="#/aprender/jugar/${t.id}"><b>${esc(t.title)}</b><span>${t.seen}/${t.total}</span></a>`).join('')}</div>` })}
      <a class="btn btn-block" href="#/palabras">${icons.words}Diccionario</a>
    </div>
  </div>`, { tab: '#/aprender' });
  bindGuide(home);
}

export async function viewAprenderJugar(ctx, topic) {
  const main = ctx.shell('<div class="stage center"><span class="spinner spinner-lg"></span></div>', { focus: true, section: 'learn' });
  const data = await api('POST', '/api/aprender/generar', topic ? { tema: topic } : {});
  const { pack } = data;
  const steps = [];
  // Primero se aprende cada frase; después se repasa tocando, sin examen ni castigo.
  pack.forEach((frase) => steps.push({ type: 'frase', frase }));
  shuffle(pack).forEach((frase, i) => steps.push({ type: i % 2 ? 'armar' : 'significado', frase }));
  let index = 0;

  const top = () => `<div class="ex-top">
      <a class="iconbtn" href="#/aprender" aria-label="Salir">${icons.close}</a>
      <div class="bar bar-learn grow"><i style="width:${(index / steps.length) * 100}%"></i></div>
    </div>`;

  const next = () => {
    index += 1;
    if (index < steps.length) { draw(); return; }
    finish();
  };

  const showFrase = ({ frase }) => {
    main.innerHTML = `${top()}
      <div class="stage">
        <div class="phrase-card">
          <h1 class="phrase">${esc(frase.en)}</h1>
          <p class="phrase-es">${esc(frase.es)}</p>
        </div>
      </div>
      <button class="btn btn-primary btn-xl btn-block" id="go">Ver palabras</button>`;
    main.querySelector('#go').addEventListener('click', () => {
      main.innerHTML = `${top()}
        <div class="stage">
          <h1 class="phrase phrase-sm">${esc(frase.en)}</h1>
          <div class="wordgrid">
            ${frase.words.map(([en, es], i) => `<div class="wordcard word-${(i % 4) + 1}"><b>${esc(en)}</b><span>${esc(es)}</span></div>`).join('')}
          </div>
        </div>
        <button class="btn btn-primary btn-xl btn-block" id="ok">Entendido</button>`;
      main.querySelector('#ok').addEventListener('click', next);
    });
  };

  const showSignificado = ({ frase }) => {
    const others = shuffle(data.distractors.filter((es) => es !== frase.es)).slice(0, 2);
    const options = shuffle([frase.es, ...others]);
    main.innerHTML = `${top()}
      <div class="stage">
        <p class="eyebrow">¿Qué significa?</p>
        <h1 class="phrase phrase-sm">${esc(frase.en)}</h1>
        <div class="stack">${options.map((o) => `<button class="option" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>
        <div id="fb"></div>
      </div>`;
    main.querySelectorAll('[data-o]').forEach((b) => b.addEventListener('click', () => {
      const right = b.dataset.o === frase.es;
      playSfx(right ? 'good' : 'miss');
      main.querySelectorAll('[data-o]').forEach((x) => {
        x.disabled = true;
        if (x.dataset.o === frase.es) x.classList.add('is-right');
        else if (x === b) x.classList.add('is-wrong');
      });
      main.querySelector('#fb').innerHTML = `<p class="fb ${right ? 'fb-ok' : 'fb-no'}">${right ? '¡Eso es!' : 'Casi. Es la verde.'}</p><button class="btn btn-primary btn-xl btn-block" id="ok">Seguir</button>`;
      main.querySelector('#ok').addEventListener('click', next);
    }));
  };

  const showArmar = ({ frase }) => {
    const pieces = frase.en.split(/\s+/);
    const pool = shuffle(pieces.map((w, i) => ({ w, i })));
    const built = [];
    const paint = () => {
      const complete = built.length === pieces.length;
      const right = complete && built.map((b) => b.w).join(' ') === frase.en;
      if (complete) playSfx(right ? 'great' : 'miss');
      main.innerHTML = `${top()}
        <div class="stage">
          <p class="eyebrow">Arma la frase</p>
          <p class="phrase-es">${esc(frase.es)}</p>
          <div class="built ${complete ? (right ? 'built-ok' : 'built-no') : ''}" aria-live="polite">
            ${built.map((b, n) => `<button class="token token-on" data-back="${n}" ${complete && right ? 'disabled' : ''}>${esc(b.w)}</button>`).join('') || '<span class="built-hint">Toca las palabras</span>'}
          </div>
          <div class="pool">${pool.map((p) => `<button class="token" data-p="${p.i}" ${built.some((b) => b.i === p.i) ? 'hidden' : ''}>${esc(p.w)}</button>`).join('')}</div>
          ${complete && !right ? `<p class="fb fb-no">Casi: <b>${esc(frase.en)}</b></p>` : ''}
          ${right ? '<p class="fb fb-ok">¡Perfecta!</p>' : ''}
        </div>
        ${complete ? `<button class="btn btn-primary btn-xl btn-block" id="ok">Seguir</button>` : ''}`;
      main.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => {
        const piece = pool.find((p) => p.i === Number(b.dataset.p));
        built.push(piece);
        if (built.length < pieces.length) playSfx('tap');
        paint();
      }));
      main.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => {
        built.splice(Number(b.dataset.back), 1);
        paint();
      }));
      main.querySelector('#ok')?.addEventListener('click', next);
    };
    paint();
  };

  const draw = () => {
    const step = steps[index];
    if (step.type === 'frase') showFrase(step);
    else if (step.type === 'significado') showSignificado(step);
    else showArmar(step);
    window.scrollTo(0, 0);
  };

  let finishing = false;
  const finish = async () => {
    if (finishing) return; // Un doble toque no repite la celebración.
    finishing = true;
    main.innerHTML = '<div class="stage center"><span class="spinner spinner-lg"></span></div>';
    let today = '';
    try {
      const out = await api('POST', '/api/aprender/terminar');
      if (!out.plan.learn.done) today = `${out.plan.learn.count}/${out.plan.learn.goal} hoy`;
      ctx.state.stats = out.stats;
      if (out.rewards.xp || out.rewards.coins) ctx.reward(out.rewards, { title: '¡Frases aprendidas!', fallback: 'Sigue así' });
    } catch (err) { ctx.toast(err.message); }
    playSfx('great');
    main.innerHTML = `<div class="stage center">
        ${capybara({ mood: 'welcome', size: 120, equipped: ctx.state.me?.equipped })}
        <h1 class="phrase phrase-sm">¡${pack.length} frases más!</h1>
        ${today ? `<p class="hero-count"><b>${today}</b></p>` : ''}
      </div>
      <button class="btn btn-primary btn-xl btn-block" id="more">${icons.dice}Generar más</button>
      <a class="btn btn-block" href="#/aprender">Salir</a>`;
    main.querySelector('#more').addEventListener('click', () => viewAprenderJugar(ctx, topic));
  };

  draw();
}
