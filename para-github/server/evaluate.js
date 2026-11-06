// Evaluador local, sin IA. Separa significado, gramatica, cortesia y objetivo de servicio.
// Es conservador: cuando las reglas no bastan responde «needs_review» y no afirma nada.
// Nunca opina sobre pronunciacion.
import { compareWords, contentWords, findPhrase, keywordOverlap, normalize, similarity, tokens } from './text.js';
import { checkOrder } from './order.js';
import { VOCAB } from '../content/vocab.js';
import { SCENARIOS } from '../content/scenarios.js';
import { MENU } from '../content/menu.js';

const NEGATORS = new Set(['not', 'no', 'never', 'without', 'cannot', 'none', 'nothing', 'neither', 'nor']);
const WRAPPERS = new Set(['please', 'sir', 'maam', 'ma', 'am', 'the', 'a', 'an', 'ok', 'okay', 'sure', 'yes', 'thanks', 'thank', 'you', 'of', 'course', 'it', 'is', 'that', 'its', 'some', 'our']);
const COMMON = 'a about after again all also always am an and any anything are around as ask at back be because been before being best bit both bring but by call can cannot check come comes could day did do does done down each either else enjoy even every everything excuse few find first for from get give glad go going good got great had happy has have he hello help her here hi him his hold how i if in into is it just keep kind know later leave let like little look lot make many may maybe me might mine minute minutes moment more most much must my name need never new next nice night no not nothing now of off oh ok okay on one only or other our out over own people perfect please pleasure problem put quick ready really right same say see she should show so some someone something soon sorry start still such sure take tell thank thanks that the their them then there these they thing think this those time to today tonight too try two up us use very wait want was way we welcome well were what when where which while who why will with without would yes yet you your good evening morning afternoon sir maam ma am folks everyone table tables guest guests server order orders kitchen chef manager food drink drinks water menu check bill'.split(' ');

let lexiconCache = null;
function lexicon() {
  if (lexiconCache) return lexiconCache;
  const words = new Set(COMMON);
  const add = (text) => { for (const w of tokens(text)) words.add(w); };
  for (const v of VOCAB) [v.en, v.phrase, v.guest, v.reply, ...(v.alts ?? [])].forEach(add);
  for (const s of SCENARIOS) {
    add(s.guestFacts);
    for (const b of s.beats) [b.model, b.alt, b.hint, ...b.guest].forEach(add);
  }
  for (const d of MENU.dishes) [d.name, d.description, ...d.ingredients, ...d.mods].forEach(add);
  lexiconCache = words;
  return words;
}

