// Revisión de CÓMO se arma la frase: orden, piezas que faltan y errores típicos de quien habla español.
// Es una revisión por reglas sobre lo que el reconocimiento de voz entendió: explica cada error con un ejemplo,
// no inventa errores que no puede ver y nunca castiga el acento. Lo que no reconoce no lo da por perfecto.
import { normalize, tokens, typoKind } from './text.js';
import { VIP_BY_ID } from '../content/diccionario.js';

const NUMBER_WORDS = { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten' };
// Palabras que en el restaurante significan lo mismo: decir una u otra no cambia la construcción.
export const SAME_MEANING = { bathroom: 'restroom', washroom: 'restroom', toilet: 'restroom', bill: 'check', hello: 'hi', hey: 'hi', yeah: 'yes', yep: 'yes', certainly: 'sure', absolutely: 'sure', definitely: 'sure', bring: 'get', grab: 'get', fetch: 'get', apologize: 'sorry', apologies: 'sorry', pardon: 'sorry', second: 'moment', minute: 'moment', menus: 'menu', tables: 'table', drinks: 'drink', beverage: 'drink', thanks: 'thank', meal: 'food', dish: 'food', quickly: 'fast', quick: 'fast', kids: 'children', cook: 'chef', ask: 'check', see: 'check' };
export const FILLERS = new Set(['um', 'uh', 'umm', 'uhh', 'hmm', 'mmm', 'ah', 'eh', 'er', 'oh']);

export const speechTokens = (text) => tokens(normalize(text).replace(/\bokay\b/g, 'ok')).map((w) => NUMBER_WORDS[w] ?? w);
export const sense = (text) => speechTokens(text).filter((w) => !FILLERS.has(w)).map((w) => SAME_MEANING[w] ?? w);

// Piezas pequeñas: no cambian el tema, pero sin ellas la frase queda mal armada.
const FUNCTION = new Set(['a', 'an', 'the', 'is', 'am', 'are', 'was', 'were', 'be', 'do', 'does', 'did', 'will', 'would', 'can', 'could', 'may', 'should', 'have', 'has', 'to', 'of', 'for', 'in', 'on', 'at', 'with', 'i', 'you', 'we', 'he', 'she', 'it', 'they', 'me', 'us', 'your', 'my', 'our', 'this', 'that', 'there', 'and', 'or', 'not', 'some', 'any']);
const DETERMINERS = new Set(['a', 'an', 'the', 'your', 'my', 'our', 'this', 'that', 'some', 'any']);
const SUBJECTS = new Set(['i', 'you', 'we', 'they', 'he', 'she', 'it']);
const SINGULAR = new Set(['he', 'she', 'it']);
const MODALS = new Set(['will', 'would', 'can', 'could', 'should', 'may', 'might', 'must']);
const AUX_BEFORE_BASE = new Set([...MODALS, 'do', 'does', 'did', 'to', 'let', 'please']);
const BE = new Set(['am', 'is', 'are']);
const CAUSATIVE = new Set(['make', 'let', 'have', 'help', 'see', 'watch', 'hear', 'does', 'did', 'will', 'would', 'can', 'could', 'should', 'may', 'might', 'must']);
const COUNTABLE = new Set(['check', 'table', 'menu', 'receipt', 'card', 'box', 'napkin', 'fork', 'knife', 'spoon', 'glass', 'plate', 'bill', 'reservation', 'pen', 'straw', 'refill', 'manager', 'highchair', 'booth']);
const NOW_VERBS = new Set(['bring', 'come', 'check', 'call', 'clean', 'fix']);
const WH = new Set(['what', 'where', 'when', 'how', 'which', 'why', 'who']);

// Formas de los verbos del diccionario: así se nota «did you liked» o «can helps».
const VERB_ROWS = VIP_BY_ID.get('verbos').rows;
const BASE = new Set(VERB_ROWS.map((r) => r.present));
const THIRD = new Map(VERB_ROWS.filter((r) => r.present !== 'be' && r.third !== r.present).map((r) => [r.third, r.present]));
const PAST = new Map(VERB_ROWS.flatMap((r) => r.past.split(' / ').filter((p) => p !== r.present).map((p) => [p, r.present])));
const ING = new Map(VERB_ROWS.map((r) => [r.ing, r.present]));
const VERB_FORMS = new Set([...BASE, ...THIRD.keys(), ...PAST.keys(), ...ING.keys(), ...BE, 'was', 'were', ...MODALS, 'has', 'does', 'did', "here's", 'let']);
const baseOf = (w) => THIRD.get(w) ?? PAST.get(w) ?? ING.get(w) ?? w;
const notBase = (w) => THIRD.has(w) || PAST.has(w) || ING.has(w);
// Tras «am/is/are» un verbo simple es el clásico «I am agree».
const BE_THEN_BASE = new Set(['agree', 'want', 'need', 'know', 'understand', 'prefer', 'think', 'have', 'go', 'come', 'remember', 'recommend']);
const SHORT_ADJ = { cheap: 'cheaper', fast: 'faster', big: 'bigger', hot: 'hotter', cold: 'colder', nice: 'nicer', small: 'smaller', long: 'longer', sweet: 'sweeter', fresh: 'fresher', quick: 'quicker', good: 'better', bad: 'worse' };
const START_IS = new Set(['ready', 'very', 'so', 'too', 'delicious', 'good', 'great', 'fine', 'ok', 'here', 'possible', 'free', 'included', 'closed', 'open', 'hot', 'cold', 'spicy', 'available', 'perfect', 'correct', 'for']);
const YOO = /^(u[bcfgklmnprstv][aeiou]|uni|use|usu|eu|one|once)/;

const issue = (id, es) => ({ id, es });
const shown = (w) => (w === 'i' ? 'I' : w);

/**
 * Errores de construcción, de mayor a menor importancia. Se mira la frase como la dijo, sin corregirla.
 * Con puntuación (el texto que devuelve el reconocimiento) se revisa oración por oración.
 */
export function grammarIssues(text) {
  const out = [];
  const seen = new Set();
  const add = (x) => { if (!seen.has(x.id)) { seen.add(x.id); out.push(x); } };
  for (const sentence of String(text ?? '').split(/[.!?;]+/)) sentenceIssues(speechTokens(sentence).filter((w) => !FILLERS.has(w)), add);
  return out;
}

function sentenceIssues(t, add) {
  const prev = (i) => t[i - 1] ?? '';
  for (let i = 0; i < t.length; i++) {
    const w = t[i]; const n = t[i + 1] ?? ''; const n2 = t[i + 2] ?? '';
    // Verbo «to be» con su sujeto.
    if (w === 'i' && (n === 'is' || n === 'are')) add(issue('be-i', 'Con «I» va «am»: I am…'));
    if (['you', 'we', 'they'].includes(w) && n === 'is') add(issue('be-plural', `Con «${w}» va «are»: ${w} are…`));
    if (['you', 'we', 'they'].includes(w) && n === 'was') add(issue('be-plural-past', `Con «${w}» va «were»: ${w} were…`));
    if (SINGULAR.has(w) && (n === 'am' || n === 'are')) add(issue('be-single', `Con «${w}» va «is»: ${w} is…`));
    if (w === 'people' && n === 'is') add(issue('people', '«People» es plural: people are…'));
    // Tercera persona: he/she/it llevan -s, los demás no. Tras do/can/will el verbo va simple.
    // «it» después de un verbo o preposición es complemento («I found it, thank you»), no sujeto.
    const objectSpot = VERB_FORMS.has(prev(i)) || ['to', 'for', 'with', 'of', 'about', 'on', 'in', 'at', 'from', 'like'].includes(prev(i));
    if (SINGULAR.has(w) && !objectSpot && !AUX_BEFORE_BASE.has(prev(i)) && !CAUSATIVE.has(prev(i))) {
      if (n === 'have') add(issue('has', `Con «${w}» va «has»: ${w} has…`));
      else if (n === 'do' && n2 === 'not') add(issue('doesnt', `Con «${w}» va «does not»: ${w} doesn't…`));
      else if (BASE.has(n) && !['be', 'let'].includes(n) && !BE.has(prev(i)) && !WH.has(prev(i))) add(issue('third-s', `Con «${w}» el verbo lleva -s: ${w} ${VERB_ROWS.find((r) => r.present === n).third}…`));
    }
    if (['i', 'you', 'we', 'they'].includes(w) && (THIRD.has(n) || n === 'has' || n === 'does') && !['what', 'who'].includes(prev(i))) {
      add(issue('no-s', `Con «${w}» el verbo va sin -s: ${w} ${n === 'has' ? 'have' : n === 'does' ? 'do' : THIRD.get(n)}…`));
    }
    // Modales: «can to», «will brings».
    if (MODALS.has(w) && (n === 'to' || (SUBJECTS.has(n) && n2 === 'to')) && w !== 'ought') add(issue('modal-to', `Después de «${w}» no va «to»: ${w} ${SUBJECTS.has(n) ? `${n} ` : ''}help…`));
    else if (MODALS.has(w) && notBase(n) && !BE.has(n)) add(issue('modal-form', `Después de «${w}» va el verbo simple: ${w} ${baseOf(n)}`));
    else if (MODALS.has(w) && SUBJECTS.has(n) && notBase(n2)) add(issue('modal-form', `Después de «${w} ${n}» va el verbo simple: ${w} ${n} ${baseOf(n2)}`));
    // do/does/did + verbo simple.
    if (['do', 'does', 'did'].includes(w)) {
      const v = SUBJECTS.has(n) ? n2 : n === 'not' ? n2 : '';
      if (v && notBase(v) && !ING.has(v)) add(issue('did-base', `Con «${w}» el verbo va simple: ${w} ${SUBJECTS.has(n) ? `${n} ` : 'not '}${baseOf(v)}`));
    }
    // «I am agree», «are you agree».
    if (BE.has(w) && BE_THEN_BASE.has(n) && !(w === 'are' && n === 'welcome')) add(issue('be-base', `Sobra «${w}»: di «I ${n}», no «I ${w} ${n}».`));
    if (BE.has(w) && SUBJECTS.has(n) && BE_THEN_BASE.has(n2)) add(issue('be-base', `Para preguntar con «${n2}» se usa «do»: Do ${n} ${n2}…?`));
    // «I no have» → I don't have.
    if (SUBJECTS.has(w) && n === 'no' && (BASE.has(n2) || BE.has(n2))) add(issue('no-not', `Para negar se usa «don't»: ${w} don't ${n2}…`));
    // Preguntas sin auxiliar o con el orden de una afirmación.
    if (i === 0 && WH.has(w) && SUBJECTS.has(n) && n !== 'it' && n !== 'i') {
      if (MODALS.has(n2) || BE.has(n2)) add(issue('question-order', `En la pregunta el verbo va antes: ${w} ${n2} ${n}…?`));
      else if (BASE.has(n2)) add(issue('question-do', `Falta «do»: ${w} do ${n} ${n2}…?`));
    }
    // Sujeto que falta: «Is ready», «Is a pleasure».
    if (i === 0 && w === 'is' && (START_IS.has(n) || (n === 'a' && n2 === 'pleasure') || (n === 'my' && n2 === 'pleasure'))) add(issue('no-subject', 'Falta el sujeto: It is… (o: Is it…?)'));
    if (i === 0 && w === 'are' && n === 'ready') add(issue('no-subject', 'Falta el sujeto: Are you ready…?'));
    // Artículos.
    if (w === 'the' && ['your', 'my', 'our', 'his', 'her', 'their'].includes(n)) add(issue('the-poss', `Sobra «the»: ${n}…`));
    if (w === 'a' && /^[aeiou]/.test(n) && !YOO.test(n)) add(issue('a-an', `Antes de vocal va «an»: an ${n}`));
    if (w === 'an' && /^[^aeiou]/.test(n) && !/^(hour|honest|herb)/.test(n) && n) add(issue('a-an', `Antes de consonante va «a»: a ${n}`));
    // Comparativos y otras frases calcadas del español.
    if (w === 'more' && n in SHORT_ADJ) add(issue('comparative', `Se dice «${SHORT_ADJ[n]}», no «more ${n}».`));
    if (w === 'more' && ['better', 'cheaper', 'bigger', 'faster', 'worse'].includes(n)) add(issue('comparative', `Sobra «more»: ${n}.`));
    if ((w === 'explain' || w === 'say') && n === 'me') add(issue('to-me', w === 'say' ? 'Se dice «tell me», no «say me».' : 'Se dice «explain to me».'));
    if (['want', 'need'].includes(w) && n === 'that' && SUBJECTS.has(n2)) add(issue('want-that', `Se dice «I ${w} ${n2 === 'i' ? 'me' : n2} to…», sin «that».`));
    if (w === 'for' && ['drink', 'eat'].includes(n) && ['something', 'anything'].includes(prev(i))) add(issue('for-to', `Se dice «something to ${n}».`));
    if (w === 'like' && n === 'very' && n2 === 'much' && t[i + 3]) add(issue('very-much', '«Very much» va al final: I like it very much.'));
    if (w === 'here' && ['your', 'the'].includes(n) && !['over', 'right', 'from', 'in', 'out', 'come', 'is', 'are'].includes(prev(i))) add(issue('here-is', 'Falta «is»: Here is your…'));
    // Sustantivos contables sin artículo: «Here is check», «I need table».
    if (['is', 'bring', 'get', 'need', 'want', 'have', 'take', 'like'].includes(w) && COUNTABLE.has(n) && !(w === 'is' && i === 0)) add(issue('article', `Falta «the», «your» o «a»: ${w} the ${n}.`));
    // Lo que vas a hacer ahora va en futuro: «I bring the check» → I will bring.
    if (w === 'i' && NOW_VERBS.has(n) && !MODALS.has(prev(i)) && !['do', 'did', 'if', 'when', 'let'].includes(prev(i))) add(issue('future', `Para lo que vas a hacer: I will ${n}… (I'll ${n}…)`));
    if ((w === 'depend' || w === 'depends') && n === 'of') add(issue('depend-on', 'Se dice «depends on».'));
    if (w === 'how' && n === 'much' && (n2 === 'cost' || n2 === 'costs')) add(issue('how-much', 'Se dice «How much is it?» o «How much does it cost?»'));
  }
}

/** Alineación por palabras (con cambios de lugar) entre lo dicho y una forma correcta. */
function align(said, model) {
  const n = said.length; const m = model.length;
  const d = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  const cost = (a, b) => {
    if (a === b) return 0;
    if (typoKind(a, b) === 'safe') return 0.2;
    if (DETERMINERS.has(a) && DETERMINERS.has(b)) return 0.3;
    return 1;
  };
  for (let i = 0; i <= n; i++) d[i][0] = i * 0.6;
  for (let j = 1; j <= m; j++) d[0][j] = d[0][j - 1] + 1;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 0.6, d[i][j - 1] + 1, d[i - 1][j - 1] + cost(said[i - 1], model[j - 1]));
      if (i > 1 && j > 1 && said[i - 1] === model[j - 2] && said[i - 2] === model[j - 1] && said[i - 1] !== said[i - 2]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 0.8);
    }
  }
  // Recorrido inverso para saber qué faltó, qué sobró y qué cambió de lugar.
  const missing = []; const extra = []; const swaps = []; const changed = [];
  let i = n; let j = m;
  while (i > 0 || j > 0) {
    if (i > 1 && j > 1 && said[i - 1] === model[j - 2] && said[i - 2] === model[j - 1] && said[i - 1] !== said[i - 2] && Math.abs(d[i][j] - (d[i - 2][j - 2] + 0.8)) < 1e-9) { swaps.push([model[j - 2], model[j - 1]]); i -= 2; j -= 2; continue; }
    if (i > 0 && j > 0 && Math.abs(d[i][j] - (d[i - 1][j - 1] + cost(said[i - 1], model[j - 1]))) < 1e-9) { if (cost(said[i - 1], model[j - 1]) >= 1) changed.push([said[i - 1], model[j - 1]]); i -= 1; j -= 1; continue; }
    if (j > 0 && Math.abs(d[i][j] - (d[i][j - 1] + 1)) < 1e-9) { missing.push(model[j - 1]); j -= 1; continue; }
    extra.push(said[i - 1]); i -= 1;
  }
  const closeness = 1 - d[n][m] / Math.max(n, m, 1);
  return { closeness, missing: missing.reverse(), extra: extra.reverse(), swaps, changed };
}

