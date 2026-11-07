// Frases cotidianas de servicio para principiantes, explicadas palabra por palabra.
// Cada frase: en, es y words: pares [ingles, español] que, juntos y en orden, forman la frase.
import { FRASES_MAS } from './frases-mas.js';
import { FRASES_NUEVAS } from './frases-nuevas.js';

const TOPIC_LIST = [
  { id: 'recibir', title: 'Recibir' },
  { id: 'espera', title: 'Espera y reservas' },
  { id: 'bebidas', title: 'Bebidas' },
  { id: 'menu', title: 'Menú' },
  { id: 'orden', title: 'Tomar la orden' },
  { id: 'platos', title: 'Explicar platos' },
  { id: 'carne', title: 'La carne' },
  { id: 'servicio', title: 'Durante la cena' },
  { id: 'vinos', title: 'Vinos y cócteles' },
  { id: 'alergias', title: 'Alergias' },
  { id: 'postre', title: 'Postre y café' },
  { id: 'problemas', title: 'Problemas' },
  { id: 'cuenta', title: 'La cuenta' },
  { id: 'despedida', title: 'Despedida' },
  { id: 'llevar', title: 'Para llevar' },
  { id: 'familias', title: 'Familias' },
  { id: 'charla', title: 'Charla' },
  { id: 'equipo', title: 'Con compañeros' },
];

const f = (topic, id, en, es, ...words) => ({ id, topic, en, es, words });