// Intenciones de servicio. Solo cuentan si la frase no aparece negada.
export const INTENTS = {
  greet: /\b(welcome|good (evening|afternoon|morning)|hello|hi)\b/,
  ask_party: /\bhow many\b|\bparty of\b|\bfor how many\b/,
  ask_reservation: /\b(do|did) you have a reservation\b|\breservation\b/,
  ask_name: /\b(what|which) name\b|\bunder what\b|\byour name\b|\bname (is it|for|on)\b|\bmay i have (a|your|the) name\b/,
  seat: /\b(this way|follow me|right over here|table is ready|show you to|seat you|take you to)\b/,
  introduce: /\bmy name is\b|\bi am your server\b|\bi will be (your server|taking care|helping)\b|\btaking care of you\b/,
  offer_drink: /\b(something|anything) to drink\b|\bdrinks?\b.*\b(start|get|bring)\b|\b(start|get|bring)\b.*\b(drink|water|beverage)\b|\bstill or sparkling\b|\bsparkling or still\b/,
  offer_help: /\b(can|may|could) i (get|bring|help|offer|start)\b|\bwould you like\b|\banything else\b|\bwhat can i\b|\blet me know\b/,
  clarify: /\b(could|can|would) you (please )?(repeat|say)\b|\bsay that again\b|\brepeat that\b|\bone more time\b|\bdid you say\b|\bdo you mean\b|\b(did not|could not) (catch|hear|understand)\b|\bjust to (confirm|make sure|be sure|clarify)\b|\bwhich one\b|\bwhich (nuts?|side|dressing|kind)\b|\bwhat kind\b/,
  check_kitchen: /\b(check|ask|confirm|talk|speak|verify|double check|find out)\b.*\b(kitchen|chef|cook|cooks)\b|\b(kitchen|chef)\b.*\b(confirm|check|know)\b|\blet me (check|double check|ask|find out|confirm)\b|\bi will (check|ask|find out)\b/,
  no_guarantee: /\bcannot (guarantee|promise|confirm)\b|\b(am )?not sure\b|\bdo not want to (guess|promise)\b|\bdo not know\b|\bwant to be (sure|careful)\b/,
  thank_warning: /\bthank\b.*\b(telling|letting|for)\b|\bglad you told\b|\bappreciate\b/,
  apologize: /\b(sorry|apologi[sz]e|apologies)\b/,
  ask_what_happened: /\bwhat happened\b|\bwhat (is|seems) (wrong|to be)\b|\bwhat is the (problem|issue)\b|\btell me (more|what)\b/,
  fix: /\b(remake|re make|replace|make (you )?a new|new one|fix (it|that|this)|prepare a new|correct (it|that|this)|heat (it|that) up|warm (it|that) up|right away)\b/,
  manager: /\bmanager\b|\bsupervisor\b/,
  update_time: /\b(check on|taking longer|update|few more minutes|almost ready|should be out)\b/,
  confirm: /\blet me (confirm|repeat|read)\b|\bto confirm\b|\bso that is\b|\bso you (have|want|would like)\b|\bis that correct\b|\bis that right\b|\bi have\b/,
  ask_temp: /\bhow would you like\b.*\b(cooked|steak|that|it|done)\b|\bwhat temperature\b|\bhow do you want\b.*\bcooked\b|\b(rare|medium|well done)\b.*\bor\b/,
  explain: /\b(comes with|made with|served with|is grilled|is fried|is roasted|is topped|has|contains|includes)\b/,
  recommend: /\b(recommend|suggest|popular|favorite|i like|you might like)\b/,
  bring_soon: /\b(right back|right out|right away|bring (that|those|it|them|you)|be back|i will get|coming right up|i will have that)\b/,
  take_time: /\b(take your time|no rush|no hurry|few (more )?minutes|whenever you are ready)\b/,
  bring_check: /\b(check|bill)\b/,
  split: /\b(split|separate|evenly|by item|divide)\b/,
  goodbye: /\b(thank you for|thanks for|have a (great|good|nice|wonderful)|see you|good night|hope to see|take care)\b/,
  ask_preference: /\bwould you (like|prefer)\b|\bdo you (want|prefer)\b|\bwhich\b.*\b(prefer|like)\b/,
};

// Una duda solo cuenta en su propia afirmacion: «not sure about the price» no excusa «it is safe».
const HEDGE = /\b(cannot|not sure|do not know|will not|do not want to|not safe|may not)\b/;
const VIOLATIONS = [
  { id: 'guarantee', re: /\b(it is|it will be|that is|this is|you are|totally|completely|100%|100 percent|one hundred percent|perfectly|definitely)\b.*\bsafe\b|\bi (promise|guarantee)\b|\bguaranteed\b|\bno risk\b|\bdo not worry\b.*\b(allerg|nuts?|dairy|gluten|safe)\b/, hedged: true, note: 'No puedes garantizar seguridad alimentaria sin confirmarlo con cocina. Aunque suene segura, esta respuesta no cumple el servicio.' },
  { id: 'skip_kitchen', re: /\b(do not (ask|check|talk|tell|bother|call)|no need to|never|will not|not going to|there is no need to) ?.{0,24}\b(ask|check|talk|tell|bother|call|kitchen|chef)\b/, note: 'Tu frase evita consultar a cocina o al responsable, que es justo lo que el cliente necesita.' },
  { id: 'tip_invented', re: /\byou (have to|must|need to) (tip|leave)\b|\bmust tip\b/, note: 'La propina depende de la política del local: no la presentes como obligatoria.' },
];
const COMP = { id: 'comp', re: /\b(free|on the house|no charge|take (it|that) off|comp (it|that)|will not (pay|be charged)|do not have to pay)\b/, hedged: true, note: 'No prometas compensaciones que no puedes autorizar: el gerente lo decide.' };

