// Enrutador y pantallas. Navegacion inferior: Hoy, Aprender, Mesas, Mejorar y Perfil.
import { api, ApiError, chime, confetti, esc, icons, newRequestId, plural, setSound, statIcons, toast } from './core.js';
import { capybara } from './capybara.js';
import { deviceVoiceAvailable, speakDevice, stopPlayback } from './audio.js';
import { mountExercises } from './exercise.js';
import { viewAprender, viewAprenderJugar } from './aprender.js';
import { viewMesas, viewMesaAtender } from './mesas.js';
import { viewMejorar, viewMejorarJugar } from './mejorar.js';
import { modeBanner, mountSim } from './sim.js';
import { mountVoiceLab } from './voice-lab.js';

const app = document.getElementById('app');
const overlay = document.getElementById('overlay');
const state = { me: null, stats: null, voice: null };
let teardown = null;
let renderToken = 0;

const TABS = [
  { hash: '#/hoy', label: 'Hoy', icon: icons.today },
  { hash: '#/aprender', label: 'Aprender', icon: icons.book },
  { hash: '#/mesas', label: 'Mesas', icon: icons.plate },
  { hash: '#/mejorar', label: 'Mejorar', icon: icons.talk },
  { hash: '#/perfil', label: 'Perfil', icon: icons.profile },
];

const OUTCOMES = {
  attempted: { label: 'Intentado', cls: '', text: 'Participaste, pero la escena no se recorrió o tus respuestas no se relacionaban con la situación.' },
  completed: { label: 'Completado', cls: 'chip-blue', text: 'Recorriste la escena. Todavía quedan criterios de servicio por cumplir.' },
  resolved: { label: 'Resuelto', cls: 'chip-green', text: 'Recorriste la escena y cumpliste sus criterios esenciales.' },
};
const outcomeChip = (o) => (OUTCOMES[o] ? `<span class="chip ${OUTCOMES[o].cls}">${o === 'resolved' ? icons.check : ''}${OUTCOMES[o].label}</span>` : '');
const DIFFICULTY = { 1: 'Básico', 2: 'Intermedio', 3: 'Avanzado' };
const UNIT_NAMES = { 1: 'Recibir y acomodar', 2: 'Bebidas', 3: 'Explicar el menú', 4: 'Tomar la orden', 5: 'Alergias y restricciones', 6: 'Durante el servicio', 7: 'Resolver problemas', 8: 'Cerrar la mesa' };

function statsBar() {
  const s = state.stats;
  if (!s) return '';
  return `<div class="stats" aria-label="Tu progreso">
    <span class="stat" title="Racha">${statIcons.flame}<span>${s.current}<span class="sr"> ${s.current === 1 ? 'día' : 'días'} de racha</span></span></span>
    <span class="stat" title="XP">${statIcons.xp}${s.xp}</span>
    <span class="stat" title="Monedas">${statIcons.coin}${s.coins}</span>
  </div>`;
}

function shell(content, { tab = null, focus = false } = {}) {
  const tabs = TABS.map((t) => `<a class="tab ${tab === t.hash ? 'active' : ''}" href="${t.hash}" ${tab === t.hash ? 'aria-current="page"' : ''}><span class="tab-icon">${t.icon}</span>${t.label}</a>`).join('');
  app.innerHTML = `<div class="shell ${focus ? '' : 'with-tabs'}">
    ${focus ? '' : `<header class="topbar"><a class="brand" href="#/hoy" style="text-decoration:none">ENGLISH<b>47</b></a>${statsBar()}</header>`}
    <main class="content ${focus ? 'focus' : ''}" id="main">${content}</main>
    ${focus ? '' : `<nav class="tabbar" aria-label="Principal">${tabs}</nav>`}
  </div>`;
  window.scrollTo(0, 0);
  return document.getElementById('main');
}

