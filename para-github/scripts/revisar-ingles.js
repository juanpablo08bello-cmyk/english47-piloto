// Revisión del inglés del catálogo: escáner mecánico sobre TODO el contenido + muestra aleatoria para leer.
//   node scripts/revisar-ingles.js            -> escáner completo y resumen
//   node scripts/revisar-ingles.js --muestra 50   -> además imprime 50 expresiones y 40 frases al azar
import { VOCAB } from '../content/vocab.js';

const frasesMod = await import('../content/frases.js').catch(() => null);
const FRASES = frasesMod?.FRASES ?? frasesMod?.default ?? [];

const textos = [];
for (const v of VOCAB) for (const k of ['en', 'phrase', 'guest', 'reply']) if (v[k]) textos.push({ id: v.id, k, t: String(v[k]) });
for (const f of FRASES) for (const k of ['en', 'text', 'frase']) if (f[k]) textos.push({ id: f.id ?? '?', k: 'frase.' + k, t: String(f[k]) });

const reglas = [
  [/\s{2,}/, 'espacios dobles'],
  [/(^|[\s"'(])i($|[\s'.,!?])/, '«i» suelta en minúscula (debe ser I)'],
  [/\b(\w+) \1\b/i, 'palabra repetida'],
  [/\s[,.!?;:]/, 'espacio antes de la puntuación'],
  [/[,.!?;:](?=[A-Za-z])/, 'falta espacio tras la puntuación'],
  [/\bdont\b|\bcant\b|\bwont\b|\bim\b|\bive\b/i, 'apóstrofo omitido'],
  [/\b(a)\s+[aeiou]\w+/i, '«a» ante vocal (¿an?)'],
  [/\ban\s+[bcdfghjklmnpqrstvwxyz]\w+/i, '«an» ante consonante (¿a?)'],
  [/\balot\b|\bthier\b|\brecieve\b|\bdefinately\b|\boccured\b|\bseperate\b|\bwich\b/i, 'falta ortográfica típica'],
];
const hallazgos = [];
for (const x of textos) for (const [re, msg] of reglas) {
  const m = x.t.match(re);
  if (!m) continue;
  // «a hour», «an hour»: excepciones con h muda y u/eu sonando consonante
  if (msg.startsWith('«a» ante vocal') && /\ba (university|uniform|unit|one|european|useful|usual|user)\b/i.test(x.t)) continue;
  if (msg.startsWith('«an» ante consonante') && /\ban (hour|honest|honor|heir|MBA|FBI|X)\b/i.test(x.t)) continue;
  hallazgos.push(`${msg}: [${x.id}.${x.k}] ${x.t}`);
}
console.log(`Textos revisados: ${textos.length} (expresiones: ${VOCAB.length}, frases: ${FRASES.length})`);
console.log(`Hallazgos mecánicos: ${hallazgos.length}`);
hallazgos.slice(0, 40).forEach((h) => console.log('  ' + h));

const n = Number(process.argv[process.argv.indexOf('--muestra') + 1] || 0);
if (n) {
  let seed = 47; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const pick = (arr, k) => [...arr].sort(() => rnd() - 0.5).slice(0, k);
  console.log('\n--- MUESTRA expresiones (en | es | phrase | guest → reply) ---');
  pick(VOCAB, n).forEach((v) => console.log(`${v.id}: ${v.en} | ${v.es} | ${v.phrase} | ${v.guest} → ${v.reply}`));
  console.log('\n--- MUESTRA frases ---');
  pick(FRASES, 40).forEach((f) => console.log(JSON.stringify(f).slice(0, 220)));
}
