// Generador de mesas al azar para principiantes. Siempre funciona, sin IA: combina situación,
// personaje, acento, ánimo, pedido e imprevistos. En cada turno el alumno recibe la frase que debe decir.
// Las frases del alumno son fijas y revisables; la IA, si está conectada, solo reescribe al cliente.
import { MENU } from './menu.js';

export const ACCENTS = {
  us: { es: 'Estados Unidos', prompt: 'a clear General American accent' },
  uk: { es: 'Reino Unido', prompt: 'a natural British English accent' },
  ie: { es: 'Irlanda', prompt: 'a natural Irish English accent' },
  au: { es: 'Australia', prompt: 'a natural Australian English accent' },
  nz: { es: 'Nueva Zelanda', prompt: 'a natural New Zealand English accent' },
  ca: { es: 'Canadá', prompt: 'a natural Canadian English accent' },
  za: { es: 'Sudáfrica', prompt: 'a natural South African English accent' },
  in: { es: 'India', prompt: 'a natural Indian English accent' },
  ph: { es: 'Filipinas', prompt: 'a natural Filipino English accent' },
  ng: { es: 'Nigeria', prompt: 'a natural Nigerian English accent' },
  latino: { es: 'México', prompt: 'a natural Mexican English accent' },
  spain: { es: 'España', prompt: 'a natural Spanish English accent' },
  brazil: { es: 'Brasil', prompt: 'a natural Brazilian English accent' },
  france: { es: 'Francia', prompt: 'a natural French English accent' },
  italy: { es: 'Italia', prompt: 'a natural Italian English accent' },
};

// rate ajusta la velocidad de la voz: siempre clara para un principiante.
export const MOODS = {
  friendly: { es: 'Amable', prompt: 'warm and friendly', rate: '-8%', open: ['', ''], closing: { en: 'Thank you, you are great!', es: '¡Gracias, usted es genial!' } },
  hurry: { es: 'Con prisa', prompt: 'polite but in a hurry', rate: '-2%', open: [' We are in a hurry.', ' Tenemos prisa.'], closing: { en: 'Thanks, we have to run!', es: '¡Gracias, tenemos que irnos!' } },
  unsure: { es: 'Indeciso', prompt: 'a bit unsure and thoughtful', rate: '-12%', open: [' I never know what to order.', ' Nunca sé qué pedir.'], closing: { en: 'Thank you for your help.', es: 'Gracias por su ayuda.' } },
  picky: { es: 'Exigente', prompt: 'polite but demanding', rate: '-8%', open: [' I hope the service is good.', ' Espero que el servicio sea bueno.'], closing: { en: 'Good. That was good service.', es: 'Bien. Fue un buen servicio.' } },
  chatty: { es: 'Conversador', prompt: 'cheerful and talkative', rate: '-5%', open: [' This place looks great!', ' ¡Este lugar se ve genial!'], closing: { en: 'So nice to talk to you!', es: '¡Qué gusto hablar con usted!' } },
  tired: { es: 'Cansado', prompt: 'calm and a little tired', rate: '-14%', open: [' It was a long day.', ' Fue un día largo.'], closing: { en: 'Thank you. I needed this.', es: 'Gracias. Necesitaba esto.' } },
  happy: { es: 'Contento', prompt: 'very happy and excited', rate: '-6%', open: [' We are so happy to be here!', ' ¡Qué felices estamos de estar aquí!'], closing: { en: 'This is the best. Thank you!', es: '¡Esto es lo mejor! ¡Gracias!' } },
  quiet: { es: 'Tímido', prompt: 'quiet and shy', rate: '-12%', open: ['', ''], closing: { en: 'Um, thank you very much.', es: 'Eh, muchas gracias.' } },
};

// Cada personaje tiene una voz real de Azure, con su acento. `voice` es la alternativa de Gemini.
const FEMALE = ['Kore', 'Aoede', 'Leda', 'Zephyr'];
const MALE = ['Puck', 'Charon', 'Orus', 'Fenrir'];
const person = (name, gender, accent, azure, i) => ({ name, accent, azure, voice: (gender === 'f' ? FEMALE : MALE)[i % 4] });
export const CAST = [
  ['Linda', 'f', 'us', 'en-US-AvaNeural'], ['Mike', 'm', 'us', 'en-US-AndrewNeural'], ['Grace', 'f', 'us', 'en-US-JennyNeural'],
  ['Tony', 'm', 'us', 'en-US-GuyNeural'], ['Emma', 'f', 'us', 'en-US-EmmaNeural'], ['Brian', 'm', 'us', 'en-US-BrianNeural'],
  ['Aria', 'f', 'us', 'en-US-AriaNeural'], ['Davis', 'm', 'us', 'en-US-DavisNeural'], ['Nancy', 'f', 'us', 'en-US-NancyNeural'],
  ['Jason', 'm', 'us', 'en-US-JasonNeural'], ['Sara', 'f', 'us', 'en-US-SaraNeural'], ['Eric', 'm', 'us', 'en-US-EricNeural'],
  ['Sophie', 'f', 'uk', 'en-GB-SoniaNeural'], ['James', 'm', 'uk', 'en-GB-RyanNeural'], ['Libby', 'f', 'uk', 'en-GB-LibbyNeural'],
  ['Oliver', 'm', 'uk', 'en-GB-OliverNeural'], ['Hollie', 'f', 'uk', 'en-GB-HollieNeural'], ['Thomas', 'm', 'uk', 'en-GB-ThomasNeural'],
  ['Emily', 'f', 'ie', 'en-IE-EmilyNeural'], ['Connor', 'm', 'ie', 'en-IE-ConnorNeural'],
  ['Natasha', 'f', 'au', 'en-AU-NatashaNeural'], ['William', 'm', 'au', 'en-AU-WilliamNeural'], ['Freya', 'f', 'au', 'en-AU-FreyaNeural'], ['Duncan', 'm', 'au', 'en-AU-DuncanNeural'],
  ['Molly', 'f', 'nz', 'en-NZ-MollyNeural'], ['Mitchell', 'm', 'nz', 'en-NZ-MitchellNeural'],
  ['Clara', 'f', 'ca', 'en-CA-ClaraNeural'], ['Liam', 'm', 'ca', 'en-CA-LiamNeural'],
  ['Leah', 'f', 'za', 'en-ZA-LeahNeural'], ['Luke', 'm', 'za', 'en-ZA-LukeNeural'],
  ['Neerja', 'f', 'in', 'en-IN-NeerjaNeural'], ['Prabhat', 'm', 'in', 'en-IN-PrabhatNeural'],
  ['Rosa', 'f', 'ph', 'en-PH-RosaNeural'], ['Ezinne', 'f', 'ng', 'en-NG-EzinneNeural'], ['Abeo', 'm', 'ng', 'en-NG-AbeoNeural'],
  ['Dalia', 'f', 'latino', 'es-MX-DaliaMultilingualNeural'], ['Jorge', 'm', 'latino', 'es-MX-JorgeMultilingualNeural'],
  ['Ximena', 'f', 'spain', 'es-ES-XimenaMultilingualNeural'], ['Tristan', 'm', 'spain', 'es-ES-TristanMultilingualNeural'],
  ['Thalita', 'f', 'brazil', 'pt-BR-ThalitaMultilingualNeural'], ['Macerio', 'm', 'brazil', 'pt-BR-MacerioMultilingualNeural'],
  ['Vivienne', 'f', 'france', 'fr-FR-VivienneMultilingualNeural'], ['Remy', 'm', 'france', 'fr-FR-RemyMultilingualNeural'],
  ['Isabella', 'f', 'italy', 'it-IT-IsabellaMultilingualNeural'], ['Giuseppe', 'm', 'italy', 'it-IT-GiuseppeMultilingualNeural'],
].map(([name, gender, accent, azure], i) => person(name, gender, accent, azure, i));
export const CAST_SIZE = CAST.length;
export const VOICES = new Set(CAST.map((c) => c.voice));
// Sebastián no atiende mesas: es una de las voces para imitar.
export const AZURE_VOICES = new Set([...CAST.map((c) => c.azure), 'es-VE-SebastianNeural']);

