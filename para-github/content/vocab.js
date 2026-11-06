import { CATEGORY_BY_KEY } from './categories.js';
import { applyAudit } from './vocab/audit.js';
import { WELCOME } from './vocab/welcome.js';
import { DRINKS } from './vocab/drinks.js';
import { FOOD } from './vocab/food.js';
import { ORDERING } from './vocab/order.js';
import { SERVICE } from './vocab/service.js';
import { CLOSING } from './vocab/closing.js';

// Catalogo base de expresiones. Campos: id, en, es (significado en contexto),
// phrase (frase de servicio; debe contener `en`), guest (ejemplo de cliente),
// reply (respuesta posible), pron (guia orientativa, sin simbolos fonéticos), alts (variantes aceptadas).
const OLD_CATEGORY = { 1: 'welcome', 2: 'soft', 3: 'menu', 4: 'mods', 5: 'allergy', 6: 'service', 7: 'problems', 8: 'check' };
const OLD_OVERRIDE = {
  right_this_way: 'seating', taking_care: 'seating', inside_outside: 'seating', table_ready: 'seating',
  grilled: 'cooking', fried: 'cooking', roasted: 'cooking', made_with: 'flavors', a_little_spicy: 'flavors',
  side_dish: 'sides', comes_with: 'sides', how_cooked: 'meat', medium_rare: 'meat', well_done: 'meat',
  ready_to_order: 'mods', take_your_time: 'mods', anything_else: 'mods', let_me_confirm: 'mods',
  to_go_box: 'togo', sorry_could_repeat: 'clarify', pay_when_ready: 'check',
  recommend_drink: 'wine', without_alcohol: 'wine', shellfish: 'allergy',
};
const entry = (unit, id, en, es, phrase, guest, reply, pron = '', alts = []) => {
  const cat = CATEGORY_BY_KEY.get(OLD_OVERRIDE[id] ?? OLD_CATEGORY[unit]);
  return { unit, id, en, es, phrase, guest, reply, pron, alts, notes: null, category: cat.name, difficulty: unit <= 3 ? 1 : 2 };
};

