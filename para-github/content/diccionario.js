// Diccionario VIP: todas las palabras del restaurante en tablas largas, para consultar y para los juegos de Temas.
// Cada línea: inglés | cómo suena | español. Los verbos: presente | suena | pasado | suena | español | d si dobla consonante.
// La pronunciación es una ayuda aproximada: lo que se aprende es la palabra en inglés.
const words = (text) => text.trim().split('\n').map((line) => {
  const [en, pron, es] = line.split('|').map((x) => x.trim());
  return { en, pron, es };
});

const NO_DOUBLE_ES = /(s|sh|ch|x|o)$/;
const thirdPerson = (v) => {
  if (v === 'have') return 'has';
  if (NO_DOUBLE_ES.test(v)) return `${v}es`;
  if (/[^aeiou]y$/.test(v)) return `${v.slice(0, -1)}ies`;
  return `${v}s`;
};
const gerund = (v, double) => {
  if (double) return `${v}${v.at(-1)}ing`;
  if (/ie$/.test(v)) return `${v.slice(0, -2)}ying`;
  if (/[^e]e$/.test(v)) return `${v.slice(0, -1)}ing`;
  return `${v}ing`;
};
const regularPast = (v, double) => {
  if (double) return `${v}${v.at(-1)}ed`;
  if (/e$/.test(v)) return `${v}d`;
  if (/[^aeiou]y$/.test(v)) return `${v.slice(0, -1)}ied`;
  return `${v}ed`;
};