// --- Comentarios: se abre encima de la pantalla, sin perder lo que estabas escribiendo. ---
const FEEDBACK_SECTION = [
  [/^#\/aprender/, 'Aprender'], [/^#\/mesas/, 'Mesas'], [/^#\/mejorar/, 'Mejorar'], [/^#\/(ruta|leccion|repaso)/, 'Ruta'],
  [/^#\/(hablar|preparar|sim)/, 'Hablar'], [/^#\/(palabras|palabra|practicar)/, 'Palabras'], [/^#\/perfil/, 'Perfil'], [/^#\/hoy/, 'Hoy'],
];

async function openFeedback() {
  if (overlay.querySelector('.modal')) return;
  const { sections } = await api('GET', '/api/feedback/sections');
  const current = FEEDBACK_SECTION.find(([re]) => re.test(location.hash))?.[1] ?? 'Otra';
  const requestId = newRequestId();
  const el = document.createElement('div');
  el.className = 'modal';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'Reportar un problema');
  el.innerHTML = `<form class="modal-card stack">
    <div class="spread"><h2>Cuéntanos cómo te fue</h2><button type="button" class="iconbtn" data-close aria-label="Cerrar">${icons.close}</button></div>
    <p class="small muted">Tu comentario lo verá la administración, junto con tu nombre. No se graba audio ni pantalla. No incluyas datos de clientes.</p>
    <label class="field">¿En qué parte estabas?
      <select class="input" name="section">${sections.map((s) => `<option ${s === current ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></label>
    <label class="field">¿Qué intentabas hacer?<input class="input" name="trying" maxlength="300" required autocomplete="off"></label>
    <label class="field">¿Qué falló o te confundió?<textarea class="input" name="problem" rows="2" maxlength="600" required></textarea></label>
    <label class="field">Comentario (opcional)<textarea class="input" name="comment" rows="2" maxlength="600"></textarea></label>
    <div class="notice notice-amber small" data-err hidden role="alert"></div>
    <button class="btn btn-primary btn-block">Enviar comentario</button>
  </form>`;
  overlay.append(el);
  el.querySelector('[data-close]').addEventListener('click', () => el.remove());
  el.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('.btn-primary');
    btn.disabled = true;
    try {
      await api('POST', '/api/feedback', { ...Object.fromEntries(new FormData(e.target)), requestId });
      el.remove();
      toast('Gracias. Tu comentario quedó guardado para la administración.');
    } catch (err) {
      const box = el.querySelector('[data-err]');
      box.textContent = `${err.message} Lo que escribiste sigue aquí.`;
      box.hidden = false;
      btn.disabled = false;
    }
  });
}

document.addEventListener('click', (e) => {
  if (e.target.closest?.('[data-report]')) openFeedback().catch((err) => toast(err.message));
});

window.addEventListener('e47:update', () => {
  if (overlay.querySelector('.update-bar')) return;
  const bar = document.createElement('div');
  bar.className = 'update-bar';
  bar.setAttribute('role', 'status');
  bar.innerHTML = '<span>Hay una versión nueva. Tu progreso está guardado.</span><button class="btn btn-sm">Actualizar</button>';
  bar.querySelector('button').addEventListener('click', () => location.reload());
  overlay.append(bar);
});

// --- Primer dia ---
function viewWelcome() {
  const main = shell(`<div class="stage center">
    ${capybara({ mood: 'welcome', size: 150, equipped: state.me?.equipped })}
    <h1 class="display">Hola${state.me ? `, ${esc(state.me.displayName)}` : ''}</h1>
    <div class="row-center">
      <span class="chip chip-learn-on">Aprende</span>
      <span class="chip chip-table">Atiende</span>
      <span class="chip chip-xp-on">Mejora</span>
    </div>
    <p class="muted">Te guiamos paso a paso.</p>
  </div>
  <button class="btn btn-primary btn-xxl btn-block" id="go">Empezar</button>`, { focus: true });
  main.querySelector('#go').addEventListener('click', async () => {
    await api('POST', '/api/diagnostic/skip');
    location.hash = '#/hoy';
  });
}

function celebrate({ title, lines = [], mood = 'celebrate' }) {
  chime();
  confetti();
  const el = document.createElement('div');
  el.className = 'celebrate';
  el.innerHTML = `<div class="celebrate-card" role="status">
    ${capybara({ mood, size: 128, equipped: state.me?.equipped, label: 'Capibara celebrando' })}
    <h2>${esc(title)}</h2>
    ${lines.length ? `<div class="celebrate-lines">${lines.map((l) => `<span>${esc(l)}</span>`).join('')}</div>` : ''}
    <button class="btn btn-primary btn-block">Continuar</button>
  </div>`;
  overlay.append(el);
  el.querySelector('button').addEventListener('click', () => el.remove());
  el.querySelector('button').focus();
}

function rewardLines(r) {
  if (!r) return [];
  const lines = [];
  if (r.xp) lines.push(`+${r.xp} XP`);
  if (r.coins) lines.push(`+${r.coins} monedas`);
  if (r.bonus) lines.push(`+${r.bonus} monedas extra`);
  if (r.newDay) lines.push(`Racha: ${plural(state.stats?.current ?? 1, 'día', 'días')}`);
  return lines;
}

async function refreshStats(stats) {
  if (stats) { state.stats = stats; return; }
  const today = await api('GET', '/api/today');
  state.stats = today.stats;
  state.me = today.user;
  state.voice = today.voice;
}

function loading() {
  return `<div class="center stack" style="padding-top:48px;align-items:center">${capybara({ mood: 'focus', size: 96, label: 'Cargando' })}<p class="muted">Cargando…</p></div>`;
}

function errorView(err) {
  return `<div class="stack center" style="padding-top:32px;align-items:center">
    ${capybara({ mood: 'focus', size: 96, label: 'Capibara' })}
    <p>${esc(err.message)}</p>
    <button class="btn btn-primary" id="retry">Reintentar</button>
  </div>`;
}

// --- Acceso ---
function viewLogin() {
  const main = shell(`<div class="stack-lg" style="padding-top:24px">
    <div class="center stack" style="align-items:center">
      ${capybara({ mood: 'welcome', size: 128, label: 'Capibara mesero de ENGLISH47' })}
      <h1 class="display">ENGLISH<span style="color:var(--action)">47</span></h1>
      <p class="muted">Inglés para meseros</p>
    </div>
    <form class="stack" id="login">
      <label class="field">Usuario<input class="input" name="username" autocomplete="username" autocapitalize="none" required></label>
      <label class="field">Contraseña<input class="input" name="password" type="password" autocomplete="current-password" required></label>
      <div id="err" class="notice notice-amber" hidden role="alert"></div>
      <button class="btn btn-primary btn-block">Entrar</button>
    </form>
    <p class="small center"><a href="#/invite">Tengo una invitación</a></p>
  </div>`, { focus: true });
  main.querySelector('#login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      const { user } = await api('POST', '/api/auth/login', { username: f.get('username'), password: f.get('password') });
      state.me = user;
      state.stats = null;
      location.hash = '#/hoy';
    } catch (err) {
      const box = main.querySelector('#err');
      box.textContent = err.message;
      box.hidden = false;
    }
  });
}

function viewInvite(code = '') {
  const main = shell(`<div class="stack-lg" style="padding-top:16px">
    <div class="hello">${capybara({ mood: 'welcome', size: 80 })}<div><h1>Bienvenido</h1><p class="muted">Crea tu cuenta personal.</p></div></div>
    <form class="stack" id="redeem">
      <label class="field">Código de invitación<input class="input" name="code" value="${esc(code)}" autocomplete="off" autocapitalize="none" required></label>
      <label class="field">Tu nombre<input class="input" name="displayName" autocomplete="given-name" required></label>
      <label class="field">Usuario<input class="input" name="username" autocomplete="username" autocapitalize="none" required></label>
      <label class="field">Contraseña (mínimo 8 caracteres)<input class="input" name="password" type="password" autocomplete="new-password" minlength="8" required></label>
      <div id="err" class="notice notice-amber" hidden role="alert"></div>
      <button class="btn btn-primary btn-block">Crear mi cuenta</button>
    </form>
    <p class="small muted center"><a href="#/entrar">Ya tengo cuenta</a></p>
  </div>`, { focus: true });
  main.querySelector('#redeem').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    try {
      const { user } = await api('POST', '/api/auth/redeem', f);
      state.me = user;
      state.stats = null;
      location.hash = user.role === 'admin' ? '#/admin' : '#/bienvenida';
    } catch (err) {
      const box = main.querySelector('#err');
      box.textContent = err.message;
      box.hidden = false;
    }
  });
}

// --- Diagnostico ---
const BASIS_TEXT = {
  audio: 'Comprensión: respondiste escuchando la voz del dispositivo.',
  read: 'Comprensión: leíste al menos una transcripción, así que este resultado no comprueba tu comprensión auditiva.',
  unknown: 'Comprensión: no pudimos comprobar si escuchaste el audio, así que tómalo como orientación.',
};

async function viewDiagnostic(autoStart) {
  const main = shell(loading(), { focus: true });
  let round = 1;
  let questions = [];
  let answers = {};
  let meta = {};
  let i = 0;
  const skip = async () => {
    await api('POST', '/api/diagnostic/skip');
    location.hash = '#/hoy';
  };
  const intro = () => {
    main.innerHTML = `<div class="stack-lg center" style="align-items:center;padding-top:24px">
      ${capybara({ mood: 'welcome', size: 128 })}
      <h1>Veamos por dónde empezar</h1>
      <p>Son 9 preguntas, unos 5 minutos. Ya conoces el trabajo: esto solo nos dice qué practicar primero. Si todo sale bien, hay una ronda breve más.</p>
      <p class="small muted">No es un examen ni da un nivel oficial.</p>
      <button class="btn btn-primary btn-block" id="go">Empezar</button>
      <button class="linkbtn" id="skip">Omitir por ahora</button>
    </div>`;
    main.querySelector('#go').addEventListener('click', () => startRound(1));
    main.querySelector('#skip').addEventListener('click', skip);
  };
  const startRound = async (n) => {
    round = n;
    ({ questions } = await api('GET', `/api/diagnostic?round=${n}`));
    answers = {};
    meta = {};
    i = 0;
    question();
  };
  const question = () => {
    const q = questions[i];
    const pct = Math.round((i / questions.length) * 100);
    const voiceOk = deviceVoiceAvailable();
    const listenArea = q.audio ? `
      ${voiceOk ? `<button class="btn btn-help btn-block" id="listen">${icons.sound}Escuchar</button>` : '<div class="notice notice-amber small">Este dispositivo no tiene voz disponible: lee el texto.</div>'}
      <div id="transcript" ${voiceOk ? 'hidden' : ''} class="card card-quiet"><span class="en">${esc(q.audio)}</span></div>
      ${voiceOk ? '<button class="linkbtn" id="showtext">No puedo escuchar: mostrar el texto</button>' : ''}` : '';
    const body = q.type === 'free'
      ? `<textarea class="input" rows="3" id="free" placeholder="Escríbelo en inglés, como te salga" spellcheck="false"></textarea>
         <button class="btn btn-primary btn-block" id="next">Siguiente</button>
         <button class="linkbtn" id="dontknow">Prefiero no responder</button>`
      : `${listenArea}${q.options.map((o) => `<button class="option" data-o="${esc(o)}">${esc(o)}</button>`).join('')}`;
    main.innerHTML = `<div class="ex-top">
        <button class="iconbtn" id="skip" aria-label="Omitir diagnóstico">${icons.close}</button>
        <div class="bar grow"><i style="width:${pct}%"></i></div><span class="small muted">${round === 2 ? 'Ronda 2 · ' : ''}${i + 1}/${questions.length}</span>
      </div>
      <div class="stack"><h2>${esc(q.prompt)}</h2>${body}</div>`;
    const advance = async () => {
      i += 1;
      if (i < questions.length) { question(); return; }
      const { result } = await api('POST', '/api/diagnostic', { round, answers, meta });
      showResult(result);
    };
    main.querySelector('#skip').addEventListener('click', skip);
    if (q.audio) {
      meta[q.id] = voiceOk ? 'unknown' : 'read';
      const play = async () => {
        const ok = await speakDevice(q.audio);
        if (ok && meta[q.id] !== 'read') meta[q.id] = 'audio';
      };
      main.querySelector('#listen')?.addEventListener('click', play);
      main.querySelector('#showtext')?.addEventListener('click', (e) => {
        meta[q.id] = 'read';
        main.querySelector('#transcript').hidden = false;
        e.currentTarget.remove();
      });
    }
    main.querySelectorAll('[data-o]').forEach((b) => b.addEventListener('click', () => { answers[q.id] = b.dataset.o; advance(); }));
    main.querySelector('#next')?.addEventListener('click', () => { answers[q.id] = main.querySelector('#free').value; advance(); });
    main.querySelector('#dontknow')?.addEventListener('click', advance);
  };
  const showResult = (r) => {
    if (r.needsRound2) {
      main.innerHTML = `<div class="stack-lg center" style="align-items:center;padding-top:24px">
        ${capybara({ mood: 'cheer', size: 112 })}
        <h1>Respondiste todo bien</h1>
        <p>Para no hacerte repetir lo que ya sabes, hay una segunda ronda breve de 6 preguntas, más parecida al trabajo real.</p>
        <button class="btn btn-primary btn-block" id="go">Hacer la segunda ronda</button>
        <button class="linkbtn" id="stop">Ver mi recomendación ahora</button>
      </div>`;
      main.querySelector('#go').addEventListener('click', () => startRound(2));
      main.querySelector('#stop').addEventListener('click', async () => { await api('POST', '/api/diagnostic/skip'); finalResult(r); });
      return;
    }
    finalResult(r);
  };
  const finalResult = (r) => {
    const row = (label, s) => `<div class="stack" style="gap:4px"><div class="spread"><b>${label}</b><span class="small muted">${s.correct} de ${s.total}${s.needsReview ? ` · ${s.needsReview} por revisar` : ''}</span></div><div class="bar"><i style="width:${s.total ? (s.correct / s.total) * 100 : 0}%"></i></div></div>`;
    main.innerHTML = `<div class="stack-lg" style="padding-top:16px">
      <div class="hello">${capybara({ mood: 'cheer', size: 80 })}<h1>Tu punto de partida</h1></div>
      <div class="card stack">
        ${row('Comprensión', r.skills.comprehension)}
        ${row('Vocabulario', r.skills.vocabulary)}
        ${row('Expresión profesional', r.skills.expression)}
        <p class="small muted">${esc(BASIS_TEXT[r.comprehensionBasis] ?? BASIS_TEXT.unknown)}</p>
        <p class="small muted">Las respuestas libres se revisaron con reglas automáticas, sin IA. «Por revisar» significa que no pudieron confirmarlas. No se evaluó pronunciación.</p>
      </div>
      <section class="stack"><h2>Por dónde te sugerimos seguir</h2>
        ${r.recommended.map((x) => `<div class="card stack"><b>Unidad ${x.unit}: ${esc(UNIT_NAMES[x.unit])}</b><p class="small">${esc(x.why)}</p></div>`).join('')}
      </section>
      <label class="field">Empezar en
        <select class="input" id="unit">${Object.entries(UNIT_NAMES).map(([id, name]) => `<option value="${id}" ${Number(id) === r.placementUnit ? 'selected' : ''}>Unidad ${id}: ${esc(name)}</option>`).join('')}</select>
      </label>
      <p class="small muted">Toda la ruta queda abierta y puedes cambiar esto en Perfil. Es una orientación para elegir tu práctica, no un nivel oficial ni una certificación.</p>
      <button class="btn btn-primary btn-block" id="done">Empezar mi práctica</button>
    </div>`;
    main.querySelector('#done').addEventListener('click', async () => {
      const unit = Number(main.querySelector('#unit').value);
      if (unit !== r.placementUnit) await api('POST', '/api/placement', { unit });
      location.hash = '#/sesion';
    });
  };
  if (autoStart) await startRound(1);
  else intro();
}

// --- Hoy ---
const TODAY_STEPS = [
  { key: 'learn', cls: 'today-learn', href: '#/aprender', title: 'Aprender', sub: 'Frases y palabras' },
  { key: 'tables', cls: 'today-tables', href: '#/mesas', title: 'Mesas', sub: 'Atiende hablando' },
  { key: 'improve', cls: 'today-improve', href: '#/mejorar', title: 'Mejorar', sub: 'Pronuncia y escucha' },
];

async function viewToday() {
  const today = await api('GET', '/api/today');
  Object.assign(state, { me: today.user, stats: today.stats, voice: today.voice });
  setSound(today.user.soundOn);
  if (today.user.role === 'student' && today.user.diagnosticStatus === 'pending') { location.hash = '#/bienvenida'; return; }
  const { stats, plan, weekly } = today;
  const mood = plan.allDone ? 'celebrate' : plan.doneCount ? 'cheer' : 'welcome';
  const steps = TODAY_STEPS.map((step, i) => {
    const done = plan[step.key].done;
    return `<a class="today-step ${step.cls} ${plan.next === step.key ? 'is-next' : ''}" href="${step.href}">
      <span class="num">${done ? icons.check : i + 1}</span>
      <span class="grow"><b>${step.title}</b><small>${step.sub}</small></span>
    </a>`;
  }).join('');
  shell(`<div class="page">
    <header class="hero hero-today">
      <div class="grow">
        <h1 class="display">Hola, ${esc(today.user.displayName)}</h1>
        <p class="streak">${statIcons.flame}${stats.current ? plural(stats.current, 'día', 'días') : 'Tu primer día'}</p>
      </div>
      ${capybara({ mood, size: 92, equipped: today.user.equipped })}
    </header>
    ${stats.shieldsJustUsed?.length ? '<p class="notice small">Un protector salvó tu racha.</p>' : ''}
    ${stats.interrupted ? '<p class="notice small">Tu progreso sigue aquí. Retomemos hoy.</p>' : ''}
    ${steps}
    ${plan.allDone ? '<p class="fb fb-ok">¡Día completo!</p>' : ''}
    <section class="stack" aria-label="Reto semanal">
      <div class="spread"><b>Esta semana</b><span class="small muted">${Math.min(weekly.done, weekly.goal)}/${weekly.goal} días</span></div>
      <div class="week">${Array.from({ length: weekly.goal }, (_, i) => `<span class="${i < weekly.done ? 'on' : ''}">${i < weekly.done ? icons.check.replace('<svg', '<svg width="20" height="20"') : i + 1}</span>`).join('')}</div>
    </section>
    ${today.user.role === 'admin' ? '<a class="btn btn-block" href="#/admin">Administración</a>' : ''}
  </div>`, { tab: '#/hoy' });
}

function entryCard(v) {
  return `<article class="stack">
    <div><h1 class="en">${esc(v.en)}</h1><p>${esc(v.es)}</p>
      <div class="row-wrap" style="margin-top:4px"><span class="chip">${esc(DIFFICULTY[v.difficulty] ?? '')}</span><span class="chip">${esc(v.category)}</span></div>
      ${v.pron ? `<p class="small muted">Ayuda aproximada, no reemplaza al audio: «${esc(v.pron)}»</p>` : ''}
    </div>
    ${deviceVoiceAvailable() ? `<button class="btn btn-help btn-block" data-say="${esc(v.en)}">${icons.sound}Escuchar</button>` : ''}
    <div class="card stack">
      <div><p class="small muted">Frase de servicio</p><p class="en">${esc(v.phrase)}</p>${deviceVoiceAvailable() ? `<button class="linkbtn" data-say="${esc(v.phrase)}">Escuchar la frase</button>` : ''}</div>
      <div class="bubble bubble-guest"><small>${v.category.startsWith('Comunicación') ? 'Compañero' : 'Cliente'}</small><span class="en">${esc(v.guest)}</span></div>
      <div class="bubble bubble-me"><small>Respuesta posible</small><span class="en">${esc(v.reply)}</span></div>
      ${v.alts?.length ? `<p class="small"><b>Equivale a:</b> ${v.alts.map(esc).join(' · ')}</p>` : ''}
      ${v.related?.length ? `<p class="small"><b>Relacionado, pero no igual:</b> ${v.related.map(esc).join(' · ')}</p>` : ''}
      ${v.examples?.length ? `<p class="small"><b>Por ejemplo:</b> ${v.examples.map(esc).join(' · ')}</p>` : ''}
      ${(v.contrasts ?? []).map((c) => `<p class="small"><b>No confundir con «${esc(c.wrong)}»:</b> ${esc(c.why)}</p>`).join('')}
      ${v.notes ? `<p class="small"><b>Nota de uso:</b> ${esc(v.notes)}</p>` : ''}
    </div>
  </article>`;
}

function bindEntry(root) {
  root.querySelectorAll('[data-say]').forEach((b) => b.addEventListener('click', () => speakDevice(b.dataset.say)));
}

function improvementCard(it, extra = '') {
  return `<div class="card stack">
    ${it.yours ? `<div><p class="small muted">Dijiste</p><p>${esc(it.yours)}</p></div>` : ''}
    ${it.communicated ? `<div><p class="small muted">Qué comunicaste</p><p class="small">${esc(it.communicated)}</p></div>` : ''}
    ${it.why ? `<div><p class="small muted">Qué cambiar</p><p class="small">${esc(it.why)}</p></div>` : ''}
    <div><p class="small muted">Versión corregida</p><p class="en">${esc(it.corrected)}</p></div>
    ${it.alternative ? `<div><p class="small muted">Alternativa natural</p><p class="en">${esc(it.alternative)}</p></div>` : ''}
    <button class="linkbtn" data-say="${esc(it.corrected)}">Escuchar</button>
    ${extra}
  </div>`;
}

// --- Ruta ---
async function viewRoute() {
  const route = await api('GET', '/api/route');
  if (!state.stats) await refreshStats();
  const nodes = (u) => {
    const lessons = u.lessons.map((l) => {
      const isNext = route.next === l.id;
      return `<a class="node ${l.done ? 'done' : ''} ${isNext ? 'next' : ''}" href="#/leccion/${l.id}">
        <span class="node-dot">${l.done ? icons.check : icons.book}</span>
        ${isNext ? '<span class="tag-next">Siguiente</span>' : ''}
        <span class="node-label">${esc(l.title)}${l.done ? '<span class="sr"> completada</span>' : ''}</span>
        ${l.reinforce ? '<span class="chip chip-amber">Para reforzar</span>' : ''}
      </a>`;
    }).join('');
    const c = u.challenge;
    const isNext = route.next === `sim:${c.scenarioId}`;
    return `${lessons}<a class="node challenge ${c.done ? 'done' : ''} ${isNext ? 'next' : ''}" href="#/preparar/${c.scenarioId}">
      <span class="node-dot">${c.done ? icons.check : icons.trophy}</span>
      ${isNext ? '<span class="tag-next">Siguiente</span>' : ''}
      <span class="node-label">Reto: ${esc(c.title)}</span>
      ${outcomeChip(c.outcome)}
    </a>`;
  };
  shell(`<div class="stack-lg">
    <div><h1>Ruta</h1><p class="small muted">Ocho unidades, con seis microlecciones y un reto cada una. Sugerimos un orden; nada está bloqueado.</p></div>
    <a class="btn btn-block" href="#/repaso">${icons.words}Repaso libre</a>
    ${route.units.map((u) => `<section aria-label="Unidad ${u.id}">
      <div class="unit-head"><h3>Unidad ${u.id}: ${esc(u.title)}</h3><p>${esc(u.goal)}</p></div>
      <div class="path">${nodes(u)}</div>
    </section>`).join('')}
  </div>`, { tab: '#/ruta' });
  document.querySelector('.node.next')?.scrollIntoView({ block: 'center' });
}

async function viewLesson(id) {
  const data = await api('GET', `/api/lesson/${id}`);
  const main = shell('', { focus: true });
  const { lesson, exercises, answered } = data;
  const start = () => {
    const given = Object.fromEntries(answered.map((i) => [i, { status: 'correct' }]));
    teardown = mountExercises(main, {
      title: lesson.title,
      exercises,
      answered: given,
      canTranscribe: state.voice?.capabilities?.transcription?.available,
      onClose: () => { location.hash = '#/ruta'; },
      submit: (index, answer, _ex, retry) => api('POST', `/api/lesson/${id}/answer`, { index, answer, retry }),
      onDone: async () => {
        try {
          const r = await api('POST', `/api/lesson/${id}/complete`);
          if (r.stats) state.stats = r.stats;
          const lines = [r.xp ? `+${r.xp} XP` : 'Repetirla no suma XP, pero sí te hace mejor.'];
          lines.push(`Resolviste ${r.correct} de ${r.total}. Puedes repetirla cuando quieras para reforzarla.`);
          celebrate({ title: 'Lección completada', lines, mood: 'cheer' });
        } catch (err) { toast(err.message); }
        location.hash = '#/ruta';
      },
    });
  };
  main.innerHTML = `<div class="ex-top"><a class="iconbtn" href="#/ruta" aria-label="Volver">${icons.back}</a><span class="small muted">Unidad ${lesson.unit} · ${esc(DIFFICULTY[lesson.difficulty] ?? '')}</span></div>
    <div class="stack-lg">
      <div><h1>${esc(lesson.title)}</h1>${lesson.goal ? `<p class="muted">${esc(lesson.goal)}</p>` : ''}</div>
      <div class="card card-quiet stack"><h3>${esc(lesson.grammar.title)}</h3><p>${esc(lesson.grammar.text)}</p></div>
      <div class="stack">
        ${lesson.vocab.map((v) => `<a class="vocab-chip" href="#/palabra/${v.id}"><span><span class="en">${esc(v.en)}</span><br><span class="small muted">${esc(v.es)}</span></span></a>`).join('')}
      </div>
      <button class="btn btn-primary btn-block" id="go">Practicar: ${plural(exercises.length, 'ejercicio', 'ejercicios')}</button>
    </div>`;
  main.querySelector('#go').addEventListener('click', start);
}

// --- Hablar ---
async function viewTalk() {
  const data = await api('GET', '/api/scenarios');
  state.voice = data.voice;
  if (!state.stats) await refreshStats();
  const v = data.voice;
  const item = (s) => `<a class="step" style="text-decoration:none" href="#/preparar/${s.id}">
      <span class="step-icon">${s.done ? icons.check : icons.plate}</span>
      <span class="grow"><b class="en">${esc(s.title)}</b><br><span class="small muted">${esc(s.titleEs)} · Unidad ${s.unit} · ${esc(DIFFICULTY[s.difficulty] ?? '')}${s.featured ? ' · Para empezar' : ''}</span><br>${outcomeChip(s.outcome)}</span>
    </a>`;
  const base = data.scenarios.filter((s) => !s.variantOf).sort((a, b) => Number(b.featured) - Number(a.featured) || a.unit - b.unit);
  const variants = data.scenarios.filter((s) => s.variantOf);
  shell(`<div class="stack-lg">
    <div class="hello">${capybara({ mood: 'cheer', size: 72, equipped: state.me?.equipped })}<div><h1>Hablar</h1><p class="small muted">Atiende una mesa. Sin público: solo tú y un cliente.</p></div></div>
    ${v.aiAvailable ? modeBanner('ai', v) : ''}
    <a class="btn btn-help btn-block" href="#/voz">Probar mi micrófono y las voces</a>
    <section class="stack"><h2>Situaciones</h2>${base.map(item).join('')}</section>
    <section class="stack"><h2>Variantes más exigentes</h2><p class="small muted">Otros pedidos e imprevistos para las mismas unidades.</p>${variants.map(item).join('')}</section>
  </div>`, { tab: '#/hablar' });
}

async function viewVoiceLab() {
  const voice = await api('GET', '/api/voice/status');
  const main = shell('', { tab: '#/hablar' });
  teardown = mountVoiceLab(main, { voice });
}

async function viewPrepare(scenarioId, daily) {
  const data = await api('GET', '/api/scenarios');
  state.voice = data.voice;
  const s = data.scenarios.find((x) => x.id === scenarioId);
  if (!s) throw new ApiError(404, 'not_found', 'Ese escenario no existe.');
  const v = data.voice;
  const caps = v.capabilities;
  const capRow = (label, c) => `<li>${esc(label)}: <b>${c.available ? 'conectada' : 'sin conectar'}</b></li>`;
  const main = shell(`<div class="ex-top"><a class="iconbtn" href="${daily ? '#/sesion' : '#/hablar'}" aria-label="Volver">${icons.back}</a><span class="small muted">${daily ? 'Práctica de hoy' : 'Hablar'}</span></div>
    <form class="stack-lg" id="setup">
      <div><h1 class="en">${esc(s.title)}</h1><p class="muted">${esc(s.titleEs)} · ${esc(DIFFICULTY[s.difficulty] ?? '')}</p>${outcomeChip(s.outcome)}</div>
      <p>${esc(s.objective)}</p>
      ${v.aiAvailable ? `<fieldset class="stack" style="border:0;padding:0;margin:0">
        <legend class="small" style="font-weight:800;margin-bottom:8px">Tipo de conversación</legend>
        <label class="option row" data-radio><input type="radio" name="mode" value="demo"><span><b>Práctica guiada</b><br><span class="small muted">Guion y respuestas de ejemplo.</span></span></label>
        <label class="option row selected" data-radio><input type="radio" name="mode" value="ai" checked><span><b>Conversación libre</b><br><span class="small muted">Un cliente que responde a lo que digas.</span></span></label>
      </fieldset>` : ''}
      <fieldset class="stack" style="border:0;padding:0;margin:0">
        <legend class="small" style="font-weight:800;margin-bottom:8px">Corrección</legend>
        <label class="option row ${state.me?.helpMode !== 'work' ? 'selected' : ''}" data-radio><input type="radio" name="help" value="help" ${state.me?.helpMode !== 'work' ? 'checked' : ''}><span><b>Con ayuda</b><br><span class="small muted">Pistas cuando las pidas.</span></span></label>
        <label class="option row ${state.me?.helpMode === 'work' ? 'selected' : ''}" data-radio><input type="radio" name="help" value="work" ${state.me?.helpMode === 'work' ? 'checked' : ''}><span><b>Como en el trabajo</b><br><span class="small muted">El cliente sigue y la corrección llega al final.</span></span></label>
      </fieldset>
      <p class="small muted">El micrófono se pide cuando toques el botón de hablar.</p>
      <div id="err" class="notice notice-amber" hidden role="alert"></div>
      <button class="btn btn-primary btn-block">Empezar</button>
    </form>`, { focus: true });
  main.querySelectorAll('[data-radio] input').forEach((input) => input.addEventListener('change', () => {
    main.querySelectorAll(`input[name="${input.name}"]`).forEach((o) => o.closest('label').classList.toggle('selected', o.checked));
  }));
  main.querySelector('#setup').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const btn = e.target.querySelector('button.btn-primary');
    btn.disabled = true;
    try {
      const { sim } = await api('POST', '/api/sim', { scenarioId, mode: f.get('mode') ?? 'demo', helpMode: f.get('help'), daily: Boolean(daily) });
      location.hash = `#/sim/${sim.id}${daily ? '/diario' : ''}`;
    } catch (err) {
      const box = main.querySelector('#err');
      box.textContent = err.message;
      box.hidden = false;
      btn.disabled = false;
    }
  });
}

