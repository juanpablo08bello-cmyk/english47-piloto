// Ceviches by Divino Miami Beach: la carta real (content/divino-platos.js, generada desde su web) lista para Mesas.
import { DIVINO_PLATOS } from './divino-platos.js';
import { DIVINO_ES } from './divino-es.js';

export const DIVINO_ID = 'divino';

// Alérgenos que se deducen de los ingredientes ESCRITOS en la carta. El restaurante debe confirmarlos antes de usarlos con clientes.
const REGLAS = [
  ['shellfish', /shrimp|camaron|squid|calamar|calamari|mussel|octopus|pulpo|seafood|mariscos|jalea/i],
  ['fish', /corvina|salmon|tuna|\bfish\b|pescado|mercado|jalea|parihuela|ceviche/i],
  ['egg', /egg whites|mayo|tartar|cheesecake|pavlova|cake|picarones/i],
  ['soy', /soy sauce|chaufa|nikkei|edamame|lomo saltado/i],
  ['sesame', /sesame/i],
  ['gluten', /panko|breaded|croquetas|crispy|chicharron|cake|biscuit|doughnuts|jalea|beer|cerveza/i],
  ['dairy', /cheesecake|ice cream|dulce de leche|cream|caramel|mousse/i],
];
const alergenos = (p) => REGLAS.filter(([, re]) => re.test(`${p.plato} ${p.descripcion}`)).map(([c]) => c);
const corto = (text, max = 160) => (text.length <= max ? text : `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}.`);

/** Platos con la forma de «Mi carta»: { plato, categoria, descripcion, alergenos, precio } + es y esDesc para estudiar. */
export const DIVINO_MENU = DIVINO_PLATOS.map((p) => {
  const [es, esDesc] = DIVINO_ES[p.plato] ?? [p.plato, ''];
  return {
    plato: p.plato, categoria: p.categoria, descripcion: corto(p.descripcion), alergenos: ['bebida', 'alcohol', 'vino'].includes(p.categoria) ? [] : alergenos(p),
    precio: p.precio, variantes: p.variantes, seccion: p.seccion, es, esDesc,
  };
});

// Secciones de la carta, en el orden del menú del restaurante.
export const DIVINO_SECCIONES = [...new Set(DIVINO_MENU.map((p) => p.seccion))].map((nombre) => ({ nombre, platos: DIVINO_MENU.filter((p) => p.seccion === nombre).length }));

/** Borrador de demostración (máximo 60 platos, repartidos por categoría) para probar «Mi carta» sin IA. */
export function demoDivino(max = 60) {
  const cupo = { entrada: 12, principal: 28, guarnicion: 2, bebida: 6, alcohol: 6, vino: 2, postre: 4 };
  const usados = {};
  const platos = DIVINO_MENU.filter((p) => { usados[p.categoria] = (usados[p.categoria] ?? 0) + 1; return usados[p.categoria] <= (cupo[p.categoria] ?? 0); })
    .slice(0, max).map((p) => ({ plato: p.plato, categoria: p.categoria, descripcion: p.descripcion, alergenos: p.alergenos, precio: p.precio }));
  return { platos, total: platos.length };
}
