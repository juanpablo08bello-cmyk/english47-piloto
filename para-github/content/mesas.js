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

// --- Turnos: qué dice el cliente y qué responde el alumno. ---
// Una respuesta es una intención con varias formas reales de decirla: se muestra una al azar y se aceptan todas.
const step = (kind, guest, say, keep = [], extra = {}) => ({ kind, guest, say, keep, ...extra });
const R = (goal, ...variants) => (rng) => {
  const [en, es] = pick(rng, variants);
  return { en, es, goal, alts: variants.map(([text]) => text) };
};
// Un turno LINKED continúa el anterior: ningún imprevisto se mete entre los dos.
const LINKED = { linked: true };
const G = (rng, ...lines) => pick(rng, lines.map(([en, es]) => L(en, es)));

const SAY = {
  welcomeFollow: R('Dales la bienvenida y llévalos a su mesa.',
    ['Welcome in! Right this way, please.', '¡Bienvenidos! Por aquí, por favor.'], ['Hi, welcome! Please follow me.', '¡Hola, bienvenidos! Síganme, por favor.'],
    ['Good evening! Come with me, please.', '¡Buenas noches! Vengan conmigo, por favor.'], ['Welcome! Your table is right over here.', '¡Bienvenidos! Su mesa está aquí mismo.'],
    ['Hi there! Follow me, please.', '¡Hola! Síganme, por favor.'], ['Of course! Welcome in. Right this way.', '¡Claro! Bienvenidos. Por aquí.']),
  insideOutside: R('Salúdalos y pregunta si prefieren adentro o afuera.',
    ['Welcome! Inside or outside tonight?', '¡Bienvenidos! ¿Adentro o afuera esta noche?'], ['Hi! Would you like to sit inside or outside?', '¡Hola! ¿Quieren sentarse adentro o afuera?'],
    ['Good evening! Do you prefer inside or outside?', '¡Buenas noches! ¿Prefieren adentro o afuera?'], ['Sure! Would you like inside or outside?', '¡Claro! ¿Quieren adentro o afuera?']),
  howMany: R('Salúdalos y pregunta cuántas personas son.',
    ['Welcome in! How many people tonight?', '¡Bienvenidos! ¿Cuántas personas esta noche?'], ['Hi there! How many in your party?', '¡Hola! ¿Cuántos son en su grupo?'],
    ['Good evening! Table for how many?', '¡Buenas noches! ¿Mesa para cuántos?'], ['Hi! How many are you tonight?', '¡Hola! ¿Cuántos son esta noche?']),
  follow: R('Diles que muy bien y que te sigan.',
    ['Perfect. Right this way.', 'Perfecto. Por aquí.'], ['Great. Please follow me.', 'Muy bien. Síganme, por favor.'], ['Sounds good. Come with me.', 'Muy bien. Vengan conmigo.'], ['No problem. Follow me, please.', 'No hay problema. Síganme, por favor.']),
  menus: R('Entrega el menú y dile que el mesero viene pronto.',
    ['Here are your menus. Your server will be right with you.', 'Aquí tienen sus menús. Su mesero viene enseguida.'], ['Here is the menu. Someone will be right with you.', 'Aquí está el menú. Alguien viene enseguida.'],
    ['Enjoy your night. Your server is coming right over.', 'Disfruten su noche. Su mesero ya viene.']),
  intro: R('Salúdalos, preséntate como su mesero y pregunta cómo están.',
    ["Hi! I'm your server tonight. How are you doing?", '¡Hola! Yo los atiendo esta noche. ¿Cómo están?'], ["Good evening! I'll be taking care of you. How are you?", '¡Buenas noches! Yo los voy a atender. ¿Cómo están?'],
    ['Hello! I will be your server. How is your night going?', '¡Hola! Yo seré su mesero. ¿Cómo va su noche?'], ['Hi, welcome in! I am your server. How are you tonight?', '¡Hola, bienvenidos! Soy su mesero. ¿Cómo están esta noche?'],
    ['Hi there! Sorry for the wait. How are you today?', '¡Hola! Perdón por la espera. ¿Cómo están hoy?']),
  startDrink: R('Di que te alegra y ofrece algo de tomar.',
    ['Glad to hear it. Can I get you something to drink?', 'Qué bueno. ¿Les traigo algo de tomar?'], ['Great! What can I get you to drink?', '¡Qué bien! ¿Qué les traigo de tomar?'],
    ['Nice! Can I start you with some drinks?', '¡Qué bien! ¿Empezamos con unas bebidas?'], ["I'm glad. Would you like something to drink?", 'Me alegra. ¿Quieren algo de tomar?']),
  drinkComing: R('Di que sí y que ya traes la bebida.',
    ["Sure, I'll be right back with that.", 'Claro, ya regreso con eso.'], ["Perfect. I'll bring that right out.", 'Perfecto. Se lo traigo enseguida.'],
    ['Of course. Coming right up.', 'Claro. Ya se lo traigo.'], ['You got it. I will be right back.', 'Con gusto. Ya regreso.']),
  takeTime: R('Diles que se tomen su tiempo.',
    ['No problem. Take your time.', 'No hay problema. Tómense su tiempo.'], ['Take all the time you need.', 'Tómense todo el tiempo que necesiten.'],
    ["Of course. I'll come back in a few minutes.", 'Claro. Regreso en unos minutos.'], ['Sure, no rush at all.', 'Claro, sin ninguna prisa.']),
  whatToDrink: R('Di que claro y pregunta qué quieren tomar.',
    ['Of course. What would you like?', 'Claro. ¿Qué les gustaría?'], ['Sure! What can I get you?', '¡Claro! ¿Qué les traigo?'], ['Absolutely. What are you having?', 'Con gusto. ¿Qué van a tomar?']),
  askId: R('Pide su identificación con amabilidad.',
    ['Of course. Can I see your ID, please?', 'Claro. ¿Me muestra su identificación, por favor?'], ['Great choice. I just need to see your ID.', 'Buena elección. Solo necesito ver su identificación.'],
    ['Sure. May I see your ID first?', 'Claro. ¿Puedo ver primero su identificación?']),
  thanksBack: R('Agradece y dile que ya regresas.',
    ["Thank you. I'll be right back.", 'Gracias. Ya regreso.'], ['Perfect, thanks. I will be right back.', 'Perfecto, gracias. Ya regreso.'], ['Thanks so much. Back in a minute.', 'Muchas gracias. Regreso en un minuto.']),
  back: R('Di que claro y que ya regresas.',
    ["Of course. I'll be right back.", 'Claro. Ya regreso.'], ['Sure, no problem. One moment.', 'Claro, no hay problema. Un momento.'], ["Absolutely. I'll get that for you.", 'Con gusto. Se lo traigo.'], ['Of course. Coming right up.', 'Claro. Ya se lo traigo.']),
  whatOrder: R('Di que muy bien y pregunta qué van a pedir.',
    ['Great! What can I get for you?', '¡Muy bien! ¿Qué les traigo?'], ['Perfect. What would you like?', 'Perfecto. ¿Qué les gustaría?'], ['Sure! What are you having tonight?', '¡Claro! ¿Qué van a comer esta noche?'], ['Of course. What can I get you?', 'Claro. ¿Qué les traigo?']),
  howCooked: R('Felicítalo por su elección y pregunta cómo quiere la carne.',
    ['Great choice! How would you like it cooked?', '¡Excelente elección! ¿Cómo le gustaría la carne?'], ['Good choice. How do you want it cooked?', 'Buena elección. ¿Cómo la quiere?'], ['Sure. How would you like that cooked?', 'Claro. ¿Cómo la quiere cocida?']),
  anythingElse: R('Felicítalo por su elección y pregunta si quiere algo más.',
    ['Great choice! Anything else?', '¡Excelente elección! ¿Algo más?'], ['Perfect. Can I get you anything else?', 'Perfecto. ¿Les traigo algo más?'], ['Good choice. Would you like anything else?', 'Buena elección. ¿Quieren algo más?'], ['Sounds good. Anything else for you?', 'Muy bien. ¿Algo más para usted?']),
  putIn: R('Agradece y dile que pasas el pedido a la cocina.',
    ["Thank you. I'll put that in for you.", 'Gracias. Le paso el pedido a la cocina.'], ['Perfect. Your food is coming soon.', 'Perfecto. Su comida viene pronto.'], ["Thanks. I'll get that started for you.", 'Gracias. Ya se lo preparan.']),
  kitchen: R('Dile que vas a consultar con la cocina.',
    ['Let me check with the kitchen.', 'Déjeme consultar con la cocina.'], ['Good question. Let me ask the kitchen.', 'Buena pregunta. Déjeme preguntar en la cocina.'], ['One moment. I will check with the kitchen.', 'Un momento. Voy a consultar con la cocina.']),
  thanksForTelling: R('Agradece que te lo haya dicho.',
    ['Thank you for telling me.', 'Gracias por decírmelo.'], ['Thanks for letting me know.', 'Gracias por avisarme.'], ['Good to know. Thank you for telling me.', 'Es bueno saberlo. Gracias por decírmelo.']),
  chef: R('Di que no quieres adivinar y que preguntarás al chef.',
    ["I don't want to guess. I will ask the chef.", 'No quiero adivinar. Le voy a preguntar al chef.'], ['I am not sure. Let me ask the chef first.', 'No estoy seguro. Déjeme preguntarle primero al chef.'], ['I want to be sure. I will talk to the chef.', 'Quiero estar seguro. Voy a hablar con el chef.']),
  howIsIt: R('Pregunta cómo va todo.',
    ['How is everything?', '¿Cómo va todo?'], ['How is everything tasting?', '¿Cómo está todo?'], ['Is everything good so far?', '¿Todo bien hasta ahora?'], ['How is your food tonight?', '¿Cómo está su comida esta noche?']),
  glad: R('Di que te alegra y que ya regresas.',
    ["I'm so glad. I'll be right back.", 'Qué bueno. Ya regreso.'], ['Glad to hear it. I will be right back.', 'Me alegra oír eso. Ya regreso.'], ["That's great. I'll get that for you.", 'Qué bien. Se lo traigo.']),
  clearPlates: R('Pregunta si puedes llevarte los platos.',
    ['May I take your plates?', '¿Puedo llevarme sus platos?'], ['Can I take those out of your way?', '¿Les quito eso de en medio?'], ['Are you all done with these?', '¿Ya terminaron con estos?']),
  dessert: R('Ofrece postre.',
    ['Would you like dessert?', '¿Quieren postre?'], ['Did you save room for dessert?', '¿Les quedó espacio para el postre?'], ['Can I get you some dessert?', '¿Les traigo postre?'], ['Do you have room for something sweet?', '¿Les queda espacio para algo dulce?']),
  dessertList: R('Dile los postres que tienen.',
    ['We have key lime pie and cheesecake.', 'Tenemos pie de limón y pastel de queso.'], ['Tonight we have cheesecake and key lime pie.', 'Esta noche tenemos pastel de queso y pie de limón.']),
  spoons: R('Felicítalos por su elección y ofrece más cucharas.',
    ['Great choice! Would you like more spoons?', '¡Excelente elección! ¿Quieren más cucharas?'], ['Good choice. Do you need two spoons?', 'Buena elección. ¿Necesitan dos cucharas?']),
  milkSugar: R('Pregunta si quiere leche o azúcar.',
    ['Would you like milk or sugar?', '¿Quiere leche o azúcar?'], ['Sure. Milk or sugar with that?', 'Claro. ¿Leche o azúcar?'], ['Of course. Do you take milk or sugar?', 'Claro. ¿Lo toma con leche o azúcar?']),
  hereCheck: R('Di que claro y entrega la cuenta.',
    ['Of course. Here is your check.', 'Claro. Aquí está su cuenta.'], ['Sure. Here you go. No rush.', 'Claro. Aquí tiene. Sin prisa.'], ['Absolutely. I have your check right here.', 'Con gusto. Aquí tengo su cuenta.']),
  split: R('Di que sí y pregunta si van juntos o separados.',
    ['Sure. Together or separate?', 'Claro. ¿Juntos o separados?'], ['No problem. How would you like to split it?', 'No hay problema. ¿Cómo la quieren dividir?'], ['Of course. One check or two?', 'Claro. ¿Una cuenta o dos?']),
  tipCheck: R('Dile que vas a confirmar lo de la propina.',
    ['Let me check about the tip.', 'Déjeme consultar lo de la propina.'], ['Good question. Let me check that for you.', 'Buena pregunta. Déjeme revisarlo.']),
  takeCard: R('Agradece y dile que regresas con su tarjeta.',
    ["Thank you. I'll be right back with your card.", 'Gracias. Regreso enseguida con su tarjeta.'], ["Perfect. I'll bring your card right back.", 'Perfecto. Ya le traigo su tarjeta.'], ['Thanks. One moment with your card.', 'Gracias. Un momento con su tarjeta.']),
  receipt: R('Entrega el recibo y pide que firme.',
    ['Here is your receipt. Please sign here.', 'Aquí está su recibo. Firme aquí, por favor.'], ['Here you go. I just need your signature.', 'Aquí tiene. Solo necesito su firma.'], ['This is your receipt. Please sign right here.', 'Este es su recibo. Firme aquí, por favor.']),
  goodbye: R('Agradece la visita y despídete.',
    ['Thank you for coming. Have a great night!', 'Gracias por venir. ¡Que tengan linda noche!'], ['Thanks for coming in. See you soon!', 'Gracias por venir. ¡Nos vemos pronto!'], ['It was a pleasure. Have a good night!', 'Fue un placer. ¡Que pasen buena noche!'], ['Thank you so much. Come back soon!', 'Muchas gracias. ¡Vuelvan pronto!']),
  full: R('Dile con amabilidad que ahora están llenos.',
    ['We are full right now.', 'Estamos llenos ahora mismo.'], ['Sorry, all our tables are full right now.', 'Perdón, todas las mesas están llenas ahora.'], ['We are very busy right now, sorry.', 'Estamos muy llenos ahora, perdón.']),
  waitTime: R('Dile que son unos quince minutos de espera.',
    ['It is about a fifteen minute wait.', 'Son unos quince minutos de espera.'], ['About fifteen minutes.', 'Unos quince minutos.'], ['It should be around fifteen minutes.', 'Deberían ser unos quince minutos.']),
  getName: R('Agradece y pide su nombre.',
    ['Thank you. Can I get your name?', 'Gracias. ¿Me da su nombre?'], ['Great. What name should I put?', 'Muy bien. ¿A qué nombre lo pongo?'], ['Perfect. Can I get a name for the list?', 'Perfecto. ¿Me da un nombre para la lista?']),
  waitBar: R('Dile que pueden esperar en la barra.',
    ['You can wait at the bar.', 'Pueden esperar en la barra.'], ['You are welcome to wait at the bar.', 'Pueden esperar en la barra con gusto.'], ['The bar is a great place to wait.', 'La barra es un buen lugar para esperar.']),
  tableReady: R('Dile que su mesa está lista y agradece la espera.',
    ['Yes. Thanks for waiting.', 'Sí. Gracias por esperar.'], ['Yes, your table is ready now.', 'Sí, su mesa ya está lista.'], ['Good timing. Your table is ready.', 'Justo a tiempo. Su mesa está lista.']),
  underName: R('Dales la bienvenida y pregunta a nombre de quién.',
    ['Welcome in! Under what name?', '¡Bienvenidos! ¿A nombre de quién?'], ['Great! What name is it under?', '¡Muy bien! ¿A qué nombre está?'], ['Welcome! Can I get the name, please?', '¡Bienvenidos! ¿Me da el nombre, por favor?']),
  foundIt: R('Dile que encontraste la reservación y pregunta cuántos son.',
    ['I found it, thank you. How many people?', 'La encontré, gracias. ¿Cuántas personas?'], ['Here it is. How many are you tonight?', 'Aquí está. ¿Cuántos son esta noche?'], ['Perfect, I see it. Table for how many?', 'Perfecto, ya la veo. ¿Mesa para cuántos?']),
  toGoElse: R('Di que claro y pregunta si quiere algo más.',
    ['Of course. Anything else?', 'Claro. ¿Algo más?'], ['Sure! Can I get you anything else?', '¡Claro! ¿Le traigo algo más?'], ['Sounds good. Anything to drink with that?', 'Muy bien. ¿Algo de tomar con eso?']),
  tenMinutes: R('Dile que estará listo en diez minutos.',
    ['It will be ready in ten minutes.', 'Estará listo en diez minutos.'], ['Give us about ten minutes.', 'Denos unos diez minutos.'], ['It should take around ten minutes.', 'Debe tardar unos diez minutos.']),
  whatName: R('Agradece y pregunta su nombre.',
    ['Thank you. What is your name?', 'Gracias. ¿Cuál es su nombre?'], ['Great. Can I get a name for the order?', 'Muy bien. ¿Me da un nombre para el pedido?'], ['Perfect. What name is it for?', 'Perfecto. ¿A qué nombre?']),
  bag: R('Pregunta si quiere una bolsa.',
    ['Would you like a bag?', '¿Quiere una bolsa?'], ['Do you need a bag for that?', '¿Necesita una bolsa para eso?']),
  orderReady: R('Entrega el pedido y agradece la visita.',
    ['Here is your order. Thank you for coming.', 'Aquí está su pedido. Gracias por venir.'], ['Here you go. Enjoy your food!', 'Aquí tiene. ¡Buen provecho!'], ['All ready. Thanks, and have a good night!', 'Todo listo. ¡Gracias, y buena noche!']),
  welcomeBack: R('Alégrate de verlos otra vez y llévalos a su mesa.',
    ['Welcome back! So good to see you again.', '¡Bienvenidos otra vez! Qué gusto verlos de nuevo.'], ['Hi again! Nice to see you. Right this way.', '¡Hola otra vez! Qué gusto verlos. Por aquí.'], ['Welcome back! Your table is right over here.', '¡Bienvenidos otra vez! Su mesa está aquí mismo.']),
  sameAgain: R('Pregunta si quieren lo mismo de siempre.',
    ['Would you like the same as last time?', '¿Quieren lo mismo de la última vez?'], ['The usual for you tonight?', '¿Lo de siempre esta noche?'], ['Are you having the same as last time?', '¿Van a pedir lo mismo de la última vez?']),
  box: R('Di que claro y que traes una caja.',
    ["Of course. I'll bring you a box.", 'Claro. Le traigo una caja.'], ['Sure, let me get you a box.', 'Claro, déjeme traerle una caja.'], ['No problem. I will box that for you.', 'No hay problema. Se lo pongo en una caja.']),
  firstTime: R('Pregunta si es su primera vez aquí.',
    ['Welcome! Is this your first time with us?', '¡Bienvenidos! ¿Es su primera vez con nosotros?'], ['Hi! Have you been here before?', '¡Hola! ¿Ya habían venido antes?'], ['Good evening! Is this your first time here?', '¡Buenas noches! ¿Es su primera vez aquí?']),
  firstWelcome: R('Dales la bienvenida y explícales que estás para ayudar.',
    ["How nice! I'm happy to help you with the menu.", '¡Qué bien! Con gusto les ayudo con el menú.'], ['Great, welcome! Let me know if you have any questions.', '¡Qué bien, bienvenidos! Avísenme si tienen preguntas.'], ['Welcome! Tell me if I can help you with anything.', '¡Bienvenidos! Díganme si les ayudo en algo.']),
  safeShare: R('Di que claro y que traes un plato extra.',
    ['Of course. I will bring an extra plate.', 'Claro. Les traigo un plato extra.'], ['Sure! Let me get you two plates.', '¡Claro! Déjeme traerles dos platos.'], ['No problem. I can bring an extra plate.', 'No hay problema. Puedo traer un plato extra.']),
  sorry: R('Discúlpate por lo que pasó.',
    ["I'm so sorry about that.", 'Lo siento mucho.'], ['I am very sorry about that.', 'Lo siento mucho por eso.'], ['Oh no, I apologize for that.', 'Ay no, le pido disculpas.']),
  fix: R('Ofrece arreglarlo.',
    ['Let me fix that for you.', 'Déjeme arreglarlo.'], ['I will fix that right away.', 'Lo arreglo enseguida.'], ['I will take care of that for you.', 'Yo me encargo de eso.']),
  manager: R('Dile que hablarás con tu gerente.',
    ['I will talk to my manager.', 'Voy a hablar con mi gerente.'], ['Let me get my manager for you.', 'Déjeme llamar a mi gerente.'], ['Let me ask my manager about that.', 'Déjeme preguntarle a mi gerente.']),
  patience: R('Agradece su paciencia.',
    ['Thank you for your patience.', 'Gracias por su paciencia.'], ['Thanks for being so patient.', 'Gracias por tener tanta paciencia.'], ['I appreciate your patience. Thank you.', 'Agradezco su paciencia. Gracias.']),
  sorryWait: R('Discúlpate por la espera.',
    ['Sorry for the wait.', 'Perdón por la espera.'], ['I am so sorry about the wait.', 'Lamento mucho la espera.'], ['I apologize for the wait.', 'Le pido disculpas por la espera.']),
  tellKitchen: R('Dile que avisarás a la cocina enseguida.',
    ['I will tell the kitchen right away.', 'Le aviso a la cocina enseguida.'], ['Let me talk to the kitchen right now.', 'Déjeme hablar con la cocina ahora mismo.']),
  noProblem: R('Dile que no hay problema.',
    ['No problem. It is okay.', 'No hay problema. Está bien.'], ['No worries at all.', 'No se preocupe.'], ["That's okay, no problem.", 'Está bien, no hay problema.']),
  pleasure: R('Dile que fue un placer.',
    ['It was a pleasure.', 'Fue un placer.'], ['You are very welcome.', 'Con mucho gusto.'], ['My pleasure. Enjoy your night.', 'Con gusto. Disfruten su noche.']),
  checkOneMoment: R('Dile que vas a revisar y pide un momento.',
    ['Let me check. One moment, please.', 'Déjeme ver. Un momento, por favor.'], ['One moment. Let me see what I can do.', 'Un momento. Déjeme ver qué puedo hacer.'], ['Let me look for you. One moment.', 'Déjeme revisar. Un momento.']),
  newDrinks: R('Di que claro y que les llevas sus bebidas.',
    ['Of course. I will bring your drinks.', 'Claro. Les traigo sus bebidas.'], ['Sure, I will bring those over for you.', 'Claro, yo se las llevo.']),
  otherTable: R('Discúlpate y ofrece otra mesa.',
    ["I'm sorry. Would you like another table?", 'Lo siento. ¿Quieren otra mesa?'], ['So sorry. Can I move you to another table?', 'Lo siento mucho. ¿Los cambio a otra mesa?']),
  clean: R('Discúlpate y ofrece limpiar.',
    ["I'm so sorry. Let me clean that up.", 'Lo siento mucho. Déjeme limpiar eso.'], ['Oh, I am sorry. I will clean that right now.', 'Ay, perdón. Lo limpio ahora mismo.']),
  napkins: R('Dile que le traerás servilletas.',
    ['I will bring you some napkins.', 'Le traigo unas servilletas.'], ['Let me get you some napkins.', 'Déjeme traerle unas servilletas.']),
  soldOut: R('Discúlpate y dile que hoy no tienen ese plato.',
    ["I'm so sorry. We do not have that tonight.", 'Lo siento mucho. Hoy no tenemos ese plato.'], ['I am sorry. We are out of that tonight.', 'Lo siento. Esta noche se nos acabó.'], ['Sorry, that one is sold out tonight.', 'Perdón, ese ya se agotó esta noche.']),
  cardFailed: R('Dile con discreción que la tarjeta no pasó.',
    ['I am sorry. Your card did not go through.', 'Lo siento. Su tarjeta no pasó.'], ['Sorry, there was a problem with this card.', 'Perdón, hubo un problema con esta tarjeta.']),
  otherCard: R('Pregunta si tiene otra tarjeta o efectivo.',
    ['Do you have another card or cash?', '¿Tiene otra tarjeta o efectivo?'], ['Would you like to try another card?', '¿Quiere probar con otra tarjeta?']),
  checkBill: R('Discúlpate y dile que vas a revisar la cuenta.',
    ['I am so sorry. Let me check your bill.', 'Lo siento mucho. Déjeme revisar su cuenta.'], ['Oh, sorry about that. I will fix your check.', 'Ay, perdón. Le corrijo la cuenta.']),
  closingSoon: R('Avísale que la cocina cierra pronto.',
    ['Just so you know, the kitchen closes soon.', 'Para que sepan, la cocina cierra pronto.'], ['The kitchen closes in ten minutes.', 'La cocina cierra en diez minutos.']),
  birthday: R('Deséale feliz cumpleaños.',
    ['Happy birthday! Congratulations!', '¡Feliz cumpleaños! ¡Felicidades!'], ['Happy birthday! That is great!', '¡Feliz cumpleaños! ¡Qué bien!'], ['Oh, happy birthday! Welcome!', '¡Ay, feliz cumpleaños! ¡Bienvenido!']),
  photo: R('Di que con gusto le tomas la foto.',
    ['Of course, no problem.', 'Claro, no hay problema.'], ['Sure! Everybody smile.', '¡Claro! Todos a sonreír.'], ['I would love to. Smile!', 'Con mucho gusto. ¡Sonrían!']),
  rushOk: R('Di que no hay problema y que avisas a la cocina.',
    ['No problem. I will tell the kitchen.', 'No hay problema. Le aviso a la cocina.'], ['Thanks for telling me. I will let the kitchen know.', 'Gracias por decirme. Le aviso a la cocina.']),
  children: R('Dales la bienvenida y pregunta si vienen niños.',
    ['Welcome in! Are there any children?', '¡Bienvenidos! ¿Vienen niños?'], ['Welcome! Are any kids with you tonight?', '¡Bienvenidos! ¿Vienen niños con ustedes?']),
  highChair: R('Ofrece una silla para bebé.',
    ['Would you like a high chair?', '¿Quieren una silla para bebé?'], ['Can I bring you a high chair?', '¿Les traigo una silla para bebé?'], ['Do you need a high chair for the baby?', '¿Necesitan una silla para el bebé?']),
  crayons: R('Entrega los crayones para los niños.',
    ['Here are some crayons for the kids.', 'Aquí tienen crayones para los niños.'], ['These crayons are for the kids.', 'Estos crayones son para los niños.']),
  wineOrWhite: R('Di que claro y pregunta si quieren tinto o blanco.',
    ['Of course. Red or white wine?', 'Claro. ¿Vino tinto o blanco?'], ['Sure. Do you like red or white?', 'Claro. ¿Les gusta tinto o blanco?'], ['Here you go. Are you thinking red or white?', 'Aquí tiene. ¿Piensan en tinto o blanco?']),
  cheers: R('Brinda y deséales que disfruten.',
    ['Cheers, enjoy your drinks!', '¡Salud, disfruten sus bebidas!'], ['Here you go. Enjoy!', 'Aquí tienen. ¡Disfruten!'], ['Enjoy your drinks. I will check on you soon.', 'Disfruten sus bebidas. Regreso pronto.']),
  noMeat: R('Dile que la sopa de tomate no lleva carne.',
    ['The tomato soup has no meat.', 'La sopa de tomate no tiene carne.'], ['Our tomato soup has no meat in it.', 'Nuestra sopa de tomate no lleva carne.']),
  congrats: R('Felicítalos y pídeles que te sigan.',
    ['Congratulations! Please follow me.', '¡Felicidades! Síganme, por favor.'], ['Oh, congratulations! Right this way.', '¡Ay, felicidades! Por aquí.'], ['Congratulations to you both! Come with me.', '¡Felicidades a los dos! Vengan conmigo.']),
  letMeCheckTables: R('Dales la bienvenida y di que revisarás las mesas.',
    ['Welcome! Let me check our tables.', '¡Bienvenidos! Déjeme revisar las mesas.'], ['Wow, welcome! Let me see what we have.', '¡Qué bien, bienvenidos! Déjeme ver qué tenemos.']),
  splitFour: R('Dile que pueden dividir la cuenta hasta en cuatro pagos.',
    ['Yes, we can split it up to four times.', 'Sí, podemos dividirla hasta en cuatro pagos.'], ['Yes, up to four cards on one check.', 'Sí, hasta cuatro tarjetas por cuenta.']),
  explainWater: R('Explícale que es agua sin burbujas.',
    ['It is water with no bubbles.', 'Es agua sin burbujas.'], ['It is just normal water, no bubbles.', 'Es agua normal, sin burbujas.']),
  explainSide: R('Explícale que es un plato pequeño con su comida.',
    ['It is a small dish with your meal.', 'Es un plato pequeño con su comida.'], ['It is something small that comes with your food.', 'Es algo pequeño que viene con su comida.']),
  miamiWelcome: R('Dales la bienvenida y deséales que disfruten Miami.',
    ['Welcome! Enjoy your time in Miami.', '¡Bienvenidos! Disfruten su tiempo en Miami.'], ['How nice! Welcome to Miami.', '¡Qué bien! Bienvenidos a Miami.'], ['Welcome! I hope you love Miami.', '¡Bienvenidos! Espero que les encante Miami.']),
  changeOk: R('Di que claro y pregunta qué le gustaría.',
    ['Of course. What would you like?', 'Claro. ¿Qué le gustaría?'], ['No problem. What can I get you instead?', 'No hay problema. ¿Qué le traigo en su lugar?']),
};