async function viewSim(simId, daily) {
  if (!state.voice) state.voice = await api('GET', '/api/voice/status');
  const main = shell(loading(), { focus: true });
  const exit = daily ? '#/sesion' : '#/hablar';
  teardown = mountSim(main, {
    simId,
    voice: state.voice,
    onFinished: (out) => {
      if (out.stats) state.stats = out.stats;
      viewSummary(out, { daily, exit });
    },
    onExit: ({ restart, sim }) => {
      if (restart) location.hash = `#/preparar/${sim.scenarioId}${daily ? '/diario' : ''}`;
    },
  });
}

function viewSummary({ sim, rewards, quotesSaved }, { daily, exit }) {
  if (teardown) { teardown(); teardown = null; }
  const s = sim.summary;
  const main = shell('', { focus: true });
  if (!s) {
    main.innerHTML = `<div class="stack"><p>El resumen de esta simulación se borró. Su resultado sigue contando: ${esc(OUTCOMES[sim.outcome]?.label ?? 'registrado')}.</p><a class="btn btn-primary btn-block" href="${exit}">Volver</a></div>`;
    return;
  }
  const outcome = sim.outcome ?? s.outcome;
  const basis = s.evaluator === 'unavailable'
    ? 'El evaluador no respondió, así que hoy no hay corrección. No la inventamos. Tu práctica sí queda registrada.'
    : s.evaluator === 'rules'
      ? 'Revisión automática de la práctica guiada.'
      : s.evaluationBasis === 'transcript'
        ? 'Evaluación con IA sobre la transcripción de tu voz: vocabulario, intención y gramática.'
        : 'Evaluación con IA sobre tu texto: vocabulario, intención y gramática.';
  const earned = rewards?.achievements ?? [];
  const showQuoteNotice = quotesSaved === false && s.improvements.some((i) => i.yours);
  const retryBox = (i) => `<form class="stack" data-retry-form="${i}">
      <label class="field">Tu nuevo intento<input class="input" data-retry-text autocomplete="off" spellcheck="false" placeholder="Escríbelo en inglés"></label>
      <button class="btn btn-help btn-block">Volver a intentarlo</button>
      <div data-retry-result></div>
    </form>`;
  main.innerHTML = `<div class="stack-lg">
    <div class="hello">${capybara({ mood: outcome === 'resolved' ? 'celebrate' : 'cheer', size: 72, equipped: state.me?.equipped })}<div><h1>Tu resumen</h1><p class="small muted">${esc(sim.title)}</p></div></div>
    <section class="card stack">
      <div class="spread"><b>Resultado</b>${outcomeChip(outcome)}</div>
      <p class="small">${esc(OUTCOMES[outcome]?.text ?? '')} Tu práctica quedó guardada.</p>
      ${s.endedEarly ? '<p class="small muted">Terminaste antes de recorrer toda la escena.</p>' : ''}
    </section>
    ${rewards?.xp || earned.length ? `<div class="row-wrap">${rewards?.xp ? `<span class="chip chip-green">+${rewards.xp} XP</span>` : ''}${rewards?.coins ? `<span class="chip chip-green">+${rewards.coins} monedas</span>` : ''}${earned.map((a) => `<span class="chip chip-ink">${icons.trophy}${achievementName(a)}</span>`).join('')}</div>` : ''}
    <section class="stack"><h2>Lo que lograste</h2><p>${esc(s.didWell)}</p></section>
    ${s.criticalMet === false ? '<div class="notice notice-amber"><b>Punto clave de servicio:</b> en esta situación hay que evitar promesas o garantías sin autorización. Revísalo abajo y repítelo.</div>' : ''}
    ${s.improvements.length ? `<section class="stack"><h2>Para mejorar</h2>
      ${s.improvements.map((it, i) => improvementCard(it, retryBox(i))).join('')}</section>` : ''}
    ${s.reinforce?.length ? `<section class="stack"><h3>Para reforzar</h3><ul class="small">${s.reinforce.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></section>` : ''}
    ${s.reviewVocab?.length ? `<section class="stack"><h3>Entra a tu repaso</h3><div class="row-wrap">${s.reviewVocab.map((v) => `<a class="chip chip-blue" href="#/palabra/${v.id}" style="text-decoration:none">${esc(v.en)}</a>`).join('')}</div></section>` : ''}
    <div class="notice small">${esc(basis)}</div>
    ${showQuoteNotice ? '<p class="small muted">Tus frases citadas se muestran solo ahora. No se guardan, porque no activaste guardar el texto de tus conversaciones.</p>' : ''}
    <section class="stack"><h3>¿Qué tan cómodo te sentiste hablando?</h3>
      <div class="scale">${[1, 2, 3, 4, 5].map((n) => `<button class="btn ${sim.comfort === n ? 'btn-primary' : ''}" data-comfort="${n}" aria-label="${n} de 5">${n}</button>`).join('')}</div>
      <p class="small muted">Opcional. Es tu percepción, no una medición. 1 es incómodo, 5 es muy cómodo.</p></section>
    <div class="card card-quiet stack"><b>Reto opcional para tu próximo turno</b><p class="small">Usa una expresión nueva o pide una aclaración en inglés. No afecta tu racha.</p><a class="small" href="#/perfil">Registrar cómo te fue</a></div>
    <a class="btn btn-primary btn-block" href="${exit}">${daily ? 'Seguir con mi sesión' : 'Listo'}</a>
    <a class="btn btn-block" href="#/preparar/${sim.scenarioId}${daily ? '/diario' : ''}">Repetir situación</a>
  </div>`;
  bindEntry(main);
  main.querySelectorAll('[data-retry-form]').forEach((form) => form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = form.querySelector('[data-retry-text]').value.trim();
    const box = form.querySelector('[data-retry-result]');
    if (!text) { toast('Escribe tu nuevo intento.'); return; }
    try {
      const r = await api('POST', `/api/sim/${sim.id}/retry`, { index: Number(form.dataset.retryForm), text });
      box.innerHTML = `<div class="feedback feedback-${r.status === 'correct' ? 'correct' : r.status === 'needs_review' ? 'needs-review' : 'review'}" role="status"><p class="small">${esc(r.message)}</p></div>`;
      if (r.earned) celebrate({ title: 'Logro nuevo', lines: [achievementName('retried_phrase')] });
      form.querySelector('[data-retry-text]').value = '';
    } catch (err) { toast(err.message); }
  }));
  main.querySelectorAll('[data-comfort]').forEach((b) => b.addEventListener('click', async () => {
    await api('POST', `/api/sim/${sim.id}/comfort`, { value: Number(b.dataset.comfort) });
    main.querySelectorAll('[data-comfort]').forEach((o) => o.classList.toggle('btn-primary', o === b));
    toast('Gracias. Queda como tu percepción de hoy.');
  }));
  if (rewards?.newDay) celebrate({ title: 'Tu práctica de hoy ya cuenta', lines: rewardLines(rewards), mood: 'cheer' });
  else if (earned.length) celebrate({ title: 'Logro nuevo', lines: earned.map(achievementName) });
}

