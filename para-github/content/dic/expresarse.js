// Tablas «Expresarse»: frases cortas para hablar con la mesa, recomendar, describir, vender, resolver y despedirse.
// Cada línea: inglés | cómo suena | español | nivel (1 fácil a 4 difícil).
export const TABLAS_EXPRESARSE = [
  {
    id: 'charla-con-la-mesa',
    title: 'Charla con la mesa',
    desc: 'Para conversar un momento con los clientes: de dónde son, el clima, Miami.',
    grupo: 'expresarse',
    text: `Where are you from?|uér ar yu from|¿de dónde son?|1
Are you visiting Miami?|ar yu vísiting maiámi|¿están de visita en Miami?|1
Is this your first time here?|is dis yor ferst táim jíar|¿es su primera vez aquí?|2
How long are you staying?|jáu long ar yu stéiing|¿cuánto tiempo se quedan?|2
Where are you staying?|uér ar yu stéiing|¿dónde se hospedan?|2
Welcome to Miami|uélcom tu maiámi|bienvenidos a Miami|1
Welcome to our restaurant|uélcom tu áuar réstorant|bienvenidos a nuestro restaurante|1
It is a beautiful day|it is a biútiful déi|es un día hermoso|1
It is really hot today|it is ríli jot tudéi|hoy hace mucho calor|1
It is a little cold tonight|it is a lítl cóuld tunáit|esta noche hace algo de frío|2
Beautiful weather, right?|biútiful uéder ráit|qué lindo clima, ¿verdad?|2
It might rain later|it máit réin léiter|quizás llueva más tarde|2
Did you go to the beach?|did yu góu tu de bích|¿fueron a la playa?|1
The beach is close by|de bích is clóus bái|la playa queda cerca|2
Have you been to South Beach?|jav yu bin tu sáuz bích|¿han estado en South Beach?|2
Are you here for vacation?|ar yu jíar for vakéishon|¿están aquí de vacaciones?|2
Are you here for work?|ar yu jíar for uerk|¿están aquí por trabajo?|2
Do you live nearby?|du yu liv nírbai|¿viven cerca?|2
Is it a special occasion?|is it a spéshal okéishon|¿es una ocasión especial?|2
Happy birthday!|jápi bérzdei|¡feliz cumpleaños!|1
Congratulations!|kongratiuléishons|¡felicidades!|2
Happy anniversary!|jápi anivérsari|¡feliz aniversario!|2
Are you celebrating something?|ar yu sélebreiting sámzing|¿están celebrando algo?|3
What a lovely family|uát a lávli fámili|qué linda familia|2
What a cute baby|uát a kiút béibi|qué bebé tan lindo|1
Your kids are so polite|yor kids ar sóu poláit|sus niños son muy educados|3
Is that your first trip?|is dat yor ferst trip|¿es su primer viaje?|2
How do you like Miami?|jáu du yu láik maiámi|¿qué tal les parece Miami?|2
Miami is very busy now|maiámi is véri bízi náu|Miami está muy lleno ahora|2
There is a lot to do here|der is a lot tu du jíar|aquí hay mucho que hacer|2
The sunset is amazing here|de sánset is améising jíar|el atardecer aquí es increíble|3
Do you like music?|du yu láik miúsik|¿les gusta la música?|1
We have live music tonight|uí jav láiv miúsik tunáit|esta noche hay música en vivo|2
The band starts at eight|de band starts at éit|la banda empieza a las ocho|2
Did you have a good day?|did yu jav a gud déi|¿tuvieron un buen día?|2
Did you find parking?|did yu fáind párking|¿encontraron estacionamiento?|2
Traffic is crazy today|tráfik is créisi tudéi|el tráfico está loco hoy|2
It is nice to see you|it is náis tu sí yu|qué gusto verlos|2
I love your shirt|ái lov yor shert|me encanta su camisa|1
Enjoy your evening|enyói yor ívning|disfruten la noche|1
Make yourselves at home|méik yorsélvs at jóum|siéntanse como en casa|3`,
  },
  {
    id: 'recomendar-con-razones',
    title: 'Recomendar con razones',
    desc: 'Para sugerir un plato y explicar por qué vale la pena.',
    grupo: 'expresarse',
    text: `I recommend the snapper|ái rekoménd de snáper|le recomiendo el pargo|1
I suggest the ribeye|ái sagyést de ríbai|le sugiero el ribeye|2
This is our best seller|dis is áuar best séler|este es el más vendido|2
Everyone loves this dish|évriuan lovs dis dish|a todos les encanta este plato|2
It is my personal favorite|it is mai pérsonal féivorit|es mi favorito personal|2
It is the chef's specialty|it is de shefs spéshalti|es la especialidad del chef|3
The fish is very fresh|de fish is véri fresh|el pescado es muy fresco|1
It comes straight from the dock|it koms stréit from de dok|llega directo del muelle|3
We make it from scratch|uí méik it from skrach|lo hacemos desde cero|3
It is made fresh every day|it is méid fresh évri déi|se hace fresco cada día|2
It is perfect for sharing|it is pérfekt for shéring|es perfecto para compartir|2
It is a great starter|it is a gréit stárter|es una gran entrada|2
It is a good choice for two|it is a gud chóis for tu|es buena opción para dos|2
It is light and healthy|it is láit and jélzi|es ligero y saludable|2
It is filling and hearty|it is fíling and járti|es contundente y llenador|3
It goes well with white wine|it góus uel uíz uáit uáin|va bien con vino blanco|3
It pairs well with a cold beer|it pers uel uíz a cóuld bir|combina bien con cerveza fría|3
Try it with the sauce|trái it uíz de sos|pruébelo con la salsa|2
If you like spicy, try this|if yu láik spáisi trái dis|si le gusta el picante, pruebe este|2
If you want something light|if yu uánt sámzing láit|si quiere algo ligero|2
If you are very hungry|if yu ar véri jóngri|si tiene mucha hambre|2
For a first timer, I suggest this|for a ferst táimer ái sagyést dis|para quien viene por primera vez, sugiero este|4
It is great for kids|it is gréit for kids|es ideal para niños|2
It is not too heavy|it is not tu jévi|no es muy pesado|2
It is not too salty|it is not tu sólti|no es muy salado|2
It is not spicy at all|it is not spáisi at ol|no pica para nada|2
It is very popular here|it is véri pópiular jíar|es muy popular aquí|2
Guests ask for it again|guests ask for it eguéin|los clientes lo piden otra vez|3
I have tried it myself|ái jav tráid it maiself|yo mismo lo he probado|3
You cannot go wrong with this|yu kánot góu rong uíz dis|con este no se equivoca|3
It is worth the wait|it is uerz de uéit|vale la pena esperar|3
It is a local favorite|it is a lókal féivorit|es favorito de la gente local|3
It is a Miami classic|it is a maiámi klásik|es un clásico de Miami|2
The portion is generous|de pórshon is yénerus|la porción es generosa|3
The portion is small, but rich|de pórshon is smol bot rich|la porción es chica pero rica|3
It is a good value|it is a gud válio|tiene buen precio|2
It is the best on the menu|it is de best on de ményu|es lo mejor del menú|2
I would order the grilled one|ái wud órder de grild uan|yo pediría el de la parrilla|3
That one is my top pick|dat uan is mai top pik|ese es mi primera opción|3
The special is worth trying|de spéshal is uerz tráiing|el especial vale la pena|3`,
  },
  {
    id: 'describir-un-plato',
    title: 'Describir un plato',
    desc: 'Sabor, textura, cocción y cómo se prepara cada plato.',
    grupo: 'expresarse',
    text: `It is sweet|it is suít|es dulce|1
It is salty|it is sólti|es salado|1
It is sour|it is sáuer|es ácido|1
It is bitter|it is bíter|es amargo|1
It is spicy|it is spáisi|es picante|1
It is mild|it is máild|es suave de sabor|2
It is creamy|it is krími|es cremoso|1
It is crunchy|it is krónchi|es crujiente|1
It is crispy|it is krispi|es crocante|1
It is juicy|it is yúsi|es jugoso|1
It is tender|it is ténder|es tierno|2
It is soft|it is soft|es blando|1
It is fluffy|it is flófi|es esponjoso|2
It is smoky|it is smóuki|tiene sabor ahumado|2
It is rich|it is rich|es intenso y sabroso|2
It is light|it is láit|es ligero|1
It is tangy|it is tángui|es picante y ácido|3
It is fresh and bright|it is fresh and bráit|es fresco y vivo|3
It is full of flavor|it is ful of fléivor|está lleno de sabor|2
It has a little kick|it jas a lítl kik|tiene un toque picante|3
It is cooked on the grill|it is kukt on de gril|se cocina en la parrilla|2
It is slow cooked|it is slou kukt|se cocina a fuego lento|2
It is baked in the oven|it is béikt in di óven|se hornea|2
It is fried until golden|it is fraid ontíl góulden|se fríe hasta dorar|3
It is lightly breaded|it is láitli brédid|lleva un empanizado ligero|3
It is served raw|it is servd ro|se sirve crudo|2
It is cured with lime|it is kiurd uíz láim|se cura con limón|3
It is marinated overnight|it is márineitid óuvernait|se marina toda la noche|3
It is seasoned with garlic|it is síizond uíz gárlik|está sazonado con ajo|3
It comes with a side salad|it koms uíz a sáid sálad|viene con ensalada|2
It comes with rice and beans|it koms uíz ráis and bins|viene con arroz y frijoles|2
It is topped with cheese|it is tópt uíz chis|lleva queso encima|2
It is stuffed with crab|it is stoft uíz krab|está relleno de cangrejo|3
It is served on a hot plate|it is servd on a jot pléit|se sirve en plato caliente|3
It is cooked to order|it is kukt tu órder|se cocina al momento|3
It is made with coconut milk|it is méid uíz kókonat milk|lleva leche de coco|3
It has no dairy|it jas nóu déri|no tiene lácteos|3
It is gluten free|it is glúten fri|no tiene gluten|2
It is dairy free|it is déri fri|no tiene leche|2
It is a vegetarian dish|it is a vecheterian dish|es un plato vegetariano|3
The sauce is on the side|de sos is on de sáid|la salsa va aparte|2`,
  },
  {
    id: 'vender-un-extra',
    title: 'Vender un extra sin presionar',
    desc: 'Para ofrecer bebidas, entradas, postres y mejoras con amabilidad.',
    grupo: 'expresarse',
    text: `Would you like a drink first?|wud yu láik a drink ferst|¿quieren una bebida primero?|2
Can I start you with water?|kan ái start yu uíz uóter|¿empiezo con agua?|2
Would you like still or sparkling?|wud yu láik stil or spárkling|¿agua sin gas o con gas?|3
Can I bring a bread basket?|kan ái bring a bred báskit|¿les traigo pan?|2
Would you like an appetizer?|wud yu láik an ápetaizer|¿desean una entrada?|2
The nachos are great to share|de náchos ar gréit tu sher|los nachos son para compartir|2
Can I tempt you with a starter?|kan ái tempt yu uíz a stárter|¿los tento con una entrada?|4
Would you like to add shrimp?|wud yu láik tu ad shrimp|¿quiere agregar camarón?|2
You can add avocado for two dollars|yu kan ad avocádo for tu dólars|puede agregar aguacate por dos dólares|3
Would you like fries or salad?|wud yu láik fráis or sálad|¿papas o ensalada?|1
You can upgrade to sweet potato|yu kan ópgreid tu suít potéito|puede cambiar a camote|3
Want to make it a combo?|uánt tu méik it a cómbo|¿lo quiere en combo?|2
Would you like a side of rice?|wud yu láik a sáid of ráis|¿quiere una porción de arroz?|2
Can I get you a refill?|kan ái guet yu a rífil|¿le sirvo otra vez?|2
Another round of drinks?|anóder ráund of drinks|¿otra ronda de bebidas?|2
Would you like another one?|wud yu láik anóder uan|¿quiere otro?|1
Can I offer you a cocktail?|kan ái ófer yu a kóktel|¿le ofrezco un coctel?|3
We have a great wine list|uí jav a gréit uáin list|tenemos buena carta de vinos|2
Would you like a glass of wine?|wud yu láik a glas of uáin|¿quiere una copa de vino?|2
May I suggest a bottle?|méi ái sagyést a bótl|¿puedo sugerir una botella?|3
The house wine is very good|de jáus uáin is véri gud|el vino de la casa es muy bueno|3
Do you have room for dessert?|du yu jav rum for dizért|¿les queda espacio para postre?|3
Save room for dessert|séiv rum for dizért|guarden espacio para el postre|3
The flan is homemade|de flan is jóummeid|el flan es casero|2
Would you like to share a dessert?|wud yu láik tu sher a dizért|¿quieren compartir un postre?|3
Coffee or tea with dessert?|kófi or ti uíz dizért|¿café o té con el postre?|2
Can I make you an espresso?|kan ái méik yu an espréso|¿le preparo un espresso?|3
Would you like it with ice cream?|wud yu láik it uíz áis krim|¿lo quiere con helado?|2
Would you like extra sauce?|wud yu láik ékstra sos|¿quiere más salsa?|1
Do you want it spicy or mild?|du yu uánt it spáisi or máild|¿lo quiere picante o suave?|2
Can I box the leftovers for you?|kan ái boks de léftovers for yu|¿le empaco lo que sobró?|3
Would you like a to go cup?|wud yu láik a tu góu kop|¿quiere un vaso para llevar?|2
Want to try the special first?|uánt tu trái de spéshal ferst|¿quiere probar primero el especial?|3
It is only a little more|it is óunli a lítl mor|solo cuesta un poco más|2
It is worth the upgrade|it is uerz di ópgreid|vale la pena el cambio|3
No pressure, just a suggestion|nóu préshor yost a sagyéschon|sin presión, solo una sugerencia|4
Take your time with the menu|téik yor táim uíz de ményu|tómese su tiempo con el menú|2
Let me know if you want more|let mi nóu if yu uánt mor|avíseme si quiere más|2
I will check back in a minute|ái uíl chek bak in a mínit|vuelvo en un minuto|2`,
  },
  {
    id: 'resolver-quejas',
    title: 'Resolver quejas',
    desc: 'Para escuchar un problema con calma y arreglarlo.',
    grupo: 'expresarse',
    text: `Let me fix that right away|let mi fiks dat ráit auéi|déjeme arreglarlo ya|2
Thank you for telling me|zank yu for télling mi|gracias por avisarme|2
I understand your concern|ái onderstánd yor consérn|entiendo su preocupación|3
I am very sorry about that|ái am véri sóri abáut dat|lamento mucho eso|2
I will take care of it|ái uíl téik ker of it|yo me encargo|2
What seems to be the problem?|uát sims tu bi de próblem|¿cuál parece ser el problema?|3
Is something wrong with the dish?|is sámzing rong uíz de dish|¿pasa algo con el plato?|2
Is the steak cooked right?|is de stéik kukt ráit|¿el corte está bien cocinado?|2
Is it too cold?|is it tu cóuld|¿está muy frío?|1
Is it too salty?|is it tu sólti|¿está muy salado?|1
Is it not what you ordered?|is it not uát yu órderd|¿no es lo que pidió?|3
I will bring you a new one|ái uíl bring yu a niu uan|le traigo uno nuevo|2
I can remake it for you|ái kan rimeik it for yu|puedo prepararlo de nuevo|3
I can swap it for something else|ái kan suap it for sámzing els|puedo cambiarlo por otra cosa|3
Would you like something different?|wud yu láik sámzing dífrent|¿desea algo diferente?|3
I will take it off the bill|ái uíl téik it of de bil|se lo quito de la cuenta|3
It is on the house|it is on de jáus|va por cuenta de la casa|3
Let me talk to the manager|let mi tok tu de mánayer|déjeme hablar con el gerente|3
The manager will be right over|de mánayer uíl bi ráit óuver|el gerente viene enseguida|3
We will correct the bill|uí uíl corékt de bil|corregiremos la cuenta|3
There is a mistake on the check|der is a mistéik on de chek|hay un error en la cuenta|3
Let me check the receipt|let mi chek de risít|déjeme revisar el recibo|3
Let me look into it|let mi luk íntu it|déjeme investigarlo|3
I will find out for you|ái uíl fáind áut for yu|lo averiguo para usted|3
Sorry, that is my mistake|sóri dat is mai mistéik|perdón, fue mi error|2
Sorry, we mixed up the orders|sóri uí mikst op di órders|perdón, confundimos los pedidos|3
Your table is not ready yet|yor téibol is not rédi yet|su mesa aún no está lista|2
I can move you to another table|ái kan muv yu tu anóder téibol|puedo cambiarlo de mesa|3
Is this table better?|is dis téibol béter|¿esta mesa está mejor?|2
Is the music too loud?|is de miúsik tu láud|¿la música está muy alta?|2
I can turn the music down|ái kan tern de miúsik dáun|puedo bajar la música|3
Are you comfortable here?|ar yu cómfortabol jíar|¿están cómodos aquí?|2
Is the air too cold?|is di er tu cóuld|¿el aire está muy frío?|2
There is a long wait tonight|der is a long uéit tunáit|esta noche hay mucha espera|2
I will ask the kitchen to hurry|ái uíl ask de kíchen tu jóri|le pido a la cocina que se apure|3
We want you to be happy|uí uánt yu tu bi jápi|queremos que esté contento|3
Thank you for your patience|zank yu for yor péishens|gracias por su paciencia|3
I hope this makes it right|ái jóup dis méiks it ráit|espero que esto lo arregle|4
Is everything better now?|is évrizing béter náu|¿todo está mejor ahora?|2`,
  },
  {
    id: 'explicar-demoras',
    title: 'Explicar demoras',
    desc: 'Para avisar de esperas y tiempos sin perder la calma del cliente.',
    grupo: 'expresarse',
    text: `It will be a few minutes|it uíl bi a fiu mínits|serán unos minutos|2
It will take about ten minutes|it uíl téik abáut ten mínits|tardará unos diez minutos|2
The wait is about twenty minutes|de uéit is abáut tuénti mínits|la espera es de unos veinte minutos|2
We are very busy tonight|uí ar véri bízi tunáit|estamos muy llenos esta noche|2
The kitchen is backed up|de kíchen is bakt op|la cocina está atrasada|3
Your food is on the way|yor fud is on de uéi|su comida ya viene|2
Your order is almost ready|yor órder is ólmoust rédi|su pedido casi está listo|2
The chef is working on it|de shef is uérking on it|el chef está en eso|2
It is being prepared now|it is bíing pripérd náu|se está preparando ahora|3
The steak takes longer|de stéik téiks lónger|el corte tarda más|2
Well done takes more time|uel don téiks mor táim|bien cocido toma más tiempo|3
It is cooked to order|it is kukt tu órder|se cocina al momento|3
Sorry for the wait|sóri for de uéit|perdón por la espera|1
Thank you for waiting|zank yu for uéiting|gracias por esperar|1
Can I bring you a drink while you wait?|kan ái bring yu a drink uáil yu uéit|¿le traigo algo de beber mientras espera?|4
Here is some bread while you wait|jíar is som bred uáil yu uéit|aquí tiene pan mientras espera|3
Let me check on your order|let mi chek on yor órder|déjeme ver su pedido|2
I will go ask the kitchen|ái uíl góu ask de kíchen|voy a preguntar a la cocina|2
I will be right back with news|ái uíl bi ráit bak uíz niuz|vuelvo enseguida con noticias|3
We ran out of that today|uí ran áut of dat tudéi|hoy se nos acabó eso|2
We are out of the lobster|uí ar áut of de lóbster|se nos acabó la langosta|2
It is not available tonight|it is not avéilabol tunáit|no está disponible esta noche|2
It should be here soon|it shud bi jíar sun|debe llegar pronto|2
The grill is full right now|de gril is ful ráit náu|la parrilla está llena ahora|3
We are short on staff tonight|uí ar short on staf tunáit|hoy andamos cortos de personal|3
The delivery is late today|de delíveri is léit tudéi|el pedido del proveedor llegó tarde|3
The dessert will be a bit slow|de dizért uíl bi a bit slóu|el postre tardará un poco|3
Your table will be ready soon|yor téibol uíl bi rédi sun|su mesa estará lista pronto|2
I will call your name|ái uíl kol yor néim|lo llamo por su nombre|2
I will send you a text|ái uíl send yu a tekst|le mando un mensaje de texto|3
Can I take your number?|kan ái téik yor nómber|¿puedo anotar su número?|2
It is about a thirty minute wait|it is abáut a zérti mínit uéit|la espera es de media hora|3
The wait may be longer on weekends|de uéit méi bi lónger on uíkends|la espera puede ser mayor en fin de semana|4
Would you like to wait at the bar?|wud yu láik tu uéit at de bar|¿quiere esperar en la barra?|3
You can wait on the patio|yu kan uéit on de pátio|puede esperar en el patio|3
I am sorry it took so long|ái am sóri it tuk sóu long|perdón que tardó tanto|3
It is almost done|it is ólmoust don|ya casi está|1
It will not be long|it uíl not long|no tardará mucho|2
I will check again in five|ái uíl chek eguéin in fáiv|vuelvo a revisar en cinco|3
Everything is coming out now|évrizing is kóming áut náu|todo está saliendo ahora|3`,
  },
  {
    id: 'disculparse',
    title: 'Disculparse',
    desc: 'Para pedir perdón de forma profesional y sincera.',
    grupo: 'expresarse',
    text: `I am so sorry|ái am sóu sóri|lo siento mucho|1
Sorry about that|sóri abáut dat|perdón por eso|1
Please excuse me|plis ekskiús mi|disculpe, por favor|1
Excuse me for a moment|ekskiús mi for a móument|permítame un momento|2
My apologies|mai apóloyis|mis disculpas|2
I apologize for the mistake|ái apóloyaiz for de mistéik|me disculpo por el error|3
I apologize for the delay|ái apóloyaiz for de diléi|me disculpo por la demora|3
That was my fault|dat uas mai folt|fue mi culpa|2
It will not happen again|it uíl not jápen eguéin|no volverá a pasar|3
Sorry to bother you|sóri tu bóder yu|perdón por molestarle|2
Sorry to interrupt|sóri tu interópt|perdón por interrumpir|2
Sorry, I did not hear you|sóri ái did not jíar yu|perdón, no lo escuché|2
Sorry, I did not catch that|sóri ái did not kach dat|perdón, no lo entendí|2
Sorry, I spilled that|sóri ái spild dat|perdón, derramé eso|2
Let me clean that up|let mi klin dat op|déjeme limpiar eso|2
Let me get you a towel|let mi guet yu a táuel|le traigo una toalla|2
Sorry about the noise|sóri abáut de nóis|perdón por el ruido|2
Sorry for the mix-up|sóri for de miks op|perdón por la confusión|3
Sorry, I forgot your drink|sóri ái forgát yor drink|perdón, olvidé su bebida|3
I will bring it right now|ái uíl bring it ráit náu|se la traigo ahora mismo|2
Sorry, wrong table|sóri rong téibol|perdón, mesa equivocada|2
I am sorry to hear that|ái am sóri tu jíar dat|siento oír eso|2
I feel bad about this|ái fil bad abáut dis|me siento mal por esto|3
That should not have happened|dat shud not jav jápend|eso no debió pasar|4
Thank you for your understanding|zank yu for yor onderstánding|gracias por su comprensión|3
I appreciate your patience|ái aprishiéit yor péishens|agradezco su paciencia|3
Please forgive the wait|plis forguív de uéit|disculpe la espera|3
Sorry, you are right|sóri yu ar ráit|perdón, tiene razón|2
Sorry, that is not what we wanted|sóri dat is not uát uí uánted|perdón, no es lo que queríamos|4
I am sorry for the confusion|ái am sóri for de confiúshon|lamento la confusión|3
Sorry for the trouble|sóri for de tróbol|perdón por la molestia|2
We are sorry for the inconvenience|uí ar sóri for di inconvíniens|lamentamos el inconveniente|4
Sorry, I will be quicker|sóri ái uíl bi kuíker|perdón, seré más rápido|3
Sorry, I did not see you|sóri ái did not sí yu|perdón, no lo vi|2
Sorry, I am new here|sóri ái am niu jíar|perdón, soy nuevo aquí|2
Sorry, my English is not perfect|sóri mai ínglish is not pérfekt|perdón, mi inglés no es perfecto|3
I am still learning English|ái am stil lérning ínglish|todavía estoy aprendiendo inglés|3
Please be patient with me|plis bi péishent uíz mi|tenga paciencia conmigo|3
Thank you for being kind|zank yu for bíing káind|gracias por ser amable|2
Sorry, one moment please|sóri uan móument plis|perdón, un momento por favor|1`,
  },
  {
    id: 'despedirse',
    title: 'Despedirse',
    desc: 'Para cerrar la visita con calidez y que vuelvan.',
    grupo: 'expresarse',
    text: `Thank you for coming|zank yu for kóming|gracias por venir|1
Thank you for dining with us|zank yu for dáining uíz os|gracias por cenar con nosotros|2
It was a pleasure|it uas a pléshor|fue un placer|2
It was great to meet you|it uas gréit tu mit yu|fue un gusto conocerlos|2
I hope you enjoyed everything|ái jóup yu enyóid évrizing|espero que hayan disfrutado todo|3
How was everything?|jáu uas évrizing|¿qué tal estuvo todo?|1
Did you enjoy your meal?|did yu enyói yor mil|¿disfrutaron su comida?|2
I am glad you liked it|ái am glad yu láikt it|me alegra que les gustó|2
Have a great night|jav a gréit náit|que tengan buena noche|1
Have a safe trip home|jav a séif trip jóum|buen viaje a casa|2
Have a wonderful vacation|jav a uónderful vakéishon|que tengan unas lindas vacaciones|3
Enjoy the rest of your stay|enyói de rest of yor stéi|disfruten el resto de su estadía|3
Enjoy the rest of your day|enyói de rest of yor déi|disfruten lo que queda del día|2
Please come back soon|plis kom bak sun|vuelvan pronto, por favor|1
We hope to see you again|uí jóup tu sí yu eguéin|esperamos verlos de nuevo|2
You are always welcome here|yu ar ólueis uélcom jíar|siempre son bienvenidos aquí|2
Ask for me next time|ask for mi nekst táim|pregunten por mí la próxima vez|3
My name is Carlos, by the way|mai néim is cárlos bái de uéi|me llamo Carlos, por cierto|2
Tell your friends about us|tel yor frends abáut os|cuéntenles a sus amigos de nosotros|3
Please leave us a review|plis liv os a riviú|déjennos una reseña, por favor|3
Follow us on Instagram|fólou os on ínstagram|síganos en Instagram|2
Here is your check|jíar is yor chek|aquí está su cuenta|1
Take your time with the check|téik yor táim uíz de chek|con calma con la cuenta|2
I can take that when you are ready|ái kan téik dat uen yu ar rédi|la recojo cuando estén listos|3
Would you like change back?|wud yu láik chéinch bak|¿quiere su cambio?|2
I will bring your change|ái uíl bring yor chéinch|le traigo su cambio|2
Thank you so much|zank yu sóu moch|muchas gracias|1
Thank you, that is very kind|zank yu dat is véri káind|gracias, es muy amable|2
Your tip is appreciated|yor tip is aprishiéitid|se agradece su propina|3
Do you need a receipt?|du yu nid a risít|¿necesita recibo?|2
Do you need a taxi?|du yu nid a táksi|¿necesitan un taxi?|2
I can call you a ride|ái kan kol yu a ráid|puedo pedirles un transporte|3
Be careful on the way out|bi kérful on de uéi áut|cuidado al salir|3
Watch your step, please|uoch yor step plis|cuidado con el escalón|2
Good night, everyone|gud náit évriuan|buenas noches a todos|1
See you next time|sí yu nekst táim|nos vemos la próxima|1
Take care|téik ker|cuídense|1
Safe travels|séif trávels|buen viaje|2
Goodbye and thank you|gudbái and zank yu|adiós y gracias|1`,
  },
  {
    id: 'companeros-y-cocina',
    title: 'Compañeros y cocina',
    desc: 'Frases rápidas para coordinar con el equipo y la cocina durante el turno.',
    grupo: 'expresarse',
    text: `Behind!|bijáind|¡atrás de ti!|1
Coming through!|kóming zru|¡paso!|1
Hot plate!|jot pléit|¡plato caliente!|1
Watch out!|uoch áut|¡cuidado!|1
Corner!|kórner|¡esquina!|1
Heard!|jerd|¡entendido!|1
Yes, chef!|yes shef|¡sí, chef!|1
Order up!|órder op|¡pedido listo!|2
Fire table five|fáier téibol fáiv|saca la mesa cinco|2
Hold table five|jóuld téibol fáiv|detén la mesa cinco|2
I need two minutes|ái nid tu mínits|necesito dos minutos|2
Where is my order?|uér is mai órder|¿dónde está mi pedido?|1
Is table six ready?|is téibol siks rédi|¿la mesa seis está lista?|2
Table six wants the check|téibol siks uánts de chek|la mesa seis quiere la cuenta|2
Table three is waiting|téibol zri is uéiting|la mesa tres espera|2
Table four needs water|téibol for nids uóter|la mesa cuatro necesita agua|2
Can you cover my section?|kan yu kóver mai sékshon|¿puedes cubrir mi sección?|3
I will cover you|ái uíl kóver yu|yo te cubro|2
Can you help me with this?|kan yu jelp mi uíz dis|¿me ayudas con esto?|2
Can you run this food?|kan yu ron dis fud|¿puedes llevar esta comida?|3
I need a runner here|ái nid a róner jíar|necesito un corredor aquí|3
Who has table nine?|ju jas téibol náin|¿quién tiene la mesa nueve?|2
This one is mine|dis uan is máin|este es mío|1
That is not mine|dat is not máin|ese no es mío|1
We are out of fries|uí ar áut of fráis|se acabaron las papas|2
We are low on napkins|uí ar lóu on nápkins|quedan pocas servilletas|2
I am going on break|ái am góing on bréik|voy a mi descanso|2
I am back from break|ái am bak from bréik|regresé del descanso|2
Can I switch shifts with you?|kan ái suích shifts uíz yu|¿puedo cambiar turno contigo?|3
Can you stay a little longer?|kan yu stéi a lítl lónger|¿puedes quedarte un poco más?|3
I am closing tonight|ái am clóusing tunáit|esta noche cierro yo|2
I am opening tomorrow|ái am óupening tumórou|mañana abro yo|2
I am running late|ái am róning léit|voy a llegar tarde|2
Good job, team|gud yob tim|buen trabajo, equipo|2
Thanks for the help|zanks for de jelp|gracias por la ayuda|1
No problem, I got it|nóu próblem ái got it|no hay problema, yo me encargo|2
Allergy alert on table two|álerchi alért on téibol tu|alerta de alergia en la mesa dos|4
No onions on that one|nóu ónions on dat uan|sin cebolla en ese|2
The steak is medium rare|de stéik is mídium rer|el corte es término medio rojo|3
Wipe the table, please|uáip de téibol plis|limpia la mesa, por favor|2
Refill the ice, please|rifíl di áis plis|rellena el hielo, por favor|2`,
  },
  {
    id: 'pedir-aclaraciones',
    title: 'Pedir aclaraciones',
    desc: 'Para entender mejor al cliente cuando no queda claro lo que dice.',
    grupo: 'expresarse',
    text: `Sorry, could you repeat that?|sóri kud yu ripít dat|perdón, ¿puede repetirlo?|2
Could you say it again, please?|kud yu séi it eguéin plis|¿puede decirlo otra vez?|2
Could you speak more slowly?|kud yu spik mor slóuli|¿puede hablar más lento?|3
I did not understand|ái did not onderstánd|no entendí|1
I am not sure I understood|ái am not shur ái onderstúd|no estoy seguro de haber entendido|3
What do you mean?|uát du yu min|¿qué quiere decir?|1
Do you mean the chicken?|du yu min de chíken|¿se refiere al pollo?|2
Do you mean this one?|du yu min dis uan|¿se refiere a este?|1
Which one do you want?|uích uan du yu uánt|¿cuál quiere?|1
Which one did you point at?|uích uan did yu póint at|¿a cuál señaló?|3
Is it for you or for her?|is it for yu or for jer|¿es para usted o para ella?|2
Is this for here or to go?|is dis for jíar or tu góu|¿para comer aquí o llevar?|2
Is it one check or separate?|is it uan chek or séparet|¿una cuenta o separadas?|2
Do you want it with ice?|du yu uánt it uíz áis|¿lo quiere con hielo?|1
Do you want it spicy?|du yu uánt it spáisi|¿lo quiere picante?|1
How would you like the steak?|jáu wud yu láik de stéik|¿cómo quiere el corte?|2
How do you want the eggs?|jáu du yu uánt di egs|¿cómo quiere los huevos?|2
Is that all for now?|is dat ol for náu|¿eso es todo por ahora?|2
Do you have any allergies?|du yu jav eni álerchis|¿tiene alguna alergia?|2
Is it a serious allergy?|is it a síriós álerchi|¿es una alergia grave?|3
Can you spell your name?|kan yu spel yor néim|¿puede deletrear su nombre?|2
What name is the reservation under?|uát néim is de rezervéishon ónder|¿a nombre de quién es la reserva?|3
How many people are in your party?|jáu méni pípol ar in yor párti|¿cuántas personas son?|3
Is anyone joining you?|is éniuan yóining yu|¿alguien se les une?|3
Do you want to sit inside or outside?|du yu uánt tu sit insáid or autsáid|¿quieren sentarse adentro o afuera?|3
Would you like a booth?|wud yu láik a buz|¿quieren una cabina?|2
Do you need a high chair?|du yu nid a jái cher|¿necesitan una silla alta?|2
Is this your final order?|is dis yor fáinal órder|¿es su pedido final?|3
Did you want fries with that?|did yu uánt fráis uíz dat|¿quería papas con eso?|2
Did you say no cheese?|did yu séi nóu chis|¿dijo sin queso?|2
Let me repeat your order|let mi ripít yor órder|repito su pedido|2
Let me make sure I have it right|let mi méik shur ái jav it ráit|me aseguro de tenerlo bien|4
So that is two burgers, right?|sóu dat is tu bérgers ráit|entonces son dos hamburguesas, ¿cierto?|3
Just to confirm, no onions|yost tu conférm nóu ónions|solo para confirmar, sin cebolla|3
Can you point to it on the menu?|kan yu póint tu it on de ményu|¿puede señalarlo en el menú?|3
Can you show me on your phone?|kan yu sho mi on yor foun|¿me lo muestra en su celular?|3
Is that spelled like this?|is dat speld láik dis|¿se escribe así?|3
What was the last part?|uát uas de last part|¿cuál fue la última parte?|3
One more time, please|uan mor táim plis|una vez más, por favor|1
Slower, please|slóuer plis|más lento, por favor|1
Let me get someone who speaks Spanish|let mi guet sámuan ju spiks spánish|busco a alguien que hable español|4`,
  },
];
