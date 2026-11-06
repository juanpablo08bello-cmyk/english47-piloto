// Menu ficticio compartido. Para usar un menu real basta con sustituir este archivo:
// las lecciones no dependen de el; los escenarios solo citan ids de platos.
export const MENU = {
  restaurant: 'Harbor 47 (restaurante ficticio)',
  priceNote: 'Precios de ejemplo para practicar, no son de un restaurante real.',
  policies: [
    'Cambiar un plato mal preparado está permitido, sin costo.',
    'Descuentos, platos gratis o reembolsos: solo el gerente puede autorizarlos.',
    'La propina sigue la política de cada local; el mesero no la sugiere como obligatoria.',
    'Se puede dividir la cuenta hasta en 4 pagos.',
  ],
  allergyRule: 'La cocina confirma cada alergia. El mesero nunca garantiza que un plato sea seguro sin consultar.',
  dishes: [
    { id: 'ribeye', name: '12 oz Ribeye', price: 46, kind: 'main',
      description: 'Grilled ribeye with herb butter.', ingredients: ['beef', 'butter', 'garlic', 'thyme'],
      sides: 'Comes with one side.', mods: ['Any temperature, from rare to well done', 'Butter on the side'],
      allergyNotes: 'Contains dairy (butter).' },
    { id: 'snapper', name: 'Grilled Snapper', price: 38, kind: 'main',
      description: 'Local snapper, grilled, with lemon and capers.', ingredients: ['snapper', 'lemon', 'capers', 'olive oil'],
      sides: 'Comes with one side.', mods: ['Sauce on the side', 'Blackened instead of grilled'],
      allergyNotes: 'Contains fish. Ask the kitchen about anything else.' },
    { id: 'chicken', name: 'Roasted Half Chicken', price: 29, kind: 'main',
      description: 'Roasted half chicken with garlic and rosemary.', ingredients: ['chicken', 'garlic', 'rosemary', 'white wine'],
      sides: 'Comes with one side.', mods: ['White meat only for an extra $4'],
      allergyNotes: 'Ask the kitchen.' },
    { id: 'pasta', name: 'Shrimp Linguine', price: 31, kind: 'main',
      description: 'Linguine with shrimp, garlic, white wine and cherry tomatoes.', ingredients: ['pasta', 'shrimp', 'garlic', 'white wine', 'tomato', 'butter'],
      sides: 'No side included.', mods: ['No shrimp, add chicken'],
      allergyNotes: 'Contains shellfish, gluten and dairy.' },
    { id: 'burger', name: 'Harbor Burger', price: 21, kind: 'main',
      description: 'Half-pound burger with cheddar, lettuce, tomato and house sauce.', ingredients: ['beef', 'bun', 'cheddar', 'lettuce', 'tomato', 'house sauce'],
      sides: 'Comes with fries or salad.', mods: ['No cheese', 'Gluten-free bun: ask the kitchen'],
      allergyNotes: 'Contains gluten and dairy. House sauce: ask the kitchen.' },
    { id: 'caesar', name: 'Caesar Salad', price: 14, kind: 'starter',
      description: 'Romaine, parmesan, croutons and Caesar dressing.', ingredients: ['romaine', 'parmesan', 'croutons', 'Caesar dressing'],
      sides: '', mods: ['Dressing on the side', 'No croutons', 'Add grilled chicken for $8'],
      allergyNotes: 'Contains dairy, gluten and anchovy.' },
    { id: 'calamari', name: 'Crispy Calamari', price: 17, kind: 'starter',
      description: 'Fried calamari with spicy tomato sauce.', ingredients: ['calamari', 'flour', 'tomato', 'chili'],
      sides: '', mods: ['Sauce on the side'], allergyNotes: 'Contains shellfish and gluten. Fried in shared oil: ask the kitchen.' },
    { id: 'fries', name: 'Hand-cut Fries', price: 8, kind: 'side', description: 'Hand-cut fries.', ingredients: ['potato'], sides: '', mods: [], allergyNotes: 'Shared fryer: ask the kitchen.' },
    { id: 'asparagus', name: 'Grilled Asparagus', price: 9, kind: 'side', description: 'Grilled asparagus with olive oil.', ingredients: ['asparagus', 'olive oil'], sides: '', mods: [], allergyNotes: 'Ask the kitchen.' },
    { id: 'mash', name: 'Mashed Potatoes', price: 8, kind: 'side', description: 'Mashed potatoes with butter.', ingredients: ['potato', 'butter', 'cream'], sides: '', mods: [], allergyNotes: 'Contains dairy.' },
    { id: 'cake', name: 'Key Lime Pie', price: 11, kind: 'dessert', description: 'Key lime pie with a graham cracker crust.', ingredients: ['lime', 'condensed milk', 'egg', 'graham cracker'], sides: '', mods: [], allergyNotes: 'Contains dairy, egg and gluten.' },
    { id: 'still', name: 'Still water', price: 0, kind: 'drink', description: 'Filtered still water.', ingredients: [], sides: '', mods: ['With or without ice'], allergyNotes: '' },
    { id: 'sparkling', name: 'Sparkling water', price: 7, kind: 'drink', description: 'Bottle of sparkling water.', ingredients: [], sides: '', mods: [], allergyNotes: '' },
    { id: 'iced_tea', name: 'Iced tea', price: 4, kind: 'drink', description: 'Unsweetened iced tea. Free refills.', ingredients: [], sides: '', mods: [], allergyNotes: '' },
    { id: 'mojito', name: 'House Mojito', price: 15, kind: 'drink', description: 'Rum, mint, lime and soda.', ingredients: [], sides: '', mods: ['Can be made without alcohol'], allergyNotes: '' },
  ],
};

export function menuFor(dishIds) {
  return MENU.dishes.filter((d) => dishIds.includes(d.id));
}
