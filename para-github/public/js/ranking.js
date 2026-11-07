// Ranking: quién lleva más racha y quién ha ganado más propinas. Los tres primeros suben al podio.
import { api, esc, icons, statIcons } from './core.js';
import { capybara } from './capybara.js';

const VIEWS = {
  streak: { label: 'Racha', note: 'Días seguidos completando las tres secciones.', value: (r) => `${statIcons.flame}${r.value}` },
  tips: { label: 'Propinas', note: 'Lo que cada quien ha ganado atendiendo mesas en esta temporada.', value: (r) => `$${r.value}` },
};

const podiumSpot = (r, view) => `<div class="podium-spot podium-${r.pos} ${r.me ? 'is-me' : ''}">
    <span class="podium-avatar">${capybara({ size: r.pos === 1 ? 84 : 66, equipped: r.look, label: esc(r.name) })}</span>
    <b class="podium-name">${esc(r.name)}</b>
    <span class="podium-value">${VIEWS[view].value(r)}</span>
    <span class="podium-step">${r.pos}</span>
  </div>`;

const row = (r, view) => `<li class="rank-row ${r.me ? 'is-me' : ''}">
    <span class="rank-pos">${r.pos}</span>
    ${capybara({ size: 44, equipped: r.look, label: esc(r.name) })}
    <span class="rank-name">${esc(r.name)}${r.me ? '<small>Tú</small>' : ''}</span>
    <span class="rank-value">${VIEWS[view].value(r)}</span>
  </li>`;

export async function viewRanking(ctx) {
  const data = await api('GET', '/api/ranking');
  let view = 'streak';
  const main = ctx.shell(`<div class="page page-mid">
    <header class="hero hero-rank">
      <div class="grow"><h1 class="display">Ranking</h1><p class="hero-count" id="mine"></p></div>
      <span class="hero-badge">${icons.trophy}</span>
    </header>
    <div class="rank-tabs" role="group" aria-label="Ver ranking por">
      <button data-view="streak">${statIcons.flame}Racha</button>
      <button data-view="tips">${statIcons.coin}Propinas</button>
    </div>
    <p class="small muted center" id="note"></p>
    <div class="podium" id="podium"></div>
    <ol class="rank-list" id="list"></ol>
  </div>`, { tab: '#/ranking' });
  const paint = () => {
    const list = data[view];
    // Oro al centro, plata a la izquierda y bronce a la derecha, según el orden de la lista.
    const top = list.slice(0, 3);
    const ordered = [top[1], top[0], top[2]].filter(Boolean);
    main.querySelector('#podium').innerHTML = ordered.map((r) => podiumSpot(r, view)).join('');
    main.querySelector('#list').innerHTML = list.slice(3).map((r) => row(r, view)).join('');
    main.querySelector('#note').textContent = VIEWS[view].note;
    const pos = data.me[view];
    main.querySelector('#mine').textContent = pos ? `Vas en el puesto ${pos} de ${data.total}` : `${data.total} ${data.total === 1 ? 'participante' : 'participantes'}`;
    main.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
  };
  main.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => { view = b.dataset.view; paint(); }));
  paint();
}