/**
 * Nota de construcción (0 a 100) frente a las formas correctas del turno.
 * Si se parece a una de ellas, se revisa pieza por pieza; si armó su propia frase, se revisa con las reglas
 * y, como no hay forma de comprobarla del todo, no llega a 100.
 */
export function constructionScore(text, models = [], { guided = false } = {}) {
  const said = sense(text);
  const grammar = grammarIssues(text);
  if (!said.length) return { score: 0, issues: [issue('empty', 'No se entendió ninguna frase.')], model: models[0] ?? null, closeness: 0, own: false };
  const options = models.map((m) => ({ model: m, ...align(said, sense(m)) })).sort((a, b) => b.closeness - a.closeness);
  const best = options[0];
  const issues = [...grammar];
  let score = 100;
  const near = best && (guided || best.closeness >= 0.62);
  if (near) {
    const missF = best.missing.filter((w) => FUNCTION.has(w));
    const missC = best.missing.filter((w) => !FUNCTION.has(w));
    const extras = best.extra.filter((w) => !FILLERS.has(w));
    // En lectura, una palabra cambiada suele ser de pronunciación: eso lo mide la voz, no la frase.
    score -= grammar.length * 12 + missF.length * 14 + missC.length * (guided ? 14 : 8) + best.swaps.length * 14 + extras.length * 5 + best.changed.length * (guided ? 3 : 4);
    if (best.swaps.length) issues.push(issue('order', `Orden de las palabras: «${best.swaps[0].join(' ')}».`));
    if (grammar.length) { /* La regla ya explica lo que falta. */ } else if (missF.length) issues.push(issue('missing', `Te faltó «${missF.slice(0, 2).map(shown).join('», «')}». Mira: ${best.model}`));
    else if (missC.length && guided) issues.push(issue('missing', `Te faltó «${missC[0]}». Mira: ${best.model}`));
  } else {
    score -= grammar.length * 18;
    // Frase propia: que tenga un verbo cuando la situación lo pide.
    const needsVerb = models.some((m) => sense(m).some((w) => VERB_FORMS.has(w)) && sense(m).length > 3);
    const longModel = models.some((m) => sense(m).length > 4);
    if (longModel && said.length < 3) { score = Math.min(score, 70); issues.push(issue('short', 'Responde con una frase completa, no con una palabra.')); }
    else if (needsVerb && said.length > 2 && !said.some((w) => VERB_FORMS.has(w))) { score -= 15; issues.push(issue('no-verb', 'Arma la frase completa, con su verbo.')); }
    score = Math.min(score, 92);
  }
  return { score: Math.max(0, Math.round(score)), issues: issues.slice(0, 2), model: best?.model ?? null, closeness: best ? Math.round(best.closeness * 100) / 100 : 0, own: !near };
}
