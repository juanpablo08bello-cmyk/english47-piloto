// Muestra reproducible para revision linguistica: N entradas por categoria, siempre las mismas.
// Uso: node scripts/muestra-linguistica.js 3
import { VOCAB } from '../content/vocab.js';
import { CATEGORIES } from '../content/categories.js';

const perCategory = Number(process.argv[2] ?? 3);
for (const category of CATEGORIES) {
  const items = VOCAB.filter((v) => v.category === category);
  console.log(`\n## ${category} (${items.length})`);
  const step = Math.max(1, Math.floor(items.length / perCategory));
  for (let i = 1; i < items.length && i <= step * perCategory; i += step) {
    const v = items[i];
    console.log(`- ${v.id} | ${v.en} = ${v.es}\n  S: ${v.phrase}\n  C: ${v.guest}\n  R: ${v.reply}`);
  }
}
