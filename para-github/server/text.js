// Utilidades de texto en ingles. Las comparaciones son por palabra completa, nunca por subcadena.
const CONTRACTIONS = [
  [/\bi'll\b/g, 'i will'], [/\bi'm\b/g, 'i am'], [/\bi'd\b/g, 'i would'], [/\bit's\b/g, 'it is'],
  [/\bthat's\b/g, 'that is'], [/\bcan't\b/g, 'cannot'], [/\bcan not\b/g, 'cannot'], [/\bdon't\b/g, 'do not'],
  [/\bdoesn't\b/g, 'does not'], [/\bdidn't\b/g, 'did not'], [/\bisn't\b/g, 'is not'], [/\baren't\b/g, 'are not'],
  [/\bwasn't\b/g, 'was not'], [/\bwe'll\b/g, 'we will'], [/\bwe're\b/g, 'we are'], [/\byou're\b/g, 'you are'],
  [/\byou'll\b/g, 'you will'], [/\byou'd\b/g, 'you would'], [/\bthere's\b/g, 'there is'], [/\bwon't\b/g, 'will not'],
  [/\bwhat's\b/g, 'what is'], [/\bhow's\b/g, 'how is'], [/\blet's\b/g, 'let us'], [/\bshouldn't\b/g, 'should not'],
  [/\bwouldn't\b/g, 'would not'], [/\bcouldn't\b/g, 'could not'], [/\bhaven't\b/g, 'have not'],
];

export function normalize(text) {
  let t = String(text ?? '').toLowerCase().replace(/[’`]/g, "'");
  for (const [re, rep] of CONTRACTIONS) t = t.replace(re, rep);
  return t.replace(/[^a-z0-9%' -]+/g, ' ').replace(/'/g, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
}

export const tokens = (text) => {
  const n = normalize(text);
  return n ? n.split(' ') : [];
};

export function editDistance(a, b) {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

export function similarity(a, b) {
  const s = normalize(a);
  const t = normalize(b);
  if (!s && !t) return 1;
  return 1 - editDistance(s, t) / Math.max(s.length, t.length, 1);
}

/** Indice donde aparece la secuencia de palabras, o -1. */
export function findPhrase(haystack, needle) {
  if (!needle.length) return -1;
  for (let i = 0; i + needle.length <= haystack.length; i++) {
    if (needle.every((w, j) => haystack[i + j] === w)) return i;
  }
  return -1;
}

/**
 * Clasifica una errata de una palabra. Solo se da por errata segura una letra de mas, de menos
 * o dos letras cambiadas de lugar, en palabras largas y con la misma primera letra.
 * Cambiar una letra por otra suele formar otra palabra (fried/dried, still/spill): eso queda en duda.
 */
export function typoKind(typed, target) {
  if (typed === target) return 'exact';
  if (typed[0] !== target[0] || target.length < 5) return editDistance(typed, target) === 1 ? 'doubtful' : 'different';
  const distance = editDistance(typed, target);
  if (typed.length !== target.length && Math.abs(typed.length - target.length) === 1 && distance === 1) return 'safe';
  if (typed.length === target.length) {
    const diff = [...typed].flatMap((c, i) => (c === target[i] ? [] : [i]));
    if (diff.length === 2 && diff[1] === diff[0] + 1 && typed[diff[0]] === target[diff[1]] && typed[diff[1]] === target[diff[0]]) return 'safe';
    if (distance === 1) return 'doubtful';
  }
  return 'different';
}

/** Compara dos frases palabra por palabra: 'exact', 'safe', 'doubtful' o 'different'. */
export function compareWords(a, b, isRealWord = () => false) {
  if (a.length !== b.length) return 'different';
  let worst = 'exact';
  for (let i = 0; i < a.length; i++) {
    let kind = typoKind(a[i], b[i]);
    // Una palabra que existe en el vocabulario no es una errata: es otra palabra.
    if (kind !== 'exact' && isRealWord(a[i])) kind = 'different';
    if (kind === 'different') return 'different';
    if (kind === 'doubtful') worst = 'doubtful';
    else if (kind === 'safe' && worst === 'exact') worst = 'safe';
  }
  return worst;
}

export const STOP = new Set(['a', 'an', 'the', 'to', 'of', 'is', 'it', 'i', 'you', 'that', 'this', 'and', 'or', 'for', 'be', 'will', 'am', 'are', 'please', 'with', 'so', 'do', 'at', 'on', 'in', 'yes', 'your', 'my', 'me', 'we', 'can', 'would', 'us', 'our', 'have', 'if', 'as', 'there']);
export const contentWords = (text) => tokens(text).filter((w) => !STOP.has(w));

export function keywordOverlap(answer, target) {
  const want = [...new Set(contentWords(target))];
  if (!want.length) return 0;
  const have = new Set(contentWords(answer));
  return want.filter((w) => have.has(w)).length / want.length;
}