const pick = (rng, list) => list[Math.floor(rng() * list.length)];
const L = (en, es) => ({ en, es });
const cap = (s) => s[0].toUpperCase() + s.slice(1);

// --- Menú en palabras simples ---
const DRINKS = [
  { en: 'still water', es: 'agua sin gas', word: 'still' }, { en: 'sparkling water', es: 'agua con gas', word: 'sparkling' },
  { en: 'iced tea', es: 'té helado', word: 'tea' }, { en: 'lemonade', es: 'limonada', word: 'lemonade' }, { en: 'coffee', es: 'café', word: 'coffee' },
];
const WINES = [{ en: 'red wine', es: 'vino tinto', word: 'red' }, { en: 'white wine', es: 'vino blanco', word: 'white' }];
const ALCOHOL = [...WINES, { en: 'draft beer', es: 'cerveza de barril', word: 'beer' }, { en: 'mojito', es: 'mojito', word: 'mojito' }];
const MAINS = [
  { en: 'ribeye', es: 'el ribeye', word: 'ribeye', temp: true, side: true, how: L('It is grilled with herb butter.', 'Es a la parrilla con mantequilla de hierbas.') },
  { en: 'burger', es: 'la hamburguesa', word: 'burger', temp: true, side: true, how: L('It has cheese, lettuce and tomato.', 'Tiene queso, lechuga y tomate.') },
  { en: 'snapper', es: 'el pargo', word: 'snapper', side: true, how: L('It is grilled with lemon.', 'Es a la parrilla con limón.') },
  { en: 'chicken', es: 'el pollo', word: 'chicken', side: true, how: L('It is roasted with garlic.', 'Es al horno con ajo.') },
  { en: 'shrimp linguine', es: 'el linguine con camarones', word: 'linguine', how: L('It has shrimp, garlic and tomato.', 'Tiene camarones, ajo y tomate.') },
];
const STARTERS = [
  { en: 'Caesar salad', es: 'la ensalada César', word: 'caesar' }, { en: 'calamari', es: 'los calamares', word: 'calamari' }, { en: 'tomato soup', es: 'la sopa de tomate', word: 'soup' },
];
const SIDES = [
  { en: 'fries', es: 'papas fritas', word: 'fries' }, { en: 'asparagus', es: 'espárragos', word: 'asparagus' }, { en: 'mashed potatoes', es: 'puré de papas', word: 'potatoes' },
];
const TEMPS = [
  { en: 'medium rare', es: 'medio rojo', word: 'rare' }, { en: 'medium', es: 'término medio', word: 'medium' }, { en: 'well done', es: 'bien cocido', word: 'done' },
];
const DESSERTS = [{ en: 'key lime pie', es: 'el pie de limón', word: 'pie' }, { en: 'cheesecake', es: 'el pastel de queso', word: 'cheesecake' }];
const ALLERGIES = [{ en: 'nuts', es: 'las nueces' }, { en: 'shellfish', es: 'los mariscos' }, { en: 'gluten', es: 'el gluten' }, { en: 'dairy', es: 'los lácteos' }];
const GUEST_NAMES = ['Johnson', 'Smith', 'Garcia', 'Miller', 'Lopez', 'Davis', 'Brown', 'Martinez'];
const PARTIES = [
  { size: 2, en: 'two', es: 'dos' }, { size: 3, en: 'three', es: 'tres' }, { size: 4, en: 'four', es: 'cuatro' }, { size: 5, en: 'five', es: 'cinco' }, { size: 6, en: 'six', es: 'seis' },
];

// --- Turnos reutilizables: qué dice el cliente, qué debe decir el alumno. ---
const step = (kind, guest, say, keep = [], extra = {}) => ({ kind, guest, say, keep, ...extra });
// Un turno LINKED continúa el anterior: ningún imprevisto se mete entre los dos.
const LINKED = { linked: true };
const BACK = L("Of course. I'll be right back.", 'Claro. Ya regreso.');
const KITCHEN = L('Let me check with the kitchen.', 'Déjeme consultar con la cocina.');
const recommend = (dish) => L(`I recommend the ${dish.en}.`, `Le recomiendo ${dish.es}.`);

function orderLine(c) {
  const side = c.main.side ? [` with ${c.side.en}`, ` con ${c.side.es}`] : ['', ''];
  return pick(c.rng, [
    L(`I will have the ${c.main.en}${side[0]}.`, `Quiero ${c.main.es}${side[1]}.`),
    L(`Can I get the ${c.main.en}${side[0]}?`, `¿Me trae ${c.main.es}${side[1]}?`),
    L(`I would like the ${c.main.en}${side[0]}, please.`, `Quisiera ${c.main.es}${side[1]}, por favor.`),
  ]);
}
function confirmSay(c) {
  const en = `Let me confirm. One ${c.main.en}${c.main.temp ? `, ${c.temp.en}` : ''}${c.main.side ? `, with ${c.side.en}` : ''}.`;
  const es = `Déjeme confirmar. ${cap(c.main.es)}${c.main.temp ? `, ${c.temp.es}` : ''}${c.main.side ? `, con ${c.side.es}` : ''}.`;
  return L(en, es);
}