const VERBS = `
be|bi|was / were|uás / uér|ser, estar
have|jav|had|jad|tener
do|du|did|did|hacer
go|góu|went|uént|ir
come|cam|came|quéim|venir
get|guet|got|got|conseguir, traer|d
bring|bring|brought|brot|traer
take|téik|took|tuk|tomar, llevar
give|guiv|gave|guéiv|dar
make|méik|made|méid|hacer, preparar
say|séi|said|sed|decir
tell|tel|told|tóuld|decir, contar
ask|ask|asked|askt|preguntar, pedir
answer|ánser|answered|ánserd|responder
know|nóu|knew|niú|saber, conocer
think|zink|thought|zot|pensar
want|uánt|wanted|uánted|querer
need|nid|needed|níded|necesitar
like|láik|liked|láikt|gustar
love|lav|loved|lavd|encantar, amar
see|si|saw|so|ver
look|luk|looked|lukt|mirar, verse
hear|jir|heard|jerd|oír
listen|lísen|listened|lísend|escuchar
speak|spik|spoke|spóuk|hablar
talk|tok|talked|tokt|hablar, conversar
understand|anderstánd|understood|anderstúd|entender
repeat|ripít|repeated|ripíted|repetir
help|jelp|helped|jelpt|ayudar
serve|serv|served|servd|servir, atender
order|órder|ordered|órderd|ordenar, pedir
recommend|recoménd|recommended|recoménded|recomendar
suggest|sachést|suggested|sachésted|sugerir
offer|ófer|offered|óferd|ofrecer
wait|uéit|waited|uéited|esperar
seat|sit|seated|síted|sentar a alguien
sit|sit|sat|sat|sentarse|d
stand|stand|stood|stud|estar de pie
follow|fólou|followed|fóloud|seguir
walk|uók|walked|uókt|caminar
run|ran|ran|ran|correr|d
open|óupen|opened|óupend|abrir
close|clóus|closed|clóusd|cerrar
start|start|started|stárted|empezar
finish|fínish|finished|fínisht|terminar
stop|stop|stopped|stopt|parar|d
eat|it|ate|éit|comer
drink|drink|drank|drank|tomar, beber
taste|téist|tasted|téisted|probar, saber a
try|trái|tried|tráid|probar, intentar
cook|cuk|cooked|cukt|cocinar
grill|gril|grilled|grild|asar a la parrilla
fry|frái|fried|fráid|freír
bake|béik|baked|béikt|hornear
boil|bóil|boiled|bóild|hervir
cut|cat|cut|cat|cortar|d
pour|por|poured|pord|servir un líquido
fill|fil|filled|fild|llenar
refill|rifíl|refilled|rifíld|volver a llenar
clean|clin|cleaned|clind|limpiar
wash|uásh|washed|uásht|lavar
wipe|uáip|wiped|uáipt|limpiar con un paño
set|set|set|set|poner la mesa|d
carry|kéri|carried|kérid|cargar, llevar
put|put|put|put|poner|d
drop|drop|dropped|dropt|dejar caer|d
spill|spil|spilled|spild|regar, derramar
break|bréik|broke|bróuk|romper
fix|fix|fixed|fixt|arreglar
change|chéinch|changed|chéincht|cambiar
check|chek|checked|chekt|revisar
confirm|conférm|confirmed|conférmd|confirmar
forget|forguét|forgot|forgót|olvidar|d
remember|rimémber|remembered|rimémberd|recordar
pay|péi|paid|péid|pagar
charge|charch|charged|charcht|cobrar
split|split|split|split|dividir|d
sign|sáin|signed|sáind|firmar
tip|tip|tipped|tipt|dar propina|d
buy|bái|bought|bot|comprar
sell|sel|sold|sóuld|vender
leave|liv|left|left|irse, dejar
arrive|aráiv|arrived|aráivd|llegar
apologize|apólochais|apologized|apólochaisd|disculparse
thank|zank|thanked|zankt|agradecer
welcome|uélcom|welcomed|uélcomd|dar la bienvenida
greet|grit|greeted|gríted|saludar
enjoy|enchói|enjoyed|enchóid|disfrutar
share|sher|shared|sherd|compartir
choose|chus|chose|chóus|elegir
decide|disáid|decided|disáided|decidir
explain|expléin|explained|expléind|explicar
show|shóu|showed|shóud|mostrar
read|rid|read|red|leer
write|ráit|wrote|róut|escribir
call|col|called|cold|llamar
learn|lern|learned|lernd|aprender
work|uérk|worked|uérkt|trabajar
`.trim().split('\n').map((line) => {
  const [present, presentPron, past, pastPron, es, flag] = line.split('|').map((x) => x.trim());
  const double = flag === 'd';
  return {
    es,
    present,
    presentPron,
    third: present === 'be' ? 'is' : thirdPerson(present),
    past,
    pastPron,
    future: `will ${present}`,
    futurePron: `uíl ${presentPron}`,
    ing: present === 'be' ? 'being' : gerund(present, double),
    irregular: past !== regularPast(present, double),
  };
});

