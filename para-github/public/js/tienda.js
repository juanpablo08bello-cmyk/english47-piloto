// Tienda: una categoría a la vez, cada artículo se ve puesto en tu mascota y comprar pide confirmar.
// La capibara es gratis y es con la que empieza toda cuenta.
import { api, esc, icons, statIcons, toast } from './core.js';
import { capybara } from './capybara.js';
import { bindGuide, guideHtml } from './guia.js';

const TABS = [
  { kind: 'animal', title: 'Animales' },
  { kind: 'vest', title: 'Ropa' },
  { kind: 'hat', title: 'Cabeza' },
  { kind: 'glasses', title: 'Lentes' },
  { kind: 'neck', title: 'Cuello' },
  { kind: 'shield', title: 'Racha' },
];
const CAPYBARA_ITEM = { id: 'animal_capybara', kind: 'animal', name: 'Capibara', price: 0, owned: true, desc: 'La mascota de ENGLISH47.' };
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
const wornBy = (item, eq) => (item.id === CAPYBARA_ITEM.id ? !eq.animal : eq[item.kind] === item.id);
const tryOn = (item, eq) => (item.id === CAPYBARA_ITEM.id ? { ...eq, animal: undefined } : { ...eq, [item.kind]: item.id });

let openTab = 'animal';

export async function viewTienda(ctx) {
  const p = await api('GET', '/api/profile');
  ctx.state.me = p.user;
  ctx.state.stats = p.stats;
  const eq = p.user.equipped ?? {};
  const { coins, shields } = p.stats;
  const shield = p.shop.find((i) => i.kind === 'shield');
  const itemsOf = (kind) => (kind === 'animal' ? [CAPYBARA_ITEM, ...p.shop.filter((i) => i.kind === 'animal')] : p.shop.filter((i) => i.kind === kind));

  const tag = (item) => {
    if (wornBy(item, eq)) return `<span class="shop-tag shop-tag-on">${icons.check}Puesto</span>`;
    if (item.owned) return '<span class="shop-tag">Tuyo</span>';
    return `<span class="shop-tag ${coins >= item.price ? 'shop-tag-buy' : ''}">${statIcons.coin}${item.price}</span>`;
  };
  const card = (item) => `<button class="shop-card ${wornBy(item, eq) ? 'is-on' : ''}" data-item="${item.id}">
      ${capybara({ size: 76, equipped: tryOn(item, eq), label: esc(item.name) })}
      <b>${esc(item.name)}</b>
      ${tag(item)}
    </button>`;
  const shieldPanel = () => `<div class="shield-card">
      <span class="shield-icon">${statIcons.shield}</span>
      <div class="grow"><b>${esc(shield.name)}</b><p class="small">${esc(shield.desc)}</p><p class="small">Tienes <b>${shields} de ${p.maxShields}</b></p></div>
      <button class="shop-tag ${coins >= shield.price && shields < p.maxShields ? 'shop-tag-buy' : ''}" data-item="shield" ${shields >= p.maxShields ? 'disabled' : ''}>${statIcons.coin}${shield.price}</button>
    </div>`;
  const panel = () => (openTab === 'shield' ? shieldPanel() : `<div class="shop-grid">${itemsOf(openTab).map(card).join('')}</div>`);

  const main = ctx.shell(`<div class="page page-wide">
    <header class="hero hero-shop">
      <div class="grow">
        <h1 class="display">Tienda</h1>
        <p class="hero-count hero-icon">${statIcons.coin}<b>${coins}</b> ${coins === 1 ? 'moneda' : 'monedas'}</p>
      </div>
      ${capybara({ mood: 'cheer', size: 104, equipped: eq })}
    </header>
    ${guideHtml('tienda', ['Ganas monedas con las <b>propinas</b> de Mesas y al completar el día.', 'Toca un artículo para verlo puesto en tu mascota.', 'Tu <b>capibara</b> siempre está disponible, aunque cambies de animal.'])}
    <div class="shop-tabs" role="tablist" aria-label="Categorías">
      ${TABS.map((t) => `<button role="tab" data-tab="${t.kind}" aria-selected="${t.kind === openTab}">${t.title}</button>`).join('')}
    </div>
    <div id="panel">${panel()}</div>
  </div>`, { tab: '#/tienda' });
  bindGuide(main);

  const equip = async (item) => {
    const worn = wornBy(item, eq);
    if (item.id === CAPYBARA_ITEM.id) await api('POST', '/api/avatar/equip', { slot: 'animal' });
    else await api('POST', '/api/avatar/equip', worn && item.kind !== 'animal' ? { slot: item.kind } : { itemId: item.id });
  };

  const closeSheet = () => document.querySelector('.modal.shop-sheet')?.remove();
  const openSheet = (item) => {
    const short = item.price - coins;
    const blocked = item.kind === 'shield' && shields >= p.maxShields;
    const el = document.createElement('div');
    el.className = 'modal shop-sheet';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', item.name);
    el.innerHTML = `<div class="modal-card shop-sheet-card">
      <button class="iconbtn shop-close" data-close aria-label="Cerrar">${icons.close}</button>
      ${item.kind === 'shield' ? `<span class="shield-icon shield-big">${statIcons.shield}</span>` : capybara({ mood: 'cheer', size: 170, equipped: tryOn(item, eq), label: esc(item.name) })}
      <h2>${esc(item.name)}</h2>
      ${item.desc ? `<p class="small muted center">${esc(item.desc)}</p>` : ''}
      ${short > 0 ? `<p class="shop-need">Te faltan ${short} monedas. Atiende mesas para ganarlas.</p>` : ''}
      <button class="btn btn-primary btn-xl btn-block" id="buy" ${short > 0 || blocked ? 'disabled' : ''}>${statIcons.coin}${item.kind === 'shield' ? 'Comprar' : 'Comprar y usar'} · ${item.price}</button>
    </div>`;
    document.getElementById('overlay').append(el);
    el.addEventListener('click', (e) => { if (e.target === el || e.target.closest('[data-close]')) closeSheet(); });
    el.querySelector('#buy').addEventListener('click', async (e) => {
      e.currentTarget.disabled = true;
      try {
        const out = await api('POST', '/api/shop/buy', { itemId: item.id, requestId: newId() });
        ctx.state.stats = out.stats;
        if (item.kind !== 'shield') await api('POST', '/api/avatar/equip', { itemId: item.id });
        const me = await api('GET', '/api/profile');
        ctx.state.me = me.user;
        closeSheet();
        toast(`¡${item.name} ya es tuyo!`);
        await viewTienda(ctx);
      } catch (err) {
        closeSheet();
        toast(err.message);
      }
    });
  };

  const bindPanel = () => {
    main.querySelectorAll('[data-item]').forEach((b) => b.addEventListener('click', async () => {
      const item = b.dataset.item === CAPYBARA_ITEM.id ? CAPYBARA_ITEM : p.shop.find((i) => i.id === b.dataset.item);
      if (!item) return;
      if (item.kind !== 'shield' && item.owned) {
        if (item.id === CAPYBARA_ITEM.id && wornBy(item, eq)) return;
        try {
          await equip(item);
          ctx.state.me = (await api('GET', '/api/profile')).user;
          await viewTienda(ctx);
        } catch (err) { toast(err.message); }
        return;
      }
      openSheet(item);
    }));
  };
  main.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => {
    openTab = b.dataset.tab;
    main.querySelectorAll('[data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    main.querySelector('#panel').innerHTML = panel();
    bindPanel();
  }));
  bindPanel();
  ctx.setTeardown(closeSheet);
}
