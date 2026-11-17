// Los cinco locales de Mesas 2.0. Cada uno trae su carta (platos, bebidas, postres), su vocabulario y qué situaciones
// no tienen sentido allí. El menú de «steakhouse» (Harbor 47) es el de siempre: lo usa cualquier mesa que no pida local.
// Los locales son ficticios. El arte (salones) vive en web/public/art/sala_*.webp.
//
// Forma de un plato principal: { en, es, word, temp?, side?, how }
//   temp  true: se pregunta el punto de cocción · side  true: viene con una guarnición · how: cómo se explica el plato.
// En las frases del alumno cada plato entra en singular («The X is really good»), por eso ningún nombre va en plural
// salvo los que en inglés se dicen así («eggs benedict»).
const L = (en, es) => ({ en, es });

const TEMPS = [
  { en: 'medium rare', es: 'medio rojo', word: 'rare' }, { en: 'medium', es: 'término medio', word: 'medium' }, { en: 'well done', es: 'bien cocido', word: 'done' },
];
const ALLERGIES = [{ en: 'nuts', es: 'las nueces' }, { en: 'shellfish', es: 'los mariscos' }, { en: 'gluten', es: 'el gluten' }, { en: 'dairy', es: 'los lácteos' }];
const WINES = [{ en: 'red wine', es: 'vino tinto', word: 'red' }, { en: 'white wine', es: 'vino blanco', word: 'white' }];

// --- Harbor 47: el menú original de las mesas ---
const STEAKHOUSE = {
  drinks: [
    { en: 'still water', es: 'agua sin gas', word: 'still' }, { en: 'sparkling water', es: 'agua con gas', word: 'sparkling' },
    { en: 'iced tea', es: 'té helado', word: 'tea' }, { en: 'lemonade', es: 'limonada', word: 'lemonade' }, { en: 'coffee', es: 'café', word: 'coffee' },
  ],
  wines: WINES,
  alcohol: [...WINES, { en: 'draft beer', es: 'cerveza de barril', word: 'beer' }, { en: 'mojito', es: 'mojito', word: 'mojito' }],
  mains: [
    { en: 'ribeye', es: 'el ribeye', word: 'ribeye', temp: true, side: true, how: L('It is grilled with herb butter.', 'Es a la parrilla con mantequilla de hierbas.') },
    { en: 'burger', es: 'la hamburguesa', word: 'burger', temp: true, side: true, how: L('It has cheese, lettuce and tomato.', 'Tiene queso, lechuga y tomate.') },
    { en: 'snapper', es: 'el pargo', word: 'snapper', side: true, how: L('It is grilled with lemon.', 'Es a la parrilla con limón.') },
    { en: 'chicken', es: 'el pollo', word: 'chicken', side: true, how: L('It is roasted with garlic.', 'Es al horno con ajo.') },
    { en: 'shrimp linguine', es: 'el linguine con camarones', word: 'linguine', how: L('It has shrimp, garlic and tomato.', 'Tiene camarones, ajo y tomate.') },
  ],
  starters: [
    { en: 'Caesar salad', es: 'la ensalada César', word: 'caesar' }, { en: 'calamari', es: 'los calamares', word: 'calamari' }, { en: 'tomato soup', es: 'la sopa de tomate', word: 'soup' },
  ],
  sides: [
    { en: 'fries', es: 'papas fritas', word: 'fries' }, { en: 'asparagus', es: 'espárragos', word: 'asparagus' }, { en: 'mashed potatoes', es: 'puré de papas', word: 'potatoes' },
  ],
  desserts: [{ en: 'key lime pie', es: 'el pie de limón', word: 'pie' }, { en: 'cheesecake', es: 'el pastel de queso', word: 'cheesecake' }],
  temps: TEMPS,
  allergies: ALLERGIES,
};

