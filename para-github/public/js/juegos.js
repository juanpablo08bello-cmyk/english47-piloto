// Temas: las palabras del Diccionario VIP en juegos cortos, para que se queden en la memoria. Solo se toca: aquí no se habla.
import { api, confetti, esc, icons, playSfx } from './core.js';
import { capybara } from './capybara.js';
import { sayModel, starsHtml } from './voz.js';

const shuffle = (list) => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
const wait = (ms) => new Promise((ok) => { setTimeout(ok, ms); });

export async function viewJuego(ctx, tema) {
  const main = ctx.shell('<div class="stage center"><span class="spinner spinner-lg"></span></div>', { focus: true, section: 'learn' });
  const { theme, words, pool, sentences = [] } = await api('POST', '/api/aprender/tema', { tema });
  const voice = ctx.state.voice ?? await api('GET', '/api/voice/status').catch(() => null);
  ctx.state.voice = voice;
  const isVerbs = theme.kind === 'verbs';
  let misses = 0;
  let gone = false;
  ctx.setTeardown(() => { gone = true; });

  // Ronda: 1) parejas, 2) ¿qué significa?, 3) escucha y elige, 4) ordena la frase, 5) pasado o letras.
  const quizWords = shuffle(words).slice(0, 3);
  const listenWords = shuffle(words.filter((w) => !quizWords.includes(w))).slice(0, 2);
  const orderSentences = sentences.slice(0, 2);
  const lastWords = isVerbs ? shuffle(words).slice(0, 2) : shuffle(words.filter((w) => /^[a-zA-Z]{3,10}$/.test(w.en))).slice(0, 2);
  const totalSteps = 1 + quizWords.length + listenWords.length + orderSentences.length + lastWords.length;
  let doneSteps = 0;

  const top = (title) => `<div class="ex-top">
      <a class="iconbtn" href="#/aprender/temas" aria-label="Salir">${icons.close}</a>
      <div class="bar bar-learn grow"><i style="width:${(doneSteps / totalSteps) * 100}%"></i></div>
    </div>
    <p class="game-theme">${esc(theme.title)}</p>
    <p class="game-title">${esc(title)}</p>`;

  const miss = () => { misses += 1; playSfx('miss'); };

  const pairsGame = () => new Promise((resolve) => {
    const set = shuffle(words).slice(0, 5);
    const left = shuffle(set);
    const right = shuffle(set);
    main.innerHTML = `${top('Une cada palabra con su significado')}
      <div class="stage game-stage"><div class="pairs">
        <div class="pairs-col">${left.map((w) => `<button class="pair" data-side="en" data-key="${esc(w.en)}">${esc(w.en)}</button>`).join('')}</div>
        <div class="pairs-col">${right.map((w) => `<button class="pair pair-es" data-side="es" data-key="${esc(w.en)}">${esc(w.es)}</button>`).join('')}</div>
      </div></div>`;
    let picked = null;
    let left2 = set.length;
    main.querySelectorAll('.pair').forEach((b) => b.addEventListener('click', async () => {
      if (b.disabled) return;
      if (!picked) { picked = b; b.classList.add('is-picked'); playSfx('tap'); return; }
      if (picked === b) { b.classList.remove('is-picked'); picked = null; return; }
      if (picked.dataset.side === b.dataset.side) { picked.classList.remove('is-picked'); picked = b; b.classList.add('is-picked'); playSfx('tap'); return; }
      const first = picked;
      picked = null;
      if (first.dataset.key === b.dataset.key) {
        playSfx('good');
        [first, b].forEach((x) => { x.classList.remove('is-picked'); x.classList.add('is-matched'); x.disabled = true; });
        left2 -= 1;
        if (!left2) { doneSteps += 1; await wait(450); resolve(); }
      } else {
        miss();
        [first, b].forEach((x) => { x.classList.remove('is-picked'); x.classList.add('is-shake'); });
        await wait(420);
        [first, b].forEach((x) => x.classList.remove('is-shake'));
      }
    }));
  });

  const choiceRound = (title, big, correct, options, hint = '') => new Promise((resolve) => {
    main.innerHTML = `${top(title)}
      <div class="stage game-stage">
        <h1 class="phrase phrase-sm center">${esc(big)}</h1>
        ${hint ? `<p class="game-hint">${esc(hint)}</p>` : ''}
        <div class="stack">${options.map((o) => `<button class="option" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>
      </div>`;
    main.querySelectorAll('[data-o]').forEach((b) => b.addEventListener('click', async () => {
      const right = b.dataset.o === correct;
      if (right) playSfx('good'); else miss();
      main.querySelectorAll('[data-o]').forEach((x) => {
        x.disabled = true;
        if (x.dataset.o === correct) x.classList.add('is-right');
        else if (x === b) x.classList.add('is-wrong');
      });
      doneSteps += 1;
      await wait(right ? 650 : 1300);
      resolve();
    }));
  });

  const meaningRound = (w, i) => {
    const others = (field) => shuffle([...new Set(pool.filter((p) => p.en !== w.en && p[field] !== w[field]).map((p) => p[field]))]).slice(0, 3);
    return i % 2 === 0
      ? choiceRound('¿Qué significa?', w.en, w.es, shuffle([w.es, ...others('es')]))
      : choiceRound('¿Cómo se dice en inglés?', w.es, w.en, shuffle([w.en, ...others('en')]));
  };

  const pastRound = (w) => {
    const correct = w.past;
    const trap = `${w.en}ed`;
    const others = shuffle([...new Set(pool.map((p) => p.past).filter((p) => p && p !== correct))]).slice(0, 3);
    const options = shuffle([correct, ...(trap !== correct ? [trap] : []), ...others].slice(0, 4));
    return choiceRound('¿Cuál es su pasado?', w.en, correct, options, w.es);
  };

  // Escucha y elige: suena en inglés y se toca lo que oyó. Entrena el oído sin leer.
  const listenRound = (w) => new Promise((resolve) => {
    const others = shuffle([...new Set(pool.filter((p) => p.en !== w.en).map((p) => p.en))]).slice(0, 3);
    const options = shuffle([w.en, ...others]);
    const play = () => sayModel(w.en, voice).catch(() => {});
    main.innerHTML = `${top('Escucha y toca lo que oyes')}
      <div class="stage game-stage">
        <button class="listen-big" id="hear" aria-label="Escuchar otra vez">${icons.sound}</button>
        <div class="stack">${options.map((o) => `<button class="option" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>
      </div>`;
    main.querySelector('#hear').addEventListener('click', play);
    play();
    main.querySelectorAll('[data-o]').forEach((b) => b.addEventListener('click', async () => {
      const right = b.dataset.o === w.en;
      if (right) playSfx('good'); else miss();
      main.querySelectorAll('[data-o]').forEach((x) => {
        x.disabled = true;
        if (x.dataset.o === w.en) x.classList.add('is-right');
        else if (x === b) x.classList.add('is-wrong');
      });
      doneSteps += 1;
      await wait(right ? 650 : 1300);
      resolve();
    }));
  });

  // Ordena la frase: con las piezas en desorden, se arma la frase en inglés. Lo que más importa es construirla.
  const orderRound = (s) => new Promise((resolve) => {
    // Sin mayúscula inicial ni signos: si no, «Would» y «coffee?» delatan dónde van.
    const piece = (word, i) => {
      const bare = word.replace(/[.,!?;:]/g, '');
      return i === 0 && !/^I($|')/.test(bare) && !/^[A-Z]{2}/.test(bare) ?bare.charAt(0).toLowerCase() + bare.slice(1) : bare;
    };
    const target = s.en.split(/\s+/).map(piece);
    const answer = target.join(' ');
    let pieces = shuffle(target.map((t, i) => ({ t, i })));
    if (pieces.map((p) => p.t).join(' ') === answer) pieces = pieces.reverse();
    const built = [];
    let wrongOnce = false;
    const paint = () => {
      const complete = built.length === target.length;
      const right = complete && built.map((b) => b.t).join(' ') === answer;
      main.innerHTML = `${top('Ordena la frase en inglés')}
        <div class="stage game-stage">
          <h1 class="phrase phrase-sm center">${esc(s.es)}</h1>
          <div class="words-built ${complete ? (right ? 'built-ok' : 'built-no') : ''}">${right ? `<span class="word-chip">${esc(s.en)}</span>` : built.length ? built.map((b) => `<span class="word-chip">${esc(b.t)}</span>`).join('') : '<span class="words-empty">Toca las palabras en orden</span>'}</div>
          <div class="words-pool">${pieces.map((p) => `<button class="token" data-p="${p.i}" ${built.includes(p) ? 'hidden' : ''}>${esc(p.t)}</button>`).join('')}</div>
          ${built.length && !complete ? '<button class="text-btn text-btn-light" id="undo">Borrar la última</button>' : ''}
        </div>`;
      main.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => {
        built.push(pieces.find((p) => p.i === Number(b.dataset.p)));
        playSfx('tap');
        paint();
      }));
      main.querySelector('#undo')?.addEventListener('click', () => { built.pop(); paint(); });
      if (complete) {
        if (right) {
          playSfx('good');
          doneSteps += 1;
          sayModel(s.en, voice).catch(() => {});
          wait(1100).then(resolve);
        } else {
          if (!wrongOnce) { wrongOnce = true; miss(); }
          wait(800).then(() => { built.length = 0; if (!gone) paint(); });
        }
      }
    };
    paint();
  });

  const lettersRound = (w) => new Promise((resolve) => {
    const letters = w.en.toLowerCase().split('');
    let pieces = shuffle(letters.map((l, i) => ({ l, i })));
    if (pieces.map((p) => p.l).join('') === letters.join('')) pieces = pieces.reverse();
    const built = [];
    const paint = () => {
      const complete = built.length === letters.length;
      const right = complete && built.map((b) => b.l).join('') === letters.join('');
      main.innerHTML = `${top('Arma la palabra en inglés')}
        <div class="stage game-stage">
          <h1 class="phrase phrase-sm center">${esc(w.es)}</h1>
          <div class="letters-built ${complete ? (right ? 'built-ok' : 'built-no') : ''}">${letters.map((_, i) => `<span class="letter-slot">${built[i] ? esc(built[i].l) : ''}</span>`).join('')}</div>
          <div class="letters-pool">${pieces.map((p) => `<button class="token" data-p="${p.i}" ${built.includes(p) ? 'hidden' : ''}>${esc(p.l)}</button>`).join('')}</div>
          ${built.length && !complete ? '<button class="text-btn text-btn-light" id="undo">Borrar la última</button>' : ''}
        </div>`;
      main.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => {
        built.push(pieces.find((p) => p.i === Number(b.dataset.p)));
        playSfx('tap');
        paint();
      }));
      main.querySelector('#undo')?.addEventListener('click', () => { built.pop(); paint(); });
      if (complete) {
        if (right) {
          playSfx('good');
          doneSteps += 1;
          wait(650).then(resolve);
        } else {
          miss();
          wait(700).then(() => { built.length = 0; if (!gone) paint(); });
        }
      }
    };
    paint();
  });

  const finish = async () => {
    main.innerHTML = '<div class="stage center"><span class="spinner spinner-lg"></span></div>';
    let today = '';
    try {
      const out = await api('POST', '/api/aprender/tema/terminar');
      ctx.state.stats = out.stats;
      if (!out.plan.learn.done) today = `${out.plan.learn.count}/${out.plan.learn.goal} hoy`;
      if (out.rewards.xp || out.rewards.coins) ctx.reward(out.rewards, { title: '¡Bien hecho!', fallback: 'Sigue así' });
    } catch (err) { ctx.toast(err.message); }
    if (gone) return;
    const stars = misses === 0 ? 5 : misses <= 2 ? 4 : misses <= 4 ? 3 : 2;
    playSfx('great');
    if (stars >= 4) confetti();
    main.innerHTML = `<div class="stage center">
        ${capybara({ mood: 'celebrate', size: 112, equipped: ctx.state.me?.equipped })}
        <h1 class="phrase phrase-sm">${misses === 0 ? '¡Sin un solo error!' : '¡Tema practicado!'}</h1>
        ${starsHtml(stars)}
        ${today ? `<p class="hero-count"><b>${today}</b></p>` : ''}
        <ul class="my-words game-words">${words.map((w) => `<li><b>${esc(w.en)}</b><span>${esc(w.es)}</span></li>`).join('')}</ul>
      </div>
      <button class="btn btn-primary btn-xl btn-block" id="again">Otra ronda</button>
      <a class="skip-link center" href="#/aprender/temas">Volver a los temas</a>`;
    main.querySelector('#again').addEventListener('click', () => viewJuego(ctx, tema));
  };

  await pairsGame();
  if (gone) return;
  for (const [i, w] of quizWords.entries()) { await meaningRound(w, i); if (gone) return; }
  for (const w of listenWords) { await listenRound(w); if (gone) return; }
  for (const s of orderSentences) { await orderRound(s); if (gone) return; }
  for (const w of lastWords) { await (isVerbs ? pastRound(w) : lettersRound(w)); if (gone) return; }
  doneSteps = totalSteps;
  await finish();
}
