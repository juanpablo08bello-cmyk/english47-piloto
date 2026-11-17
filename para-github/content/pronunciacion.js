// Cómo suena cada palabra, escrito con letras del español. Es una ayuda aproximada:
// lo que se aprende es la palabra en inglés, y el modelo real es el audio.
// La tilde marca la sílaba fuerte; "j" es la h inglesa; "z" la th de "thank"; "d" la th de "this";
// "ch" también cubre la j inglesa de "allergy". Las escrituras dudosas se eligieron midiendo:
// una voz en español lee cada opción y Azure la evalúa contra la frase en inglés.
const WORDS = {
  a: 'a', about: 'abáut', afternoon: 'afternún', again: 'aguén', alcohol: 'álcojol', all: 'ol', allergic: 'alérchic', allergies: 'álerchis', allergy: 'álerchi',
  am: 'am', an: 'an', and: 'and', another: 'anáder', any: 'éni', anything: 'énizing', are: 'ar', ask: 'ask', asparagus: 'aspáragus', at: 'at', away: 'auéi',
  back: 'bak', bag: 'bag', bar: 'bar', be: 'bi', beach: 'bíich', beautiful: 'biútiful', beer: 'bir', behind: 'bijáind', birthday: 'bérzdei', bottle: 'bótol', box: 'box',
  bread: 'bred', break: 'bréik', bring: 'bring', bubbles: 'bábols', burger: 'bérguer', butter: 'báter', by: 'bái',
  caesar: 'sísar', calamari: 'calamári', call: 'col', can: 'can', card: 'card', care: 'quer', careful: 'quérful', cash: 'cash', chair: 'cher', change: 'chéinch', check: 'chek',
  cheers: 'chirs', cheese: 'chis', cheesecake: 'chísqueik', chef: 'shef', chicken: 'chíquen', children: 'chíldren', choice: 'chóis', clean: 'clin', closes: 'clóusis',
  coffee: 'cófi', cold: 'cóuld', come: 'cam', comes: 'cams', coming: 'cáming', confirm: 'conférm', congratulations: 'congrachuléishons', contain: 'contéin', contains: 'contéins',
  cooked: 'cukt', could: 'cud', course: 'cors', crayons: 'créians',
  dairy: 'déri', day: 'déi', dessert: 'disért', did: 'did', dinner: 'díner', dish: 'dish', do: 'du', doing: 'dúing', "don't": 'dóunt', done: 'dan', dressing: 'drésing', drink: 'drink', drinks: 'drinks',
  eat: 'iit', else: 'els', enjoy: 'enchói', evening: 'ívning', everything: 'évrizing', excuse: 'ekskiús',
  few: 'fiú', fifteen: 'fiftín', first: 'ferst', fish: 'fish', five: 'fáiv', fix: 'fiks', follow: 'fólou', food: 'fud', for: 'for', forget: 'forguét', fork: 'fork', forks: 'forks',
  four: 'for', free: 'fri', fried: 'fráid', fries: 'fráis', from: 'from', full: 'ful',
  garlic: 'gárlic', get: 'guet', give: 'guiv', glad: 'glad', glass: 'glas', gluten: 'glúten', go: 'góu', going: 'góuing', good: 'gud', got: 'got', great: 'gréit', grilled: 'grild', guess: 'gues',
  happened: 'jápend', happy: 'jápi', has: 'jas', have: 'jav', having: 'jáving', hear: 'jir', help: 'jelp', herb: 'erb', here: 'jir', high: 'jái', hot: 'jot', how: 'jáu',
  i: 'ái', "i'll": 'áil', "i'm": 'áim', ice: 'áis', iced: 'áist', id: 'ái di', in: 'in', inside: 'insáid', is: 'is', it: 'it',
  key: 'qui', kids: 'kids', kitchen: 'kíchen', knife: 'náif',
  large: 'larch', lemon: 'lémon', let: 'let', lettuce: 'létus', like: 'láik', lime: 'láim', linguine: 'lingüíni', list: 'list', little: 'lítol', longer: 'lónguer',
  made: 'méid', make: 'méik', manager: 'mánacher', many: 'méni', mashed: 'masht', may: 'méi', me: 'mi', meal: 'mil', meat: 'mit', medium: 'mídium', menu: 'méniu', miami: 'maiámi', milk: 'milk',
  mint: 'mint', minute: 'mínit', minutes: 'mínits', mojito: 'mojíto', moment: 'móument', more: 'mor', my: 'mái',
  name: 'néim', napkins: 'nápkins', need: 'nid', new: 'nu', nice: 'náis', night: 'náit', no: 'nóu', not: 'not', now: 'náu', number: 'námber', nuts: 'nats',
  of: 'of', okay: 'oukéi', old: 'óuld', on: 'on', one: 'uán', onions: 'ánions', or: 'or', order: 'órder', our: 'áuer', outside: 'autsáid',
  pack: 'pak', patience: 'péishens', pay: 'péi', people: 'pípol', perfect: 'pérfect', phone: 'fóun', picture: 'píkchur', pie: 'pái', pink: 'pink', plate: 'pléit', plates: 'pléits', please: 'plis',
  pleasure: 'pléshur', popular: 'pópiular', potatoes: 'potéitos', problem: 'próblem', put: 'put',
  questions: 'kuéschons', rare: 'rer', ready: 'rédi', receipt: 'risít', recommend: 'recoménd', red: 'red', refill: 'rífil', refills: 'rífils', repeat: 'ripít', reservation: 'reservéishon',
  restroom: 'réstrum', ribeye: 'ráibai', right: 'ráit', roasted: 'róusted', room: 'rum', rum: 'ram', running: 'ráning', rush: 'rash',
  salad: 'sálad', sauce: 'sos', save: 'séiv', say: 'séi', seat: 'sit', see: 'si', send: 'send', separate: 'séprit', serious: 'sírius', server: 'sérver', share: 'sher', shrimp: 'shrimp', side: 'sáid',
  sign: 'sáin', slowly: 'slóuli', small: 'smol', snapper: 'snáper', so: 'sóu', some: 'sam', something: 'sámzing', son: 'san', soon: 'sun', sorry: 'sóri', soup: 'sup', sparkling: 'spárkling',
  specials: 'spéshals', spicy: 'spáisi', split: 'split', spoons: 'spuns', start: 'start', starter: 'stárter', steak: 'stéik', still: 'stil', stroller: 'stróuler', sugar: 'shúgar', sure: 'shur',
  table: 'téibol', tables: 'téibols', take: 'téik', takes: 'téiks', talk: 'tok', tap: 'tap', tea: 'ti', tell: 'tel', telling: 'téling', ten: 'ten', thank: 'zank', thanks: 'zanks', that: 'dat', the: 'de',
  there: 'der', this: 'dis', time: 'táim', times: 'táims', tip: 'tip', to: 'tu', today: 'tudéi', together: 'tuguéder', tomato: 'toméito', tonight: 'tunáit', two: 'tu',
  under: 'ánder', understand: 'anderstánd', up: 'ap', very: 'véri', wait: 'uéit', waiting: 'uéiting', want: 'uánt', was: 'uás', water: 'uóter', way: 'uéi', we: 'ui', welcome: 'uélcom', well: 'uél',
  // Respuestas de ejemplo de las mesas clásicas.
  25: 'tuénti fáiv', ana: 'ána', answer: 'ánser', apologize: 'apólochais', approve: 'aprúv', booked: 'bukt', but: 'bat', bye: 'bái', "can't": 'kant', capers: 'kéipers', cell: 'sel', center: 'sénter',
  couple: 'cápol', decaf: 'dícaf', declined: 'dicláind', double: 'dábol', each: 'ich', evenly: 'ívenli', far: 'far', fault: 'folt', fine: 'fáin', fryer: 'fráier', fully: 'fúli', gas: 'gas',
  guarantee: 'guerantí', hello: 'jelóu', instead: 'instéd', item: 'áitem', just: 'chast', know: 'nóu', later: 'léiter', light: 'láit', money: 'máni', mood: 'mud', must: 'mast', myself: 'maisélf',
  nothing: 'názing', oat: 'óut', off: 'of', ok: 'oukéi', only: 'óunli', ordered: 'órderd', out: 'áut', over: 'óuver', pasta: 'pásta', percent: 'persént', potato: 'potéito', promise: 'prómis',
  regular: 'réguiuler', remake: 'riméik', safe: 'séif', shared: 'sherd', slow: 'slóu', speak: 'spik', taking: 'téiking', tasting: 'téisting', things: 'zings', those: 'dóus', totally: 'tótali',
  tree: 'tri', try: 'trái', twenty: 'tuénti', warm: 'uórm', worry: 'uéri',
  what: 'uát', when: 'uén', where: 'uér', white: 'uáit', will: 'uíl', wine: 'uáin', with: 'uíz', without: 'uizáut', working: 'uérking', would: 'uud', yes: 'yes', you: 'yu', your: 'yor',
  // Cuarta tanda: conversaciones de Mesas
  absolutely: 'ábsolutli', after: 'áfter', appreciate: 'apríshieit', around: 'aráund', as: 'as', asking: 'ásking', before: 'bifór', being: 'bíing', bill: 'bil', both: 'bóuz', busy: 'bísi', chance: 'chans', close: 'clóus',
  everybody: 'évribadi', extra: 'éxtra', home: 'jóum', hurry: 'jéri', if: 'if', last: 'last', learning: 'lérning', letting: 'léting', look: 'luk', menus: 'ményus', move: 'muv', normal: 'nórmal', oh: 'óu', party: 'párti',
  patient: 'péishent', place: 'pléis', prefer: 'prifér', question: 'quéschon', same: 'séim', should: 'shud', signature: 'sígnachur', smile: 'smáil', sold: 'sóuld', someone: 'sámuan', sounds: 'sáunds', started: 'stárted',
  "that's": 'dats', them: 'dem', these: 'dis', think: 'zink', thinking: 'zínking', through: 'zru', turn: 'tern', usual: 'yúshual', worked: 'uérkt', worries: 'uéris', wow: 'uáu', years: 'yírs',
  // Tercera tanda
  cover: 'cáver', hope: 'jóup', live: 'liv', near: 'nir', total: 'tótal', us: 'as', window: 'uíndou',
  almost:'ólmoust', also:'ólsou', anyone:'éniuan', appetizer:'apetáiser', apple:'ápol', baby:'béibi', beans:'bins', been:'bin', big:'big', booster:'búster', booth:'buz', bottled:'bótold', breakfast:'brékfast', brings:'brings', burgers:'bérguers', cake:'quéik', cards:'cards', celebrating:'sélebreiting', chocolate:'chóclet', city:'síti', coat:'cóut', coke:'cóuk', corner:'córner', cream:'crim', cut:'cat', daughter:'dóter', delicious:'delíshos', delivery:'delíveri', diet:'dáiet', does:'das', drive:'dráiv', eggs:'egs', eleven:'iléven', ends:'ends', english:'ínglish', favorite:'féivorit', found:'fáund', fresh:'fresh', game:'guéim', he:'ji', hi:'jái', hour:'áuer', house:'jáus', improving:'imprúving', included:'inclúdid', instead:'instéd', juice:'chus', ketchup:'quéchap', lemonade:'lemonéid', liked:'láikt', long:'long', lot:'lot', love:'lav', lunch:'lanch', margarita:'margaríta', meet:'mit', mexico:'méxico', middle:'mídol', mistake:'mistéik', morning:'mórning', most:'móust', much:'mach', mushrooms:'máshrums', needs:'nids', options:'ópshons', orange:'óranch', ounces:'áunsis', pen:'pen', pepsi:'pépsi', raining:'réining', really:'ríli', reservations:'reservéishons', rice:'ráis', rim:'rim', rocks:'roks', salmon:'sámon', salt:'solt', salty:'sólti', served:'servd', sharing:'shéring', she:'shi', shellfish:'shélfish', shirt:'shert', sit:'sit', six:'six', smooth:'smud', soda:'sóuda', special:'spéshal', spoon:'spun', straw:'stro', sweet:'suít', tax:'tax', text:'text', three:'zri', "today's":'tudéis', too:'tu', twelve:'tuélv', unsweet:'ansuít', until:'antíl', vacation:'vaquéishon', vanilla:'vanília', vegetables:'véchtabols', vegetarian:'vecheterían', weekend:'uíkend', wheat:'uít', which:'uích', who:'ju', work:'uérk', wrong:'rong',
};

