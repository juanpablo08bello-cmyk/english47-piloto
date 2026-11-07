// Situaciones para responder con tu propia voz: no se le dice al alumno qué decir, solo qué lograr.
// `need` son grupos de palabras: la respuesta cuenta si trae al menos una de cada grupo.
// Es una revisión por palabras clave: orienta, no entiende la frase como una persona.
const DRINK = [['a Coke', 'una Coca-Cola'], ['some water', 'agua'], ['an iced tea', 'un té helado'], ['a coffee', 'un café'], ['a lemonade', 'una limonada'], ['a beer', 'una cerveza'], ['a glass of wine', 'una copa de vino'], ['an orange juice', 'un jugo de naranja']];
const FOOD = [['the chicken', 'el pollo'], ['the salmon', 'el salmón'], ['the burger', 'la hamburguesa'], ['the ribeye', 'el ribeye'], ['the pasta', 'la pasta'], ['the shrimp', 'el camarón'], ['the soup', 'la sopa'], ['the Caesar salad', 'la ensalada César']];
const SIDE = [['fries', 'papas fritas'], ['rice', 'arroz'], ['a salad', 'una ensalada'], ['vegetables', 'verduras'], ['mashed potatoes', 'puré de papas']];
const THING = [['a fork', 'un tenedor'], ['a spoon', 'una cuchara'], ['a knife', 'un cuchillo'], ['some napkins', 'servilletas'], ['some ketchup', 'cátsup'], ['more bread', 'más pan'], ['some salt', 'sal'], ['a clean glass', 'un vaso limpio']];
const ALLERGY = [['nuts', 'nueces'], ['shellfish', 'mariscos'], ['milk', 'leche'], ['eggs', 'huevos'], ['wheat', 'trigo']];
const PEOPLE = [['two', 'dos'], ['three', 'tres'], ['four', 'cuatro'], ['five', 'cinco'], ['six', 'seis']];
const WRONG = [['too cold', 'está muy fría'], ['too salty', 'está muy salada'], ['not what I ordered', 'no es lo que pedí']];
const SLOTS = { drink: DRINK, food: FOOD, side: SIDE, thing: THING, allergy: ALLERGY, people: PEOPLE, wrong: WRONG };

const YES = ['sure', 'yes', 'yeah', 'course', 'certainly', 'absolutely', 'okay', 'ok', 'right', 'perfect', 'great', 'problem'];
const BRING = ['bring', 'get', 'back', 'away', 'moment', 'coming', 'minute', 'grab', 'here'];
const SORRY = ['sorry', 'apologize', 'apologies'];
const FIX = ['fix', 'new', 'another', 'change', 'kitchen', 'manager', 'bring', 'get', 'help', 'replace', 'check'];
const ASK = ['ask', 'check', 'kitchen', 'chef', 'see', 'find', 'manager', 'tell', 'let'];
const THANKS = ['thank', 'thanks', 'welcome', 'pleasure', 'glad', 'appreciate'];
const GREET = ['welcome', 'hello', 'hi', 'good', 'evening', 'afternoon', 'morning'];
const FOLLOW = ['follow', 'this', 'way', 'table', 'come', 'here', 'seat'];
const DRINKQ = ['drink', 'drinks', 'water', 'coffee', 'tea', 'soda', 'beer', 'wine'];
const ORDERQ = ['ready', 'order', 'get', 'like', 'have', 'want'];
const FOODWORDS = ['chicken', 'salmon', 'burger', 'ribeye', 'steak', 'pasta', 'shrimp', 'soup', 'salad', 'fish', 'recommend', 'popular', 'favorite', 'good', 'like', 'best', 'special'];
const WAITQ = ['minutes', 'minute', 'wait', 'soon', 'moment', 'list', 'ready', 'time'];
const CHECKQ = ['check', 'bill', 'bring', 'get', 'here', 'cash', 'card', 'pay'];
const BYE = ['thank', 'thanks', 'night', 'day', 'soon', 'bye', 'goodbye', 'again', 'back', 'care'];

const client = (text, es, guide, hint, sample, need) => ({ kind: 'cliente', text, es, guide, hint, sample, need });
const scene = (text, hint, sample, need) => ({ kind: 'situacion', text, guide: null, hint, sample, need });

