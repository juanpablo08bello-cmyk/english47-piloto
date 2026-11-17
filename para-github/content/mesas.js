// Generador de mesas al azar para principiantes. Siempre funciona, sin IA: combina situación,
// personaje, acento, ánimo, pedido e imprevistos. En cada turno el alumno recibe la frase que debe decir.
// Las frases del alumno son fijas y revisables; la IA, si está conectada, solo reescribe al cliente.
import { MENU } from './menu.js';
import { RESTAURANTE_BASE, RESTAURANTE_POR_ID } from './restaurantes.js';
import { escenasNuevas, CLIENTES_NUEVAS } from './mesas-nuevas.js';

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

// --- Menú: cada local trae el suyo (content/restaurantes.js). Sin local, el original de Harbor 47. ---
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
const bare = (es) => es.replace(/^(el|la|los|las|un|una) /, '');
// Estas dos frases nombran platos de la carta: cada local dice los suyos.
function dessertList(c) {
  const [a, b] = c.desserts;
  if (!b) return R(`Dile que tienen ${a.es}.`, [`We have ${a.en}.`, `Tenemos ${bare(a.es)}.`], [`Tonight we have ${a.en}.`, `Esta noche tenemos ${bare(a.es)}.`])(c.rng);
  return R('Dile los postres que tienen.',
    [`We have ${a.en} and ${b.en}.`, `Tenemos ${bare(a.es)} y ${bare(b.es)}.`], [`Tonight we have ${b.en} and ${a.en}.`, `Esta noche tenemos ${bare(b.es)} y ${bare(a.es)}.`])(c.rng);
}
const noMeat = (c) => R(`Dile que ${c.veggie.es} no tiene carne.`,
  [`The ${c.veggie.en} has no meat.`, `${cap(c.veggie.es)} no tiene carne.`], [`Our ${c.veggie.en} has no meat in it.`, `${cap(c.veggie.es)} no lleva carne.`])(c.rng);
// Datos de la comanda: lo que el cliente pide en cada turno. El ticket los muestra cuando el alumno responde bien.
const P = (tipo, item) => ({ tipo, en: item.en, es: item.es });

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
    [`I will just have ${c.drink.en}.`, `Solo quiero ${c.drink.es}.`], [`Do you have ${c.drink.en}?`, `¿Tienen ${c.drink.es}?`]), SAY.drinkComing(c.rng), [], { ...LINKED, pedido: [P('bebida', c.drink)] }),
  notReady: (c) => step('wait', G(c.rng, ['Thanks. We need a few more minutes for the food.', 'Gracias. Necesitamos unos minutos más para la comida.'], ['We are still looking at the menu.', 'Todavía estamos viendo el menú.'], ['Everything looks good. We can not decide!', 'Todo se ve bien. ¡No nos decidimos!']), SAY.takeTime(c.rng)),
  ready: (c) => step('ready', G(c.rng, ['I think we are ready.', 'Creo que estamos listos.'], ['Okay, we know what we want.', 'Bien, ya sabemos qué queremos.'], ['Excuse me, we are ready to order.', 'Disculpe, estamos listos para ordenar.'], ['Hi, can we order now?', 'Hola, ¿podemos ordenar ya?'], ['We are starving. Can we order?', 'Tenemos mucha hambre. ¿Podemos ordenar?']), SAY.whatOrder(c.rng)),
  order: (c) => step('order', orderLine(c), c.main.temp ? SAY.howCooked(c.rng) : SAY.anythingElse(c.rng), [], { ...LINKED, pedido: [P('plato', c.main), ...(c.main.side ? [P('guarnicion', c.side)] : [])] }),
  temp: (c) => (c.main.temp ? step('temp', G(c.rng, [`${cap(c.temp.en)}, please.`, `${cap(c.temp.es)}, por favor.`], [`I like it ${c.temp.en}.`, `Me gusta ${c.temp.es}.`], [`Make it ${c.temp.en}, please.`, `Que sea ${c.temp.es}, por favor.`]), SAY.anythingElse(c.rng), [], { ...LINKED, pedido: [P('coccion', c.temp)] }) : null),
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