const ACH_NAMES = { first_conversation: 'Primera conversación', confirmed_order: 'Confirmé una orden', solved_complaint: 'Resolví una queja', retried_phrase: 'Volví a intentar una frase difícil' };
const achievementName = (k) => ACH_NAMES[k] ?? k;

// --- Palabras ---
const wordsFilters = { q: '', category: '', difficulty: '' };
const filtersActive = () => Boolean(wordsFilters.q || wordsFilters.category || wordsFilters.difficulty);

function wordRow(e) {
  return `<a class="vocab-chip" href="#/palabra/${e.id}">
    <span class="grow"><span class="en">${esc(e.en)}</span><br><span class="small muted">${esc(e.es)}</span></span>
    <span class="stack" style="gap:2px;align-items:flex-end">
      ${e.favorite ? `<span class="fav-mark" title="Favorita">${icons.starFill}</span>` : ''}
      ${e.used ? `<span class="chip chip-green">${icons.check}La usé</span>` : e.recognized ? '<span class="chip">La reconozco</span>' : ''}
      ${e.pending && !e.due ? '<span class="chip">Por consolidar</span>' : ''}
      ${e.due ? `<span class="chip chip-amber">${icons.review}Repasar</span>` : ''}
    </span>
  </a>`;
}

async function viewWords(view = 'hoy') {
  if (!state.stats) await refreshStats();
  const VIEWS = { hoy: 'Hoy', todas: 'Todas', repaso: 'Por repasar', consolidar: 'Por consolidar', favoritas: 'Favoritas', mias: 'Mis frases' };
  const params = () => {
    const p = new URLSearchParams({ view, limit: '30' });
    if (wordsFilters.q) p.set('q', wordsFilters.q);
    if (wordsFilters.category) p.set('category', wordsFilters.category);
    if (wordsFilters.difficulty) p.set('difficulty', wordsFilters.difficulty);
    return p;
  };
  const first = await api('GET', `/api/vocab?${params()}`);
  const filters = `<div class="stack">
      <input class="input" id="search" type="search" placeholder="Buscar en inglés o español" aria-label="Buscar" value="${esc(wordsFilters.q)}">
      <select class="input" id="cat" aria-label="Categoría"><option value="">Todas las categorías</option>${first.categories.map((c) => `<option ${c === wordsFilters.category ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
      <select class="input" id="diff" aria-label="Dificultad"><option value="">Cualquier dificultad</option>${Object.entries(DIFFICULTY).map(([k, v]) => `<option value="${k}" ${String(k) === wordsFilters.difficulty ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <button class="btn btn-sm" id="clear" ${filtersActive() ? '' : 'hidden'}>Limpiar filtros</button>
    </div>`;
  const EMPTY = {
    repaso: 'No tienes repasos pendientes hoy.',
    consolidar: 'Las expresiones que practiques y falte afianzar aparecerán aquí.',
    favoritas: 'Marca con la estrella las expresiones que quieras tener a mano.',
    hoy: 'Hoy no hay expresiones nuevas.',
    todas: 'No hay ninguna expresión así en el catálogo.',
  };
  const body = view === 'mias'
    ? `<div class="notice small">Son tus frases: no están revisadas ni se usan en los ejercicios.</div>
      <form class="card stack" id="add-phrase">
        <label class="field">Frase en inglés<input class="input" name="en" required maxlength="200" autocomplete="off"></label>
        <label class="field">Significado<input class="input" name="es" maxlength="200" autocomplete="off"></label>
        <p class="small muted">Sin datos de clientes reales, por favor.</p>
        <button class="btn btn-primary btn-block">Guardar frase</button>
      </form>
      <div class="stack">${first.phrases.map((p) => `<div class="vocab-chip"><span class="grow"><span class="chip">Mi frase</span><br><span class="en">${esc(p.en)}</span><br><span class="small muted">${esc(p.es)}</span></span>
        ${deviceVoiceAvailable() ? `<button class="iconbtn" data-say="${esc(p.en)}" aria-label="Escuchar">${icons.sound}</button>` : ''}
        <button class="iconbtn" data-del="${p.id}" aria-label="Borrar">${icons.close}</button></div>`).join('') || '<p class="muted center">Todavía no guardas frases.</p>'}</div>`
    : `${filters}
       <p class="small muted" id="count" role="status"></p>
       <div class="stack" id="list"></div>
       <button class="btn btn-block" id="more" hidden>Ver más</button>`;
  const main = shell(`<div class="stack">
    <div class="spread"><div><h1>Palabras</h1><p class="small muted">${first.catalogSize} expresiones para el servicio</p></div><a class="btn btn-sm btn-help" href="#/repaso">Repasar</a></div>
    <div class="tabs" role="tablist">${Object.entries(VIEWS).map(([k, label]) => `<a role="tab" aria-selected="${k === view}" class="chip ${k === view ? 'active' : ''}" style="text-decoration:none" href="#/palabras/${k}">${label}${k === 'repaso' && first.dueCount ? ` (${first.dueCount})` : ''}${k === 'consolidar' && first.pendingCount ? ` (${first.pendingCount})` : ''}</a>`).join('')}</div>
    ${body}
    <details class="card card-quiet"><summary>Qué significa cada indicador</summary>
      <p class="small"><b>La reconozco:</b> la identificaste en un ejercicio de opciones.</p>
      <p class="small"><b>La usé:</b> la escribiste o dijiste tú, sin opciones, y las reglas la confirmaron. Abrirla, escucharla o guardarla no cuenta.</p>
      <p class="small"><b>Por consolidar:</b> ya apareció, pero falta usarla bien, necesita más repasos o la última práctica falló.</p>
      <p class="small"><b>Repasar:</b> hoy le toca su repaso. Ninguno de estos indicadores certifica dominio.</p>
    </details>
  </div>`, { tab: '#/palabras' });
  bindEntry(main);
  main.querySelector('#add-phrase')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api('POST', '/api/phrases', Object.fromEntries(new FormData(e.target)));
      render();
    } catch (err) { toast(err.message); }
  });
  main.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
    await api('DELETE', `/api/phrases/${b.dataset.del}`);
    render();
  }));
  if (view === 'mias') return;

  const list = main.querySelector('#list');
  const more = main.querySelector('#more');
  const count = main.querySelector('#count');
  const clear = main.querySelector('#clear');
  let offset = 0;
  const paint = (data, append) => {
    if (!append) list.innerHTML = '';
    list.insertAdjacentHTML('beforeend', data.entries.map(wordRow).join(''));
    offset = data.offset + data.entries.length;
    count.textContent = view === 'todas'
      ? `${data.total} de ${data.catalogSize} expresiones`
      : plural(data.total, 'expresión', 'expresiones');
    if (!data.total) {
      list.innerHTML = `<p class="muted center">${filtersActive() ? 'No encontramos nada con esos filtros. Prueba con otra palabra o límpialos.' : esc(EMPTY[view] ?? '')}</p>`;
    }
    more.hidden = offset >= data.total;
    clear.hidden = !filtersActive();
  };
  paint(first, false);
  more.addEventListener('click', async () => {
    const p = params();
    p.set('offset', String(offset));
    try { paint(await api('GET', `/api/vocab?${p}`), true); } catch (err) { toast(err.message); }
  });
  let reloadToken = 0;
  const reload = async () => {
    const mine = ++reloadToken;
    try {
      const data = await api('GET', `/api/vocab?${params()}`);
      if (mine === reloadToken) paint(data, false);
    } catch (err) { toast(err.message); }
  };
  let timer = null;
  main.querySelector('#search').addEventListener('input', (e) => {
    wordsFilters.q = e.target.value.trim();
    clearTimeout(timer);
    timer = setTimeout(reload, 250);
  });
  main.querySelector('#cat').addEventListener('change', (e) => { wordsFilters.category = e.target.value; reload(); });
  main.querySelector('#diff').addEventListener('change', (e) => { wordsFilters.difficulty = e.target.value; reload(); });
  clear.addEventListener('click', () => {
    Object.assign(wordsFilters, { q: '', category: '', difficulty: '' });
    main.querySelector('#search').value = '';
    main.querySelector('#cat').value = '';
    main.querySelector('#diff').value = '';
    reload();
  });
}