const T = {
  greet: (c) => step('greet',
    pick(c.rng, [
      L(`Hi, a table for ${c.party.en}, please.`, `Hola, una mesa para ${c.party.es}, por favor.`),
      L(`Hello, do you have a table for ${c.party.en}?`, `Hola, ¿tiene una mesa para ${c.party.es}?`),
      L(`Good evening. We are ${c.party.en} people.`, `Buenas noches. Somos ${c.party.es} personas.`),
    ]),
    pick(c.rng, [L('Welcome in! Right this way, please.', '¡Bienvenidos! Por aquí, por favor.'), L('Good evening! Please follow me.', '¡Buenas noches! Síganme, por favor.'), L('Welcome! Here is your table.', '¡Bienvenidos! Aquí está su mesa.')]),
    [c.party.en]),
  sit: (c) => step('sit',
    pick(c.rng, [L('Thank you. This table is nice.', 'Gracias. Esta mesa está bonita.'), L('Great, thank you.', 'Genial, gracias.'), L('Oh, nice. Can we see the menu?', 'Qué bien. ¿Podemos ver el menú?')]),
    pick(c.rng, [L('Here is the menu. I will be your server.', 'Aquí está el menú. Yo los voy a atender.'), L('Here is the menu. Take your time.', 'Aquí está el menú. Tómense su tiempo.')])),
  askDrink: (c) => step('drink',
    pick(c.rng, [L('Thanks. Everything looks good.', 'Gracias. Todo se ve bien.'), L('Thank you. We are thirsty!', 'Gracias. ¡Tenemos sed!'), L('Okay, thank you.', 'Bien, gracias.')]),
    pick(c.rng, [L('Can I get you something to drink?', '¿Les traigo algo de tomar?'), L('What would you like to drink?', '¿Qué quieren tomar?'), L('Would you like something to drink?', '¿Quieren algo de tomar?')])),
  giveDrink: (c) => step('drink2',
    pick(c.rng, [L(`${cap(c.drink.en)}, please.`, `${cap(c.drink.es)}, por favor.`), L(`I would like ${c.drink.en}, please.`, `Quisiera ${c.drink.es}, por favor.`), L(`Can I get ${c.drink.en}?`, `¿Me trae ${c.drink.es}?`)]),
    pick(c.rng, [L('Of course. Are you ready to order?', 'Claro. ¿Están listos para ordenar?'), L('Sure. What would you like to eat?', 'Claro. ¿Qué quieren comer?'), L('Great. Would you like a starter?', 'Muy bien. ¿Quieren una entrada?')]),
    [c.drink.word]),
  starter: (c) => step('starter',
    pick(c.rng, [L(`Can we get the ${c.starter.en} first?`, `¿Nos trae ${c.starter.es} primero?`), L(`We will start with the ${c.starter.en}.`, `Empezamos con ${c.starter.es}.`)]),
    pick(c.rng, [L('Great choice! Are you ready to order?', '¡Excelente elección! ¿Listos para ordenar?'), L('Perfect. What would you like for dinner?', 'Perfecto. ¿Qué quieren cenar?')]),
    [c.starter.word]),
  order: (c) => step('order', orderLine(c),
    c.main.temp ? pick(c.rng, [L('Great choice! How would you like it cooked?', '¡Excelente elección! ¿Cómo le gustaría la carne?'), L('Sure. How would you like it cooked?', 'Claro. ¿Cómo le gustaría la carne?')])
      : pick(c.rng, [L('Great choice! Anything else?', '¡Excelente elección! ¿Algo más?'), L('Perfect. Would you like anything else?', 'Perfecto. ¿Quieren algo más?')]),
    [c.main.word, ...(c.main.side ? [c.side.word] : [])]),
  temp: (c) => (c.main.temp ? step('temp',
    pick(c.rng, [L(`${cap(c.temp.en)}, please.`, `${cap(c.temp.es)}, por favor.`), L(`I like it ${c.temp.en}.`, `Me gusta ${c.temp.es}.`)]),
    pick(c.rng, [L(`${cap(c.temp.en)}, got it. Anything else?`, `${cap(c.temp.es)}, entendido. ¿Algo más?`), L('Thank you. Anything else?', 'Gracias. ¿Algo más?')]),
    [c.temp.word]) : null),
  thatsAll: (c) => step('confirm',
    pick(c.rng, [L('No, that is all for now.', 'No, eso es todo por ahora.'), L('That is everything, thank you.', 'Eso es todo, gracias.'), L('I think we are good.', 'Creo que estamos bien.')]),
    confirmSay(c)),
  close: (c) => step('close',
    pick(c.rng, [L('Yes, that is right. Thank you!', 'Sí, así es. ¡Gracias!'), L('Perfect, thanks.', 'Perfecto, gracias.'), L('Yes. How long will it take?', 'Sí. ¿Cuánto va a tardar?')]),
    pick(c.rng, [L("Thank you. I'll be right back.", 'Gracias. Ya regreso.'), L('Your food is coming soon.', 'Su comida viene pronto.'), L("Thank you. I'll put that in for you.", 'Gracias. Le paso el pedido a la cocina.')]),
    [], LINKED),
};
const ORDER = [T.order, T.temp];

