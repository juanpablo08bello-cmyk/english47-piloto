// Convierte el texto del menú público de Ceviches by Divino (art/menu-divino/menu.txt) en content/divino-platos.js.
// Uso: node scripts/importar-divino.mjs   (el texto sale de la web del restaurante con server/menu-import.js)
import { readFileSync, writeFileSync } from 'node:fs';

const lines = readFileSync(new URL('../art/menu-divino/menu.txt', import.meta.url), 'utf8')
  .split('\n').map((s) => s.trim().replace(/&#x27;/g, "'").replace(/​/g, '')).filter(Boolean);

const SECCIONES = { Tapas: 'entrada', 'Rolls & Pokes': 'principal', Ceviches: 'principal', Entrees: 'principal', 'Kids Menu': 'principal',
  Beverages: 'bebida', Cocktails: 'alcohol', Wines: 'vino', Beers: 'alcohol', Desserts: 'postre' };
const VARIANTES = new Set(['Regular', 'Mixed Fish & Seafood', 'Beef', 'Chicken', 'Shrimp', 'Tuna', 'Vegetarian', 'Seafood', 'Amazonico (Pork and Sweet plantain)', 'Glass', 'Bottle', 'Add Salmon', 'Add Chicken']);
const FIN = 'Sun - Thu';

const platos = [];
let seccion = null; let item = null; let etiqueta = null;
const start = lines.indexOf('Tapas');
for (const l of lines.slice(start)) {
  if (l.startsWith(FIN)) break;
  if (SECCIONES[l] && l !== 'Ceviches' || (l === 'Ceviches' && !item?.name?.includes('Ceviche'))) {
    if (SECCIONES[l]) { seccion = l; item = null; etiqueta = null; continue; }
  }
  if (l.startsWith('$')) {
    const price = Number(l.replace(/[^0-9.]/g, ''));
    if (etiqueta) { item.variantes.push({ etiqueta, precio: price }); if (item.precio == null) item.precio = price; etiqueta = null; } else if (item && item.precio == null) item.precio = price;
    continue;
  }
  if (item && item.precio != null && VARIANTES.has(l)) { etiqueta = l; continue; }
  if (item && item.precio == null && VARIANTES.has(l)) { etiqueta = l; continue; }
  if (item && item.variantes.length && item.precio != null && l === item.name) continue;
  if (!item || item.precio != null) {
    item = { seccion, name: l, desc: [], precio: null, variantes: [] };
    platos.push(item); continue;
  }
  item.desc.push(l);
}

const out = platos.map((p) => {
  const side = /^Side /.test(p.name);
  const categoria = side ? 'guarnicion' : SECCIONES[p.seccion];
  return { plato: p.name.replace(/\s+/g, ' ').slice(0, 60), categoria, descripcion: p.desc.join(' ').replace(/\s+/g, ' '), precio: p.precio, variantes: p.variantes, seccion: p.seccion };
});
writeFileSync(new URL('../content/divino-platos.js', import.meta.url), '// Generado por scripts/importar-divino.mjs desde la carta pública. No editar a mano.' + String.fromCharCode(10) + 'export const DIVINO_PLATOS = ' + JSON.stringify(out, null, 1) + ';' + String.fromCharCode(10));
const por = {}; out.forEach((p) => { por[p.categoria] = (por[p.categoria] || 0) + 1; });
console.log(out.length, por);
const raros = out.filter((p) => p.precio == null || !p.descripcion && !['bebida'].includes(p.categoria));
console.log('sin precio o sin descripción:', raros.map((p) => p.plato));