const CAFE = {
  drinks: [
    { en: 'coffee', es: 'café', word: 'coffee' }, { en: 'latte', es: 'café con leche', word: 'latte' }, { en: 'orange juice', es: 'jugo de naranja', word: 'juice' },
    { en: 'iced tea', es: 'té helado', word: 'tea' }, { en: 'still water', es: 'agua sin gas', word: 'still' },
  ],
  wines: WINES,
  alcohol: [...WINES],
  mains: [
    { en: 'turkey sandwich', es: 'el sándwich de pavo', word: 'sandwich', side: true, how: L('It has turkey, cheese and tomato.', 'Tiene pavo, queso y tomate.') },
    { en: 'chicken wrap', es: 'el wrap de pollo', word: 'wrap', side: true, how: L('It has chicken, lettuce and tomato.', 'Tiene pollo, lechuga y tomate.') },
    { en: 'avocado toast', es: 'la tostada de aguacate', word: 'avocado', how: L('It has avocado and a little lemon.', 'Tiene aguacate y un poco de limón.') },
    { en: 'breakfast burrito', es: 'el burrito de desayuno', word: 'burrito', how: L('It has eggs, cheese and potatoes.', 'Tiene huevos, queso y papas.') },
  ],
  starters: [{ en: 'croissant', es: 'el croissant', word: 'croissant' }, { en: 'muffin', es: 'el muffin', word: 'muffin' }, { en: 'fruit cup', es: 'la copa de frutas', word: 'fruit' }],
  sides: [{ en: 'fries', es: 'papas fritas', word: 'fries' }, { en: 'fruit salad', es: 'ensalada de frutas', word: 'fruit' }, { en: 'tomato soup', es: 'sopa de tomate', word: 'soup' }],
  desserts: [{ en: 'chocolate cake', es: 'el pastel de chocolate', word: 'cake' }, { en: 'apple pie', es: 'el pie de manzana', word: 'pie' }],
  temps: TEMPS,
  allergies: ALLERGIES,
};

const BRUNCH = {
  drinks: [
    { en: 'coffee', es: 'café', word: 'coffee' }, { en: 'orange juice', es: 'jugo de naranja', word: 'juice' }, { en: 'iced tea', es: 'té helado', word: 'tea' },
    { en: 'lemonade', es: 'limonada', word: 'lemonade' }, { en: 'still water', es: 'agua sin gas', word: 'still' },
  ],
  wines: WINES,
  alcohol: [{ en: 'mimosa', es: 'mimosa', word: 'mimosa' }, { en: 'draft beer', es: 'cerveza de barril', word: 'beer' }, ...WINES],
  mains: [
    { en: 'pancake stack', es: 'la torre de pancakes', word: 'pancake', how: L('It comes with fruit and syrup.', 'Viene con fruta y sirope.') },
    { en: 'eggs Benedict', es: 'los huevos benedictinos', word: 'benedict', side: true, how: L('It has eggs, ham and a special sauce.', 'Tiene huevos, jamón y una salsa especial.') },
    { en: 'omelet', es: 'el omelet', word: 'omelet', side: true, how: L('It has eggs, cheese and mushrooms.', 'Tiene huevos, queso y champiñones.') },
    { en: 'French toast', es: 'el pan francés', word: 'french', how: L('It is sweet toast with fruit.', 'Es pan tostado dulce con fruta.') },
  ],
  starters: [{ en: 'fruit cup', es: 'la copa de frutas', word: 'fruit' }, { en: 'yogurt', es: 'el yogur', word: 'yogurt' }, { en: 'croissant', es: 'el croissant', word: 'croissant' }],
  sides: [{ en: 'bacon', es: 'tocino', word: 'bacon' }, { en: 'hash browns', es: 'papas doradas', word: 'hash' }, { en: 'fruit', es: 'fruta', word: 'fruit' }],
  desserts: [{ en: 'banana bread', es: 'el pan de plátano', word: 'banana' }, { en: 'cheesecake', es: 'el pastel de queso', word: 'cheesecake' }],
  temps: TEMPS,
  allergies: ALLERGIES,
};