const fixed = (goal, en, es) => ({ en, es, goal, alts: [en] });
const recommend = (c, dish) => R(`Recomiéndale ${dish.es}.`,
  [`I recommend the ${dish.en}.`, `Le recomiendo ${dish.es}.`], [`The ${dish.en} is really good.`, `${cap(dish.es)} está muy bueno.`], [`I really like the ${dish.en}.`, `A mí me gusta mucho ${dish.es}.`], [`Most people love the ${dish.en}.`, `A casi todos les encanta ${dish.es}.`])(c.rng);
const describe = (dish) => fixed('Explícale cómo es el plato.', dish.how.en, dish.how.es);

function orderLine(c) {
  const side = c.main.side ? [` with ${c.side.en}`, ` con ${c.side.es}`] : ['', ''];
  return G(c.rng,
    [`I will have the ${c.main.en}${side[0]}.`, `Quiero ${c.main.es}${side[1]}.`],
    [`Can I get the ${c.main.en}${side[0]}?`, `¿Me trae ${c.main.es}${side[1]}?`],
    [`I would like the ${c.main.en}${side[0]}, please.`, `Quisiera ${c.main.es}${side[1]}, por favor.`],
    [`I think I want the ${c.main.en}${side[0]}.`, `Creo que quiero ${c.main.es}${side[1]}.`],
    [`Let me try the ${c.main.en}${side[0]}.`, `Déjeme probar ${c.main.es}${side[1]}.`]);
}
function confirmSay(c) {
  const en = `${c.main.en}${c.main.temp ? `, ${c.temp.en}` : ''}${c.main.side ? `, with ${c.side.en}` : ''}`;
  const es = `${c.main.es}${c.main.temp ? `, ${c.temp.es}` : ''}${c.main.side ? `, con ${c.side.es}` : ''}`;
  return R(`Confirma el pedido: ${es}.`,
    [`Let me confirm. One ${en}.`, `Déjeme confirmar. ${cap(es)}.`], [`Okay, so one ${en}.`, `Bien, entonces ${es}.`], [`Perfect. That is one ${en}.`, `Perfecto. Es ${es}.`])(c.rng);
}
// Respuestas de las situaciones nuevas (1.3).
Object.assign(SAY, {
  eggsHow: R('Pregunta cómo quiere sus huevos.',
    ['How would you like your eggs?', '¿Cómo quiere sus huevos?'], ['Sure. How do you want your eggs?', 'Claro. ¿Cómo quiere sus huevos?'], ['Of course. And how would you like the eggs?', 'Claro. ¿Y cómo quiere los huevos?']),
  toastWhich: R('Pregunta si quiere pan blanco o integral.',
    ['White or whole wheat toast?', '¿Pan blanco o integral?'], ['Would you like white or whole wheat?', '¿Lo quiere blanco o integral?'], ['Got it. White or whole wheat?', 'Entendido. ¿Blanco o integral?']),
  coffeeRefill: R('Ofrece más café.',
    ['Can I get you more coffee?', '¿Le traigo más café?'], ['Would you like more coffee?', '¿Quiere más café?'], ['Let me get you a refill.', 'Le traigo más.']),
  happyHourInfo: R('Di que sí: las bebidas están en oferta hasta las siete.',
    ['Yes! Drinks are half price until seven.', '¡Sí! Las bebidas están a mitad de precio hasta las siete.'], ['Yes, we have drink specials until seven.', 'Sí, tenemos bebidas en oferta hasta las siete.']),
  happyHourFood: R('Recomienda las alitas o los tacos, que están en oferta.',
    ['The wings are on special. They are really good.', 'Las alitas están en oferta. Son muy buenas.'], ['I recommend the tacos. They are on special too.', 'Le recomiendo los tacos. También están en oferta.']),
  overcookedSorry: R('Discúlpate y ofrece uno nuevo.',
    ['I am so sorry. Let me ask the kitchen for a new one.', 'Lo siento mucho. Le pido uno nuevo a la cocina.'], ['I apologize. Let me get you a new steak.', 'Le pido disculpas. Le traigo otro filete.'], ['Sorry about that. I will have the chef cook a new one.', 'Perdón por eso. Le pido al chef que cocine uno nuevo.']),
  howCooked: R('Pregunta cómo lo quiere esta vez.',
    ['How would you like it cooked this time?', '¿Cómo lo quiere esta vez?'], ['Of course. How would you like it?', 'Claro. ¿Cómo lo quiere?']),
  whileWait: R('Ofrece traer algo mientras espera.',
    ['Can I bring you something while you wait?', '¿Le traigo algo mientras espera?'], ['Would you like some bread while you wait?', '¿Quiere pan mientras espera?']),
});

