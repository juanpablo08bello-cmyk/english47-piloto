// Sistema de Conversación: frases de todos los días que se repiten HASTA que no se olviden.
// Se aprenden en packs de 5 («Tus 5 de hoy»): el mismo pack 5 días activos y después pasa a repaso espaciado.
// Reglas: oraciones completas de 4 a 10 palabras, con un conector o una fórmula fija, audio y glosa en español.
// Sin escribir: solo escuchar, decir en voz alta y elegir.
export const CATEGORIAS = {
  A: 'Abrir y cerrar',
  B: 'Conectores',
  C: 'Ganar tiempo',
  D: 'Reaccionar',
  E: 'Servicio y cortesía',
  F: 'Problemas y disculpas',
  G: 'Vida diaria y turno',
};

// [categoría, inglés, español, conector (palabra que se elige en el ejercicio de hueco, o null)]
import { RAW_MAS, CUES_MAS } from './conversacion-mas.js';
const RAW_BASE = [
  // Pack 1 · Empezar a hablar
  ['A', "How's it going?", '¿Cómo va todo?', null],
  ['A', 'Nice to meet you.', 'Mucho gusto.', null],
  ['B', 'So, what can I get you started with?', 'Entonces, ¿con qué le puedo empezar?', 'So'],
  ['B', "It's good, but it's a little spicy.", 'Está bueno, pero pica un poco.', 'but'],
  ['E', 'Can I get you anything else?', '¿Le traigo algo más?', null],
  // Pack 2 · Conectores a diario
  ['B', 'Because it\'s made fresh every morning.', 'Porque se hace fresco cada mañana.', 'Because'],
  ['B', 'Also, we have a special today.', 'Además, hoy tenemos un especial.', 'Also'],
  ['B', 'For example, the grilled chicken.', 'Por ejemplo, el pollo a la parrilla.', 'For example'],
  ['B', "If you like seafood, I'd recommend the shrimp.", 'Si le gusta el marisco, le recomiendo el camarón.', 'If'],
  ['B', "In that case, I'll bring you a different one.", 'En ese caso, le traigo otro.', 'In that case'],
  // Pack 3 · Cuando no entiendo
  ['C', 'Sorry, could you say that again?', 'Perdón, ¿podría repetirlo?', null],
  ['C', 'Could you speak a little slower, please?', '¿Podría hablar un poco más despacio, por favor?', null],
  ['C', 'Give me one second.', 'Deme un segundo.', null],
  ['C', 'Let me check with the kitchen.', 'Déjeme confirmarlo con la cocina.', null],
  ['C', 'What does that mean?', '¿Qué significa eso?', null],
  // Pack 4 · Servicio
  ['E', 'Let me know if you need anything.', 'Avíseme si necesita algo.', null],
  ["E", "I'll be right back.", 'Enseguida vuelvo.', null],
  ['E', 'Would you like to see the dessert menu?', '¿Le gustaría ver el menú de postres?', null],
  ['E', 'Do you need a few more minutes?', '¿Necesita unos minutos más?', null],
  ['B', 'By the way, do you have any allergies?', 'Por cierto, ¿tiene alguna alergia?', 'By the way'],
  // Pack 5 · Problemas y disculpas
  ['F', "I'm so sorry about that.", 'Lo siento mucho.', null],
  ['F', "I'll take care of it right away.", 'Me encargo de eso ahora mismo.', null],
  ['F', 'Thanks for your patience.', 'Gracias por su paciencia.', null],
  ['F', "That one's on me.", 'Esta corre por mi cuenta.', null],
  ['B', "Actually, I'd prefer something lighter.", 'En realidad, prefiero algo más ligero.', 'Actually'],
  // Pack 6 · Reaccionar
  ['D', 'That sounds great!', '¡Suena muy bien!', null],
  ['D', 'Really? Tell me more.', '¿En serio? Cuénteme más.', null],
  ['D', 'No problem at all.', 'No hay problema.', null],
  ['D', "I'm not sure, but I think so.", 'No estoy seguro, pero creo que sí.', 'but'],
  ['D', 'I totally get it.', 'Lo entiendo perfectamente.', null],
  // Pack 7 · Vida diaria y turno
  ['G', "I'm running a little late.", 'Voy un poco tarde.', null],
  ['G', 'Can you cover my table for five minutes?', '¿Puedes cubrir mi mesa cinco minutos?', null],
  ['G', 'What time do you get off?', '¿A qué hora sales?', null],
  ['G', 'Can we swap shifts on Friday?', '¿Podemos cambiar turnos el viernes?', null],
  ['G', "I'm still learning English.", 'Todavía estoy aprendiendo inglés.', null],
  // Pack 8 · Abrir y cerrar
  ['A', "How's your day going so far?", '¿Cómo va tu día hasta ahora?', null],
  ['A', 'Have a good one!', '¡Que tenga un buen día!', null],
  ['A', 'See you tomorrow.', 'Nos vemos mañana.', null],
  ['B', 'After that, I\'ll check on you.', 'Después de eso, vuelvo a ver cómo está.', 'After that'],
  ['G', 'I live ten minutes from here.', 'Vivo a diez minutos de aquí.', null],
];