const ROOFTOP = {
  drinks: [
    { en: 'sparkling water', es: 'agua con gas', word: 'sparkling' }, { en: 'still water', es: 'agua sin gas', word: 'still' }, { en: 'lemonade', es: 'limonada', word: 'lemonade' },
    { en: 'iced tea', es: 'té helado', word: 'tea' }, { en: 'soda', es: 'refresco', word: 'soda' },
  ],
  wines: WINES,
  alcohol: [{ en: 'mojito', es: 'mojito', word: 'mojito' }, { en: 'margarita', es: 'margarita', word: 'margarita' }, { en: 'draft beer', es: 'cerveza de barril', word: 'beer' }, ...WINES],
  mains: [
    { en: 'taco plate', es: 'el plato de tacos', word: 'taco', how: L('It has three tacos with shrimp and lime.', 'Tiene tres tacos con camarones y limón.') },
    { en: 'wing basket', es: 'la canasta de alitas', word: 'basket', how: L('It has crispy wings with spicy sauce.', 'Tiene alitas crujientes con salsa picante.') },
    { en: 'flatbread', es: 'el flatbread', word: 'flatbread', how: L('It has tomato, cheese and fresh basil.', 'Tiene tomate, queso y albahaca fresca.') },
    { en: 'burger', es: 'la hamburguesa', word: 'burger', temp: true, side: true, how: L('It has cheese, lettuce and tomato.', 'Tiene queso, lechuga y tomate.') },
  ],
  starters: [{ en: 'guacamole', es: 'el guacamole', word: 'guacamole' }, { en: 'calamari', es: 'los calamares', word: 'calamari' }, { en: 'nachos', es: 'los nachos', word: 'nachos' }],
  sides: [{ en: 'fries', es: 'papas fritas', word: 'fries' }, { en: 'sweet potato fries', es: 'papas dulces fritas', word: 'fries' }, { en: 'salad', es: 'ensalada', word: 'salad' }],
  desserts: [{ en: 'key lime pie', es: 'el pie de limón', word: 'pie' }, { en: 'chocolate cake', es: 'el pastel de chocolate', word: 'cake' }],
  temps: TEMPS,
  allergies: ALLERGIES,
};

const HOTEL = {
  drinks: [
    { en: 'still water', es: 'agua sin gas', word: 'still' }, { en: 'sparkling water', es: 'agua con gas', word: 'sparkling' }, { en: 'coffee', es: 'café', word: 'coffee' },
    { en: 'iced tea', es: 'té helado', word: 'tea' }, { en: 'lemonade', es: 'limonada', word: 'lemonade' },
  ],
  wines: [...WINES, { en: 'champagne', es: 'champaña', word: 'champagne' }],
  alcohol: [{ en: 'glass of champagne', es: 'una copa de champaña', word: 'champagne' }, { en: 'martini', es: 'un martini', word: 'martini' }, ...WINES],
  mains: [
    { en: 'filet mignon', es: 'el filet mignon', word: 'filet', temp: true, side: true, how: L('It is a tender steak with red wine sauce.', 'Es un filete tierno con salsa de vino tinto.') },
    { en: 'grilled lobster', es: 'la langosta a la parrilla', word: 'lobster', side: true, how: L('It is grilled lobster with butter.', 'Es langosta a la parrilla con mantequilla.') },
    { en: 'salmon', es: 'el salmón', word: 'salmon', side: true, how: L('It is grilled salmon with lemon.', 'Es salmón a la parrilla con limón.') },
    { en: 'risotto', es: 'el risotto', word: 'risotto', how: L('It is creamy rice with mushrooms.', 'Es arroz cremoso con hongos.') },
  ],
  starters: [{ en: 'oysters', es: 'las ostras', word: 'oysters' }, { en: 'Caesar salad', es: 'la ensalada César', word: 'caesar' }, { en: 'tomato soup', es: 'la sopa de tomate', word: 'soup' }],
  sides: [{ en: 'asparagus', es: 'espárragos', word: 'asparagus' }, { en: 'mashed potatoes', es: 'puré de papas', word: 'potatoes' }, { en: 'vegetables', es: 'verduras', word: 'vegetables' }],
  desserts: [{ en: 'chocolate mousse', es: 'la mousse de chocolate', word: 'mousse' }, { en: 'cheesecake', es: 'el pastel de queso', word: 'cheesecake' }],
  temps: TEMPS,
  allergies: ALLERGIES,
};

