// Diagnostico orientativo: no otorga un nivel oficial. Mide por separado tres areas
// y explica cada recomendacion. Las respuestas libres se valoran por intencion, no por palabras.
import { assessOpen, looksLikeNonsense } from '../server/evaluate.js';
import { checkOrder } from '../server/order.js';

const WHY = {
  1: 'recibir, confirmar reservas y acomodar a la mesa',
  2: 'ofrecer bebidas y aclarar opciones',
  3: 'explicar platos, ingredientes y preparación',
  4: 'tomar órdenes con términos y modificaciones',
  5: 'manejar alergias sin inventar garantías',
  6: 'revisar la mesa y anticipar lo que necesitan',
  7: 'resolver quejas y escalar cuando corresponde',
  8: 'cerrar la mesa, dividir la cuenta y despedir',
};

export const DIAGNOSTIC = [
  { id: 'c1', round: 1, skill: 'comprehension', type: 'listen', audio: 'Could I get the dressing on the side?', prompt: '¿Qué pide el cliente?', options: ['El aderezo aparte', 'Más ensalada', 'Otro plato', 'La cuenta'], answer: 'El aderezo aparte', unit: 4 },
  { id: 'c2', round: 1, skill: 'comprehension', type: 'listen', audio: 'We are in a bit of a hurry, we have a show at eight.', prompt: '¿Qué necesita esta mesa?', options: ['Servicio rápido', 'Cambiar de mesa', 'Una recomendación', 'Dividir la cuenta'], answer: 'Servicio rápido', unit: 6 },
  { id: 'c3', round: 1, skill: 'comprehension', type: 'listen', audio: 'I ordered this medium rare, and it came out well done.', prompt: '¿Cuál es el problema?', options: ['La carne está más cocida de lo pedido', 'La carne está cruda', 'Falta un acompañamiento', 'Trajeron otro plato'], answer: 'La carne está más cocida de lo pedido', unit: 7 },
  { id: 'v1', round: 1, skill: 'vocabulary', type: 'choice', prompt: 'El cliente quiere agua sin gas. ¿Qué le ofreces?', options: ['still water', 'sparkling water', 'side water', 'free water'], answer: 'still water', unit: 2 },
  { id: 'v2', round: 1, skill: 'vocabulary', type: 'choice', prompt: 'Completa: «The ribeye ___ with one side.»', options: ['comes', 'come', 'is coming to', 'have'], answer: 'comes', unit: 3 },
  { id: 'v3', round: 1, skill: 'vocabulary', type: 'choice', prompt: 'La mesa quiere pagar por separado. ¿Cuál frase usas?', options: ['Would you like me to split the check?', 'Do you want to break the bill?', 'Do you divide the account?', 'You pay separate?'], answer: 'Would you like me to split the check?', unit: 8 },
  { id: 'e1', round: 1, skill: 'expression', type: 'free', prompt: 'Un cliente dice: «Hi, a table for two, please.» ¿Qué le respondes en inglés?', spec: { reply: 'Good evening, welcome in. Do you have a reservation?', alt: 'Of course. Right this way, please.', intents: ['ask_reservation', 'ask_name', 'seat', 'greet'] }, unit: 1 },
  { id: 'e2', round: 1, skill: 'expression', type: 'free', prompt: 'Un cliente dice: «Does this have nuts? I am allergic.» ¿Qué le respondes en inglés?', spec: { reply: 'Thank you for telling me. Let me check with the kitchen.', alt: "I don't want to guess, so I will ask the chef and come right back.", required: ['check_kitchen'], hint: 'consultar con la cocina, sin garantizar nada' }, unit: 5 },
  { id: 'e3', round: 1, skill: 'expression', type: 'free', prompt: 'Terminaste de traer los platos. ¿Qué le dices a la mesa en inglés?', spec: { reply: 'Enjoy your meal. Can I get you anything else?', alt: 'Everything looks great. Please let me know if you need anything.', intents: ['offer_help', 'goodbye'], targets: ['enjoy your meal', 'enjoy', 'let me know'] }, unit: 6 },

  // Segunda ronda: solo si todo fue correcto. Separa lo basico de una mayor soltura.
  { id: 'c4', round: 2, skill: 'comprehension', type: 'listen', audio: "I'm good on the fries, but could you swap them for a small salad, and hold the onions?", prompt: '¿Qué quiere el cliente?', options: ['Cambiar las papas por ensalada, sin cebolla', 'Más papas y cebolla aparte', 'Una ensalada además de las papas', 'Quitar la ensalada y dejar las papas'], answer: 'Cambiar las papas por ensalada, sin cebolla', unit: 4 },
  { id: 'c5', round: 2, skill: 'comprehension', type: 'listen', audio: "Whenever you get a sec, we'll take the check. No rush, though.", prompt: '¿Qué significa?', options: ['Quieren la cuenta, pero sin prisa', 'Se van ya, de inmediato', 'Quieren ver otra vez el menú', 'Se quejan de la espera'], answer: 'Quieren la cuenta, pero sin prisa', unit: 8 },
  { id: 'v4', round: 2, skill: 'vocabulary', type: 'choice', prompt: 'El cliente pregunta si un plato toca aceite compartido con mariscos. ¿Qué término clave debes reconocer?', options: ['shared fryer', 'side plate', 'house sauce', 'to-go box'], answer: 'shared fryer', unit: 5 },
  { id: 'v5', round: 2, skill: 'vocabulary', type: 'choice', prompt: '¿Cuál suena más profesional para disculparte por una demora?', options: ['Thank you for your patience. Let me check on your food.', 'The kitchen is slow tonight, sorry.', 'Not my fault, wait a little.', 'Your food is coming, relax.'], answer: 'Thank you for your patience. Let me check on your food.', unit: 7 },
  { id: 'e4', round: 2, skill: 'expression', type: 'free', prompt: 'Un cliente dice: «This steak is well done. I asked for medium rare, and I think it should be free.» Responde en inglés.', spec: { reply: "I'm so sorry about that. I can have the kitchen remake it, and I'll get my manager to talk about the bill.", alt: "I apologize. Let me fix the steak right away and ask my manager about the check.", required: ['apologize', 'manager'], avoid: ['comp'], hint: 'disculparte, ofrecer corregirlo y llevar lo de la cuenta al gerente' }, unit: 7 },
  { id: 'e5', round: 2, skill: 'expression', type: 'free', prompt: 'Una clienta pidió: un ribeye medium rare con espárragos y una ensalada César con aderezo aparte. Confírmalo en inglés.', spec: { type: 'confirm', reply: 'Let me confirm your order: one ribeye, medium rare, with asparagus, and one Caesar salad with dressing on the side.', alt: 'So that is one ribeye medium rare with asparagus, and a Caesar with dressing on the side. Is that correct?', order: { items: [{ label: 'el ribeye', names: ['ribeye'], temp: 'medium rare', add: [{ label: 'los espárragos', words: ['asparagus'] }] }, { label: 'la ensalada César', names: ['caesar'], side: [{ label: 'el aderezo', word: 'dressing' }] }] } }, unit: 4 },
];

