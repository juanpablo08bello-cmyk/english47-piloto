// Mesas 2.0 en el servidor: Turno y Servicio libre, locales, dificultad y tipo de cliente, comanda en vivo y menú propio.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startApp, login, makeUser } from './helpers.js';
import { openDb, SCHEMA_VERSION } from '../server/db.js';
import { comandaOf, libreFactor, libreTip, LIBRE_TIP_CAP, mesaTip, speechPersona, turnoSize } from '../server/practice.js';
import { installSchema, LATEST_SCHEMA, verifySchema } from '../server/storage/postgres.js';
import { csvAPlatos, menusDisponibles, requisitosMenu, restauranteDesdeMenu, validarPlatos } from '../server/menus.js';
import { buildMesa, CLIENTES, CLIENTE_IDS, LEVELS, SCENE_IDS } from '../content/mesas.js';
import { RESTAURANTES, estadoRestaurantes } from '../content/restaurantes.js';
import { resenaDeTurno } from '../content/resenas.js';
import { missingWords } from '../content/pronunciacion.js';
import { goalFor } from '../content/objetivos.js';

const seeded = (seed) => { let n = seed; return () => { n = (n * 16807) % 2147483647; return n / 2147483647; }; };

/** Responde cada turno con la frase guía. Con `first`, el primer intento del turno 0 sale mal y luego se corrige. */
async function jugar(api, mesa, { skip = [], bad = [] } = {}) {
  for (const [index, step] of mesa.steps.entries()) {
    if (skip.includes(index)) continue;
    const heard = bad.includes(index) ? 'zzz qqq' : step.say.en;
    const r = await api('POST', `/api/mesas/${mesa.id}/turno`, { index, heard });
    assert.equal(r.status, 200, JSON.stringify(r.data));
  }
}
const generar = async (api, body) => (await api('POST', '/api/mesas/generar', body)).data;
async function turnoCompleto(api, body) {
  const { mesa } = await generar(api, body);
  await jugar(api, mesa);
  return (await api('POST', `/api/mesas/${mesa.id}/terminar`)).data;
}
const sembrarMesas = (app, userName, n) => {
  const { id } = app.db.prepare('SELECT id FROM users WHERE username=?').get(userName);
  for (let i = 0; i < n; i++) app.db.prepare('INSERT INTO reward_events (user_id, key, xp, coins, created_at) VALUES (?,?,0,0,?)').run(id, `mesa_done:2026-11-01:${900 + i}:0`, '2026-11-01T15:00:00.000Z');
};

// ───────────────────────── 1. Turno vs Servicio libre ─────────────────────────

test('sin cuerpo, generar es un Turno de 3 mesas en Harbor 47, como siempre', async () => {
  const app = await startApp();
  try {
    const api = await login(app, 'ana');
    const out = await generar(api);
    assert.equal(out.modo, 'turno');
    assert.equal(out.mesa.modo, 'turno');
    assert.equal(out.mesa.restauranteId, 'steakhouse');
    assert.deepEqual({ ...out.turno, mesas: undefined }, { id: 1, total: 3, hechas: 0, restantes: 3, estrellas: [], propinas: 0, restauranteId: 'steakhouse', estado: 'abierto', nivel: 1, mesas: undefined, cierre: null });
    assert.equal(out.mesa.menuFacts.restaurant, 'Harbor 47 (restaurante ficticio)');
    assert.ok(Array.isArray(out.comanda.items));
    assert.deepEqual([1, 2, 3, 4, 5].map((n) => turnoSize(n)), [3, 3, 4, 5, 5], 'tamaño del Turno según el nivel');
    assert.equal((await api('POST', '/api/mesas/generar', { modo: 'otro' })).status, 400);
  } finally { await app.stop(); }
});

test('Turno: 3 mesas, reseña de cierre, propina total y siguiente noche', async () => {
  const app = await startApp();
  try {
    const api = await login(app, 'ana');
    const tips = [];
    let last;
    for (let i = 1; i <= 3; i++) {
      last = await turnoCompleto(api);
      tips.push(last.summary.tip);
      assert.equal(last.modo, 'turno');
      assert.equal(last.turno.hechas, i);
      assert.equal(last.turno.estado, i < 3 ? 'abierto' : 'cerrado');
      assert.equal(last.turno.restantes, 3 - i);
    }
    const { cierre } = last.turno;
    assert.equal(last.turno.propinas, tips.reduce((a, b) => a + b, 0));
    assert.equal(cierre.propinas, last.turno.propinas);
    assert.equal(last.turno.estrellas.length, 3);
    assert.ok(cierre.resena.en && cierre.resena.es && cierre.resena.autor && cierre.resena.local);
    assert.ok(cierre.resena.estrellas >= 1 && cierre.resena.estrellas <= 5);
    assert.equal(cierre.estrellas, cierre.resena.estrellas);
    // XP y monedas siguen las reglas de siempre: la meta diaria (2 mesas) paga 25 XP una vez; el Turno no inventa XP.
    assert.equal(last.rewards.xp, 0, 'la tercera mesa no vuelve a pagar');
    assert.equal(last.plan.tables.count, 3);
    const home = (await api('GET', '/api/mesas')).data;
    assert.equal(home.turno.estado, 'cerrado');
    assert.equal(home.turno.cierre.resena.en, cierre.resena.en);
    // La noche siguiente (otra tanda de mesas el mismo día) abre un Turno nuevo.
    const next = await generar(api);
    assert.equal(next.turno.id, 2);
    assert.equal(next.turno.hechas, 0);
    assert.equal(next.turno.estado, 'abierto');
  } finally { await app.stop(); }
});