const ALL_SET = (c) => G(c.rng, ['No, that is all for now.', 'No, eso es todo por ahora.'], ['That is everything, thank you.', 'Eso es todo, gracias.'], ['I think we are good.', 'Creo que estamos bien.'], ['Nope, that is it.', 'No, eso es todo.'], ['No, thanks. I am good.', 'No, gracias. Estoy bien.']);

const T = {
  door: (c) => step('greet', G(c.rng,
    [`Hi, a table for ${c.party.en}, please.`, `Hola, una mesa para ${c.party.es}, por favor.`],
    [`Hello, do you have a table for ${c.party.en}?`, `Hola, ¿tiene una mesa para ${c.party.es}?`],
    [`Good evening. We are ${c.party.en} people.`, `Buenas noches. Somos ${c.party.es} personas.`],
    [`Hi! Just ${c.party.en} of us tonight.`, `¡Hola! Solo ${c.party.es} esta noche.`],
    [`Hey there. Can we get a table for ${c.party.en}?`, `Hola. ¿Nos da una mesa para ${c.party.es}?`]), SAY.welcomeFollow(c.rng)),
  seatChoice: (c) => step('greet', G(c.rng,
    [`Hi, a table for ${c.party.en}, please.`, `Hola, una mesa para ${c.party.es}, por favor.`],
    [`Good evening. There are ${c.party.en} of us.`, `Buenas noches. Somos ${c.party.es}.`],
    [`Hi there! Do you have room for ${c.party.en}?`, `¡Hola! ¿Tienen lugar para ${c.party.es}?`],
    [`Hey, are you open? We are ${c.party.en}.`, `Hola, ¿están abiertos? Somos ${c.party.es}.`]), SAY.insideOutside(c.rng)),
  whoIsComing: (c) => step('greet', G(c.rng, ['Hi! Can we get a table?', '¡Hola! ¿Nos da una mesa?'], ['Good evening. Do you have any tables?', 'Buenas noches. ¿Tienen mesas?'], ['Hello! Can we eat here tonight?', '¡Hola! ¿Podemos comer aquí esta noche?'], ['Hi there. Is it too late to eat?', 'Hola. ¿Es muy tarde para comer?']), SAY.howMany(c.rng)),
  intro: (c) => step('greet', G(c.rng, ['Hi! Are you our server?', '¡Hola! ¿Usted es nuestro mesero?'], ['Hello there.', 'Hola.'], ['Hi, how are you?', 'Hola, ¿cómo está?'], ['Excuse me, is someone helping us?', 'Disculpe, ¿alguien nos está atendiendo?'], ['Hey, good evening.', 'Hola, buenas noches.'], ['Oh, hi! We just sat down.', '¡Ah, hola! Acabamos de sentarnos.']), SAY.intro(c.rng)),
  feel: (c) => step('feel', G(c.rng, ['We are good, thanks.', 'Estamos bien, gracias.'], ['Great, thank you.', 'Muy bien, gracias.'], ['Pretty good, thanks. Long day.', 'Bastante bien, gracias. Día largo.'], ['Doing well, thanks.', 'Bien, gracias.'], ['Very good. We are so hungry!', 'Muy bien. ¡Tenemos mucha hambre!']), SAY.startDrink(c.rng), [], LINKED),
  drinkOrder: (c) => step('drink2', G(c.rng,
    [`${cap(c.drink.en)}, please.`, `${cap(c.drink.es)}, por favor.`], [`I would like ${c.drink.en}, please.`, `Quisiera ${c.drink.es}, por favor.`], [`Can I get ${c.drink.en}?`, `¿Me trae ${c.drink.es}?`],
    [`I will just have ${c.drink.en}.`, `Solo quiero ${c.drink.es}.`], [`Do you have ${c.drink.en}?`, `¿Tienen ${c.drink.es}?`]), SAY.drinkComing(c.rng), [], LINKED),
  notReady: (c) => step('wait', G(c.rng, ['Thanks. We need a few more minutes for the food.', 'Gracias. Necesitamos unos minutos más para la comida.'], ['We are still looking at the menu.', 'Todavía estamos viendo el menú.'], ['Everything looks good. We can not decide!', 'Todo se ve bien. ¡No nos decidimos!']), SAY.takeTime(c.rng)),
  ready: (c) => step('ready', G(c.rng, ['I think we are ready.', 'Creo que estamos listos.'], ['Okay, we know what we want.', 'Bien, ya sabemos qué queremos.'], ['Excuse me, we are ready to order.', 'Disculpe, estamos listos para ordenar.'], ['Hi, can we order now?', 'Hola, ¿podemos ordenar ya?'], ['We are starving. Can we order?', 'Tenemos mucha hambre. ¿Podemos ordenar?']), SAY.whatOrder(c.rng)),
  order: (c) => step('order', orderLine(c), c.main.temp ? SAY.howCooked(c.rng) : SAY.anythingElse(c.rng), [], LINKED),
  temp: (c) => (c.main.temp ? step('temp', G(c.rng, [`${cap(c.temp.en)}, please.`, `${cap(c.temp.es)}, por favor.`], [`I like it ${c.temp.en}.`, `Me gusta ${c.temp.es}.`], [`Make it ${c.temp.en}, please.`, `Que sea ${c.temp.es}, por favor.`]), SAY.anythingElse(c.rng), [], LINKED) : null),
  thatsAll: (c) => step('confirm', ALL_SET(c), confirmSay(c), [], LINKED),
  close: (c) => step('close', G(c.rng, ['Yes, that is right. Thank you!', 'Sí, así es. ¡Gracias!'], ['Perfect, thanks.', 'Perfecto, gracias.'], ['Yes. How long will it take?', 'Sí. ¿Cuánto va a tardar?'], ['That sounds right.', 'Suena bien.']), SAY.putIn(c.rng), [], LINKED),
};
const ORDER = [T.order, T.temp];
const FOLLOW_UP = (c) => step('sit', G(c.rng, ['Outside, please. It is a nice night.', 'Afuera, por favor. Hace buena noche.'], ['Inside, please.', 'Adentro, por favor.'], ['Inside is great, thanks.', 'Adentro está bien, gracias.'], ['Outside, if you have room.', 'Afuera, si tiene lugar.'], ['Anywhere is fine.', 'Donde sea está bien.']), SAY.follow(c.rng), [], LINKED);
const SEATED = (c) => step('sit2', G(c.rng, ['Thank you. This table is nice.', 'Gracias. Esta mesa está bonita.'], ['Great, thank you.', 'Genial, gracias.'], ['Oh, nice. Can we see the menu?', 'Qué bien. ¿Podemos ver el menú?'], ['Wow, I love this place.', 'Vaya, me encanta este lugar.']), SAY.menus(c.rng), [], LINKED);

