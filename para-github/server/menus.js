// Menú propio: el gerente o alumno escribe o pega su carta y las mesas del «restaurante propio» usan esos platos.
// Solo texto plano, con límites estrictos. Cada consulta lleva user_id: nadie más lee ese menú (ni la administración).
// Pendiente (ver docs/reforma/31-api-mesas.md): compartirlo con los meseros del mismo restaurante. Hoy no existe la
// relación restaurante-alumno en la base, así que no se comparte nada.
import { RESTAURANTE_BASE, RESTAURANTE_POR_ID, RESTAURANTE_PROPIO } from '../content/restaurantes.js';
import { DIVINO_ID, DIVINO_MENU } from '../content/divino.js';

export const MAX_PLATOS = 60;
export const MAX_NOMBRE = 60;
export const MAX_DESCRIPCION = 160;
export const MAX_CSV = 20000;
const MAX_FILAS_CSV = 120;

export const CATEGORIAS = {
  entrada: ['entrada', 'entradas', 'starter', 'starters', 'appetizer', 'appetizers', 'aperitivo'],
  principal: ['principal', 'principales', 'plato principal', 'plato fuerte', 'main', 'mains', 'main course', 'entree', 'entrees'],
  guarnicion: ['guarnicion', 'guarniciones', 'acompanamiento', 'acompanamientos', 'side', 'sides'],
  postre: ['postre', 'postres', 'dessert', 'desserts'],
  bebida: ['bebida', 'bebidas', 'drink', 'drinks', 'beverage', 'beverages', 'refresco', 'refrescos'],
  alcohol: ['alcohol', 'cocktail', 'cocktails', 'coctel', 'cocteles', 'cerveza', 'cervezas', 'beer', 'beers', 'licor', 'trago', 'tragos'],
  vino: ['vino', 'vinos', 'wine', 'wines'],
};
const CATEGORIA_POR_ALIAS = new Map(Object.entries(CATEGORIAS).flatMap(([id, aliases]) => aliases.map((a) => [a, id])));

// Alérgenos que la carta puede declarar. La mesa «Alergia seria» los usa; el servidor nunca promete que un plato sea seguro.
export const ALERGENOS = {
  nuts: { en: 'nuts', es: 'las nueces', alias: ['nuts', 'nueces', 'frutos secos', 'tree nuts'] },
  peanuts: { en: 'peanuts', es: 'el maní', alias: ['peanuts', 'peanut', 'mani', 'cacahuate', 'cacahuates', 'cacahuetes'] },
  shellfish: { en: 'shellfish', es: 'los mariscos', alias: ['shellfish', 'mariscos', 'marisco', 'crustaceos'] },
  fish: { en: 'fish', es: 'el pescado', alias: ['fish', 'pescado'] },
  gluten: { en: 'gluten', es: 'el gluten', alias: ['gluten', 'trigo', 'wheat'] },
  dairy: { en: 'dairy', es: 'los lácteos', alias: ['dairy', 'lacteos', 'lactosa', 'milk', 'leche'] },
  egg: { en: 'eggs', es: 'el huevo', alias: ['egg', 'eggs', 'huevo', 'huevos'] },
  soy: { en: 'soy', es: 'la soya', alias: ['soy', 'soya', 'soja'] },
  sesame: { en: 'sesame', es: 'el ajonjolí', alias: ['sesame', 'ajonjoli', 'sesamo'] },
};
const ALERGENO_POR_ALIAS = new Map(Object.entries(ALERGENOS).flatMap(([id, a]) => a.alias.map((x) => [x, id])));

