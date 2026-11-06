// Comprobacion determinista de una orden: asocia cada dato a su plato y usa el estado final.
// No basta con nombrar los platos. Una especificacion es:
//  { items: [{ label, names, qty, temp, remove, add, forbid, side }], nameOptional }
//  remove: [{ label, word }]   debe aparecer negado: «no onions», «hold the onions»
//  add:    [{ label, words }]  debe aparecer sin negar
//  forbid: [{ label, words }]  no puede quedar pedido: «instead of fries» y «no fries» si valen
//  side:   [{ label, word }]   debe ir aparte: «dressing on the side»
import { findPhrase, tokens } from './text.js';

const NUMBERS = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };
const TEMPS = ['medium rare', 'medium well', 'well done', 'rare', 'medium'].map((t) => tokens(t));
const NEGATORS = new Set(['no', 'not', 'without', 'never', 'skip', 'minus']);
const STOPPERS = new Set(['and', 'but', 'with', 'plus', 'actually', 'then', '|']);

function allAt(ws, phrase) {
  const out = [];
  for (let i = 0; i + phrase.length <= ws.length; i++) {
    if (phrase.every((w, j) => ws[i + j] === w)) out.push(i);
  }
  return out;
}

/** Estado de una palabra en el segmento. Si aparece varias veces, manda la ultima mencion. */
function wordState(seg, word) {
  const phrase = tokens(word);
  const hits = allAt(seg, phrase);
  if (!hits.length) return 'absent';
  const at = hits[hits.length - 1];
  // '|' marca la puntuacion: una negacion no cruza a la siguiente parte de la frase.
  const before = seg.slice(Math.max(0, at - 4), at);
  if (before.join(' ').endsWith('instead of')) return 'replaced';
  if (before.join(' ').endsWith('hold the') || before[before.length - 1] === 'hold') return 'negated';
  if (before.join(' ').endsWith('leave off') || before.join(' ').endsWith('leave off the') || before.join(' ').endsWith('take off the')) return 'negated';
  for (let i = before.length - 1; i >= Math.max(0, before.length - 2); i--) {
    if (STOPPERS.has(before[i])) break;
    if (NEGATORS.has(before[i])) return 'negated';
  }
  // «fries for salad»: en un cambio, lo que se sustituye es lo primero que se nombra tras swap.
  const swap = seg.lastIndexOf('swap', at);
  if (swap >= 0 && at > swap && at <= swap + 3 && seg.slice(at + phrase.length, at + phrase.length + 1)[0] === 'for') return 'replaced';
  return 'present';
}

function finalTemp(seg) {
  let found = null;
  for (let i = 0; i < seg.length; i++) {
    const match = TEMPS.find((t) => t.every((w, j) => seg[i + j] === w));
    if (!match) continue;
    const before = seg.slice(Math.max(0, i - 1), i);
    if (!before.some((w) => NEGATORS.has(w))) found = match.join(' ');
    i += match.length - 1;
  }
  return found;
}

function segments(ws, items, nameOptional) {
  const marks = [];
  for (const item of items) {
    for (const name of item.names) {
      for (const at of allAt(ws, tokens(name))) marks.push({ at, item, size: tokens(name).length });
    }
  }
  marks.sort((a, b) => a.at - b.at);
  if (!marks.length && nameOptional && items.length === 1) return new Map([[items[0], ws]]);
  const out = new Map();
  marks.forEach((mark, i) => {
    let start = mark.at;
    // Modificador antepuesto: «one chicken linguine».
    const prior = ws[mark.at - 1];
    const knownWords = (mark.item.add ?? []).flatMap((a) => a.words);
    if (prior && knownWords.includes(prior)) start -= 1;
    const nextAt = marks[i + 1]?.at ?? ws.length;
    let end = nextAt;
    const nextPrior = marks[i + 1] && ws[nextAt - 1];
    const nextKnown = marks[i + 1] ? (marks[i + 1].item.add ?? []).flatMap((a) => a.words) : [];
    if (nextPrior && nextKnown.includes(nextPrior)) end -= 1;
    const seg = ws.slice(start, end);
    out.set(mark.item, [...(out.get(mark.item) ?? []), ...seg]);
    const qtyWord = ws[start - 1];
    if (qtyWord in NUMBERS) mark.item.lastQty = NUMBERS[qtyWord];
  });
  return out;
}

// Los avisos se arman con etiquetas del catalogo: «el ribeye», «los espárragos», «papas».
const de = (label) => (label.startsWith('el ') ? `del ${label.slice(3)}` : `de ${label}`);
const capitalized = (text) => text[0].toUpperCase() + text.slice(1);
function isPlural(label) {
  const first = label.split(' ')[0];
  return first === 'los' || first === 'las' || (first !== 'el' && first !== 'la' && first.endsWith('s'));
}
const missing = (label) => `${isPlural(label) ? 'Faltaron' : 'Faltó'} ${label}`;

export function checkOrder(text, spec) {
  const ws = String(text ?? '').split(/[.,;:!?]+/).flatMap((part) => [...tokens(part), '|']);
  const problems = [];
  const items = spec.items.map((i) => ({ ...i }));
  const segs = segments(ws, items, spec.nameOptional);
  for (const item of items) {
    const seg = segs.get(item);
    if (!seg) {
      problems.push(`${missing(item.label)}.`);
      continue;
    }
    if (item.qty && item.qty > 1 && item.lastQty !== item.qty) problems.push(`Revisa la cantidad ${de(item.label)}: son ${item.qty}.`);
    if (item.qty === 1 && item.lastQty > 1) problems.push(`Revisa la cantidad ${de(item.label)}: es ${item.label.startsWith('el ') ? 'uno solo' : 'una sola'}.`);
    if (item.temp) {
      const temp = finalTemp(seg);
      if (!temp) problems.push(`Faltó el término ${de(item.label)}: ${item.temp}.`);
      else if (temp !== item.temp) problems.push(`El término final ${de(item.label)} es ${item.temp}, no ${temp}.`);
    }
    for (const r of item.remove ?? []) {
      const state = wordState(seg, r.word);
      if (state === 'present') problems.push(`${capitalized(item.label)} va ${r.label}, y tu frase dice lo contrario.`);
      else if (state === 'absent') problems.push(`Faltó aclarar que ${item.label} va ${r.label}.`);
    }
    for (const a of item.add ?? []) {
      if (!a.words.some((w) => wordState(seg, w) === 'present')) problems.push(`${missing(a.label)} en ${item.label}.`);
    }
    for (const f of item.forbid ?? []) {
      if (f.words.some((w) => wordState(seg, w) === 'present')) problems.push(`${capitalized(item.label)} no lleva ${f.label}: ${isPlural(f.label) ? 'se cambiaron' : 'se cambió'}.`);
    }
    for (const s of item.side ?? []) {
      const word = tokens(s.word);
      const at = findPhrase(seg, word);
      const after = at >= 0 ? seg.slice(at + word.length, at + word.length + 5).join(' ') : '';
      if (at < 0 || !/\b(on the side|apart|separately|separate)\b/.test(after)) problems.push(`Faltó confirmar ${s.label} aparte en ${item.label}.`);
    }
  }
  return { ok: problems.length === 0, problems };
}
