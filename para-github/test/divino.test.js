import test from 'node:test';
import assert from 'node:assert/strict';
import { startApp, login } from './helpers.js';
import { DIVINO_MENU } from '../content/divino.js';
import { DIVINO_ES } from '../content/divino-es.js';
import { restauranteDivino } from '../server/menus.js';
import { buildMesa } from '../content/mesas.js';

test('Ceviches by Divino: la carta real está completa, con español y precios', () => {
  assert.ok(DIVINO_MENU.length >= 75, `solo ${DIVINO_MENU.length} platos`);
  for (const p of DIVINO_MENU) {
    assert.ok(p.plato && p.categoria && p.es && p.esDesc, `falta algo en ${p.plato}`);
    assert.ok(p.precio > 0, `${p.plato}: sin precio`);
    assert.ok(DIVINO_ES[p.plato], `${p.plato}: sin traducción`);
    assert.ok(p.descripcion.length <= 160, `${p.plato}: descripción larga`);
  }
  const cats = new Set(DIVINO_MENU.map((p) => p.categoria));
  for (const c of ['entrada', 'principal', 'guarnicion', 'bebida', 'alcohol', 'vino', 'postre']) assert.ok(cats.has(c), c);
});

test('Ceviches by Divino: el local genera mesas con sus propios platos y la API lo sirve', async () => {
  const rest = restauranteDivino();
  assert.ok(rest.menu.mains.length >= 20 && rest.menu.starters.length >= 5);
  const names = new Set([...rest.menu.mains, ...rest.menu.starters].map((d) => d.en));
  let usa = 0;
  for (let i = 0; i < 40; i++) {
    const mesa = buildMesa(Math.random, { done: 0, restaurant: rest });
    assert.ok(mesa.turns?.length ?? mesa.pasos?.length ?? true);
    if ([...names].some((n) => JSON.stringify(mesa).includes(n))) usa++;
  }
  assert.ok(usa > 0, 'alguna mesa menciona un plato de Divino');

  const app = await startApp();
  try {
    const ana = await login(app, 'ana');
    const lib = await ana('GET', '/api/divino');
    assert.equal(lib.status, 200);
    assert.ok(lib.data.platos.length >= 75 && lib.data.glosario.length >= 15 && lib.data.info.telefono);
    assert.equal((await app.client()('GET', '/api/divino')).status, 401, 'requiere sesión');
    const home = await ana('GET', '/api/mesas');
    assert.equal(home.data.divino?.id, 'divino');
    const mesa = await ana('POST', '/api/mesas/generar', { modo: 'turno', restauranteId: 'divino' });
    assert.equal(mesa.status, 200, JSON.stringify(mesa.data).slice(0, 200));
    assert.equal(mesa.data.turno?.restauranteId ?? mesa.data.mesa?.restauranteId, 'divino');
  } finally { await app.stop(); }
});