export function publicDiagnostic(round = 1) {
  return DIAGNOSTIC.filter((q) => q.round === round).map(({ answer, spec, unit, ...q }) => q);
}

function grade(q, given) {
  if (q.type !== 'free') return given === q.answer ? 'correct' : 'wrong';
  if (!given) return 'wrong';
  if (q.spec.order) return !looksLikeNonsense(given) && checkOrder(given, q.spec.order).ok ? 'correct' : 'wrong';
  const { status } = assessOpen(given, q.spec);
  if (status === 'correct') return 'correct';
  return status === 'needs_review' ? 'needs_review' : 'wrong';
}

function basisFor(meta, questions) {
  const modes = questions.filter((q) => q.skill === 'comprehension').map((q) => meta?.[q.id]);
  if (modes.length && modes.every((m) => m === 'audio')) return 'audio';
  if (modes.some((m) => m === 'read')) return 'read';
  return 'unknown';
}

/**
 * previous: resultado de la primera ronda, si esta es la segunda.
 * Devuelve puntajes por area, recomendaciones con motivo y una unidad de partida ajustable.
 */
export function scoreDiagnostic(answers, { round = 1, meta = null, previous = null } = {}) {
  const asked = DIAGNOSTIC.filter((q) => q.round === round);
  const graded = asked.map((q) => ({ q, grade: grade(q, String(answers?.[q.id] ?? '').trim()) }));
  // Cada pregunta cuenta una sola vez por ronda: reenviar una ronda la reemplaza.
  const prior = (previous?.graded ?? []).filter((g) => g.round !== round);
  const all = [...prior, ...graded.map((g) => ({ id: g.q.id, skill: g.q.skill, unit: g.q.unit, grade: g.grade, round }))];
  const skills = {};
  for (const skill of ['comprehension', 'vocabulary', 'expression']) {
    const items = all.filter((g) => g.skill === skill);
    skills[skill] = {
      correct: items.filter((g) => g.grade === 'correct').length,
      needsReview: items.filter((g) => g.grade === 'needs_review').length,
      total: items.length,
    };
  }
  const roundPerfect = graded.every((g) => g.grade === 'correct');
  const needsRound2 = round === 1 && roundPerfect;
  const misses = all.filter((g) => g.grade === 'wrong').map((g) => g.unit);
  const reviews = all.filter((g) => g.grade === 'needs_review').map((g) => g.unit);

  let recommended = [...new Set([...misses, ...reviews])].sort((a, b) => a - b).map((unit) => ({
    unit,
    why: `Conviene reforzar: ${WHY[unit]}. ${misses.includes(unit) ? 'Hubo una respuesta para repasar en este tema.' : 'Hubo una respuesta que las reglas no pudieron confirmar.'}`,
  }));
  let confident = false;
  if (!recommended.length) {
    // Todo correcto: no repetir lo basico. Se empieza donde hay mas riesgo real.
    confident = true;
    recommended = [
      { unit: 5, why: `Respondiste bien todo el diagnóstico. Empieza por ${WHY[5]}, donde un error tiene más consecuencias.` },
      { unit: 7, why: `Luego ${WHY[7]}, con simulaciones en modo «Como en el trabajo».` },
    ];
  }
  const out = {
    version: 2,
    round,
    skills,
    graded: all,
    recommended,
    confident,
    placementUnit: recommended[0].unit,
    needsRound2,
    comprehensionBasis: basisFor({ ...(previous?.meta ?? {}), ...(meta ?? {}) }, DIAGNOSTIC.filter((q) => q.round <= round)),
    meta: { ...(previous?.meta ?? {}), ...(meta ?? {}) },
    evaluated: 'local_rules',
  };
  return out;
}
