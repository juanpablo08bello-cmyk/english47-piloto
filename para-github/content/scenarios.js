// Ocho simulaciones. `guestFacts` y `surprises` alimentan al cliente IA;
// `criteria` al evaluador; `beats` son el guion de ejemplo del modo demo.
// En cada beat: guest (variantes), goal, hint, accept (basta con una lista cuyas palabras
// aparezcan todas), model y alt (respuestas de referencia), options (ejemplos para la demo).
import { SCENARIO_VARIANTS } from './scenarios-extra.js';

const criterion = (id, es, task = null) => ({ id, es, task });

const BASE_SCENARIOS = [
  {
    id: 'table_for_two', unit: 1, title: 'A table for two', titleEs: 'Una mesa para dos', difficulty: 1,
    objective: 'Recibir a una pareja, confirmar su reservación y llevarlos a la mesa.',
    menu: [],
    guestFacts: 'You are Dana, with your husband. You booked a table for two at 7:30 under "Miller". You prefer outside if possible. It is your first visit.',
    surprises: ['You arrived ten minutes early.', 'You ask whether the terrace is available.'],
    closing: 'The server has confirmed the reservation and walked you to a table.',
    criteria: [criterion('greet', 'Saludó con amabilidad'), criterion('reservation', 'Preguntó por la reservación y el nombre'), criterion('seat', 'Llevó a la mesa y se presentó')],
    beats: [
      { guest: ['Hi, good evening. We have a table for two.', 'Good evening! We booked a table for two tonight.'], goal: 'Saluda y pregunta el nombre de la reservación.', hint: 'Welcome in! Under what name?', accept: [['name'], ['reservation']], model: 'Good evening, welcome in! Under what name is the reservation?', alt: 'Welcome in! Do you have the name for the reservation?', criterion: 'reservation', vocab: ['welcome_in', 'under_name'], options: ['Good evening, welcome in! Under what name?', 'Hello. Name?'] },
      { guest: ['It is under Miller. Is there a table outside?', 'Miller, for seven thirty. Could we sit outside?'], goal: 'Responde y ofrece llevarlos a la mesa.', hint: 'Yes, we do. Right this way, please.', accept: [['this way'], ['follow me'], ['outside'], ['terrace']], model: 'Yes, we have a table outside for you. Right this way, please.', alt: 'Of course, Mrs. Miller. Please follow me to the terrace.', criterion: 'seat', vocab: ['right_this_way', 'inside_outside'], options: ['Yes, we have a table outside. Right this way, please.', 'Yes. Come.'] },
      { guest: ['This is lovely, thank you! Are you our server tonight?', 'What a nice spot, thanks. Will you be helping us?'], goal: 'Preséntate como su mesero.', hint: "Yes, my name is ... and I'll be taking care of you tonight.", accept: [['my name'], ['taking care'], ['your server'], ["i'm", 'server']], model: "Yes, my name is Ana, and I'll be taking care of you tonight.", alt: "I'm Ana, your server. It's my pleasure to help you tonight.", criterion: 'greet', vocab: ['taking_care'], options: ["Yes, my name is Ana, and I'll be taking care of you tonight.", 'Yes, me.'] },
    ],
    closingLine: 'Wonderful, thank you so much!',
  },
  {
    id: 'drinks_first', unit: 2, title: 'Drinks first', titleEs: 'Primero las bebidas', difficulty: 1,
    objective: 'Ofrecer agua y bebidas, aclarar opciones y hacer una recomendación.',
    menu: ['still', 'sparkling', 'iced_tea', 'mojito'],
    guestFacts: 'You are Marcus. You are thirsty and want water, plus something fun but you are not sure what. You do not drink much alcohol.',
    surprises: ['You ask for a recommendation.', 'You ask if refills are free on the iced tea.'],
    closing: 'The server has confirmed your drinks.',
    criteria: [criterion('offer', 'Ofreció bebidas con cortesía'), criterion('water', 'Aclaró qué tipo de agua'), criterion('recommend', 'Recomendó algo del menú', 'explain_dish')],
    beats: [
      { guest: ['Hi there. We just sat down.', 'Hello! Sorry, I have not looked at anything yet.'], goal: 'Saluda y ofrece algo de tomar.', hint: 'Can I start you off with something to drink?', accept: [['drink']], model: 'Welcome in! Can I start you off with something to drink?', alt: 'Good evening. Can I get you something to drink while you look at the menu?', criterion: 'offer', vocab: ['start_drinks'], options: ['Welcome in! Can I start you off with something to drink?', 'You want drink?'] },
      { guest: ['Water, please.', 'I would love some water.'], goal: 'Aclara si la quiere natural o con gas.', hint: 'Would you like still water or sparkling?', accept: [['still'], ['sparkling']], model: 'Of course. Would you like still water or sparkling?', alt: 'Sure. Still or sparkling water for you?', criterion: 'water', vocab: ['still_water', 'sparkling_water'], options: ['Of course. Would you like still water or sparkling?', 'Water with gas or no gas?'] },
      { guest: ['Still is fine. And what would you recommend that is fun, but not too strong?', 'Still, thanks. Do you have anything fun without much alcohol?'], goal: 'Recomienda algo del menú: el mojito se puede hacer sin alcohol.', hint: 'I would recommend the mojito. We can make it without alcohol.', accept: [['mojito'], ['recommend'], ['iced tea']], model: 'I would recommend the house mojito. We can make it without alcohol.', alt: 'Our iced tea is refreshing, and the mojito can be made without alcohol.', criterion: 'recommend', vocab: ['recommend_drink', 'without_alcohol'], options: ['I would recommend the mojito. We can make it without alcohol.', 'Mojito is good.'] },
      { guest: ['Perfect, I will have that without alcohol.', 'That sounds great, let us do that, no alcohol.'], goal: 'Confirma y di que lo traes.', hint: "One mojito without alcohol. I'll bring those right out.", accept: [['bring'], ['right back'], ['right out'], ['coming']], model: "Great choice: one still water and one mojito without alcohol. I'll bring those right out.", alt: "Perfect, I'll be right back with your drinks.", criterion: 'water', vocab: ['bring_drinks'], options: ["One mojito without alcohol. I'll bring those right out.", 'OK.'] },
    ],
    closingLine: 'Thanks, appreciate it!',
  },
  {
    id: 'what_is_in_it', unit: 3, title: "What's in it?", titleEs: '¿Qué lleva?', difficulty: 2,
    objective: 'Explicar platos del menú con ingredientes, preparación y acompañamientos.',
    menu: ['snapper', 'ribeye', 'calamari', 'fries', 'asparagus', 'mash'],
    guestFacts: 'You are Priya. You want fish or a light dish. You dislike very spicy food. You ask how things are cooked.',
    surprises: ['You ask whether the calamari sauce is spicy.', 'You ask what sides are available.'],
    closing: 'You have enough information and say you will order shortly.',
    criteria: [criterion('explain', 'Explicó la preparación de un plato', 'explain_dish'), criterion('side', 'Explicó los acompañamientos', 'explain_dish'), criterion('spice', 'Respondió sobre el picante sin inventar')],
    beats: [
      { guest: ['Can you tell me about the snapper?', 'How is the snapper prepared?'], goal: 'Explica cómo se prepara el pargo.', hint: 'It is grilled with lemon and capers.', accept: [['grilled'], ['lemon'], ['capers']], model: 'Of course. The snapper is grilled, with lemon and capers.', alt: 'It is local snapper, grilled and made with lemon and capers.', criterion: 'explain', vocab: ['grilled', 'made_with'], options: ['It is grilled with lemon and capers.', 'Is fish. Very good.'] },
      { guest: ['That sounds good. Does it include anything else?', 'Nice. What does it come with?'], goal: 'Explica el acompañamiento.', hint: 'It comes with one side: fries, asparagus or mashed potatoes.', accept: [['side'], ['comes with'], ['asparagus'], ['fries']], model: 'It comes with one side dish. You can choose fries, asparagus or mashed potatoes.', alt: 'You get one side: fries, asparagus or mashed potatoes.', criterion: 'side', vocab: ['comes_with', 'side_dish'], options: ['It comes with one side: fries, asparagus or mashed potatoes.', 'With potato.'] },
      { guest: ['And the calamari sauce, is it very spicy?', 'Is the sauce on the calamari hot? I do not do well with spicy food.'], goal: 'Di que es un poco picante y ofrece la salsa aparte.', hint: 'It is a little spicy, but I can bring the sauce on the side.', accept: [['spicy'], ['on the side']], model: 'It is a little spicy, but I can bring the sauce on the side.', alt: 'It has some heat, so we can serve the sauce on the side.', criterion: 'spice', vocab: ['a_little_spicy'], options: ['It is a little spicy, but I can bring the sauce on the side.', 'No problem.'] },
    ],
    closingLine: 'Great, that really helps. Give me just a minute.',
  },
  {
    id: 'dinner_for_two', unit: 4, title: 'Dinner for two', titleEs: 'Cena para dos', difficulty: 2, featured: true,
    objective: 'Recibir a dos personas, ofrecer agua, responder sobre un plato, tomar dos órdenes, confirmar un acompañamiento aparte y cerrar.',
    menu: ['ribeye', 'snapper', 'caesar', 'fries', 'asparagus', 'mash', 'still', 'sparkling'],
    guestFacts: 'You are Sam, ordering for yourself and your partner Jo. You want the ribeye, medium rare, with asparagus. Jo wants the Caesar salad with dressing on the side. You drink still water, no ice for Jo. You ask one question about a dish before you order.',
    surprises: ['You ask what comes with the ribeye.', 'You change your side from fries to asparagus.'],
    closing: 'The server has read back the order and you have nothing else to add.',
    criteria: [criterion('greet', 'Recibió a la mesa y ofreció agua'), criterion('explain', 'Respondió sobre un plato con datos del menú', 'explain_dish'), criterion('order', 'Tomó las órdenes y preguntó el término', 'clarify'), criterion('side_apart', 'Confirmó el acompañamiento aparte', 'confirm_mods'), criterion('confirm', 'Repitió la orden para confirmar', 'confirm_mods')],
    beats: [
      { guest: ['Hi! It is just the two of us tonight.', 'Good evening. Table for two, we are all set to sit down.'], goal: 'Da la bienvenida y ofrece agua.', hint: 'Welcome in! Can I start you off with some water?', accept: [['water'], ['drink']], model: 'Welcome in! Can I start you off with some water? We have still or sparkling.', alt: 'Good evening. Would you like still or sparkling water to start?', criterion: 'greet', vocab: ['welcome_in', 'still_water'], options: ['Welcome in! Can I start you off with some water?', 'Hello. You want water?'] },
      { guest: ['Still water is great, thanks. What comes with the ribeye?', 'Still water, please. Does the ribeye come with anything?', 'Still is good. How is the ribeye served?'], goal: 'Explica qué incluye el ribeye.', hint: 'It comes with one side. You can choose fries, asparagus or mashed potatoes.', accept: [['side'], ['comes with'], ['butter'], ['asparagus']], model: 'The ribeye is grilled with herb butter, and it comes with one side: fries, asparagus or mashed potatoes.', alt: 'It comes with herb butter and one side of your choice.', criterion: 'explain', vocab: ['comes_with', 'side_dish'], options: ['It comes with one side: fries, asparagus or mashed potatoes.', 'Comes with things.'] },
      { guest: ['Okay, I will have the ribeye, with asparagus.', 'Great. The ribeye for me, and asparagus as the side.'], goal: 'Pregunta el término de la carne.', hint: 'Great choice. How would you like that cooked?', accept: [['how', 'cooked'], ['temperature'], ['how would you like'], ['medium']], model: 'Great choice. How would you like that cooked?', alt: 'Excellent. What temperature would you like for the ribeye?', criterion: 'order', vocab: ['how_cooked'], options: ['Great choice. How would you like that cooked?', 'How you want the meat?'] },
      { guest: ['Medium rare, please. And for my partner, the Caesar salad, dressing separate.', 'Medium rare. My partner will have the Caesar, with the dressing apart.'], goal: 'Confirma que el aderezo va aparte.', hint: 'Of course, one Caesar with dressing on the side.', check: { nameOptional: true, items: [{ label: 'la ensalada César', names: ['caesar', 'salad'], side: [{ label: 'el aderezo', word: 'dressing' }] }] }, accept: [['on the side']], model: 'Of course, one Caesar salad with dressing on the side.', alt: 'Sure, I will have the dressing served on the side.', criterion: 'side_apart', vocab: ['dressing_side', 'medium_rare'], options: ['Of course, one Caesar with dressing on the side.', 'OK salad.'] },
      { guest: ["I think that's everything for us.", 'That should do it, thank you.'], goal: 'Repite la orden completa para confirmar.', hint: 'Let me confirm your order: one ribeye, medium rare, with asparagus, and one Caesar with dressing on the side.', check: { items: [{ label: 'el ribeye', names: ['ribeye'], temp: 'medium rare', add: [{ label: 'los espárragos', words: ['asparagus'] }], forbid: [{ label: 'papas', words: ['fries'] }] }, { label: 'la ensalada César', names: ['caesar'], side: [{ label: 'el aderezo', word: 'dressing' }] }] }, accept: [['ribeye', 'caesar']], model: 'Let me confirm your order: one ribeye, medium rare, with asparagus, and one Caesar salad with dressing on the side.', alt: 'So that is one ribeye medium rare with asparagus and one Caesar with dressing on the side. Is that correct?', criterion: 'confirm', vocab: ['let_me_confirm'], options: ['Let me confirm your order: one ribeye, medium rare, with asparagus, and one Caesar with dressing on the side.', 'OK. Thanks.'] },
    ],
    closingLine: 'Yes, that is perfect. Thank you!',
  },
  {
    id: 'nut_allergy', unit: 5, title: 'A serious allergy', titleEs: 'Una alergia seria', difficulty: 3,
    objective: 'Aclarar una alergia y consultar con cocina. Inventar una garantía no supera este reto, aunque suene fluido.',
    menu: ['burger', 'caesar', 'chicken', 'fries'],
    guestFacts: 'You are Lena. You have a serious tree nut allergy. You want the Harbor Burger. You ask if the house sauce has nuts, and then if it is 100% safe. The menu does not say what is in the house sauce.',
    surprises: ['You push the server: "So it is totally safe, right?"', 'You ask about the shared fryer for the fries.'],
    closing: 'The server has promised to check with the kitchen and you accept.',
    criteria: [criterion('listen', 'Escuchó y aclaró la alergia', 'clarify'), criterion('kitchen', 'Dijo que consultará con cocina'), criterion('no_guarantee', 'No inventó una garantía')],
    critical: 'no_guarantee',
    beats: [
      { guest: ['Before I order, I have a serious nut allergy.', 'I should tell you, I am very allergic to nuts.'], goal: 'Agradece y aclara qué nueces o frutos secos.', hint: 'Thank you for telling me. Is it all tree nuts?', accept: [['thank'], ['which'], ['tree nuts'], ['what kind'], ['kitchen']], model: 'Thank you for telling me. Is it all tree nuts, or a specific one?', alt: 'I am glad you told me. Which nuts are you allergic to?', criterion: 'listen', vocab: ['tree_nuts', 'any_allergies'], options: ['Thank you for telling me. Is it all tree nuts?', 'OK no problem.'] },
      { guest: ['All tree nuts. Does the house sauce on the burger have nuts?', 'Tree nuts, yes. Is there anything with nuts in the burger sauce?'], goal: 'No lo sabes por el menú: di que consultarás a la cocina.', hint: 'I am not sure, so let me double-check with the kitchen.', accept: [['kitchen'], ['chef'], ['double-check'], ['double check'], ['let me check'], ['let me ask']], model: 'I am not sure about the sauce, so let me double-check with the kitchen.', alt: 'I do not want to guess. I will ask the chef and come right back.', criterion: 'kitchen', vocab: ['let_me_double_check', 'check_kitchen'], options: ['I am not sure, so let me double-check with the kitchen.', 'No, it has no nuts.'] },
      { guest: ['So it is totally safe for me, right?', 'But you can promise me it is one hundred percent safe?'], goal: 'No garantices. Explica que la cocina lo confirmará.', hint: "I can't guarantee that myself, so I will ask the kitchen and come back to you.", accept: [["can't guarantee"], ['cannot guarantee'], ['not sure'], ['kitchen'], ['chef']], reject: [['totally safe'], ['it is safe'], ["it's safe"], ['yes', 'safe'], ['i promise'], ['100%']], model: "I can't guarantee that myself, so I will ask the kitchen and come back to you.", alt: 'I want to be careful, so let me speak with the chef before I answer that.', criterion: 'no_guarantee', vocab: ['cant_guarantee'], options: ["I can't guarantee that myself, so I will ask the kitchen and come back to you.", 'Yes, totally safe, do not worry.'] },
    ],
    closingLine: 'Thank you, I really appreciate that you are checking.',
  },
  {
    id: 'checking_in', unit: 6, title: 'Checking on the table', titleEs: 'Revisar la mesa', difficulty: 2,
    objective: 'Revisar la mesa, atender un pedido adicional y entender a un cliente que habla rápido.',
    menu: ['ribeye', 'iced_tea', 'cake'],
    guestFacts: 'You are Tom, halfway through dinner. Everything is fine. You want a refill of iced tea and you speak quickly the first time.',
    surprises: ['You mumble your request the first time.', 'You ask for a to-go box.'],
    closing: 'The server has confirmed they will bring what you asked.',
    criteria: [criterion('check', 'Preguntó cómo estaba todo'), criterion('clarify', 'Pidió aclaración en vez de adivinar', 'clarify'), criterion('offer', 'Ofreció y confirmó lo que traerá')],
    beats: [
      { guest: ['Oh, hi.', 'Hey there.'], goal: 'Pregunta cómo va todo.', hint: 'How is everything so far?', accept: [['how', 'everything'], ['how', 'food'], ['is everything'], ['how', 'meal']], model: 'How is everything tasting so far?', alt: 'Is everything okay with your meal so far?', criterion: 'check', vocab: ['how_is_everything'], options: ['How is everything tasting so far?', 'Is good?'] },
      { guest: ['Greatcouldigetanothericedteaandaboxforthis.'], goal: 'No entendiste: pide que lo repita.', hint: 'I am sorry, could you say that again, please?', accept: [['again'], ['repeat'], ['sorry', 'could'], ['one more time']], model: 'I am sorry, could you say that again, please?', alt: 'Sorry, I did not catch that. Could you repeat it, please?', criterion: 'clarify', vocab: ['sorry_could_repeat'], options: ['I am sorry, could you say that again, please?', 'Yes, of course!'] },
      { guest: ['Sure, sorry! Could I get another iced tea and a box for this?', 'No problem. Another iced tea, and a to-go box, please.'], goal: 'Confirma ambas cosas y di que regresas.', hint: "Of course: a refill of iced tea and a to-go box. I'll be right back.", accept: [['right back'], ['refill'], ['box'], ['iced tea']], model: "Of course: a refill of iced tea and a to-go box. I'll be right back.", alt: "Absolutely, I'll bring your iced tea and a box right away.", criterion: 'offer', vocab: ['refill', 'to_go_box', 'right_back'], options: ["Of course: a refill of iced tea and a to-go box. I'll be right back.", 'OK.'] },
    ],
    closingLine: 'You are the best, thanks.',
  },
  {
    id: 'order_not_right', unit: 7, complaint: true, title: "The order isn't right", titleEs: 'La orden no está bien', difficulty: 3,
    objective: 'El cliente recibió otro término de carne. Escuchar, reconocer, confirmar y corregir sin prometer compensaciones.',
    menu: ['ribeye', 'asparagus'],
    guestFacts: 'You are Alex. You ordered the ribeye medium rare and it arrived well done. You are annoyed but polite. If the server is kind, you calm down. You ask for it to come off the bill.',
    surprises: ['You ask to have it taken off the bill. Only the manager can authorize this.'],
    closing: 'The server has arranged a new steak and offered to get the manager about the bill.',
    criteria: [criterion('acknowledge', 'Se disculpó y reconoció el problema'), criterion('confirm_fact', 'Confirmó qué ocurrió', 'clarify'), criterion('fix', 'Propuso corregirlo con cocina'), criterion('escalate', 'Escaló al gerente sin prometer compensación')],
    critical: 'escalate',
    beats: [
      { guest: ['Excuse me, this steak is not right.', 'Sorry, there is a problem with my steak.'], goal: 'Discúlpate y pregunta qué pasó.', hint: "I'm so sorry about that. Could you tell me what happened?", accept: [['sorry'], ['apologize'], ['apologies'], ['what happened']], model: "I'm so sorry about that. Could you tell me what happened?", alt: 'I apologize. What seems to be the problem with your steak?', criterion: 'acknowledge', vocab: ['im_so_sorry', 'what_happened'], options: ["I'm so sorry about that. Could you tell me what happened?", 'What is the problem?'] },
      { guest: ['I asked for medium rare, and this is completely well done.', 'I ordered it medium rare, but it is well done.'], goal: 'Confirma lo ocurrido y ofrece rehacerlo.', hint: 'You ordered it medium rare and this is well done. I can have the kitchen remake it right away.', accept: [['remake'], ['new one'], ['kitchen'], ['fix'], ['medium rare']], model: 'You ordered it medium rare, and this one is well done. I can have the kitchen remake it right away.', alt: 'I understand, that is not what you ordered. Let me have the chef prepare a new one.', criterion: 'fix', also: ['confirm_fact'], vocab: ['wrong_temp', 'remake'], options: ['You ordered it medium rare and this is well done. I can have the kitchen remake it right away.', 'I take it.'] },
      { guest: ['Okay. I also think this should come off my bill.', 'Thanks. Honestly, it should be free after this, right?'], goal: 'No prometas compensaciones: llama al gerente.', hint: "I can't approve that myself, but I'll get my manager right away.", accept: [['manager']], reject: [['it is free'], ["it's free"], ['no charge'], ['on the house'], ['take it off'], ['yes', 'free']], model: "I can't approve that myself, but I'll get my manager right away to help you.", alt: 'I understand. Let me talk to my manager about that and come back to you.', criterion: 'escalate', vocab: ['get_manager', 'cant_guarantee'], options: ["I can't approve that myself, but I'll get my manager right away.", 'Sure, it is free.'] },
    ],
    closingLine: 'All right. Thanks for handling it.',
  },
  {
    id: 'closing_table', unit: 8, title: 'Closing the table', titleEs: 'Cerrar la mesa', difficulty: 2,
    objective: 'Traer la cuenta, dividir el pago y despedir a la mesa. La propina depende de la política del local.',
    menu: ['ribeye', 'caesar', 'cake'],
    guestFacts: 'You are Nina, at a table of two. You want to split the check evenly, one card each. You ask if the tip is included; the server should not invent this and may check the local policy.',
    surprises: ['You ask if gratuity is included.'],
    closing: 'You have your receipts and the server says goodbye.',
    criteria: [criterion('check', 'Trajo la cuenta sin presionar'), criterion('split', 'Aclaró cómo dividir el pago', 'clarify'), criterion('tip', 'No inventó la política de propinas'), criterion('goodbye', 'Se despidió con amabilidad')],
    beats: [
      { guest: ['We are all done, thank you. Could we get the check?', 'That was great. The check when you have a second?'], goal: 'Di que traes la cuenta.', hint: "Of course, I can bring the check right away.", accept: [['check'], ['bill'], ['right back']], model: 'Of course, I can bring the check right away.', alt: "My pleasure. I'll be right back with your check.", criterion: 'check', vocab: ['bring_check'], options: ['Of course, I can bring the check right away.', 'Yes, pay now.'] },
      { guest: ['Can you split it for us?', 'We would like to pay separately, if that is okay.'], goal: 'Pregunta cómo la quieren dividir.', hint: 'No problem. How would you like to split it: evenly or by item?', accept: [['evenly'], ['by item'], ['how', 'split']], model: 'No problem. How would you like to split it: evenly or by item?', alt: 'Of course. Would you like it evenly, or by item?', criterion: 'split', vocab: ['split_check', 'how_split', 'evenly'], options: ['No problem. How would you like to split it: evenly or by item?', 'OK two.'] },
      { guest: ['Evenly, please. Is the tip included?', 'Half and half. By the way, is gratuity included?'], goal: 'No inventes: di que la propina no se indica aquí o que lo verificarás.', hint: 'Let me double-check that on your check, so I give you the right answer.', accept: [['check'], ['let me'], ['policy'], ['manager'], ['not included'], ['included']], reject: [['you have to'], ['you must'], ['must tip']], model: 'Let me double-check that on your check, so I give you the right answer.', alt: 'I will confirm it with my manager, since it depends on our policy.', criterion: 'tip', vocab: ['let_me_double_check'], options: ['Let me double-check that on your check, so I give you the right answer.', 'You have to tip 25 percent.'] },
      { guest: ['Great, thanks. Everything was wonderful.', 'Thank you so much for tonight.'], goal: 'Despídete y agradece la visita.', hint: 'Thank you for coming in. Have a great night!', accept: [['thank'], ['good night'], ['great night'], ['see you']], model: 'Thank you for coming in. Have a great night!', alt: 'It was my pleasure. Hope to see you again soon!', criterion: 'goodbye', vocab: ['thanks_coming', 'see_you_again'], options: ['Thank you for coming in. Have a great night!', 'Bye.'] },
    ],
    closingLine: 'Good night!',
  },
];

export const SCENARIOS = [...BASE_SCENARIOS, ...SCENARIO_VARIANTS];
export const SCENARIO_BY_ID = new Map(SCENARIOS.map((s) => [s.id, s]));