// Imprevistos que alargan la mesa. ANYWHERE sirve siempre; AT_TABLE, ya sentados; SERVED, con la comida en la mesa.
const extra = (guest, say, keep) => () => [step('extra', guest, say, keep)];
const ANYWHERE = [
  extra(L('Excuse me, where is the restroom?', 'Disculpe, ¿dónde está el baño?'), L('The restroom is in the back, on the right.', 'El baño está al fondo, a la derecha.')),
  extra(L('Do you take credit cards?', '¿Aceptan tarjetas de crédito?'), L('Yes, we do.', 'Sí, aceptamos.')),
  extra(L('Is it always this busy here?', '¿Siempre hay tanta gente aquí?'), L('Thank you for your patience.', 'Gracias por su paciencia.')),
  extra(L('How are you doing tonight?', '¿Cómo está esta noche?'), L("I'm doing well, thank you.", 'Estoy bien, gracias.')),
  extra(L('It is my first time in Miami!', '¡Es mi primera vez en Miami!'), L('Welcome! Enjoy your time in Miami.', '¡Bienvenidos! Disfruten su tiempo en Miami.')),
  extra(L('What time do you close?', '¿A qué hora cierran?'), L('The kitchen closes at ten.', 'La cocina cierra a las diez.')),
  extra(L('Do you have wifi here?', '¿Tienen wifi aquí?'), L('Let me check. One moment, please.', 'Déjeme ver. Un momento, por favor.')),
  extra(L('Is the music always this loud?', '¿La música siempre está tan alta?'), L("I'm sorry. Let me check.", 'Lo siento. Déjeme ver.')),
  // El alumno practica pedir que le repitan: el cliente lo vuelve a decir más fácil.
  () => [
    step('repeat', L('Could we possibly get a couple more forks?', '¿Será posible que nos traiga un par de tenedores más?'), L('Sorry, could you repeat that?', 'Perdón, ¿puede repetir?')),
    step('repeat2', L('Two more forks, please.', 'Dos tenedores más, por favor.'), L('Of course. Two more forks.', 'Claro. Dos tenedores más.'), ['forks']),
  ],
];
const AT_TABLE = [
  extra(L('Can we get some water first?', '¿Nos trae agua primero?'), BACK),
  extra(L('Can I get some napkins?', '¿Me trae más servilletas?'), L('Sure. Here are some napkins.', 'Claro. Aquí tiene unas servilletas.')),
  extra(L('Can you take a picture of us?', '¿Nos toma una foto?'), L('Of course, no problem.', 'Claro, no hay problema.')),
  extra(L('This fork is dirty.', 'Este tenedor está sucio.'), L("I'm so sorry. Let me bring you a new fork.", 'Lo siento mucho. Le traigo un tenedor nuevo.')),
  extra(L('Can we get some bread?', '¿Nos trae pan?'), L('Sure, I will bring you some bread.', 'Claro, les traigo pan.')),
  extra(L('Do you have any specials tonight?', '¿Tienen especiales esta noche?'), KITCHEN),
  extra(L('Is the food very spicy?', '¿La comida es muy picante?'), KITCHEN),
  extra(L('Sorry, one more thing. No ice, please.', 'Perdón, una cosa más. Sin hielo, por favor.'), L('No ice, got it.', 'Sin hielo, entendido.')),
];
const SERVED = [
  extra(L('Can we get some more water?', '¿Nos trae más agua?'), BACK),
  extra(L('Can I get some ketchup, please?', '¿Me trae salsa de tomate, por favor?'), BACK),
  extra(L('Can I have a straw?', '¿Me da un pitillo?'), BACK),
  extra(L('Can we get more lemon?', '¿Nos trae más limón?'), BACK),
];

// --- Situaciones. Los turnos con opt() se quitan en mesas cortas. ---
const opt = (fn) => Object.assign((c) => fn(c), { optional: true });