test('solo las mesas de un Turno cuentan para la meta, el nivel y la racha; el Servicio libre no', async () => {
  const app = await startApp();
  try {
    const api = await login(app, 'ana');
    for (let i = 0; i < 3; i++) await turnoCompleto(api, { modo: 'libre' });
    const home = (await api('GET', '/api/mesas')).data;
    assert.equal(home.count, 0, 'la meta diaria sigue en cero');
    assert.equal(home.progress.done, 0, 'no sube el nivel');
    assert.equal(home.turno, null, 'no hay Turno');
    const plan = (await api('GET', '/api/today')).data.plan;
    assert.equal(plan.tables.count, 0);
    assert.equal(plan.tables.done, false);
    const first = await turnoCompleto(api);
    assert.equal(first.rewards.xp, 0);
    const second = await turnoCompleto(api);
    assert.equal(second.plan.tables.count, 2);
    assert.equal(second.rewards.xp, 25, '25 XP al llegar a 2 mesas de Turno, como siempre');
    assert.equal(second.progress.done, 2);
    // Racha: sigue pidiendo las tres secciones; las mesas libres no la completan.
    assert.equal((await api('GET', '/api/today')).data.stats.current, 0);
  } finally { await app.stop(); }
});

test('Servicio libre: propina con curva decreciente y tope diario; sin racha ni XP', async () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 9].map(libreFactor), [1, 0.8, 0.6, 0.4, 0.25, 0.1, 0.1]);
  assert.deepEqual(libreTip(32, 0, 0), { tip: 32, bruto: 32, factor: 1, topeAlcanzado: false });
  assert.deepEqual(libreTip(32, 1, 32), { tip: 26, bruto: 26, factor: 0.8, topeAlcanzado: false });
  assert.deepEqual(libreTip(32, 2, 58), { tip: 2, bruto: 19, factor: 0.6, topeAlcanzado: true });
  assert.equal(libreTip(32, 5, LIBRE_TIP_CAP).tip, 0);
  const app = await startApp();
  try {
    const api = await login(app, 'ana');
    const tips = [];
    let coins = 0;
    for (let i = 0; i < 5; i++) {
      const out = await turnoCompleto(api, { modo: 'libre' });
      assert.equal(out.modo, 'libre');
      assert.equal(out.rewards.xp, 0);
      assert.equal(out.rewards.coins, 0);
      assert.equal(out.levelUp, false);
      assert.equal(out.summary.libre.tope, LIBRE_TIP_CAP);
      assert.equal(out.summary.libre.mesasHoy, i + 1);
      tips.push(out.summary.tip);
      coins = out.stats.coins;
    }
    assert.ok(tips[0] > 0);
    assert.ok(tips.reduce((a, b) => a + b, 0) <= LIBRE_TIP_CAP, `tope diario: ${tips}`);
    assert.equal(tips[4], 0, 'con el tope usado ya no paga');
    assert.equal(coins, tips.reduce((a, b) => a + b, 0), 'las propinas libres son las únicas monedas');
    assert.equal((await api('GET', '/api/today')).data.mesas.tips, coins, 'cuentan en las propinas del ranking');
    const keys = app.db.prepare("SELECT key FROM reward_events WHERE key LIKE 'mesa_libre:%'").all();
    assert.equal(keys.length, 5);
    // Al día siguiente el tope se renueva.
    app.clockBox.now += 86400000;
    const again = await turnoCompleto(api, { modo: 'libre' });
    assert.ok(again.summary.tip > 0);
    assert.equal(again.summary.libre.mesasHoy, 1);
  } finally { await app.stop(); }
});

test('Servicio libre: el primer intento de cada turno es el que paga, y lo flojo entra al repaso igual', async () => {
  const app = await startApp();
  try {
    const api = await login(app, 'ana');
    const { mesa } = await generar(api, { modo: 'libre' });
    // Primer intento malo, luego bueno: en libre vale el primero.
    for (const [index, step] of mesa.steps.entries()) {
      await api('POST', `/api/mesas/${mesa.id}/turno`, { index, heard: 'zzz qqq' });
      if (index > 0) await api('POST', `/api/mesas/${mesa.id}/turno`, { index, heard: step.say.en });
    }
    const end = (await api('POST', `/api/mesas/${mesa.id}/terminar`)).data;
    assert.equal(end.summary.libre.base, 0, 'ningún primer intento valió estrellas');
    assert.equal(end.summary.tip, 0);
    const weak = JSON.parse(app.db.prepare('SELECT state FROM daily_sessions').get().state).practice.tables.weak;
    assert.ok(weak.some((w) => w.en === mesa.steps[0].say.en), 'la frase que no salió va a tables.weak');
    // En un Turno, con los mismos intentos, el mejor intento sí paga.
    const { mesa: t } = await generar(api);
    for (const [index, step] of t.steps.entries()) {
      await api('POST', `/api/mesas/${t.id}/turno`, { index, heard: 'zzz qqq' });
      await api('POST', `/api/mesas/${t.id}/turno`, { index, heard: step.say.en });
    }
    assert.ok((await api('POST', `/api/mesas/${t.id}/terminar`)).data.summary.tip > 0);
    const steps = [{}, {}];
    const attempts = { 0: { stars: 5, first: { stars: 1, selfCheck: false } }, 1: { stars: 5, first: { stars: 5, selfCheck: false } } };
    assert.equal(mesaTip(steps, attempts).tip, 20 + 5, 'Turno: mejor intento, con bono de perfecta');
    assert.equal(mesaTip(steps, attempts, { primerIntento: true }).tip, 12, 'Libre: primer intento, sin bono');
  } finally { await app.stop(); }
});

// ───────────────────────── 2. Restaurantes ─────────────────────────