const RAW = [...RAW_BASE, ...RAW_MAS];
export const PACK_SIZE = 5;
export const FRASES_CONV = RAW.map(([cat, en, es, conector], i) => ({ id: i, cat, en, es, conector }));
export const PACKS = Array.from({ length: Math.ceil(FRASES_CONV.length / PACK_SIZE) }, (_, p) => FRASES_CONV.slice(p * PACK_SIZE, (p + 1) * PACK_SIZE).map((f) => f.id));

// Ejercicio principal de cada día activo del pack (ver docs/reforma/investigacion/18-raio-kale-anders.md §7.3).
export const DIAS = [
  { kind: 'oir', title: 'Escucha y elige', hint: 'Oye la frase, elige qué significa y repítela.' },
  { kind: 'responder', title: 'Elige la respuesta', hint: 'Oye al cliente y elige qué contestar. Luego dilo.' },
  { kind: 'conector', title: 'Elige el conector', hint: 'Completa con la palabra que une la frase. Luego dila.' },
  { kind: 'decir', title: 'Dila sin verla', hint: 'Mira el español y di la frase en inglés.' },
  { kind: 'rafaga', title: 'Ráfaga', hint: 'Las cinco seguidas. Escucha y responde en voz alta.' },
];

// Lo que dice el cliente o el compañero antes de que digas la frase (ejercicio «Elige la respuesta»). Mismo orden que RAW.
const CUES = [
  "Hi! Good evening.", "Hello, I'm the new guest.", "We just sat down.", "Is the fish spicy?", "That was delicious.", "Why is it so good?", "Do you have any specials?", "What do you recommend?", "I love shrimp.", "This steak is overcooked.", "I didn't catch that.", "I can't follow you, you talk fast.", "Is the table ready?", "Is the soup vegan?", "What is gluten?", "We're all set for now.", "Excuse me, can I get a refill?", "That was a great meal.", "We haven't looked at the menu yet.", "I'd like the shrimp pasta.", "My food took forever.", "This is the wrong dish.", "We've been waiting a long time.", "The drinks are late.", "How about the steak and fries?", "Tonight's special is lobster ravioli.", "I used to be a chef in Cuba.", "Sorry, can you swap the fries?", "Is the soup gluten free?", "It's been a really long day.", "Where are you?", "I need to step out.", "When does your shift end?", "Are you free on Friday?", "Your English is great!", "Good to see you again.", "Thanks for everything.", "Bye, see you later.", "Do you work tomorrow?", "Where do you live?"
];
export const FRASES_CONV_CUE = FRASES_CONV.map((f) => ({ ...f, cue: [...CUES, ...CUES_MAS][f.id] }));
