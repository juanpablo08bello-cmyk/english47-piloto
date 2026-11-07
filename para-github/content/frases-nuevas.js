// Tercera tanda de frases. Cada línea: inglés ; español ; pares palabra=significado separados por |.
const TABLA = {
  recibir: `
Do you want to sit by the window? ; ¿Quieren sentarse junto a la ventana? ; Do you want=¿quieren?|to sit=sentarse|by=junto a|the=la|window=ventana
Is this your first time with us? ; ¿Es su primera vez con nosotros? ; Is this=¿es esta?|your=su|first=primera|time=vez|with=con|us=nosotros
Good morning. ; Buenos días. ; Good=buena|morning=mañana
Welcome back! ; ¡Bienvenidos otra vez! ; Welcome=bienvenidos|back=de vuelta
How is your day going? ; ¿Cómo va su día? ; How=cómo|is=va|your=su|day=día|going=yendo
Is this table okay? ; ¿Está bien esta mesa? ; Is=¿está?|this=esta|table=mesa|okay=bien
Would you like a booth? ; ¿Quieren un reservado? ; Would you like=¿le gustaría?|a=un|booth=reservado
Let me clean this table for you. ; Déjenme limpiarles esta mesa. ; Let me=déjeme|clean=limpiar|this=esta|table=mesa|for you=para ustedes
Are you all together? ; ¿Vienen todos juntos? ; Are you=¿están?|all=todos|together=juntos
Is anyone else coming? ; ¿Viene alguien más? ; Is=¿está?|anyone else=alguien más|coming=viniendo
Can I take your coat? ; ¿Le recibo el abrigo? ; Can I=¿puedo?|take=tomar|your=su|coat=abrigo
`,
  espera: `
Your table will be ready soon. ; Su mesa estará lista pronto. ; Your=su|table=mesa|will be=estará|ready=lista|soon=pronto
Can I get your name for the list? ; ¿Me da su nombre para la lista? ; Can I=¿puedo?|get=tener|your=su|name=nombre|for=para|the=la|list=lista
Do you want to wait? ; ¿Quieren esperar? ; Do you want=¿quieren?|to wait=esperar
We have a table in ten minutes. ; Tenemos una mesa en diez minutos. ; We have=tenemos|a=una|table=mesa|in=en|ten=diez|minutes=minutos
I can put your name on the list. ; Puedo poner su nombre en la lista. ; I can=puedo|put=poner|your=su|name=nombre|on=en|the=la|list=lista
What time is your reservation? ; ¿A qué hora es su reservación? ; What time=a qué hora|is=es|your=su|reservation=reservación
I found your reservation. ; Encontré su reservación. ; I found=encontré|your=su|reservation=reservación
Your table is almost ready. ; Su mesa está casi lista. ; Your=su|table=mesa|is=está|almost=casi|ready=lista
We don't take reservations. ; No aceptamos reservaciones. ; We don't=no|take=aceptamos|reservations=reservaciones
The wait is about twenty minutes. ; La espera es de unos veinte minutos. ; The=la|wait=espera|is=es|about=como|twenty=veinte|minutes=minutos
We will text you when it is ready. ; Les enviamos un mensaje cuando esté lista. ; We will=vamos a|text=enviar mensaje|you=a ustedes|when=cuando|it is=esté|ready=lista
Please wait here for a moment. ; Esperen aquí un momento, por favor. ; Please=por favor|wait=esperen|here=aquí|for=por|a moment=un momento
Do you want to sit at the bar? ; ¿Quieren sentarse en la barra? ; Do you want=¿quieren?|to sit=sentarse|at=en|the=la|bar=barra
`,
  bebidas: `
Do you want more ice? ; ¿Quiere más hielo? ; Do you want=¿quiere?|more=más|ice=hielo
Would you like a hot tea? ; ¿Quiere un té caliente? ; Would you like=¿le gustaría?|a=un|hot=caliente|tea=té
I will get you more coffee. ; Le traigo más café. ; I will=voy a|get you=traerle|more=más|coffee=café
Would you like some coffee? ; ¿Quiere café? ; Would you like=¿le gustaría?|some=algo de|coffee=café
Do you want a straw? ; ¿Quiere un popote? ; Do you want=¿quiere?|a=un|straw=popote
We have Coke and Diet Coke. ; Tenemos Coca-Cola y Coca-Cola de dieta. ; We have=tenemos|Coke=Coca-Cola|and=y|Diet Coke=Coca-Cola de dieta
Is Pepsi okay? ; ¿Está bien Pepsi? ; Is=¿está?|Pepsi=Pepsi|okay=bien
The lemonade is fresh. ; La limonada es fresca. ; The=la|lemonade=limonada|is=es|fresh=fresca
Would you like a soda? ; ¿Quiere un refresco? ; Would you like=¿le gustaría?|a=un|soda=refresco
Tap water or bottled water? ; ¿Agua de la llave o de botella? ; Tap water=agua de la llave|or=o|bottled water=agua de botella
Sweet tea or unsweet tea? ; ¿Té dulce o sin azúcar? ; Sweet=dulce|tea=té|or=o|unsweet=sin azúcar|tea=té
Hot or iced? ; ¿Caliente o frío? ; Hot=caliente|or=o|iced=frío
I'll get you another drink. ; Le traigo otra bebida. ; I'll get=le traigo|you=a usted|another=otra|drink=bebida
Your drinks are coming. ; Ya vienen sus bebidas. ; Your=sus|drinks=bebidas|are coming=ya vienen
We have orange juice and apple juice. ; Tenemos jugo de naranja y de manzana. ; We have=tenemos|orange=naranja|juice=jugo|and=y|apple=manzana|juice=jugo
`,
  menu: `
The menu is on the table. ; El menú está en la mesa. ; The=el|menu=menú|is=está|on=en|the=la|table=mesa
Let me tell you about the specials. ; Déjenme contarles los especiales. ; Let me=déjeme|tell=contar|you=a ustedes|about=sobre|the=los|specials=especiales
Would you like to see the menu? ; ¿Quieren ver el menú? ; Would you like=¿le gustaría?|to see=ver|the=el|menu=menú
This is our lunch menu. ; Este es nuestro menú de almuerzo. ; This is=este es|our=nuestro|lunch=almuerzo|menu=menú
Today's special is the salmon. ; El especial de hoy es el salmón. ; Today's=de hoy|special=especial|is=es|the=el|salmon=salmón
We also have a kids menu. ; También tenemos menú de niños. ; We=nosotros|also=también|have=tenemos|a=un|kids=niños|menu=menú
Do you have any questions about the menu? ; ¿Tienen preguntas sobre el menú? ; Do you have=¿tienen?|any=alguna|questions=preguntas|about=sobre|the=el|menu=menú
The soup today is tomato. ; La sopa de hoy es de tomate. ; The=la|soup=sopa|today=hoy|is=es|tomato=tomate
Our burgers are very good. ; Nuestras hamburguesas son muy buenas. ; Our=nuestras|burgers=hamburguesas|are=son|very=muy|good=buenas
The pasta is made here. ; La pasta se hace aquí. ; The=la|pasta=pasta|is made=se hace|here=aquí
We have vegetarian options. ; Tenemos opciones vegetarianas. ; We have=tenemos|vegetarian=vegetarianas|options=opciones
Breakfast ends at eleven. ; El desayuno termina a las once. ; Breakfast=desayuno|ends=termina|at=a las|eleven=once
Lunch is until three. ; El almuerzo es hasta las tres. ; Lunch=almuerzo|is=es|until=hasta|three=tres
We are out of the shrimp today. ; Hoy se nos acabó el camarón. ; We are out=se nos acabó|of=de|the=el|shrimp=camarón|today=hoy
`,
  orden: `
Do you want soup with that? ; ¿Quiere sopa con eso? ; Do you want=¿quiere?|soup=sopa|with=con|that=eso
What side do you want? ; ¿Qué acompañamiento quiere? ; What=qué|side=acompañamiento|do you want=quiere
I will be back for your order. ; Regreso por su orden. ; I will=voy a|be back=regresar|for=por|your=su|order=orden
What can I get for you? ; ¿Qué les puedo traer? ; What=qué|can I=puedo|get=traer|for you=para ustedes
Would you like to start with an appetizer? ; ¿Quieren empezar con una entrada? ; Would you like=¿le gustaría?|to start=empezar|with=con|an=una|appetizer=entrada
Which side would you like? ; ¿Qué acompañamiento quiere? ; Which=cuál|side=acompañamiento|would you like=le gustaría
Soup or salad? ; ¿Sopa o ensalada? ; Soup=sopa|or=o|salad=ensalada
Which dressing would you like? ; ¿Qué aderezo quiere? ; Which=cuál|dressing=aderezo|would you like=le gustaría
Do you want cheese on that? ; ¿Quiere queso en eso? ; Do you want=¿quiere?|cheese=queso|on=en|that=eso
Anything else for you? ; ¿Algo más para usted? ; Anything else=algo más|for you=para usted
Let me repeat your order. ; Déjenme repetir su orden. ; Let me=déjeme|repeat=repetir|your=su|order=orden
Who has the chicken? ; ¿Quién pidió el pollo? ; Who=quién|has=tiene|the=el|chicken=pollo
Would you like fries with that? ; ¿Quiere papas con eso? ; Would you like=¿le gustaría?|fries=papas|with=con|that=eso
I will put your order in now. ; Voy a pasar su orden ahora. ; I will=voy a|put=poner|your=su|order=orden|in=adentro|now=ahora
`,
  platos: `
It comes with bread. ; Viene con pan. ; It comes=viene|with=con|bread=pan
This one has no meat. ; Este no tiene carne. ; This one=este|has=tiene|no=nada de|meat=carne
The fish is very light. ; El pescado es muy ligero. ; The=el|fish=pescado|is=es|very=muy|light=ligero
It comes with rice and beans. ; Viene con arroz y frijoles. ; It comes=viene|with=con|rice=arroz|and=y|beans=frijoles
The salmon is very fresh. ; El salmón está muy fresco. ; The=el|salmon=salmón|is=está|very=muy|fresh=fresco
It has garlic and butter. ; Tiene ajo y mantequilla. ; It has=tiene|garlic=ajo|and=y|butter=mantequilla
It is served with vegetables. ; Se sirve con verduras. ; It is served=se sirve|with=con|vegetables=verduras
The sauce is on the side. ; La salsa va aparte. ; The=la|sauce=salsa|is=va|on the side=aparte
It is a big plate. ; Es un plato grande. ; It is=es|a=un|big=grande|plate=plato
This one is good for sharing. ; Este es bueno para compartir. ; This one=este|is=es|good=bueno|for=para|sharing=compartir
The soup is very hot. ; La sopa está muy caliente. ; The=la|soup=sopa|is=está|very=muy|hot=caliente
The chicken is fried. ; El pollo es frito. ; The=el|chicken=pollo|is=es|fried=frito
The shrimp is grilled. ; El camarón es a la parrilla. ; The=el|shrimp=camarón|is=es|grilled=a la parrilla
It has mushrooms and onions. ; Tiene champiñones y cebolla. ; It has=tiene|mushrooms=champiñones|and=y|onions=cebolla
Most people like this one. ; A casi todos les gusta este. ; Most=la mayoría|people=personas|like=gusta|this one=este
`,
  carne: `
Medium is pink in the middle. ; Término medio es rosado en el centro. ; Medium=término medio|is=es|pink=rosado|in=en|the=el|middle=centro
Do you want it medium rare? ; ¿La quiere término medio crudo? ; Do you want=¿quiere?|it=la|medium rare=término medio crudo
The steak is twelve ounces. ; El bistec es de doce onzas. ; The=el|steak=bistec|is=es|twelve=doce|ounces=onzas
It takes about twenty minutes. ; Tarda unos veinte minutos. ; It takes=tarda|about=como|twenty=veinte|minutes=minutos
Please cut it to check the middle. ; Por favor córtelo para revisar el centro. ; Please=por favor|cut it=córtelo|to check=para revisar|the=el|middle=centro
`,
  servicio: `
Do you want more sauce? ; ¿Quiere más salsa? ; Do you want=¿quiere?|more=más|sauce=salsa
I will bring you more napkins. ; Le traigo más servilletas. ; I will=voy a|bring you=traerle|more=más|napkins=servilletas
Here is your food. ; Aquí está su comida. ; Here is=aquí está|your=su|food=comida
The plate is hot. ; El plato está caliente. ; The=el|plate=plato|is=está|hot=caliente
Do you need anything else? ; ¿Necesitan algo más? ; Do you need=¿necesitan?|anything else=algo más
How is your steak? ; ¿Cómo está su bistec? ; How=cómo|is=está|your=su|steak=bistec
Can I get you some ketchup? ; ¿Le traigo cátsup? ; Can I=¿puedo?|get you=traerle|some=algo de|ketchup=cátsup
Let me get you a new fork. ; Déjeme traerle otro tenedor. ; Let me=déjeme|get you=traerle|a new=un nuevo|fork=tenedor
I will be right back with your napkins. ; Ya regreso con sus servilletas. ; I will=yo voy a|be right back=regresar ya|with=con|your=sus|napkins=servilletas
Can I take this plate? ; ¿Puedo llevarme este plato? ; Can I=¿puedo?|take=llevar|this=este|plate=plato
Let me make some room here. ; Déjenme hacer espacio aquí. ; Let me=déjeme|make=hacer|some=algo de|room=espacio|here=aquí
Your food will be out soon. ; Su comida sale pronto. ; Your=su|food=comida|will be out=saldrá|soon=pronto
Enjoy your lunch! ; ¡Disfruten su almuerzo! ; Enjoy=disfruten|your=su|lunch=almuerzo
`,
  vinos: `
This white wine is very good. ; Este vino blanco es muy bueno. ; This=este|white wine=vino blanco|is=es|very=muy|good=bueno
Do you want a cold beer? ; ¿Quiere una cerveza fría? ; Do you want=¿quiere?|a=una|cold=fría|beer=cerveza
Would you like to try the wine? ; ¿Quiere probar el vino? ; Would you like=¿le gustaría?|to try=probar|the=el|wine=vino
This red wine is very smooth. ; Este vino tinto es muy suave. ; This=este|red wine=vino tinto|is=es|very=muy|smooth=suave
Our house wine is good. ; Nuestro vino de la casa es bueno. ; Our=nuestro|house wine=vino de la casa|is=es|good=bueno
We have a happy hour until six. ; Tenemos hora feliz hasta las seis. ; We have=tenemos|a=una|happy hour=hora feliz|until=hasta|six=seis
Do you want salt on the rim? ; ¿Quiere sal en el borde? ; Do you want=¿quiere?|salt=sal|on=en|the=el|rim=borde
Would you like a margarita? ; ¿Quiere una margarita? ; Would you like=¿le gustaría?|a=una|margarita=margarita
On the rocks? ; ¿Con hielo? ; On the rocks=con hielo
I need to see your ID. ; Necesito ver su identificación. ; I need=necesito|to see=ver|your=su|ID=identificación
This beer is from Mexico. ; Esta cerveza es de México. ; This=esta|beer=cerveza|is=es|from=de|Mexico=México
Would you like a glass of wine? ; ¿Quiere una copa de vino? ; Would you like=¿le gustaría?|a glass=una copa|of=de|wine=vino
`,
  alergias: `
Which food are you allergic to? ; ¿A qué comida es alérgico? ; Which=cuál|food=comida|are you=es|allergic=alérgico|to=a
Let me check with the chef. ; Déjeme revisar con el chef. ; Let me=déjeme|check=revisar|with=con|the=el|chef=chef
Are you allergic to anything? ; ¿Es alérgico a algo? ; Are you=¿es?|allergic=alérgico|to=a|anything=algo
Do you have a food allergy? ; ¿Tiene alergia a algún alimento? ; Do you have=¿tiene?|a=una|food=comida|allergy=alergia
I will tell the kitchen. ; Le voy a avisar a la cocina. ; I will=voy a|tell=avisar|the=la|kitchen=cocina
Let me ask the chef. ; Déjeme preguntarle al chef. ; Let me=déjeme|ask=preguntar|the=el|chef=chef
This dish has nuts. ; Este plato tiene nueces. ; This=este|dish=plato|has=tiene|nuts=nueces
This sauce has milk. ; Esta salsa tiene leche. ; This=esta|sauce=salsa|has=tiene|milk=leche
This bread has wheat. ; Este pan tiene trigo. ; This=este|bread=pan|has=tiene|wheat=trigo
I am not sure about that. ; No estoy seguro de eso. ; I am=estoy|not=no|sure=seguro|about=de|that=eso
I will check that for you. ; Se lo voy a revisar. ; I will=voy a|check=revisar|that=eso|for you=para usted
Thanks for telling me. ; Gracias por decirme. ; Thanks=gracias|for=por|telling=decir|me=a mí
`,
  postre: `
Would you like some cake? ; ¿Quiere pastel? ; Would you like=¿le gustaría?|some=algo de|cake=pastel
We have vanilla ice cream. ; Tenemos helado de vainilla. ; We have=tenemos|vanilla=vainilla|ice cream=helado
Do you have room for dessert? ; ¿Les queda espacio para postre? ; Do you have=¿tienen?|room=espacio|for=para|dessert=postre
Here is the dessert menu. ; Aquí está el menú de postres. ; Here is=aquí está|the=el|dessert=postres|menu=menú
Our chocolate cake is very good. ; Nuestro pastel de chocolate es muy bueno. ; Our=nuestro|chocolate=chocolate|cake=pastel|is=es|very=muy|good=bueno
Would you like ice cream with that? ; ¿Quiere helado con eso? ; Would you like=¿le gustaría?|ice cream=helado|with=con|that=eso
Vanilla or chocolate? ; ¿Vainilla o chocolate? ; Vanilla=vainilla|or=o|chocolate=chocolate
Would you like coffee with your dessert? ; ¿Quiere café con su postre? ; Would you like=¿le gustaría?|coffee=café|with=con|your=su|dessert=postre
Regular or decaf? ; ¿Normal o descafeinado? ; Regular=normal|or=o|decaf=descafeinado
Careful, the coffee is hot. ; Cuidado, el café está caliente. ; Careful=cuidado|the=el|coffee=café|is=está|hot=caliente
We have apple pie today. ; Hoy tenemos pay de manzana. ; We have=tenemos|apple=manzana|pie=pay|today=hoy
`,
  problemas: `
I will bring you a clean glass. ; Le traigo un vaso limpio. ; I will=voy a|bring you=traerle|a clean=un limpio|glass=vaso
I will check on your food. ; Voy a revisar su comida. ; I will=voy a|check on=revisar|your=su|food=comida
I am so sorry about that. ; Lo siento mucho. ; I am=estoy|so=muy|sorry=apenado|about=por|that=eso
I will get you a new one. ; Le traigo uno nuevo. ; I will=voy a|get you=traerle|a new=uno nuevo|one=uno
I will talk to the kitchen. ; Voy a hablar con la cocina. ; I will=voy a|talk=hablar|to=con|the=la|kitchen=cocina
What is wrong with it? ; ¿Qué tiene de malo? ; What=qué|is=está|wrong=mal|with it=con eso
Is it too cold? ; ¿Está muy frío? ; Is it=¿está?|too=muy|cold=frío
Is it too salty? ; ¿Está muy salado? ; Is it=¿está?|too=muy|salty=salado
Your food is taking a long time. ; Su comida está tardando mucho. ; Your=su|food=comida|is taking=está tardando|a long=mucho|time=tiempo
I made a mistake. ; Cometí un error. ; I made=cometí|a=un|mistake=error
That was my mistake. ; Fue mi error. ; That was=eso fue|my=mi|mistake=error
Are you okay? ; ¿Está bien? ; Are you=¿está?|okay=bien
`,
  cuenta: `
Do you need more time? ; ¿Necesitan más tiempo? ; Do you need=¿necesitan?|more=más|time=tiempo
Your total is on the check. ; Su total está en la cuenta. ; Your=su|total=total|is=está|on=en|the=la|check=cuenta
I will bring your card right back. ; Ya le traigo su tarjeta. ; I will=voy a|bring=traer|your=su|card=tarjeta|right back=enseguida
One check or two? ; ¿Una cuenta o dos? ; One=una|check=cuenta|or=o|two=dos
Do you want to split the check? ; ¿Quieren dividir la cuenta? ; Do you want=¿quieren?|to split=dividir|the=la|check=cuenta
Will that be cash or card? ; ¿Va a ser efectivo o tarjeta? ; Will that be=¿será?|cash=efectivo|or=o|card=tarjeta
I will take that for you. ; Yo me llevo eso. ; I will=voy a|take=llevar|that=eso|for you=por usted
I will be right back with your change. ; Ya regreso con su cambio. ; I will=yo voy a|be right back=regresar ya|with=con|your=su|change=cambio
Here is your card. ; Aquí está su tarjeta. ; Here is=aquí está|your=su|card=tarjeta
Do you need a pen? ; ¿Necesita un bolígrafo? ; Do you need=¿necesita?|a=un|pen=bolígrafo
Tax is included. ; El impuesto está incluido. ; Tax=impuesto|is=está|included=incluido
Your card did not work. ; Su tarjeta no pasó. ; Your=su|card=tarjeta|did not=no|work=funcionó
Do you have another card? ; ¿Tiene otra tarjeta? ; Do you have=¿tiene?|another=otra|card=tarjeta
`,
  despedida: `
Thank you so much. ; Muchas gracias. ; Thank you=gracias|so much=muchas
Thanks for coming in. ; Gracias por venir. ; Thanks=gracias|for=por|coming in=venir
Come back soon! ; ¡Vuelvan pronto! ; Come back=vuelvan|soon=pronto
Have a great day! ; ¡Que tengan un gran día! ; Have=tengan|a great=un gran|day=día
Have a good night! ; ¡Que pasen buena noche! ; Have=tengan|a good=una buena|night=noche
Have a good weekend! ; ¡Buen fin de semana! ; Have=tengan|a good=un buen|weekend=fin de semana
It was nice to meet you. ; Fue un gusto conocerlos. ; It was=fue|nice=un gusto|to meet=conocer|you=a ustedes
Drive safe! ; ¡Manejen con cuidado! ; Drive=manejen|safe=con cuidado
`,
  llevar: `
Your food is in the bag. ; Su comida está en la bolsa. ; Your=su|food=comida|is=está|in=en|the=la|bag=bolsa
Is this for here or to go? ; ¿Es para aquí o para llevar? ; Is this=¿es esto?|for here=para aquí|or=o|to go=para llevar
Do you want a box? ; ¿Quiere una caja? ; Do you want=¿quiere?|a=una|box=caja
I will box that for you. ; Se lo pongo en una caja. ; I will=voy a|box=poner en caja|that=eso|for you=para usted
Your order is ready. ; Su orden está lista. ; Your=su|order=orden|is=está|ready=lista
It will be ready in fifteen minutes. ; Estará lista en quince minutos. ; It will be=estará|ready=lista|in=en|fifteen=quince|minutes=minutos
Do you need forks and napkins? ; ¿Necesita tenedores y servilletas? ; Do you need=¿necesita?|forks=tenedores|and=y|napkins=servilletas
Here is your bag. ; Aquí está su bolsa. ; Here is=aquí está|your=su|bag=bolsa
Is this order for delivery? ; ¿Esta orden es a domicilio? ; Is this=¿es esta?|order=orden|for=para|delivery=domicilio
Please check your bag. ; Revise su bolsa, por favor. ; Please=por favor|check=revise|your=su|bag=bolsa
The sauce is in the bag. ; La salsa está en la bolsa. ; The=la|sauce=salsa|is=está|in=en|the=la|bag=bolsa
Be careful, the food is hot. ; Con cuidado, la comida está caliente. ; Be=sea|careful=cuidadoso|the=la|food=comida|is=está|hot=caliente
`,
  familias: `
Do you need a high chair? ; ¿Necesitan una silla para bebé? ; Do you need=¿necesitan?|a=una|high chair=silla para bebé
Do you need a booster seat? ; ¿Necesitan un asiento elevado? ; Do you need=¿necesitan?|a=un|booster seat=asiento elevado
How old is your daughter? ; ¿Cuántos años tiene su hija? ; How old=qué edad|is=tiene|your=su|daughter=hija
Would the kids like some crayons? ; ¿Los niños quieren colores? ; Would=¿les gustaría?|the=los|kids=niños|like=querer|some=algunos|crayons=colores
I can bring the kids food first. ; Puedo traer primero la comida de los niños. ; I can=puedo|bring=traer|the=los|kids=niños|food=comida|first=primero
Do you want a small plate for the baby? ; ¿Quiere un plato chico para el bebé? ; Do you want=¿quiere?|a=un|small=chico|plate=plato|for=para|the=el|baby=bebé
Does she want juice or milk? ; ¿Ella quiere jugo o leche? ; Does she want=¿ella quiere?|juice=jugo|or=o|milk=leche
Does he want apple juice? ; ¿Él quiere jugo de manzana? ; Does he want=¿él quiere?|apple=manzana|juice=jugo
The kids menu comes with a drink. ; El menú de niños viene con bebida. ; The=el|kids=niños|menu=menú|comes=viene|with=con|a=una|drink=bebida
`,
  charla: `
Do you live near here? ; ¿Viven cerca de aquí? ; Do you live=¿viven?|near=cerca de|here=aquí
I hope you like it. ; Espero que le guste. ; I hope=espero|you=usted|like=guste|it=eso
Are you here on vacation? ; ¿Están de vacaciones? ; Are you=¿están?|here=aquí|on vacation=de vacaciones
I love that city. ; Me encanta esa ciudad. ; I love=me encanta|that=esa|city=ciudad
What brings you here today? ; ¿Qué los trae hoy por aquí? ; What=qué|brings=trae|you=a ustedes|here=aquí|today=hoy
Are you celebrating something? ; ¿Están celebrando algo? ; Are you=¿están?|celebrating=celebrando|something=algo
Is the game on tonight? ; ¿Hay partido esta noche? ; Is=¿está?|the=el|game=partido|on=puesto|tonight=esta noche
I like your shirt. ; Me gusta su camisa. ; I like=me gusta|your=su|shirt=camisa
It is really hot today. ; Hace mucho calor hoy. ; It is=está|really=muy|hot=caliente|today=hoy
It is raining a lot. ; Está lloviendo mucho. ; It is=está|raining=lloviendo|a lot=mucho
My English is still improving. ; Mi inglés todavía está mejorando. ; My=mi|English=inglés|is=está|still=todavía|improving=mejorando
Can you say that again, please? ; ¿Puede repetirlo, por favor? ; Can you=¿puede?|say=decir|that=eso|again=otra vez|please=por favor
Can you speak more slowly, please? ; ¿Puede hablar más despacio, por favor? ; Can you=¿puede?|speak=hablar|more=más|slowly=despacio|please=por favor
`,
  equipo: `
Can you cover my table? ; ¿Me cubres mi mesa? ; Can you=¿puedes?|cover=cubrir|my=mi|table=mesa
Table five needs water. ; La mesa cinco necesita agua. ; Table=mesa|five=cinco|needs=necesita|water=agua
Can you help me with this table? ; ¿Me ayudas con esta mesa? ; Can you=¿puedes?|help=ayudar|me=me|with=con|this=esta|table=mesa
I need two more plates. ; Necesito dos platos más. ; I need=necesito|two=dos|more=más|plates=platos
Behind you! ; ¡Detrás de ti! ; Behind=detrás de|you=ti
Corner! ; ¡Esquina! ; Corner=esquina
Hot plate! ; ¡Plato caliente! ; Hot=caliente|plate=plato
This order is for table six. ; Esta orden es para la mesa seis. ; This=esta|order=orden|is=es|for=para|table=mesa|six=seis
We need more ice. ; Necesitamos más hielo. ; We need=necesitamos|more=más|ice=hielo
Table two is ready to order. ; La mesa dos está lista para ordenar. ; Table=mesa|two=dos|is=está|ready=lista|to order=para ordenar
Can you take this to table four? ; ¿Puedes llevar esto a la mesa cuatro? ; Can you=¿puedes?|take=llevar|this=esto|to=a|table=mesa|four=cuatro
I am going on my break. ; Me voy a mi descanso. ; I am going=me voy|on=a|my=mi|break=descanso
`,
};

const slug = (en) => `n_${en.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;

export const FRASES_NUEVAS = Object.entries(TABLA).flatMap(([topic, table]) => table.trim().split('\n').map((line) => {
  const [en, es, pairs] = line.split(' ; ').map((x) => x.trim());
  return { id: slug(en), topic, en, es, words: pairs.split('|').map((pair) => pair.split('=').map((x) => x.trim())) };
}));