async function viewWord(id) {
  let v;
  try {
    ({ entry: v } = await api('GET', `/api/vocab/${id}`));
  } catch (err) {
    if (err.status !== 404) throw err;
    shell(`<div class="stack center" style="padding-top:32px;align-items:center">
      ${capybara({ mood: 'focus', size: 96 })}
      <p>No encontramos esa expresión. Puede que el enlace sea antiguo.</p>
      <a class="btn btn-primary" href="#/palabras/todas">Ir a Palabras</a>
    </div>`, { focus: true });
    return;
  }
  const statusRow = (label, on) => `<div class="spread"><span>${label}</span><b>${on ? 'Sí' : 'Todavía no'}</b></div>`;
  const main = shell(`<div class="spread" style="margin-bottom:12px">
      <button class="iconbtn" id="back" aria-label="Volver">${icons.back}</button>
      <button class="iconbtn" id="fav" aria-pressed="${v.favorite}" aria-label="${v.favorite ? 'Quitar de favoritas' : 'Guardar en favoritas'}" style="color:${v.favorite ? '#b58900' : 'inherit'}">${v.favorite ? icons.starFill : icons.star}</button>
    </div>
    ${entryCard(v)}
    <a class="btn btn-primary btn-block" href="#/practicar/${v.id}" style="margin-top:16px">Practicar esta expresión</a>
    <div class="card stack" style="margin-top:16px">
      ${statusRow('La reconozco', v.recognized)}
      ${statusRow('La usé correctamente al responder', v.used)}
      ${v.pending ? `<p class="small"><b>Por consolidar:</b> ${esc(v.pendingReason)}</p>` : ''}
      <div class="spread"><span>Próximo repaso</span><b>${v.dueDate ? esc(v.dueDate) : 'Sin programar'}</b></div>
    </div>`, { focus: true });
  bindEntry(main);
  main.querySelector('#back').addEventListener('click', () => { location.hash = '#/palabras'; });
  main.querySelector('#fav').addEventListener('click', async (e) => {
    const next = e.currentTarget.getAttribute('aria-pressed') !== 'true';
    await api('POST', `/api/vocab/${id}/favorite`, { favorite: next });
    render();
  });
}