const BASE = [
  // Recibir
  f('recibir', 'welcome_in', 'Welcome in!', '¡Bienvenidos!', ['Welcome', 'bienvenidos'], ['in', 'adentro']),
  f('recibir', 'good_evening', 'Good evening.', 'Buenas noches.', ['Good', 'buena'], ['evening', 'noche (al llegar)']),
  f('recibir', 'how_are_you', 'How are you tonight?', '¿Cómo están esta noche?', ['How', 'cómo'], ['are', 'están'], ['you', 'ustedes'], ['tonight', 'esta noche']),
  f('recibir', 'how_many', 'How many people?', '¿Cuántas personas?', ['How many', 'cuántas'], ['people', 'personas']),
  f('recibir', 'reservation', 'Do you have a reservation?', '¿Tienen reservación?', ['Do you have', '¿tienen?'], ['a', 'una'], ['reservation', 'reservación']),
  f('recibir', 'what_name', 'Under what name?', '¿A nombre de quién?', ['Under', 'bajo'], ['what', 'qué'], ['name', 'nombre']),
  f('recibir', 'this_way', 'Right this way, please.', 'Por aquí, por favor.', ['Right', 'justo'], ['this way', 'por aquí'], ['please', 'por favor']),
  f('recibir', 'your_server', "I'll be your server tonight.", 'Yo los atiendo esta noche.', ["I'll be", 'yo seré'], ['your', 'su'], ['server', 'mesero'], ['tonight', 'esta noche']),
  f('recibir', 'have_a_seat', 'Please have a seat.', 'Siéntense, por favor.', ['Please', 'por favor'], ['have a seat', 'tomen asiento']),

  // Bebidas
  f('bebidas', 'something_drink', 'Can I get you something to drink?', '¿Les traigo algo de tomar?', ['Can I', '¿puedo?'], ['get you', 'traerles'], ['something', 'algo'], ['to drink', 'de tomar']),
  f('bebidas', 'still_sparkling', 'Still or sparkling water?', '¿Agua sin gas o con gas?', ['Still', 'sin gas'], ['or', 'o'], ['sparkling', 'con gas'], ['water', 'agua']),
  f('bebidas', 'with_ice', 'With ice or no ice?', '¿Con hielo o sin hielo?', ['With', 'con'], ['ice', 'hielo'], ['or', 'o'], ['no', 'sin'], ['ice', 'hielo']),
  f('bebidas', 'refill', 'Would you like a refill?', '¿Le sirvo más?', ['Would you like', '¿le gustaría?'], ['a', 'un'], ['refill', 'relleno de bebida']),
  f('bebidas', 'iced_tea', 'We have iced tea.', 'Tenemos té helado.', ['We have', 'tenemos'], ['iced', 'helado'], ['tea', 'té']),
  f('bebidas', 'drinks_away', "I'll bring your drinks right away.", 'Les traigo sus bebidas enseguida.', ["I'll bring", 'yo traigo'], ['your', 'sus'], ['drinks', 'bebidas'], ['right away', 'enseguida']),
  f('bebidas', 'here_water', 'Here is your water.', 'Aquí está su agua.', ['Here is', 'aquí está'], ['your', 'su'], ['water', 'agua']),
  f('bebidas', 'wine_list', 'Would you like the wine list?', '¿Quieren la carta de vinos?', ['Would you like', '¿le gustaría?'], ['the', 'la'], ['wine list', 'carta de vinos']),
  f('bebidas', 'no_alcohol', 'We can make it without alcohol.', 'Lo podemos hacer sin alcohol.', ['We can', 'podemos'], ['make it', 'hacerlo'], ['without', 'sin'], ['alcohol', 'alcohol']),

  // Menu
  f('menu', 'here_menu', 'Here is the menu.', 'Aquí está el menú.', ['Here is', 'aquí está'], ['the', 'el'], ['menu', 'menú']),
  f('menu', 'ready_order', 'Are you ready to order?', '¿Están listos para ordenar?', ['Are you', '¿están?'], ['ready', 'listos'], ['to order', 'para ordenar']),
  f('menu', 'few_minutes', 'Do you need a few more minutes?', '¿Necesitan unos minutos más?', ['Do you need', '¿necesitan?'], ['a few', 'unos'], ['more', 'más'], ['minutes', 'minutos']),
  f('menu', 'take_time', 'Take your time.', 'Tómense su tiempo.', ['Take', 'tomen'], ['your', 'su'], ['time', 'tiempo']),
  f('menu', 'comes_side', 'It comes with one side.', 'Viene con un acompañamiento.', ['It comes', 'viene'], ['with', 'con'], ['one', 'un'], ['side', 'acompañamiento']),
  f('menu', 'fries_salad', 'It comes with fries or salad.', 'Viene con papas o ensalada.', ['It comes', 'viene'], ['with', 'con'], ['fries', 'papas fritas'], ['or', 'o'], ['salad', 'ensalada']),
  f('menu', 'grilled', 'The fish is grilled.', 'El pescado es a la parrilla.', ['The', 'el'], ['fish', 'pescado'], ['is', 'es'], ['grilled', 'a la parrilla']),
  f('menu', 'recommend', 'I recommend the ribeye.', 'Le recomiendo el ribeye.', ['I recommend', 'yo recomiendo'], ['the', 'el'], ['ribeye', 'corte de res']),
  f('menu', 'very_popular', 'This dish is very popular.', 'Este plato es muy popular.', ['This', 'este'], ['dish', 'plato'], ['is', 'es'], ['very', 'muy'], ['popular', 'popular']),

  // Orden
  f('orden', 'what_like', 'What would you like?', '¿Qué les gustaría?', ['What', 'qué'], ['would you like', 'les gustaría']),
  f('orden', 'how_cooked', 'How would you like it cooked?', '¿Cómo le gustaría la carne?', ['How', 'cómo'], ['would you like', 'le gustaría'], ['it', 'la'], ['cooked', 'cocida']),
  f('orden', 'medium_rare', 'Medium rare, got it.', 'Término medio, entendido.', ['Medium rare', 'término medio'], ['got it', 'entendido']),
  f('orden', 'which_side', 'Would you like fries or salad?', '¿Quiere papas o ensalada?', ['Would you like', '¿le gustaría?'], ['fries', 'papas fritas'], ['or', 'o'], ['salad', 'ensalada']),
  f('orden', 'dressing_side', 'Dressing on the side?', '¿El aderezo aparte?', ['Dressing', 'aderezo'], ['on the side', 'aparte']),
  f('orden', 'no_onions', 'No onions, got it.', 'Sin cebolla, entendido.', ['No', 'sin'], ['onions', 'cebollas'], ['got it', 'entendido']),
  f('orden', 'anything_else', 'Anything else?', '¿Algo más?', ['Anything', 'algo'], ['else', 'más']),
  f('orden', 'let_confirm', 'Let me confirm your order.', 'Déjeme confirmar su orden.', ['Let me', 'déjeme'], ['confirm', 'confirmar'], ['your', 'su'], ['order', 'orden']),
  f('orden', 'great_choice', 'Great choice!', '¡Excelente elección!', ['Great', 'excelente'], ['choice', 'elección']),

  // Alergias
  f('alergias', 'any_allergies', 'Do you have any allergies?', '¿Tienen alguna alergia?', ['Do you have', '¿tienen?'], ['any', 'alguna'], ['allergies', 'alergias']),
  f('alergias', 'thanks_telling', 'Thank you for telling me.', 'Gracias por decírmelo.', ['Thank you', 'gracias'], ['for', 'por'], ['telling me', 'decirme']),
  f('alergias', 'check_kitchen', 'Let me check with the kitchen.', 'Déjeme consultar con la cocina.', ['Let me', 'déjeme'], ['check', 'consultar'], ['with', 'con'], ['the', 'la'], ['kitchen', 'cocina']),
  f('alergias', 'ask_chef', 'I will ask the chef.', 'Le voy a preguntar al chef.', ['I will', 'yo voy a'], ['ask', 'preguntar'], ['the', 'al'], ['chef', 'chef']),
  f('alergias', 'dont_guess', "I don't want to guess.", 'No quiero adivinar.', ["I don't want", 'no quiero'], ['to guess', 'adivinar']),
  f('alergias', 'come_back', 'I will come right back.', 'Regreso enseguida.', ['I will', 'yo voy a'], ['come', 'venir'], ['right', 'enseguida'], ['back', 'de regreso']),
  f('alergias', 'contains_dairy', 'It contains dairy.', 'Contiene lácteos.', ['It contains', 'contiene'], ['dairy', 'lácteos']),
  f('alergias', 'one_moment', 'One moment, please.', 'Un momento, por favor.', ['One', 'un'], ['moment', 'momento'], ['please', 'por favor']),

  // Servicio
  f('servicio', 'how_everything', 'How is everything?', '¿Cómo va todo?', ['How', 'cómo'], ['is', 'va'], ['everything', 'todo']),
  f('servicio', 'get_anything', 'Can I get you anything else?', '¿Les traigo algo más?', ['Can I', '¿puedo?'], ['get you', 'traerles'], ['anything', 'algo'], ['else', 'más']),
  f('servicio', 'right_back', "I'll be right back.", 'Ya regreso.', ["I'll be", 'yo estaré'], ['right', 'enseguida'], ['back', 'de regreso']),
  f('servicio', 'here_you_go', 'Here you go.', 'Aquí tiene.', ['Here', 'aquí'], ['you go', 'tiene']),
  f('servicio', 'enjoy_meal', 'Enjoy your meal.', 'Buen provecho.', ['Enjoy', 'disfrute'], ['your', 'su'], ['meal', 'comida']),
  f('servicio', 'plate_hot', 'Be careful, the plate is hot.', 'Cuidado, el plato está caliente.', ['Be careful', 'cuidado'], ['the', 'el'], ['plate', 'plato'], ['is', 'está'], ['hot', 'caliente']),
  f('servicio', 'take_that', 'Let me take that for you.', 'Déjeme llevarme eso.', ['Let me', 'déjeme'], ['take', 'llevar'], ['that', 'eso'], ['for you', 'por usted']),
  f('servicio', 'dessert', 'Would you like dessert?', '¿Quieren postre?', ['Would you like', '¿le gustaría?'], ['dessert', 'postre']),
  f('servicio', 'to_go_box', 'Would you like a to-go box?', '¿Quieren una caja para llevar?', ['Would you like', '¿le gustaría?'], ['a', 'una'], ['to-go', 'para llevar'], ['box', 'caja']),

  // Problemas
  f('problemas', 'so_sorry', "I'm so sorry about that.", 'Lo siento mucho.', ["I'm", 'estoy'], ['so', 'muy'], ['sorry', 'apenado'], ['about that', 'por eso']),
  f('problemas', 'patience', 'Thank you for your patience.', 'Gracias por su paciencia.', ['Thank you', 'gracias'], ['for', 'por'], ['your', 'su'], ['patience', 'paciencia']),
  f('problemas', 'fix_that', 'Let me fix that for you.', 'Déjeme arreglarlo.', ['Let me', 'déjeme'], ['fix', 'arreglar'], ['that', 'eso'], ['for you', 'para usted']),
  f('problemas', 'talk_manager', 'I will talk to my manager.', 'Voy a hablar con mi gerente.', ['I will', 'yo voy a'], ['talk', 'hablar'], ['to', 'con'], ['my', 'mi'], ['manager', 'gerente']),
  f('problemas', 'what_happened', 'What happened?', '¿Qué pasó?', ['What', 'qué'], ['happened', 'pasó']),
  f('problemas', 'new_one', "I'll bring you a new one.", 'Le traigo uno nuevo.', ["I'll bring", 'yo traigo'], ['you', 'le'], ['a new', 'un nuevo'], ['one', 'uno']),
  f('problemas', 'repeat_that', 'Sorry, could you repeat that?', 'Perdón, ¿puede repetir?', ['Sorry', 'perdón'], ['could you', '¿podría?'], ['repeat', 'repetir'], ['that', 'eso']),
  f('problemas', 'more_slowly', 'Could you say that more slowly?', '¿Puede decirlo más despacio?', ['Could you', '¿podría?'], ['say', 'decir'], ['that', 'eso'], ['more', 'más'], ['slowly', 'despacio']),
  f('problemas', 'not_understand', "I'm sorry, I don't understand.", 'Perdón, no entiendo.', ["I'm sorry", 'perdón'], ["I don't", 'yo no'], ['understand', 'entiendo']),

  // Cuenta
  f('cuenta', 'ready_check', 'Are you ready for the check?', '¿Les traigo la cuenta?', ['Are you', '¿están?'], ['ready', 'listos'], ['for', 'para'], ['the', 'la'], ['check', 'cuenta']),
  f('cuenta', 'here_check', 'Here is your check.', 'Aquí está su cuenta.', ['Here is', 'aquí está'], ['your', 'su'], ['check', 'cuenta']),
  f('cuenta', 'split_check', 'Would you like to split the check?', '¿Quieren dividir la cuenta?', ['Would you like', '¿le gustaría?'], ['to split', 'dividir'], ['the', 'la'], ['check', 'cuenta']),
  f('cuenta', 'cash_card', 'Cash or card?', '¿Efectivo o tarjeta?', ['Cash', 'efectivo'], ['or', 'o'], ['card', 'tarjeta']),
  f('cuenta', 'back_card', "I'll be right back with your card.", 'Regreso enseguida con su tarjeta.', ["I'll be", 'yo estaré'], ['right', 'enseguida'], ['back', 'de regreso'], ['with', 'con'], ['your', 'su'], ['card', 'tarjeta']),
  f('cuenta', 'here_receipt', 'Here is your receipt.', 'Aquí está su recibo.', ['Here is', 'aquí está'], ['your', 'su'], ['receipt', 'recibo']),
  f('cuenta', 'thanks_coming', 'Thank you for coming.', 'Gracias por venir.', ['Thank you', 'gracias'], ['for', 'por'], ['coming', 'venir']),
  f('cuenta', 'great_night', 'Have a great night!', '¡Que tengan linda noche!', ['Have', 'tengan'], ['a', 'una'], ['great', 'excelente'], ['night', 'noche']),
  f('cuenta', 'see_you', 'See you soon!', '¡Hasta pronto!', ['See you', 'nos vemos'], ['soon', 'pronto']),
];

// Las frases salen en orden de temas, de lo más cotidiano a lo más específico.
const topicOrder = new Map(TOPIC_LIST.map((t, i) => [t.id, i]));
export const FRASES = [...BASE, ...FRASES_MAS, ...FRASES_NUEVAS].sort((a, b) => topicOrder.get(a.topic) - topicOrder.get(b.topic));
export const FRASE_BY_ID = new Map(FRASES.map((x) => [x.id, x]));
export const TOPICS = TOPIC_LIST;
export const PACK_SIZE = 4;
