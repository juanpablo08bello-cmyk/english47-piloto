// Ocho unidades, tres microlecciones por unidad y un reto final (simulacion).
// La gramatica vive aqui: explicaciones breves, seguidas de practica contextual.
import { EXTRA_LESSONS } from './lessons-extra.js';

export { CATEGORIES } from './categories.js';

const BASE_UNITS = [
  { id: 1, title: 'Recibir y acomodar', goal: 'Saludar, preguntar por la reservación y llevar a la mesa.', scenario: 'table_for_two', lessons: [
    { id: 'u1l1', title: 'El primer saludo', vocab: ['welcome_in', 'how_many', 'inside_outside'],
      grammar: { title: 'Preguntas con how many', text: 'Para contar personas o cosas usa «How many» + plural: «How many in your party?». Suena más profesional que «How many people you are?», donde falta invertir el orden.' } },
    { id: 'u1l2', title: 'Reservas y nombres', vocab: ['reservation', 'under_name', 'table_ready'],
      grammar: { title: 'Do you have...?', text: 'En inglés, las preguntas en presente simple empiezan con do/does: «Do you have a reservation?». No basta con subir la voz al final, como en español.' } },
    { id: 'u1l3', title: 'Espera y presentación', vocab: ['wait_time', 'right_this_way', 'taking_care'],
      grammar: { title: "Futuro con I'll", text: "«I'll be taking care of you» anuncia lo que vas a hacer. I'll es la forma natural de prometer una acción al momento: I'll be right back, I'll check." } },
  ] },
  { id: 2, title: 'Bebidas', goal: 'Ofrecer agua y bebidas, y hacer una recomendación sencilla.', scenario: 'drinks_first', lessons: [
    { id: 'u2l1', title: 'Agua natural o con gas', vocab: ['start_drinks', 'still_water', 'sparkling_water'],
      grammar: { title: 'Can I...? para ofrecer', text: '«Can I get you...?» es una oferta amable. Evita «You want...?»: se entiende, pero suena brusco en un restaurante de este nivel.' } },
    { id: 'u2l2', title: 'Hielo y refills', vocab: ['with_ice', 'refill', 'free_refills'],
      grammar: { title: 'Contables e incontables', text: 'Water, ice y tea son incontables: «some water», no «a water» en general. Pero para pedir vasos o botellas la gente sí dice «two waters» o «a bottle of water».' } },
    { id: 'u2l3', title: 'Recomendar', vocab: ['recommend_drink', 'without_alcohol', 'bring_drinks'],
      grammar: { title: 'I would recommend', text: '«I would recommend...» o «I\'d recommend...» recomienda sin presionar. Después va el sustantivo directamente: «I would recommend the mojito».' } },
  ] },
  { id: 3, title: 'Explicar el menú', goal: 'Describir ingredientes, acompañamientos y métodos de cocción.', scenario: 'what_is_in_it', lessons: [
    { id: 'u3l1', title: 'Qué incluye', vocab: ['comes_with', 'side_dish', 'made_with'],
      grammar: { title: 'Presente simple con -s', text: 'Con he, she o it, el verbo lleva -s: «The ribeye comes with one side». Es el error más común al describir platos, y muy fácil de corregir.' } },
    { id: 'u3l2', title: 'Cómo se cocina', vocab: ['grilled', 'fried', 'roasted'],
      grammar: { title: 'Is + participio', text: 'Para explicar la preparación usa is + participio: «It is grilled», «It is roasted». Di «It is fried», no «It fries».' } },
    { id: 'u3l3', title: 'Sugerir con confianza', vocab: ['a_little_spicy', 'our_special', 'popular'],
      grammar: { title: 'Does it have...?', text: 'El cliente preguntará con does: «Does it have nuts?». Tú puedes responder con frase corta: «Yes, it does» o «Let me check».' } },
  ] },
  { id: 4, title: 'Tomar la orden', goal: 'Tomar órdenes, términos de carne y modificaciones, y confirmar.', scenario: 'dinner_for_two', lessons: [
    { id: 'u4l1', title: 'Sin apurar a la mesa', vocab: ['ready_to_order', 'take_your_time', 'anything_else'],
      grammar: { title: 'Would you like', text: '«What would you like to order?» es la forma cortés. «What you want?» comunica la idea, pero le falta la estructura y suena seco.' } },
    { id: 'u4l2', title: 'Términos de carne', vocab: ['how_cooked', 'medium_rare', 'well_done'],
      grammar: { title: 'How would you like...?', text: 'How + would + you + like cubre casi todo: «How would you like that cooked?», «How would you like to pay?». Una sola estructura, muchos momentos.' } },
    { id: 'u4l3', title: 'Cambios y confirmación', vocab: ['dressing_side', 'substitute', 'let_me_confirm'],
      grammar: { title: 'Let me + verbo', text: 'Let me va seguido del verbo sin «to»: «Let me confirm», «Let me check». No se dice «Let me to confirm».' } },
  ] },
  { id: 5, title: 'Alergias y restricciones', goal: 'Aclarar la alergia y consultar con cocina, sin inventar garantías.', scenario: 'nut_allergy', lessons: [
    { id: 'u5l1', title: 'Preguntar y escuchar', vocab: ['any_allergies', 'tree_nuts', 'shellfish'],
      grammar: { title: 'Some y any', text: 'Usa any en preguntas y negaciones: «Do you have any allergies?», «There aren\'t any nuts». Some suele ir en frases afirmativas.' } },
    { id: 'u5l2', title: 'Ingredientes delicados', vocab: ['gluten_free', 'dairy', 'cross_contact'],
      grammar: { title: 'Contain', text: '«It contains dairy» es más claro que «it has». Si no lo sabes con certeza, no respondas sí o no: consulta con la cocina.' } },
    { id: 'u5l3', title: 'No inventar garantías', vocab: ['let_me_double_check', 'check_kitchen', 'cant_guarantee'],
      grammar: { title: 'Can\'t + verbo', text: '«I can\'t guarantee that» es honesto y profesional. Una respuesta fluida que promete seguridad sin consultar es un error de servicio, aunque suene bien.' } },
  ] },
  { id: 6, title: 'Durante el servicio', goal: 'Revisar la mesa, ofrecer ayuda y anticipar lo que necesitan.', scenario: 'checking_in', lessons: [
    { id: 'u6l1', title: 'Revisar la mesa', vocab: ['how_is_everything', 'right_back', 'sorry_could_repeat'],
      grammar: { title: 'Could you...?', text: '«Could you say that again, please?» pide algo con cortesía. Pedir que te repitan es profesional: es mejor que adivinar una orden.' } },
    { id: 'u6l2', title: 'Anticipar', vocab: ['anything_i_can_bring', 'more_bread', 'dessert_room'],
      grammar: { title: 'Some more', text: '«Some more bread» significa un poco más. Con preguntas de oferta también se usa some: «Would you like some more water?».' } },
    { id: 'u6l3', title: 'Retirar platos', vocab: ['clear_this', 'still_working', 'to_go_box'],
      grammar: { title: 'Presente continuo', text: '«Are you still working on that?» usa are + verbo con -ing porque habla de ahora mismo. Es la forma habitual antes de retirar un plato.' } },
  ] },
  { id: 7, title: 'Resolver problemas', goal: 'Escuchar, reconocer el problema y escalar cuando corresponde.', scenario: 'order_not_right', lessons: [
    { id: 'u7l1', title: 'Disculparse y entender', vocab: ['im_so_sorry', 'what_happened', 'wrong_temp'],
      grammar: { title: 'Pasado para explicar', text: 'El pasado regular termina en -ed: «You ordered it medium rare». Las preguntas usan did: «What did you order?».' } },
    { id: 'u7l2', title: 'Demoras', vocab: ['taking_longer', 'check_on_it', 'thanks_patience'],
      grammar: { title: 'Is taking', text: '«It is taking longer than usual» describe lo que pasa ahora. Evita culpar a la cocina: informa y di qué vas a hacer.' } },
    { id: 'u7l3', title: 'Corregir y escalar', vocab: ['remake', 'cold_food', 'get_manager'],
      grammar: { title: "I can / I can't", text: 'Di lo que sí puedes hacer: «I can have the kitchen remake it». Para compensaciones que no autorizas: «I can\'t approve that myself, but I\'ll get my manager».' } },
  ] },
  { id: 8, title: 'Cerrar la mesa', goal: 'Presentar la cuenta, dividir pagos y despedirte bien.', scenario: 'closing_table', lessons: [
    { id: 'u8l1', title: 'Traer la cuenta', vocab: ['bring_check', 'pay_when_ready', 'card_or_cash'],
      grammar: { title: 'Whenever you are ready', text: 'Se usa presente después de whenever, aunque hable de después: «Whenever you are ready», no «Whenever you will be ready».' } },
    { id: 'u8l2', title: 'Dividir pagos', vocab: ['split_check', 'how_split', 'evenly'],
      grammar: { title: 'By item / evenly', text: 'Ofrece dos opciones claras: «evenly» (partes iguales) o «by item» (cada quien lo suyo). Así evitas errores al cobrar.' } },
    { id: 'u8l3', title: 'Recibo y despedida', vocab: ['receipt', 'thanks_coming', 'see_you_again'],
      grammar: { title: 'Propinas', text: 'La propina depende de la política del local. No la presentes como obligatoria; si hay cargo automático, indícalo con claridad: «Gratuity is included for this table».' } },
  ] },
];

export const UNITS = BASE_UNITS.map((u) => ({ ...u, lessons: [...u.lessons, ...EXTRA_LESSONS[u.id]] }));

export const LESSONS = UNITS.flatMap((u) => u.lessons.map((l) => ({ ...l, unit: u.id })));
export const LESSON_BY_ID = new Map(LESSONS.map((l) => [l.id, l]));
export const UNIT_BY_ID = new Map(UNITS.map((u) => [u.id, u]));
