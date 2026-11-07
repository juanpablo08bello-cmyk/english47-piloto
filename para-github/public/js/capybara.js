// La mascota de ENGLISH47. La capibara es la marca y siempre es la inicial; en la tienda se pueden
// elegir otros animales. Todos comparten silueta, ojos y ropa, así cualquier accesorio les queda.
const OUTLINE = '#3f2a1a';
const STROKE = `stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"`;

const VESTS = {
  default: '#000437', vest_green: '#2c7a00', vest_blue: '#0a6b9c', vest_wine: '#7a1f3d', vest_red: '#c8322b', vest_purple: '#5b2a86',
  vest_pink: '#e0568a', vest_gold: '#d6a51f', vest_black: '#15151c', vest_chef: '#f6f6f2', vest_sailor: '#f6f6f2', vest_hawaii: '#12a594',
};
const stripes = (color) => [166, 178, 190].map((y) => `<path d="M${y < 170 ? 46 : 42} ${y} L74 ${y} M126 ${y} L${y < 170 ? 154 : 158} ${y}" stroke="${color}" stroke-width="5"/>`).join('');
const flower = (x, y, c) => `<g fill="${c}"><circle cx="${x}" cy="${y - 4}" r="3.500"/><circle cx="${x + 4}" cy="${y}" r="3.500"/><circle cx="${x}" cy="${y + 4}" r="3.500"/><circle cx="${x - 4}" cy="${y}" r="3.500"/></g><circle cx="${x}" cy="${y}" r="2" fill="#f5c518"/>`;
const VEST_DETAIL = {
  vest_sailor: stripes('#1f5fa8'),
  vest_chef: `<g fill="${OUTLINE}"><circle cx="64" cy="170" r="3"/><circle cx="64" cy="186" r="3"/><circle cx="136" cy="170" r="3"/><circle cx="136" cy="186" r="3"/></g>`,
  vest_hawaii: `${flower(58, 172, '#ffd1e3')}${flower(70, 190, '#fff4b8')}${flower(142, 172, '#fff4b8')}${flower(130, 190, '#ffd1e3')}`,
  vest_black: `<path d="M80 150 L62 200 M120 150 L138 200" stroke="#3a3a48" stroke-width="5"/>`,
  vest_gold: `<g fill="#fff4b8"><circle cx="60" cy="168" r="2.500"/><circle cx="72" cy="186" r="2.500"/><circle cx="140" cy="168" r="2.500"/><circle cx="128" cy="186" r="2.500"/></g>`,
};