// Imprevistos que le dan vida a la charla. ANYWHERE sirve siempre; AT_TABLE, ya sentados; SERVED, con la comida en la mesa.
const extra = (guests, sayFn) => (c) => [step('extra', G(c.rng, ...guests), sayFn(c))];
const restroom = R('Dile dónde está el baño.', ['The restroom is in the back, on the right.', 'El baño está al fondo, a la derecha.'], ['It is in the back, on your right.', 'Está al fondo, a su derecha.'], ['Go to the back and turn right.', 'Vaya al fondo y gire a la derecha.']);
const yesCards = R('Dile que sí aceptan tarjetas.', ['Yes, we do.', 'Sí, aceptamos.'], ['Yes, we take all cards.', 'Sí, aceptamos todas las tarjetas.'], ['Of course we do.', 'Claro que sí.']);
const doingWell = R('Responde que estás bien y da las gracias.', ["I'm doing well, thank you.", 'Estoy bien, gracias.'], ['Very well, thanks for asking.', 'Muy bien, gracias por preguntar.'], ['I am great. Thank you!', 'Estoy muy bien. ¡Gracias!']);
const closesAt = R('Dile a qué hora cierra la cocina.', ['The kitchen closes at ten.', 'La cocina cierra a las diez.'], ['We close at ten tonight.', 'Cerramos a las diez esta noche.']);
const napkinsHere = R('Di que claro y entrega las servilletas.', ['Sure. Here are some napkins.', 'Claro. Aquí tiene unas servilletas.'], ['Of course. Here you go.', 'Claro. Aquí tiene.']);
const newFork = R('Discúlpate y ofrece un tenedor nuevo.', ["I'm so sorry. Let me bring you a new fork.", 'Lo siento mucho. Le traigo un tenedor nuevo.'], ['Oh, I am sorry. I will get you a clean one.', 'Ay, perdón. Le traigo uno limpio.']);
const bread = R('Di que claro y que traes pan.', ['Sure, I will bring you some bread.', 'Claro, les traigo pan.'], ['Of course. Fresh bread coming up.', 'Claro. Ya viene pan fresco.']);
const noIce = R('Repite que sin hielo.', ['No ice, got it.', 'Sin hielo, entendido.'], ['Okay, no ice. Got it.', 'Bien, sin hielo. Entendido.']);
const ANYWHERE = [
  extra([['Excuse me, where is the restroom?', 'Disculpe, ¿dónde está el baño?'], ['Sorry, where is the bathroom?', 'Perdón, ¿dónde está el baño?']], (c) => restroom(c.rng)),
  extra([['Do you take credit cards?', '¿Aceptan tarjetas de crédito?'], ['Do you take cards here?', '¿Aceptan tarjetas aquí?']], (c) => yesCards(c.rng)),
  extra([['Is it always this busy here?', '¿Siempre hay tanta gente aquí?'], ['Wow, it is busy tonight.', 'Vaya, hay mucha gente esta noche.']], (c) => SAY.patience(c.rng)),
  extra([['How are you doing tonight?', '¿Cómo está esta noche?'], ['And how is your night going?', '¿Y cómo va su noche?']], (c) => doingWell(c.rng)),
  extra([['It is my first time in Miami!', '¡Es mi primera vez en Miami!'], ['We are here on vacation!', '¡Estamos aquí de vacaciones!']], (c) => SAY.miamiWelcome(c.rng)),
  extra([['What time do you close?', '¿A qué hora cierran?'], ['How late are you open?', '¿Hasta qué hora abren?']], (c) => closesAt(c.rng)),
  extra([['Do you have wifi here?', '¿Tienen wifi aquí?'], ['Is there somewhere I can charge my phone?', '¿Dónde puedo cargar mi teléfono?']], (c) => SAY.checkOneMoment(c.rng)),
  extra([['Is the music always this loud?', '¿La música siempre está tan alta?'], ['It is a little loud in here.', 'Hay un poco de ruido aquí.']], (c) => R("Discúlpate y dile que vas a revisar.", ["I'm sorry. Let me check.", 'Lo siento. Déjeme ver.'], ['Sorry about that. Let me see.', 'Perdón por eso. Déjeme ver.'])(c.rng)),
  // El alumno practica pedir que le repitan: el cliente lo vuelve a decir más fácil.
  (c) => [
    step('repeat', L('Could we possibly get a couple more forks?', '¿Será posible que nos traiga un par de tenedores más?'), R('Pide con amabilidad que te lo repita.', ['Sorry, could you repeat that?', 'Perdón, ¿puede repetir?'], ['Sorry, can you say that again?', 'Perdón, ¿puede decirlo otra vez?'], ['Excuse me, one more time, please?', 'Disculpe, ¿otra vez, por favor?'])(c.rng)),
    step('repeat2', L('Two more forks, please.', 'Dos tenedores más, por favor.'), R('Repite lo que pidió y dile que sí.', ['Of course. Two more forks.', 'Claro. Dos tenedores más.'], ['Two more forks, no problem.', 'Dos tenedores más, no hay problema.'])(c.rng), [], LINKED),
  ],
];
const AT_TABLE = [
  extra([['Can we get some water first?', '¿Nos trae agua primero?'], ['Could we get some water when you get a chance?', '¿Nos trae agua cuando pueda?']], (c) => SAY.back(c.rng)),
  extra([['Can I get some napkins?', '¿Me trae más servilletas?'], ['Do you have more napkins?', '¿Tiene más servilletas?']], (c) => napkinsHere(c.rng)),
  extra([['Can you take a picture of us?', '¿Nos toma una foto?'], ['Would you mind taking our photo?', '¿Le molesta tomarnos una foto?']], (c) => SAY.photo(c.rng)),
  extra([['This fork is dirty.', 'Este tenedor está sucio.'], ['Excuse me, my fork is not clean.', 'Disculpe, mi tenedor no está limpio.']], (c) => newFork(c.rng)),
  extra([['Can we get some bread?', '¿Nos trae pan?'], ['Is there any bread for the table?', '¿Hay pan para la mesa?']], (c) => bread(c.rng)),
  extra([['Do you have any specials tonight?', '¿Tienen especiales esta noche?'], ['Is the food very spicy?', '¿La comida es muy picante?']], (c) => SAY.kitchen(c.rng)),
  extra([['Sorry, one more thing. No ice, please.', 'Perdón, una cosa más. Sin hielo, por favor.'], ['Oh, and no ice in my drink.', 'Ah, y sin hielo en mi bebida.']], (c) => noIce(c.rng)),
];
const SERVED = [
  extra([['Can we get some more water?', '¿Nos trae más agua?'], ['More water when you get a chance, please.', 'Más agua cuando pueda, por favor.']], (c) => SAY.back(c.rng)),
  extra([['Can I get some ketchup, please?', '¿Me trae salsa de tomate, por favor?'], ['Do you have any hot sauce?', '¿Tiene salsa picante?']], (c) => SAY.back(c.rng)),
  extra([['Can I have a straw?', '¿Me da un pitillo?'], ['Can we get more lemon?', '¿Nos trae más limón?']], (c) => SAY.back(c.rng)),
];