test('GET /api/mesas lista los 5 locales con estado, condición y progreso', async () => {
  const app = await startApp();
  try {
    const api = await login(app, 'ana');
    const home = (await api('GET', '/api/mesas')).data;
    assert.deepEqual(home.restaurantes.map((r) => r.id), ['cafe', 'brunch', 'steakhouse', 'rooftop', 'hotel']);
    const by = Object.fromEntries(home.restaurantes.map((r) => [r.id, r]));
    assert.equal(by.cafe.estado, 'abierto');
    assert.equal(by.steakhouse.estado, 'abierto');
    assert.equal(by.brunch.estado, 'bloqueado');
    assert.equal(by.brunch.condicion.mesas, 4);
    assert.equal(by.brunch.progreso.restantes, 4);
    assert.equal(by.hotel.condicion.mesas, 20);
    for (const r of home.restaurantes) {
      assert.match(r.sala, /^sala_/);
      assert.ok(existsSync(new URL(`../web/public/art/${r.sala}.webp`, import.meta.url)), `falta el arte de ${r.sala}`);
    }
    assert.equal((await api('POST', '/api/mesas/generar', { modo: 'libre', restauranteId: 'hotel' })).status, 403, 'bloqueado');
    assert.equal((await api('POST', '/api/mesas/generar', { restauranteId: 'no-existe' })).status, 400);
    const cafe = await generar(api, { restauranteId: 'cafe' });
    assert.equal(cafe.mesa.restauranteId, 'cafe');
    assert.equal(cafe.mesa.restaurante.local, 'Sunrise Café');
    assert.equal(cafe.turno.restauranteId, 'cafe');
    // Con un Turno en curso no se cambia de local a mitad de noche.
    assert.equal((await api('POST', '/api/mesas/generar', { restauranteId: 'steakhouse' })).status, 409);
    assert.equal((await generar(api)).mesa.restauranteId, 'cafe', 'sin pedir local sigue en el del Turno');
    // Atendiendo mesas se abre el siguiente.
    sembrarMesas(app, 'ana', 4);
    const open = (await api('GET', '/api/mesas')).data.restaurantes.find((r) => r.id === 'brunch');
    assert.equal(open.estado, 'abierto');
    assert.equal(open.progreso.restantes, 0);
  } finally { await app.stop(); }
});