const SCENES = [
  { id: 'cena', es: 'Cena', level: 1, weight: 4, plan: () => [T.greet, opt(T.sit), T.askDrink, T.giveDrink, opt(T.starter), ...ORDER, T.thatsAll, opt(T.close)] },
  { id: 'bebidas', es: 'Solo bebidas', level: 1, plan: () => [
    T.greet,
    () => step('drink', L('We just want a drink tonight.', 'Solo queremos tomar algo esta noche.'), L('Sure. Would you like wine or beer?', 'Claro. ¿Quieren vino o cerveza?')),
    (c) => step('order', L(`I would like a ${c.alcohol.en}, please.`, `Quisiera ${c.alcohol.es}, por favor.`), L('Of course. Can I see your ID, please?', 'Claro. ¿Me muestra su identificación, por favor?'), [c.alcohol.word]),
    opt((c) => step('snack', L('Here you go. Do you have snacks?', 'Aquí tiene. ¿Tienen algo para picar?'), L(`We have ${c.starter.en}.`, `Tenemos ${c.starter.es}.`))),
    () => step('close', L('Great, thank you.', 'Genial, gracias.'), L('Cheers, enjoy your drinks!', '¡Salud, disfruten sus bebidas!')),
  ] },
  { id: 'reserva', es: 'Reservación', level: 1, entrance: true, plan: () => [
    () => step('greet', L('Good evening. We have a reservation.', 'Buenas noches. Tenemos una reservación.'), L('Welcome in! Under what name?', '¡Bienvenidos! ¿A nombre de quién?'), ['reservation']),
    (c) => step('name', L(`It is under ${c.guestName}.`, `Está a nombre de ${c.guestName}.`), L('Thank you. How many people?', 'Gracias. ¿Cuántas personas?'), [c.guestName.toLowerCase()]),
    (c) => step('party', L(`We are ${c.party.en}.`, `Somos ${c.party.es}.`), L('Inside or outside?', '¿Adentro o afuera?'), [c.party.en]),
    (c) => step('sit', pick(c.rng, [L('Inside, please.', 'Adentro, por favor.'), L('Outside, please. It is a nice night.', 'Afuera, por favor. Hace buena noche.')]), L('Great. Please follow me.', 'Muy bien. Síganme, por favor.')),
    opt(() => step('close', L('Thank you very much.', 'Muchas gracias.'), L('Your server will be right with you.', 'Su mesero viene enseguida.'))),
  ] },
  { id: 'espera', es: 'Lista de espera', level: 1, entrance: true, plan: () => [
    (c) => step('greet', L(`Hi, a table for ${c.party.en}, please.`, `Hola, una mesa para ${c.party.es}, por favor.`), L('We are full right now.', 'Estamos llenos ahora mismo.'), [c.party.en]),
    () => step('wait', L('Oh, how long is the wait?', 'Ah, ¿cuánto hay que esperar?'), L('It is about a fifteen minute wait.', 'Son unos quince minutos de espera.')),
    () => step('name', L('Okay, we can wait.', 'Bien, podemos esperar.'), L('Thank you. Can I get your name?', 'Gracias. ¿Me da su nombre?'), [], LINKED),
    (c) => step('bar', L(`It is ${c.guestName}. Where can we wait?`, `Es ${c.guestName}. ¿Dónde esperamos?`), L('You can wait at the bar.', 'Pueden esperar en la barra.'), [c.guestName.toLowerCase()]),
    opt(() => step('ready', L('Is our table ready now?', '¿Ya está lista nuestra mesa?'), L('Yes. Thanks for waiting.', 'Sí. Gracias por esperar.'))),
  ] },
  { id: 'revisar', es: 'Revisar la mesa', level: 1, served: true, plan: () => [
    () => step('check', L('Oh, hi there.', 'Ah, hola.'), L('How is everything?', '¿Cómo va todo?')),
    (c) => step('ask', pick(c.rng, [L(`The ${c.main.en} is great. Can I get more water?`, `${cap(c.main.es)} está muy bien. ¿Me trae más agua?`), L(`Everything is good. I love the ${c.main.en}.`, `Todo bien. Me encanta ${c.main.es}.`)]), L("I'm so glad. I'll be right back.", 'Qué bueno. Ya regreso.'), [c.main.word]),
    opt(() => step('more', L('Thanks. Can we get more bread too?', 'Gracias. ¿Nos trae más pan también?'), L('Sure, no problem.', 'Claro, no hay problema.'))),
    () => step('clear', L('We are all done now.', 'Ya terminamos.'), L('May I take your plates?', '¿Puedo llevarme sus platos?')),
    () => step('dessert', L('Yes, please. Thank you.', 'Sí, por favor. Gracias.'), L('Would you like dessert?', '¿Quieren postre?')),
  ] },
  { id: 'postre', es: 'Postre y café', level: 1, ending: true, plan: () => [
    () => step('ask', L('That was great. We are done.', 'Estuvo muy bien. Ya terminamos.'), L('Did you save room for dessert?', '¿Les quedó espacio para el postre?')),
    () => step('options', L('Maybe. What do you have?', 'Tal vez. ¿Qué tienen?'), L('We have key lime pie and cheesecake.', 'Tenemos pie de limón y pastel de queso.')),
    (c) => step('pick', L(`We will have the ${c.dessert.en}.`, `Queremos ${c.dessert.es}.`), L('Great choice! Would you like more spoons?', '¡Excelente elección! ¿Quieren más cucharas?'), [c.dessert.word]),
    () => step('coffee', L('Yes, and one coffee, please.', 'Sí, y un café, por favor.'), L('Would you like milk or sugar?', '¿Quiere leche o azúcar?'), ['coffee']),
    opt(() => step('close', L('Just milk, thank you.', 'Solo leche, gracias.'), BACK, ['milk'])),
  ] },
  { id: 'cuenta', es: 'La cuenta', level: 1, ending: true, plan: () => [
    (c) => step('ask', pick(c.rng, [L('Excuse me, can we get the check?', 'Disculpe, ¿nos trae la cuenta?'), L('We are ready to pay.', 'Estamos listos para pagar.')]), L('Of course. Here is your check.', 'Claro. Aquí está su cuenta.')),
    opt(() => step('split', L('Can we split it?', '¿La podemos dividir?'), L('Sure. Together or separate?', 'Claro. ¿Juntos o separados?'))),
    opt(() => step('tip', L('Is the tip included?', '¿La propina está incluida?'), L('Let me check about the tip.', 'Déjeme consultar lo de la propina.'))),
    () => step('pay', L('I will pay with my card.', 'Voy a pagar con tarjeta.'), L("Thank you. I'll be right back with your card.", 'Gracias. Regreso enseguida con su tarjeta.'), ['card']),
    () => step('sign', L('Okay, thank you.', 'Bien, gracias.'), L('Here is your receipt. Please sign here.', 'Aquí está su recibo. Firme aquí, por favor.')),
    (c) => step('bye', pick(c.rng, [L('Thank you. It was delicious.', 'Gracias. Estuvo delicioso.'), L('Thanks for everything.', 'Gracias por todo.')]), L('Thank you for coming. Have a great night!', 'Gracias por venir. ¡Que tengan linda noche!')),
  ] },
  { id: 'llevar', es: 'Para llevar', level: 1, entrance: true, plan: () => [
    (c) => step('greet', L(`Hi, I want to order the ${c.main.en} to go.`, `Hola, quiero pedir ${c.main.es} para llevar.`), L('Of course. Anything else?', 'Claro. ¿Algo más?'), [c.main.word]),
    (c) => step('more', L(`Yes, one ${c.drink.en}, please.`, `Sí, ${c.drink.es}, por favor.`), L('It will be ready in ten minutes.', 'Estará listo en diez minutos.'), [c.drink.word]),
    () => step('name', L('Okay. I can wait here.', 'Bien. Puedo esperar aquí.'), L('Thank you. What is your name?', 'Gracias. ¿Cuál es su nombre?'), [], LINKED),
    (c) => step('bag', L(`It is ${c.guestName}.`, `Es ${c.guestName}.`), L('Would you like a bag?', '¿Quiere una bolsa?'), [c.guestName.toLowerCase()]),
    () => step('give', L('Yes, please. Is it ready?', 'Sí, por favor. ¿Ya está?'), L('Here is your order. Thank you for coming.', 'Aquí está su pedido. Gracias por venir.')),
  ] },
  { id: 'recomendar', es: 'No sabe qué pedir', level: 2, plan: () => [
    T.greet,
    (c) => step('ask', L('What do you recommend?', '¿Qué recomienda?'), recommend(c.main)),
    (c) => step('how', L('What is it like?', '¿Cómo es?'), c.main.how, [], LINKED),
    opt((c) => (c.main.side ? step('side', L('Does it come with anything?', '¿Viene con algo?'), L('It comes with one side.', 'Viene con un acompañamiento.'), [], LINKED) : null)),
    ...ORDER,
    T.thatsAll,
  ] },
  { id: 'alergia', es: 'Alergia seria', level: 2, tail: true, plan: () => [
    T.greet,
    (c) => step('allergy', L(`I have an allergy to ${c.allergy.en}.`, `Tengo alergia a ${c.allergy.es}.`), L('Thank you for telling me.', 'Gracias por decírmelo.'), [c.allergy.en]),
    (c) => step('safe', L(`Can I eat the ${c.main.en}?`, `¿Puedo comer ${c.main.es}?`), KITCHEN, [c.main.word]),
    () => step('promise', L('Can you promise me it is okay?', '¿Me promete que no hay problema?'), L("I don't want to guess. I will ask the chef.", 'No quiero adivinar. Le voy a preguntar al chef.')),
    () => step('thanks', L('Okay. Thank you for checking.', 'Bien. Gracias por consultar.'), L('I will come right back.', 'Regreso enseguida.')),
  ] },
  { id: 'vino', es: 'Vino', level: 2, plan: () => [
    T.greet,
    () => step('ask', L('Can we see the wine list?', '¿Podemos ver la carta de vinos?'), L('Of course. Red or white wine?', 'Claro. ¿Vino tinto o blanco?')),
    (c) => step('glass', L(`${cap(c.wine.en)}, please. Just one glass.`, `${cap(c.wine.es)}, por favor. Solo una copa.`), L('One glass. Can I see your ID, please?', 'Una copa. ¿Me muestra su identificación, por favor?'), [c.wine.word]),
    opt(() => step('id', L('Sure, here you go.', 'Claro, aquí tiene.'), L("Thank you. I'll be right back.", 'Gracias. Ya regreso.'))),
    opt((c) => step('snack', L('What do you have to eat with it?', '¿Qué tienen para comer con eso?'), L(`We have ${c.starter.en}.`, `Tenemos ${c.starter.es}.`))),
    () => step('close', L('Okay, thank you.', 'Bien, gracias.'), L('Cheers, enjoy your drinks!', '¡Salud, disfruten sus bebidas!')),
  ] },
  { id: 'vegetariano', es: 'Sin carne', level: 2, plan: () => [
    T.greet,
    () => step('tell', L('I do not eat meat.', 'No como carne.'), L('Thank you for telling me.', 'Gracias por decírmelo.'), ['meat']),
    () => step('ask', L('Do you have a dish with no meat?', '¿Tienen algún plato sin carne?'), L('The tomato soup has no meat.', 'La sopa de tomate no tiene carne.')),
    () => step('sure', L('Are you sure? No chicken at all?', '¿Seguro? ¿Nada de pollo?'), KITCHEN, [], LINKED),
    () => step('order', L('Okay. I will try the soup.', 'Bien. Voy a probar la sopa.'), L('Great choice! Anything else?', '¡Excelente elección! ¿Algo más?'), ['soup']),
    opt(() => step('close', L('Just some water, please.', 'Solo agua, por favor.'), BACK, ['water'])),
  ] },
  { id: 'cumple', es: 'Cumpleaños', level: 2, plan: () => [
    T.greet,
    () => step('birthday', L('It is my birthday today!', '¡Hoy es mi cumpleaños!'), L('Happy birthday! Congratulations!', '¡Feliz cumpleaños! ¡Felicidades!'), ['birthday']),
    () => step('candle', L('Can you bring a dessert with a candle?', '¿Puede traer un postre con una vela?'), KITCHEN, ['candle']),
    (c) => step('drink', L(`Thank you! And ${c.drink.en} for me.`, `¡Gracias! Y ${c.drink.es} para mí.`), BACK, [c.drink.word]),
    opt(() => step('photo', L('Can you take a picture of us?', '¿Nos toma una foto?'), L('Of course, no problem.', 'Claro, no hay problema.'))),
  ] },
  { id: 'familia', es: 'Familia con niños', level: 2, party: (c) => c.family.size, plan: () => [
    (c) => step('greet', L(`Hi, we are a family of ${c.family.en}.`, `Hola, somos una familia de ${c.family.es}.`), L('Welcome in! Are there any children?', '¡Bienvenidos! ¿Vienen niños?'), [c.family.en]),
    () => step('chair', L('Yes, we have a baby.', 'Sí, tenemos un bebé.'), L('Would you like a high chair?', '¿Quieren una silla para bebé?'), ['baby']),
    () => step('kids', L('Yes, please. Do you have food for kids?', 'Sí, por favor. ¿Tienen comida para niños?'), KITCHEN, ['kids']),
    opt(() => step('crayons', L('Thank you. The kids are hungry.', 'Gracias. Los niños tienen hambre.'), L('Here are some crayons for the kids.', 'Aquí tienen crayones para los niños.'))),
    ...ORDER,
    T.thatsAll,
  ] },
  { id: 'prisa', es: 'Mesa con prisa', level: 2, plan: () => [
    (c) => step('greet', L(`Hi, a table for ${c.party.en}. We have a show at eight.`, `Hola, una mesa para ${c.party.es}. Tenemos un show a las ocho.`), L('No problem. I will tell the kitchen.', 'No hay problema. Le aviso a la cocina.'), [c.party.en, 'eight']),
    () => step('fast', L('What is the fastest dish?', '¿Cuál es el plato más rápido?'), KITCHEN),
    ...ORDER,
    () => step('check', L('Can we also get the check with the food?', '¿Nos trae también la cuenta con la comida?'), L('Of course. Thank you for telling me.', 'Claro. Gracias por decírmelo.'), ['check']),
    opt(() => step('close', L('Thanks. Sorry for the rush.', 'Gracias. Perdón por la prisa.'), L('No problem. Have a great night!', 'No hay problema. ¡Que tengan linda noche!'))),
  ] },
  { id: 'queja', es: 'Hay un problema', level: 3, tail: true, tense: true, plan: () => [
    (c) => step('problem', pick(c.rng, [
      L(`Excuse me, this is not my ${c.main.en}.`, `Disculpe, este plato no es ${c.main.es}.`),
      L(`Excuse me, my ${c.main.en} is cold.`, `Disculpe, ${c.main.es} no está caliente.`),
    ]), L("I'm so sorry about that.", 'Lo siento mucho.'), [c.main.word]),
    () => step('what', L('What can you do about it?', '¿Qué puede hacer?'), L('Let me fix that for you.', 'Déjeme arreglarlo.')),
    () => step('bill', L('Can you take it off the bill?', '¿Lo puede quitar de la cuenta?'), L('I will talk to my manager.', 'Voy a hablar con mi gerente.')),
    () => step('how_long', L('How long will it take?', '¿Cuánto va a tardar?'), KITCHEN),
    opt(() => step('thanks', L('Okay. Thank you.', 'Bien. Gracias.'), L('Thank you for your patience.', 'Gracias por su paciencia.'))),
    opt(() => step('after', L('It is okay. These things happen.', 'Está bien. Son cosas que pasan.'), L('I understand. Thank you for telling me.', 'Entiendo. Gracias por decírmelo.'))),
  ] },
  { id: 'demora', es: 'Comida demorada', level: 3, tail: true, tense: true, plan: () => [
    () => step('problem', L('Excuse me, we have been waiting a long time.', 'Disculpe, llevamos mucho tiempo esperando.'), L('Sorry for the wait.', 'Perdón por la espera.'), ['waiting']),
    (c) => step('where', L(`Where is my ${c.main.en}?`, `¿Dónde está ${c.main.es}?`), KITCHEN, [c.main.word]),
    () => step('late', L('We need to leave soon.', 'Nos tenemos que ir pronto.'), L('I will tell the kitchen right away.', 'Le aviso a la cocina enseguida.')),
    () => step('bill', L('Can you do something for us?', '¿Puede hacer algo por nosotros?'), L('I will talk to my manager.', 'Voy a hablar con mi gerente.')),
    () => step('thanks', L('Okay. Please hurry.', 'Bien. Apúrese, por favor.'), L('Thank you for your patience.', 'Gracias por su paciencia.')),
    opt(() => step('after', L('Is the food ready now?', '¿Ya está lista la comida?'), L('Your food is ready.', 'Su comida está lista.'))),
  ] },
  { id: 'turista', es: 'Turista con dudas', level: 3, plan: () => [
    () => step('greet', L('Hello! We are visiting from far away.', '¡Hola! Venimos de muy lejos.'), L('Welcome! Enjoy your time in Miami.', '¡Bienvenidos! Disfruten su tiempo en Miami.')),
    () => step('water', L('What is still water?', '¿Qué es agua sin gas?'), L('It is water with no bubbles.', 'Es agua sin burbujas.'), ['water']),
    () => step('side', L('And what is a side?', '¿Y qué es un acompañamiento?'), L('It is a small dish with your meal.', 'Es un plato pequeño con su comida.'), ['side']),
    () => step('tip', L('Is the tip included here?', '¿La propina está incluida aquí?'), L('Let me check about the tip.', 'Déjeme consultar lo de la propina.'), ['tip']),
    ...ORDER,
    T.thatsAll,
  ] },
  { id: 'cambio', es: 'Cambia su pedido', level: 3, plan: () => [
    () => step('ask', L('Excuse me, can I change my order?', 'Disculpe, ¿puedo cambiar mi pedido?'), L('Of course. What would you like?', 'Claro. ¿Qué le gustaría?'), ['change']),
    (c) => step('new', L(`I want the ${c.alt.en}, not the ${c.main.en}.`, `Quiero ${c.alt.es}, no ${c.main.es}.`), L(`Okay, the ${c.alt.en}. I will tell the kitchen.`, `Bien, ${c.alt.es}. Le aviso a la cocina.`), [c.alt.word, c.main.word]),
    () => step('sorry', L('Is that okay? I am sorry.', '¿Está bien? Lo siento.'), L('No problem. It is okay.', 'No hay problema. Está bien.'), [], LINKED),
    () => step('how_long', L('Will it take a long time?', '¿Va a tardar mucho?'), KITCHEN),
    () => step('drink', L('Okay. Can I get more water while I wait?', 'Bien. ¿Me trae más agua mientras espero?'), BACK, ['water']),
    opt(() => step('thanks', L('Thank you for your help.', 'Gracias por su ayuda.'), L('It was a pleasure.', 'Fue un placer.'))),
  ] },
  { id: 'grupo', es: 'Grupo grande', level: 3, entrance: true, party: () => 8, plan: () => [
    () => step('greet', L('Hi, we are a big group. We are eight.', 'Hola, somos un grupo grande. Somos ocho.'), L('Welcome! Let me check our tables.', '¡Bienvenidos! Déjeme revisar las mesas.'), ['eight']),
    () => step('res', L('We do not have a reservation.', 'No tenemos reservación.'), L('No problem. One moment, please.', 'No hay problema. Un momento, por favor.'), ['reservation']),
    () => step('together', L('Can we all sit together?', '¿Podemos sentarnos todos juntos?'), L('Let me check. Thanks for waiting.', 'Déjeme ver. Gracias por esperar.'), ['together']),
    () => step('pay', L('And can we pay separately?', '¿Y podemos pagar por separado?'), L('Yes, we can split it up to four times.', 'Sí, podemos dividirla hasta en cuatro pagos.')),
    () => step('split', L('Oh, only four? Okay.', 'Ah, ¿solo cuatro? Bien.'), L('Yes. Your table is ready.', 'Sí. Su mesa está lista.'), [], LINKED),
    opt(() => step('close', L('Great, thank you very much.', 'Genial, muchas gracias.'), L('Please follow me.', 'Síganme, por favor.'))),
  ] },
  { id: 'aniversario', es: 'Aniversario', level: 3, party: () => 2, plan: () => [
    () => step('greet', L('Good evening. It is our anniversary.', 'Buenas noches. Es nuestro aniversario.'), L('Congratulations! Please follow me.', '¡Felicidades! Síganme, por favor.'), ['anniversary']),
    () => step('quiet', L('Do you have a quiet table?', '¿Tiene una mesa tranquila?'), L('Let me check. One moment, please.', 'Déjeme ver. Un momento, por favor.'), ['quiet']),
    (c) => step('wine', L(`Thank you. Two glasses of ${c.wine.en}, please.`, `Gracias. Dos copas de ${c.wine.es}, por favor.`), L('Of course. Can I see your ID, please?', 'Claro. ¿Me muestra su identificación, por favor?'), [c.wine.word]),
    () => step('id', L('Here you go. Now we can order.', 'Aquí tiene. Ya podemos ordenar.'), L('Thank you. What would you like for dinner?', 'Gracias. ¿Qué quieren cenar?')),
    ...ORDER,
    T.thatsAll,
    opt(() => step('photo', L('Can you take a picture of us?', '¿Nos toma una foto?'), L('Of course, no problem.', 'Claro, no hay problema.'))),
  ] },
  { id: 'cambiar_mesa', es: 'Quiere otra mesa', level: 3, tense: true, plan: () => [
    (c) => step('problem', pick(c.rng, [L('Excuse me, it is too cold at this table.', 'Disculpe, hace mucho frío en esta mesa.'), L('Excuse me, it is too loud at this table.', 'Disculpe, hay mucho ruido en esta mesa.')]), L("I'm sorry. Would you like another table?", 'Lo siento. ¿Quieren otra mesa?')),
    () => step('where', L('Yes, please. Near the window.', 'Sí, por favor. Cerca de la ventana.'), L('Let me check. One moment, please.', 'Déjeme ver. Un momento, por favor.'), ['window']),
    () => step('can', L('Is it possible?', '¿Se puede?'), L('Yes. Please follow me.', 'Sí. Síganme, por favor.'), [], LINKED),
    () => step('drinks', L('Great. Can you bring our drinks?', 'Genial. ¿Puede traer nuestras bebidas?'), L('Of course. I will bring your drinks.', 'Claro. Les traigo sus bebidas.'), ['drinks']),
    () => step('thanks', L('This is much better. Thank you.', 'Así está mucho mejor. Gracias.'), L('It was a pleasure.', 'Fue un placer.')),
  ] },
  { id: 'agotado', es: 'Se acabó el plato', level: 4, tense: true, plan: () => [
    (c) => step('order', L(`I will have the ${c.main.en}.`, `Quiero ${c.main.es}.`), L("I'm so sorry. We do not have that tonight.", 'Lo siento mucho. Hoy no tenemos ese plato.'), [c.main.word]),
    (c) => step('else', L('Oh no. What else is good?', 'Qué lástima. ¿Qué más está bueno?'), recommend(c.alt), [], LINKED),
    (c) => step('how', L('What is it like?', '¿Cómo es?'), c.alt.how, [], LINKED),
    (c) => step('confirm', L('Okay, I will have that.', 'Bien, voy a pedir ese.'), L(`Let me confirm. One ${c.alt.en}.`, `Déjeme confirmar. ${cap(c.alt.es)}.`), [], LINKED),
    () => step('thanks', L('Thanks for your help.', 'Gracias por su ayuda.'), L('Thank you for your patience.', 'Gracias por su paciencia.')),
  ] },
  { id: 'derrame', es: 'Se regó una bebida', level: 4, tense: true, plan: () => [
    () => step('spill', L('Oh no! My drink spilled on the table.', '¡Ay no! Mi bebida se regó en la mesa.'), L("I'm so sorry. Let me clean that up.", 'Lo siento mucho. Déjeme limpiar eso.'), ['drink']),
    () => step('shirt', L('It is on my shirt too.', 'También me cayó en la camisa.'), L('I will bring you some napkins.', 'Le traigo unas servilletas.'), ['shirt'], LINKED),
    () => step('new', L('Can I get a new drink?', '¿Me pueden traer otra bebida?'), L('Let me talk to my manager.', 'Déjeme hablar con mi gerente.')),
    () => step('fault', L('Thank you. It was my fault.', 'Gracias. Fue mi culpa.'), L('No problem. It is okay.', 'No hay problema. Está bien.')),
    opt(() => step('after', L('You are very kind.', 'Es muy amable.'), L('Thank you. It was a pleasure.', 'Gracias. Fue un placer.'))),
  ] },
];