const plain = (text) => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
// Texto plano: letras, números y la puntuación normal de una carta. Sin HTML, sin entidades, sin controles.
const ALLOWED = /^[\p{L}\p{N}\p{M} .,;:'’"“”!?¡¿()/&+%#*–—\-·$€@]*$/u;

function cleanText(value, max, label) {
  if (value !== undefined && value !== null && typeof value !== 'string' && typeof value !== 'number') return { error: `${label}: debe ser texto.` };
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (text.length > max) return { error: `${label}: máximo ${max} caracteres (tiene ${text.length}).` };
  if (/[<>]/.test(text) || /&#?\w+;/.test(text)) return { error: `${label}: solo texto plano, sin HTML.` };
  if (/\p{C}/u.test(text)) return { error: `${label}: tiene caracteres no permitidos.` };
  if (!ALLOWED.test(text)) return { error: `${label}: tiene caracteres no permitidos. Usa letras, números y puntuación normal.` };
  return { text };
}

function parsePrice(value) {
  if (value === undefined || value === null || value === '') return { cents: null };
  const raw = typeof value === 'number' ? String(value) : String(value).trim().replace(/^\$/, '').replace(/\s/g, '');
  if (raw === '') return { cents: null };
  if (!/^\d{1,4}([.,]\d{1,2})?$/.test(raw)) return { error: 'Precio: usa un número como 12 o 12.50 (hasta 9999.99).' };
  return { cents: Math.round(Number(raw.replace(',', '.')) * 100) };
}

function parseAllergens(value) {
  if (value === undefined || value === null || value === '') return { codes: [] };
  const parts = Array.isArray(value) ? value : String(value).split(/[,;|/]| y /i);
  const codes = [];
  for (const part of parts) {
    const key = plain(part);
    if (!key) continue;
    const code = ALERGENO_POR_ALIAS.get(key) ?? (Object.hasOwn(ALERGENOS, key) ? key : null);
    if (!code) return { error: `Alérgenos: «${String(part).slice(0, 30)}» no se reconoce. Usa: ${Object.keys(ALERGENOS).join(', ')}.` };
    if (!codes.includes(code)) codes.push(code);
  }
  return { codes };
}

/** Valida una lista de platos {plato, categoria, descripcion, alergenos, precio}. No toca la base de datos. */
export function validarPlatos(lista) {
  const problemas = [];
  const platos = [];
  if (!Array.isArray(lista)) return { ok: false, platos, problemas: [{ fila: 0, campo: 'platos', mensaje: 'Envía una lista de platos.' }] };
  const vistos = new Set();
  lista.forEach((raw, i) => {
    const fila = i + 1;
    const falla = (campo, mensaje) => { if (problemas.length < 20) problemas.push({ fila, campo, mensaje }); };
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) { falla('plato', 'Cada plato debe ser un objeto.'); return; }
    const name = cleanText(raw.plato ?? raw.nombre, MAX_NOMBRE, 'Plato');
    const description = cleanText(raw.descripcion, MAX_DESCRIPCION, 'Descripción');
    const category = CATEGORIA_POR_ALIAS.get(plain(raw.categoria));
    const allergens = parseAllergens(raw.alergenos);
    const price = parsePrice(raw.precio);
    let bad = false;
    if (name.error) { falla('plato', name.error); bad = true; } else if (!/\p{L}/u.test(name.text)) { falla('plato', 'Plato: escribe el nombre del plato.'); bad = true; }
    if (description.error) { falla('descripcion', description.error); bad = true; }
    if (!category) { falla('categoria', `Categoría: usa ${Object.keys(CATEGORIAS).join(', ')}.`); bad = true; }
    if (allergens.error) { falla('alergenos', allergens.error); bad = true; }
    if (price.error) { falla('precio', price.error); bad = true; }
    if (bad) return;
    const key = plain(name.text);
    if (vistos.has(key)) { falla('plato', `«${name.text}» está repetido.`); return; }
    vistos.add(key);
    platos.push({ plato: name.text, categoria: category, descripcion: description.text, alergenos: allergens.codes, precio: price.cents === null ? null : price.cents / 100, key, cents: price.cents });
  });
  return { ok: problemas.length === 0, platos, problemas };
}

// --- CSV pegado: plato, categoría, descripción, alérgenos, precio. Acepta coma, punto y coma o tabulador, con o sin encabezado. ---
function splitCsv(text, delimiter) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1; } else if (ch === '"') quoted = false; else cell += ch;
    } else if (ch === '"' && cell === '') quoted = true;
    else if (ch === delimiter) { row.push(cell); cell = ''; } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell); cell = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return { rows, unclosed: quoted };
}