const GRAMMAR = [
  // «let me know what you want» es una construccion subordinada valida: no lleva auxiliar.
  { re: /(?<!\b(?:know|tell me|understand|see|ask|sure|remember|hear|decide) )\bwhat you (want|like|need|have)\b/, note: 'Falta el auxiliar en la pregunta: «What would you like?».' },
  { re: /\bhow many (people )?you\b|\bhow many people you are\b/, note: 'El orden de la pregunta cambia: «How many in your party?».' },
  { re: /\blet me to\b/, note: 'Después de «let me» va el verbo sin «to»: «Let me check».' },
  { re: /\b(i will|i can|i would|can i|could i|will i) to\b/, note: 'Después de can, will o would va el verbo sin «to».' },
  { re: /\b(it|steak|ribeye|dish|salad|fish|burger|chicken|pasta|sauce) (come|have|contain|include)\b/, note: 'Con it o un plato en singular, el verbo lleva -s: «It comes with...».' },
  { re: /\bdo you wants?\b.*\bs\b|\byou wants\b/, note: 'Con you, el verbo no lleva -s.' },
  { re: /\bdid you (ordered|wanted|asked)\b/, note: 'Después de «did», el verbo va en forma base: «Did you order...?».' },
  { re: /\bmore better\b/, note: 'Se dice solo «better».' },
  { re: /\bpeoples\b/, note: '«People» ya es plural.' },
  { re: /\bi am agree\b/, note: 'Se dice «I agree».' },
  { re: /\bfor to\b/, note: 'No se usa «for to» en inglés: basta con «to».' },
  { re: /\bis (fries|potatoes)\b/, note: 'Con plural se usa «are».' },
];

const BLUNT = [
  { re: /(?<!\b(?:know|tell me|understand|see|ask|sure|remember|hear|decide) )\bwhat (do )?you want\b/, note: 'Comunica la intención, pero suena brusco. Prueba «What would you like?».' },
  { re: /(?<!\bif |\b(?:know|tell me|understand|see|ask|sure|remember|hear|decide) what )\byou want\b/, note: 'Se entiende, pero en este nivel de restaurante suena directo. Prueba «Would you like...?».' },
  { re: /\bgive me\b/, note: '«Give me» suena a orden. Mejor «May I have...?» o «Could I see...?».' },
  { re: /\b(wait here|hurry up|not my (problem|fault)|i do not care|shut up|that is your problem|you are wrong)\b/, note: 'Esta frase puede sonar ofensiva con un cliente. Cambia el tono y ofrece una salida.' },
];
const CASUAL = /\b(yeah|yep|nope|gonna|wanna|gimme|dude|guys|sup)\b/;
const POLITE = /\b(please|would|could|may i|can i|let me|sorry|apologize|thank|happy to|glad to|certainly|of course|i will|you are welcome|just a moment|one moment|i understand|i hear you|my pleasure)\b/;

export function politenessNote(answer) {
  const n = normalize(answer);
  return BLUNT.find((p) => p.re.test(n))?.note ?? null;
}

function grammarCheck(n) {
  const hit = GRAMMAR.find((g) => g.re.test(n));
  return hit ? { value: 'issue', note: hit.note } : { value: 'none_detected', note: null };
}