// {slot} se reemplaza por una opción al azar; en español se usa la traducción de esa misma opción.
export const SITUATIONS = [
  client('Can I get {drink}, please?', '¿Me trae {drink}, por favor?', 'Dile que sí y que ya se lo traes.', 'Of course', "Of course, I'll bring it right away.", [YES, BRING]),
  client('Could I have {thing}, please?', '¿Me da {thing}, por favor?', 'Dile que claro, que enseguida.', 'Sure', "Sure, I'll be right back.", [YES, BRING]),
  client('Excuse me, we need {thing}.', 'Disculpe, necesitamos {thing}.', 'Contesta que se lo traes ahora.', 'No problem', "No problem, I'll get it for you.", [YES, BRING]),
  client('What do you recommend?', '¿Qué recomienda?', 'Recomienda un plato.', 'I recommend', 'I recommend the salmon, it is very good.', [FOODWORDS]),
  client('What is good here?', '¿Qué es bueno aquí?', 'Dile qué plato es tu favorito.', 'My favorite', 'My favorite is the chicken.', [FOODWORDS]),
  client('Is {food} spicy?', '¿{food} es picante?', 'Dile que no es picante.', 'No', 'No, it is not spicy.', [['no', 'not', "isn't"], ['spicy', 'hot', 'mild']]),
  client('What comes with {food}?', '¿Qué trae {food}?', 'Dile que viene con un acompañamiento.', 'It comes', 'It comes with fries or a salad.', [['comes', 'come', 'with', 'side', 'choice'], ['fries', 'salad', 'rice', 'side', 'vegetables', 'potatoes']]),
  client('Can I get {side} instead?', '¿Me da {side} en vez de eso?', 'Dile que sí, sin problema.', 'Yes', 'Yes, no problem.', [YES]),
  client("I'll have {food}.", 'Voy a querer {food}.', 'Repite lo que pidió para confirmar.', 'Okay', 'Okay, {food}.', [['{food}']]),
  client("I'll have the burger with {side}.", 'Quiero la hamburguesa con {side}.', 'Pregúntale si quiere algo más.', 'Anything', 'Great, anything else?', [['anything', 'something', 'else', 'more', 'drink']]),
  client("I'm allergic to {allergy}.", 'Soy alérgico a {allergy}.', 'Dile que vas a avisarle a la cocina. No prometas nada.', 'Thanks', 'Thanks for telling me. I will tell the kitchen.', [ASK]),
  client('Does this have {allergy}?', '¿Esto tiene {allergy}?', 'Si no sabes, dile que vas a preguntar.', 'Let me', 'Let me ask the kitchen.', [ASK]),
  client('Excuse me, my food is {wrong}.', 'Disculpe, mi comida {wrong}.', 'Discúlpate y ofrece arreglarlo.', "I'm so sorry", "I'm so sorry. Let me fix that for you.", [SORRY, FIX]),
  client('This is {wrong}.', 'Mi comida {wrong}.', 'Discúlpate y dile qué vas a hacer.', "I'm sorry", "I'm sorry. I will talk to the kitchen.", [SORRY, FIX]),
  client('Our food is taking a long time.', 'Nuestra comida está tardando mucho.', 'Discúlpate y dile que vas a revisar.', "I'm sorry", "I'm sorry about the wait. Let me check with the kitchen.", [SORRY, ASK]),
  client('We have been waiting for twenty minutes.', 'Llevamos veinte minutos esperando.', 'Discúlpate y agradece su paciencia.', 'I am sorry', 'I am sorry. Thank you for your patience.', [SORRY]),
  client('Can we get the check?', '¿Nos trae la cuenta?', 'Dile que sí, que ya se la traes.', 'Of course', "Of course, I'll bring it right away.", [YES, BRING]),
  client('Can we split the check?', '¿Podemos dividir la cuenta?', 'Dile que sí, sin problema.', 'Sure', 'Sure, no problem.', [YES]),
  client('Do you take cards?', '¿Aceptan tarjetas?', 'Dile que sí aceptan.', 'Yes', 'Yes, we take all cards.', [YES]),
  client('Where is the restroom?', '¿Dónde está el baño?', 'Dile dónde queda.', 'It is', 'It is in the back, on the right.', [['back', 'right', 'left', 'there', 'over', 'behind', 'next', 'down', 'front']]),
  client('Can I get this to go?', '¿Me lo da para llevar?', 'Dile que sí, que le traes una caja.', 'Of course', "Of course, I'll bring you a box.", [YES, ['box', 'bag', 'bring', 'get', 'pack']]),
  client('How long is the wait?', '¿Cuánto hay que esperar?', 'Dile cuántos minutos.', 'About', 'About fifteen minutes.', [WAITQ]),
  client('Do you have a table for {people}?', '¿Tienen mesa para {people}?', 'Dile que sí y que te sigan.', 'Yes', 'Yes, please follow me.', [YES, FOLLOW]),
  client('This was delicious, thank you!', '¡Estaba delicioso, gracias!', 'Agradece y dile que te alegra.', 'Thank you', 'Thank you! I am glad you liked it.', [THANKS]),
  client('Do you have vegetarian food?', '¿Tienen comida vegetariana?', 'Dile que sí y ofrece un plato.', 'Yes', 'Yes, we have a very good pasta.', [YES]),
  client('Is the soup hot?', '¿La sopa está caliente?', 'Dile que sí y que tenga cuidado.', 'Yes', 'Yes, it is hot. Please be careful.', [YES]),
  client('Can you bring it without onions?', '¿Me lo trae sin cebolla?', 'Dile que sí, que le avisas a la cocina.', 'Sure', 'Sure, I will tell the kitchen.', [YES]),
  client('We are ready to order.', 'Estamos listos para ordenar.', 'Pregúntale qué le gustaría.', 'Great', 'Great, what would you like?', [ORDERQ]),
  client('We need a few more minutes.', 'Necesitamos unos minutos más.', 'Dile que se tome su tiempo.', 'Take', 'Take your time.', [['take', 'time', 'problem', 'sure', 'okay', 'ok', 'back']]),
  client('Have a good night!', '¡Que pase buena noche!', 'Despídete y agradece.', 'Thank you', 'Thank you, have a good night!', [BYE]),

  scene('Una mesa para {people} acaba de llegar. Salúdalos y llévalos a su mesa.', 'Welcome', 'Welcome in! Please follow me.', [GREET, FOLLOW]),
  scene('Ya se sentaron. Preséntate y ofrece algo de tomar.', 'Hi', 'Hi, can I get you something to drink?', [DRINKQ]),
  scene('Llevas las bebidas a la mesa. Dilo y pregunta si están listos para ordenar.', 'Here', 'Here are your drinks. Are you ready to order?', [ORDERQ]),
  scene('Se ven indecisos con el menú. Diles que se tomen su tiempo.', 'Take', 'Take your time.', [['take', 'time', 'minutes', 'back', 'problem']]),
  scene('Una clienta pidió {food}. Pregúntale qué acompañamiento quiere.', 'Which', 'Which side would you like?', [['side', 'fries', 'salad', 'rice', 'with']]),
  scene('Llevas {food} a la mesa. Dile que está caliente y que tenga cuidado.', 'Careful', 'Careful, the plate is hot.', [['careful', 'hot']]),
  scene('Ya les serviste la comida. Pregunta cómo va todo.', 'How', 'How is everything?', [['how', 'everything', 'good', 'okay', 'food', 'enjoying']]),
  scene('Tiraste un vaso de agua en la mesa. Discúlpate y di que vas a limpiarlo.', "I'm so sorry", "I'm so sorry. Let me clean that up.", [SORRY]),
  scene('Trajiste el plato equivocado. Discúlpate y di que lo vas a cambiar.', "I'm sorry", "I'm sorry, that was my mistake. I will get you a new one.", [SORRY]),
  scene('Terminaron de comer. Ofrece postre.', 'Do you', 'Do you have room for dessert?', [['dessert', 'cake', 'sweet', 'ice']]),
  scene('Ya no quieren nada más. Pregunta si te pueden pagar ahora.', 'Are you', 'Are you ready for the check?', [CHECKQ]),
  scene('Traes la cuenta. Dile que no hay prisa.', 'Here', 'Here is your check. No rush.', [['check', 'bill', 'rush', 'time', 'hurry']]),
  scene('Se van del restaurante. Agradece y despídete.', 'Thank you', 'Thank you for coming in. Have a good night!', [BYE]),
  scene('Hay lista de espera. Diles que son quince minutos y pide su nombre.', 'It is', 'It is about fifteen minutes. Can I get your name?', [['minutes', 'wait'], ['name']]),
  scene('Viene una familia con un bebé. Pregunta si necesitan una silla para bebé.', 'Do you', 'Do you need a high chair?', [['chair', 'seat', 'booster']]),
  scene('Es el cumpleaños de un cliente. Felicítalo.', 'Happy', 'Happy birthday!', [['birthday', 'congratulations']]),
  scene('No entendiste lo que dijo el cliente. Pídele que lo repita.', 'Can you', 'Can you say that again, please?', [['again', 'repeat', 'sorry', 'pardon', 'slowly']]),
  scene('Se acabó {food}. Avísale al cliente y discúlpate.', "I'm sorry", "I'm sorry, we are out of {food}.", [SORRY]),
  scene('Un cliente pide vino. Pregúntale si quiere tinto o blanco.', 'Red', 'Red or white wine?', [['red', 'white']]),
  scene('Un cliente joven pide cerveza. Pídele su identificación.', 'Can I', 'Can I see your ID, please?', [['id', 'identification', 'license']]),
];