const HEADERS = {
  plato: ['plato', 'nombre', 'dish', 'name'], categoria: ['categoria', 'category'], descripcion: ['descripcion', 'description'],
  alergenos: ['alergenos', 'allergens', 'alergias'], precio: ['precio', 'price'],
};
const ORDER = ['plato', 'categoria', 'descripcion', 'alergenos', 'precio'];

/** Convierte el CSV en la misma lista de platos que recibe validarPlatos. */
export function csvAPlatos(csv) {
  if (typeof csv !== 'string') return { error: 'El CSV debe ser texto.' };
  if (csv.length > MAX_CSV) return { error: `El CSV es demasiado largo (máximo ${MAX_CSV} caracteres).` };
  const text = csv.replace(/^﻿/, '');
  const first = text.split(/\r?\n/).find((l) => l.trim()) ?? '';
  const count = (d) => first.split(d).length - 1;
  const delimiter = [';', '\t', ','].sort((a, b) => count(b) - count(a))[0];
  const { rows, unclosed } = splitCsv(text, delimiter);
  if (unclosed) return { error: 'El CSV tiene unas comillas sin cerrar.' };
  if (!rows.length) return { error: 'El CSV está vacío.' };
  let columns = ORDER;
  let body = rows;
  const head = rows[0].map(plain);
  if (head.some((h) => HEADERS.plato.includes(h)) && head.some((h) => HEADERS.categoria.includes(h))) {
    columns = head.map((h) => ORDER.find((k) => HEADERS[k].includes(h)) ?? null);
    body = rows.slice(1);
  }
  if (body.length > MAX_FILAS_CSV) return { error: `El CSV tiene demasiadas filas (máximo ${MAX_PLATOS} platos).` };
  const platos = [];
  for (const [i, row] of body.entries()) {
    if (row.length > columns.length && row.slice(columns.length).some((c) => c.trim())) return { error: `Fila ${i + 1}: hay más columnas de las esperadas (${ORDER.join(', ')}).` };
    const dish = {};
    columns.forEach((key, j) => { if (key) dish[key] = row[j] ?? ''; });
    platos.push(dish);
  }
  return { platos };
}

// --- Base de datos ---
let pgListo = false;
/** SQLite siempre la tiene. PostgreSQL solo después de aplicar server/storage/002-menus.sql. */
export async function menusDisponibles(db) {
  if (db.dialect !== 'postgres' || pgListo) return true;
  const row = await db.prepare('SELECT max(version) v FROM schema_versions').get();
  pgListo = Number(row?.v) >= 2;
  return pgListo;
}

const publicDish = (r) => ({
  id: r.id, plato: r.name, categoria: r.category, descripcion: r.description,
  alergenos: r.allergens ? r.allergens.split(',') : [], precio: r.price_cents === null || r.price_cents === undefined ? null : r.price_cents / 100,
});

export async function listarMenu(db, userId) {
  const rows = await db.prepare('SELECT id, name, category, description, allergens, price_cents FROM menu_items WHERE user_id=? AND restaurant_id=? ORDER BY sort_order, id').all(userId, RESTAURANTE_PROPIO);
  return rows.map(publicDish);
}