/**
 * Los locales, en el orden en que los muestra la app.
 * desbloqueo.mesas: mesas de Turno atendidas en la temporada (el nivel de dificultad sale de ese mismo conteo:
 * nivel 2 = 4 mesas, nivel 3 = 10, nivel 4 = 20), por eso se dice de las dos formas.
 * exclude: situaciones que no tienen sentido allí (el texto de algunas menciona platos o bebidas concretos).
 * boost: situaciones que pesan más en ese local.
 * veggie: el plato sin carne que se recomienda en la situación «Sin carne».
 */
export const RESTAURANTES = [
  { id: 'cafe', nombre: 'Café', local: 'Sunrise Café', blurb: 'Desayunos rápidos y café con leche', sala: 'sala_cafe', desbloqueo: { mesas: 0, nivel: 1 },
    exclude: ['bebidas', 'vino', 'aniversario', 'happy_hour', 'mal_cocido', 'cerrando'], boost: { desayuno: 4, recomendar: 2, postre: 2 },
    veggie: { en: 'avocado toast', es: 'la tostada de aguacate' }, menu: CAFE },
  { id: 'brunch', nombre: 'Brunch', local: 'Palm Brunch House', blurb: 'Mesas largas, huevos y mimosas', sala: 'sala_brunch', desbloqueo: { mesas: 4, nivel: 2 },
    exclude: ['happy_hour', 'mal_cocido', 'cerrando'], boost: { desayuno: 3, familia: 2, cumple: 2, recomendar: 2 },
    veggie: { en: 'omelet', es: 'el omelet' }, menu: BRUNCH },
  { id: 'steakhouse', nombre: 'Steakhouse', local: 'Harbor 47', blurb: 'Harbor 47: carnes, pescado y cuenta dividida', sala: 'sala_steakhouse', desbloqueo: { mesas: 0, nivel: 1 },
    exclude: [], boost: {},
    veggie: { en: 'tomato soup', es: 'la sopa de tomate', short: 'soup', shortEs: 'la sopa' }, menu: STEAKHOUSE },
  { id: 'rooftop', nombre: 'Rooftop', local: 'Skyline Rooftop', blurb: 'Cócteles, turistas y vista al mar', sala: 'sala_rooftop', desbloqueo: { mesas: 10, nivel: 3 },
    exclude: ['desayuno', 'mal_cocido'], boost: { happy_hour: 3, bebidas: 2, turista: 2, cumple: 2 },
    veggie: { en: 'flatbread', es: 'el flatbread' }, menu: ROOFTOP },
  { id: 'hotel', nombre: 'Hotel de Ocean Drive', local: 'The Ocean Hotel', blurb: 'Clientes VIP y servicio de gala', sala: 'sala_hotel', desbloqueo: { mesas: 20, nivel: 4 },
    exclude: ['desayuno', 'happy_hour', 'llevar'], boost: { aniversario: 3, vino: 3, alergia: 2, cena: 2, cuenta_mal: 2 },
    veggie: { en: 'risotto', es: 'el risotto' }, menu: HOTEL },
];

export const RESTAURANTE_POR_ID = new Map(RESTAURANTES.map((r) => [r.id, r]));
/** El de siempre: lo usa cualquier mesa que no pida local, y su menú es el original de Mesas. */
export const RESTAURANTE_BASE = 'steakhouse';
export const RESTAURANTE_PROPIO = 'propio';
export const abierto = (restaurante, hechas) => hechas >= restaurante.desbloqueo.mesas;

/** Estado de cada local para la pantalla: abierto o bloqueado, qué falta y cuánto llevas. */
export function estadoRestaurantes(hechas) {
  return RESTAURANTES.map((r) => {
    const necesarias = r.desbloqueo.mesas;
    const open = hechas >= necesarias;
    return {
      id: r.id, nombre: r.nombre, local: r.local, blurb: r.blurb, sala: r.sala, imagen: `/art/${r.sala}.webp`,
      estado: open ? 'abierto' : 'bloqueado',
      condicion: { mesas: necesarias, nivel: r.desbloqueo.nivel, texto: open ? 'Abierto' : `Atiende ${necesarias} mesas de Turno (nivel ${r.desbloqueo.nivel})` },
      progreso: { atendidas: hechas, necesarias, restantes: Math.max(0, necesarias - hechas) },
    };
  });
}
