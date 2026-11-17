// Importar un menú desde foto, PDF o link. La IA solo LEE el menú; el resultado vuelve como borrador
// y pasa por validarPlatos: nada se guarda hasta que el mesero lo confirma en el editor.
import dns from 'node:dns/promises';
import net from 'node:net';
import Anthropic from '@anthropic-ai/sdk';
import { CATEGORIAS, MAX_PLATOS } from './menus.js';

export const MAX_ARCHIVO = 10 * 1024 * 1024;
export const MAX_TEXTO = 60000;
const TIPOS_ARCHIVO = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']);

/** True si la dirección es privada, local o reservada (protección SSRF). */
export function ipPrivada(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    if (v === '::1' || v === '::' || v.startsWith('fe80') || v.startsWith('fc') || v.startsWith('fd')) return true;
    const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return mapped ? ipPrivada(mapped[1]) : false;
  }
  return true;
}

export async function urlSegura(texto, resolver = (h) => dns.lookup(h, { all: true })) {
  let url;
  try { url = new URL(String(texto).trim()); } catch { return { error: 'Ese link no es válido.' }; }
  if (!['http:', 'https:'].includes(url.protocol)) return { error: 'Solo se aceptan links http o https.' };
  if (url.username || url.password) return { error: 'El link no puede llevar usuario ni contraseña.' };
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(host)) return ipPrivada(host) ? { error: 'Ese link apunta a una dirección privada.' } : { url };
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return { error: 'Ese link apunta a una dirección privada.' };
  let found;
  try { found = await resolver(host); } catch { return { error: 'No pudimos encontrar ese sitio.' }; }
  if (!found.length || found.some((a) => ipPrivada(a.address))) return { error: 'Ese link apunta a una dirección privada.' };
  return { url };
}

export function htmlATexto(html) {
  return String(html)
    .replace(/<(script|style|noscript|svg|head)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|li|tr|h\d|br|section)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
}

/** Descarga un link con límites de tamaño, tiempo y redirecciones; revisa cada salto contra SSRF. */
export async function descargar(texto, { resolver, fetcher = fetch } = {}) {
  let actual = texto;
  for (let salto = 0; salto < 4; salto++) {
    const check = await urlSegura(actual, resolver);
    if (check.error) return { error: check.error };
    let res;
    try { res = await fetcher(check.url, { redirect: 'manual', signal: AbortSignal.timeout(10000), headers: { 'user-agent': 'english47-menu/1.0', accept: 'text/html,application/pdf,image/*' } }); }
    catch { return { error: 'No pudimos abrir ese link. Prueba con una foto del menú.' }; }
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) { actual = new URL(res.headers.get('location'), check.url).href; continue; }
    if (!res.ok) return { error: `El sitio respondió con error (${res.status}).` };
    const tipo = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
    const largo = Number(res.headers.get('content-length') ?? 0);
    if (largo > MAX_ARCHIVO) return { error: 'El archivo del link pesa más de 10 MB.' };
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_ARCHIVO) return { error: 'El archivo del link pesa más de 10 MB.' };
    if (TIPOS_ARCHIVO.has(tipo)) return { archivo: { mime: tipo, base64: buf.toString('base64') } };
    if (tipo.startsWith('text/')) return { texto: htmlATexto(buf.toString('utf8')).slice(0, MAX_TEXTO) };
    return { error: 'Ese link no es una página ni un menú que podamos leer.' };
  }
  return { error: 'Ese link tiene demasiadas redirecciones.' };
}

const SYSTEM = `Lees menús de restaurantes y devuelves SOLO un JSON con los platos y bebidas escritos en el menú.
Reglas: no inventes nada; copia nombres tal como están (en inglés si están en inglés). "descripcion" es la que dice el menú, resumida a 160 caracteres como máximo (vacía si no hay). "precio" es un número en dólares o null si no se ve. "alergenos" solo si el menú los escribe; si no, lista vacía. "categoria" debe ser una de: ${Object.keys(CATEGORIAS).join(', ')}. Máximo ${MAX_PLATOS} platos; si hay más, los más representativos.`;

const ESQUEMA = {
  type: 'object', additionalProperties: false, required: ['platos'],
  properties: { platos: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['plato', 'categoria', 'descripcion', 'precio', 'alergenos'], properties: {
    plato: { type: 'string' }, categoria: { type: 'string' }, descripcion: { type: 'string' }, precio: { type: ['number', 'null'] }, alergenos: { type: 'array', items: { type: 'string' } },
  } } } },
};

/** Extractor real con visión. En pruebas se inyecta uno simulado. */
export function extractorClaude({ apiKey, baseUrl, model }) {
  const client = new Anthropic({ apiKey, ...(baseUrl ? { baseURL: baseUrl } : {}), timeout: 60000, maxRetries: 1 });
  return async ({ texto, archivo }) => {
    const content = [];
    if (archivo) {
      content.push(archivo.mime === 'application/pdf'
        ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: archivo.base64 } }
        : { type: 'image', source: { type: 'base64', media_type: archivo.mime, data: archivo.base64 } });
    }
    content.push({ type: 'text', text: texto ? `Menú (texto de la página):\n${texto}` : 'Extrae los platos de este menú.' });
    const response = await client.messages.create({ model, max_tokens: 8000, system: SYSTEM, messages: [{ role: 'user', content }], output_config: { format: { type: 'json_schema', schema: ESQUEMA } } });
    const text = response.content.find((b) => b.type === 'text')?.text;
    return JSON.parse(text).platos;
  };
}

/** Valida la entrada del cliente: { link } o { archivo: base64, mime }. */
export function leerEntrada(body) {
  if (body?.link !== undefined) return typeof body.link === 'string' && body.link.length <= 2000 ? { link: body.link } : { error: 'Escribe un link válido.' };
  if (typeof body?.archivo === 'string') {
    const mime = String(body.mime ?? '').toLowerCase();
    if (!TIPOS_ARCHIVO.has(mime)) return { error: 'Sube una foto (JPG, PNG, WebP) o un PDF.' };
    const base64 = body.archivo.replace(/^data:[^,]*,/, '');
    if (!/^[A-Za-z0-9+/=\s]+$/.test(base64)) return { error: 'El archivo no se pudo leer.' };
    if (Math.floor(base64.length * 0.75) > MAX_ARCHIVO) return { error: 'El archivo pesa más de 10 MB.' };
    return { archivo: { mime, base64: base64.replace(/\s/g, '') } };
  }
  return { error: 'Envía un link o un archivo.' };
}