function courtesyCheck(n) {
  const blunt = BLUNT.find((p) => p.re.test(n));
  if (blunt) return { value: 'blunt', note: blunt.note };
  if (CASUAL.test(n)) return { value: 'casual', note: 'Suena informal para este nivel de servicio. Busca una forma más profesional.' };
  return { value: 'ok', note: null };
}

// Frases hechas con «no» o «not» que no niegan lo que sigue.
const IDIOMS = /\b(no problem|no worries|no rush|no hurry|not at all|not a problem|no thanks|not sure|do not know|no trouble)\b/g;
const CONJUNCTIONS = new Set(['so', 'but', 'and', 'then', 'because', 'however']);

/** Divide por puntuacion antes de normalizar: «No problem. Can I...» no es una negacion. */
export function clauses(text) {
  return String(text ?? '').split(/[.,;:!?]+/).map((c) => normalize(c).replace(IDIOMS, 'okay')).filter(Boolean);
}

/** Hay una negacion antes, en la misma clausula y sin una conjuncion de por medio. */
function negatedBefore(words) {
  for (let i = words.length - 1; i >= 0; i--) {
    if (CONJUNCTIONS.has(words[i])) return false;
    if (NEGATORS.has(words[i])) return true;
  }
  return false;
}

/** La frase aparece y no esta negada en su misma clausula. */
export function phrasePresent(text, phrase) {
  const t = tokens(phrase);
  const selfNegative = t.some((w) => NEGATORS.has(w));
  return clauses(text).some((c) => {
    const ws = c.split(' ');
    const at = findPhrase(ws, t);
    return at >= 0 && (selfNegative || !negatedBefore(ws.slice(0, at)));
  }) || (selfNegative && findPhrase(tokens(text), t) >= 0);
}

/** Coincide con la intencion solo si no esta negada en la misma clausula. */
export function intentPresent(text, intentId) {
  const re = INTENTS[intentId];
  if (!re) throw new Error(`Intencion desconocida: ${intentId}`);
  // Las intenciones de duda ya contienen su negacion.
  if (intentId === 'no_guarantee' || intentId === 'clarify') return re.test(normalize(text));
  return clauses(text).some((c) => {
    const m = c.match(re);
    if (!m) return false;
    return !negatedBefore(c.slice(0, m.index).split(' ').filter(Boolean));
  });
}

export const isKnownWord = (w) => lexicon().has(w);

/** Sin contenido: palabras desconocidas, o una palabra repetida aunque exista en el vocabulario. */
export function looksLikeNonsense(answer) {
  const ws = tokens(answer);
  if (!ws.length) return true;
  const lex = lexicon();
  const known = ws.filter((w) => lex.has(w) || /^\d+$/.test(w)).length;
  if (ws.length >= 2) {
    const counts = new Map();
    for (const w of ws) counts.set(w, (counts.get(w) ?? 0) + 1);
    const top = Math.max(...counts.values());
    if (top === ws.length || (ws.length >= 3 && top / ws.length >= 0.6)) return true;
  }
  return known / ws.length < 0.5;
}

/** Intento con intencion comunicativa: al menos dos palabras distintas y con sentido. */
export function isSubstantive(answer) {
  return !looksLikeNonsense(answer) && new Set(tokens(answer)).size >= 2;
}

/** Revisa cada afirmacion por separado. */
export function findViolation(text, avoid = []) {
  const list = [...VIOLATIONS, ...(avoid.includes('comp') ? [COMP] : [])];
  const parts = String(text ?? '').split(/[.,;:!?]+/).map(normalize).filter(Boolean);
  for (const part of parts) {
    const hit = list.find((v) => v.re.test(part) && !(v.hedged && HEDGE.test(part)));
    if (hit) return hit;
  }
  return null;
}

/** Una frase prohibida cuenta en cada afirmacion que no este matizada. */
export function rejectedBy(text, groups = []) {
  const parts = String(text ?? '').split(/[.,;:!?]+/).map(normalize).filter(Boolean);
  return groups.some((group) => group.every((phrase) => {
    const t = tokens(phrase);
    return parts.some((p) => findPhrase(p.split(' '), t) >= 0 && !HEDGE.test(p));
  }));
}

