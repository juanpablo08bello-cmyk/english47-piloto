// Categorias del catalogo. `unit` conecta cada una con la unidad de la Ruta donde se practica mas.
export const CATEGORY_LIST = [
  { key: 'welcome', name: 'Bienvenida, reservas y lista de espera', unit: 1 },
  { key: 'seating', name: 'Ubicación de mesas y presentación', unit: 1 },
  { key: 'polite', name: 'Cortesía: casual frente a profesional', unit: 1 },
  { key: 'soft', name: 'Bebidas sin alcohol, café y té', unit: 2 },
  { key: 'wine', name: 'Vino, cerveza y cócteles', unit: 2 },
  { key: 'menu', name: 'Menú, especiales y recomendaciones', unit: 3 },
  { key: 'flavors', name: 'Ingredientes, sabores y texturas', unit: 3 },
  { key: 'cooking', name: 'Métodos de cocción', unit: 3 },
  { key: 'seafood', name: 'Pescados, mariscos y otros alimentos', unit: 3 },
  { key: 'sides', name: 'Acompañamientos, salsas y aderezos', unit: 3 },
  { key: 'brunch', name: 'Desayuno y brunch', unit: 3 },
  { key: 'meat', name: 'Cortes y términos de carne', unit: 4 },
  { key: 'mods', name: 'Modificaciones y sustituciones', unit: 4 },
  { key: 'numbers', name: 'Cantidades, números, horarios y precios', unit: 4 },
  { key: 'allergy', name: 'Alergias y restricciones alimentarias', unit: 5 },
  { key: 'tableware', name: 'Utensilios, vajilla y organización de la mesa', unit: 6 },
  { key: 'service', name: 'Seguimiento del servicio y retirada de platos', unit: 6 },
  { key: 'team', name: 'Comunicación con cocina, barra, anfitrión y compañeros', unit: 6 },
  { key: 'clarify', name: 'Pedir aclaraciones y entender a los clientes', unit: 6 },
  { key: 'problems', name: 'Demoras, errores, quejas y escalamiento', unit: 7 },
  { key: 'check', name: 'Cuenta, pagos, recibos y despedida', unit: 8 },
  { key: 'togo', name: 'Pedidos para llevar', unit: 8 },
];

export const CATEGORIES = CATEGORY_LIST.map((c) => c.name);
export const CATEGORY_BY_KEY = new Map(CATEGORY_LIST.map((c) => [c.key, c]));

/** Convierte filas compactas en entradas. Fila: [id, en, es, dificultad, frase, cliente, respuesta, alts, notas]. */
export function rows(key, list) {
  const cat = CATEGORY_BY_KEY.get(key);
  return list.map(([id, en, es, difficulty, phrase, guest, reply, alts = [], notes = null]) => ({
    id, en, es, difficulty, phrase, guest, reply, alts, notes, category: cat.name, unit: cat.unit,
  }));
}