// --- Situaciones: cada una es un momento concreto de 3 a 6 turnos. Los turnos con opt() se quitan en mesas cortas. ---
const opt = (fn) => Object.assign((c) => fn(c), { optional: true });

const SCENES = [
  { id: 'llegada', es: 'Llegan a la puerta', level: 1, entrance: true, weight: 2, plan: () => [T.seatChoice, FOLLOW_UP, SEATED] },
  { id: 'recibir', es: 'Clientes sin reserva', level: 1, entrance: true, weight: 2, plan: () => [
    T.whoIsComing,
    (c) => step('party', G(c.rng, [`We are ${c.party.en}.`, `Somos ${c.party.es}.`], [`Just ${c.party.en}, please.`, `Solo ${c.party.es}, por favor.`], [`${cap(c.party.en)} people.`, `${cap(c.party.es)} personas.`]), SAY.follow(c.rng), [], LINKED),
    SEATED,
  ] },
  { id: 'saludo', es: 'Primer saludo en la mesa', level: 1, weight: 2, plan: () => [T.intro, T.feel, T.drinkOrder, opt(T.notReady)] },
  { id: 'bebidas', es: 'Solo bebidas', level: 1, plan: () => [
    (c) => step('drink', G(c.rng, ['We just want a drink tonight.', 'Solo queremos tomar algo esta noche.'], ['Hi, can we just get some drinks?', 'Hola, ¿solo unas bebidas?'], ['Hi! Just here for a drink.', '¡Hola! Solo vinimos a tomar algo.']), SAY.whatToDrink(c.rng)),
    (c) => step('order', G(c.rng, [`I would like a ${c.alcohol.en}, please.`, `Quisiera ${c.alcohol.es}, por favor.`], [`Can I get a ${c.alcohol.en}?`, `¿Me trae ${c.alcohol.es}?`]), SAY.askId(c.rng), [], LINKED),
    (c) => step('id', G(c.rng, ['Sure, here you go.', 'Claro, aquí tiene.'], ['Yes, one second. Here it is.', 'Sí, un segundo. Aquí está.']), SAY.thanksBack(c.rng), [], LINKED),
    opt((c) => step('close', G(c.rng, ['Great, thank you.', 'Genial, gracias.'], ['Thanks a lot.', 'Muchas gracias.']), SAY.cheers(c.rng))),
  ] },
  { id: 'orden', es: 'Tomar la orden', level: 1, weight: 3, plan: () => [T.ready, ...ORDER, T.thatsAll, opt(T.close)] },
  { id: 'reserva', es: 'Reservación', level: 1, entrance: true, plan: () => [
    (c) => step('greet', G(c.rng, ['Good evening. We have a reservation.', 'Buenas noches. Tenemos una reservación.'], ['Hi, I made a reservation for tonight.', 'Hola, hice una reservación para esta noche.'], ['Hello, we have a table booked.', 'Hola, tenemos una mesa reservada.']), SAY.underName(c.rng)),
    (c) => step('name', G(c.rng, [`It is under ${c.guestName}.`, `Está a nombre de ${c.guestName}.`], [`${c.guestName}, for tonight.`, `${c.guestName}, para esta noche.`]), SAY.foundIt(c.rng), [], LINKED),
    (c) => step('party', G(c.rng, [`We are ${c.party.en}.`, `Somos ${c.party.es}.`], [`${cap(c.party.en)} of us.`, `Somos ${c.party.es}.`]), SAY.follow(c.rng), [], LINKED),
    opt((c) => step('close', G(c.rng, ['Thank you very much.', 'Muchas gracias.'], ['Thanks so much.', 'Mil gracias.']), SAY.menus(c.rng), [], LINKED)),
  ] },
  { id: 'espera', es: 'Lista de espera', level: 1, entrance: true, plan: () => [
    (c) => step('greet', G(c.rng, [`Hi, a table for ${c.party.en}, please.`, `Hola, una mesa para ${c.party.es}, por favor.`], [`Hello, do you have room for ${c.party.en}?`, `Hola, ¿tienen lugar para ${c.party.es}?`]), SAY.full(c.rng)),
    (c) => step('wait', G(c.rng, ['Oh, how long is the wait?', 'Ah, ¿cuánto hay que esperar?'], ['Oh no. How long do we have to wait?', 'Ay no. ¿Cuánto hay que esperar?']), SAY.waitTime(c.rng), [], LINKED),
    (c) => step('name', G(c.rng, ['Okay, we can wait.', 'Bien, podemos esperar.'], ['That is fine. We will wait.', 'Está bien. Esperamos.']), SAY.getName(c.rng), [], LINKED),
    opt((c) => step('bar', G(c.rng, [`It is ${c.guestName}. Where can we wait?`, `Es ${c.guestName}. ¿Dónde esperamos?`], [`${c.guestName}. Can we wait inside?`, `${c.guestName}. ¿Podemos esperar adentro?`]), SAY.waitBar(c.rng), [], LINKED)),
  ] },
  { id: 'revisar', es: 'Pasar por la mesa', level: 1, served: true, plan: () => [
    (c) => step('check', G(c.rng, ['Oh, hi there.', 'Ah, hola.'], ['Oh, hi again.', 'Ah, hola otra vez.'], ['There you are.', 'Ahí está.']), SAY.howIsIt(c.rng)),
    (c) => step('ask', G(c.rng, [`The ${c.main.en} is great. Can I get more water?`, `${cap(c.main.es)} está muy bien. ¿Me trae más agua?`], [`Everything is good. I love the ${c.main.en}.`, `Todo bien. Me encanta ${c.main.es}.`], ['So good. Could we get more bread?', 'Muy bueno. ¿Nos trae más pan?']), SAY.glad(c.rng), [], LINKED),
    (c) => step('clear', G(c.rng, ['We are all done now.', 'Ya terminamos.'], ['That was so good. We are finished.', 'Estuvo muy bueno. Ya terminamos.']), SAY.clearPlates(c.rng)),
    opt((c) => step('dessert', G(c.rng, ['Yes, please. Thank you.', 'Sí, por favor. Gracias.'], ['Sure, go ahead.', 'Claro, adelante.']), SAY.dessert(c.rng), [], LINKED)),
  ] },
  { id: 'postre', es: 'Postre y café', level: 1, ending: true, plan: () => [
    (c) => step('ask', G(c.rng, ['That was great. We are done.', 'Estuvo muy bien. Ya terminamos.'], ['Wow, we are so full.', 'Vaya, estamos muy llenos.'], ['Everything was delicious.', 'Todo estuvo delicioso.']), SAY.dessert(c.rng)),
    (c) => step('options', G(c.rng, ['Maybe. What do you have?', 'Tal vez. ¿Qué tienen?'], ['Hmm. What is good?', 'Mmm. ¿Qué está bueno?']), SAY.dessertList(c.rng), [], LINKED),
    (c) => step('pick', G(c.rng, [`We will have the ${c.dessert.en}.`, `Queremos ${c.dessert.es}.`], [`Let us share the ${c.dessert.en}.`, `Compartamos ${c.dessert.es}.`]), SAY.spoons(c.rng), [], LINKED),
    opt((c) => step('coffee', G(c.rng, ['Yes, and one coffee, please.', 'Sí, y un café, por favor.'], ['Yes, thanks. A coffee too, please.', 'Sí, gracias. Un café también, por favor.']), SAY.milkSugar(c.rng), [], LINKED)),
  ] },
  { id: 'cuenta', es: 'La cuenta', level: 1, ending: true, plan: () => [
    (c) => step('ask', G(c.rng, ['Excuse me, can we get the check?', 'Disculpe, ¿nos trae la cuenta?'], ['We are ready to pay.', 'Estamos listos para pagar.'], ['Could we get the check when you get a chance?', '¿Nos trae la cuenta cuando pueda?']), SAY.hereCheck(c.rng)),
    (c) => step('pay', G(c.rng, ['I will pay with my card.', 'Voy a pagar con tarjeta.'], ['Here is my card.', 'Aquí está mi tarjeta.'], ['Okay, I have a card.', 'Bien, tengo tarjeta.']), SAY.takeCard(c.rng), [], LINKED),
    (c) => step('sign', G(c.rng, ['Okay, thank you.', 'Bien, gracias.'], ['Great, thanks.', 'Genial, gracias.']), SAY.receipt(c.rng), [], LINKED),
    opt((c) => step('bye', G(c.rng, ['Thank you. It was delicious.', 'Gracias. Estuvo delicioso.'], ['Thanks for everything.', 'Gracias por todo.'], ['We had a great time.', 'La pasamos muy bien.']), SAY.goodbye(c.rng), [], LINKED)),
  ] },
  { id: 'dividir', es: 'Dividir la cuenta', level: 1, ending: true, plan: () => [
    (c) => step('ask', G(c.rng, ['Can we split the check?', '¿Podemos dividir la cuenta?'], ['Excuse me, can we pay separately?', 'Disculpe, ¿podemos pagar por separado?']), SAY.split(c.rng)),
    (c) => step('how', G(c.rng, ['Two checks, please.', 'Dos cuentas, por favor.'], ['Half and half, please.', 'Mitad y mitad, por favor.']), SAY.takeCard(c.rng), [], LINKED),
    (c) => step('bye', G(c.rng, ['Thanks. You were great.', 'Gracias. Estuvo muy bien.'], ['Thank you. Everything was so good.', 'Gracias. Todo estuvo muy bueno.']), SAY.goodbye(c.rng), [], LINKED),
  ] },
  { id: 'llevar', es: 'Para llevar', level: 1, entrance: true, plan: () => [
    (c) => step('greet', G(c.rng, [`Hi, I want to order the ${c.main.en} to go.`, `Hola, quiero pedir ${c.main.es} para llevar.`], [`Hello, can I get the ${c.main.en} to go?`, `Hola, ¿me da ${c.main.es} para llevar?`]), SAY.toGoElse(c.rng)),
    (c) => step('more', G(c.rng, [`Yes, one ${c.drink.en}, please.`, `Sí, ${c.drink.es}, por favor.`], ['No, that is it. How long will it take?', 'No, eso es todo. ¿Cuánto va a tardar?']), SAY.tenMinutes(c.rng), [], LINKED),
    (c) => step('name', G(c.rng, ['Okay. I can wait here.', 'Bien. Puedo esperar aquí.'], ['Great, I will wait.', 'Muy bien, espero.']), SAY.whatName(c.rng), [], LINKED),
    opt((c) => step('give', G(c.rng, [`It is ${c.guestName}. Is it ready?`, `Es ${c.guestName}. ¿Ya está?`], [`${c.guestName}. Thank you.`, `${c.guestName}. Gracias.`]), SAY.orderReady(c.rng), [], LINKED)),
  ] },
  { id: 'desayuno', es: 'Desayuno', level: 1, plan: () => [
    (c) => step('order', G(c.rng, ['Good morning! Can I get two eggs and toast?', '¡Buenos días! ¿Me da dos huevos y pan tostado?'], ['Hi! I want the breakfast special, please.', '¡Hola! Quiero el desayuno especial, por favor.']), SAY.eggsHow(c.rng)),
    (c) => step('eggs', G(c.rng, ['Scrambled, please.', 'Revueltos, por favor.'], ['Over easy, please.', 'Volteados, por favor.'], ['Sunny side up, please.', 'Estrellados, por favor.']), SAY.toastWhich(c.rng), [], LINKED),
    (c) => step('toast', G(c.rng, ['Whole wheat, please. And a coffee.', 'Integral, por favor. Y un café.'], ['White is fine. Can I get a coffee too?', 'Blanco está bien. ¿Me trae un café también?']), SAY.milkSugar(c.rng), [], LINKED),
    opt((c) => step('refill', G(c.rng, ['This coffee is so good.', 'Este café está muy bueno.'], ['I finished my coffee already.', 'Ya me terminé el café.']), SAY.coffeeRefill(c.rng))),
  ] },
  { id: 'regular', es: 'Clientes de siempre', level: 1, plan: () => [
    (c) => step('greet', G(c.rng, ['Hi! We are back!', '¡Hola! ¡Volvimos!'], ['Hello again! Remember us?', '¡Hola otra vez! ¿Se acuerda de nosotros?'], ['Hi there! We loved it last time.', '¡Hola! Nos encantó la última vez.']), SAY.welcomeBack(c.rng)),
    (c) => step('thanks', G(c.rng, ['Thanks! It is good to be back.', '¡Gracias! Qué bueno volver.'], ['Thank you! We love this place.', '¡Gracias! Nos encanta este lugar.']), SAY.sameAgain(c.rng), [], LINKED),
    (c) => step('same', G(c.rng, [`Yes! The ${c.main.en}, please.`, `¡Sí! ${cap(c.main.es)}, por favor.`], [`Maybe. I loved the ${c.main.en}.`, `Tal vez. Me encantó ${c.main.es}.`]), SAY.thanksBack(c.rng), [], LINKED),
  ] },
  { id: 'sobras', es: 'Quieren llevar lo que sobró', level: 1, served: true, ending: true, plan: () => [
    (c) => step('ask', G(c.rng, ['We are so full. Can we take this home?', 'Estamos muy llenos. ¿Podemos llevar esto?'], ['This was a lot of food. Do you have a box?', 'Fue mucha comida. ¿Tiene una caja?'], ['Can I get a box for this?', '¿Me da una caja para esto?']), SAY.box(c.rng)),
    (c) => step('thanks', G(c.rng, ['Thank you. It was so good.', 'Gracias. Estuvo muy bueno.'], ['Thanks a lot.', 'Muchas gracias.']), SAY.pleasure(c.rng), [], LINKED),
    (c) => step('check', G(c.rng, ['Can we also get the check?', '¿Nos trae también la cuenta?'], ['And the check, please.', 'Y la cuenta, por favor.']), SAY.hereCheck(c.rng), [], LINKED),
  ] },

  { id: 'primera_vez', es: 'Es su primera vez', level: 2, plan: () => [
    (c) => step('greet', G(c.rng, ['Hi! Wow, this place is beautiful.', '¡Hola! Vaya, este lugar es hermoso.'], ['Hello! We heard this place is great.', '¡Hola! Nos dijeron que este lugar es muy bueno.'], ['Hi there. It looks so nice in here.', 'Hola. Se ve muy bonito aquí.']), SAY.firstTime(c.rng)),
    (c) => step('first', G(c.rng, ['It is our first time.', 'Es nuestra primera vez.'], ['This is our very first time!', '¡Es nuestra primera vez!']), SAY.firstWelcome(c.rng), [], LINKED),
    (c) => step('ask', G(c.rng, ['Thanks! What do you recommend?', '¡Gracias! ¿Qué recomienda?'], ['What is your favorite dish?', '¿Cuál es su plato favorito?'], ['What should we try?', '¿Qué deberíamos probar?']), recommend(c, c.main), [], LINKED),
    opt((c) => step('how', G(c.rng, ['What is it like?', '¿Cómo es?'], ['Oh, what is in it?', 'Ah, ¿qué tiene?']), describe(c.main), [], LINKED)),
  ] },
  { id: 'recomendar', es: 'No sabe qué pedir', level: 2, plan: () => [
    (c) => step('ask', G(c.rng, ['What do you recommend?', '¿Qué recomienda?'], ['I can not decide. What is good here?', 'No me decido. ¿Qué es bueno aquí?'], ['Everything looks good. What would you get?', 'Todo se ve bien. ¿Usted qué pediría?']), recommend(c, c.main)),
    (c) => step('how', G(c.rng, ['What is it like?', '¿Cómo es?'], ['Oh, what is in it?', 'Ah, ¿qué tiene?'], ['Tell me more about it.', 'Cuénteme más.']), describe(c.main), [], LINKED),
    ...ORDER,
    T.thatsAll,
  ] },
  { id: 'alergia', es: 'Alergia seria', level: 2, tail: true, plan: () => [
    (c) => step('allergy', G(c.rng, [`I have an allergy to ${c.allergy.en}.`, `Tengo alergia a ${c.allergy.es}.`], [`Before we order, I am allergic to ${c.allergy.en}.`, `Antes de ordenar, soy alérgico a ${c.allergy.es}.`]), SAY.thanksForTelling(c.rng)),
    (c) => step('safe', G(c.rng, [`Can I eat the ${c.main.en}?`, `¿Puedo comer ${c.main.es}?`], [`Is the ${c.main.en} okay for me?`, `¿${cap(c.main.es)} está bien para mí?`]), SAY.kitchen(c.rng), [], LINKED),
    (c) => step('promise', G(c.rng, ['Can you promise me it is okay?', '¿Me promete que no hay problema?'], ['Are you sure it will be okay?', '¿Está seguro de que no hay problema?']), SAY.chef(c.rng), [], LINKED),
    opt((c) => step('thanks', G(c.rng, ['Okay. Thank you for checking.', 'Bien. Gracias por consultar.'], ['Thank you. I appreciate it.', 'Gracias. Se lo agradezco.']), SAY.thanksBack(c.rng), [], LINKED)),
  ] },
  { id: 'vino', es: 'Vino', level: 2, plan: () => [
    (c) => step('ask', G(c.rng, ['Can we see the wine list?', '¿Podemos ver la carta de vinos?'], ['Do you have a wine list?', '¿Tiene carta de vinos?'], ['I would love a glass of wine.', 'Me encantaría una copa de vino.']), SAY.wineOrWhite(c.rng)),
    (c) => step('glass', G(c.rng, [`${cap(c.wine.en)}, please. Just one glass.`, `${cap(c.wine.es)}, por favor. Solo una copa.`], [`A glass of ${c.wine.en}, please.`, `Una copa de ${c.wine.es}, por favor.`]), SAY.askId(c.rng), [], LINKED),
    (c) => step('id', G(c.rng, ['Sure, here you go.', 'Claro, aquí tiene.'], ['Of course. Here it is.', 'Claro. Aquí está.']), SAY.thanksBack(c.rng), [], LINKED),
    opt((c) => step('close', G(c.rng, ['Okay, thank you.', 'Bien, gracias.'], ['Thanks.', 'Gracias.']), SAY.cheers(c.rng))),
  ] },
  { id: 'vegetariano', es: 'Sin carne', level: 2, plan: () => [
    (c) => step('tell', G(c.rng, ['I do not eat meat.', 'No como carne.'], ['Hi, I am a vegetarian.', 'Hola, soy vegetariano.']), SAY.thanksForTelling(c.rng)),
    (c) => step('ask', G(c.rng, ['Do you have a dish with no meat?', '¿Tienen algún plato sin carne?'], ['What can I eat here?', '¿Qué puedo comer aquí?']), SAY.noMeat(c.rng), [], LINKED),
    (c) => step('order', G(c.rng, ['Okay. I will try the soup.', 'Bien. Voy a probar la sopa.'], ['Perfect, the soup then.', 'Perfecto, entonces la sopa.']), SAY.anythingElse(c.rng), [], LINKED),
    opt((c) => step('close', G(c.rng, ['Just some water, please.', 'Solo agua, por favor.'], ['No, that is all. Thanks.', 'No, eso es todo. Gracias.']), SAY.back(c.rng), [], LINKED)),
  ] },
  { id: 'cumple', es: 'Cumpleaños', level: 2, plan: () => [
    (c) => step('birthday', G(c.rng, ['It is my birthday today!', '¡Hoy es mi cumpleaños!'], ['We are celebrating my birthday tonight!', '¡Esta noche celebramos mi cumpleaños!']), SAY.birthday(c.rng)),
    (c) => step('candle', G(c.rng, ['Can you bring a dessert with a candle?', '¿Puede traer un postre con una vela?'], ['Could we get a candle on a dessert?', '¿Nos pone una vela en un postre?']), SAY.kitchen(c.rng), [], LINKED),
    (c) => step('drink', G(c.rng, [`Thank you! And ${c.drink.en} for me.`, `¡Gracias! Y ${c.drink.es} para mí.`], ['Thanks! You are the best.', '¡Gracias! Es usted el mejor.']), SAY.back(c.rng), [], LINKED),
    opt((c) => step('photo', G(c.rng, ['Can you take a picture of us?', '¿Nos toma una foto?'], ['Would you mind taking our photo?', '¿Le molesta tomarnos una foto?']), SAY.photo(c.rng))),
  ] },
  { id: 'familia', es: 'Familia con niños', level: 2, party: (c) => c.family.size, plan: () => [
    (c) => step('greet', G(c.rng, [`Hi, we are a family of ${c.family.en}.`, `Hola, somos una familia de ${c.family.es}.`], [`Hello! A table for ${c.family.en}, please.`, `¡Hola! Una mesa para ${c.family.es}, por favor.`]), SAY.children(c.rng)),
    (c) => step('chair', G(c.rng, ['Yes, we have a baby.', 'Sí, tenemos un bebé.'], ['Yes, our little one is one year old.', 'Sí, nuestro pequeño tiene un año.']), SAY.highChair(c.rng), [], LINKED),
    (c) => step('kids', G(c.rng, ['Yes, please. Do you have food for kids?', 'Sí, por favor. ¿Tienen comida para niños?'], ['Please. Is there a kids menu?', 'Por favor. ¿Hay menú para niños?']), SAY.kitchen(c.rng), [], LINKED),
    opt((c) => step('crayons', G(c.rng, ['Thank you. The kids are hungry.', 'Gracias. Los niños tienen hambre.'], ['Thanks. They are getting bored.', 'Gracias. Ya se están aburriendo.']), SAY.crayons(c.rng))),
  ] },
  { id: 'prisa', es: 'Mesa con prisa', level: 2, plan: () => [
    (c) => step('greet', G(c.rng, [`Hi, a table for ${c.party.en}. We have a show at eight.`, `Hola, una mesa para ${c.party.es}. Tenemos un show a las ocho.`], ['Hi! We are in a big hurry tonight.', '¡Hola! Tenemos mucha prisa esta noche.']), SAY.rushOk(c.rng)),
    (c) => step('fast', G(c.rng, ['What is the fastest dish?', '¿Cuál es el plato más rápido?'], ['What can you bring us quickly?', '¿Qué nos puede traer rápido?']), SAY.kitchen(c.rng), [], LINKED),
    (c) => step('check', G(c.rng, ['Can we also get the check with the food?', '¿Nos trae también la cuenta con la comida?'], ['Please bring the check with the food.', 'Traiga la cuenta con la comida, por favor.']), R('Di que claro y agradece que te avisen.', ['Of course. Thank you for telling me.', 'Claro. Gracias por decírmelo.'], ['Sure. I will bring them together.', 'Claro. Los traigo juntos.'])(c.rng)),
    opt((c) => step('close', G(c.rng, ['Thanks. Sorry for the rush.', 'Gracias. Perdón por la prisa.'], ['You are saving us. Thanks!', 'Nos está salvando. ¡Gracias!']), SAY.noProblem(c.rng), [], LINKED)),
  ] },
  { id: 'compartir', es: 'Quieren compartir', level: 2, plan: () => [
    (c) => step('ask', G(c.rng, [`Can we share the ${c.main.en}?`, `¿Podemos compartir ${c.main.es}?`], [`We want to split the ${c.main.en}. Is that okay?`, `Queremos compartir ${c.main.es}. ¿Está bien?`]), SAY.safeShare(c.rng)),
    (c) => step('start', G(c.rng, [`Thanks! Can we start with the ${c.starter.en}?`, `¡Gracias! ¿Empezamos con ${c.starter.es}?`], [`And the ${c.starter.en} first, please.`, `Y primero ${c.starter.es}, por favor.`]), SAY.anythingElse(c.rng), [], LINKED),
    (c) => step('close', ALL_SET(c), SAY.putIn(c.rng), [], LINKED),
  ] },
  { id: 'happy_hour', es: 'Happy hour', level: 2, plan: () => [
    (c) => step('ask', G(c.rng, ['Hi! Is it still happy hour?', '¡Hola! ¿Todavía es happy hour?'], ['Do you have happy hour today?', '¿Tienen happy hour hoy?']), SAY.happyHourInfo(c.rng)),
    (c) => step('food', G(c.rng, ['Nice! What food do you recommend?', '¡Qué bien! ¿Qué comida recomienda?'], ['And is there any food on special?', '¿Y hay comida en oferta?']), SAY.happyHourFood(c.rng), [], LINKED),
    (c) => step('order', G(c.rng, [`Okay, the wings and a ${c.alcohol.en}, please.`, `Bien, las alitas y ${c.alcohol.es}, por favor.`], [`Great. Tacos and a ${c.alcohol.en}.`, `Genial. Tacos y ${c.alcohol.es}.`]), SAY.askId(c.rng), [], LINKED),
    opt((c) => step('id', G(c.rng, ['Sure, here you go.', 'Claro, aquí tiene.'], ['Yes, here it is.', 'Sí, aquí está.']), SAY.thanksBack(c.rng), [], LINKED)),
  ] },
  { id: 'olvido', es: 'Se olvidó su bebida', level: 2, tense: true, plan: () => [
    (c) => step('problem', G(c.rng, ['Excuse me, I never got my drink.', 'Disculpe, nunca llegó mi bebida.'], ['Hi, I think you forgot my drink.', 'Hola, creo que olvidó mi bebida.']), SAY.sorry(c.rng)),
    (c) => step('what', G(c.rng, [`It was ${c.drink.en}.`, `Era ${c.drink.es}.`], [`I ordered ${c.drink.en}.`, `Pedí ${c.drink.es}.`]), SAY.drinkComing(c.rng), [], LINKED),
    (c) => step('thanks', G(c.rng, ['Thank you. It is okay.', 'Gracias. No hay problema.'], ['No worries. Thanks.', 'Tranquilo. Gracias.']), SAY.patience(c.rng), [], LINKED),
  ] },

  { id: 'queja', es: 'Hay un problema', level: 3, tail: true, tense: true, plan: () => [
    (c) => step('problem', G(c.rng, [`Excuse me, this is not my ${c.main.en}.`, `Disculpe, este plato no es ${c.main.es}.`], [`Excuse me, my ${c.main.en} is cold.`, `Disculpe, ${c.main.es} no está caliente.`], [`Sorry, there is a problem with my ${c.main.en}.`, `Perdón, hay un problema con ${c.main.es}.`]), SAY.sorry(c.rng)),
    (c) => step('what', G(c.rng, ['What can you do about it?', '¿Qué puede hacer?'], ['Can you do something?', '¿Puede hacer algo?']), SAY.fix(c.rng), [], LINKED),
    (c) => step('bill', G(c.rng, ['Can you take it off the bill?', '¿Lo puede quitar de la cuenta?'], ['Do I still have to pay for it?', '¿Todavía tengo que pagarlo?']), SAY.manager(c.rng), [], LINKED),
    (c) => step('thanks', G(c.rng, ['Okay. Thank you.', 'Bien. Gracias.'], ['It is okay. These things happen.', 'Está bien. Son cosas que pasan.']), SAY.patience(c.rng), [], LINKED),
    opt((c) => step('how_long', G(c.rng, ['How long will it take?', '¿Cuánto va a tardar?'], ['Will it take long?', '¿Va a tardar mucho?']), SAY.kitchen(c.rng), [], LINKED)),
  ] },
  { id: 'demora', es: 'Comida demorada', level: 3, tail: true, tense: true, plan: () => [
    (c) => step('problem', G(c.rng, ['Excuse me, we have been waiting a long time.', 'Disculpe, llevamos mucho tiempo esperando.'], ['Hi, where is our food?', 'Hola, ¿dónde está nuestra comida?'], ['It has been almost an hour.', 'Ya casi pasó una hora.']), SAY.sorryWait(c.rng)),
    (c) => step('where', G(c.rng, [`Where is my ${c.main.en}?`, `¿Dónde está ${c.main.es}?`], ['Is it almost ready?', '¿Ya casi está?']), SAY.kitchen(c.rng), [], LINKED),
    (c) => step('late', G(c.rng, ['We need to leave soon.', 'Nos tenemos que ir pronto.'], ['We can not wait much longer.', 'No podemos esperar mucho más.']), SAY.tellKitchen(c.rng), [], LINKED),
    (c) => step('thanks', G(c.rng, ['Okay. Please hurry.', 'Bien. Apúrese, por favor.'], ['Okay. Thanks for checking.', 'Bien. Gracias por revisar.']), SAY.patience(c.rng), [], LINKED),
  ] },
  { id: 'mal_cocido', es: 'No es el término que pidió', level: 3, tail: true, tense: true, plan: () => [
    (c) => step('problem', G(c.rng, ['Excuse me, I asked for medium rare. This is well done.', 'Disculpe, lo pedí medio rojo. Este está bien cocido.'], ['Sorry, my steak is overcooked.', 'Perdón, mi filete está demasiado cocido.']), SAY.overcookedSorry(c.rng)),
    (c) => step('how', G(c.rng, ['Yes, please. I still want the steak.', 'Sí, por favor. Todavía quiero el filete.'], ['Okay, thank you. Can you fix it?', 'Bien, gracias. ¿Lo puede arreglar?']), SAY.howCooked(c.rng), [], LINKED),
    (c) => step('cook', G(c.rng, ['Medium rare, please. A little pink.', 'Medio rojo, por favor. Un poco rosado.'], ['Medium rare, like I asked.', 'Medio rojo, como lo pedí.']), SAY.whileWait(c.rng), [], LINKED),
    opt((c) => step('thanks', G(c.rng, ['No, thank you. I can wait.', 'No, gracias. Puedo esperar.'], ['Some bread would be nice.', 'Un poco de pan estaría bien.']), SAY.patience(c.rng), [], LINKED)),
  ] },
  { id: 'turista', es: 'Turista con dudas', level: 3, plan: () => [
    (c) => step('greet', G(c.rng, ['Hello! We are visiting from far away.', '¡Hola! Venimos de muy lejos.'], ['Hi! We just got to Miami.', '¡Hola! Acabamos de llegar a Miami.']), SAY.miamiWelcome(c.rng)),
    (c) => step('water', L('Thanks! What is still water?', '¡Gracias! ¿Qué es agua sin gas?'), SAY.explainWater(c.rng), [], LINKED),
    (c) => step('side', L('And what is a side?', '¿Y qué es un acompañamiento?'), SAY.explainSide(c.rng), [], LINKED),
    (c) => step('tip', G(c.rng, ['Is the tip included here?', '¿La propina está incluida aquí?'], ['Do we leave a tip here?', '¿Aquí se deja propina?']), SAY.tipCheck(c.rng), [], LINKED),
  ] },
  { id: 'cambio', es: 'Cambia su pedido', level: 3, plan: () => [
    (c) => step('ask', G(c.rng, ['Excuse me, can I change my order?', 'Disculpe, ¿puedo cambiar mi pedido?'], ['Sorry, I changed my mind about my food.', 'Perdón, cambié de opinión sobre mi comida.']), SAY.changeOk(c.rng)),
    (c) => step('new', L(`I want the ${c.alt.en}, not the ${c.main.en}.`, `Quiero ${c.alt.es}, no ${c.main.es}.`), R(`Confirma que ahora es ${c.alt.es} y que avisarás a la cocina.`, [`Okay, the ${c.alt.en}. I will tell the kitchen.`, `Bien, ${c.alt.es}. Le aviso a la cocina.`], [`Sure, the ${c.alt.en}. Let me tell the kitchen.`, `Claro, ${c.alt.es}. Déjeme avisar a la cocina.`])(c.rng), [], LINKED),
    (c) => step('sorry', G(c.rng, ['Is that okay? I am sorry.', '¿Está bien? Lo siento.'], ['Sorry about that.', 'Perdón por eso.']), SAY.noProblem(c.rng), [], LINKED),
    (c) => step('how_long', G(c.rng, ['Will it take a long time?', '¿Va a tardar mucho?'], ['How long will it take now?', '¿Cuánto va a tardar ahora?']), SAY.kitchen(c.rng), [], LINKED),
  ] },
  { id: 'grupo', es: 'Grupo grande', level: 3, entrance: true, party: () => 8, plan: () => [
    (c) => step('greet', G(c.rng, ['Hi, we are a big group. We are eight.', 'Hola, somos un grupo grande. Somos ocho.'], ['Hello! Do you have room for eight people?', '¡Hola! ¿Tienen lugar para ocho personas?']), SAY.letMeCheckTables(c.rng)),
    (c) => step('res', G(c.rng, ['We do not have a reservation.', 'No tenemos reservación.'], ['Sorry, we did not call first.', 'Perdón, no llamamos antes.']), SAY.noProblem(c.rng), [], LINKED),
    (c) => step('together', L('Can we all sit together?', '¿Podemos sentarnos todos juntos?'), SAY.checkOneMoment(c.rng), [], LINKED),
    (c) => step('pay', L('And can we pay separately?', '¿Y podemos pagar por separado?'), SAY.splitFour(c.rng), [], LINKED),
  ] },
  { id: 'aniversario', es: 'Aniversario', level: 3, party: () => 2, plan: () => [
    (c) => step('greet', G(c.rng, ['Good evening. It is our anniversary.', 'Buenas noches. Es nuestro aniversario.'], ['Hi! We are celebrating ten years tonight.', '¡Hola! Celebramos diez años esta noche.']), SAY.congrats(c.rng)),
    (c) => step('quiet', G(c.rng, ['Do you have a quiet table?', '¿Tiene una mesa tranquila?'], ['Could we get a table by the window?', '¿Nos da una mesa junto a la ventana?']), SAY.checkOneMoment(c.rng), [], LINKED),
    (c) => step('wine', G(c.rng, [`Thank you. Two glasses of ${c.wine.en}, please.`, `Gracias. Dos copas de ${c.wine.es}, por favor.`], [`Perfect. We would love ${c.wine.en}.`, `Perfecto. Nos encantaría ${c.wine.es}.`]), SAY.askId(c.rng), [], LINKED),
    (c) => step('id', G(c.rng, ['Here you go. Now we can order.', 'Aquí tiene. Ya podemos ordenar.'], ['Of course, here you go.', 'Claro, aquí tiene.']), SAY.thanksBack(c.rng), [], LINKED),
  ] },
  { id: 'cambiar_mesa', es: 'Quiere otra mesa', level: 3, tense: true, plan: () => [
    (c) => step('problem', G(c.rng, ['Excuse me, it is too cold at this table.', 'Disculpe, hace mucho frío en esta mesa.'], ['Excuse me, it is too loud at this table.', 'Disculpe, hay mucho ruido en esta mesa.'], ['Sorry, this table is not clean.', 'Perdón, esta mesa no está limpia.']), SAY.otherTable(c.rng)),
    (c) => step('where', G(c.rng, ['Yes, please. Near the window.', 'Sí, por favor. Cerca de la ventana.'], ['Yes, please. Something quiet.', 'Sí, por favor. Algo tranquilo.']), SAY.checkOneMoment(c.rng), [], LINKED),
    (c) => step('drinks', G(c.rng, ['Great. Can you bring our drinks?', 'Genial. ¿Puede traer nuestras bebidas?'], ['Thanks. Can you bring our drinks over?', 'Gracias. ¿Nos lleva las bebidas?']), SAY.newDrinks(c.rng), [], LINKED),
    (c) => step('thanks', G(c.rng, ['This is much better. Thank you.', 'Así está mucho mejor. Gracias.'], ['So much better. Thanks.', 'Mucho mejor. Gracias.']), SAY.pleasure(c.rng), [], LINKED),
  ] },
  { id: 'cerrando', es: 'La cocina va a cerrar', level: 3, plan: () => [
    (c) => step('greet', G(c.rng, ['Hi! Are you still open?', '¡Hola! ¿Todavía están abiertos?'], ['Hello. Is it too late for dinner?', 'Hola. ¿Es muy tarde para cenar?']), SAY.closingSoon(c.rng)),
    (c) => step('quick', G(c.rng, [`Okay. Can we get the ${c.main.en} quickly?`, `Bien. ¿Nos trae ${c.main.es} rápido?`], ['Oh, then we will order now.', 'Ah, entonces ordenamos ya.']), SAY.whatOrder(c.rng), [], LINKED),
    ...ORDER,
    T.thatsAll,
  ] },

  { id: 'cena', es: 'Toda la atención', level: 4, plan: () => [T.intro, T.feel, T.drinkOrder, ...ORDER, T.thatsAll] },
  { id: 'agotado', es: 'Se acabó el plato', level: 4, tense: true, plan: () => [
    (c) => step('order', G(c.rng, [`I will have the ${c.main.en}.`, `Quiero ${c.main.es}.`], [`Can I get the ${c.main.en}, please?`, `¿Me trae ${c.main.es}, por favor?`]), SAY.soldOut(c.rng)),
    (c) => step('else', G(c.rng, ['Oh no. What else is good?', 'Qué lástima. ¿Qué más está bueno?'], ['That is too bad. What do you recommend?', 'Qué pena. ¿Qué recomienda?']), recommend(c, c.alt), [], LINKED),
    (c) => step('how', G(c.rng, ['What is it like?', '¿Cómo es?'], ['Oh, what is in it?', 'Ah, ¿qué tiene?']), describe(c.alt), [], LINKED),
    (c) => step('confirm', G(c.rng, ['Okay, I will have that.', 'Bien, voy a pedir ese.'], ['Sounds great. I will try it.', 'Suena muy bien. Lo voy a probar.']), R(`Confirma el pedido: ${c.alt.es}.`, [`Let me confirm. One ${c.alt.en}.`, `Déjeme confirmar. ${cap(c.alt.es)}.`], [`Perfect. One ${c.alt.en}.`, `Perfecto. ${cap(c.alt.es)}.`])(c.rng), [], LINKED),
  ] },
  { id: 'derrame', es: 'Se regó una bebida', level: 4, tense: true, plan: () => [
    (c) => step('spill', G(c.rng, ['Oh no! My drink spilled on the table.', '¡Ay no! Mi bebida se regó en la mesa.'], ['Excuse me, I spilled my water.', 'Disculpe, se me regó el agua.']), SAY.clean(c.rng)),
    (c) => step('shirt', G(c.rng, ['It is on my shirt too.', 'También me cayó en la camisa.'], ['My shirt is all wet.', 'Mi camisa está toda mojada.']), SAY.napkins(c.rng), [], LINKED),
    (c) => step('new', G(c.rng, ['Can I get a new drink?', '¿Me pueden traer otra bebida?'], ['Could I have another drink?', '¿Me trae otra bebida?']), SAY.manager(c.rng), [], LINKED),
    (c) => step('fault', G(c.rng, ['Thank you. It was my fault.', 'Gracias. Fue mi culpa.'], ['Thanks. You are very kind.', 'Gracias. Es muy amable.']), SAY.noProblem(c.rng), [], LINKED),
  ] },
  { id: 'tarjeta', es: 'La tarjeta no pasa', level: 4, ending: true, tense: true, plan: () => [
    (c) => step('pay', G(c.rng, ['Here is my card.', 'Aquí está mi tarjeta.'], ['I will pay with this card.', 'Voy a pagar con esta tarjeta.']), SAY.cardFailed(c.rng)),
    (c) => step('why', G(c.rng, ['Oh no. Really?', 'Ay no. ¿En serio?'], ['That is strange. Are you sure?', 'Qué raro. ¿Está seguro?']), SAY.otherCard(c.rng), [], LINKED),
    (c) => step('other', G(c.rng, ['Yes, try this one, please.', 'Sí, pruebe esta, por favor.'], ['I have cash. Here you go.', 'Tengo efectivo. Aquí tiene.']), SAY.thanksBack(c.rng), [], LINKED),
    (c) => step('sorry', G(c.rng, ['Sorry about that.', 'Perdón por eso.'], ['I am so sorry.', 'Lo siento mucho.']), SAY.noProblem(c.rng), [], LINKED),
  ] },
  { id: 'cuenta_mal', es: 'Error en la cuenta', level: 4, ending: true, tense: true, plan: () => [
    (c) => step('problem', G(c.rng, ['Excuse me, I think this check is wrong.', 'Disculpe, creo que esta cuenta está mal.'], ['Sorry, I did not order this wine.', 'Perdón, yo no pedí este vino.']), SAY.checkBill(c.rng)),
    (c) => step('what', G(c.rng, ['We did not have any dessert.', 'No pedimos postre.'], ['There is one drink too many.', 'Hay una bebida de más.']), SAY.manager(c.rng), [], LINKED),
    (c) => step('wait', G(c.rng, ['Okay. We can wait a moment.', 'Bien. Podemos esperar un momento.'], ['Thank you. We can wait.', 'Gracias. Podemos esperar.']), SAY.patience(c.rng), [], LINKED),
    (c) => step('bye', G(c.rng, ['Thanks. The food was great.', 'Gracias. La comida estuvo muy buena.'], ['Thank you for your help.', 'Gracias por su ayuda.']), SAY.goodbye(c.rng), [], LINKED),
  ] },
];