/** Niega la expresion objetivo: «not grilled», «do not take your time». */
function negatesTarget(text, targets) {
  const all = clauses(text);
  // Una variante que ya lleva negacion («no ice», «without ice») no se niega a si misma.
  if (targets.some((t) => t.some((w) => NEGATORS.has(w)) && all.some((c) => findPhrase(c.split(' '), t) >= 0))) return false;
  for (const target of targets) {
    if (target.some((w) => NEGATORS.has(w))) continue;
    const content = contentWords(target.join(' '));
    for (const c of all) {
      const ws = c.split(' ');
      const at = findPhrase(ws, target);
      const anchor = at >= 0 ? at : ws.findIndex((w) => content.includes(w));
      if (anchor >= 0 && negatedBefore(ws.slice(0, anchor))) return true;
    }
  }
  return false;
}

const DIM_TEXT = {
  meaning: { ok: 'Comunicaste la idea de servicio.', partial: 'Se entiende una parte de la idea.', unclear: 'No podemos confirmar con reglas si tu frase comunica la idea.', contradiction: 'Tu frase dice lo contrario de lo que hace falta.', none: 'No identificamos una respuesta relacionada con la situación.' },
};

function result({ status, level, expected, alt, meaning, grammar, courtesy, goal, change, meaningful = true, srs }) {
  return {
    correct: status === 'correct',
    status,
    level,
    expected,
    alt: alt ?? null,
    evaluated: 'local_rules',
    meaningful,
    srs: srs ?? (status === 'correct' ? 'pass' : status === 'needs_review' ? 'none' : 'fail'),
    dims: { meaning, grammar: grammar ?? 'not_evaluated', courtesy: courtesy ?? 'not_evaluated', goal: goal ?? 'not_evaluated' },
    feedback: {
      communicated: DIM_TEXT.meaning[meaning] ?? null,
      change: change ?? null,
      corrected: expected ?? null,
      natural: alt ?? null,
    },
    canRetry: status !== 'correct',
  };
}

/**
 * Recordar una expresion. Exige la expresion o una variante completa: una coincidencia
 * parcial nunca cuenta como acierto. entry: { en, alts, phrase, confusions }.
 */