export const VIP_TABLES = [
  { id: 'verbos', title: 'Verbos', desc: 'Presente, pasado y futuro. Los dorados son irregulares: su pasado se aprende de memoria.', kind: 'verbs', rows: VERBS },
  { id: 'bienvenidas', title: 'Bienvenidas', desc: 'Para recibir y hacer sentir bien al cliente.', rows: words(`
Welcome|uélcom|bienvenidos
Welcome in|uélcom in|bienvenidos, pasen
Welcome back|uélcom bak|bienvenidos otra vez
Good morning|gud mórning|buenos días
Good afternoon|gud afternún|buenas tardes
Good evening|gud ívning|buenas noches (al llegar)
Good night|gud náit|buenas noches (al irse)
Hello|jelóu|hola
Hi there|jái der|hola, qué tal
How are you?|jáu ar yu|¿cómo está?
How are you doing?|jáu ar yu dúing|¿cómo le va?
Nice to see you|náis tu si yu|qué gusto verlo
Nice to meet you|náis tu mit yu|mucho gusto
Good to see you again|gud tu si yu aguén|qué bueno verlo de nuevo
Please come in|plis cam in|pase, por favor
Right this way|ráit dis uéi|por aquí
Follow me, please|fólou mi plis|sígame, por favor
Here is your table|jir is yor téibol|aquí está su mesa
Have a seat|jav a sit|tome asiento
Make yourself comfortable|méik yorsélf cámfortabol|póngase cómodo
I will be your server|ái uíl bi yor sérver|yo seré su mesero
My name is|mái néim is|mi nombre es
Happy to help|jápi tu jelp|con gusto le ayudo
Enjoy your meal|enchói yor mil|buen provecho
Have a great night|jav a gréit náit|que tenga linda noche
Have a nice day|jav a náis déi|que tenga buen día
See you soon|si yu sun|nos vemos pronto
Come back soon|cam bak sun|vuelva pronto
Thanks for coming|zanks for cáming|gracias por venir
It was a pleasure|it uás a pléshur|fue un placer
`) },
  { id: 'preguntas', title: 'Preguntas al cliente', desc: 'Las preguntas que más vas a usar en una mesa.', rows: words(`
How many people?|jáu méni pípol|¿cuántas personas?
Do you have a reservation?|du yu jav a reservéishon|¿tiene reservación?
Under what name?|ánder uát néim|¿a nombre de quién?
Inside or outside?|insáid or autsáid|¿adentro o afuera?
Is this table okay?|is dis téibol oquéi|¿está bien esta mesa?
Can I get you something to drink?|can ái guet yu sámzing tu drink|¿le traigo algo de tomar?
What would you like to drink?|uát uúd yu láik tu drink|¿qué le gustaría tomar?
Still or sparkling?|stil or spárkling|¿sin gas o con gas?
With ice?|uíz áis|¿con hielo?
Are you ready to order?|ar yu rédi tu órder|¿están listos para ordenar?
Do you need more time?|du yu nid mor táim|¿necesitan más tiempo?
What can I get you?|uát can ái guet yu|¿qué le traigo?
What would you like?|uát uúd yu láik|¿qué le gustaría?
How would you like it cooked?|jáu uúd yu láik it cukt|¿cómo quiere la carne?
Which side would you like?|uích sáid uúd yu láik|¿qué acompañamiento quiere?
Anything else?|énizing els|¿algo más?
Is that everything?|is dat évrizing|¿eso es todo?
How is everything?|jáu is évrizing|¿cómo va todo?
Is everything okay?|is évrizing oquéi|¿todo bien?
Do you have any allergies?|du yu jav éni álerchis|¿tiene alguna alergia?
Can I take your plate?|can ái téik yor pléit|¿puedo llevarme su plato?
Are you finished?|ar yu fínisht|¿ya terminó?
Would you like dessert?|uúd yu láik disért|¿quiere postre?
Would you like coffee?|uúd yu láik cófi|¿quiere café?
Would you like a box?|uúd yu láik a box|¿quiere una caja?
Together or separate?|tuguéder or séparet|¿juntos o separados?
Cash or card?|cash or card|¿efectivo o tarjeta?
Can I see your ID?|can ái si yor ái di|¿puedo ver su identificación?
Is this for here or to go?|is dis for jir or tu góu|¿es para aquí o para llevar?
Can you repeat that, please?|can yu ripít dat plis|¿puede repetir, por favor?
`) },
  { id: 'cortesia', title: 'Respuestas y cortesía', desc: 'Para sonar amable y resolver cualquier momento.', rows: words(`
Please|plis|por favor
Thank you|zank yu|gracias
Thank you so much|zank yu sóu mach|muchas gracias
You are welcome|yu ar uélcom|de nada
My pleasure|mái pléshur|con mucho gusto
Of course|of cors|claro
Sure|shur|claro, seguro
Absolutely|ábsolutli|por supuesto
No problem|nóu próblem|no hay problema
No worries|nóu uéris|no se preocupe
Right away|ráit auéi|enseguida
Coming right up|cáming ráit ap|ya se lo traigo
One moment, please|uán móment plis|un momento, por favor
I will be right back|ái uíl bi ráit bak|ya regreso
Take your time|téik yor táim|tómese su tiempo
Excuse me|exquiús mi|disculpe
I am sorry|ái am sóri|lo siento
I am so sorry|ái am sóu sóri|lo siento mucho
I apologize|ái apólochais|le pido disculpas
Sorry for the wait|sóri for de uéit|perdón por la espera
Thank you for your patience|zank yu for yor péishens|gracias por su paciencia
Let me check|let mi chek|déjeme revisar
Let me ask the kitchen|let mi ask de quíchen|déjeme preguntar en la cocina
Let me fix that|let mi fix dat|déjeme arreglar eso
I will talk to my manager|ái uíl tok tu mái mánacher|voy a hablar con mi gerente
Great choice|gréit chóis|excelente elección
Good question|gud quéschon|buena pregunta
I recommend|ái recoménd|le recomiendo
I understand|ái anderstánd|entiendo
I am not sure|ái am not shur|no estoy seguro
Congratulations|congrachuléishons|felicidades
Happy birthday|jápi bérzdei|feliz cumpleaños
`) },
  { id: 'bebidas', title: 'Bebidas', desc: 'Con y sin alcohol.', rows: words(`
water|uóter|agua
still water|stil uóter|agua sin gas
sparkling water|spárkling uóter|agua con gas
tap water|tap uóter|agua de la llave
ice|áis|hielo
lemon|lémon|limón
lime|láim|lima
straw|stro|pitillo, popote
soda|sóuda|refresco
Coke|cóuk|Coca-Cola
Diet Coke|dáiet cóuk|Coca-Cola de dieta
lemonade|lemonéid|limonada
iced tea|áist ti|té helado
hot tea|jot ti|té caliente
sweet tea|suít ti|té dulce
coffee|cófi|café
decaf|dícaf|descafeinado
espresso|esprésou|café expreso
cappuccino|capuchíno|capuchino
latte|láte|café con leche
milk|milk|leche
cream|crim|crema
sugar|shúgar|azúcar
orange juice|óranch chus|jugo de naranja
apple juice|ápol chus|jugo de manzana
pineapple juice|páinapol chus|jugo de piña
cranberry juice|cránberi chus|jugo de arándano
beer|bir|cerveza
draft beer|draft bir|cerveza de barril
bottle|bótol|botella
glass|glas|vaso, copa
wine|uáin|vino
red wine|red uáin|vino tinto
white wine|uáit uáin|vino blanco
rosé|rouséi|vino rosado
champagne|shampéin|champaña
cocktail|cócteil|cóctel
mojito|mojíto|mojito
margarita|margaríta|margarita
piña colada|pínya coláda|piña colada
rum|ram|ron
tequila|tequíla|tequila
vodka|vódca|vodka
whiskey|uíski|whisky
on the rocks|on de roks|con hielo
neat|nit|solo, sin hielo
happy hour|jápi áuer|hora feliz
`) },
  { id: 'comida', title: 'Platos y comida', desc: 'Lo que más se pide en el menú.', rows: words(`
appetizer|apetáiser|entrada
starter|stárter|entrada
main course|méin cors|plato fuerte
side|sáid|acompañamiento
soup|sup|sopa
salad|sálad|ensalada
Caesar salad|sísar sálad|ensalada César
burger|bérguer|hamburguesa
cheeseburger|chísberguer|hamburguesa con queso
sandwich|sánduich|sándwich
wrap|rap|wrap, rollo
tacos|tácos|tacos
pizza|pítsa|pizza
pasta|pásta|pasta
linguine|lingüíni|linguine
spaghetti|spaguéti|espaguetis
lasagna|lasánya|lasaña
chicken|chíquen|pollo
chicken wings|chíquen uíngs|alitas de pollo
turkey|térqui|pavo
fish|fish|pescado
salmon|sámon|salmón
tuna|túna|atún
snapper|snáper|pargo
seafood|sífud|mariscos
shrimp|shrimp|camarón
lobster|lóbster|langosta
crab|crab|cangrejo
oysters|óisters|ostras
calamari|calamári|calamares
eggs|egs|huevos
omelet|ómlet|omelet
pancakes|pánqueiks|panqueques
waffles|uáfols|wafles
toast|tóust|pan tostado
bread|bred|pan
butter|báter|mantequilla
cheese|chis|queso
kids menu|quids ményu|menú de niños
special|spéshal|especial del día
`) },
  { id: 'carnes', title: 'Carnes y términos', desc: 'Cortes y cómo se cocinan.', rows: words(`
meat|mit|carne
steak|stéik|bistec
ribeye|ráibai|corte ribeye
sirloin|sérloin|solomillo
filet|filéi|filete
New York strip|niú york strip|corte New York
T-bone|tí bóun|corte T-bone
prime rib|práim rib|costilla de res
ribs|ribs|costillas
pork|pork|cerdo
pork chop|pork chop|chuleta de cerdo
bacon|béicon|tocino
ham|jam|jamón
sausage|sósech|salchicha
lamb|lam|cordero
ground beef|gráund bif|carne molida
rare|rer|poco cocido
medium rare|mídium rer|medio rojo
medium|mídium|término medio
medium well|mídium uél|tres cuartos
well done|uél dan|bien cocido
grilled|grild|a la parrilla
fried|fráid|frito
baked|béikt|al horno
roasted|róusted|asado
smoked|smóukt|ahumado
steamed|stimd|al vapor
sautéed|sotéid|salteado
crispy|críspi|crujiente
juicy|chúsi|jugoso
`) },
  { id: 'acompanantes', title: 'Verduras y acompañantes', desc: 'Lo que va al lado del plato.', rows: words(`
fries|fráis|papas fritas
sweet potato fries|suít potéito fráis|papas de camote
mashed potatoes|masht potéitos|puré de papas
baked potato|béikt potéito|papa al horno
rice|ráis|arroz
beans|bins|frijoles
black beans|blak bins|frijoles negros
vegetables|véchtabols|verduras
asparagus|aspáragus|espárragos
broccoli|brócoli|brócoli
carrots|kérots|zanahorias
corn|corn|maíz, elote
green beans|grin bins|ejotes
spinach|spínach|espinaca
mushrooms|máshrums|champiñones
onions|ányons|cebollas
tomato|toméito|tomate
lettuce|létus|lechuga
cucumber|quiúcamber|pepino
pepper|péper|pimiento, pimienta
avocado|avocádo|aguacate
garlic|gárlic|ajo
plantains|plántins|plátanos
coleslaw|cóulslo|ensalada de col
ketchup|quéchap|cátsup
mustard|mástard|mostaza
mayonnaise|meionéis|mayonesa
hot sauce|jot sos|salsa picante
ranch|ranch|aderezo ranch
dressing|drésing|aderezo
salt|solt|sal
`) },
  { id: 'postres', title: 'Postres', desc: 'Para cerrar la comida con algo dulce.', rows: words(`
dessert|disért|postre
cake|quéik|pastel
chocolate cake|chóclet quéik|pastel de chocolate
cheesecake|chísqueik|pastel de queso
key lime pie|qui láim pái|pie de limón
apple pie|ápol pái|pay de manzana
ice cream|áis crim|helado
vanilla|vanília|vainilla
chocolate|chóclet|chocolate
strawberry|stróberi|fresa
scoop|scup|bola de helado
brownie|bráuni|brownie
flan|flan|flan
tiramisu|tiramisú|tiramisú
cookie|cúqui|galleta
whipped cream|uípt crim|crema batida
caramel|cáramel|caramelo
fruit|frut|fruta
candle|cándol|vela
spoon|spun|cuchara
sweet|suít|dulce
`) },
  { id: 'mesa', title: 'En la mesa', desc: 'Todo lo que un cliente te puede pedir.', rows: words(`
table|téibol|mesa
booth|buz|reservado
chair|cher|silla
high chair|jái cher|silla para bebé
booster seat|búster sit|asiento elevado
menu|ményu|menú
wine list|uáin list|carta de vinos
plate|pléit|plato
small plate|smol pléit|plato pequeño
bowl|bóul|tazón
glass|glas|vaso
cup|cap|taza
mug|mag|tarro
fork|fork|tenedor
knife|náif|cuchillo
spoon|spun|cuchara
napkin|nápkin|servilleta
silverware|sílveruer|cubiertos
tray|tréi|charola
pitcher|pícher|jarra
tablecloth|téibolcloz|mantel
candle|cándol|vela
crayons|créions|crayones
to-go box|tu góu box|caja para llevar
bag|bag|bolsa
pen|pen|bolígrafo
`) },
  { id: 'cuenta', title: 'Cuenta y pago', desc: 'El final de cada mesa.', rows: words(`
check|chek|cuenta
bill|bil|cuenta, factura
receipt|risít|recibo
tip|tip|propina
tax|tax|impuesto
total|tótal|total
cash|cash|efectivo
change|chéinch|cambio
card|card|tarjeta
credit card|crédit card|tarjeta de crédito
debit card|débit card|tarjeta de débito
signature|sígnachur|firma
split the check|split de chek|dividir la cuenta
separate checks|séparet cheks|cuentas separadas
included|inclúdid|incluido
discount|díscaunt|descuento
coupon|cúpon|cupón
gift card|guift card|tarjeta de regalo
price|práis|precio
free|fri|gratis
dollar|dólar|dólar
cents|sents|centavos
declined|dicláind|rechazada
machine|mashín|máquina
`) },
  { id: 'alergias', title: 'Alergias e ingredientes', desc: 'Con una alergia nunca se adivina: siempre se pregunta en la cocina.', rows: words(`
allergy|álerchi|alergia
allergic|alérchic|alérgico
nuts|nats|nueces
peanuts|pínats|cacahuates
shellfish|shélfish|mariscos
gluten|glúten|gluten
gluten free|glúten fri|sin gluten
wheat|uít|trigo
dairy|déri|lácteos
eggs|egs|huevos
soy|sói|soya
sesame|sésami|ajonjolí
honey|jáni|miel
vegetarian|vecheterían|vegetariano
vegan|vígan|vegano
no meat|nóu mit|sin carne
spicy|spáisi|picante
mild|máild|suave
ingredients|ingrídients|ingredientes
oil|óil|aceite
herbs|erbs|hierbas
cilantro|silántro|cilantro
sauce|sos|salsa
on the side|on de sáid|aparte
without|uizáut|sin
extra|éxtra|extra
kitchen|quíchen|cocina
chef|shef|chef
`) },
  { id: 'adjetivos', title: 'Cómo es: adjetivos', desc: 'Para describir platos, mesas y momentos.', rows: words(`
hot|jot|caliente
cold|cóuld|frío
warm|uórm|tibio
fresh|fresh|fresco
delicious|delíshos|delicioso
good|gud|bueno
great|gréit|muy bueno
bad|bad|malo
sweet|suít|dulce
salty|sólti|salado
sour|sáuer|ácido, agrio
bitter|bíter|amargo
spicy|spáisi|picante
big|big|grande
small|smol|pequeño
large|larch|grande
full|ful|lleno
empty|émpti|vacío
clean|clin|limpio
dirty|dérti|sucio
wet|uét|mojado
dry|drái|seco
new|niú|nuevo
ready|rédi|listo
busy|bísi|ocupado, lleno
quiet|cuáiet|tranquilo
loud|láud|ruidoso
fast|fast|rápido
slow|slóu|lento
late|léit|tarde
early|érli|temprano
popular|pópiular|popular
wrong|rong|equivocado
right|ráit|correcto
sure|shur|seguro
sorry|sóri|apenado
happy|jápi|feliz
hungry|jángri|con hambre
thirsty|zérsti|con sed
tired|táierd|cansado
`) },
  { id: 'lugares', title: 'Personas y lugares', desc: 'Quién es quién y dónde queda cada cosa.', rows: words(`
server|sérver|mesero
waiter|uéiter|mesero
waitress|uéitres|mesera
host|jóust|anfitrión
hostess|jóustes|anfitriona
busser|báser|ayudante de mesero
bartender|bartender|cantinero
cook|cuk|cocinero
chef|shef|chef
manager|mánacher|gerente
guest|guest|invitado, cliente
customer|cástomer|cliente
family|fámili|familia
kids|quids|niños
baby|béibi|bebé
kitchen|quíchen|cocina
bar|bar|barra
restroom|réstrum|baño
bathroom|bázrum|baño
entrance|éntrans|entrada
exit|éxit|salida
patio|pátio|terraza
outside|autsáid|afuera
inside|insáid|adentro
window|uíndou|ventana
upstairs|apstérs|arriba
downstairs|dáunsters|abajo
in the back|in de bak|al fondo
on the right|on de ráit|a la derecha
on the left|on de left|a la izquierda
next to|next tu|junto a
parking|párking|estacionamiento
`) },
  { id: 'numeros', title: 'Números', desc: 'Para mesas, personas, precios y minutos.', rows: words(`
one|uán|uno
two|tu|dos
three|zri|tres
four|for|cuatro
five|fáiv|cinco
six|six|seis
seven|séven|siete
eight|éit|ocho
nine|náin|nueve
ten|ten|diez
eleven|iléven|once
twelve|tuélv|doce
thirteen|zértin|trece
fourteen|fortín|catorce
fifteen|fiftín|quince
sixteen|sixtín|dieciséis
seventeen|seventín|diecisiete
eighteen|eitín|dieciocho
nineteen|naintín|diecinueve
twenty|tuénti|veinte
thirty|zérti|treinta
forty|fórti|cuarenta
fifty|fífti|cincuenta
sixty|síxti|sesenta
seventy|séventi|setenta
eighty|éiti|ochenta
ninety|náinti|noventa
one hundred|uán jándred|cien
first|ferst|primero
second|sécond|segundo
third|zerd|tercero
half|jaf|mitad
`) },
  { id: 'tiempo', title: 'Tiempo y momentos', desc: 'Para hablar de esperas, horarios y días.', rows: words(`
now|náu|ahora
right now|ráit náu|ahora mismo
soon|sun|pronto
later|léiter|más tarde
today|tudéi|hoy
tonight|tunáit|esta noche
tomorrow|tumórou|mañana
yesterday|yésterdei|ayer
morning|mórning|mañana (parte del día)
afternoon|afternún|tarde
evening|ívning|noche
minute|mínit|minuto
ten minutes|ten mínits|diez minutos
fifteen minutes|fiftín mínits|quince minutos
hour|áuer|hora
half an hour|jaf an áuer|media hora
breakfast|brékfast|desayuno
lunch|lanch|almuerzo
dinner|díner|cena
open|óupen|abierto
closed|clóusd|cerrado
always|ólueis|siempre
never|néver|nunca
again|aguén|otra vez
Monday|mándei|lunes
Tuesday|túsdei|martes
Wednesday|uénsdei|miércoles
Thursday|zérsdei|jueves
Friday|fráidei|viernes
Saturday|sáterdei|sábado
Sunday|sándei|domingo
weekend|uíkend|fin de semana
`) },
];

export const VIP_BY_ID = new Map(VIP_TABLES.map((t) => [t.id, t]));
/** La clave que identifica una palabra de un tema. */
export const vipWord = (table, row) => (table.kind === 'verbs' ? row.present : row.en);
export const vipMeaning = (row) => row.es;