const WORD = /[\p{L}\d]+(?:['’]\p{L}+)*/gu;

/** Palabras sin pronunciación escrita. Una prueba exige que esta lista quede vacía. */
// Palabras nuevas de la versión 1.3 (desayuno, happy hour, turno).
Object.assign(WORDS, {
  patio: 'pátio', round: 'ráund', whenever: 'uenéver', visiting: 'vísiting', anniversary: 'anivérsari', runner: 'ráner', nine: 'náin', run: 'ran',
  seven: 'séven', wants: 'uánts', scrambled: 'scrámbold', toast: 'tóust', whole: 'jóul', bacon: 'béicon', sausage: 'sósech', pancakes: 'pánqueiks',
  syrup: 'sírap', serve: 'serv', noon: 'nun', brunch: 'branch', starts: 'starts', fruit: 'frut', hash: 'jash', browns: 'bráuns', half: 'jaf',
  price: 'práis', wings: 'uíngs', they: 'déi', tacos: 'tácos', cook: 'cuk', while: 'uáil',
  overcooked: 'overcúkt', came: 'quéim',
});
// Cartas de los locales (content/restaurantes.js): café, brunch, rooftop y hotel.
Object.assign(WORDS, {
  avocado: 'avocádo', wrap: 'rap', turkey: 'térki', sandwich: 'sánduich', burrito: 'burríto', pancake: 'pánqueik', stack: 'stak', french: 'french',
  benedict: 'bénedict', omelet: 'ómlet', banana: 'banána', ham: 'jam', taco: 'táco', wing: 'uing', basket: 'básquet', flatbread: 'flátbred',
  crispy: 'críspi', basil: 'básil', risotto: 'risóto', lobster: 'lóbster', filet: 'filé', mignon: 'miñón', mousse: 'mus', tender: 'ténder', creamy: 'crími',
});
export const missingWords = (text) => (String(text).match(WORD) ?? [])
  .map((w) => w.toLowerCase().replace(/’/g, "'"))
  .filter((w) => !Object.hasOwn(WORDS, w));

/** Convierte una frase conservando su puntuación. Si falta una palabra no se inventa: devuelve null. */
export function pronounce(text) {
  if (missingWords(text).length) return null;
  return String(text).replace(WORD, (w) => WORDS[w.toLowerCase().replace(/’/g, "'")]);
}

// Mesas ampliadas (wifi, niños, reservas, cierre).
Object.assign(WORDS, {
  wifi: 'uáifai', password: 'pásuord', find: 'fáind', kind: 'káind', size: 'sáis', candle: 'cándol', leave: 'liv', news: 'niús', use: 'yus', yet: 'yet',
  stop: 'stop', phones: 'fóuns', closing: 'clóusing', closed: 'clóusd', write: 'ráit', writing: 'ráiting', down: 'dáun',
});

// Unidades 9 a 16 («Expresarse»): palabras de las opciones de las simulaciones.
Object.assign(WORDS, {
  why: 'uái', enough: 'inóf', sunrise: 'sánraiz', rest: 'rest', stay: 'stéi', because: 'bicós', difference: 'díferens', lighter: 'láiter', richer: 'ríquer',
  either: 'íder', mild: 'máild', then: 'den', seared: 'síerd', golden: 'góulden', fire: 'fáier', add: 'ad', dollars: 'dólars', pressure: 'préshur',
  suggest: 'sayést', set: 'set', completely: 'complítli', refunds: 'rífands', sound: 'sáund', ran: 'ran', wear: 'uér', jacket: 'yáquet',
  wonderful: 'uánderful', mom: 'mom', occasion: 'okéishon', once: 'uáns', sing: 'sing', candles: 'cándols', serving: 'sérving',
  enjoyed: 'enyóid', yeah: 'ye', means: 'minz', review: 'rivyú', next: 'nekst',
});

// Mesas nuevas (lote 1).
Object.assign(WORDS, {
  ahead: 'ajéd', anytime: 'énitaim', blocks: 'bloks', bowl: 'bóul', calling: 'cóling', carry: 'kári', cute: 'kiút', dog: 'dog', dogs: 'dogs', eight: 'éit', fit: 'fit', friend: 'frend',
  fun: 'fan', goodnight: 'gudnáit', happens: 'jápens', heat: 'jit', hurt: 'jert', left: 'left', movie: 'múvi', nobody: 'nóubadi', open: 'óupen', parking: 'párking', pepper: 'péper',
  restaurant: 'réstorant', shade: 'shéid', shady: 'shéidi', shall: 'shal', spanish: 'spánish', straight: 'stréit', street: 'strit', taxi: 'táksi', validate: 'válideit', walk: 'uok', works: 'uérks',
});
Object.assign(WORDS, { charge: 'charch', house: 'jáus' });

// Mesas nuevas (lote 2).
Object.assign(WORDS, {
  bigger: 'bíguer', book: 'buk', bother: 'báder', cheaper: 'chíper', club: 'clab', costs: 'costs', cozy: 'cóusi', deposit: 'depósit', every: 'évri', fits: 'fits', her: 'jer', idea: 'aidía',
  join: 'chóin', less: 'les', lips: 'lips', lovely: 'lávli', meanwhile: 'minuáil', opens: 'óupens', portion: 'pórshon', private: 'práivit', quiet: 'cuáiet', read: 'rid', relax: 'rilás',
  sealed: 'sild', soft: 'soft', thirty: 'zérti', understanding: 'anderstánding', watch: 'uoch', waters: 'uóters', wherever: 'juerévar',
});

// Mesas nuevas (lote 3).
Object.assign(WORDS, {
  best: 'best', better: 'béter', calendar: 'cálendar', calm: 'cam', calmer: 'cámer', cancel: 'cánsel', canceled: 'cánseld', company: 'cámpani', dishes: 'díshis', everyone: 'évriuan',
  excellent: 'ékselent', given: 'guíven', health: 'jelz', him: 'jim', honor: 'ónor', hours: 'áuers', invoice: 'ínvois', local: 'lóucal', machine: 'mashín', matters: 'máters',
  milder: 'máilder', personally: 'pérsonali', prepare: 'pripér', print: 'print', relief: 'rilíf', replace: 'ripléis', service: 'sérvis', spell: 'spel', tomorrow: 'tumórou',
  touch: 'tach', trouble: 'trábol', wearing: 'uérin', were: 'uer', wind: 'uind', worth: 'uérz',
});

// Mesas nuevas (lote 4).
Object.assign(WORDS, {
  ago: 'agóu', bank: 'bank', carefully: 'quérfuli', checking: 'chéquin', dangerous: 'déincheros', days: 'déis', discreet: 'discrít', everywhere: 'évriuer', faster: 'fáster', gift: 'guift',
  groups: 'grups', guests: 'guests', happen: 'jápen', immediately: 'imídiatli', maybe: 'méibi', missing: 'mísing', napkin: 'nápkin', noise: 'nóis', offer: 'ófer', power: 'páuer',
  refund: 'rífand', remove: 'rimúv', rule: 'rul', sandwiches: 'sánduichis', scan: 'scan', sir: 'ser', slip: 'slip', standard: 'stándard', terrible: 'térible',
});

// Mesas nuevas (lote 5).
Object.assign(WORDS, {
  appetit: 'apetí', baker: 'béiker', black: 'blak', bon: 'bon', christmas: 'crísmas', cool: 'cul', fast: 'fast', friday: 'fráidei', green: 'grin', holidays: 'jólideis', honey: 'jáni',
  juices: 'chúsis', makes: 'méiks', merry: 'méri', oven: 'óven', past: 'past', quickly: 'cuíkli', recipe: 'résipi', secret: 'sícret', sharp: 'sharp', straws: 'strós', sweetener: 'suítener',
  true: 'tru', yourselves: 'yorsélvs',
});

// Mesas nuevas (lote 6).
Object.assign(WORDS, {
  biscuit: 'bískit', biscuits: 'bískits', bus: 'bas', coffees: 'cófis', combo: 'cómbou', docks: 'doks', dollar: 'dólar', fee: 'fi', florida: 'flórida', guest: 'guest', keep: 'kip',
  kid: 'kid', main: 'méin', music: 'miúsic', natural: 'náchural', part: 'part', per: 'per', person: 'pérson', plain: 'pléin', portions: 'pórshons', quick: 'cuík', restaurants: 'réstorants',
  ride: 'ráid', short: 'short', simple: 'símpol', south: 'sáuz', usually: 'iúshuali', visit: 'vísit',
});

// Mesas nuevas (lote 7).
Object.assign(WORDS, {
  amount: 'amáunt', chili: 'chíli', confirmed: 'conférmd', cooking: 'cúking', correct: 'corrékt', driver: 'dráiver', ended: 'énded', fixed: 'fikst', front: 'frant', goes: 'góus',
  goodbye: 'gudbái', herbs: 'erbs', his: 'jis', jars: 'charz', luck: 'lak', mostly: 'móustli', oil: 'óil', olive: 'ólive', quite: 'cuáit', refreshing: 'rifréshing', sell: 'sel',
  shift: 'shift', show: 'shóu', strong: 'strong', traffic: 'tráfic', trip: 'trip',
});

// Mesas nuevas (lote 8).
Object.assign(WORDS, {
  bottom: 'bótom', cleaning: 'clíning', confirmation: 'confirméishon', cooler: 'cúler', doctor: 'dóctor', email: 'ímeil', exit: 'égsit', fan: 'fan', fixing: 'fíxing', handle: 'jándol',
  hard: 'jard', helps: 'jelps', honest: 'ónest', job: 'yob', law: 'lo', lose: 'lus', other: 'áder', page: 'péich', pass: 'pas', payments: 'péiments', policy: 'pólisi', stains: 'stéins',
  system: 'sístem', trying: 'tráiing', week: 'uik', written: 'ríten',
});