const eyes = {
  open: (c) => `<circle cx="72" cy="66" r="6.500" fill="${c}"/><circle cx="128" cy="66" r="6.500" fill="${c}"/>
         <circle cx="74.500" cy="63.500" r="2.200" fill="#fff"/><circle cx="130.500" cy="63.500" r="2.200" fill="#fff"/>`,
  focus: (c) => `<circle cx="72" cy="68" r="6" fill="${c}"/><circle cx="128" cy="68" r="6" fill="${c}"/>
          <circle cx="74" cy="66" r="2" fill="#fff"/><circle cx="130" cy="66" r="2" fill="#fff"/>
          <path d="M61 58 L82 61 M139 58 L118 61" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  happy: (c) => `<path d="M62 69 Q72 56 82 69 M118 69 Q128 56 138 69" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`,
};

const MOODS = {
  welcome: { eyes: eyes.open, mouth: `<path d="M86 125 Q100 136 114 125" fill="none" stroke="${OUTLINE}" stroke-width="4" stroke-linecap="round"/>` },
  focus: { eyes: eyes.focus, mouth: `<path d="M90 127 L110 127" stroke="${OUTLINE}" stroke-width="4" stroke-linecap="round"/>` },
  cheer: { eyes: eyes.open, mouth: `<path d="M82 123 Q100 142 118 123 Z" fill="#7d3b2c" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>` },
  celebrate: {
    eyes: eyes.happy,
    mouth: `<path d="M80 122 Q100 146 120 122 Z" fill="#7d3b2c" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>`,
    extra: `<g stroke-width="0"><rect x="18" y="26" width="10" height="10" rx="2" fill="#58cc02" transform="rotate(20 23 31)"/>
      <rect x="170" y="20" width="10" height="10" rx="2" fill="#1cb0f6" transform="rotate(-18 175 25)"/>
      <circle cx="32" cy="62" r="5" fill="#f5b400"/><circle cx="176" cy="60" r="5" fill="#e0568a"/>
      <rect x="152" y="6" width="8" height="8" rx="2" fill="#f5b400"/><rect x="40" y="6" width="8" height="8" rx="2" fill="#e0568a"/></g>`,
  },
};

const HATS = {
  hat_beret: `<path d="M50 36 Q58 8 104 8 Q150 8 152 34 Q100 22 50 36 Z" fill="#7a1f3d" ${STROKE}/><circle cx="104" cy="6" r="5" fill="#7a1f3d" stroke="${OUTLINE}" stroke-width="3"/>`,
  hat_flower: `<g transform="translate(148 40)" stroke="${OUTLINE}" stroke-width="3">
      <circle cx="0" cy="-11" r="9" fill="#e0568a"/><circle cx="10" cy="-3" r="9" fill="#e0568a"/><circle cx="6" cy="9" r="9" fill="#e0568a"/>
      <circle cx="-6" cy="9" r="9" fill="#e0568a"/><circle cx="-10" cy="-3" r="9" fill="#e0568a"/><circle cx="0" cy="0" r="5" fill="#f5b400"/></g>`,
  hat_cap: `<path d="M56 44 Q58 10 100 10 Q142 10 144 44 Z" fill="#d93a32" ${STROKE}/><path d="M52 44 Q100 32 148 44 Q154 56 132 52 Q100 45 68 52 Q46 56 52 44 Z" fill="#a82a24" ${STROKE}/><circle cx="100" cy="10" r="4" fill="#fff" stroke="${OUTLINE}" stroke-width="3"/>`,
  hat_party: `<path d="M72 42 L100 2 L128 42 Q100 50 72 42 Z" fill="#ff8cc2" ${STROKE}/><g fill="#fff050"><circle cx="92" cy="30" r="4"/><circle cx="108" cy="33" r="4"/><circle cx="100" cy="17" r="3.500"/></g><circle cx="100" cy="6" r="6" fill="#6fd3ff" stroke="${OUTLINE}" stroke-width="3"/>`,
  hat_headphones: `<path d="M42 82 C34 4 166 4 158 82" fill="none" stroke="#15151c" stroke-width="10" stroke-linecap="round"/><g fill="#e8483c" ${STROKE}><rect x="28" y="68" width="24" height="42" rx="11"/><rect x="148" y="68" width="24" height="42" rx="11"/></g>`,
  hat_cowboy: `<path d="M64 42 Q66 4 86 8 Q100 15 114 8 Q134 4 136 42 Z" fill="#9c6a33" ${STROKE}/><rect x="65" y="30" width="70" height="9" fill="#5b3a1c"/><path d="M22 44 Q60 30 100 42 Q140 30 178 44 Q150 58 100 50 Q50 58 22 44 Z" fill="#b97f42" ${STROKE}/>`,
  hat_chef: `<g fill="#fff" ${STROKE}><circle cx="68" cy="20" r="16"/><circle cx="132" cy="20" r="16"/><circle cx="100" cy="14" r="19"/><path d="M62 24 L138 24 L136 48 L64 48 Z"/></g><path d="M64 38 L136 38" stroke="${OUTLINE}" stroke-width="3"/>`,
  hat_top: `<rect x="68" y="4" width="64" height="38" rx="4" fill="#15151c" ${STROKE}/><rect x="68" y="30" width="64" height="9" fill="#e8483c"/><path d="M46 44 Q100 34 154 44 Q100 54 46 44 Z" fill="#15151c" ${STROKE}/>`,
  hat_crown: `<path d="M58 46 L52 10 L78 26 L100 2 L122 26 L148 10 L142 46 Q100 54 58 46 Z" fill="#f5c518" ${STROKE}/><g stroke="${OUTLINE}" stroke-width="2.500"><circle cx="100" cy="34" r="6" fill="#e8483c"/><circle cx="74" cy="37" r="4.500" fill="#1cb0f6"/><circle cx="126" cy="37" r="4.500" fill="#58cc02"/></g>`,
};

const heart = (x, y) => `M${x} ${y + 12} C${x - 22} ${y - 2} ${x - 12} ${y - 18} ${x} ${y - 8} C${x + 12} ${y - 18} ${x + 22} ${y - 2} ${x} ${y + 12} Z`;
const star = (x, y) => `M${x} ${y - 17} L${x + 5} ${y - 5} L${x + 17} ${y - 4} L${x + 8} ${y + 4} L${x + 11} ${y + 16} L${x} ${y + 9} L${x - 11} ${y + 16} L${x - 8} ${y + 4} L${x - 17} ${y - 4} L${x - 5} ${y - 5} Z`;
const GLASSES = {
  glasses_round: `<g fill="rgba(255,255,255,.25)" stroke="${OUTLINE}" stroke-width="4"><circle cx="72" cy="66" r="15"/><circle cx="128" cy="66" r="15"/><path d="M87 66 Q100 60 113 66" fill="none"/></g>`,
  glasses_sun: `<g fill="#15151c" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"><rect x="52" y="54" width="40" height="26" rx="10"/><rect x="108" y="54" width="40" height="26" rx="10"/></g><path d="M92 62 Q100 58 108 62" fill="none" stroke="${OUTLINE}" stroke-width="4"/><path d="M60 60 L72 60 M116 60 L128 60" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`,
  glasses_heart: `<g fill="#ff5c9a" fill-opacity=".9" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"><path d="${heart(72, 66)}"/><path d="${heart(128, 66)}"/></g><path d="M90 62 Q100 58 110 62" fill="none" stroke="${OUTLINE}" stroke-width="4"/>`,
  glasses_star: `<g fill="#f5c518" fill-opacity=".9" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"><path d="${star(72, 66)}"/><path d="${star(128, 66)}"/></g><path d="M88 62 Q100 58 112 62" fill="none" stroke="${OUTLINE}" stroke-width="4"/>`,
};

