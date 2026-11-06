// Capibara original de ENGLISH47: silueta fija; solo cambian expresion y accesorios.
const VESTS = { default: '#000437', vest_green: '#2c7a00', vest_blue: '#0a6b9c', vest_wine: '#7a1f3d' };
const OUTLINE = '#3f2a1a';

const eyes = {
  open: `<circle cx="72" cy="66" r="6.500" fill="${OUTLINE}"/><circle cx="128" cy="66" r="6.500" fill="${OUTLINE}"/>
         <circle cx="74.500" cy="63.500" r="2.200" fill="#fff"/><circle cx="130.500" cy="63.500" r="2.200" fill="#fff"/>`,
  focus: `<circle cx="72" cy="68" r="6" fill="${OUTLINE}"/><circle cx="128" cy="68" r="6" fill="${OUTLINE}"/>
          <circle cx="74" cy="66" r="2" fill="#fff"/><circle cx="130" cy="66" r="2" fill="#fff"/>
          <path d="M61 58 L82 61 M139 58 L118 61" stroke="${OUTLINE}" stroke-width="4" stroke-linecap="round"/>`,
  happy: `<path d="M62 69 Q72 56 82 69 M118 69 Q128 56 138 69" fill="none" stroke="${OUTLINE}" stroke-width="5" stroke-linecap="round"/>`,
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
  hat_beret: `<path d="M50 36 Q58 8 104 8 Q150 8 152 34 Q100 22 50 36 Z" fill="#7a1f3d" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>
              <circle cx="104" cy="6" r="5" fill="#7a1f3d" stroke="${OUTLINE}" stroke-width="3"/>`,
  hat_flower: `<g transform="translate(148 40)" stroke="${OUTLINE}" stroke-width="3">
      <circle cx="0" cy="-11" r="9" fill="#e0568a"/><circle cx="10" cy="-3" r="9" fill="#e0568a"/><circle cx="6" cy="9" r="9" fill="#e0568a"/>
      <circle cx="-6" cy="9" r="9" fill="#e0568a"/><circle cx="-10" cy="-3" r="9" fill="#e0568a"/><circle cx="0" cy="0" r="5" fill="#f5b400"/></g>`,
};

const GLASSES = `<g fill="rgba(255,255,255,.25)" stroke="${OUTLINE}" stroke-width="4">
  <circle cx="72" cy="66" r="15"/><circle cx="128" cy="66" r="15"/><path d="M87 66 Q100 60 113 66" fill="none"/></g>`;

export function capybara({ mood = 'welcome', size = 96, equipped = {}, label = 'Capibara de ENGLISH47' } = {}) {
  const m = MOODS[mood] ?? MOODS.welcome;
  const vest = VESTS[equipped.vest] ?? VESTS.default;
  return `<svg class="mascot" width="${size}" height="${size}" viewBox="0 0 200 200" role="img" aria-label="${label}">
    ${m.extra ?? ''}
    <path d="M38 200 Q38 150 70 146 L130 146 Q162 150 162 200 Z" fill="${vest}" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M78 146 L100 186 L122 146 Z" fill="#fff" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>
    <ellipse cx="54" cy="40" rx="11" ry="9" fill="#7c5230" stroke="${OUTLINE}" stroke-width="4"/>
    <ellipse cx="146" cy="40" rx="11" ry="9" fill="#7c5230" stroke="${OUTLINE}" stroke-width="4"/>
    <path d="M50 58 Q50 28 76 28 L124 28 Q150 28 150 58 L154 118 Q154 150 124 150 L76 150 Q46 150 46 118 Z" fill="#a0703f" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M86 29 Q92 20 100 28 Q108 20 114 29" fill="#a0703f" stroke="${OUTLINE}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M56 112 Q56 92 76 92 L124 92 Q144 92 144 112 L144 124 Q144 146 122 146 L78 146 Q56 146 56 124 Z" fill="#c9a06f"/>
    <path d="M78 100 Q100 94 122 100 Q122 112 100 112 Q78 112 78 100 Z" fill="${OUTLINE}"/>
    <ellipse cx="89" cy="103" rx="3.500" ry="2.500" fill="#c9a06f"/><ellipse cx="111" cy="103" rx="3.500" ry="2.500" fill="#c9a06f"/>
    ${m.eyes}
    ${m.mouth}
    ${equipped.glasses ? GLASSES : ''}
    ${HATS[equipped.hat] ?? ''}
    <g stroke="${OUTLINE}" stroke-width="3.5" stroke-linejoin="round">
      <path d="M100 160 L80 150 L80 172 Z" fill="#e8483c"/><path d="M100 160 L120 150 L120 172 Z" fill="#e8483c"/>
      <circle cx="100" cy="160" r="5.5" fill="#b92f25"/>
    </g>
  </svg>`;
}
