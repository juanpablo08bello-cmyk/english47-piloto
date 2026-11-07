// Utilidades compartidas de la interfaz.
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Si el servidor se actualiza con la pagina abierta, se ofrece recargar para no mezclar versiones.
let seenVersion = null;
function noteVersion(version) {
  if (!version) return;
  if (seenVersion && seenVersion !== version) window.dispatchEvent(new CustomEvent('e47:update'));
  seenVersion = version;
}

const reported = new Set();
/** Avisa a Administración de un fallo técnico, una vez por sesión. Nunca envía audio ni texto del alumno. */
export function reportIssue(code, where) {
  if (reported.has(code)) return;
  reported.add(code);
  fetch('/api/problema-tecnico', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ code, where }) }).catch(() => {});
}
globalThis.addEventListener?.('error', (e) => {
  const file = String(e.filename ?? '').split('/').pop();
  if (file) reportIssue('js_error', `${file}:${e.lineno ?? 0}`);
});

export const newRequestId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

export async function api(method, path, body) {
  let res;
  try {
    res = await fetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError(0, 'network', 'No hay conexión. Tu progreso sigue guardado; inténtalo de nuevo.');
  }
  noteVersion(res.headers.get('x-english47-version'));
  const data = (res.headers.get('content-type') ?? '').includes('json') ? await res.json() : null;
  if (!res.ok) {
    if (res.status === 401 && data?.error === 'not_authenticated' && !location.hash.startsWith('#/invite')) location.hash = '#/entrar';
    throw new ApiError(res.status, data?.error ?? 'error', data?.message ?? 'Algo falló. Inténtalo de nuevo.');
  }
  return data;
}

export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const stroke = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
export const icons = {
  today: stroke('<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>'),
  route: stroke('<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5"/>'),
  talk: stroke('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
  words: stroke('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M9 8h6M9 12h4"/>'),
  profile: stroke('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  store: stroke('<path d="M4 9l1.500-5h13L20 9M4 9a2.700 2.700 0 0 0 5.300.500A2.700 2.700 0 0 0 12 9a2.700 2.700 0 0 0 2.700.500A2.700 2.700 0 0 0 20 9M5.500 12v8h13v-8M10 20v-5h4v5"/>'),
  dice: stroke('<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M9 9h.01M15 9h.01M12 12h.01M9 15h.01M15 15h.01"/>'),
  check: stroke('<path d="M5 13l4 4L19 7"/>'),
  review: stroke('<path d="M12 8v5M12 17h.01"/><circle cx="12" cy="12" r="9"/>'),
  close: stroke('<path d="M6 6l12 12M18 6L6 18"/>'),
  back: stroke('<path d="M15 5l-7 7 7 7"/>'),
  sound: stroke('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 8.5a5 5 0 0 1 0 7"/>'),
  stop: stroke('<rect x="6" y="6" width="12" height="12" rx="2"/>'),
  star: stroke('<path d="M12 3l2.8 5.9 6.2.8-4.6 4.3 1.2 6.3L12 17l-5.6 3.3 1.2-6.3L3 9.7l6.2-.8z"/>'),
  starFill: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.8 5.9 6.2.8-4.6 4.3 1.2 6.3L12 17l-5.6 3.3 1.2-6.3L3 9.7l6.2-.8z"/></svg>`,
  shield: stroke('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>'),
  book: stroke('<path d="M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z"/>'),
  trophy: stroke('<path d="M8 4h8v6a4 4 0 0 1-8 0zM8 6H4v2a3 3 0 0 0 3 3M16 6h4v2a3 3 0 0 1-3 3M12 14v4M8 21h8M9 18h6"/>'),
  info: stroke('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
  plate: stroke('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/>'),
};

// Iconos de estadistica con color: racha, XP y monedas siempre visibles.
export const statIcons = {
  flame: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-4 2.500-7C10 8 11 9 11 10c1-2 1.500-5 1-8z" fill="#ff9600" stroke="#b25e00" stroke-width="1.500" stroke-linejoin="round"/></svg>`,
  coin: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="#ffc800" stroke="#b58900" stroke-width="2"/><path d="M12 7v10M9.500 9.500h4a1.500 1.500 0 0 1 0 3h-3a1.500 1.500 0 0 0 0 3h4" fill="none" stroke="#7a5c00" stroke-width="1.600" stroke-linecap="round"/></svg>`,
  xp: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="#58cc02" stroke="#2c7a00" stroke-width="1.600" stroke-linejoin="round"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6z" fill="#1cb0f6" stroke="#0a6b9c" stroke-width="1.800" stroke-linejoin="round"/></svg>`,
};

export function toast(message, ms = 3500) {
  const overlay = document.getElementById('overlay');
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = message;
  overlay.append(el);
  setTimeout(() => el.remove(), ms);
}

let soundEnabled = true;
export const setSound = (on) => { soundEnabled = on; };

let audioCtx = null;
const SOUNDS = {
  tap: { notes: [660], step: 0.05, length: 0.06, volume: 0.03 },
  miss: { notes: [330, 262], step: 0.12, length: 0.18, volume: 0.05 },
  good: { notes: [523, 659], step: 0.1, length: 0.18, volume: 0.07 },
  great: { notes: [523, 659, 784, 1047], step: 0.09, length: 0.2, volume: 0.07 },
  level: { notes: [392, 523, 659, 784, 1047, 1319], step: 0.1, length: 0.3, volume: 0.08 },
};

export function playSfx(kind) {
  const sound = SOUNDS[kind];
  if (!soundEnabled || !sound) return;
  try {
    audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    const start = audioCtx.currentTime;
    sound.notes.forEach((freq, i) => {
      const at = start + i * sound.step;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(sound.volume, at);
      gain.gain.exponentialRampToValueAtTime(0.001, at + sound.length);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(at);
      osc.stop(at + sound.length);
    });
  } catch { /* sin sonido si el navegador no lo permite */ }
}
export const chime = () => playSfx('great');

const CONFETTI_COLORS = ['#fff050', '#a9b4ff', '#ff8a65', '#35e8ad', '#ff8cc2', '#6fd3ff'];
export function confetti(pieces = 40) {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const box = document.createElement('div');
  box.className = 'confetti';
  box.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < pieces; i++) {
    const piece = document.createElement('i');
    piece.style.cssText = `left:${Math.random() * 100}%;background:${CONFETTI_COLORS[i % CONFETTI_COLORS.length]};animation-delay:${Math.random() * 0.35}s;--dx:${(Math.random() - 0.5) * 120}px;--r:${Math.random() * 720 - 360}deg`;
    box.append(piece);
  }
  document.body.append(box);
  setTimeout(() => box.remove(), 2400);
}

export function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}
