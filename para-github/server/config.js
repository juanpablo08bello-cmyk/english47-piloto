import { existsSync } from 'node:fs';

const num = (value, fallback) => {
  const n = Number(value);
  return value !== undefined && value !== '' && Number.isFinite(n) ? n : fallback;
};

export function loadConfig(env = process.env) {
  return {
    port: num(env.PORT, 4747),
    host: env.HOST || '0.0.0.0',
    storage: env.DATABASE_URL || env.STORAGE_DRIVER === 'postgres' || env.PILOT_FREE === 'true' || env.RENDER === 'true' ? 'postgres' : 'sqlite',
    databaseUrl: env.DATABASE_URL,
    dbPath: env.DB_PATH || 'data/english47.db',
    cookieSecure: env.COOKIE_SECURE === 'true',
    pilotFree: env.PILOT_FREE === 'true',
    voiceEnabled: env.VOICE_ENABLED !== 'false',
    geminiKey: env.GEMINI_API_KEY,
    freeVerified: env.GEMINI_FREE_VERIFIED === 'true',
    freeLimits: Object.fromEntries(['stt','tts','llm'].map(kind => {
      const n = Number(env['FREE_' + kind.toUpperCase() + '_CALLS_DAY']);
      return [kind, Number.isSafeInteger(n) && n > 0 ? n : 0];
    })),
    llmProvider: env.LLM_PROVIDER || 'anthropic',
    anthropicKey: env.ANTHROPIC_API_KEY || null,
    anthropicBaseUrl: env.ANTHROPIC_BASE_URL || null,
    llmModel: env.LLM_MODEL || 'claude-opus-5-5',
    sttProvider: env.STT_PROVIDER || 'openai',
    ttsProvider: env.TTS_PROVIDER || 'openai',
    openaiKey: env.OPENAI_API_KEY || null,
    openaiBaseUrl: env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    sttModel: env.STT_MODEL || 'gpt-transcribe',
    ttsModel: (!env.TTS_MODEL || /^(gpt-4o-mini-tts|tts-1)(-|$)/.test(env.TTS_MODEL)) ? 'gpt-realtime-2.1-mini' : env.TTS_MODEL,
    ttsVoice: env.TTS_VOICE || 'marin',
    limits: {
      stt: num(env.LIMIT_STT_SECONDS_MONTH, 36000),
      tts: num(env.LIMIT_TTS_CHARS_MONTH, 600000),
      llm: num(env.LIMIT_LLM_TOKENS_MONTH, 3000000),
      sttPerUserDay: num(env.LIMIT_STT_SECONDS_USER_DAY, 900),
    },
    alertAt: num(env.USAGE_ALERT_AT, 0.8),
    // Tarifas: vacias a proposito. Se llenan con precios verificados del proveedor elegido.
    rates: {
      sttPerSecond: num(env.RATE_STT_PER_SECOND, null),
      ttsPerChar: null, // Realtime factura tokens; la tarifa heredada por carácter no aplica.
      llmPerToken: num(env.RATE_LLM_PER_TOKEN, null),
    },
  };
}

export function loadDotEnv(path = '.env') {
  if (existsSync(path)) process.loadEnvFile(path);
}