// --- Niveles: cada uno trae situaciones nuevas y mesas más largas. ---
export const LEVELS = [
  { level: 1, from: 0, min: 4, max: 6 }, { level: 2, from: 4, min: 5, max: 7 },
  { level: 3, from: 10, min: 6, max: 8 }, { level: 4, from: 20, min: 7, max: 10 },
];
export function levelFor(done) {
  const current = [...LEVELS].reverse().find((l) => done >= l.from);
  const next = LEVELS.find((l) => l.from > done);
  return { level: current.level, done, toNext: next ? next.from - done : 0, min: current.min, max: current.max };
}

export const SCENE_IDS = SCENES.map((s) => s.id);
export const mesaKey = (m) => `${m.scene}|${m.persona.name}`;
/** Devuelve situaciones y personas de mesas recientes para no repetirlas enseguida. */
export const recentFrom = (keys) => ({
  avoidScenes: keys.slice(0, 6).map((k) => k.split('|')[0]),
  avoidNames: keys.map((k) => k.split('|')[1]),
});

function context(rng) {
  const main = pick(rng, MAINS);
  return {
    rng,
    party: pick(rng, PARTIES),
    family: pick(rng, PARTIES.slice(1)),
    main,
    alt: pick(rng, MAINS.filter((x) => x !== main)),
    drink: pick(rng, DRINKS),
    alcohol: pick(rng, ALCOHOL),
    wine: pick(rng, WINES),
    starter: pick(rng, STARTERS),
    side: pick(rng, SIDES),
    temp: pick(rng, TEMPS),
    dessert: pick(rng, DESSERTS),
    allergy: pick(rng, ALLERGIES),
    guestName: pick(rng, GUEST_NAMES),
  };
}

