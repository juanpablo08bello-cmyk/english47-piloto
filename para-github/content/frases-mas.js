// Segunda tanda de frases para principiantes. Mismo formato que content/frases.js.
const f = (topic, id, en, es, ...words) => ({ id, topic, en, es, words });

export const FRASES_MAS = [
  // Recibir
  f('recibir', 'good_afternoon', 'Good afternoon.', 'Buenas tardes.', ['Good', 'buena'], ['afternoon', 'tarde']),
  f('recibir', 'nice_to_see', 'Nice to see you again.', 'Qué gusto verlos de nuevo.', ['Nice', 'qué gusto'], ['to see', 'ver'], ['you', 'a ustedes'], ['again', 'otra vez']),
  f('recibir', 'table_for', 'A table for two?', '¿Una mesa para dos?', ['A', 'una'], ['table', 'mesa'], ['for', 'para'], ['two', 'dos']),
  f('recibir', 'inside_outside', 'Inside or outside?', '¿Adentro o afuera?', ['Inside', 'adentro'], ['or', 'o'], ['outside', 'afuera']),
  f('recibir', 'follow_me', 'Please follow me.', 'Síganme, por favor.', ['Please', 'por favor'], ['follow', 'sigan'], ['me', 'a mí']),
  f('recibir', 'your_table', 'Here is your table.', 'Aquí está su mesa.', ['Here is', 'aquí está'], ['your', 'su'], ['table', 'mesa']),
  f('recibir', 'server_right', 'Your server will be right with you.', 'Su mesero viene enseguida.', ['Your', 'su'], ['server', 'mesero'], ['will be', 'estará'], ['right', 'enseguida'], ['with you', 'con ustedes']),
  f('recibir', 'be_your_server', 'I will be your server.', 'Yo los voy a atender.', ['I will', 'yo voy a'], ['be', 'ser'], ['your', 'su'], ['server', 'mesero']),

  // Espera y reservas
  f('espera', 'how_long', 'It is about a fifteen minute wait.', 'Son unos quince minutos de espera.', ['It is', 'es'], ['about', 'alrededor de'], ['a fifteen', 'unos quince'], ['minute', 'minutos'], ['wait', 'espera']),
  f('espera', 'wait_bar', 'You can wait at the bar.', 'Pueden esperar en la barra.', ['You can', 'pueden'], ['wait', 'esperar'], ['at', 'en'], ['the', 'la'], ['bar', 'barra']),
  f('espera', 'table_ready', 'Your table is ready.', 'Su mesa está lista.', ['Your', 'su'], ['table', 'mesa'], ['is', 'está'], ['ready', 'lista']),
  f('espera', 'thanks_waiting', 'Thanks for waiting.', 'Gracias por esperar.', ['Thanks', 'gracias'], ['for', 'por'], ['waiting', 'esperar']),
  f('espera', 'phone_number', 'Can I get your phone number?', '¿Me da su número de teléfono?', ['Can I', '¿puedo?'], ['get', 'tener'], ['your', 'su'], ['phone number', 'número de teléfono']),
  f('espera', 'we_are_full', 'We are full right now.', 'Estamos llenos ahora mismo.', ['We are', 'estamos'], ['full', 'llenos'], ['right now', 'ahora mismo']),
  f('espera', 'we_will_call', 'We will call your name.', 'Vamos a llamar su nombre.', ['We will', 'vamos a'], ['call', 'llamar'], ['your', 'su'], ['name', 'nombre']),
  f('espera', 'how_many_kids', 'Are there any children?', '¿Vienen niños?', ['Are there', '¿hay?'], ['any', 'algunos'], ['children', 'niños']),

  // Bebidas
  f('bebidas', 'start_water', 'Can I start you with some water?', '¿Les traigo agua para empezar?', ['Can I', '¿puedo?'], ['start you', 'empezar con ustedes'], ['with', 'con'], ['some', 'algo de'], ['water', 'agua']),
  f('bebidas', 'large_small', 'Small or large?', '¿Chico o grande?', ['Small', 'chico'], ['or', 'o'], ['large', 'grande']),
  f('bebidas', 'with_lemon', 'Would you like lemon?', '¿Quiere limón?', ['Would you like', '¿le gustaría?'], ['lemon', 'limón']),
  f('bebidas', 'more_water', 'Would you like more water?', '¿Quieren más agua?', ['Would you like', '¿le gustaría?'], ['more', 'más'], ['water', 'agua']),
  f('bebidas', 'tea_refills', 'Iced tea refills are free.', 'Puede rellenar el té helado gratis.', ['Iced tea', 'té helado'], ['refills', 'rellenos'], ['are', 'son'], ['free', 'gratis']),
  f('bebidas', 'coffee_black', 'Would you like milk or sugar?', '¿Quiere leche o azúcar?', ['Would you like', '¿le gustaría?'], ['milk', 'leche'], ['or', 'o'], ['sugar', 'azúcar']),
  f('bebidas', 'be_careful_glass', 'Here is your drink.', 'Aquí está su bebida.', ['Here is', 'aquí está'], ['your', 'su'], ['drink', 'bebida']),

  // Vinos y cócteles
  f('vinos', 'red_or_white', 'Red or white wine?', '¿Vino tinto o blanco?', ['Red', 'tinto'], ['or', 'o'], ['white', 'blanco'], ['wine', 'vino']),
  f('vinos', 'by_glass', 'By the glass or the bottle?', '¿Por copa o por botella?', ['By', 'por'], ['the', 'la'], ['glass', 'copa'], ['or', 'o'], ['the', 'la'], ['bottle', 'botella']),
  f('vinos', 'see_id', 'Can I see your ID, please?', '¿Me muestra su identificación, por favor?', ['Can I', '¿puedo?'], ['see', 'ver'], ['your', 'su'], ['ID', 'identificación'], ['please', 'por favor']),
  f('vinos', 'beer_list', 'We have beer on tap.', 'Tenemos cerveza de barril.', ['We have', 'tenemos'], ['beer', 'cerveza'], ['on tap', 'de barril']),
  f('vinos', 'mojito_mint', 'The mojito has rum and mint.', 'El mojito tiene ron y menta.', ['The', 'el'], ['mojito', 'mojito'], ['has', 'tiene'], ['rum', 'ron'], ['and', 'y'], ['mint', 'menta']),
  f('vinos', 'another_round', 'Would you like another one?', '¿Quiere otro?', ['Would you like', '¿le gustaría?'], ['another', 'otro'], ['one', 'uno']),
  f('vinos', 'cheers', 'Cheers, enjoy your drinks!', '¡Salud, disfruten sus bebidas!', ['Cheers', 'salud'], ['enjoy', 'disfruten'], ['your', 'sus'], ['drinks', 'bebidas']),

  // Menu
  f('menu', 'specials', 'Would you like to hear our specials?', '¿Quieren oír nuestras especialidades?', ['Would you like', '¿le gustaría?'], ['to hear', 'oír'], ['our', 'nuestras'], ['specials', 'especialidades']),
  f('menu', 'starter', 'Would you like a starter?', '¿Quieren una entrada?', ['Would you like', '¿le gustaría?'], ['a', 'una'], ['starter', 'entrada']),
  f('menu', 'share', 'This is good to share.', 'Esto es bueno para compartir.', ['This', 'esto'], ['is', 'es'], ['good', 'bueno'], ['to share', 'para compartir']),
  f('menu', 'come_back_minute', "I'll give you a minute.", 'Les doy un minuto.', ["I'll give", 'yo doy'], ['you', 'les'], ['a', 'un'], ['minute', 'minuto']),
  f('menu', 'ask_questions', 'Do you have any questions?', '¿Tienen alguna pregunta?', ['Do you have', '¿tienen?'], ['any', 'alguna'], ['questions', 'preguntas']),
  f('menu', 'kitchen_closes', 'The kitchen closes at ten.', 'La cocina cierra a las diez.', ['The', 'la'], ['kitchen', 'cocina'], ['closes', 'cierra'], ['at', 'a las'], ['ten', 'diez']),

  // Platos
  f('platos', 'it_is_spicy', 'It is a little spicy.', 'Es un poco picante.', ['It is', 'es'], ['a little', 'un poco'], ['spicy', 'picante']),
  f('platos', 'not_spicy', 'It is not spicy.', 'No es picante.', ['It is', 'es'], ['not', 'no'], ['spicy', 'picante']),
  f('platos', 'made_with', 'It is made with butter.', 'Está hecho con mantequilla.', ['It is', 'está'], ['made', 'hecho'], ['with', 'con'], ['butter', 'mantequilla']),
  f('platos', 'fried', 'The calamari is fried.', 'El calamar es frito.', ['The', 'el'], ['calamari', 'calamar'], ['is', 'es'], ['fried', 'frito']),
  f('platos', 'roasted', 'The chicken is roasted.', 'El pollo es al horno.', ['The', 'el'], ['chicken', 'pollo'], ['is', 'es'], ['roasted', 'al horno']),
  f('platos', 'fresh_fish', 'The fish comes with lemon.', 'El pescado viene con limón.', ['The', 'el'], ['fish', 'pescado'], ['comes', 'viene'], ['with', 'con'], ['lemon', 'limón']),
  f('platos', 'vegetarian', 'The tomato soup has no meat.', 'La sopa de tomate no tiene carne.', ['The', 'la'], ['tomato', 'tomate'], ['soup', 'sopa'], ['has', 'tiene'], ['no', 'ninguna'], ['meat', 'carne']),
  f('platos', 'with_cheese', 'Would you like cheese on it?', '¿Le pongo queso?', ['Would you like', '¿le gustaría?'], ['cheese', 'queso'], ['on it', 'encima']),
  f('platos', 'mashed', 'We have mashed potatoes.', 'Tenemos puré de papas.', ['We have', 'tenemos'], ['mashed', 'en puré'], ['potatoes', 'papas']),

  // Orden
  f('orden', 'for_you', 'And for you?', '¿Y para usted?', ['And', 'y'], ['for', 'para'], ['you', 'usted']),
  f('orden', 'ill_have', "I'll put that in for you.", 'Le paso el pedido a la cocina.', ["I'll put", 'yo pongo'], ['that', 'eso'], ['in', 'en cocina'], ['for you', 'para usted']),
  f('orden', 'what_side', 'What side would you like?', '¿Qué acompañamiento quiere?', ['What', 'qué'], ['side', 'acompañamiento'], ['would you like', 'le gustaría']),
  f('orden', 'on_the_side', 'I will put the sauce on the side.', 'Le pongo la salsa aparte.', ['I will', 'yo voy a'], ['put', 'poner'], ['the', 'la'], ['sauce', 'salsa'], ['on the side', 'aparte']),
  f('orden', 'without', 'You want it without cheese?', '¿Lo quiere sin queso?', ['You want', '¿quiere?'], ['it', 'lo'], ['without', 'sin'], ['cheese', 'queso']),
  f('orden', 'perfect', 'Perfect, thank you.', 'Perfecto, gracias.', ['Perfect', 'perfecto'], ['thank you', 'gracias']),
  f('orden', 'is_that_all', 'Is that everything?', '¿Eso es todo?', ['Is that', '¿eso es?'], ['everything', 'todo']),
  f('orden', 'coming_right_up', 'Your food is coming soon.', 'Su comida viene pronto.', ['Your', 'su'], ['food', 'comida'], ['is coming', 'viene'], ['soon', 'pronto']),

  // Carne
  f('carne', 'rare', 'Rare is red inside.', 'Poco cocido es rojo por dentro.', ['Rare', 'poco cocido'], ['is', 'es'], ['red', 'rojo'], ['inside', 'por dentro']),
  f('carne', 'medium', 'Medium is pink inside.', 'Medio es rosado por dentro.', ['Medium', 'término medio'], ['is', 'es'], ['pink', 'rosado'], ['inside', 'por dentro']),
  f('carne', 'well_done', 'Well done has no pink.', 'Bien cocido no tiene rosado.', ['Well done', 'bien cocido'], ['has', 'tiene'], ['no', 'nada de'], ['pink', 'rosado']),
  f('carne', 'takes_longer', 'Well done takes a little longer.', 'Bien cocido tarda un poco más.', ['Well done', 'bien cocido'], ['takes', 'tarda'], ['a little', 'un poco'], ['longer', 'más']),
  f('carne', 'steak_knife', 'Here is your steak knife.', 'Aquí está su cuchillo para carne.', ['Here is', 'aquí está'], ['your', 'su'], ['steak knife', 'cuchillo para carne']),
  f('carne', 'how_is_steak', 'Is your steak okay?', '¿Está bien su carne?', ['Is', '¿está?'], ['your', 'su'], ['steak', 'carne'], ['okay', 'bien']),

  // Alergias
  f('alergias', 'allergic_to_what', 'What are you allergic to?', '¿A qué es alérgico?', ['What', 'qué'], ['are you', 'es usted'], ['allergic', 'alérgico'], ['to', 'a']),
  f('alergias', 'tell_kitchen', 'I will tell the kitchen right away.', 'Le aviso a la cocina enseguida.', ['I will', 'yo voy a'], ['tell', 'decirle a'], ['the', 'la'], ['kitchen', 'cocina'], ['right away', 'enseguida']),
  f('alergias', 'not_sure', "I'm not sure. Let me ask.", 'No estoy seguro. Déjeme preguntar.', ["I'm", 'estoy'], ['not', 'no'], ['sure', 'seguro'], ['Let me', 'déjeme'], ['ask', 'preguntar']),
  f('alergias', 'contains_nuts', 'This dish may contain nuts.', 'Este plato puede tener nueces.', ['This', 'este'], ['dish', 'plato'], ['may', 'puede'], ['contain', 'contener'], ['nuts', 'nueces']),
  f('alergias', 'gluten', 'The bread has gluten.', 'El pan tiene gluten.', ['The', 'el'], ['bread', 'pan'], ['has', 'tiene'], ['gluten', 'gluten']),
  f('alergias', 'how_serious', 'Is it a serious allergy?', '¿Es una alergia grave?', ['Is it', '¿es?'], ['a', 'una'], ['serious', 'grave'], ['allergy', 'alergia']),

  // Servicio
  f('servicio', 'everything_okay', 'Is everything okay?', '¿Todo bien?', ['Is', '¿está?'], ['everything', 'todo'], ['okay', 'bien']),
  f('servicio', 'still_working', 'Are you still working on that?', '¿Sigue comiendo eso?', ['Are you', '¿está?'], ['still', 'todavía'], ['working on', 'comiendo'], ['that', 'eso']),
  f('servicio', 'all_done', 'Are you all done?', '¿Ya terminaron?', ['Are you', '¿están?'], ['all', 'todos'], ['done', 'terminados']),
  f('servicio', 'clear_plates', 'May I take your plates?', '¿Puedo llevarme sus platos?', ['May I', '¿puedo?'], ['take', 'llevarme'], ['your', 'sus'], ['plates', 'platos']),
  f('servicio', 'more_bread', 'Would you like more bread?', '¿Quieren más pan?', ['Would you like', '¿le gustaría?'], ['more', 'más'], ['bread', 'pan']),
  f('servicio', 'napkins', 'Here are some napkins.', 'Aquí tiene unas servilletas.', ['Here are', 'aquí hay'], ['some', 'unas'], ['napkins', 'servilletas']),
  f('servicio', 'new_fork', 'Let me bring you a new fork.', 'Le traigo un tenedor nuevo.', ['Let me', 'déjeme'], ['bring', 'traer'], ['you', 'le'], ['a new', 'un nuevo'], ['fork', 'tenedor']),
  f('servicio', 'restroom', 'The restroom is in the back.', 'El baño está al fondo.', ['The', 'el'], ['restroom', 'baño'], ['is', 'está'], ['in', 'en'], ['the', 'el'], ['back', 'fondo']),
  f('servicio', 'on_the_right', 'It is on the right.', 'Está a la derecha.', ['It is', 'está'], ['on', 'a'], ['the', 'la'], ['right', 'derecha']),
  f('servicio', 'careful_behind', 'Excuse me, behind you.', 'Disculpe, voy detrás de usted.', ['Excuse me', 'disculpe'], ['behind', 'detrás de'], ['you', 'usted']),
  f('servicio', 'food_ready', 'Your food is ready.', 'Su comida está lista.', ['Your', 'su'], ['food', 'comida'], ['is', 'está'], ['ready', 'lista']),

  // Postre
  f('postre', 'save_room', 'Did you save room for dessert?', '¿Les quedó espacio para el postre?', ['Did you', '¿ustedes?'], ['save', 'guardaron'], ['room', 'espacio'], ['for', 'para'], ['dessert', 'postre']),
  f('postre', 'key_lime', 'We have key lime pie.', 'Tenemos pie de limón.', ['We have', 'tenemos'], ['key lime', 'limón'], ['pie', 'pastel']),
  f('postre', 'cheesecake', 'The cheesecake is very good.', 'El pastel de queso está muy bueno.', ['The', 'el'], ['cheesecake', 'pastel de queso'], ['is', 'está'], ['very', 'muy'], ['good', 'bueno']),
  f('postre', 'two_spoons', 'Would you like two spoons?', '¿Quieren dos cucharas?', ['Would you like', '¿le gustaría?'], ['two', 'dos'], ['spoons', 'cucharas']),
  f('postre', 'any_coffee', 'Would you like coffee?', '¿Quieren café?', ['Would you like', '¿le gustaría?'], ['coffee', 'café']),
  f('postre', 'happy_birthday', 'Happy birthday!', '¡Feliz cumpleaños!', ['Happy', 'feliz'], ['birthday', 'cumpleaños']),
  f('postre', 'congrats', 'Congratulations!', '¡Felicidades!', ['Congratulations', 'felicidades']),

  // Problemas
  f('problemas', 'wrong_dish', 'Let me check your order.', 'Déjeme revisar su orden.', ['Let me', 'déjeme'], ['check', 'revisar'], ['your', 'su'], ['order', 'orden']),
  f('problemas', 'sorry_wait', 'Sorry for the wait.', 'Perdón por la espera.', ['Sorry', 'perdón'], ['for', 'por'], ['the', 'la'], ['wait', 'espera']),
  f('problemas', 'send_back', 'I will send it back to the kitchen.', 'Lo devuelvo a la cocina.', ['I will', 'yo voy a'], ['send', 'enviar'], ['it', 'lo'], ['back', 'de vuelta'], ['to', 'a'], ['the', 'la'], ['kitchen', 'cocina']),
  f('problemas', 'too_cold', "I'm sorry it is cold.", 'Lamento que esté frío.', ["I'm sorry", 'lo siento'], ['it is', 'está'], ['cold', 'frío']),
  f('problemas', 'get_manager', 'Let me get my manager.', 'Déjeme llamar a mi gerente.', ['Let me', 'déjeme'], ['get', 'traer'], ['my', 'mi'], ['manager', 'gerente']),
  f('problemas', 'understand_you', 'I understand. Thank you for telling me.', 'Entiendo. Gracias por decírmelo.', ['I understand', 'entiendo'], ['Thank you', 'gracias'], ['for', 'por'], ['telling me', 'decírmelo']),
  f('problemas', 'right_away', 'I will fix it right away.', 'Lo arreglo enseguida.', ['I will', 'yo voy a'], ['fix', 'arreglar'], ['it', 'lo'], ['right away', 'enseguida']),
  f('problemas', 'spilled', 'Let me clean that up.', 'Déjeme limpiar eso.', ['Let me', 'déjeme'], ['clean', 'limpiar'], ['that', 'eso'], ['up', 'por completo']),

  // Cuenta
  f('cuenta', 'no_rush', 'No rush. Pay when you are ready.', 'Sin prisa. Paguen cuando estén listos.', ['No', 'sin'], ['rush', 'prisa'], ['Pay', 'paguen'], ['when', 'cuando'], ['you are', 'estén'], ['ready', 'listos']),
  f('cuenta', 'together', 'Together or separate?', '¿Juntos o separados?', ['Together', 'juntos'], ['or', 'o'], ['separate', 'separados']),
  f('cuenta', 'tap_card', 'You can tap your card here.', 'Puede acercar su tarjeta aquí.', ['You can', 'puede'], ['tap', 'acercar'], ['your', 'su'], ['card', 'tarjeta'], ['here', 'aquí']),
  f('cuenta', 'sign_here', 'Please sign here.', 'Firme aquí, por favor.', ['Please', 'por favor'], ['sign', 'firme'], ['here', 'aquí']),
  f('cuenta', 'tip_included', 'Let me check about the tip.', 'Déjeme consultar lo de la propina.', ['Let me', 'déjeme'], ['check', 'consultar'], ['about', 'sobre'], ['the', 'la'], ['tip', 'propina']),
  f('cuenta', 'your_change', 'Here is your change.', 'Aquí está su cambio.', ['Here is', 'aquí está'], ['your', 'su'], ['change', 'cambio']),
  f('cuenta', 'email_receipt', 'Do you need a receipt?', '¿Necesita recibo?', ['Do you need', '¿necesita?'], ['a', 'un'], ['receipt', 'recibo']),

  // Despedida
  f('despedida', 'take_care', 'Take care!', '¡Cuídense!', ['Take', 'tengan'], ['care', 'cuidado']),
  f('despedida', 'good_night', 'Good night!', '¡Buenas noches!', ['Good', 'buena'], ['night', 'noche']),
  f('despedida', 'come_again', 'Please come again.', 'Vuelvan pronto, por favor.', ['Please', 'por favor'], ['come', 'vengan'], ['again', 'otra vez']),
  f('despedida', 'pleasure', 'It was a pleasure.', 'Fue un placer.', ['It was', 'fue'], ['a', 'un'], ['pleasure', 'placer']),
  f('despedida', 'enjoy_miami', 'Enjoy your time in Miami!', '¡Disfruten su tiempo en Miami!', ['Enjoy', 'disfruten'], ['your', 'su'], ['time', 'tiempo'], ['in', 'en'], ['Miami', 'Miami']),
  f('despedida', 'dont_forget', 'Do not forget your bag.', 'No olvide su bolsa.', ['Do not', 'no'], ['forget', 'olvide'], ['your', 'su'], ['bag', 'bolsa']),

  // Para llevar
  f('llevar', 'for_here', 'For here or to go?', '¿Para aquí o para llevar?', ['For', 'para'], ['here', 'aquí'], ['or', 'o'], ['to go', 'para llevar']),
  f('llevar', 'pack_it', 'I will pack that for you.', 'Se lo empaco.', ['I will', 'yo voy a'], ['pack', 'empacar'], ['that', 'eso'], ['for you', 'para usted']),
  f('llevar', 'pickup_name', 'What name is the order under?', '¿A qué nombre está el pedido?', ['What', 'qué'], ['name', 'nombre'], ['is', 'está'], ['the', 'el'], ['order', 'pedido'], ['under', 'bajo']),
  f('llevar', 'ten_minutes', 'It will be ready in ten minutes.', 'Estará listo en diez minutos.', ['It will be', 'estará'], ['ready', 'listo'], ['in', 'en'], ['ten', 'diez'], ['minutes', 'minutos']),
  f('llevar', 'bag_for_you', 'Would you like a bag?', '¿Quiere una bolsa?', ['Would you like', '¿le gustaría?'], ['a', 'una'], ['bag', 'bolsa']),
  f('llevar', 'here_is_order', 'Here is your order.', 'Aquí está su pedido.', ['Here is', 'aquí está'], ['your', 'su'], ['order', 'pedido']),

  // Familias
  f('familias', 'high_chair', 'Would you like a high chair?', '¿Quieren una silla para bebé?', ['Would you like', '¿le gustaría?'], ['a', 'una'], ['high chair', 'silla para bebé']),
  f('familias', 'crayons', 'Here are some crayons for the kids.', 'Aquí tienen crayones para los niños.', ['Here are', 'aquí hay'], ['some', 'unos'], ['crayons', 'crayones'], ['for', 'para'], ['the', 'los'], ['kids', 'niños']),
  f('familias', 'kids_share', 'The kids can share a plate.', 'Los niños pueden compartir un plato.', ['The', 'los'], ['kids', 'niños'], ['can', 'pueden'], ['share', 'compartir'], ['a', 'un'], ['plate', 'plato']),
  f('familias', 'stroller', 'You can put the stroller here.', 'Puede poner el coche de bebé aquí.', ['You can', 'puede'], ['put', 'poner'], ['the', 'el'], ['stroller', 'coche de bebé'], ['here', 'aquí']),
  f('familias', 'how_old', 'How old is your son?', '¿Cuántos años tiene su hijo?', ['How old', 'qué edad'], ['is', 'tiene'], ['your', 'su'], ['son', 'hijo']),

  // Charla
  f('charla', 'where_from', 'Where are you from?', '¿De dónde son?', ['Where', 'dónde'], ['are you', 'son ustedes'], ['from', 'de']),
  f('charla', 'first_time', 'Is this your first time here?', '¿Es su primera vez aquí?', ['Is this', '¿es esta?'], ['your', 'su'], ['first', 'primera'], ['time', 'vez'], ['here', 'aquí']),
  f('charla', 'having_good_night', 'Are you having a good night?', '¿Están pasando buena noche?', ['Are you', '¿están?'], ['having', 'pasando'], ['a', 'una'], ['good', 'buena'], ['night', 'noche']),
  f('charla', 'im_good', "I'm doing well, thank you.", 'Estoy bien, gracias.', ["I'm", 'estoy'], ['doing', 'haciendo'], ['well', 'bien'], ['thank you', 'gracias']),
  f('charla', 'nice_weather', 'It is a beautiful day.', 'Es un día hermoso.', ['It is', 'es'], ['a', 'un'], ['beautiful', 'hermoso'], ['day', 'día']),
  f('charla', 'beach_today', 'Did you go to the beach today?', '¿Fueron a la playa hoy?', ['Did you', '¿ustedes?'], ['go', 'fueron'], ['to', 'a'], ['the', 'la'], ['beach', 'playa'], ['today', 'hoy']),
  f('charla', 'photo', 'Would you like me to take a picture?', '¿Quieren que les tome una foto?', ['Would you like', '¿le gustaría?'], ['me', 'que yo'], ['to take', 'tome'], ['a', 'una'], ['picture', 'foto']),

  // Con compañeros
  f('equipo', 'table_ready_team', 'Table five is ready.', 'La mesa cinco está lista.', ['Table', 'mesa'], ['five', 'cinco'], ['is', 'está'], ['ready', 'lista']),
  f('equipo', 'need_help', 'Can you help me, please?', '¿Me ayudas, por favor?', ['Can you', '¿puedes?'], ['help', 'ayudar'], ['me', 'me'], ['please', 'por favor']),
  f('equipo', 'order_in', 'The order is in.', 'El pedido ya entró.', ['The', 'el'], ['order', 'pedido'], ['is', 'está'], ['in', 'adentro']),
  f('equipo', 'allergy_note', 'This table has an allergy.', 'Esta mesa tiene una alergia.', ['This', 'esta'], ['table', 'mesa'], ['has', 'tiene'], ['an', 'una'], ['allergy', 'alergia']),
  f('equipo', 'running_food', 'I am running food.', 'Estoy llevando comida.', ['I am', 'estoy'], ['running', 'llevando'], ['food', 'comida']),
  f('equipo', 'hot_behind', 'Hot plate, behind you.', 'Plato caliente, detrás de ti.', ['Hot', 'caliente'], ['plate', 'plato'], ['behind', 'detrás de'], ['you', 'ti']),
  f('equipo', 'on_break', 'I am going on break.', 'Me voy a mi descanso.', ['I am', 'estoy'], ['going', 'yendo'], ['on', 'a'], ['break', 'descanso']),
];
