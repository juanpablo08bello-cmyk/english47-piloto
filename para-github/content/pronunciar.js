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
  // Nuevas en 1.3: desayuno, happy hour, término de la carne y momentos del turno.
  client('Can I get eggs for breakfast?', '¿Me da huevos de desayuno?', 'Dile que sí y pregunta cómo los quiere.', 'Sure', 'Sure, how would you like your eggs?', [YES, ['how', 'eggs', 'scrambled', 'fried', 'like', 'want']]),
  client('Can I get more coffee, please?', '¿Me trae más café, por favor?', 'Dile que claro, que ya se lo traes.', 'Of course', "Of course, I'll bring more coffee right away.", [YES, BRING]),
  client('Is it still happy hour?', '¿Todavía es happy hour?', 'Dile que sí, hasta las siete.', 'Yes', 'Yes, happy hour is until seven.', [YES, ['until', 'seven', 'six', 'eight', 'time', 'still']]),
  client('My steak is overcooked.', 'Mi filete está demasiado cocido.', 'Discúlpate y ofrece uno nuevo.', "I'm so sorry", "I'm so sorry. I will ask the kitchen for a new one.", [SORRY, FIX]),
  client('Is the fish fresh?', '¿El pescado es fresco?', 'Dile que sí, que llegó hoy.', 'Yes', 'Yes, it is fresh. It came in today.', [YES, ['fresh', 'today', 'morning']]),
  client('It is my birthday today!', '¡Hoy es mi cumpleaños!', 'Felicítalo con mucho ánimo.', 'Happy birthday', 'Happy birthday! I hope you have a great night.', [['happy', 'birthday', 'congratulations']]),
  client('Do you have a kids menu?', '¿Tienen menú de niños?', 'Dile que sí y que se lo traes.', 'Yes', 'Yes, I will bring you one.', [YES, ['bring', 'get', 'here', 'menu', 'one']]),
  client('Can we sit outside?', '¿Podemos sentarnos afuera?', 'Dile que sí y que te sigan.', 'Of course', 'Of course, please follow me to the patio.', [YES, FOLLOW]),
  client('Is the tip included?', '¿La propina está incluida?', 'Dile que no está incluida.', 'No', 'No, the tip is not included.', [['no', 'not', "isn't"], ['included', 'tip']]),
  client('What time does the kitchen close?', '¿A qué hora cierra la cocina?', 'Dile que a las diez.', 'At ten', 'The kitchen closes at ten.', [['ten', 'eleven', 'nine', 'midnight', 'close', 'closes']]),

  client('Hi! Are you our server?', '¡Hola! ¿Usted es nuestro mesero?', 'Dile que sí y pregunta cómo están.', 'Yes', 'Yes, I am. How are you doing tonight?', [YES, ['how', 'help', 'get', 'welcome']]),
  client('We have been here before. It was great!', 'Ya hemos venido antes. ¡Estuvo muy bien!', 'Alégrate y dales la bienvenida.', 'Welcome', 'Welcome back! So good to see you.', [['welcome', 'good', 'glad', 'great', 'nice', 'thank', 'thanks']]),
  client('Is this your favorite dish?', '¿Este es su plato favorito?', 'Responde que sí y que está muy bueno.', 'Yes', 'Yes, it is really good.', [YES, ['good', 'favorite', 'love', 'like', 'great', 'delicious', 'it']]),
  client('Could we get more water when you get a chance?', '¿Nos trae más agua cuando pueda?', 'Dile que claro, que ya se la traes.', 'Of course', "Of course, I'll be right back.", [YES, BRING]),
  client('We are in a hurry. Can you help us?', 'Tenemos prisa. ¿Nos ayuda?', 'Dile que sí y que avisas a la cocina.', 'Of course', 'Of course. I will tell the kitchen.', [YES, ['kitchen', 'quick', 'fast', 'right', 'tell', 'help']]),
  client('This is too much food. Can I take it home?', 'Es mucha comida. ¿Me la puedo llevar?', 'Dile que sí, que le traes una caja.', 'Sure', 'Sure, let me get you a box.', [YES, ['box', 'bag', 'bring', 'get']]),
  client('Sorry, can you say that again?', 'Perdón, ¿puede repetir?', 'Repítelo con calma y agradece.', 'Of course', 'Of course. Would you like some water?', [YES]),
  client('Do you know a good place to go after dinner?', '¿Conoce un buen lugar para ir después de cenar?', 'Di que vas a pensar o da una idea.', 'Let me', 'Let me think. The beach is very nice.', [['let', 'beach', 'think', 'bar', 'place', 'try', 'ask', 'not', 'sure']]),
  client('How long have you worked here?', '¿Cuánto tiempo lleva trabajando aquí?', 'Di cuánto tiempo llevas.', 'I have', 'I have worked here for two years.', [['year', 'years', 'month', 'months', 'week', 'weeks', 'time', 'long']]),
  client('Your English is very good!', '¡Su inglés es muy bueno!', 'Agradece el comentario.', 'Thank you', 'Thank you! I am still learning.', [THANKS]),
  client('Is the tip included in the check?', '¿La propina está incluida en la cuenta?', 'Dile que vas a revisar.', 'Let me', 'Let me check that for you.', [ASK]),
  client('We are celebrating tonight!', '¡Esta noche estamos celebrando!', 'Felicítalos y pregunta qué celebran.', 'Congratulations', 'Congratulations! What are you celebrating?', [['congratulations', 'great', 'nice', 'wow', 'happy', 'what']]),

  scene('Se acercan a la mesa unos clientes que ya viste antes. Salúdalos con alegría.', 'Welcome', 'Welcome back! Nice to see you again.', [GREET.concat(['again', 'back', 'nice'])]),
  scene('Llevas varios minutos sin pasar por una mesa. Pregunta si todo está bien.', 'Is', 'Is everything okay here?', [['everything', 'okay', 'good', 'how', 'need']]),
  scene('El cliente tiene su plato vacío. Pregunta si te lo puedes llevar.', 'Can I', 'Can I take your plate?', [['plate', 'take', 'finished', 'done']]),
  scene('Se te olvidó traer la bebida de un cliente. Discúlpate y di que ya la traes.', "I'm sorry", "I'm sorry, I'll bring your drink right away.", [SORRY, BRING]),
  scene('Dos personas llegan y no sabes si tienen reservación. Pregúntales.', 'Do you', 'Do you have a reservation?', [['reservation', 'booked', 'name']]),
  scene('Quieren sentarse afuera, pero está lleno. Discúlpate y ofrece adentro.', "I'm sorry", "I'm sorry, outside is full. Is inside okay?", [SORRY, ['inside', 'table', 'here']]),
  scene('Un cliente pregunta por el baño. Dile que queda al fondo.', 'It is', 'It is in the back, on the right.', [['back', 'right', 'left', 'there', 'over']]),
  scene('Una mesa se ve lista para pedir. Pregúntales si ya quieren ordenar.', 'Are you', 'Are you ready to order?', [ORDERQ]),
  scene('Le entregas el plato a un cliente. Dile que disfrute su comida.', 'Enjoy', 'Enjoy your food!', [['enjoy', 'here', 'hope']]),
  scene('La cocina va a cerrar pronto. Avísale al cliente con amabilidad.', 'Just', 'Just so you know, the kitchen closes soon.', [['kitchen', 'close', 'closes', 'closing', 'soon']]),
  scene('Una mesa de {people} está lista. Avísales a los que esperan en la barra.', 'Your', 'Your table is ready. Please follow me.', [['table', 'ready']]),
  scene('Terminó tu turno y un cliente te dice adiós. Despídete con una sonrisa.', 'Have', 'Have a great night! See you soon.', [BYE]),

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