// Respuestas de las situaciones ampliadas (Mesas 2.0): wifi, baño, niños, vino, alergias, reservas, quejas...
Object.assign(SAY, {
  wifiYes: R('Dile que sí tienen wifi.',
    ['Yes, we have wifi.', 'Sí, tenemos wifi.'], ['Yes, we do. Here is the password.', 'Sí. Aquí tiene la contraseña.']),
  wifiPass: R('Dile que la contraseña está en el menú.',
    ['The password is on the menu.', 'La contraseña está en el menú.'], ['You can find it on the menu.', 'La encuentra en el menú.']),
  restroomRight: R('Dile que el baño está a la derecha.',
    ['Yes, it is on the right.', 'Sí, está a la derecha.'], ['It is right over there.', 'Está justo allá.']),
  giveKey: R('Dale la llave del baño.',
    ['Here is the key.', 'Aquí está la llave.'], ['Sure. Here you go.', 'Claro. Aquí tiene.']),
  stillSparkling: R('Pregunta si quiere agua sin gas o con gas.',
    ['Of course. Still or sparkling?', 'Claro. ¿Sin gas o con gas?'], ['Sure. Would you like still or sparkling?', 'Claro. ¿Quiere sin gas o con gas?']),
  withIce: R('Di que claro y que la traes con hielo.',
    ['Sure. I will bring it with ice.', 'Claro. Se la traigo con hielo.'], ['No problem. With ice.', 'Sin problema. Con hielo.']),
  kidsMenu: R('Di que sí y entrega el menú de niños.',
    ['Yes, we do. Here you go.', 'Sí, tenemos. Aquí tiene.'], ['Of course. Here is the kids menu.', 'Claro. Aquí está el menú para niños.']),
  juiceWhich: R('Pregunta qué jugo quiere.',
    ['Of course. Apple or orange juice?', 'Claro. ¿Jugo de manzana o de naranja?'], ['Sure. What kind of juice?', 'Claro. ¿Qué tipo de jugo?']),
  hereReceipt: R('Di que claro y entrega el recibo.',
    ['Of course. Here is your receipt.', 'Claro. Aquí está su recibo.'], ['Sure. Here you go.', 'Claro. Aquí tiene.']),
  tipNotIn: R('Dile que la propina no está incluida.',
    ['The tip is not included.', 'La propina no está incluida.'], ['No, the tip is not on the check.', 'No, la propina no está en la cuenta.']),
  thanksTip: R('Agradece la propina y despídete.',
    ['Thank you so much! Have a great night!', '¡Muchas gracias! ¡Que tenga una linda noche!'], ['Thank you! That is so kind.', '¡Gracias! Es muy amable.']),
  askOrderName: R('Pregunta a nombre de quién está el pedido.',
    ['Sure. What name is it under?', 'Claro. ¿A nombre de quién está?'], ['Of course. Under what name?', 'Claro. ¿A qué nombre?']),
  handOrder: R('Entrega el pedido y despídete.',
    ['Here it is. Have a great night!', 'Aquí está. ¡Que tenga una linda noche!'], ['Here is the order. Thank you!', 'Aquí está el pedido. ¡Gracias!']),
  askSize: R('Pregunta qué tamaño quiere.',
    ['Sure. Small, medium, or large?', 'Claro. ¿Pequeño, mediano o grande?'], ['What size would you like?', '¿Qué tamaño quiere?']),
  cashOk: R('Di que claro y que aceptan efectivo.',
    ['Of course. We take cash.', 'Claro. Aceptamos efectivo.'], ['Yes, cash is fine.', 'Sí, el efectivo está bien.']),
  yesBoth: R('Dile que sí, puede usar las dos formas de pago.',
    ['Yes, you can use both.', 'Sí, puede usar las dos.'], ['Of course. Cash and card are fine.', 'Claro. Efectivo y tarjeta están bien.']),
  peakBusy: R('Dile que hay mucha gente y que revisas.',
    ['It is very busy. Let me check.', 'Hay mucha gente. Déjeme ver.'], ['We are very busy right now. Let me look.', 'Estamos muy llenos ahora. Déjeme revisar.']),
  barSeat: R('Ofrece sentarlos en la barra.',
    ['I can seat you at the bar.', 'Puedo sentarlos en la barra.'], ['Would you like to sit at the bar?', '¿Quieren sentarse en la barra?']),
  askChef: R('Dile que le preguntarás al chef.',
    ['Let me ask the chef.', 'Déjeme preguntarle al chef.'], ['Good question. I will ask the chef.', 'Buena pregunta. Le pregunto al chef.']),
  brunchYes: R('Dile que sí sirven brunch.',
    ['Yes! Brunch starts at ten.', '¡Sí! El brunch empieza a las diez.'], ['Yes, we serve brunch until two.', 'Sí, servimos brunch hasta las dos.']),
  brunchPick: R('Recomienda los pancakes o los huevos benedict.',
    ['The pancakes are really good.', 'Los pancakes están muy buenos.'], ['Our eggs benedict is popular.', 'Los huevos benedict son muy populares.']),
  coffeeJuice: R('Pregunta si quieren café o jugo.',
    ['Would you like coffee or juice?', '¿Quieren café o jugo?'], ['Can I get you some coffee or juice?', '¿Les traigo café o jugo?']),
  askDinner: R('Pregunta qué van a comer para sugerir el vino.',
    ['What are you having for dinner?', '¿Qué van a cenar?'], ['What dish are you having tonight?', '¿Qué plato van a comer esta noche?']),
  glassBottle: R('Pregunta si quieren una copa o una botella.',
    ['A glass or a bottle?', '¿Una copa o una botella?'], ['Would you like a glass or a bottle?', '¿Quieren una copa o una botella?']),
  redWhite: R('Recomienda el vino tinto con la carne.',
    ['The red wine is great with meat.', 'El vino tinto va muy bien con la carne.'], ['I like the red wine with that.', 'A mí me gusta el vino tinto con eso.']),
  birthdayHow: R('Felicita al niño y ofrece una vela.',
    ['Happy birthday! Let me get a candle.', '¡Feliz cumpleaños! Voy a traer una vela.'], ['Oh, happy birthday! I will bring a candle.', '¡Ay, feliz cumpleaños! Traigo una vela.']),
  isAllergy: R('Pregunta si es una alergia.',
    ['Is it an allergy?', '¿Es una alergia?'], ['Thank you. Is it an allergy?', 'Gracias. ¿Es una alergia?']),
  lastCall: R('Avisa que es la última llamada.',
    ['This is last call for drinks.', 'Es la última llamada para bebidas.'], ['Last call is in ten minutes.', 'La última llamada es en diez minutos.']),
  oneMoreRound: R('Di que claro y que traes otra ronda.',
    ['Sure. I will bring another round.', 'Claro. Traigo otra ronda.'], ['Of course. One more round.', 'Claro. Una ronda más.']),
  boosterSeat: R('Di que les traes un asiento elevado.',
    ['I will bring a booster seat.', 'Les traigo un asiento elevado.'], ['Sure. A booster seat is coming.', 'Claro. Ya viene un asiento elevado.']),
  strollerSpot: R('Dile dónde puede dejar el carrito del bebé.',
    ['You can leave it near the window.', 'Puede dejarlo cerca de la ventana.'], ['You can put it right there.', 'Puede ponerlo justo ahí.']),
  hotOne: R('Ofrece traer uno caliente.',
    ['Let me bring you a hot one.', 'Le traigo uno caliente.'], ['I will ask the kitchen for a new one.', 'Le pido uno nuevo a la cocina.']),
  takeBack: R('Discúlpate y retira el plato.',
    ['I am so sorry. Let me take that back.', 'Lo siento mucho. Lo retiro enseguida.'], ['Sorry about that. I will take it away.', 'Perdón por eso. Lo retiro.']),
  rightOne: R('Dile que traes el plato correcto.',
    ['I will bring the right one now.', 'Le traigo el correcto ahora mismo.'], ['The right dish is coming right up.', 'El plato correcto viene enseguida.']),
  beCareful: R('Dile que tendrás mucho cuidado.',
    ['I will be very careful.', 'Voy a tener mucho cuidado.'], ['We will be careful. Thank you.', 'Vamos a tener cuidado. Gracias.']),
  lookFor: R('Dile que lo buscas y pide un momento.',
    ['Let me look for it. One moment.', 'Déjeme buscarlo. Un momento.'], ['I will look for it right now.', 'Lo busco ahora mismo.']),
  foundIt2: R('Dile que lo encontraste.',
    ['Good news! I found it.', '¡Buenas noticias! Lo encontré.'], ['Here it is. I found it!', 'Aquí está. ¡Lo encontré!']),
  billTip: R('Dile que sí y que traes el recibo.',
    ['Of course. I will bring the receipt.', 'Claro. Traigo el recibo.'], ['Sure. Let me get the receipt.', 'Claro. Déjeme traer el recibo.']),
  gotPercent: R('Repite el porcentaje de propina.',
    ['Twenty percent. Got it.', 'Veinte por ciento. Entendido.'], ['Okay, twenty percent.', 'Bien, veinte por ciento.']),
  cantFind: R('Dile que lamentas no encontrar la reservación.',
    ['I am sorry. I can not find it.', 'Lo siento. No la encuentro.'], ['Sorry, I do not see it here.', 'Perdón, no la veo aquí.']),
  notReadyTable: R('Discúlpate: su mesa todavía no está lista.',
    ['I am sorry. Your table is not ready yet.', 'Lo siento. Su mesa todavía no está lista.'], ['Sorry, we need a few more minutes.', 'Perdón, necesitamos unos minutos más.']),
  drinkWhileWait: R('Ofrece una bebida mientras esperan.',
    ['Can I get you a drink while you wait?', '¿Les traigo una bebida mientras esperan?'], ['Would you like a drink at the bar?', '¿Quieren algo de tomar en la barra?']),
  dontEat: R('Pídele que no lo coma y retira el plato.',
    ['Please do not eat it. I will take it away.', 'Por favor, no lo coma. Lo retiro.'], ['Please stop. I will take that away.', 'Por favor, pare. Lo retiro.']),
  getManagerNow: R('Dile que llamas al gerente ahora mismo.',
    ['I will get my manager right now.', 'Llamo a mi gerente ahora mismo.'], ['Let me get my manager right away.', 'Déjeme llamar a mi gerente enseguida.']),
  needHelp: R('Pregunta si necesita ayuda.',
    ['Do you need help?', '¿Necesita ayuda?'], ['Should I call for help?', '¿Llamo para pedir ayuda?']),
  congratsHelp: R('Felicítalos y pregunta cómo puedes ayudar.',
    ['Wow, congratulations! How can I help?', '¡Vaya, felicidades! ¿Cómo puedo ayudar?'], ['Congratulations! How can I help you?', '¡Felicidades! ¿Cómo les puedo ayudar?']),
  afterDinner: R('Dile que lo llevas después de la cena.',
    ['Of course. I will bring it after dinner.', 'Claro. Se lo llevo después de la cena.'], ['Sure. After dinner is perfect.', 'Claro. Después de la cena es perfecto.']),
  refund: R('Dile que hablarás con tu gerente sobre el dinero.',
    ['Let me talk to my manager about that.', 'Déjeme hablar con mi gerente sobre eso.'], ['I will ask my manager about that.', 'Le pregunto a mi gerente sobre eso.']),
  phonePay: R('Dile que sí puede pagar con el teléfono.',
    ['Yes, you can pay with your phone.', 'Sí, puede pagar con su teléfono.'], ['Of course. We take phones too.', 'Claro. También aceptamos teléfonos.']),
  bigOrder: R('Pregunta qué quiere pedir.',
    ['Okay. What would you like to order?', 'Bien. ¿Qué le gustaría pedir?'], ['Sure. What do you need?', 'Claro. ¿Qué necesita?']),
  writeDown: R('Dile que lo anotas.',
    ['Let me write that down.', 'Déjeme anotarlo.'], ['Okay, I am writing that down.', 'Bien, lo estoy anotando.']),
  nameAndPhone: R('Pide su nombre y su teléfono.',
    ['Yes. Can I get a name and phone number?', 'Sí. ¿Me da un nombre y un teléfono?'], ['Perfect. What is your name and number?', 'Perfecto. ¿Cuál es su nombre y número?']),
  closingNow: R('Dile con amabilidad que van a cerrar, pero sin prisa.',
    ['We are closing soon, but take your time.', 'Vamos a cerrar pronto, pero tómense su tiempo.'], ['No rush. We close in a few minutes.', 'Sin prisa. Cerramos en unos minutos.']),
  barClosed: R('Discúlpate: la barra ya está cerrada.',
    ['I am sorry. The bar is closed.', 'Lo siento. La barra está cerrada.'], ['Sorry, the bar is closed now.', 'Perdón, la barra ya cerró.']),
  noOnions: R('Repite el cambio que pidió.',
    ['Sure. No onions.', 'Claro. Sin cebolla.'], ['No onions. Got it.', 'Sin cebolla. Entendido.']),
  sauceSide: R('Repite que la salsa va aparte.',
    ['Sauce on the side. Got it.', 'La salsa aparte. Entendido.'], ['Okay, the sauce on the side.', 'Bien, la salsa aparte.']),
  insteadOf: R('Confirma el cambio de la guarnición por una ensalada.',
    ['Of course. A salad instead of fries.', 'Claro. Una ensalada en vez de papas fritas.'], ['Sure. Salad instead of fries.', 'Claro. Ensalada en vez de papas.']),
});

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
    (c) => step('order', G(c.rng, [`I would like a ${c.alcohol.en}, please.`, `Quisiera ${c.alcohol.es}, por favor.`], [`Can I get a ${c.alcohol.en}?`, `¿Me trae ${c.alcohol.es}?`]), SAY.askId(c.rng), [], { ...LINKED, pedido: [P('bebida', c.alcohol)] }),
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
    (c) => step('options', G(c.rng, ['Maybe. What do you have?', 'Tal vez. ¿Qué tienen?'], ['Hmm. What is good?', 'Mmm. ¿Qué está bueno?']), dessertList(c), [], LINKED),
    (c) => step('pick', G(c.rng, [`We will have the ${c.dessert.en}.`, `Queremos ${c.dessert.es}.`], [`Let us share the ${c.dessert.en}.`, `Compartamos ${c.dessert.es}.`]), SAY.spoons(c.rng), [], { ...LINKED, pedido: [P('postre', c.dessert)] }),
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
    (c) => step('greet', G(c.rng, [`Hi, I want to order the ${c.main.en} to go.`, `Hola, quiero pedir ${c.main.es} para llevar.`], [`Hello, can I get the ${c.main.en} to go?`, `Hola, ¿me da ${c.main.es} para llevar?`]), SAY.toGoElse(c.rng), [], { pedido: [P('plato', c.main)] }),
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
    (c) => step('same', G(c.rng, [`Yes! The ${c.main.en}, please.`, `¡Sí! ${cap(c.main.es)}, por favor.`], [`Maybe. I loved the ${c.main.en}.`, `Tal vez. Me encantó ${c.main.es}.`]), SAY.thanksBack(c.rng), [], { ...LINKED, pedido: [P('plato', c.main)] }),
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
    (c) => step('allergy', G(c.rng, [`I have an allergy to ${c.allergy.en}.`, `Tengo alergia a ${c.allergy.es}.`], [`Before we order, I am allergic to ${c.allergy.en}.`, `Antes de ordenar, soy alérgico a ${c.allergy.es}.`]), SAY.thanksForTelling(c.rng), [], { pedido: [P('alergia', c.allergy)] }),
    (c) => step('safe', G(c.rng, [`Can I eat the ${c.main.en}?`, `¿Puedo comer ${c.main.es}?`], [`Is the ${c.main.en} okay for me?`, `¿${cap(c.main.es)} está bien para mí?`]), SAY.kitchen(c.rng), [], LINKED),
    (c) => step('promise', G(c.rng, ['Can you promise me it is okay?', '¿Me promete que no hay problema?'], ['Are you sure it will be okay?', '¿Está seguro de que no hay problema?']), SAY.chef(c.rng), [], LINKED),
    opt((c) => step('thanks', G(c.rng, ['Okay. Thank you for checking.', 'Bien. Gracias por consultar.'], ['Thank you. I appreciate it.', 'Gracias. Se lo agradezco.']), SAY.thanksBack(c.rng), [], LINKED)),
  ] },
  { id: 'vino', es: 'Vino', level: 2, plan: () => [
    (c) => step('ask', G(c.rng, ['Can we see the wine list?', '¿Podemos ver la carta de vinos?'], ['Do you have a wine list?', '¿Tiene carta de vinos?'], ['I would love a glass of wine.', 'Me encantaría una copa de vino.']), SAY.wineOrWhite(c.rng)),
    (c) => step('glass', G(c.rng, [`${cap(c.wine.en)}, please. Just one glass.`, `${cap(c.wine.es)}, por favor. Solo una copa.`], [`A glass of ${c.wine.en}, please.`, `Una copa de ${c.wine.es}, por favor.`]), SAY.askId(c.rng), [], { ...LINKED, pedido: [P('bebida', c.wine)] }),
    (c) => step('id', G(c.rng, ['Sure, here you go.', 'Claro, aquí tiene.'], ['Of course. Here it is.', 'Claro. Aquí está.']), SAY.thanksBack(c.rng), [], LINKED),
    opt((c) => step('close', G(c.rng, ['Okay, thank you.', 'Bien, gracias.'], ['Thanks.', 'Gracias.']), SAY.cheers(c.rng))),
  ] },
  { id: 'vegetariano', es: 'Sin carne', level: 2, plan: () => [
    (c) => step('tell', G(c.rng, ['I do not eat meat.', 'No como carne.'], ['Hi, I am a vegetarian.', 'Hola, soy vegetariano.']), SAY.thanksForTelling(c.rng)),
    (c) => step('ask', G(c.rng, ['Do you have a dish with no meat?', '¿Tienen algún plato sin carne?'], ['What can I eat here?', '¿Qué puedo comer aquí?']), noMeat(c), [], LINKED),
    (c) => step('order', G(c.rng, [`Okay. I will try the ${c.veggie.short ?? c.veggie.en}.`, `Bien. Voy a probar ${c.veggie.shortEs ?? c.veggie.es}.`], [`Perfect, the ${c.veggie.short ?? c.veggie.en} then.`, `Perfecto, entonces ${c.veggie.shortEs ?? c.veggie.es}.`]), SAY.anythingElse(c.rng), [], { ...LINKED, pedido: [P('plato', c.veggie)] }),
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
    (c) => step('ask', G(c.rng, [`Can we share the ${c.main.en}?`, `¿Podemos compartir ${c.main.es}?`], [`We want to split the ${c.main.en}. Is that okay?`, `Queremos compartir ${c.main.es}. ¿Está bien?`]), SAY.safeShare(c.rng), [], { pedido: [P('plato', c.main)] }),
    (c) => step('start', G(c.rng, [`Thanks! Can we start with the ${c.starter.en}?`, `¡Gracias! ¿Empezamos con ${c.starter.es}?`], [`And the ${c.starter.en} first, please.`, `Y primero ${c.starter.es}, por favor.`]), SAY.anythingElse(c.rng), [], { ...LINKED, pedido: [P('entrada', c.starter)] }),
    (c) => step('close', ALL_SET(c), SAY.putIn(c.rng), [], LINKED),
  ] },
  { id: 'happy_hour', es: 'Happy hour', level: 2, plan: () => [
    (c) => step('ask', G(c.rng, ['Hi! Is it still happy hour?', '¡Hola! ¿Todavía es happy hour?'], ['Do you have happy hour today?', '¿Tienen happy hour hoy?']), SAY.happyHourInfo(c.rng)),
    (c) => step('food', G(c.rng, ['Nice! What food do you recommend?', '¡Qué bien! ¿Qué comida recomienda?'], ['And is there any food on special?', '¿Y hay comida en oferta?']), SAY.happyHourFood(c.rng), [], LINKED),
    (c) => step('order', G(c.rng, [`Okay, the wings and a ${c.alcohol.en}, please.`, `Bien, las alitas y ${c.alcohol.es}, por favor.`], [`Great. Tacos and a ${c.alcohol.en}.`, `Genial. Tacos y ${c.alcohol.es}.`]), SAY.askId(c.rng), [], { ...LINKED, pedido: [P('bebida', c.alcohol)] }),
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
    (c) => step('new', L(`I want the ${c.alt.en}, not the ${c.main.en}.`, `Quiero ${c.alt.es}, no ${c.main.es}.`), R(`Confirma que ahora es ${c.alt.es} y que avisarás a la cocina.`, [`Okay, the ${c.alt.en}. I will tell the kitchen.`, `Bien, ${c.alt.es}. Le aviso a la cocina.`], [`Sure, the ${c.alt.en}. Let me tell the kitchen.`, `Claro, ${c.alt.es}. Déjeme avisar a la cocina.`])(c.rng), [], { ...LINKED, pedido: [P('plato', c.alt)] }),
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
    (c) => step('wine', G(c.rng, [`Thank you. Two glasses of ${c.wine.en}, please.`, `Gracias. Dos copas de ${c.wine.es}, por favor.`], [`Perfect. We would love ${c.wine.en}.`, `Perfecto. Nos encantaría ${c.wine.es}.`]), SAY.askId(c.rng), [], { ...LINKED, pedido: [P('bebida', c.wine)] }),
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
    (c) => step('confirm', G(c.rng, ['Okay, I will have that.', 'Bien, voy a pedir ese.'], ['Sounds great. I will try it.', 'Suena muy bien. Lo voy a probar.']), R(`Confirma el pedido: ${c.alt.es}.`, [`Let me confirm. One ${c.alt.en}.`, `Déjeme confirmar. ${cap(c.alt.es)}.`], [`Perfect. One ${c.alt.en}.`, `Perfecto. ${cap(c.alt.es)}.`])(c.rng), [], { ...LINKED, pedido: [P('plato', c.alt)] }),
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

  // --- Mesas 2.0: situaciones nuevas. `needs` las quita en locales donde no encajan (sin alcohol, sin desayuno, sin para llevar). ---
  // Nivel 1
  { id: 'wifi', es: 'Pregunta por el wifi', level: 1, plan: () => [
    (c) => step('ask', G(c.rng, ['Excuse me, do you have wifi?', 'Disculpe, ¿tienen wifi?'], ['Hi! Is there wifi here?', '¡Hola! ¿Hay wifi aquí?']), SAY.wifiYes(c.rng)),
    (c) => step('pass', G(c.rng, ['Great! What is the password?', '¡Genial! ¿Cuál es la contraseña?'], ['Nice. Where can I find the password?', 'Qué bien. ¿Dónde encuentro la contraseña?']), SAY.wifiPass(c.rng), [], LINKED),
    (c) => step('charge', G(c.rng, ['Can I charge my phone somewhere?', '¿Puedo cargar mi teléfono en algún lado?'], ['Do you have a charger I can use?', '¿Tiene un cargador que pueda usar?']), SAY.checkOneMoment(c.rng), [], LINKED),
    opt((c) => step('thanks', G(c.rng, ['Thank you so much.', 'Muchas gracias.'], ['You are very kind.', 'Es muy amable.']), SAY.pleasure(c.rng), [], LINKED)),
  ] },
  { id: 'bano', es: 'Busca el baño', level: 1, plan: () => [
    (c) => step('ask', G(c.rng, ['Excuse me, where is the restroom?', 'Disculpe, ¿dónde está el baño?'], ['Hi, where can I find the bathroom?', 'Hola, ¿dónde encuentro el baño?']), restroom(c.rng)),
    (c) => step('side', G(c.rng, ['Is it on the right?', '¿Está a la derecha?'], ['Is it near the kitchen?', '¿Está cerca de la cocina?']), SAY.restroomRight(c.rng), [], LINKED),
    (c) => step('key', G(c.rng, ['Is it locked? Do I need a key?', '¿Está cerrado? ¿Necesito llave?'], ['Do I need a key for it?', '¿Necesito una llave?']), SAY.giveKey(c.rng), [], LINKED),
    opt((c) => step('thanks', G(c.rng, ['Thank you!', '¡Gracias!'], ['Thanks a lot.', 'Muchas gracias.']), SAY.pleasure(c.rng), [], LINKED)),
  ] },
  { id: 'agua', es: 'Piden agua', level: 1, plan: () => [
    (c) => step('ask', G(c.rng, ['Can we get some water for the table?', '¿Nos trae agua para la mesa?'], ['Could we start with some water?', '¿Podemos empezar con agua?']), SAY.stillSparkling(c.rng)),
    (c) => step('still', G(c.rng, ['Still, please. And with ice.', 'Sin gas, por favor. Y con hielo.'], ['Sparkling, please. With lemon.', 'Con gas, por favor. Con limón.']), SAY.withIce(c.rng), [], LINKED),
    (c) => step('thanks', G(c.rng, ['Thank you. We need a few minutes.', 'Gracias. Necesitamos unos minutos.'], ['Perfect. We are still looking.', 'Perfecto. Todavía estamos viendo.']), SAY.takeTime(c.rng), [], LINKED),
  ] },
  { id: 'menu_ninos', es: 'Menú para niños', level: 1, plan: () => [
    (c) => step('ask', G(c.rng, ['Do you have a kids menu?', '¿Tienen menú para niños?'], ['Hi! Is there a menu for my son?', '¡Hola! ¿Hay un menú para mi hijo?']), SAY.kidsMenu(c.rng)),
    (c) => step('food', G(c.rng, ['Can he have chicken and fries?', '¿Puede comer pollo con papas fritas?'], ['Can she have a small pasta?', '¿Puede comer una pasta pequeña?']), SAY.tellKitchen(c.rng), [], LINKED),
    (c) => step('juice', G(c.rng, ['And something to drink, please.', 'Y algo de tomar, por favor.'], ['Do you have juice for kids?', '¿Tienen jugo para niños?']), SAY.juiceWhich(c.rng), [], LINKED),
    opt((c) => step('thanks', G(c.rng, ['Thank you. He is very hungry.', 'Gracias. Tiene mucha hambre.'], ['Thanks. She is very hungry.', 'Gracias. Tiene mucha hambre.']), SAY.back(c.rng), [], LINKED)),
  ] },
  { id: 'recibo', es: 'Recibo y propina', level: 1, ending: true, plan: () => [
    (c) => step('receipt', G(c.rng, ['Can I get a receipt, please?', '¿Me da un recibo, por favor?'], ['Could I have the receipt?', '¿Me da el recibo?']), SAY.hereReceipt(c.rng)),
    (c) => step('tip', G(c.rng, ['Is the tip included?', '¿La propina está incluida?'], ['Do I need to add a tip?', '¿Tengo que agregar propina?']), SAY.tipNotIn(c.rng), [], LINKED),
    (c) => step('leave', G(c.rng, ['Okay. I will leave a tip.', 'Bien. Voy a dejar propina.'], ['Okay. Here is the tip.', 'Bien. Aquí está la propina.']), SAY.thanksTip(c.rng), [], LINKED),
  ] },
  { id: 'delivery', es: 'Llega el repartidor', level: 1, entrance: true, needs: 'llevar', plan: () => [
    (c) => step('greet', G(c.rng, ['Hi, I am here to pick up an order.', 'Hola, vengo a recoger un pedido.'], ['Hello! I am the delivery driver.', '¡Hola! Soy el repartidor.']), SAY.askOrderName(c.rng)),
    (c) => step('name', G(c.rng, [`It is under ${c.guestName}.`, `Está a nombre de ${c.guestName}.`], [`${c.guestName}, for delivery.`, `${c.guestName}, para entrega.`]), SAY.checkOneMoment(c.rng), [], LINKED),
    (c) => step('ready', G(c.rng, ['Okay. I can wait here.', 'Bien. Puedo esperar aquí.'], ['Sure. Is it almost ready?', 'Claro. ¿Ya casi está?']), SAY.tenMinutes(c.rng), [], LINKED),
    opt((c) => step('give', G(c.rng, ['Thanks. Is that everything?', 'Gracias. ¿Eso es todo?'], ['Great. Is it ready now?', 'Genial. ¿Ya está listo?']), SAY.handOrder(c.rng), [], LINKED)),
  ] },
  { id: 'cafe_llevar', es: 'Café para llevar', level: 1, entrance: true, needs: 'llevar', plan: () => [
    (c) => step('greet', G(c.rng, ['Hi! Can I get a coffee to go?', '¡Hola! ¿Me da un café para llevar?'], ['Good morning. A coffee to go, please.', 'Buenos días. Un café para llevar, por favor.']), SAY.askSize(c.rng)),
    (c) => step('size', G(c.rng, ['Large, please. With milk.', 'Grande, por favor. Con leche.'], ['Medium, please. No sugar.', 'Mediano, por favor. Sin azúcar.']), SAY.whatName(c.rng), [], LINKED),
    (c) => step('name', G(c.rng, [`It is ${c.guestName}.`, `Es ${c.guestName}.`], [`${c.guestName}, please.`, `${c.guestName}, por favor.`]), SAY.tenMinutes(c.rng), [], LINKED),
    opt((c) => step('bye', G(c.rng, ['Thanks. Have a nice day!', 'Gracias. ¡Que tenga un buen día!'], ['Great, thank you.', 'Genial, gracias.']), SAY.orderReady(c.rng), [], LINKED)),
  ] },
  { id: 'pagar_efectivo', es: 'Paga en efectivo', level: 1, ending: true, plan: () => [
    (c) => step('ask', G(c.rng, ['Can I pay with cash?', '¿Puedo pagar en efectivo?'], ['Do you take cash here?', '¿Aceptan efectivo aquí?']), SAY.cashOk(c.rng)),
    (c) => step('change', G(c.rng, ['Do you have change for a fifty?', '¿Tiene cambio de cincuenta?'], ['I only have a big bill. Is that okay?', 'Solo tengo un billete grande. ¿Está bien?']), SAY.checkOneMoment(c.rng), [], LINKED),
    (c) => step('keep', G(c.rng, ['Keep the change. Thank you.', 'Quédese con el cambio. Gracias.'], ['That is fine. Keep the change.', 'Está bien. Quédese con el cambio.']), SAY.thanksTip(c.rng), [], LINKED),
  ] },

  // Nivel 2
  { id: 'hora_pico', es: 'Sin reservación en hora pico', level: 2, entrance: true, plan: () => [
    (c) => step('greet', G(c.rng, ['Hi! Do you have a table for us tonight?', '¡Hola! ¿Tienen mesa para nosotros esta noche?'], ['Hello. We do not have a reservation.', 'Hola. No tenemos reservación.']), SAY.peakBusy(c.rng)),
    (c) => step('where', G(c.rng, ['Okay. Is there anything at all?', 'Bien. ¿Hay algo disponible?'], ['We can sit anywhere. Even outside.', 'Podemos sentarnos donde sea. Incluso afuera.']), SAY.barSeat(c.rng), [], LINKED),
    (c) => step('yes', G(c.rng, ['The bar is fine. Thank you!', 'La barra está bien. ¡Gracias!'], ['Yes, the bar is great.', 'Sí, la barra está muy bien.']), SAY.follow(c.rng), [], LINKED),
    opt((c) => step('menu', G(c.rng, ['Can we see the menu?', '¿Podemos ver el menú?'], ['Great. Menus, please.', 'Genial. Menús, por favor.']), SAY.menus(c.rng), [], LINKED)),
  ] },
  { id: 'vegano', es: 'Cliente vegano', level: 2, plan: () => [
    (c) => step('tell', G(c.rng, ['Hi, I am vegan. I do not eat meat or dairy.', 'Hola, soy vegano. No como carne ni lácteos.'], ['I am vegan. Is there anything for me?', 'Soy vegano. ¿Hay algo para mí?']), SAY.thanksForTelling(c.rng)),
    (c) => step('ask', G(c.rng, ['Is there any cheese or egg in the salad?', '¿La ensalada tiene queso o huevo?'], ['Does the soup have any dairy?', '¿La sopa lleva lácteos?']), SAY.askChef(c.rng), [], LINKED),
    (c) => step('order', G(c.rng, ['Okay. I will have the salad, no cheese.', 'Bien. Quiero la ensalada, sin queso.'], ['Okay. Just the salad, please.', 'Bien. Solo la ensalada, por favor.']), SAY.putIn(c.rng), [], LINKED),
    opt((c) => step('close', G(c.rng, ['Thank you for checking.', 'Gracias por revisar.'], ['I really appreciate it.', 'Se lo agradezco mucho.']), SAY.pleasure(c.rng), [], LINKED)),
  ] },
  { id: 'brunch', es: 'Quieren brunch', level: 2, needs: 'desayuno', plan: () => [
    (c) => step('ask', G(c.rng, ['Hi! Are you serving brunch?', '¡Hola! ¿Sirven brunch?'], ['Good morning. Do you have a brunch menu?', 'Buenos días. ¿Tienen menú de brunch?']), SAY.brunchYes(c.rng)),
    (c) => step('rec', G(c.rng, ['Great! What do you recommend?', '¡Genial! ¿Qué recomienda?'], ['Nice. What is good for brunch?', 'Qué bien. ¿Qué es bueno para el brunch?']), SAY.brunchPick(c.rng), [], LINKED),
    (c) => step('order', G(c.rng, ['Perfect. We will have the pancakes.', 'Perfecto. Queremos los pancakes.'], ['Okay, one eggs benedict, please.', 'Bien, unos huevos benedict, por favor.']), SAY.coffeeJuice(c.rng), [], LINKED),
    opt((c) => step('drink', G(c.rng, ['Coffee for me, juice for her.', 'Café para mí, jugo para ella.'], ['Two coffees, please.', 'Dos cafés, por favor.']), SAY.milkSugar(c.rng), [], LINKED)),
  ] },
  { id: 'recomendar_vino', es: 'Pide recomendación de vino', level: 2, needs: 'vino', plan: () => [
    (c) => step('ask', G(c.rng, ['Can you recommend a wine?', '¿Puede recomendarnos un vino?'], ['We want some wine. What is good?', 'Queremos vino. ¿Qué es bueno?']), SAY.askDinner(c.rng)),
    (c) => step('dish', G(c.rng, [`We are having the ${c.main.en}.`, `Vamos a comer ${c.main.es}.`], [`I will have the ${c.main.en}.`, `Voy a comer ${c.main.es}.`]), SAY.redWhite(c.rng), [], LINKED),
    (c) => step('size', G(c.rng, ['Sounds good. A glass for me.', 'Suena bien. Una copa para mí.'], ['Let us get a whole bottle.', 'Pidamos una botella entera.']), SAY.askId(c.rng), [], LINKED),
    opt((c) => step('id', G(c.rng, ['Sure, here you go.', 'Claro, aquí tiene.'], ['Of course. Here it is.', 'Claro. Aquí está.']), SAY.thanksBack(c.rng), [], LINKED)),
  ] },
  { id: 'brindis', es: 'Brindis en la mesa', level: 2, needs: 'vino', plan: () => [
    (c) => step('ask', G(c.rng, ['We want to make a toast!', '¡Queremos hacer un brindis!'], ['We are celebrating! Drinks for everyone, please.', '¡Estamos celebrando! Bebidas para todos, por favor.']), SAY.wineOrWhite(c.rng)),
    (c) => step('pick', G(c.rng, [`${cap(c.wine.en)}, please. Four glasses.`, `${cap(c.wine.es)}, por favor. Cuatro copas.`], [`Four glasses of ${c.wine.en}, please.`, `Cuatro copas de ${c.wine.es}, por favor.`]), SAY.askId(c.rng), [], { ...LINKED, pedido: [P('bebida', c.wine)] }),
    (c) => step('id', G(c.rng, ['Of course. Here are our IDs.', 'Claro. Aquí están nuestras identificaciones.'], ['Sure. We all have our IDs.', 'Claro. Todos tenemos identificación.']), SAY.thanksBack(c.rng), [], LINKED),
    (c) => step('cheers', G(c.rng, ['Cheers, everybody!', '¡Salud, todos!'], ['To a great night!', '¡Por una gran noche!']), SAY.cheers(c.rng), [], LINKED),
  ] },
  { id: 'nino_cumple', es: 'Cumpleaños de un niño', level: 2, plan: () => [
    (c) => step('birthday', G(c.rng, ['It is my son\'s birthday today!', '¡Hoy es el cumpleaños de mi hijo!'], ['We are here for my daughter\'s birthday!', '¡Estamos aquí por el cumpleaños de mi hija!']), SAY.birthdayHow(c.rng)),
    (c) => step('cake', G(c.rng, ['Do you have a small dessert for him?', '¿Tienen un postre pequeño para él?'], ['Can she get a dessert with a candle?', '¿Puede tener un postre con una vela?']), SAY.kitchen(c.rng), [], LINKED),
    (c) => step('photo', G(c.rng, ['Thank you! Can you take a picture?', '¡Gracias! ¿Puede tomar una foto?'], ['Thanks! Could you take our photo?', '¡Gracias! ¿Nos toma una foto?']), SAY.photo(c.rng), [], LINKED),
    opt((c) => step('thanks', G(c.rng, ['He is so happy. Thank you!', 'Está muy feliz. ¡Gracias!'], ['She loves it. Thank you!', 'Le encanta. ¡Gracias!']), SAY.pleasure(c.rng), [], LINKED)),
  ] },
  { id: 'sin_gluten', es: 'Sin gluten', level: 2, tail: true, plan: () => [
    (c) => step('tell', G(c.rng, ['I can not eat gluten.', 'No puedo comer gluten.'], ['Hi, I need food without gluten.', 'Hola, necesito comida sin gluten.']), SAY.isAllergy(c.rng)),
    (c) => step('yes', G(c.rng, ['Yes, it makes me sick.', 'Sí, me cae muy mal.'], ['Yes. I get very sick.', 'Sí. Me enfermo mucho.']), SAY.chef(c.rng), [], LINKED),
    (c) => step('ask', G(c.rng, [`Can I eat the ${c.main.en}?`, `¿Puedo comer ${c.main.es}?`], ['What can I have for dinner?', '¿Qué puedo cenar?']), SAY.kitchen(c.rng), [], LINKED),
    opt((c) => step('thanks', G(c.rng, ['Thank you for helping me.', 'Gracias por ayudarme.'], ['I appreciate it.', 'Se lo agradezco.']), SAY.thanksBack(c.rng), [], LINKED)),
  ] },
  { id: 'ultima_llamada', es: 'Última llamada', level: 2, needs: 'vino', plan: () => [
    (c) => step('greet', G(c.rng, ['Hi! Can we get one more round?', '¡Hola! ¿Nos trae otra ronda?'], ['Excuse me, can we get two more drinks?', 'Disculpe, ¿nos trae dos bebidas más?']), SAY.lastCall(c.rng)),
    (c) => step('order', G(c.rng, [`Oh! Then two ${c.alcohol.en}, please.`, `¡Ah! Entonces dos ${c.alcohol.es}, por favor.`], [`Then one more ${c.alcohol.en}, please.`, `Entonces una más de ${c.alcohol.es}, por favor.`]), SAY.oneMoreRound(c.rng), [], LINKED),
    (c) => step('check', G(c.rng, ['And can we get the check too?', '¿Y nos trae también la cuenta?'], ['Please bring the check with the drinks.', 'Traiga la cuenta con las bebidas, por favor.']), SAY.hereCheck(c.rng), [], LINKED),
  ] },
  { id: 'silla_ninos', es: 'Silla y carrito del bebé', level: 2, plan: () => [
    (c) => step('greet', G(c.rng, ['Hi! We have a baby with us.', '¡Hola! Venimos con un bebé.'], ['Hello! We have a one year old.', '¡Hola! Tenemos un niño de un año.']), SAY.highChair(c.rng)),
    (c) => step('stroller', G(c.rng, ['Yes, please. Where can I put the stroller?', 'Sí, por favor. ¿Dónde pongo el carrito?'], ['Yes. And where can we leave the stroller?', 'Sí. ¿Y dónde dejamos el carrito?']), SAY.strollerSpot(c.rng), [], LINKED),
    (c) => step('older', G(c.rng, ['Our older son is four. Do you have a booster?', 'Nuestro hijo mayor tiene cuatro. ¿Tienen un asiento elevado?'], ['The other kid needs a booster seat.', 'El otro niño necesita un asiento elevado.']), SAY.boosterSeat(c.rng), [], LINKED),
    opt((c) => step('thanks', G(c.rng, ['Thank you. You are so kind.', 'Gracias. Es muy amable.'], ['Thanks a lot for the help.', 'Muchas gracias por la ayuda.']), SAY.pleasure(c.rng), [], LINKED)),
  ] },

  // Nivel 3
  { id: 'comida_fria', es: 'La comida llegó fría', level: 3, tail: true, tense: true, plan: () => [
    (c) => step('problem', G(c.rng, [`Excuse me, my ${c.main.en} is cold.`, `Disculpe, ${c.main.es} está frío.`], ['Sorry, but this food is cold.', 'Perdón, pero esta comida está fría.']), SAY.sorry(c.rng)),
    (c) => step('what', G(c.rng, ['It has been on the table for a while.', 'Lleva un rato en la mesa.'], ['It was cold when it came.', 'Ya estaba frío cuando llegó.']), SAY.hotOne(c.rng), [], LINKED),
    (c) => step('yes', G(c.rng, ['Yes, please. I am still hungry.', 'Sí, por favor. Todavía tengo hambre.'], ['Okay. Thank you for fixing it.', 'Bien. Gracias por arreglarlo.']), SAY.patience(c.rng), [], LINKED),
    opt((c) => step('how_long', G(c.rng, ['How long will it take?', '¿Cuánto va a tardar?'], ['Will it take long?', '¿Va a tardar mucho?']), SAY.kitchen(c.rng), [], LINKED)),
  ] },
  { id: 'plato_equivocado', es: 'Plato equivocado', level: 3, tail: true, tense: true, plan: () => [
    (c) => step('problem', G(c.rng, ['Excuse me, I did not order this.', 'Disculpe, yo no pedí esto.'], [`Sorry, I asked for the ${c.main.en}.`, `Perdón, yo pedí ${c.main.es}.`]), SAY.takeBack(c.rng)),
    (c) => step('what', G(c.rng, [`This looks like the ${c.alt.en}.`, `Esto parece ${c.alt.es}.`], ['This is not what I wanted.', 'Esto no es lo que quería.']), SAY.rightOne(c.rng), [], LINKED),
    (c) => step('wait', G(c.rng, ['Okay. My friends are almost done.', 'Bien. Mis amigos ya casi terminan.'], ['Okay. Please be quick.', 'Bien. Que sea rápido, por favor.']), SAY.sorryWait(c.rng), [], LINKED),
    opt((c) => step('thanks', G(c.rng, ['Thanks. It is okay.', 'Gracias. No pasa nada.'], ['Thank you for fixing it.', 'Gracias por arreglarlo.']), SAY.patience(c.rng), [], LINKED)),
  ] },
  { id: 'alergia_grave', es: 'Alergia grave a los frutos secos', level: 3, tail: true, plan: () => [
    (c) => step('tell', G(c.rng, ['I have a serious nut allergy.', 'Tengo una alergia grave a los frutos secos.'], ['Hi, I am allergic to nuts. It is serious.', 'Hola, soy alérgico a los frutos secos. Es grave.']), SAY.thanksForTelling(c.rng)),
    (c) => step('pan', G(c.rng, ['Can the chef use a clean pan?', '¿Puede el chef usar una sartén limpia?'], ['Is the kitchen careful with nuts?', '¿La cocina tiene cuidado con los frutos secos?']), SAY.chef(c.rng), [], LINKED),
    (c) => step('serious', G(c.rng, ['Please tell the kitchen it is serious.', 'Por favor, dígale a la cocina que es grave.'], ['Please tell them it is very serious.', 'Por favor, dígales que es muy grave.']), SAY.tellKitchen(c.rng), [], LINKED),
    opt((c) => step('careful', G(c.rng, ['Thank you. Please be careful.', 'Gracias. Tenga mucho cuidado.'], ['Thank you. I really need you to be careful.', 'Gracias. De verdad necesito que tengan cuidado.']), SAY.beCareful(c.rng), [], LINKED)),
  ] },
  { id: 'picante', es: 'Demasiado picante', level: 3, tail: true, tense: true, plan: () => [
    (c) => step('problem', G(c.rng, ['Excuse me, this is too spicy for me.', 'Disculpe, esto está muy picante para mí.'], ['Sorry, I can not eat this. It is so hot.', 'Perdón, no puedo comerlo. Pica mucho.']), SAY.sorry(c.rng)),
    (c) => step('mild', G(c.rng, ['Do you have something milder?', '¿Tiene algo menos picante?'], ['Is there a dish that is not spicy?', '¿Hay algún plato que no pique?']), SAY.kitchen(c.rng), [], LINKED),
    (c) => step('water', G(c.rng, ['Can I get some water and bread?', '¿Me trae agua y pan?'], ['Please bring me some milk.', 'Tráigame un poco de leche, por favor.']), SAY.back(c.rng), [], LINKED),
    opt((c) => step('thanks', G(c.rng, ['Thank you. Sorry for the trouble.', 'Gracias. Perdón por la molestia.'], ['Thanks. I really appreciate it.', 'Gracias. Se lo agradezco mucho.']), SAY.noProblem(c.rng), [], LINKED)),
  ] },
  { id: 'gerente', es: 'Pide hablar con el gerente', level: 3, tail: true, tense: true, plan: () => [
    (c) => step('ask', G(c.rng, ['Excuse me, I want to talk to the manager.', 'Disculpe, quiero hablar con el gerente.'], ['Can I speak to your manager, please?', '¿Puedo hablar con su gerente, por favor?']), SAY.manager(c.rng)),
    (c) => step('why', G(c.rng, ['The service has been very slow tonight.', 'El servicio ha sido muy lento esta noche.'], ['We have waited a long time for our drinks.', 'Hemos esperado mucho por las bebidas.']), SAY.sorryWait(c.rng), [], LINKED),
    (c) => step('wait', G(c.rng, ['Okay. I will wait here.', 'Bien. Espero aquí.'], ['Okay. We can wait a moment.', 'Bien. Podemos esperar un momento.']), SAY.patience(c.rng), [], LINKED),
  ] },
  { id: 'objeto_perdido', es: 'Dejó algo olvidado', level: 3, entrance: true, plan: () => [
    (c) => step('greet', G(c.rng, ['Hi! I think I left my phone here last night.', '¡Hola! Creo que dejé mi teléfono aquí anoche.'], ['Hello. I lost my sunglasses here yesterday.', 'Hola. Perdí mis lentes de sol aquí ayer.']), SAY.lookFor(c.rng)),
    (c) => step('where', G(c.rng, ['We sat near the window, at the corner table.', 'Nos sentamos cerca de la ventana, en la mesa de la esquina.'], ['I was at the bar, on the right.', 'Estaba en la barra, a la derecha.']), SAY.checkOneMoment(c.rng), [], LINKED),
    (c) => step('found', G(c.rng, ['Oh, please check. It is important.', 'Ay, revise, por favor. Es importante.'], ['Thank you. I really need it.', 'Gracias. Lo necesito mucho.']), SAY.foundIt2(c.rng), [], LINKED),
    opt((c) => step('thanks', G(c.rng, ['Oh, thank you so much!', '¡Ay, muchísimas gracias!'], ['You saved my day. Thank you!', 'Me salvó el día. ¡Gracias!']), SAY.pleasure(c.rng), [], LINKED)),
  ] },
  { id: 'pedido_olvidado', es: 'Se olvidaron de la mesa', level: 3, tail: true, tense: true, plan: () => [
    (c) => step('problem', G(c.rng, ['Excuse me, we ordered a long time ago.', 'Disculpe, pedimos hace mucho rato.'], ['Hi, I think the kitchen forgot us.', 'Hola, creo que la cocina nos olvidó.']), SAY.sorryWait(c.rng)),
    (c) => step('what', G(c.rng, [`We ordered the ${c.main.en} a while ago.`, `Pedimos ${c.main.es} hace un rato.`], ['We ordered before the people next to us.', 'Pedimos antes que la gente de al lado.']), SAY.kitchen(c.rng), [], LINKED),
    (c) => step('hurry', G(c.rng, ['Okay. Please hurry.', 'Bien. Apúrese, por favor.'], ['Okay. We are very hungry.', 'Bien. Tenemos mucha hambre.']), SAY.tellKitchen(c.rng), [], LINKED),
    opt((c) => step('thanks', G(c.rng, ['Thank you for your help.', 'Gracias por su ayuda.'], ['Thanks. We can wait a little.', 'Gracias. Podemos esperar un poco.']), SAY.patience(c.rng), [], LINKED)),
  ] },
  { id: 'propina_tarjeta', es: 'Propina en la tarjeta', level: 3, ending: true, plan: () => [
    (c) => step('ask', G(c.rng, ['Excuse me, can I add a tip to my card?', 'Disculpe, ¿puedo agregar propina a mi tarjeta?'], ['I want to add a tip to the card.', 'Quiero agregar propina a la tarjeta.']), SAY.billTip(c.rng)),
    (c) => step('percent', G(c.rng, ['Make it twenty percent, please.', 'Que sea veinte por ciento, por favor.'], ['Twenty percent is fine.', 'Veinte por ciento está bien.']), SAY.gotPercent(c.rng), [], LINKED),
    (c) => step('sign', G(c.rng, ['Thank you. Great service tonight.', 'Gracias. Excelente servicio esta noche.'], ['Thanks. You were wonderful.', 'Gracias. Fue maravilloso.']), SAY.receipt(c.rng), [], LINKED),
    opt((c) => step('bye', G(c.rng, ['Have a good night!', '¡Que pase buena noche!'], ['See you next time!', '¡Hasta la próxima!']), SAY.goodbye(c.rng), [], LINKED)),
  ] },
  { id: 'cuentas_separadas', es: 'Cada uno paga lo suyo', level: 3, ending: true, plan: () => [
    (c) => step('ask', G(c.rng, ['Can each person pay for their own?', '¿Cada persona puede pagar lo suyo?'], ['Excuse me, can we get separate checks?', 'Disculpe, ¿nos trae cuentas separadas?']), SAY.split(c.rng)),
    (c) => step('how', G(c.rng, ['Separate, please. One check for each.', 'Separadas, por favor. Una cuenta para cada uno.'], ['Four checks, please.', 'Cuatro cuentas, por favor.']), SAY.checkOneMoment(c.rng), [], LINKED),
    (c) => step('mix', G(c.rng, ['Can we use cards and cash?', '¿Podemos usar tarjetas y efectivo?'], ['Some of us have cash. Is that okay?', 'Algunos tenemos efectivo. ¿Está bien?']), SAY.yesBoth(c.rng), [], LINKED),
    opt((c) => step('bye', G(c.rng, ['Thank you so much for your patience.', 'Muchas gracias por su paciencia.'], ['Thanks. You were great.', 'Gracias. Estuvo muy bien.']), SAY.goodbye(c.rng), [], LINKED)),
  ] },

  // Nivel 4
  { id: 'reserva_perdida', es: 'No encuentran la reservación', level: 4, entrance: true, tense: true, plan: () => [
    (c) => step('greet', G(c.rng, ['Good evening. We have a reservation.', 'Buenas noches. Tenemos una reservación.'], ['Hi, I booked a table for tonight.', 'Hola, reservé una mesa para esta noche.']), SAY.underName(c.rng)),
    (c) => step('name', G(c.rng, [`It is under ${c.guestName}, at eight.`, `Está a nombre de ${c.guestName}, a las ocho.`], [`${c.guestName}, for eight o'clock.`, `${c.guestName}, para las ocho.`]), SAY.cantFind(c.rng), [], LINKED),
    (c) => step('online', G(c.rng, ['I made it online yesterday. Please check again.', 'La hice en línea ayer. Revise otra vez, por favor.'], ['I have the email right here. Can you look again?', 'Tengo el correo aquí. ¿Puede buscar otra vez?']), SAY.checkOneMoment(c.rng), [], LINKED),
    (c) => step('found', G(c.rng, ['Okay. Thank you for looking.', 'Bien. Gracias por buscar.'], ['Thank you. We can wait.', 'Gracias. Podemos esperar.']), SAY.foundIt2(c.rng), [], LINKED),
  ] },
  { id: 'doble_reserva', es: 'La mesa reservada no está lista', level: 4, entrance: true, tense: true, plan: () => [
    (c) => step('greet', G(c.rng, ['Hi, we have a reservation for eight.', 'Hola, tenemos una reservación para las ocho.'], ['Good evening. Our table should be ready.', 'Buenas noches. Nuestra mesa ya debería estar lista.']), SAY.underName(c.rng)),
    (c) => step('name', G(c.rng, [`It is under ${c.guestName}.`, `Está a nombre de ${c.guestName}.`], [`${c.guestName}, for ${c.party.en}.`, `${c.guestName}, para ${c.party.es}.`]), SAY.notReadyTable(c.rng), [], LINKED),
    (c) => step('how_long', G(c.rng, ['Oh no. How long will it take?', 'Ay no. ¿Cuánto va a tardar?'], ['Really? How long do we wait?', '¿En serio? ¿Cuánto esperamos?']), SAY.tenMinutes(c.rng), [], LINKED),
    (c) => step('bar', G(c.rng, ['Okay. We can wait at the bar.', 'Bien. Podemos esperar en la barra.'], ['That is fine. We will wait inside.', 'Está bien. Esperamos adentro.']), SAY.drinkWhileWait(c.rng), [], LINKED),
  ] },
  { id: 'alergeno_error', es: 'Hay frutos secos en el plato', level: 4, tail: true, tense: true, plan: () => [
    (c) => step('problem', G(c.rng, ['Excuse me, I think there are nuts in this dish.', 'Disculpe, creo que este plato tiene frutos secos.'], ['Wait! I see nuts in my food.', '¡Espere! Veo frutos secos en mi comida.']), SAY.dontEat(c.rng)),
    (c) => step('told', G(c.rng, ['I told you I have a nut allergy.', 'Le dije que tengo alergia a los frutos secos.'], ['I said I am allergic. This is serious.', 'Dije que soy alérgico. Esto es grave.']), SAY.sorry(c.rng), [], LINKED),
    (c) => step('feel', G(c.rng, ['I feel strange. My lips are itchy.', 'Me siento raro. Me pican los labios.'], ['My mouth feels strange.', 'Siento rara la boca.']), SAY.getManagerNow(c.rng), [], LINKED),
    (c) => step('help', G(c.rng, ['Yes, please hurry.', 'Sí, por favor, apúrese.'], ['I think I need help.', 'Creo que necesito ayuda.']), SAY.needHelp(c.rng), [], LINKED),
  ] },
  { id: 'propuesta', es: 'Quiere proponer matrimonio', level: 4, plan: () => [
    (c) => step('greet', G(c.rng, ['Hi. I am going to propose tonight.', 'Hola. Esta noche voy a pedir matrimonio.'], ['Hello. I want to ask her to marry me tonight.', 'Hola. Quiero pedirle matrimonio esta noche.']), SAY.congratsHelp(c.rng)),
    (c) => step('ring', G(c.rng, ['Can the chef put the ring in the dessert?', '¿Puede el chef poner el anillo en el postre?'], ['Can you bring the ring with the dessert?', '¿Puede traer el anillo con el postre?']), SAY.askChef(c.rng), [], LINKED),
    (c) => step('when', G(c.rng, ['Please bring it after dinner.', 'Tráigalo después de la cena, por favor.'], ['I want to do it after we eat.', 'Quiero hacerlo después de comer.']), SAY.afterDinner(c.rng), [], LINKED),
    (c) => step('quiet', G(c.rng, ['Thank you. Please do not say anything.', 'Gracias. No diga nada, por favor.'], ['Thanks. It is a surprise.', 'Gracias. Es una sorpresa.']), SAY.beCareful(c.rng), [], LINKED),
  ] },
  { id: 'cliente_enojado', es: 'Cliente muy enojado', level: 4, tail: true, tense: true, plan: () => [
    (c) => step('problem', G(c.rng, ['This is unacceptable! We have waited an hour!', '¡Esto es inaceptable! ¡Hemos esperado una hora!'], ['This is terrible. Nobody has helped us!', '¡Esto es terrible! ¡Nadie nos ha ayudado!']), SAY.sorryWait(c.rng)),
    (c) => step('money', G(c.rng, ['I want my money back.', 'Quiero que me devuelvan mi dinero.'], ['I do not want to pay for this.', 'No quiero pagar por esto.']), SAY.refund(c.rng), [], LINKED),
    (c) => step('bad', G(c.rng, ['This is the worst service ever.', 'Este es el peor servicio de todos.'], ['I am never coming back.', 'No voy a volver nunca.']), SAY.sorry(c.rng), [], LINKED),
    (c) => step('ok', G(c.rng, ['Fine. I will wait for the manager.', 'Bien. Voy a esperar al gerente.'], ['Okay. Please be quick.', 'Bien. Que sea rápido, por favor.']), SAY.patience(c.rng), [], LINKED),
  ] },
  { id: 'olvido_cartera', es: 'Olvidó su cartera', level: 4, ending: true, tense: true, plan: () => [
    (c) => step('problem', G(c.rng, ['Oh no. I left my wallet at home.', 'Ay no. Dejé mi cartera en casa.'], ['I am so sorry. I forgot my wallet.', 'Lo siento mucho. Olvidé mi cartera.']), SAY.noProblem(c.rng)),
    (c) => step('phone', G(c.rng, ['Can I pay with my phone?', '¿Puedo pagar con mi teléfono?'], ['I have my phone. Does that work?', 'Tengo mi teléfono. ¿Sirve?']), SAY.phonePay(c.rng), [], LINKED),
    (c) => step('pay', G(c.rng, ['Oh, great. Here it is.', 'Ah, qué bien. Aquí está.'], ['Perfect. Thank you for helping me.', 'Perfecto. Gracias por ayudarme.']), SAY.takeCard(c.rng), [], LINKED),
    opt((c) => step('bye', G(c.rng, ['I am so embarrassed. Thank you.', 'Qué vergüenza. Gracias.'], ['You are very kind. Thank you.', 'Es muy amable. Gracias.']), SAY.pleasure(c.rng), [], LINKED)),
  ] },
  { id: 'pedido_grande', es: 'Pedido grande para llevar', level: 4, entrance: true, needs: 'llevar', plan: () => [
    (c) => step('greet', G(c.rng, ['Hi! I need food for twenty people.', '¡Hola! Necesito comida para veinte personas.'], ['Hello. I want to order for a big party.', 'Hola. Quiero pedir para una fiesta grande.']), SAY.bigOrder(c.rng)),
    (c) => step('list', G(c.rng, ['Ten burgers, five salads, and drinks.', 'Diez hamburguesas, cinco ensaladas y bebidas.'], ['Ten chicken plates and two big salads.', 'Diez platos de pollo y dos ensaladas grandes.']), SAY.writeDown(c.rng), [], LINKED),
    (c) => step('when', G(c.rng, ['Can we pick it up tomorrow at five?', '¿Podemos recogerlo mañana a las cinco?'], ['It is for tomorrow at six. Is that okay?', 'Es para mañana a las seis. ¿Está bien?']), SAY.nameAndPhone(c.rng), [], LINKED),
    opt((c) => step('give', G(c.rng, [`It is ${c.guestName}. The number is on the card.`, `Es ${c.guestName}. El número está en la tarjeta.`], [`${c.guestName}. I will write the number.`, `${c.guestName}. Voy a escribir el número.`]), SAY.thanksBack(c.rng), [], LINKED)),
  ] },
  { id: 'cierre_local', es: 'Ya van a cerrar', level: 4, ending: true, plan: () => [
    (c) => step('greet', G(c.rng, ['Excuse me, are you closing soon?', 'Disculpe, ¿van a cerrar pronto?'], ['Hi! Is it okay if we stay a little more?', '¡Hola! ¿Está bien si nos quedamos un poco más?']), SAY.closingNow(c.rng)),
    (c) => step('drink', G(c.rng, ['Can we get one more drink?', '¿Nos trae una bebida más?'], ['Could we get another round?', '¿Nos trae otra ronda?']), SAY.barClosed(c.rng), [], LINKED),
    (c) => step('check', G(c.rng, ['Okay. Can we get the check, please?', 'Bien. ¿Nos trae la cuenta, por favor?'], ['No problem. We are ready to pay.', 'No hay problema. Estamos listos para pagar.']), SAY.hereCheck(c.rng), [], LINKED),
    opt((c) => step('sorry', G(c.rng, ['Sorry for staying so late.', 'Perdón por quedarnos tan tarde.'], ['Thank you for your patience.', 'Gracias por su paciencia.']), SAY.noProblem(c.rng), [], LINKED)),
  ] },
  { id: 'cambios_pedido', es: 'Muchos cambios al plato', level: 4, plan: () => [
    (c) => step('order', G(c.rng, [`Can I get the ${c.main.en} with no onions?`, `¿Me trae ${c.main.es} sin cebolla?`], [`I want the ${c.main.en}, but no onions.`, `Quiero ${c.main.es}, pero sin cebolla.`]), SAY.noOnions(c.rng)),
    (c) => step('sauce', G(c.rng, ['And the sauce on the side, please.', 'Y la salsa aparte, por favor.'], ['Please put the sauce on the side.', 'Ponga la salsa aparte, por favor.']), SAY.sauceSide(c.rng), [], LINKED),
    (c) => step('swap', G(c.rng, ['Can I change the fries for a salad?', '¿Puedo cambiar las papas por una ensalada?'], ['Can I get a salad instead of fries?', '¿Me da una ensalada en vez de papas?']), SAY.insteadOf(c.rng), [], LINKED),
    opt((c) => step('thanks', G(c.rng, ['Perfect. Thank you for helping me.', 'Perfecto. Gracias por ayudarme.'], ['Great. Sorry for all the changes.', 'Genial. Perdón por tantos cambios.']), SAY.putIn(c.rng), [], LINKED)),
  ] },
];
// Situaciones nuevas en su propio archivo (mismo patrón, menos ruido).
SCENES.push(...escenasNuevas({ step, R, G, LINKED, opt }));

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

// --- Tipos de cliente (Servicio libre): condicionan acento, ánimo, ritmo de voz y situaciones. ---
// pace: velocidad de la voz del cliente (slow más despacio, fast algo más rápido que lo normal; el ánimo pone el resto).
export const PACES = { slow: '-18%', normal: null, fast: '+4%' };
export const CLIENTES = {
  turista: {
    es: 'Turista', blurb: 'Acento de otro país, dudas con el menú y ganas de ayuda.', pace: 'slow',
    accents: ['uk', 'au', 'in', 'france', 'italy', 'brazil', 'spain', 'latino', 'ca'], moods: ['unsure', 'chatty', 'happy'],
    scenes: ['turista', 'primera_vez', 'recomendar', 'llegada', 'recibir', 'dividir', 'cuenta', 'happy_hour', 'compartir', 'wifi', 'bano', 'agua', 'brunch', 'objeto_perdido'],
  },
  ejecutivo: {
    es: 'Ejecutivo', blurb: 'Poco tiempo y poca paciencia: habla rápido y pide precisión.', pace: 'fast',
    accents: ['us', 'uk', 'ca'], moods: ['hurry', 'picky', 'tired'],
    scenes: ['prisa', 'cerrando', 'demora', 'queja', 'cuenta_mal', 'orden', 'reserva', 'dividir', 'cuenta', 'tarjeta', 'cambios_pedido', 'pedido_grande', 'cuentas_separadas', 'propina_tarjeta', 'pagar_efectivo', 'cierre_local'],
  },
  vip: {
    es: 'VIP', blurb: 'Exigente y educado: espera un servicio impecable.', pace: 'normal',
    accents: ['uk', 'us', 'france', 'italy', 'au'], moods: ['picky', 'quiet', 'friendly'],
    scenes: ['aniversario', 'vino', 'cena', 'reserva', 'alergia', 'cuenta_mal', 'cambio', 'agotado', 'cambiar_mesa', 'recomendar_vino', 'brindis', 'propuesta', 'cliente_enojado', 'reserva_perdida', 'doble_reserva'],
  },
  familia: {
    es: 'Familia', blurb: 'Niños, celebraciones y mucha conversación.', pace: 'normal',
    accents: ['us', 'ca', 'au', 'latino', 'ie'], moods: ['happy', 'chatty', 'tired'],
    scenes: ['familia', 'cumple', 'postre', 'dividir', 'sobras', 'llegada', 'recomendar', 'revisar', 'menu_ninos', 'nino_cumple', 'silla_ninos', 'recibo', 'sin_gluten'],
  },
  influencer: {
    es: 'Influencer', blurb: 'Fotos, tragos y comentarios rápidos.', pace: 'fast',
    accents: ['us', 'au', 'uk', 'brazil', 'ph'], moods: ['chatty', 'happy', 'picky'],
    scenes: ['happy_hour', 'cumple', 'vino', 'primera_vez', 'recomendar', 'bebidas', 'compartir', 'brindis', 'brunch', 'cafe_llevar', 'ultima_llamada'],
  },
};
for (const [id, ids] of Object.entries(CLIENTES_NUEVAS)) CLIENTES[id].scenes.push(...ids);
export const CLIENTE_IDS = Object.keys(CLIENTES);

/** «We have X and Y» nombra dos postres: si la carta trae más, cada mesa usa dos al azar. */
const twoOf = (rng, list) => {
  if (list.length <= 2) return list;
  const a = pick(rng, list);
  return [a, pick(rng, list.filter((x) => x !== a))];
};

function context(rng, rest) {
  const m = rest.menu;
  const main = pick(rng, m.mains);
  const desserts = twoOf(rng, m.desserts);
  return {
    rng,
    party: pick(rng, PARTIES),
    family: pick(rng, PARTIES.slice(1)),
    main,
    alt: pick(rng, m.mains.filter((x) => x !== main)),
    drink: pick(rng, m.drinks),
    alcohol: pick(rng, m.alcohol),
    wine: pick(rng, m.wines),
    starter: pick(rng, m.starters),
    side: pick(rng, m.sides),
    temp: pick(rng, m.temps),
    dessert: pick(rng, desserts),
    allergy: pick(rng, m.allergies),
    guestName: pick(rng, GUEST_NAMES),
    desserts,
    veggie: rest.veggie,
  };
}

/** La situación sale del nivel, del local (lo que no encaja allí se descarta) y, si hay tipo de cliente, de lo suyo. */
function chooseScene(rng, level, avoid, only, rest, cliente) {
  if (only) return SCENES.find((s) => s.id === only);
  let open = SCENES.filter((s) => s.level <= level && !rest.exclude.includes(s.id) && !(s.needs && rest.exclude.includes(s.needs)));
  if (!open.length) open = SCENES.filter((s) => s.level <= level);
  if (cliente) {
    const theirs = open.filter((s) => cliente.scenes.includes(s.id));
    if (theirs.length) open = theirs;
  }
  const fresh = open.filter((s) => !avoid.includes(s.id));
  return pick(rng, (fresh.length ? fresh : open).flatMap((s) => Array(Math.max(1, (s.weight ?? 1) * (rest.boost?.[s.id] ?? 1))).fill(s)));
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

/**
 * Arma una mesa. Opciones:
 *  done        mesas de Turno atendidas (de ahí sale el nivel)
 *  level       fuerza un nivel de dificultad 1..4 (Servicio libre)
 *  restaurant  un local de content/restaurantes.js, o uno propio con la misma forma (el menú del dueño)
 *  cliente     id de CLIENTES: condiciona personaje, ánimo, acento, ritmo y situación
 *  scene       fuerza una situación (pruebas)
 */
export function buildMesa(rng = Math.random, { done = 0, level = null, avoidScenes = [], avoidNames = [], scene: only = null, restaurant = null, cliente: clienteId = null } = {}) {
  const info = level ? levelFor(LEVELS[Math.min(Math.max(Math.trunc(level), 1), LEVELS.length) - 1].from) : levelFor(done);
  const rest = restaurant ?? RESTAURANTE_POR_ID.get(RESTAURANTE_BASE);
  const cliente = clienteId ? CLIENTES[clienteId] : null;
  const c = context(rng, { ...rest, veggie: rest.veggie ?? { en: 'soup', es: 'la sopa' } });
  const scene = chooseScene(rng, info.level, avoidScenes, only, rest, cliente);
  const fresh = CAST.filter((p) => !avoidNames.includes(p.name));
  // Si el tipo de cliente no deja a nadie libre (acento y nombres recientes), se relaja primero lo reciente y luego el acento.
  const byAccent = (list) => (cliente ? list.filter((p) => cliente.accents.includes(p.accent)) : list);
  const pool = [byAccent(fresh), byAccent(CAST), fresh, CAST].find((l) => l.length);
  const cast = pick(rng, pool);
  const moodId = pick(rng, cliente ? cliente.moods : Object.keys(MOODS));
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
  const persona = { name: cast.name, voice: cast.voice, azure: cast.azure, accent: cast.accent, accentEs: ACCENTS[cast.accent].es, mood: moodId, moodEs: mood.es };
  if (cliente) Object.assign(persona, { cliente: clienteId, clienteEs: cliente.es, pace: cliente.pace });
  return {
    title: `Mesa de ${cast.name}`,
    scene: scene.id,
    sceneEs: scene.es,
    level: info.level,
    persona,
    party: scene.party?.(c) ?? c.party.size,
    steps,
    closing,
    menuFacts: { drink: c.drink.en, main: c.main.en, side: c.main.side ? c.side.en : null, temp: c.main.temp ? c.temp.en : null, restaurant: rest.id === RESTAURANTE_BASE ? MENU.restaurant : rest.local },
  };
}