// --- Niveles: cada uno trae situaciones nuevas. Las mesas son cortas: un momento concreto de la conversación. ---
export const LEVELS = [
  { level: 1, from: 0, min: 3, max: 4 }, { level: 2, from: 4, min: 3, max: 5 },
  { level: 3, from: 10, min: 3, max: 5 }, { level: 4, from: 20, min: 3, max: 6 },
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

/**
 * A veces el cliente sale con algo inesperado, como en la vida real: como mucho una vez por mesa y sin cortar lo que se venía hablando.
 * La mesa no se alarga por alargar: solo entra si cabe.
 */
const EXTRA_CHANCE = 0.3;
function addExtras(steps, scene, max, rng, c) {
  if (rng() >= EXTRA_CHANCE) return;
  const pool = scene.entrance || scene.ending ? [...ANYWHERE] : [...ANYWHERE, ...AT_TABLE, ...(scene.served ? SERVED : [])];
  const lines = pick(rng, pool)(c);
  if (steps.length + lines.length > max || steps.some((s) => s.guest.en === lines[0].guest.en)) return;
  const seams = scene.tail ? [] : [...steps.keys()].filter((i) => i > 0 && !steps[i].linked && !steps[i - 1].say.en.endsWith('?'));
  if (!seams.length && (scene.ending || scene.tail || steps.at(-1).say.en.endsWith('?'))) return;
  steps.splice(seams.length ? pick(rng, seams) : steps.length, 0, ...lines);
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
  addExtras(steps, scene, info.max, rng, c);

  // El ánimo se presenta al llegar; en plena queja, un "qué felices estamos" no tendría sentido.
  const first = steps[0];
  const fitsDoor = !(scene.entrance && moodId === 'unsure') && !(scene.id === 'familia' && moodId === 'unsure') && !(scene.id === 'grupo' && moodId === 'unsure');
  if (first.kind === 'greet' && fitsDoor && rng() < 0.4) first.guest = L(`${first.guest.en}${mood.open[0]}`, `${first.guest.es}${mood.open[1]}`);
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