const bow = (wing, knot) => `<g stroke="${OUTLINE}" stroke-width="3.500" stroke-linejoin="round"><path d="M100 160 L80 150 L80 172 Z" fill="${wing}"/><path d="M100 160 L120 150 L120 172 Z" fill="${wing}"/><circle cx="100" cy="160" r="5.500" fill="${knot}"/></g>`;
const leiFlowers = [[64, 154, '#ff8cc2'], [76, 164, '#fff050'], [90, 170, '#ff8a65'], [110, 170, '#ff8cc2'], [124, 164, '#fff050'], [136, 154, '#ff8a65']];
const NECK = {
  default: bow('#e8483c', '#b92f25'),
  neck_blue: bow('#1cb0f6', '#0a6b9c'),
  neck_gold: bow('#f5c518', '#b58900'),
  neck_tie: `<path d="M90 150 L110 150 L105 164 L113 188 L100 199 L87 188 L95 164 Z" fill="#1f5fa8" ${STROKE}/><path d="M90 174 L110 168 M89 186 L112 179" stroke="#9fd0ff" stroke-width="3"/>`,
  neck_scarf: `<path d="M62 146 Q100 166 138 146 L141 164 Q100 186 59 164 Z" fill="#e8483c" ${STROKE}/><path d="M118 170 L136 198 L118 200 L108 174 Z" fill="#c8322b" ${STROKE}/>`,
  neck_lei: leiFlowers.map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="9" fill="${c}" stroke="${OUTLINE}" stroke-width="2.500"/><circle cx="${x}" cy="${y}" r="2.500" fill="#fff"/>`).join(''),
  neck_medal: `<path d="M78 148 L100 178 L122 148" fill="none" stroke="#1f5fa8" stroke-width="9"/><circle cx="100" cy="182" r="14" fill="#f5c518" ${STROKE}/><path d="${star(100, 183).replace(/(\d+(?:\.\d+)?) (\d+(?:\.\d+)?)/g, (_, x, y) => `${100 + (x - 100) * 0.5} ${183 + (y - 183) * 0.5}`)}" fill="#fff4b8"/>`,
};

// Cabeza redonda común para los animales nuevos: misma altura de ojos y boca que la capibara.
const HEAD = 'M100 30 C146 30 160 66 158 100 C156 134 130 150 100 150 C70 150 44 134 42 100 C40 66 54 30 100 30 Z';
const head = (fill) => `<path d="${HEAD}" fill="${fill}" ${STROKE}/>`;
const headLine = `<path d="${HEAD}" fill="none" ${STROKE}/>`;
const mirror = (svg) => `${svg}<g transform="translate(200 0) scale(-1 1)">${svg}</g>`;
const mane = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * Math.PI * 2;
  return `<circle cx="${(100 + Math.cos(a) * 62).toFixed(1)}" cy="${(90 + Math.sin(a) * 60).toFixed(1)}" r="23" fill="#b9651a" stroke="${OUTLINE}" stroke-width="4"/>`;
}).join('');

const ANIMALS = {
  animal_cat: {
    back: mirror(`<path d="M50 64 L44 12 L92 34 Z" fill="#f0a04b" ${STROKE}/><path d="M57 46 L54 25 L76 36 Z" fill="#ffc2c9"/>`),
    face: `${head('#f0a04b')}<path d="M100 32 L100 48 M86 34 L88 47 M114 34 L112 47" stroke="#c46f1e" stroke-width="5" stroke-linecap="round"/>
      ${mirror('<path d="M44 92 L60 95 M46 108 L60 107" stroke="#c46f1e" stroke-width="5" stroke-linecap="round"/>')}
      <ellipse cx="100" cy="118" rx="31" ry="25" fill="#fff1dc"/><path d="M92 103 L108 103 L100 112 Z" fill="#f2798f" stroke="${OUTLINE}" stroke-width="2.500" stroke-linejoin="round"/>`,
  },
  animal_dog: {
    back: '',
    face: `${head('#dcaa6f')}<ellipse cx="128" cy="66" rx="22" ry="25" fill="#b97c41"/><ellipse cx="100" cy="118" rx="35" ry="29" fill="#fff1dc"/>
      <ellipse cx="100" cy="103" rx="12" ry="9" fill="${OUTLINE}"/><ellipse cx="96" cy="100" rx="3.500" ry="2" fill="#fff" opacity=".7"/>${headLine}
      ${mirror(`<path d="M60 36 C30 34 18 80 28 110 C36 126 56 108 56 78 C56 62 58 50 60 36 Z" fill="#8a5a2b" ${STROKE}/>`)}`,
  },
  animal_rabbit: {
    back: mirror(`<ellipse cx="76" cy="28" rx="15" ry="27" fill="#efe7f6" ${STROKE} transform="rotate(-8 76 28)"/><ellipse cx="76" cy="28" rx="7" ry="18" fill="#f7b6cf" transform="rotate(-8 76 28)"/>`),
    face: `${head('#f6f0fa')}${mirror('<circle cx="58" cy="102" r="10" fill="#fbcfe0"/>')}<ellipse cx="100" cy="118" rx="27" ry="21" fill="#fff"/><path d="M92 103 L108 103 L100 112 Z" fill="#f2798f" stroke="${OUTLINE}" stroke-width="2.500" stroke-linejoin="round"/>`,
  },
  animal_fox: {
    back: mirror(`<path d="M48 68 L38 8 L92 36 Z" fill="#ec7f33" ${STROKE}/><path d="M38 8 L44 32 L62 22 Z" fill="#2b2b33"/>`),
    face: `<path d="${HEAD}" fill="#ec7f33"/><path d="M43 98 C60 92 84 102 100 128 C116 102 140 92 157 98 C156 134 130 150 100 150 C70 150 44 134 43 98 Z" fill="#fff5ea"/>${headLine}<ellipse cx="100" cy="110" rx="10" ry="7.500" fill="#2b2b33"/>`,
  },
  animal_panda: {
    eye: '#0b0b0e',
    back: mirror(`<circle cx="50" cy="42" r="20" fill="#2b2b33" ${STROKE}/>`),
    face: `${head('#fbfbf8')}${mirror('<ellipse cx="70" cy="70" rx="20" ry="24" fill="#3a3a44" transform="rotate(14 70 70)"/><circle cx="72" cy="66" r="10" fill="#fff"/>')}
      <ellipse cx="100" cy="118" rx="30" ry="24" fill="#f0f0ea"/><ellipse cx="100" cy="106" rx="10" ry="7" fill="#2b2b33"/>`,
  },
  animal_monkey: {
    back: mirror(`<circle cx="34" cy="80" r="21" fill="#7a5234" ${STROKE}/><circle cx="34" cy="80" r="11" fill="#f0c9a0"/>`),
    face: `${head('#7a5234')}${mirror('<circle cx="72" cy="70" r="27" fill="#f0c9a0"/>')}<ellipse cx="100" cy="114" rx="43" ry="33" fill="#f0c9a0"/>
      <circle cx="94" cy="100" r="3" fill="${OUTLINE}"/><circle cx="106" cy="100" r="3" fill="${OUTLINE}"/><path d="M94 30 Q100 18 106 30" fill="#7a5234" stroke="${OUTLINE}" stroke-width="3.500"/>`,
  },
  animal_lion: {
    back: `${mane}${mirror(`<circle cx="60" cy="42" r="15" fill="#f4be55" ${STROKE}/>`)}`,
    face: `${head('#f4be55')}<ellipse cx="100" cy="118" rx="33" ry="27" fill="#fff1dc"/><path d="M89 102 L111 102 Q112 108 100 114 Q88 108 89 102 Z" fill="#5a3418"/><path d="M100 30 L100 42 M90 32 L92 42 M110 32 L108 42" stroke="#b9651a" stroke-width="4" stroke-linecap="round"/>`,
  },
  animal_tiger: {
    back: mirror(`<circle cx="52" cy="44" r="18" fill="#f39a2b" ${STROKE}/><circle cx="52" cy="44" r="9" fill="#2b2b33"/>`),
    face: `${head('#f39a2b')}<ellipse cx="100" cy="118" rx="35" ry="28" fill="#fff7ea"/>${mirror('<ellipse cx="72" cy="72" rx="17" ry="15" fill="#fff7ea"/>')}
      <path d="M100 32 L100 50 M86 33 L90 46 M114 33 L110 46" stroke="#2b2b33" stroke-width="6" stroke-linecap="round"/>
      ${mirror('<path d="M43 82 L60 88 M42 100 L58 102 M46 118 L60 116" stroke="#2b2b33" stroke-width="6" stroke-linecap="round"/>')}
      <path d="M90 103 L110 103 L100 113 Z" fill="#e8607a" stroke="${OUTLINE}" stroke-width="2.500" stroke-linejoin="round"/>`,
  },
};

const CAPYBARA = {
  back: `<ellipse cx="54" cy="40" rx="11" ry="9" fill="#7c5230" stroke="${OUTLINE}" stroke-width="4"/><ellipse cx="146" cy="40" rx="11" ry="9" fill="#7c5230" stroke="${OUTLINE}" stroke-width="4"/>`,
  face: `<path d="M50 58 Q50 28 76 28 L124 28 Q150 28 150 58 L154 118 Q154 150 124 150 L76 150 Q46 150 46 118 Z" fill="#a0703f" ${STROKE}/>
    <path d="M86 29 Q92 20 100 28 Q108 20 114 29" fill="#a0703f" stroke="${OUTLINE}" stroke-width="3.500" stroke-linejoin="round"/>
    <path d="M56 112 Q56 92 76 92 L124 92 Q144 92 144 112 L144 124 Q144 146 122 146 L78 146 Q56 146 56 124 Z" fill="#c9a06f"/>
    <path d="M78 100 Q100 94 122 100 Q122 112 100 112 Q78 112 78 100 Z" fill="${OUTLINE}"/>
    <ellipse cx="89" cy="103" rx="3.500" ry="2.500" fill="#c9a06f"/><ellipse cx="111" cy="103" rx="3.500" ry="2.500" fill="#c9a06f"/>`,
};

export function capybara({ mood = 'welcome', size = 96, equipped = {}, label = 'Mascota de ENGLISH47' } = {}) {
  const m = MOODS[mood] ?? MOODS.welcome;
  const look = equipped ?? {};
  const animal = ANIMALS[look.animal] ?? CAPYBARA;
  const vest = VESTS[look.vest] ?? VESTS.default;
  return `<svg class="mascot" width="${size}" height="${size}" viewBox="0 0 200 200" role="img" aria-label="${label}">
    ${m.extra ?? ''}
    <path d="M38 200 Q38 150 70 146 L130 146 Q162 150 162 200 Z" fill="${vest}" ${STROKE}/>
    ${VEST_DETAIL[look.vest] ?? ''}
    <path d="M78 146 L100 186 L122 146 Z" fill="#fff" ${STROKE}/>
    ${animal.back}
    ${animal.face}
    ${m.eyes(animal.eye ?? OUTLINE)}
    ${m.mouth}
    ${GLASSES[look.glasses] ?? ''}
    ${HATS[look.hat] ?? ''}
    ${NECK[look.neck] ?? NECK.default}
  </svg>`;
}