export function assessExpression(answer, entry) {
  const expected = entry.en;
  const alt = entry.phrase;
  const ws = tokens(answer);
  const base = { level: 'use', expected, alt };
  if (!ws.length) return result({ ...base, status: 'review', meaning: 'none', meaningful: false, change: 'Escribe la expresión en inglés.' });
  const n = ws.join(' ');
  const targets = [entry.en, ...(entry.alts ?? [])].map(tokens);
  const stripped = ws.filter((w) => !WRAPPERS.has(w));
  const sameAs = (phrase) => {
    const t = tokens(phrase);
    const tStripped = t.filter((w) => !WRAPPERS.has(w));
    return t.join(' ') === n || (tStripped.length > 0 && tStripped.join(' ') === stripped.join(' '));
  };
  // Primero lo que se sabe que es distinto: contraste, ejemplo o termino relacionado.
  const hasTarget = targets.some((t) => findPhrase(ws, t) >= 0);
  const contrast = (entry.contrasts ?? []).find((c) => sameAs(c.wrong) || (!hasTarget && findPhrase(ws, tokens(c.wrong)) >= 0));
  if (contrast) return result({ ...base, status: 'review', meaning: 'contradiction', change: contrast.why });
  if ((entry.examples ?? []).some(sameAs)) {
    return result({ ...base, status: 'close', meaning: 'partial', srs: 'none', change: `Es un ejemplo, no la palabra general que se pide: «${expected}».` });
  }
  if ((entry.related ?? []).some(sameAs)) {
    return result({ ...base, status: 'close', meaning: 'partial', srs: 'none', change: `Está relacionado, pero no significa exactamente lo mismo que «${expected}».` });
  }
  if (negatesTarget(answer, targets)) return result({ ...base, status: 'review', meaning: 'contradiction', change: 'Tu respuesta niega la expresión que se pide.' });
  for (const t of targets) {
    if (sameAs(t.join(' '))) return result({ ...base, status: 'correct', meaning: 'ok' });
  }
  for (const t of targets) {
    const kind = compareWords(ws, t, isKnownWord);
    if (kind === 'safe') return result({ ...base, status: 'correct', meaning: 'ok', change: `Ortografía: se escribe «${t.join(' ')}».` });
    if (kind === 'doubtful') {
      return result({ ...base, status: 'needs_review', meaning: 'unclear', change: `Necesita revisión: se parece a «${t.join(' ')}», pero una letra distinta puede ser otra palabra.` });
    }
  }
  // La expresion dentro de una frase mas larga: solo es seguro si lo demas es relleno.
  const contained = targets.filter((t) => findPhrase(ws, t) >= 0);
  if (contained.length && contained.some((t) => t.length >= Math.min(2, targets[0].length))) {
    const longest = Math.max(...contained.map((t) => t.length));
    const at = contained.find((t) => t.length === longest);
    const rest = [...ws];
    rest.splice(findPhrase(ws, at), at.length);
    if (rest.every((w) => WRAPPERS.has(w))) return result({ ...base, status: 'correct', meaning: 'ok' });
    if (isSubstantive(answer)) return result({ ...base, status: 'needs_review', meaning: 'unclear', change: 'Incluye la expresión, pero con otras palabras que las reglas no pueden valorar.' });
  }
  if (looksLikeNonsense(answer)) return result({ ...base, status: 'review', meaning: 'none', meaningful: false, change: 'No parece una respuesta en inglés para esta situación.' });
  if (similarity(n, entry.en) >= 0.6) return result({ ...base, status: 'needs_review', meaning: 'unclear', change: 'Necesita revisión: se parece, pero podría cambiar el sentido. Compárala con la expresión.' });
  if (keywordOverlap(answer, entry.en) >= 0.5) return result({ ...base, status: 'needs_review', meaning: 'unclear', change: 'Tiene parte de la expresión. Puede ser una variante, pero las reglas no pueden confirmarlo.' });
  return result({ ...base, status: 'review', meaning: 'none', change: 'Esta no es la expresión que buscamos. Compárala y vuelve a intentarlo.' });
}

/**
 * Respuesta libre a un cliente.
 * spec: { targets, reply, alt, intents (basta una), required (todas), avoid }.
 * Palabras sueltas no bastan: hace falta una frase con intencion reconocible.
 */
