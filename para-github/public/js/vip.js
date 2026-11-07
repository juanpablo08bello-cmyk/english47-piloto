// Diccionario VIP: todas las palabras en tablas largas. Se busca, se despliega y se toca una palabra para oírla.
import { api, esc, icons } from './core.js';
import { capybara } from './capybara.js';
import { sayModel } from './voz.js';

const CROWN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8l4.500 4L12 5l4.500 7L21 8l-2 11H5z"/></svg>';
export const vipIcon = CROWN;

const hear = (word, pron = '') => `<button class="vip-say" data-say="${esc(word)}" aria-label="Escuchar ${esc(word)}">${esc(word)}</button>${pron ? `<small class="vip-pron" lang="es">/ ${esc(pron)} /</small>` : ''}`;

const verbRow = (r) => `<tr data-find="${esc(`${r.present} ${r.third} ${r.past} ${r.ing} ${r.es}`.toLowerCase())}">
    <th scope="row">${hear(r.present, r.presentPron)}</th>
    <td class="vip-es">${esc(r.es)}</td>
    <td>${hear(r.third)}</td>
    <td class="${r.irregular ? 'vip-irregular' : ''}">${r.past.split(' / ').map((form, i, all) => `${hear(form)}${i < all.length - 1 ? ' <span class="vip-or">/</span> ' : ''}`).join('')}<small class="vip-pron" lang="es">/ ${esc(r.pastPron)} /</small></td>
    <td>${hear(r.future, r.futurePron)}</td>
    <td>${hear(r.ing)}</td>
  </tr>`;

const verbTable = (t) => `<p class="vip-note">${esc(t.desc)}</p>
  <div class="vip-scroll vip-wide"><table class="vip-table">
    <thead><tr><th scope="col">Presente</th><th scope="col">Español</th><th scope="col">Él / ella</th><th scope="col">Pasado</th><th scope="col">Futuro</th><th scope="col">Ahora mismo (-ing)</th></tr></thead>
    <tbody>${t.rows.map(verbRow).join('')}</tbody>
  </table></div>
  <p class="vip-hint">Desliza la tabla a los lados para ver cada tiempo.</p>`;

const wordTable = (t) => `<p class="vip-note">${esc(t.desc)}</p>
  <div class="vip-scroll"><table class="vip-table">
    <thead><tr><th scope="col">Inglés</th><th scope="col">Cómo suena</th><th scope="col">Español</th></tr></thead>
    <tbody>${t.rows.map((r) => `<tr data-find="${esc(`${r.en} ${r.es}`.toLowerCase())}">
      <th scope="row">${hear(r.en)}</th>
      <td class="vip-pron-cell" lang="es">/ ${esc(r.pron)} /</td>
      <td class="vip-es">${esc(r.es)}</td>
    </tr>`).join('')}</tbody>
  </table></div>`;

export async function viewVip(ctx) {
  const { tables } = await api('GET', '/api/vip');
  const voice = ctx.state.voice ?? await api('GET', '/api/voice/status');
  ctx.state.voice = voice;
  const total = tables.reduce((n, t) => n + t.rows.length, 0);
  const main = ctx.shell(`<div class="page page-wide">
    <a class="vip-back" href="#/aprender">${icons.back}Aprender palabras</a>
    <header class="hero hero-vip">
      <div class="grow">
        <p class="vip-kicker">${CROWN}VIP</p>
        <h1 class="display display-long">Diccionario VIP</h1>
        <p class="hero-count"><b>${total}</b> palabras en ${tables.length} tablas</p>
      </div>
      ${capybara({ mood: 'focus', size: 96, equipped: ctx.state.me?.equipped })}
    </header>
    <label class="vip-search"><span class="sr">Buscar en el diccionario</span>
      <input class="input" id="find" type="search" placeholder="Busca en inglés o español" autocomplete="off" autocapitalize="off" spellcheck="false">
    </label>
    <p class="small muted center" id="found">Toca una tabla para abrirla. Toca una palabra para oírla.</p>
    <div class="fold-list vip-list">
      ${tables.map((t, i) => `<details class="fold vip-fold vip-c${(i % 6) + 1}" data-table="${t.id}" ${i === 0 ? 'open' : ''}>
        <summary>
          <span class="fold-title">${esc(t.title)}</span>
          <span class="fold-meta" data-count>${t.rows.length}</span>
          <span class="fold-chevron" aria-hidden="true"></span>
        </summary>
        <div class="fold-body">${t.kind === 'verbs' ? verbTable(t) : wordTable(t)}</div>
      </details>`).join('')}
    </div>
    <p class="small muted center">Lo que ves entre / / es cómo suena, con letras del español. Es solo una ayuda: lo importante es aprender la palabra en inglés.</p>
  </div>`, { tab: '#/aprender' });

  main.addEventListener('click', (e) => {
    const b = e.target.closest('[data-say]');
    if (b) sayModel(b.dataset.say, voice).catch(() => {});
  });

  const folds = [...main.querySelectorAll('[data-table]')];
  const initial = folds.map((f) => f.open);
  const note = main.querySelector('#found');
  const normal = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const rows = folds.map((f) => [...f.querySelectorAll('tbody tr')].map((tr) => ({ tr, text: normal(tr.dataset.find) })));
  main.querySelector('#find').addEventListener('input', (e) => {
    const q = normal(e.target.value);
    let hits = 0;
    folds.forEach((fold, i) => {
      let shown = 0;
      rows[i].forEach(({ tr, text }) => {
        const match = !q || text.includes(q);
        tr.hidden = !match;
        if (match) shown += 1;
      });
      fold.hidden = Boolean(q) && !shown;
      fold.querySelector('[data-count]').textContent = String(shown);
      fold.open = q ? shown > 0 : initial[i];
      if (q) hits += shown;
    });
    note.textContent = !q ? 'Toca una tabla para abrirla. Toca una palabra para oírla.' : hits ? `${hits} ${hits === 1 ? 'resultado' : 'resultados'}` : 'No está en el diccionario. Prueba con otra palabra.';
  });
}