const BASE = [
  // Unidad 1: Recibir y acomodar
  entry(1, 'welcome_in', 'Welcome in', 'Bienvenidos (saludo al llegar)', 'Welcome in! How are you doing tonight?', 'Hi, good evening.', 'Good evening, welcome in! How are you doing tonight?', 'uélcom in', ['welcome']),
  entry(1, 'how_many', 'How many in your party?', '¿Cuántas personas son?', 'Good evening! How many in your party?', 'Hi, we would like a table.', 'Of course. How many in your party?', 'jáo méni in yor párti', ['how many people', 'how many guests']),
  entry(1, 'reservation', 'Do you have a reservation?', '¿Tienen reservación?', 'Welcome in. Do you have a reservation?', 'Hi, a table for four, please.', 'Sure. Do you have a reservation?', 'du yu jav a reservéishon', ['do you have a reservation with us']),
  entry(1, 'under_name', 'Under what name?', '¿A nombre de quién?', 'Great, under what name?', 'We have a reservation for eight.', 'Perfect. Under what name?', 'ánder uát néim', ['what name is it under']),
  entry(1, 'wait_time', 'about a 15-minute wait', 'unos 15 minutos de espera', 'Right now there is about a 15-minute wait.', 'How long is the wait?', 'There is about a 15-minute wait. Can I get your name?', 'abáut a fiftín mínit uéit', ['15 minute wait', 'fifteen minute wait']),
  entry(1, 'right_this_way', 'Right this way', 'Por aquí, por favor', 'Your table is ready. Right this way, please.', 'Is our table ready?', 'Yes, it is. Right this way, please.', 'ráit dis uéi', ['this way please', 'follow me']),
  entry(1, 'taking_care', "I'll be taking care of you", 'Yo los voy a atender', "My name is Ana, and I'll be taking care of you tonight.", 'Are you our server?', "Yes, my name is Ana, and I'll be taking care of you tonight.", 'áil bi téiking quer of yu', ['i will be your server', "i'll be your server"]),
  entry(1, 'table_ready', 'Your table is ready', 'Su mesa está lista', 'Thanks for waiting. Your table is ready.', 'Is it our turn yet?', 'Thanks for waiting. Your table is ready.', 'yor téibol is rédi'),
  entry(1, 'inside_outside', 'inside or outside', 'adentro o afuera', 'Would you prefer to sit inside or outside?', 'Can we get a nice table?', 'Of course. Would you prefer to sit inside or outside?', 'insáid or autsáid'),

  // Unidad 2: Bebidas
  entry(2, 'start_drinks', 'Can I start you off with something to drink?', '¿Les traigo algo de tomar para empezar?', 'Can I start you off with something to drink?', 'We are still looking at the menu.', 'No problem. Can I start you off with something to drink?', 'can ai start yu of uíz sámzing tu drink', ['can i get you something to drink', 'can i get you anything to drink', 'would you like something to drink']),
  entry(2, 'still_water', 'still water', 'agua natural, sin gas', 'Would you like still water or sparkling?', 'Can I just have water?', 'Sure. Would you like still water or sparkling?', 'stil uóter', ['regular water', 'tap water']),
  entry(2, 'sparkling_water', 'sparkling water', 'agua con gas', 'We have sparkling water by the bottle.', 'Do you have water with bubbles?', 'Yes, we have sparkling water by the bottle.', 'spárkling uóter'),
  entry(2, 'with_ice', 'with or without ice', 'con o sin hielo', 'Would you like that with or without ice?', 'A Coke, please.', 'Of course. Would you like that with or without ice?', 'uíz or uizáut áis', ['with ice', 'no ice']),
  entry(2, 'refill', 'refill', 'volver a llenar la bebida', 'Can I get you a refill?', 'This iced tea is great.', 'Glad you like it. Can I get you a refill?', 'rífil'),
  entry(2, 'free_refills', 'free refills', 'se rellena sin costo', 'The iced tea comes with free refills.', 'Is the iced tea refillable?', 'Yes, the iced tea comes with free refills.', 'fri rífils', ['refills are free']),
  entry(2, 'recommend_drink', 'I would recommend', 'Yo recomendaría', 'If you like something light, I would recommend the mojito.', 'What is good here?', 'I would recommend the house mojito. It is fresh and light.', 'ai uud recoménd', ["i'd recommend", 'i recommend']),
  entry(2, 'without_alcohol', 'without alcohol', 'sin alcohol', 'We can make it without alcohol.', "I don't drink, do you have anything fun?", 'Yes, we can make the mojito without alcohol.', 'uizáut álcojol', ['non-alcoholic', 'alcohol free']),
  entry(2, 'bring_drinks', "I'll bring those right out", 'Se los traigo enseguida', "Great choices. I'll bring those right out.", 'Two iced teas, please.', "Great choice. I'll bring those right out.", 'áil bring dóus ráit áut', ["i'll be right back with those", 'i will bring those']),

  // Unidad 3: Explicar el menu
  entry(3, 'comes_with', 'comes with', 'viene con / incluye', 'The ribeye comes with one side.', 'Does the steak include anything?', 'Yes, the ribeye comes with one side of your choice.', 'cams uíz', ['it includes', 'includes']),
  entry(3, 'side_dish', 'side dish', 'acompañamiento', 'Your side dish can be fries, asparagus or mashed potatoes.', 'What sides do you have?', 'Your side dish can be fries, asparagus or mashed potatoes.', 'sáid dish', ['side']),
  entry(3, 'made_with', 'made with', 'hecho con', 'The sauce is made with lemon and capers.', "What's in the sauce?", 'It is made with lemon and capers.', 'méid uíz'),
  entry(3, 'grilled', 'grilled', 'a la parrilla', 'The snapper is grilled with olive oil.', 'How is the fish cooked?', 'It is grilled with olive oil and lemon.', 'grild'),
  entry(3, 'fried', 'fried', 'frito', 'The calamari is fried and comes with a spicy sauce.', 'Is the calamari baked?', 'No, it is fried, and it comes with a spicy sauce.', 'fráid', ['deep fried']),
  entry(3, 'roasted', 'roasted', 'asado al horno', 'The chicken is roasted with garlic and rosemary.', 'How is the chicken prepared?', 'It is roasted with garlic and rosemary.', 'róusted'),
  entry(3, 'a_little_spicy', 'a little spicy', 'un poco picante', 'The tomato sauce is a little spicy.', 'Is that sauce hot?', 'It is a little spicy, but I can bring it on the side.', 'a lírol spáisi', ['slightly spicy', 'mildly spicy']),
  entry(3, 'our_special', "tonight's special", 'el especial de esta noche', "Let me tell you about tonight's special.", 'Do you have any specials?', "Yes, let me tell you about tonight's special.", 'tunáits spéshal', ['the special']),
  entry(3, 'popular', 'very popular', 'muy pedido', 'The Harbor Burger is very popular.', 'What do people usually order?', 'The Harbor Burger is very popular, and so is the snapper.', 'véri pópiular', ['most popular', 'a favorite']),

  // Unidad 4: Tomar la orden
  entry(4, 'ready_to_order', 'Are you ready to order?', '¿Ya están listos para ordenar?', 'Are you ready to order? Or do you need a few minutes?', 'Okay, I think we decided.', 'Great. Are you ready to order?', 'ar yu rédi tu órder', ['what would you like to order', 'can i take your order', 'may i take your order', 'what can i get for you']),
  entry(4, 'take_your_time', 'take your time', 'tómense su tiempo', 'No rush at all, take your time.', 'We need a couple more minutes.', "No problem, take your time. I'll be back in a few minutes.", 'téik yor táim', ['no rush']),
  entry(4, 'how_cooked', 'How would you like that cooked?', '¿Qué término le gustaría?', 'The ribeye, great choice. How would you like that cooked?', "I'll have the ribeye.", 'Great choice. How would you like that cooked?', 'jáo uud yu láik dat cukt', ['how would you like it cooked', 'how would you like your steak']),
  entry(4, 'medium_rare', 'medium rare', 'término medio-rojo (centro rosado y caliente)', 'I have one ribeye, medium rare.', "How's the center if I get it medium rare?", 'Medium rare has a warm, pink center.', 'mídium rer'),
  entry(4, 'well_done', 'well done', 'bien cocido', 'The chef can prepare it well done, but it takes a little longer.', "I don't want any pink at all.", 'Then I suggest well done. It takes a little longer.', 'uel dan'),
  entry(4, 'dressing_side', 'dressing on the side', 'el aderezo aparte', 'One Caesar salad with dressing on the side.', 'Can I have the Caesar with dressing apart?', 'Of course, one Caesar with dressing on the side.', 'drésing on de sáid', ['dressing on side']),
  entry(4, 'substitute', 'substitute', 'cambiar un ingrediente por otro', 'We can substitute chicken for the shrimp.', "I don't eat shrimp. Can you change it?", 'Yes, we can substitute chicken for the shrimp.', 'sábstitut', ['swap', 'replace']),
  entry(4, 'let_me_confirm', 'Let me confirm your order', 'Déjeme confirmar su orden', 'Let me confirm your order: one ribeye, medium rare, and one snapper.', "That's all for us.", 'Thank you. Let me confirm your order: one ribeye, medium rare, and one snapper.', 'let mi confírm yor órder', ['let me repeat your order', 'let me read that back', 'to confirm']),
  entry(4, 'anything_else', 'Anything else?', '¿Algo más?', 'Anything else? I can bring more water.', "That's the salad for me.", 'Perfect. Anything else I can get for you?', 'énizing els', ['anything else i can get you', 'will that be all', 'is there anything else']),

  // Unidad 5: Alergias y restricciones
  entry(5, 'any_allergies', 'Does anyone have any allergies?', '¿Alguien tiene alguna alergia?', 'Before I put this in, does anyone have any allergies?', 'I have to be careful with some foods.', 'Thank you for telling me. Does anyone have any allergies?', 'das éniuan jav éni álerchis', ['any allergies', 'do you have any allergies', 'allergies i should know']),
  entry(5, 'let_me_double_check', 'let me double-check', 'déjeme confirmarlo bien', 'I am not sure, so let me double-check with the kitchen.', 'Is there dairy in this?', 'I want to be sure, so let me double-check with the kitchen.', 'let mi dábol chek', ['let me check', 'double check', 'let me ask']),
  entry(5, 'check_kitchen', 'check with the kitchen', 'consultar con la cocina', 'I will check with the kitchen and come right back.', 'Is the fryer shared?', "I don't want to guess. I will check with the kitchen and come right back.", 'chek uíz de kíchen', ['ask the kitchen', 'ask the chef', 'talk to the kitchen', 'check with the chef']),
  entry(5, 'tree_nuts', 'tree nuts', 'frutos secos (nueces, almendras...)', 'I will tell the kitchen about your tree nuts allergy.', "I'm allergic to almonds and walnuts.", 'Thank you. I will tell the kitchen about your tree nuts allergy.', 'tri nats', ['nuts', 'nut allergy']),
  entry(5, 'shellfish', 'shellfish', 'mariscos', 'The linguine contains shellfish.', 'Does the pasta have seafood?', 'Yes, the linguine contains shellfish.', 'shélfish', ['shrimp']),
  entry(5, 'gluten_free', 'gluten-free', 'sin gluten', 'Let me ask if we can prepare it gluten-free.', 'Do you have gluten-free options?', 'Let me ask the kitchen what we can prepare gluten-free.', 'glúten fri', ['gluten free', 'without gluten']),
  entry(5, 'dairy', 'dairy', 'lácteos', 'The ribeye has butter, so it contains dairy.', "I can't have milk or butter.", 'Thanks for telling me. The ribeye contains dairy, so let me check with the kitchen.', 'déri', ['milk', 'lactose']),
  entry(5, 'cross_contact', 'shared fryer', 'freidora compartida (riesgo de contacto)', 'The fries come from a shared fryer.', 'Can I have the fries with my allergy?', 'The fries come from a shared fryer. I will check with the kitchen.', 'sherd fráier', ['same fryer', 'cross contact', 'cross-contact']),
  entry(5, 'cant_guarantee', "I can't guarantee", 'No puedo garantizar', "I can't guarantee that, so I will ask the kitchen.", 'So this is 100% safe for me, right?', "I can't guarantee that myself, so I will ask the chef and come back to you.", 'ai kant garantí', ['i cannot guarantee', "i don't want to promise"]),

  // Unidad 6: Durante el servicio
  entry(6, 'how_is_everything', 'How is everything?', '¿Cómo está todo?', 'Hi again. How is everything? Can I help with anything?', 'Excuse me.', 'Yes, of course. How is everything so far?', 'jáo is évrizing', ['how is everything tasting', 'how does everything taste', 'how is your meal', 'is everything okay']),
  entry(6, 'right_back', "I'll be right back", 'Ya regreso / Vuelvo enseguida', "Let me get that for you. I'll be right back.", 'Could we get more napkins?', "Of course. I'll be right back with those.", 'áil bi ráit bak', ['i will be right back', 'be right back']),
  entry(6, 'anything_i_can_bring', 'Can I bring you anything else?', '¿Les traigo algo más?', 'While I am here, can I bring you anything else?', 'Everything is great, thanks.', 'Glad to hear it. Can I bring you anything else?', 'can ai bring yu énizing els', ['can i get you anything else', 'anything else i can bring']),
  entry(6, 'clear_this', 'May I clear this for you?', '¿Puedo retirar esto?', 'Are you finished? May I clear this for you?', "We're all done with these plates.", 'Thank you. May I clear this for you?', 'méi ai clir dis for yu', ['can i take this', 'can i clear', 'may i take']),
  entry(6, 'still_working', 'still working on', 'todavía están comiendo', 'Are you still working on that?', 'It was very good, but so much food.', 'Glad you liked it. Are you still working on that, or may I clear it?', 'stil uérking on', ['are you still enjoying', 'still enjoying']),
  entry(6, 'to_go_box', 'to-go box', 'caja para llevar', 'Would you like a to-go box for that?', "I can't finish this.", 'No problem. Would you like a to-go box?', 'tu góu box', ['box for that', 'to go box', 'take it to go']),
  entry(6, 'dessert_room', 'room for dessert', 'espacio para el postre', 'Did you save room for dessert?', "That was delicious. We're almost done.", 'I am glad you enjoyed it. Did you save room for dessert?', 'rum for disért', ['dessert menu', 'any dessert']),
  entry(6, 'more_bread', 'I can bring you some more', 'Le puedo traer un poco más', 'I can bring you some more bread if you like.', 'This bread is really good.', 'Thank you! I can bring you some more if you like.', 'ai can bring yu sam mor'),
  entry(6, 'sorry_could_repeat', 'Could you say that again, please?', '¿Podría repetirlo, por favor?', 'I am sorry, could you say that again, please?', '[El cliente habla muy rápido] I-need-the-thing-with-no-onions.', 'I am sorry, could you say that again, please?', 'cud yu séi dat aguén plis', ['could you repeat that', 'can you repeat that', 'sorry could you repeat', 'one more time please']),

  // Unidad 7: Resolver problemas
  entry(7, 'im_so_sorry', "I'm so sorry about that", 'Lo siento mucho', "I'm so sorry about that. Let me fix it right away.", 'This is not what I ordered.', "I'm so sorry about that. Let me fix it right away.", 'áim sóu sóri abáut dat', ['i am sorry about that', 'i apologize', 'my apologies', "i'm very sorry", 'i am so sorry']),
  entry(7, 'taking_longer', 'taking longer than usual', 'está tardando más de lo normal', 'Your food is taking longer than usual. Let me check on it.', 'We ordered 40 minutes ago.', 'I understand. It is taking longer than usual. Let me check on it.', 'téiking lónguer dan yúshual', ['taking a little longer', 'taking longer']),
  entry(7, 'check_on_it', 'let me check on it', 'déjeme revisar cómo va', 'I will let you know in a minute; let me check on it.', "Where's our food?", "I'm sorry for the wait. Let me check on it and come right back.", 'let mi chek on it', ['let me check on that', 'let me check on your order']),
  entry(7, 'what_happened', 'Could you tell me what happened?', '¿Me podría contar qué pasó?', 'I want to get this right. Could you tell me what happened?', 'This is wrong.', 'I am sorry. Could you tell me what happened?', 'cud yu tel mi uát jápend', ['what happened', 'what seems to be the problem', 'what is wrong with it']),
  entry(7, 'wrong_temp', 'you ordered it', 'usted lo pidió', 'You ordered it medium rare, and this one is well done, correct?', 'I asked for medium rare, this is well done.', 'You ordered it medium rare, and this one is well done, correct? Let me fix that.', 'yu órdered it', ['you asked for', 'you ordered', 'you wanted']),
  entry(7, 'remake', 'have the kitchen remake it', 'pedir a la cocina que lo vuelva a hacer', 'I can have the kitchen remake it right away.', 'What can you do about it?', 'I can have the kitchen remake it right away.', 'jav de kíchen riméik it', ['remake it', 'make a new one', 'prepare a new one', 'have the kitchen make', 'fix it']),
  entry(7, 'get_manager', 'get my manager', 'llamar a mi gerente', 'I would like to get my manager so we can help you.', 'I want this taken off my bill.', "I can't approve that myself, but I'll get my manager right away.", 'guet mái mánayer', ['talk to my manager', 'ask my manager', 'speak with my manager', 'manager']),
  entry(7, 'thanks_patience', 'Thank you for your patience', 'Gracias por su paciencia', 'Thank you for your patience. Here is your new plate.', 'Finally, here it is.', 'Thank you for your patience. Here is your new plate.', 'zank yu for yor péishens', ['thanks for your patience', 'thanks for waiting', 'thank you for waiting']),
  entry(7, 'cold_food', 'heat that up', 'calentar eso', 'I can ask the kitchen to heat that up or prepare a new one.', 'My soup is cold.', "I'm so sorry. I can ask the kitchen to heat that up or prepare a new one.", 'jit dat ap', ['warm it up', 'heat it up']),

  // Unidad 8: Cerrar la mesa
  entry(8, 'bring_check', 'I can bring the check', 'Les puedo traer la cuenta', 'Whenever you are ready, I can bring the check.', "I think we're done here.", 'Thank you. Whenever you are ready, I can bring the check.', 'ai can bring de chek', ['bring you the check', "i'll bring the check", 'here is the check', 'bring the bill']),
  entry(8, 'split_check', 'split the check', 'dividir la cuenta', 'Would you like me to split the check?', 'Can we pay separately?', 'Of course. Would you like me to split the check?', 'split de chek', ['separate checks', 'split it', 'split the bill']),
  entry(8, 'how_split', 'How would you like to split it?', '¿Cómo la quieren dividir?', 'No problem. How would you like to split it?', 'Please split the check.', 'No problem. How would you like to split it?', 'jáo uud yu láik tu split it', ['evenly or by item', 'how should i split']),
  entry(8, 'evenly', 'evenly', 'en partes iguales', 'I can split it evenly or by item.', 'Half and half, please.', 'Sure, I will split it evenly.', 'ívenli', ['in half', 'equally']),
  entry(8, 'card_or_cash', 'card or cash', 'tarjeta o efectivo', 'Will that be card or cash today?', "I'm ready to pay.", 'Thank you. Will that be card or cash today?', 'card or cash', ['cash or card']),
  entry(8, 'receipt', 'your receipt', 'su recibo', 'Here is your card and your receipt.', 'Are we all set?', 'Yes, here is your card and your receipt.', 'yor risít', ['the receipt', 'a receipt']),
  entry(8, 'pay_when_ready', 'no rush', 'sin prisa', 'I will leave this here, no rush at all.', 'I need a moment to find my card.', 'Of course, no rush at all.', 'nóu rash', ['take your time', 'whenever you are ready']),
  entry(8, 'thanks_coming', 'Thank you for coming in', 'Gracias por venir', 'Thank you for coming in. Have a great night!', 'Thanks, everything was great.', 'Thank you for coming in. Have a great night!', 'zank yu for cáming in', ['thanks for coming in', 'thank you for dining with us', 'thanks for coming']),
  entry(8, 'see_you_again', 'Hope to see you again soon', 'Esperamos verlos pronto', 'Hope to see you again soon. Have a good night!', 'Goodbye, thank you!', 'My pleasure. Hope to see you again soon!', 'jóup tu si yu aguén sun', ['see you next time', 'come back soon', 'see you soon']),
];

// Fuente unica del catalogo: Palabras, fichas, busqueda, lecciones y evaluador leen de aqui.
export const VOCAB = applyAudit([...BASE, ...WELCOME, ...DRINKS, ...FOOD, ...ORDERING, ...SERVICE, ...CLOSING]);
export const VOCAB_BY_ID = new Map(VOCAB.map((v) => [v.id, v]));