export function assessOpen(answer, spec) {
  const expected = spec.reply;
  const alt = spec.alt ?? null;
  const ws = tokens(answer);
  const n = ws.join(' ');
  const base = { level: 'use', expected, alt };
  if (!ws.length) return result({ ...base, status: 'review', meaning: 'none', meaningful: false, change: 'Escribe o di una respuesta para el cliente.' });
  if (looksLikeNonsense(answer)) {
    return result({ ...base, status: 'review', meaning: 'none', goal: 'unmet', meaningful: false, change: 'No parece una respuesta en inglés para esta situación. Prueba con una frase corta.' });
  }
  const grammar = grammarCheck(n);
  const courtesy = courtesyCheck(n);
  const dims = { grammar: grammar.value, courtesy: courtesy.value };
  const violation = findViolation(answer, spec.avoid ?? []);
  if (violation) {
    return result({ ...base, ...dims, status: 'review', meaning: 'contradiction', goal: 'violated', change: violation.note });
  }
  // La respuesta modelo y su alternativa siempre son validas; las demas se valoran por intencion.
  const exact = [spec.reply, spec.alt].filter(Boolean).map(tokens).some((t) => t.join(' ') === n);
  const targets = (spec.targets ?? []).map(tokens).filter((t) => t.length);
  if (negatesTarget(answer, targets.filter((t) => findPhrase(ws, t) >= 0))) {
    return result({ ...base, ...dims, status: 'review', meaning: 'contradiction', goal: 'unmet', change: 'Tu frase niega justo lo que el cliente necesita oír.' });
  }
  const required = spec.required ?? [];
  const requiredMissing = exact ? [] : required.filter((id) => !intentPresent(answer, id));
  const anyIntent = (spec.intents ?? []).some((id) => intentPresent(answer, id));
  const phraseAt = (t) => phrasePresent(answer, t.join(' '));
  const phraseHit = targets.some((t) => t.length >= 2 && phraseAt(t)) || targets.some((t) => t.length === 1 && phraseAt(t) && ws.length >= 3);
  const goalMet = exact || (requiredMissing.length === 0 && (anyIntent || phraseHit || (required.length > 0 && !spec.intents?.length)));

  if (goalMet) {
    if (ws.length < 2) {
      return result({ ...base, ...dims, status: 'close', meaning: 'partial', goal: 'unmet', change: 'Una palabra sola no basta con un cliente: dilo en una frase completa.' });
    }
    if (courtesy.value !== 'ok' || grammar.value === 'issue') {
      return result({ ...base, ...dims, status: 'close', meaning: 'ok', goal: 'met', change: courtesy.note ?? grammar.note });
    }
    return result({ ...base, ...dims, status: 'correct', meaning: 'ok', goal: 'met' });
  }
  if (spec.hint && required.length && requiredMissing.length < required.length) {
    return result({ ...base, ...dims, status: 'close', meaning: 'partial', goal: 'unmet', change: spec.hint });
  }
  if (ws.length < 3) {
    return result({ ...base, ...dims, status: 'close', meaning: 'partial', goal: 'unmet', change: 'Una respuesta tan corta no permite saber si resuelves la situación. Dilo en una frase completa.' });
  }
  // Las reglas no alcanzan: puede ser una variante valida.
  const nearReply = spec.reply ? keywordOverlap(answer, spec.reply) : 0;
  return result({
    ...base, ...dims,
    status: 'needs_review',
    meaning: nearReply >= 0.4 ? 'partial' : 'unclear',
    goal: 'unclear',
    change: courtesy.note ?? grammar.note ?? (spec.hint ? `Necesita revisión. Comprueba que tu respuesta logre esto: ${spec.hint}` : 'Necesita revisión: puede ser una variante válida, pero las reglas no pueden confirmarlo. Compárala con el modelo.'),
  });
}

/** Reformular una frase brusca: debe conservar la intencion y sonar cortes. */
export function assessRephrase(answer, spec) {
  const out = assessOpen(answer, spec);
  const n = normalize(answer);
  if (out.status === 'review') return out;
  const blunt = normalize(spec.text);
  if (similarity(n, blunt) >= 0.85) {
    return result({ level: 'use', expected: spec.reply, alt: spec.alt, status: 'review', meaning: 'partial', grammar: out.dims.grammar, courtesy: 'blunt', goal: 'unmet', change: 'Es casi la misma frase. Cámbiala para que suene cortés.' });
  }
  if (out.status === 'correct' && !POLITE.test(n)) {
    return result({ level: 'use', expected: spec.reply, alt: spec.alt, status: 'close', meaning: 'ok', grammar: out.dims.grammar, courtesy: 'blunt', goal: 'met', change: 'La idea está, pero falta una fórmula de cortesía como «please», «would» o «let me».' });
  }
  return out;
}