const FILLERS = new Set(['the', 'a', 'an', 'some', 'of', 'more']);
const SLOT = /\{(\w+)\}/g;
const pick = (list, rng) => list[Math.floor(rng() * list.length)];

export function fillSituation(index, rng = Math.random) {
  const base = SITUATIONS[index];
  const chosen = {};
  const en = (t) => t?.replace(SLOT, (_, k) => { chosen[k] ??= pick(SLOTS[k], rng); return chosen[k][0]; });
  const es = (t) => t?.replace(SLOT, (_, k) => { chosen[k] ??= pick(SLOTS[k], rng); return chosen[k][1]; });
  const text = base.kind === 'cliente' ? en(base.text) : es(base.text);
  const sample = en(base.sample);
  const out = {
    index, kind: base.kind, text, es: base.kind === 'cliente' ? es(base.es).replace(/^¿?./, (c) => c.toUpperCase()) : null,
    guide: base.guide, hint: en(base.hint), sample,
    need: base.need.map((group) => group.flatMap((word) => {
      const slot = word.match(/^\{(\w+)\}$/)?.[1];
      return slot ? (chosen[slot] ??= pick(SLOTS[slot], rng))[0].toLowerCase().split(/\s+/).filter((w) => !FILLERS.has(w)) : [word];
    })),
  };
  return out;
}

/** Todas las variantes posibles de una situación: sirve para revisar el contenido. */
export function allVariants(index) {
  const keys = [...new Set([...JSON.stringify(SITUATIONS[index]).matchAll(SLOT)].map((m) => m[1]))];
  let combos = [{}];
  for (const k of keys) combos = combos.flatMap((c) => SLOTS[k].map((_, i) => ({ ...c, [k]: i })));
  return combos.map((combo) => {
    const queue = keys.map((k) => (combo[k] + 0.5) / SLOTS[k].length);
    return fillSituation(index, () => queue.shift() ?? 0);
  });
}

/** Elige una situación que no se haya visto hace poco. */
export function buildReply(rng = Math.random, recent = []) {
  const skip = new Set(recent);
  const open = SITUATIONS.map((_, i) => i).filter((i) => !skip.has(i));
  return fillSituation(pick(open.length ? open : SITUATIONS.map((_, i) => i), rng), rng);
}

/** Una línea que diría un cliente, para entrenar el oído. */
export function clientLine(rng = Math.random) {
  const clients = SITUATIONS.map((s, i) => [s, i]).filter(([s]) => s.kind === 'cliente');
  const { text, es } = fillSituation(pick(clients, rng)[1], rng);
  return { en: text, es };
}
