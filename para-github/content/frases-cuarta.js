// Cuarta tanda de frases (1.3). Cada línea: inglés ; español ; pares palabra=significado separados por |.
// Todas están bien armadas y pasan por la revisión de construcción (test/practice.test.js).
const TABLA = {
  desayuno: `
How would you like your eggs? ; ¿Cómo quiere sus huevos? ; How=cómo|would you like=le gustaría|your=sus|eggs=huevos
Scrambled or fried? ; ¿Revueltos o fritos? ; Scrambled=revueltos|or=o|fried=fritos
Do you want toast with that? ; ¿Quiere pan tostado con eso? ; Do you want=¿quiere?|toast=pan tostado|with=con|that=eso
White or whole wheat? ; ¿Blanco o integral? ; White=blanco|or=o|whole wheat=integral
Would you like bacon or sausage? ; ¿Quiere tocino o salchicha? ; Would you like=¿le gustaría?|bacon=tocino|or=o|sausage=salchicha
The pancakes come with syrup. ; Los panqueques vienen con jarabe. ; The=los|pancakes=panqueques|come=vienen|with=con|syrup=jarabe
Can I get you more coffee? ; ¿Le traigo más café? ; Can I=¿puedo?|get you=traerle|more=más|coffee=café
We serve breakfast until noon. ; Servimos desayuno hasta el mediodía. ; We serve=servimos|breakfast=desayuno|until=hasta|noon=mediodía
Do you want cream and sugar? ; ¿Quiere crema y azúcar? ; Do you want=¿quiere?|cream=crema|and=y|sugar=azúcar
The brunch menu starts at ten. ; El menú de brunch empieza a las diez. ; The=el|brunch=brunch|menu=menú|starts=empieza|at=a las|ten=diez
Would you like fruit on the side? ; ¿Quiere fruta al lado? ; Would you like=¿le gustaría?|fruit=fruta|on the side=al lado
Hash browns or home fries? ; ¿Papas ralladas o papas caseras? ; Hash browns=papas ralladas|or=o|home fries=papas caseras
`,
  problemas: `
I am sorry for the wait. ; Perdón por la espera. ; I am=estoy|sorry=apenado|for=por|the=la|wait=espera
I will bring you a fresh one right away. ; Le traigo uno fresco enseguida. ; I will=voy a|bring you=traerle|a fresh=uno fresco|one=uno|right away=enseguida
I will ask the chef to remake it. ; Le pediré al chef que lo vuelva a hacer. ; I will=voy a|ask=pedir|the=al|chef=chef|to remake=rehacer|it=eso
Your new plate is on the way. ; Su plato nuevo ya viene. ; Your=su|new=nuevo|plate=plato|is=está|on the way=en camino
I will make sure it is right this time. ; Me aseguro de que esta vez salga bien. ; I will=voy a|make sure=asegurarme|it is=esté|right=bien|this time=esta vez
I will take it off the check. ; Lo quito de la cuenta. ; I will=voy a|take it=quitarlo|off=de|the=la|check=cuenta
Would you like something else instead? ; ¿Quiere otra cosa en su lugar? ; Would you like=¿le gustaría?|something else=otra cosa|instead=en su lugar
I understand, and I will help you. ; Entiendo, y le voy a ayudar. ; I understand=entiendo|and=y|I will=voy a|help you=ayudarle
`,
  orden: `
What can I get started for you? ; ¿Con qué le empiezo? ; What=qué|can I=puedo|get started=empezar|for you=para usted
Are you ready to order, or do you need a minute? ; ¿Listos para ordenar o necesitan un minuto? ; Are you=¿están?|ready=listos|to order=para ordenar|or=o|do you need=¿necesitan?|a minute=un minuto
Would you like to share an appetizer? ; ¿Quieren compartir una entrada? ; Would you like=¿les gustaría?|to share=compartir|an=una|appetizer=entrada
I will put that order in right now. ; Ya mismo meto esa orden. ; I will=voy a|put=meter|that=esa|order=orden|in=adentro|right now=ahora mismo
Does anyone have any allergies? ; ¿Alguien tiene alergias? ; Does anyone=¿alguien?|have=tiene|any=alguna|allergies=alergias
Would you like the sauce on the side? ; ¿Quiere la salsa aparte? ; Would you like=¿le gustaría?|the=la|sauce=salsa|on the side=aparte
`,
  servicio: `
How is everything tasting? ; ¿Qué tal está todo? ; How=cómo|is=está|everything=todo|tasting=sabiendo
Can I take this plate for you? ; ¿Le retiro este plato? ; Can I=¿puedo?|take=llevar|this=este|plate=plato|for you=por usted
Is there anything else I can get you? ; ¿Hay algo más que le pueda traer? ; Is there=¿hay?|anything else=algo más|I can=que pueda|get you=traerle
Let me know if you need anything. ; Avíseme si necesita algo. ; Let me know=avíseme|if=si|you need=necesita|anything=algo
I will be back to check on you. ; Regreso a ver cómo están. ; I will=voy a|be back=regresar|to check on=a revisar|you=a ustedes
Would you like another round? ; ¿Quieren otra ronda? ; Would you like=¿les gustaría?|another=otra|round=ronda
`,
  cuenta: `
Whenever you are ready, no rush. ; Cuando estén listos, sin prisa. ; Whenever=cuando|you are=estén|ready=listos|no rush=sin prisa
Would you like a receipt? ; ¿Quiere un recibo? ; Would you like=¿le gustaría?|a=un|receipt=recibo
The tip is not included. ; La propina no está incluida. ; The=la|tip=propina|is not=no está|included=incluida
Please sign here and here. ; Firme aquí y aquí, por favor. ; Please=por favor|sign=firme|here=aquí|and=y|here=aquí
`,
  recibir: `
Do you have a reservation with us? ; ¿Tienen reservación con nosotros? ; Do you have=¿tienen?|a=una|reservation=reservación|with=con|us=nosotros
Please follow me to your table. ; Síganme a su mesa, por favor. ; Please=por favor|follow me=síganme|to=a|your=su|table=mesa
How many people are in your party? ; ¿Cuántas personas son en su grupo? ; How many=cuántas|people=personas|are=son|in=en|your=su|party=grupo
Is it inside or on the patio? ; ¿Adentro o en la terraza? ; Is it=¿es?|inside=adentro|or=o|on the=en la|patio=terraza
`,
  equipo: `
I need a runner for table nine. ; Necesito alguien que lleve platos a la mesa nueve. ; I need=necesito|a runner=un corredor|for=para|table=mesa|nine=nueve
We are out of salmon tonight. ; Hoy se nos acabó el salmón. ; We are=estamos|out of=sin|salmon=salmón|tonight=esta noche
Can you run this food for me? ; ¿Me llevas esta comida? ; Can you=¿puedes?|run=llevar rápido|this=esta|food=comida|for me=por mí
Table seven wants the check. ; La mesa siete quiere la cuenta. ; Table=mesa|seven=siete|wants=quiere|the=la|check=cuenta
I will clean this table now. ; Ahora limpio esta mesa. ; I will=voy a|clean=limpiar|this=esta|table=mesa|now=ahora
`,
  charla: `
Where are you visiting from? ; ¿De dónde nos visitan? ; Where=dónde|are you=están|visiting=visitando|from=desde
I hope you enjoy Miami. ; Espero que disfruten Miami. ; I hope=espero|you=ustedes|enjoy=disfruten|Miami=Miami
Is it your birthday today? ; ¿Hoy es su cumpleaños? ; Is it=¿es?|your=su|birthday=cumpleaños|today=hoy
Happy anniversary to you both! ; ¡Feliz aniversario a los dos! ; Happy=feliz|anniversary=aniversario|to you=a ustedes|both=los dos
`,
};

const slug = (en) => `c_${en.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;

export const FRASES_CUARTA = Object.entries(TABLA).flatMap(([topic, table]) => table.trim().split('\n').map((line) => {
  const [en, es, pairs] = line.split(' ; ').map((x) => x.trim());
  return { id: slug(en), topic, en, es, words: pairs.split('|').map((pair) => pair.split('=').map((x) => x.trim())) };
}));