/** Corregir un error: aceptar variantes listadas; el error original no puede seguir ahi. */
export function assessFix(answer, spec) {
  const ws = tokens(answer);
  const n = ws.join(' ');
  const base = { level: 'use', expected: spec.accept[0], alt: spec.accept[1] ?? null };
  if (!ws.length || looksLikeNonsense(answer)) return result({ ...base, status: 'review', meaning: 'none', meaningful: ws.length > 0, change: 'Escribe la frase corregida en inglés.' });
  if ((spec.bad ?? []).some((b) => n.includes(normalize(b)))) {
    return result({ ...base, status: 'review', meaning: 'partial', grammar: 'issue', change: spec.why });
  }
  if (spec.accept.some((a) => { const kind = compareWords(ws, tokens(a), isKnownWord); return kind === 'exact' || kind === 'safe'; })) {
    return result({ ...base, status: 'correct', meaning: 'ok', grammar: 'none_detected', change: spec.why });
  }
  return result({ ...base, status: 'needs_review', meaning: 'unclear', grammar: 'unclear', change: `Necesita revisión: ya no contiene el error, pero es otra formulación. ${spec.why}` });
}

/** Confirmar una orden: cada detalle debe estar presente y no negado. */
export function assessConfirm(answer, spec) {
  const ws = tokens(answer);
  const n = ws.join(' ');
  const base = { level: 'use', expected: spec.reply, alt: spec.alt };
  if (!ws.length || looksLikeNonsense(answer)) return result({ ...base, status: 'review', meaning: 'none', meaningful: false, change: 'Repite la orden en inglés con todos sus detalles.' });
  if (spec.order) {
    const courtesyOrder = courtesyCheck(n);
    const grammarOrder = grammarCheck(n);
    const dimsOrder = { grammar: grammarOrder.value, courtesy: courtesyOrder.value };
    const checked = checkOrder(answer, spec.order);
    if (!checked.ok) return result({ ...base, ...dimsOrder, status: 'close', meaning: 'partial', goal: 'unmet', change: checked.problems.slice(0, 3).join(' ') });
    if (courtesyOrder.value !== 'ok' || grammarOrder.value === 'issue') return result({ ...base, ...dimsOrder, status: 'close', meaning: 'ok', goal: 'met', change: courtesyOrder.note ?? grammarOrder.note });
    return result({ ...base, ...dimsOrder, status: 'correct', meaning: 'ok', goal: 'met' });
  }
  const missing = spec.details.filter((d) => !d.any.some((v) => {
    const t = tokens(v);
    const at = findPhrase(ws, t);
    return at >= 0 && !(!d.negative && ws.slice(Math.max(0, at - 2), at).some((w) => NEGATORS.has(w)));
  }));
  const courtesy = courtesyCheck(n);
  const grammar = grammarCheck(n);
  const dims = { grammar: grammar.value, courtesy: courtesy.value };
  if (missing.length === spec.details.length) return result({ ...base, ...dims, status: 'review', meaning: 'none', goal: 'unmet', change: 'No identificamos los detalles de la orden en tu respuesta.' });
  if (missing.length) {
    return result({ ...base, ...dims, status: 'close', meaning: 'partial', goal: 'unmet', change: `Faltó confirmar: ${missing.map((d) => d.label).join(', ')}.` });
  }
  if (courtesy.value !== 'ok' || grammar.value === 'issue') return result({ ...base, ...dims, status: 'close', meaning: 'ok', goal: 'met', change: courtesy.note ?? grammar.note });
  return result({ ...base, ...dims, status: 'correct', meaning: 'ok', goal: 'met' });
}

/** Preguntas cerradas: regla determinista. No se opina sobre lo que el alumno quiso comunicar. */
export function closedResult({ correct, expected, alt = null, note = null, level = 'recognize' }) {
  const out = result({ status: correct ? 'correct' : 'review', level, expected, alt, meaning: correct ? 'ok' : 'none', change: note });
  return {
    ...out,
    canRetry: false,
    dims: {},
    feedback: { communicated: null, change: note, corrected: null, answer: correct ? null : expected, natural: alt },
  };
}

export { result as buildResult };