function chooseScene(rng, level, avoid, only) {
  if (only) return SCENES.find((s) => s.id === only);
  const open = SCENES.filter((s) => s.level <= level);
  const fresh = open.filter((s) => !avoid.includes(s.id));
  return pick(rng, (fresh.length ? fresh : open).flatMap((s) => Array(s.weight ?? 1).fill(s)));
}

/** Intercala imprevistos solo donde el alumno no acaba de hacer una pregunta, para que la charla siga teniendo sentido. */
function addExtras(steps, scene, target, rng) {
  const pool = scene.entrance || scene.ending ? [...ANYWHERE] : [...ANYWHERE, ...AT_TABLE, ...(scene.served ? SERVED : [])];
  while (steps.length < target && pool.length) {
    const lines = pool.splice(Math.floor(rng() * pool.length), 1)[0]();
    if (steps.length + lines.length > target || steps.some((s) => s.guest.en === lines[0].guest.en)) continue;
    const seams = scene.tail ? [] : [...steps.keys()].filter((i) => i > 0 && !steps[i].linked && !steps[i - 1].say.en.endsWith('?'));
    if (!seams.length && steps.at(-1).say.en.endsWith('?')) break;
    steps.splice(seams.length ? pick(rng, seams) : steps.length, 0, ...lines);
  }
}