/** Guarda platos ya validados. 'reemplazar' sustituye todo el menú; 'agregar' suma y reemplaza los que tengan el mismo nombre. Máximo 60. */
export async function guardarPlatos(db, userId, platos, modo, now, { dryRun = false } = {}) {
  const existing = modo === 'agregar' ? await db.prepare('SELECT id, name_key, sort_order FROM menu_items WHERE user_id=? AND restaurant_id=?').all(userId, RESTAURANTE_PROPIO) : [];
  const incoming = new Set(platos.map((p) => p.key));
  const kept = existing.filter((r) => !incoming.has(r.name_key));
  if (kept.length + platos.length > MAX_PLATOS) return { error: 'too_many', message: `Un menú tiene como máximo ${MAX_PLATOS} platos (quedarían ${kept.length + platos.length}).` };
  if (dryRun) return { ok: true };
  if (modo === 'agregar') {
    for (const r of existing.filter((x) => incoming.has(x.name_key))) await db.prepare('DELETE FROM menu_items WHERE id=? AND user_id=?').run(r.id, userId);
  } else {
    await db.prepare('DELETE FROM menu_items WHERE user_id=? AND restaurant_id=?').run(userId, RESTAURANTE_PROPIO);
  }
  const start = kept.reduce((n, r) => Math.max(n, r.sort_order + 1), 0);
  const stamp = new Date(now).toISOString();
  for (const [i, p] of platos.entries()) {
    await db.prepare('INSERT INTO menu_items (user_id, restaurant_id, sort_order, name, name_key, category, description, allergens, price_cents, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(userId, RESTAURANTE_PROPIO, start + i, p.plato, p.key, p.categoria, p.descripcion, p.alergenos.join(','), p.cents, stamp);
  }
  return { ok: true };
}

export async function borrarPlato(db, userId, id) {
  const out = await db.prepare('DELETE FROM menu_items WHERE id=? AND user_id=? AND restaurant_id=?').run(id, userId, RESTAURANTE_PROPIO);
  return out.changes > 0;
}

export async function borrarMenu(db, userId) {
  const out = await db.prepare('DELETE FROM menu_items WHERE user_id=? AND restaurant_id=?').run(userId, RESTAURANTE_PROPIO);
  return out.changes;
}

// --- De la carta a las mesas ---
const MEAT = /\b(beef|steak|ribeye|filet|sirloin|strip|tenderloin|burger|hamburger|chicken|pork|ham|bacon|sausage|lamb|duck|turkey|fish|salmon|snapper|tuna|shrimp|lobster|crab|meat|ribs)\b/i;
const NEEDS_TEMP = /\b(beef|steak|ribeye|filet|sirloin|strip|tenderloin|burger|hamburger)\b/i;
const L = (en, es) => ({ en, es });
const first = (text) => text.split(/\s+/)[0].toLowerCase();

/** Lo que falta para jugar con este menú. Se necesitan al menos dos platos principales: así hay con qué cambiar el pedido. */
export function requisitosMenu(platos) {
  const principales = platos.filter((p) => p.categoria === 'principal').length;
  const faltan = [];
  if (principales < 2) faltan.push(`Necesitas al menos 2 platos principales (tienes ${principales}).`);
  return { listo: faltan.length === 0, principales, faltan };
}

/** Convierte los platos guardados en un «local» con la misma forma que los de content/restaurantes.js. */
export function restauranteDesdeMenu(platos) {
  const base = RESTAURANTE_POR_ID.get(RESTAURANTE_BASE).menu;
  const of = (cat) => platos.filter((p) => p.categoria === cat);
  const simple = (p) => ({ en: p.plato, es: p.plato, word: first(p.plato) });
  const withDefault = (items, fallback) => (items.length ? items.map(simple) : fallback);
  const hasSides = of('guarnicion').length > 0;
  const mains = of('principal').map((p) => {
    const text = `${p.plato} ${p.descripcion}`;
    return {
      ...simple(p), temp: NEEDS_TEMP.test(p.plato), side: hasSides && MEAT.test(text),
      how: p.descripcion ? L(p.descripcion, `(Tu carta) ${p.descripcion}`) : L('It is one of our house dishes.', 'Es uno de los platos de la casa.'),
    };
  });
  const wines = of('vino').map(simple);
  const alcohol = [...of('alcohol').map(simple), ...wines];
  const desserts = of('postre').map(simple);
  // «We have X and Y» necesita dos postres: si la carta trae uno, se completa con los de siempre.
  const sweets = desserts.length >= 2 ? desserts : [...desserts, ...base.desserts.filter((d) => !desserts.some((x) => plain(x.en) === plain(d.en)))].slice(0, 2);
  const allergenCodes = [...new Set(platos.flatMap((p) => p.alergenos))];
  const veggie = [...of('principal'), ...of('entrada')].find((p) => !MEAT.test(`${p.plato} ${p.descripcion}`));
  const exclude = ['desayuno', 'happy_hour'];
  if (!alcohol.length) exclude.push('bebidas', 'happy_hour');
  if (!wines.length) exclude.push('vino', 'aniversario');
  if (!mains.some((m) => m.temp)) exclude.push('mal_cocido');
  if (!veggie) exclude.push('vegetariano');
  return {
    id: RESTAURANTE_PROPIO, nombre: 'Tu restaurante', local: 'Tu restaurante', blurb: 'Tu propia carta', sala: 'sala_steakhouse',
    exclude: [...new Set(exclude)], boost: {},
    veggie: veggie ? { en: veggie.plato, es: veggie.plato } : undefined,
    menu: {
      mains,
      starters: withDefault(of('entrada'), base.starters),
      sides: withDefault(of('guarnicion'), base.sides),
      drinks: withDefault(of('bebida'), base.drinks),
      wines: wines.length ? wines : base.wines,
      alcohol: alcohol.length ? alcohol : base.alcohol,
      desserts: sweets,
      temps: base.temps,
      allergies: allergenCodes.length ? allergenCodes.map((c) => ({ en: ALERGENOS[c].en, es: ALERGENOS[c].es })) : base.allergies,
    },
  };
}

// --- Ceviches by Divino Miami Beach: carta real, siempre abierta (content/divino.js) ---
const STOP = new Set(['ceviche', 'ceviches', 'de', 'con', 'the', 'side', 'with', 'and', 'our', 'en', 'del']);
const keyWord = (name) => {
  const tokens = plain(name).replace(/\(.*?\)/g, ' ').split(/[^a-z0-9ñ]+/).filter(Boolean);
  return tokens.find((t) => !STOP.has(t) && t.length > 2) ?? tokens[0] ?? name.toLowerCase();
};
const firstSentence = (text) => { const s = text.split(/(?<=\.)\s/)[0].replace(/\.$/, ''); return `${s.length > 120 ? `${s.slice(0, 119).replace(/\s+\S*$/, '')}` : s}.`; };

/** El «local» de Mesas para Ceviches by Divino, con la misma forma que los de content/restaurantes.js. */
export function restauranteDivino() {
  const menu = DIVINO_MENU;
  const of = (cat) => menu.filter((p) => p.categoria === cat);
  const dish = (p) => ({ en: p.plato.replace(/\s*\(.*?\)\s*/g, ' ').trim(), es: p.es, word: keyWord(p.plato) });
  const seen = new Set();
  const mains = of('principal').map((p) => ({ ...dish(p), temp: false, side: false, how: L(firstSentence(p.descripcion), p.esDesc) }))
    .filter((m) => { const k = plain(m.en); if (seen.has(k)) return false; seen.add(k); return true; });
  const wines = of('vino').map(dish);
  const alcohol = [...of('alcohol').map(dish), ...wines];
  const base = RESTAURANTE_POR_ID.get(RESTAURANTE_BASE).menu;
  const codes = [...new Set(menu.flatMap((p) => p.alergenos))].filter((c) => ALERGENOS[c]);
  return {
    id: DIVINO_ID, nombre: 'Ceviches by Divino', local: 'Ceviches by Divino Miami Beach', blurb: 'Cocina peruana en Collins Ave: ceviches, pokes y pisco', sala: 'sala_divino',
    desbloqueo: { mesas: 0, nivel: 1 }, exclude: ['desayuno', 'happy_hour', 'mal_cocido'], boost: { recomendar: 3, alergia: 2, bebidas: 2 },
    veggie: { en: 'Ceviche Vegetariano', es: 'el ceviche vegetariano' },
    menu: {
      mains, starters: of('entrada').map(dish), sides: of('guarnicion').map(dish), drinks: of('bebida').map(dish), wines, alcohol,
      desserts: of('postre').map(dish), temps: base.temps, allergies: codes.map((c) => ({ en: ALERGENOS[c].en, es: ALERGENOS[c].es })),
    },
  };
}
