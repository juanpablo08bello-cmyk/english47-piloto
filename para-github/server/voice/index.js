import { geminiPilot } from './gemini.js';
import { openAiRealtimeTts } from './realtime.js';
// Estado real de cada capacidad, limites de uso y registro de consumo.
import { localDate } from '../dates.js';
import { anthropicLlm, openAiStt } from './providers.js';

export function createVoiceServices(config, reserve) {
  if (config.pilotFree) return geminiPilot(config, reserve);
  const off = !config.voiceEnabled;
  const stt = !off && config.sttProvider === 'openai' && config.openaiKey
    ? openAiStt({ apiKey: config.openaiKey, baseUrl: config.openaiBaseUrl, model: config.sttModel }) : null;
  const tts = !off && config.ttsProvider === 'openai' && config.openaiKey
    ? openAiRealtimeTts({ apiKey: config.openaiKey, baseUrl: config.openaiBaseUrl, model: config.ttsModel, voice: config.ttsVoice }) : null;
  const llm = !off && config.llmProvider === 'anthropic' && config.anthropicKey
    ? anthropicLlm({ apiKey: config.anthropicKey, baseUrl: config.anthropicBaseUrl, model: config.llmModel }) : null;
  return { stt, tts, llm, pronunciation: null };
}

export function voiceStatus(services, config) {
  const missing = [];
  if (!config.voiceEnabled) missing.push('VOICE_ENABLED está en false');
  if (!services.llm) missing.push('Cliente IA: falta ANTHROPIC_API_KEY');
  if (!services.stt) missing.push('Transcripción: falta OPENAI_API_KEY (o el proveedor que elijas)');
  if (!services.tts) missing.push('Voz del cliente: falta OPENAI_API_KEY (mientras tanto se usa la voz del dispositivo)');
  if (config.pilotFree) {
    missing.length=0;
    if (!services.llm || !services.stt || !services.tts) missing.push('Revisa las capacidades gratuitas habilitadas en Administración.');
  }
  return {
    pilotFree: Boolean(config.pilotFree),
    aiAvailable: Boolean(services.llm),
    capabilities: {
      transcription: { available: Boolean(services.stt), provider: services.stt?.name ?? null },
      customer: { available: Boolean(services.llm), provider: services.llm?.name ?? null },
      speech: { available: Boolean(services.tts), provider: services.tts?.name ?? 'voz del dispositivo' },
      pronunciation: { available: false, provider: null, note: 'Sin servicio de pronunciación conectado: no se evalúa.' },
    },
    missing,
  };
}

const month = (day) => day.slice(0, 7);

export async function usedThisMonth(db, capability, nowMs, timeZone) {
  const m = month(localDate(nowMs, timeZone));
  return Number((await db.prepare('SELECT COALESCE(SUM(units),0) n FROM usage_log WHERE month=? AND capability=?').get(m, capability)).n);
}

/** Devuelve null si se puede continuar, o el limite alcanzado. */
export async function checkLimit(db, config, user, capability, nowMs) {
  const limit = config.limits[capability];
  if (limit && await usedThisMonth(db, capability, nowMs, user.timezone) >= limit) {
    return { code: 'limit_reached', message: 'Se agotó el límite de voz configurado para este mes. Puedes seguir en modo demo o por texto.' };
  }
  if (capability === 'stt') {
    const day = localDate(nowMs, user.timezone);
    const used = Number((await db.prepare(`SELECT COALESCE(SUM(units),0) n FROM usage_log WHERE user_id=? AND day=? AND capability='stt'`).get(user.id, day)).n);
    if (config.limits.sttPerUserDay && used >= config.limits.sttPerUserDay) {
      return { code: 'limit_reached', message: 'Llegaste al límite de voz de hoy. Puedes seguir por texto o volver mañana.' };
    }
  }
  return null;
}

export async function logUsage(db, user, capability, provider, units, unitType, nowMs) {
  const day = localDate(nowMs, user.timezone);
  await db.prepare('INSERT INTO usage_log (user_id, capability, provider, units, unit_type, day, month, created_at) VALUES (?,?,?,?,?,?,?,?)')
    .run(user.id, capability, provider, units, unitType, day, month(day), new Date(nowMs).toISOString());
}

/** Resumen para el administrador. El costo solo se estima si se configuraron tarifas verificadas. */
export async function usageReport(db, config, nowMs) {
  const tz = 'America/New_York';
  const rows = (await Promise.all([
    { key: 'stt', label: 'Transcripción', unit: 'segundos', rate: config.rates.sttPerSecond },
    { key: 'tts', label: 'Voz del cliente', unit: 'caracteres', rate: config.rates.ttsPerChar },
    { key: 'llm', label: 'Cliente y evaluador IA', unit: 'tokens', rate: config.rates.llmPerToken },
  ].map(async (r) => {
    const used = await usedThisMonth(db, r.key, nowMs, tz);
    const limit = config.limits[r.key] || null;
    return {
      ...r, used, limit,
      percent: limit ? Math.round((used / limit) * 100) : null,
      alert: limit ? used / limit >= config.alertAt : false,
      estimatedCost: r.rate ? used * r.rate : null,
    };
  })));
  const allRated = rows.every((r) => r.estimatedCost != null);
  return { rows, estimatedTotal: allRated ? rows.reduce((a, r) => a + r.estimatedCost, 0) : null };
}