async function viewFreeReview(vocabId) {
  const { exercises } = await api('GET', vocabId ? `/api/practice?vocab=${encodeURIComponent(vocabId)}` : '/api/practice');
  const main = shell('', { focus: true });
  const exit = vocabId ? `#/palabra/${vocabId}` : '#/palabras/repaso';
  teardown = mountExercises(main, {
    title: vocabId ? 'Practicar esta expresión' : 'Repaso libre',
    exercises,
    canTranscribe: state.voice?.capabilities?.transcription?.available,
    onClose: () => { location.hash = exit; },
    submit: async (_index, answer, ex, retry) => api('POST', '/api/practice/answer', { exercise: { type: ex.type, vocabId: ex.vocabId }, answer, retry }),
    onDone: () => {
      toast('Práctica guardada en tu calendario de repaso.');
      location.hash = exit;
    },
  });
}

// --- Perfil ---
function calendarHtml(p) {
  const marks = new Map(p.calendar.map((d) => [d.date, d.status]));
  const today = p.stats.today;
  const [y, m, d] = today.split('-').map(Number);
  const base = Date.UTC(y, m - 1, d);
  const dow = (new Date(base).getUTCDay() + 6) % 7;
  const cells = [];
  // Cuatro semanas completas mas la actual: la primera celda siempre es lunes.
  const total = 28 + dow + 1;
  for (let i = total - 1; i >= 0; i--) {
    const date = new Date(base - i * 86400000).toISOString().slice(0, 10);
    const status = marks.get(date);
    const label = status === 'practiced' ? 'practicado' : status === 'shielded' ? 'cubierto con protector' : 'sin práctica';
    cells.push(`<div class="cal-day ${status ?? ''} ${date === today ? 'today' : ''}" title="${date}: ${label}" aria-label="${date}: ${label}">
      ${status === 'practiced' ? icons.check : status === 'shielded' ? icons.shield : ''}<span>${Number(date.slice(8))}</span></div>`);
  }
  return `<div class="cal" role="img" aria-label="Calendario de práctica">
    ${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((h) => `<div class="cal-head">${h}</div>`).join('')}
    ${cells.join('')}
  </div>
  `;
}