export function buildMesa(rng = Math.random, { done = 0, avoidScenes = [], avoidNames = [], scene: only = null } = {}) {
  const info = levelFor(done);
  const c = context(rng);
  const scene = chooseScene(rng, info.level, avoidScenes, only);
  const pool = CAST.filter((p) => !avoidNames.includes(p.name));
  const cast = pick(rng, pool.length ? pool : CAST);
  const moodId = pick(rng, Object.keys(MOODS));
  const mood = MOODS[moodId];
  const target = info.min + Math.floor(rng() * (info.max - info.min + 1));

  const plan = scene.plan();
  const optional = plan.flatMap((fn, i) => (fn.optional ? [i] : []));
  while (plan.filter(Boolean).length > target && optional.length) {
    plan[optional.splice(Math.floor(rng() * optional.length), 1)[0]] = null;
  }
  const steps = plan.filter(Boolean).map((fn) => fn(c)).filter(Boolean);
  addExtras(steps, scene, target, rng);

  // El ánimo se presenta al llegar; en plena queja, un "qué felices estamos" no tendría sentido.
  const first = steps[0];
  if (first.kind === 'greet') first.guest = L(`${first.guest.en}${mood.open[0]}`, `${first.guest.es}${mood.open[1]}`);
  const closing = scene.tense
    ? pick(rng, [L('Thank you for your help.', 'Gracias por su ayuda.'), L('Okay. Thank you.', 'Bien. Gracias.')])
    : pick(rng, [mood.closing, L('Perfect, thank you so much!', '¡Perfecto, muchas gracias!'), L('You are very kind. Thank you!', 'Es muy amable. ¡Gracias!')]);
  return {
    title: `Mesa de ${cast.name}`,
    scene: scene.id,
    sceneEs: scene.es,
    level: info.level,
    persona: { name: cast.name, voice: cast.voice, azure: cast.azure, accent: cast.accent, accentEs: ACCENTS[cast.accent].es, mood: moodId, moodEs: mood.es },
    party: scene.party?.(c) ?? c.party.size,
    steps,
    closing,
    menuFacts: { drink: c.drink.en, main: c.main.en, side: c.main.side ? c.side.en : null, temp: c.main.temp ? c.temp.en : null, restaurant: MENU.restaurant },
  };
}