test('cada local trae su menú y su vocabulario, y todas sus frases tienen pronunciación y objetivo', () => {
  const rng = seeded(21);
  const mains = new Map();
  for (const r of RESTAURANTES) {
    assert.ok(r.menu.mains.length >= 4, r.id);
    for (const m of r.menu.mains) assert.ok(m.en && m.es && m.how.en && m.how.es, `${r.id}: ${m.en}`);
    assert.equal(r.menu.desserts.length, 2, `${r.id}: dos postres para «We have X and Y»`);
    mains.set(r.id, new Set(r.menu.mains.map((m) => m.en)));
    const missing = new Set();
    const nogoal = new Set();
    for (const scene of SCENE_IDS) for (const { from } of LEVELS) for (let i = 0; i < 25; i++) {
      const mesa = buildMesa(rng, { done: from, scene, restaurant: r });
      assert.doesNotMatch(JSON.stringify(mesa), /undefined|null,"es"|\[object/, `${r.id}/${scene}`);
      assert.ok(mains.get(r.id).has(mesa.menuFacts.main), `${r.id}: plato fuera de su carta`);
      for (const s of mesa.steps) {
        missingWords(s.say.en).forEach((w) => missing.add(w));
        if (!goalFor(s.say)) nogoal.add(s.say.en);
      }
    }
    assert.deepEqual([...missing], [], `${r.id}: palabras sin pronunciación`);
    assert.deepEqual([...nogoal], [], `${r.id}: frases sin objetivo`);
  }
  // Los menús son distintos entre sí: no es el mismo plato con otro nombre de local.
  assert.ok([...mains.values()].every((set, i, all) => all.every((o, j) => i === j || [...set].filter((x) => o.has(x)).length < set.size)));
  // El postre que se nombra en la carta es el que el cliente pide.
  for (const r of RESTAURANTES) {
    const mesa = buildMesa(rng, { scene: 'postre', restaurant: r });
    const say = mesa.steps.find((s) => s.kind === 'options').say.en;
    assert.ok(r.menu.desserts.every((d) => say.includes(d.en)), `${r.id}: ${say}`);
  }
  // Un local no sirve situaciones que no le corresponden (café sin vino, rooftop sin desayuno...).
  for (const [local, excluded] of [['cafe', 'vino'], ['rooftop', 'desayuno'], ['hotel', 'happy_hour']]) {
    const r = RESTAURANTES.find((x) => x.id === local);
    for (let i = 0; i < 300; i++) assert.notEqual(buildMesa(rng, { done: 20, restaurant: r }).scene, excluded, local);
  }
  assert.equal(estadoRestaurantes(20).filter((r) => r.estado === 'abierto').length, 5);
});

// ───────────────────────── 3. Dificultad y tipo de cliente ─────────────────────────

test('Servicio libre: elegir dificultad (hasta el nivel desbloqueado) y tipo de cliente', async () => {
  const app = await startApp();
  try {
    const api = await login(app, 'ana');
    assert.equal((await api('POST', '/api/mesas/generar', { modo: 'libre', dificultad: 2 })).status, 403, 'todavía no la tiene');
    for (const dificultad of [0, 5, 1.5, 'x']) assert.equal((await api('POST', '/api/mesas/generar', { modo: 'libre', dificultad })).status, 400, String(dificultad));
    assert.equal((await api('POST', '/api/mesas/generar', { modo: 'libre', cliente: 'rey' })).status, 400);
    assert.equal((await api('POST', '/api/mesas/generar', { modo: 'turno', cliente: 'vip' })).status, 400, 'solo en Servicio libre');
    assert.equal((await api('POST', '/api/mesas/generar', { dificultad: 1 })).status, 400, 'solo en Servicio libre');
    const home = (await api('GET', '/api/mesas')).data;
    assert.equal(home.libre.dificultadMax, 1);
    assert.deepEqual(home.libre.clientes.map((c) => c.id), CLIENTE_IDS);
    sembrarMesas(app, 'ana', 10);
    const hard = await generar(api, { modo: 'libre', dificultad: 3, cliente: 'ejecutivo', restauranteId: 'rooftop' });
    assert.equal(hard.mesa.level, 3);
    assert.equal(hard.mesa.persona.cliente, 'ejecutivo');
    assert.equal(hard.mesa.persona.pace, 'fast');
    assert.equal(hard.mesa.restauranteId, 'rooftop');
    const easy = await generar(api, { modo: 'libre', dificultad: 1 });
    assert.equal(easy.mesa.level, 1, 'se puede bajar la dificultad');
    assert.ok(easy.mesa.steps.length <= LEVELS[0].max);
  } finally { await app.stop(); }
});

test('cada tipo de cliente condiciona personaje, ánimo, acento, ritmo y situación', () => {
  const rng = seeded(5);
  for (const id of CLIENTE_IDS) {
    const c = CLIENTES[id];
    let preferred = 0;
    for (let i = 0; i < 150; i++) {
      const mesa = buildMesa(rng, { done: 20, cliente: id, avoidNames: ['Linda'] });
      assert.ok(c.accents.includes(mesa.persona.accent), `${id}: acento ${mesa.persona.accent}`);
      assert.ok(c.moods.includes(mesa.persona.mood), `${id}: ánimo ${mesa.persona.mood}`);
      assert.equal(mesa.persona.cliente, id);
      assert.equal(mesa.persona.pace, c.pace);
      if (c.scenes.includes(mesa.scene)) preferred += 1;
    }
    assert.ok(preferred >= 140, `${id}: casi todas las situaciones son de su tipo (${preferred}/150)`);
  }
  assert.equal(buildMesa(rng, { done: 0, cliente: 'vip' }).level, 1, 'con 0 mesas aun un VIP sale de nivel 1');
  assert.equal(buildMesa(rng, { done: 0, level: 4 }).level, 4, 'la dificultad forzada manda sobre el conteo');
  // El ritmo llega a la voz del cliente: lento para el turista, más ágil para el ejecutivo.
  const base = { voice: 'Kore', azure: 'en-US-AvaNeural', accent: 'us', mood: 'friendly' };
  assert.equal(speechPersona({ ...base, pace: 'slow' }).rate, '-18%');
  assert.equal(speechPersona({ ...base, pace: 'fast' }).rate, '+4%');
  assert.equal(speechPersona({ ...base, pace: 'normal' }).rate, '-8%', 'normal deja el ritmo del ánimo');
  assert.equal(speechPersona({ ...base, pace: 'ruidoso' }).rate, '-8%', 'un ritmo inventado se ignora');
  assert.equal(speechPersona(base).rate, '-8%');
});

// ───────────────────────── 4. Comanda en vivo ─────────────────────────

test('la comanda anota cada dato al responder el turno, y confirmar la orden se comprueba con order.js', () => {
  const rng = seeded(8);
  let mesa;
  do { mesa = { ...buildMesa(rng, { scene: 'orden', restaurant: RESTAURANTES.find((r) => r.id === 'steakhouse') }), attempts: {} }; } while (!mesa.steps.some((s) => s.pedido?.some((p) => p.tipo === 'coccion')));
  const start = comandaOf(mesa);
  assert.ok(start.total >= 3, 'plato, guarnición y cocción');
  assert.equal(start.confirmados, 0);
  assert.ok(start.items.every((x) => x.estado === 'pendiente' && x.valor === null), 'los pendientes no revelan el dato');
  assert.equal(start.tieneConfirmacion, true);
  assert.equal(start.ordenConfirmada, false);
  const orderAt = mesa.steps.findIndex((s) => s.kind === 'order');
  mesa.attempts[orderAt] = { stars: 4, tries: 1, selfCheck: false };
  const one = comandaOf(mesa);
  assert.equal(one.items.find((x) => x.tipo === 'plato').valor.en, mesa.menuFacts.main);
  assert.equal(one.items.find((x) => x.tipo === 'plato').estado, 'confirmado');
  assert.ok(one.pendientes < start.pendientes);
  mesa.attempts[orderAt] = { stars: 1, tries: 1, selfCheck: false };
  assert.equal(comandaOf(mesa).confirmados, 0, 'una respuesta floja no anota el dato');
  mesa.attempts[orderAt] = { stars: 0, tries: 1, selfCheck: true };
  assert.ok(comandaOf(mesa).confirmados > 0, 'la autoevaluación sí anota');
});

test('la respuesta de cada turno trae la comanda y verifica la orden confirmada', async () => {
  const app = await startApp();
  try {
    const api = await login(app, 'ana');
    let mesa;
    for (let i = 0; i < 400; i++) {
      mesa = (await generar(api)).mesa;
      if (mesa.scene === 'orden' && mesa.menuFacts.temp) break;
    }
    assert.equal(mesa.scene, 'orden', 'salió una mesa de tomar la orden con carne');
    const confirmAt = mesa.steps.findIndex((s) => s.kind === 'confirm');
    assert.ok(confirmAt > 0);
    let r;
    for (const [index, step] of mesa.steps.entries()) {
      r = (await api('POST', `/api/mesas/${mesa.id}/turno`, { index, heard: step.say.en })).data;
      assert.ok(r.comanda, 'cada turno trae la comanda');
      assert.equal(r.comanda.items.length, r.comanda.total);
      if (index === 0) assert.ok(r.comanda.pendientes > 0 || r.comanda.total === 0);
    }
    assert.equal(r.comanda.pendientes, 0);
    assert.equal(r.comanda.verificacion.ok, true, JSON.stringify(r.comanda.verificacion));
    assert.equal(r.comanda.ordenConfirmada, true);
    // Si al confirmar se olvida el término, la comprobación lo dice (no cambia las estrellas).
    const stars = r.result.stars;
    const bad = (await api('POST', `/api/mesas/${mesa.id}/turno`, { index: confirmAt, heard: `Let me confirm. One ${mesa.menuFacts.main}. zxqsecreto` })).data;
    assert.equal(bad.comanda.verificacion.ok, false);
    assert.match(bad.comanda.verificacion.problemas.join(' '), /término/);
    assert.equal(bad.comanda.ordenConfirmada, false);
    assert.ok(bad.result.stars <= stars);
    const home = (await api('GET', '/api/mesas')).data;
    assert.ok(home.comanda && home.comanda.items.length > 0, 'GET /api/mesas también la trae');
    const state = app.db.prepare('SELECT state FROM daily_sessions').get().state;
    assert.ok(!state.includes('zxqsecreto'), 'lo dicho no se guarda');
  } finally { await app.stop(); }
});

test('la reseña del Turno usa plantillas por resultado y es estable', () => {
  const stars = [5, 4.6, 4, 3, 2, 1].map((avg) => resenaDeTurno({ avg, perfects: 0, total: 3, local: 'Harbor 47', autor: 'Linda', seed: 1 }).estrellas);
  assert.deepEqual(stars, [5, 5, 4, 3, 2, 1]);
  const a = resenaDeTurno({ avg: 4.8, perfects: 3, total: 3, local: 'Harbor 47', autor: 'Linda', seed: 2 });
  assert.match(a.en, /Not a single mistake/);
  assert.deepEqual(resenaDeTurno({ avg: 4.8, perfects: 3, total: 3, local: 'Harbor 47', autor: 'Linda', seed: 2 }), a, 'misma noche, misma reseña');
  assert.match(resenaDeTurno({ avg: 4.8, perfects: 1, total: 3, seed: 0 }).en, /1 table was perfect/);
  assert.match(resenaDeTurno({ avg: 4.8, perfects: 2, total: 3, seed: 0 }).es, /2 mesas fueron perfectas/);
  assert.equal(resenaDeTurno({ avg: null, total: 3, seed: 0 }).estrellas, 3, 'solo autoevaluación: reseña neutra');
  assert.equal(new Set([0, 1, 2].map((seed) => resenaDeTurno({ avg: 5, total: 3, seed }).en)).size, 3, 'hay variantes');
});

// ───────────────────────── 5. Menú propio ─────────────────────────

const CSV = [
  'plato;categoria;descripcion;alergenos;precio',
  '"Grilled Salmon";principal;"Salmon with lemon, served with rice";fish;28.50',
  'Ribeye;principal;Grilled ribeye with herb butter;dairy;46',
  'Caesar Salad;entrada;Romaine and parmesan;"dairy, gluten, egg";14',
  'Fries;guarnicion;;;8',
  'Key Lime Pie;postre;Sweet and tart;dairy,egg,gluten;11',
  'Iced Tea;bebida;;;4',
].join('\n');

test('menú propio: validación estricta de contenido, tamaño y formato', () => {
  const ok = validarPlatos([{ plato: 'Mac & Cheese', categoria: 'Main', descripcion: "Chef's favorite (kids love it)", alergenos: 'Dairy, gluten', precio: '$12,50' }]);
  assert.equal(ok.ok, true, JSON.stringify(ok.problemas));
  assert.deepEqual({ ...ok.platos[0], key: undefined, cents: undefined }, { plato: 'Mac & Cheese', categoria: 'principal', descripcion: "Chef's favorite (kids love it)", alergenos: ['dairy', 'gluten'], precio: 12.5, key: undefined, cents: undefined });
  const bad = (dish) => validarPlatos([{ plato: 'Pizza', categoria: 'principal', ...dish }]).problemas[0]?.campo;
  assert.equal(bad({ plato: '<script>alert(1)</script>' }), 'plato');
  assert.equal(bad({ plato: 'Pizza &amp; Co' }), 'plato');
  assert.equal(bad({ plato: 'x'.repeat(61) }), 'plato');
  assert.equal(bad({ plato: '12345' }), 'plato', 'el nombre necesita letras');
  assert.equal(bad({ plato: 'Pizza\u0007' }), 'plato', 'sin caracteres de control');
  assert.equal(bad({ plato: '=SUMA(A1)' }), 'plato');
  assert.equal(bad({ descripcion: 'a'.repeat(161) }), 'descripcion');
  assert.equal(bad({ descripcion: '<b>rico</b>' }), 'descripcion');
  assert.equal(bad({ categoria: 'postrecito' }), 'categoria');
  assert.equal(bad({ alergenos: 'plutonio' }), 'alergenos');
  for (const precio of ['-1', '12.345', 'gratis', '99999']) assert.equal(bad({ precio }), 'precio', precio);
  assert.equal(bad({ precio: 0 }), undefined, 'precio cero se permite');
  assert.equal(bad({ precio: null }), undefined, 'el precio es opcional');
  assert.equal(validarPlatos([{ plato: 'Pizza', categoria: 'principal' }, { plato: ' pizza ', categoria: 'principal' }]).problemas[0].mensaje, '«pizza» está repetido.');
  assert.equal(validarPlatos('no es una lista').ok, false);
  assert.equal(validarPlatos([null, [], 'x']).problemas.length, 3);
});

test('menú propio: el CSV pegado admite coma, punto y coma o tabulador, con o sin encabezado', () => {
  const full = csvAPlatos(CSV);
  assert.equal(full.platos.length, 6);
  assert.equal(full.platos[0].descripcion, 'Salmon with lemon, served with rice', 'la coma entre comillas no corta');
  assert.equal(validarPlatos(full.platos).ok, true);
  const commas = csvAPlatos('Plato,Category,Description\nPasta,main,Fresh pasta\nSoup,starter,');
  assert.deepEqual(commas.platos.map((p) => [p.plato, p.categoria]), [['Pasta', 'main'], ['Soup', 'starter']]);
  const tabs = csvAPlatos('Pasta\tprincipal\tFresh pasta\tgluten\t18');
  assert.deepEqual(tabs.platos[0], { plato: 'Pasta', categoria: 'principal', descripcion: 'Fresh pasta', alergenos: 'gluten', precio: '18' }, 'sin encabezado: orden fijo');
  assert.ok(csvAPlatos('a,b,c,d,e,f,g').error, 'más columnas de las esperadas');
  assert.ok(csvAPlatos('"sin cerrar,principal').error);
  assert.ok(csvAPlatos('').error);
  assert.ok(csvAPlatos('x'.repeat(20001)).error);
  assert.ok(csvAPlatos(123).error);
});

test('menú propio: guardar, listar, agregar, borrar; máximo 60; todo o nada', async () => {
  const app = await startApp();
  try {
    const ana = await login(app, 'ana');
    assert.equal((await ana('GET', '/api/mesas/menu')).data.total, 0);
    assert.equal((await app.client()('GET', '/api/mesas/menu')).status, 401, 'sin sesión no se ve');
    const saved = await ana('POST', '/api/mesas/menu', { csv: CSV });
    assert.equal(saved.status, 200, JSON.stringify(saved.data));
    assert.equal(saved.data.total, 6);
    assert.equal(saved.data.maximo, 60);
    assert.deepEqual(saved.data.platos[0], { id: saved.data.platos[0].id, plato: 'Grilled Salmon', categoria: 'principal', descripcion: 'Salmon with lemon, served with rice', alergenos: ['fish'], precio: 28.5 });
    assert.deepEqual(saved.data.platos[2].alergenos, ['dairy', 'gluten', 'egg']);
    assert.equal(saved.data.platos[3].precio, 8);
    assert.equal(saved.data.platos[5].precio, 4);
    assert.equal(saved.data.requisitos.listo, true);
    // Validar sin guardar.
    const dry = await ana('POST', '/api/mesas/menu', { platos: [{ plato: 'Tacos', categoria: 'principal' }], soloValidar: true });
    assert.equal(dry.data.validado, true);
    assert.equal((await ana('GET', '/api/mesas/menu')).data.total, 6, 'no guardó nada');
    // Un solo plato malo no deja nada a medias.
    const bad = await ana('POST', '/api/mesas/menu', { platos: [{ plato: 'Tacos', categoria: 'principal' }, { plato: '<i>x</i>', categoria: 'postre' }] });
    assert.equal(bad.status, 400);
    assert.equal(bad.data.error, 'invalid_menu');
    assert.deepEqual(bad.data.problemas.map((p) => [p.fila, p.campo]), [[2, 'plato']]);
    assert.equal((await ana('GET', '/api/mesas/menu')).data.total, 6, 'el menú anterior sigue igual');
    assert.equal((await ana('POST', '/api/mesas/menu', {})).status, 400);
    assert.equal((await ana('POST', '/api/mesas/menu', { csv: CSV, platos: [] })).status, 400, 'o uno o lo otro');
    assert.equal((await ana('POST', '/api/mesas/menu', { csv: CSV, modo: 'mezclar' })).status, 400);
    // Agregar: suma, y el mismo nombre reemplaza al anterior.
    const added = await ana('POST', '/api/mesas/menu', { modo: 'agregar', platos: [{ plato: 'Tacos', categoria: 'principal', precio: 15 }, { plato: 'RIBEYE', categoria: 'principal', descripcion: 'Nuevo' }] });
    assert.equal(added.data.total, 7);
    assert.equal(added.data.platos.find((p) => p.plato === 'RIBEYE').descripcion, 'Nuevo');
    // Reemplazar deja solo lo enviado.
    assert.equal((await ana('POST', '/api/mesas/menu', { platos: [{ plato: 'Solo uno', categoria: 'postre' }] })).data.total, 1);
    // Máximo 60.
    const sixty = Array.from({ length: 60 }, (_, i) => ({ plato: `Plato ${String.fromCharCode(97 + (i % 26))}${'x'.repeat(Math.floor(i / 26))}`, categoria: 'principal' }));
    assert.equal((await ana('POST', '/api/mesas/menu', { platos: sixty })).data.total, 60);
    const over = await ana('POST', '/api/mesas/menu', { platos: [...sixty, { plato: 'Uno más', categoria: 'postre' }] });
    assert.equal(over.status, 400);
    assert.equal(over.data.error, 'too_many');
    const grow = await ana('POST', '/api/mesas/menu', { modo: 'agregar', platos: [{ plato: 'Uno más', categoria: 'postre' }] });
    assert.equal(grow.status, 409);
    assert.equal(grow.data.error, 'too_many');
    assert.equal((await ana('GET', '/api/mesas/menu')).data.total, 60);
    // Borrar uno y borrar todo.
    const { platos } = (await ana('GET', '/api/mesas/menu')).data;
    const del = await ana('DELETE', `/api/mesas/menu/${platos[0].id}`);
    assert.equal(del.data.total, 59);
    assert.equal((await ana('DELETE', `/api/mesas/menu/${platos[0].id}`)).status, 404);
    assert.equal((await ana('DELETE', '/api/mesas/menu/abc')).status, 400);
    assert.equal((await ana('DELETE', '/api/mesas/menu')).data.borrados, 59);
    assert.equal((await ana('GET', '/api/mesas/menu')).data.total, 0);
  } finally { await app.stop(); }
});

test('menú propio: solo lo ve su dueño (ni otro alumno ni la administración)', async () => {
  const app = await startApp();
  try {
    const ana = await login(app, 'ana');
    const beto = await login(app, 'beto');
    await ana('POST', '/api/mesas/menu', { csv: CSV });
    const mine = (await ana('GET', '/api/mesas/menu')).data.platos;
    assert.equal((await beto('GET', '/api/mesas/menu')).data.total, 0, 'beto no ve el de ana');
    assert.equal((await beto('DELETE', `/api/mesas/menu/${mine[0].id}`)).status, 404, 'ni borra sus platos');
    assert.equal((await beto('DELETE', '/api/mesas/menu')).data.borrados, 0);
    assert.equal((await ana('GET', '/api/mesas/menu')).data.total, 6, 'el de ana sigue intacto');
    // Beto tiene el suyo y no pisa el de ana.
    await beto('POST', '/api/mesas/menu', { platos: [{ plato: 'Ribeye', categoria: 'principal' }] });
    assert.equal((await ana('GET', '/api/mesas/menu')).data.total, 6);
    // Ninguna ruta de administración lo expone.
    await makeUser(app.db, 'jefa', app.clockBox.now, 'admin');
    assert.ok(!JSON.stringify((await (await login(app, 'otra'))('GET', '/api/today')).data).includes('Grilled Salmon'));
    const adminRoutes = readFileSync(new URL('../server/app.js', import.meta.url), 'utf8').match(/route\('[A-Z]+', '\/api\/admin[^']*'/g);
    assert.ok(adminRoutes.length > 0);
    assert.ok(!adminRoutes.some((r) => /menu/.test(r)), 'la administración no tiene ruta de menús');
  } finally { await app.stop(); }
});

test('las mesas del restaurante propio usan los platos del menú guardado', async () => {
  const app = await startApp();
  try {
    const api = await login(app, 'ana');
    const early = await api('POST', '/api/mesas/generar', { restauranteId: 'propio' });
    assert.equal(early.status, 409);
    assert.equal(early.data.error, 'menu_incompleto');
    await api('POST', '/api/mesas/menu', { platos: [{ plato: 'Ribeye', categoria: 'principal' }] });
    assert.equal((await api('POST', '/api/mesas/generar', { restauranteId: 'propio' })).status, 409, 'con un solo principal no alcanza');
    const home0 = (await api('GET', '/api/mesas')).data.propio;
    assert.deepEqual([home0.disponible, home0.listo, home0.platos], [true, false, 1]);
    await api('POST', '/api/mesas/menu', { csv: CSV });
    assert.equal((await api('GET', '/api/mesas')).data.propio.listo, true);
    const names = new Set(['Grilled Salmon', 'Ribeye']);
    const seen = new Set();
    for (let i = 0; i < 25; i++) {
      const out = await generar(api, { modo: 'libre', restauranteId: 'propio' });
      assert.equal(out.mesa.restauranteId, 'propio');
      assert.equal(out.mesa.restaurante.id, 'propio');
      assert.ok(names.has(out.mesa.menuFacts.main), `plato fuera de la carta: ${out.mesa.menuFacts.main}`);
      assert.equal(out.mesa.menuFacts.restaurant, 'Tu restaurante');
      assert.doesNotMatch(JSON.stringify(out.mesa), /undefined|\[object/);
      seen.add(out.mesa.menuFacts.main);
      if (out.mesa.steps.some((s) => s.say.en.includes('Ribeye') || s.guest.en.includes('Ribeye'))) seen.add('usa-ribeye');
    }
    assert.ok(seen.has('Ribeye') && seen.has('Grilled Salmon'), 'salen los dos platos de la carta');
    // En un Turno también, y el local del Turno queda fijo.
    const turno = await generar(api, { restauranteId: 'propio' });
    assert.equal(turno.turno.restauranteId, 'propio');
    // Si el menú se vacía a medias, el siguiente turno avisa en vez de romper.
    await api('DELETE', '/api/mesas/menu');
    assert.equal((await api('POST', '/api/mesas/generar', {})).status, 409);
  } finally { await app.stop(); }
});

test('de la carta a las mesas: cocción, guarniciones, alérgenos y situaciones que no encajan', () => {
  const { platos } = validarPlatos(csvAPlatos(CSV).platos);
  const need = requisitosMenu(platos);
  assert.equal(need.listo, true);
  assert.equal(requisitosMenu(platos.slice(2)).listo, false);
  const rest = restauranteDesdeMenu(platos);
  const ribeye = rest.menu.mains.find((m) => m.en === 'Ribeye');
  assert.equal(ribeye.temp, true, 'carne: se pregunta el punto');
  assert.equal(ribeye.side, true, 'hay guarniciones y es un plato de carne');
  assert.equal(rest.menu.mains.find((m) => m.en === 'Grilled Salmon').temp, false);
  assert.deepEqual(rest.menu.allergies.map((a) => a.en).sort(), ['dairy', 'eggs', 'fish', 'gluten']);
  assert.equal(rest.menu.desserts.length, 2, 'con un solo postre se completa para «We have X and Y»');
  assert.equal(rest.menu.desserts[0].en, 'Key Lime Pie');
  assert.ok(rest.exclude.includes('vino'), 'sin vinos no hay situación de vino');
  assert.ok(rest.exclude.includes('bebidas'), 'sin alcohol no hay situación de solo bebidas');
  assert.ok(!rest.exclude.includes('mal_cocido'));
  assert.equal(rest.veggie.en, 'Caesar Salad', 'el único plato sin carne');
  const rng = seeded(3);
  for (let i = 0; i < 200; i++) {
    const mesa = buildMesa(rng, { done: 20, restaurant: rest });
    assert.ok(!['vino', 'aniversario', 'bebidas', 'desayuno', 'happy_hour'].includes(mesa.scene), mesa.scene);
  }
  const veg = buildMesa(rng, { scene: 'vegetariano', restaurant: rest });
  assert.match(veg.steps[1].say.en, /Caesar Salad has no meat|Our Caesar Salad has no meat/);
});

// ───────────────────────── Migraciones (SQLite real, PostgreSQL con base simulada) ─────────────────────────

test('SQLite: una base v3 gana la tabla de menús sin perder nada', () => {
  const dir = mkdtempSync(join(tmpdir(), 'e47-menu-'));
  const path = join(dir, 'v3.db');
  const first = openDb(path);
  first.prepare("INSERT INTO users (username, display_name, password_hash, role, created_at) VALUES ('ana','Ana','x','student','2026-11-01')").run();
  first.exec('DROP TABLE menu_items; PRAGMA user_version = 3;');
  first.close();
  const db = openDb(path);
  assert.equal(SCHEMA_VERSION, 4);
  assert.equal(db.prepare('PRAGMA user_version').get().user_version, 4);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM users').get().n, 1, 'la cuenta sigue ahí');
  assert.deepEqual(db.prepare("SELECT name FROM sqlite_master WHERE name='menu_items'").all().length, 1);
  db.prepare("INSERT INTO menu_items (user_id, name, name_key, category, created_at) VALUES (1,'Pizza','pizza','principal','2026-11-01')").run();
  assert.throws(() => db.prepare("INSERT INTO menu_items (user_id, name, name_key, category, created_at) VALUES (1,'Pizza','pizza','principal','2026-11-01')").run(), 'no se repite un plato');
  assert.throws(() => db.prepare("INSERT INTO menu_items (user_id, name, name_key, category, created_at) VALUES (1,'X','x','cualquiera','2026-11-01')").run(), 'la categoría está acotada');
  db.close();
});

test('PostgreSQL (simulado): la migración 002 se aplica en orden, una sola vez, y el servidor arranca con v1 o v2', async () => {
  const run = async (version) => {
    const sqls = [];
    const versions = [];
    const db = {
      transaction: async (fn) => fn(),
      lock: async () => {},
      query: async (sql, values) => {
        if (/max\(version\)/.test(sql)) return { rows: [{ v: version }] };
        if (/INSERT INTO english47\.schema_versions/.test(sql)) versions.push(values[0]);
        else sqls.push(sql);
        return { rows: [] };
      },
    };
    await installSchema(db);
    return { sqls, versions };
  };
  assert.equal(LATEST_SCHEMA, 2);
  const fresh = await run(null);
  assert.deepEqual(fresh.versions, [1, 2]);
  assert.ok(fresh.sqls.some((s) => s.includes('CREATE TABLE IF NOT EXISTS users')) && fresh.sqls.some((s) => s.includes('english47.menu_items')));
  const upgrade = await run(1);
  assert.deepEqual(upgrade.versions, [2], 'desde la v1 solo agrega la tabla');
  assert.ok(upgrade.sqls.every((s) => !s.includes('CREATE TABLE IF NOT EXISTS users')), 'no toca las tablas existentes');
  assert.deepEqual((await run(2)).versions, [], 'idempotente');
  await assert.rejects(run(3), /no compatible/);
  const verify = (v) => verifySchema({ query: async () => ({ rows: [{ v }] }) });
  await verify(1);
  await verify(2);
  await assert.rejects(verify(3));
  await assert.rejects(verify(null));
  const sql = readFileSync(new URL('../server/storage/002-menus.sql', import.meta.url), 'utf8');
  assert.doesNotMatch(sql, /\b(DROP|TRUNCATE|DELETE FROM|ALTER TABLE)\b/i, 'solo agrega');
  assert.match(readFileSync(new URL('../scripts/supabase-setup.sql', import.meta.url), 'utf8'), /INSERT INTO schema_versions VALUES \(1\), \(2\);/);
  // Las funciones de menú avisan si falta la migración en vez de romper.
  const pg = (v) => ({ dialect: 'postgres', prepare: () => ({ get: async () => ({ v }) }) });
  assert.equal(await menusDisponibles(pg(1)), false);
  assert.equal(await menusDisponibles(pg(2)), true);
});

test('el contrato de la API está documentado: cada ruta de Mesas aparece en docs/reforma/31-api-mesas.md', () => {
  const doc = readFileSync(new URL('../docs/reforma/31-api-mesas.md', import.meta.url), 'utf8');
  for (const route of ['GET /api/mesas', 'POST /api/mesas/generar', 'POST /api/mesas/:id/turno', 'POST /api/mesas/:id/terminar', 'GET /api/mesas/menu', 'POST /api/mesas/menu', 'DELETE /api/mesas/menu/:id', 'DELETE /api/mesas/menu', 'POST /api/voz/evaluar']) {
    assert.ok(doc.includes(route), `falta ${route}`);
  }
  assert.match(doc, /pg_dump/);
  assert.match(doc, /002-menus\.sql/);
});