async function viewProfile() {
  const p = await api('GET', '/api/profile');
  state.me = p.user;
  state.stats = p.stats;
  setSound(p.user.soundOn);
  const eq = p.user.equipped;
  const shopRow = (i) => {
    if (i.kind === 'shield') {
      const full = p.stats.shields >= p.maxShields;
      return `<div class="vocab-chip"><span class="grow"><b>${esc(i.name)}</b><br><span class="small muted">Tienes ${p.stats.shields}</span></span>
        <button class="btn btn-sm" data-buy="${i.id}" ${full || p.stats.coins < i.price ? 'disabled' : ''}>${statIcons.coin}${i.price}</button></div>`;
    }
    const equipped = eq[i.kind] === i.id;
    const action = i.owned
      ? `<button class="btn btn-sm ${equipped ? 'btn-green' : ''}" data-equip="${i.id}" data-slot="${i.kind}" data-on="${equipped}">${equipped ? 'Puesto' : 'Usar'}</button>`
      : `<button class="btn btn-sm" data-buy="${i.id}" ${p.stats.coins < i.price ? 'disabled' : ''}>${statIcons.coin}${i.price}</button>`;
    return `<div class="vocab-chip"><b class="grow">${esc(i.name)}</b>${action}</div>`;
  };
  const timezones = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Bogota', 'America/Mexico_City', 'America/Caracas', 'America/Havana', 'Europe/Madrid'];
  if (!timezones.includes(p.user.timezone)) timezones.unshift(p.user.timezone);
  const main = shell(`<div class="page">
    <header class="hero hero-profile">
      <div class="grow"><h1 class="display">${esc(p.user.displayName)}</h1><p class="small">@${esc(p.user.username)}</p></div>
      ${capybara({ mood: 'welcome', size: 92, equipped: eq })}
    </header>
    <div class="tiles">
      <div class="tile tile-streak"><b>${p.stats.current}</b><span>Racha</span></div>
      <div class="tile tile-xp"><b>${p.stats.xp}</b><span>XP</span></div>
      <div class="tile tile-coins"><b>${p.stats.coins}</b><span>Monedas</span></div>
    </div>
    <section class="card stack" aria-label="Calendario">${calendarHtml(p)}</section>

    <h2>Logros</h2>
    <div class="stack">${p.achievements.map((a) => `<div class="ach ${a.earnedAt ? 'earned' : ''}"><div class="ach-badge">${icons.trophy}</div><b>${esc(a.name)}</b></div>`).join('')}</div>

    <h2>Tienda</h2>
    <div class="stack">${p.shop.map(shopRow).join('')}</div>

    <details class="card"><summary>Ajustes</summary>
      <div class="stack">
        <label class="field">Zona horaria<select class="input" id="tz">${timezones.map((t) => `<option ${t === p.user.timezone ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
        <label class="switch"><span>Sonido</span><input type="checkbox" id="sound" ${p.user.soundOn ? 'checked' : ''}></label>
        <label class="switch"><span>Guardar el texto de mis conversaciones</span><input type="checkbox" id="keep" ${p.user.keepTranscripts ? 'checked' : ''}></label>
        <p class="small muted">Las grabaciones nunca se guardan.</p>
        ${p.storedQuotes ? '<button class="btn btn-block" id="unquote">Quitar las citas guardadas</button>' : ''}
        <button class="btn btn-block" id="wipe">Borrar mi historial</button>
      </div>
    </details>
    <details class="card"><summary>Más práctica</summary>
      <div class="stack">
        <a class="btn btn-block" href="#/palabras">Diccionario</a>
        <a class="btn btn-block" href="#/ruta">Lecciones</a>
        <a class="btn btn-block" href="#/hablar">Mesas clásicas</a>
        <a class="btn btn-block" href="#/voz">Probar micrófono</a>
        <a class="btn btn-block" href="#/diagnostico">Diagnóstico</a>
      </div>
    </details>
    ${p.user.role === 'admin' ? '<a class="btn btn-block" href="#/admin">Administración</a>' : ''}
    <button class="btn btn-block" data-report>Reportar un problema</button>
    <button class="btn btn-block" id="logout">Cerrar sesión</button>
  </div>`, { tab: '#/perfil' });

  const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
  main.querySelectorAll('[data-buy]').forEach((b) => b.addEventListener('click', async () => {
    try {
      const out = await api('POST', '/api/shop/buy', { itemId: b.dataset.buy, requestId: newId() });
      state.stats = out.stats;
      toast('¡Compra hecha!');
      render();
    } catch (err) { toast(err.message); }
  }));
  main.querySelectorAll('[data-equip]').forEach((b) => b.addEventListener('click', async () => {
    const on = b.dataset.on === 'true';
    await api('POST', '/api/avatar/equip', on ? { slot: b.dataset.slot } : { itemId: b.dataset.equip });
    render();
  }));
  const setting = (id, fn) => main.querySelector(id).addEventListener('change', async (e) => {
    try { await api('POST', '/api/settings', fn(e.target)); toast('Guardado.'); } catch (err) { toast(err.message); }
  });
  setting('#tz', (t) => ({ timezone: t.value }));
  setting('#sound', (t) => { setSound(t.checked); return { soundOn: t.checked }; });
  setting('#keep', (t) => ({ keepTranscripts: t.checked }));
  main.querySelector('#unquote')?.addEventListener('click', async () => {
    if (!confirm('Se quitarán tus frases citadas de los resúmenes. ¿Continuar?')) return;
    await api('POST', '/api/privacy/remove-quotes');
    render();
  });
  main.querySelector('#wipe').addEventListener('click', async (e) => {
    if (!confirm('Se borrarán tus conversaciones y resúmenes. Tu racha y progreso no cambian. ¿Continuar?')) return;
    await api('POST', '/api/privacy/delete-history');
    e.target.textContent = 'Historial borrado';
    e.target.disabled = true;
  });
  main.querySelector('#logout').addEventListener('click', async () => {
    await api('POST', '/api/auth/logout');
    Object.assign(state, { me: null, stats: null, voice: null });
    location.hash = '#/entrar';
  });
}

// --- Administracion ---
async function viewAdmin() {
  const o = await api('GET', '/api/admin/overview');
  const main = shell(`<div class="ex-top"><a class="iconbtn" href="#/perfil" aria-label="Volver">${icons.back}</a><h2 class="grow">Administración</h2></div>
    <div class="stack-lg">
      <section class="card stack"><h3>Alumnos: ${o.seats.used} de ${o.seats.max} plazas</h3>
        ${o.students.map((s) => `<div class="spread"><span>${esc(s.displayName)} <span class="small muted">@${esc(s.username)}</span></span>
          <button class="btn btn-sm" data-active="${s.id}" data-on="${s.active}">${s.active ? 'Desactivar' : 'Activar'}</button></div>`).join('') || '<p class="muted small">Sin alumnos todavía.</p>'}
        <p class="small muted">Aquí no se muestra el historial de voz ni las conversaciones de cada alumno.</p>
      </section>
      <section class="card stack"><h3>Invitar</h3>
        <form id="invite" class="stack"><label class="field">Para quién (opcional)<input class="input" name="label" maxlength="60" autocomplete="off"></label>
          <button class="btn btn-primary btn-block">Crear invitación</button></form>
        <div id="link" hidden class="notice notice-green small"></div>
        ${o.invitations.filter((i) => !i.usedAt && !i.revoked && i.role === 'student').map((i) => `<div class="spread small"><span>${esc(i.label ?? 'Sin nombre')} · vence ${new Date(i.expiresAt).toLocaleDateString()}</span><button class="btn btn-sm" data-revoke="${i.id}">Revocar</button></div>`).join('')}
      </section>
      <section class="card stack"><h3>Comentarios (${o.feedback.filter((f) => f.status === 'open').length} sin revisar)</h3>
        ${o.feedback.map((f) => `<div class="card card-quiet stack"><div class="spread small"><b>${esc(f.displayName)} · ${esc(f.section)}</b><span class="muted">${new Date(f.createdAt).toLocaleDateString()}</span></div>
          <p class="small"><b>Intentaba:</b> ${esc(f.trying)}</p><p class="small"><b>Pasó:</b> ${esc(f.problem)}</p>${f.comment ? `<p class="small">${esc(f.comment)}</p>` : ''}
          <button class="btn btn-sm" data-fb="${f.id}" data-next="${f.status === 'open' ? 'done' : 'open'}">${f.status === 'open' ? 'Marcar como revisado' : 'Reabrir'}</button></div>`).join('') || '<p class="small muted">Sin comentarios todavía.</p>'}
        <p class="small muted">Los comentarios son lo único que los alumnos te envían: no incluyen sus conversaciones.</p>
      </section>
      <section class="card stack"><h3>Estado de la voz</h3>
        ${Object.entries({ 'Cliente IA': o.voice.capabilities.customer, Transcripción: o.voice.capabilities.transcription, 'Voz del cliente': o.voice.capabilities.speech, Pronunciación: o.voice.capabilities.pronunciation }).map(([k, c]) => `<div class="spread small"><span>${esc(k)}</span><span class="chip ${c.available ? 'chip-green' : 'chip-amber'}">${c.available ? esc(c.provider) : 'Sin conectar'}</span></div>`).join('')}
        ${o.voice.missing.length ? `<ul class="small">${o.voice.missing.map((m) => `<li>${esc(m)}</li>`).join('')}</ul><p class="small muted">Pasos en README.md. Las claves van solo en el servidor. No se contrató ningún servicio.</p>` : ''}
      </section>
      <section class="card stack"><h3>Consumo de este mes</h3>
        ${o.usage.rows.map((r) => `<div class="stack" style="gap:4px"><div class="spread small"><span>${esc(r.label)}</span><b>${Math.round(r.used).toLocaleString()} de ${r.limit ? r.limit.toLocaleString() : 'sin límite'} ${esc(r.unit)}</b></div>
          ${r.limit ? `<div class="bar"><i style="width:${Math.min(100, r.percent)}%"></i></div>` : ''}${r.alert ? `<p class="small" style="color:var(--amber-text)">Alerta: ${r.percent}% del límite.</p>` : ''}</div>`).join('')}
        <p class="small muted">${o.usage.estimatedTotal != null ? `Costo estimado con tus tarifas configuradas: $${o.usage.estimatedTotal.toFixed(2)}.` : 'Costo: sin estimar. Configura tarifas verificadas del proveedor elegido para calcularlo; no se usan precios supuestos.'}</p>
      </section>
    </div>`, { focus: true });
  main.querySelector('#invite').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const { code } = await api('POST', '/api/admin/invite', { label: new FormData(e.target).get('label') });
      const link = main.querySelector('#link');
      const url = `${location.origin}/#/invite/${code}`;
      link.hidden = false;
      link.innerHTML = `<b>Enlace de un solo uso (vence en 7 días). Solo se muestra ahora:</b><br><span class="en">${esc(url)}</span><br><button class="btn btn-sm" id="copy" style="margin-top:8px">Copiar</button>`;
      link.querySelector('#copy').addEventListener('click', () => navigator.clipboard?.writeText(url).then(() => toast('Copiado.')));
    } catch (err) { toast(err.message); }
  });
  main.querySelectorAll('[data-fb]').forEach((b) => b.addEventListener('click', async () => {
    await api('POST', `/api/admin/feedback/${b.dataset.fb}/status`, { status: b.dataset.next });
    render();
  }));
  main.querySelectorAll('[data-revoke]').forEach((b) => b.addEventListener('click', async () => {
    await api('POST', `/api/admin/invite/${b.dataset.revoke}/revoke`);
    render();
  }));
  main.querySelectorAll('[data-active]').forEach((b) => b.addEventListener('click', async () => {
    await api('POST', `/api/admin/student/${b.dataset.active}/active`, { active: b.dataset.on !== 'true' });
    render();
  }));
}

// --- Enrutador ---
// Lo que necesitan las pantallas de la práctica, en un solo lugar.
const ctx = {
  state,
  shell,
  toast,
  setTeardown: (fn) => { teardown = fn; },
  reward(rewards, { title, fallback }) {
    const lines = rewardLines(rewards);
    celebrate({ title, lines: lines.length ? lines : [fallback] });
    showAchievements(rewards);
  },
  afterReward(rewards) {
    if (rewards?.newDay) celebrate({ title: '¡Hoy ya cuenta!', lines: rewardLines(rewards), mood: 'cheer' });
    showAchievements(rewards);
  },
};

function showAchievements(rewards) {
  if (rewards?.achievements?.length) celebrate({ title: '¡Logro nuevo!', lines: rewards.achievements.map(achievementName) });
}

const toHoy = () => { location.hash = '#/hoy'; };

const ROUTES = [
  [/^#\/entrar$/, viewLogin, { public: true }],
  [/^#\/invite(?:\/(.+))?$/, viewInvite, { public: true }],
  [/^#\/bienvenida$/, viewWelcome],
  [/^#\/diagnostico(?:\/(empezar))?$/, viewDiagnostic],
  [/^#\/hoy$/, viewToday],
  [/^#\/aprender$/, () => viewAprender(ctx)],
  [/^#\/aprender\/jugar(?:\/(\w+))?$/, (topic) => viewAprenderJugar(ctx, topic)],
  [/^#\/mesas$/, () => viewMesas(ctx)],
  [/^#\/mesas\/atender$/, () => viewMesaAtender(ctx)],
  [/^#\/mejorar$/, () => viewMejorar(ctx)],
  [/^#\/mejorar\/(pronunciar|escuchar)$/, (mode) => viewMejorarJugar(ctx, mode)],
  [/^#\/(sesion|breve)$/, toHoy],
  [/^#\/paso\/\w+$/, toHoy],
  [/^#\/ruta$/, viewRoute],
  [/^#\/leccion\/(\w+)$/, viewLesson],
  [/^#\/hablar$/, viewTalk],
  [/^#\/voz$/, viewVoiceLab],
  [/^#\/preparar\/(\w+)(\/diario)?$/, viewPrepare],
  [/^#\/sim\/(\d+)(\/diario)?$/, viewSim],
  [/^#\/palabras(?:\/(\w+))?$/, viewWords],
  [/^#\/palabra\/([\w-]+)$/, viewWord],
  [/^#\/repaso$/, () => viewFreeReview()],
  [/^#\/practicar\/(\w+)$/, viewFreeReview],
  [/^#\/perfil$/, viewProfile],
  [/^#\/admin$/, viewAdmin],
];

async function render() {
  if (teardown) { teardown(); teardown = null; }
  stopPlayback();
  const token = ++renderToken;
  const hash = location.hash || '#/hoy';
  const match = ROUTES.map(([re, view, opts]) => ({ m: hash.match(re), view, opts })).find((r) => r.m);
  if (!match) { location.hash = '#/hoy'; return; }
  try {
    if (!match.opts?.public && !state.me) {
      shell(loading(), { focus: true });
      await refreshStats();
      if (token !== renderToken) return;
    }
    await match.view(...match.m.slice(1));
  } catch (err) {
    if (err instanceof ApiError && err.code === 'not_authenticated') return;
    if (token !== renderToken) return;
    const main = shell(errorView(err), { focus: true });
    main.querySelector('#retry')?.addEventListener('click', render);
  }
}

window.addEventListener('hashchange', render);
window.addEventListener('pagehide', () => { if (teardown) teardown(); });
render();
