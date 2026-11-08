import { existsSync } from 'node:fs';

const num = (value, fallback) => {
  const n = Number(value);
  return value !== undefined && value !== '' && Number.isFinite(n) ? n : fallback;
};

const FREE_AZURE_LIMITS = { stt: 18000, tts: 500000 }; // Plan gratuito F0: 5 h y 0,5 M de caracteres al mes.

export function loadConfig(env = process.env) {
  const azure = env.AZURE_SPEECH_KEY && env.AZURE_SPEECH_REGION
    ? { apiKey: env.AZURE_SPEECH_KEY, region: env.AZURE_SPEECH_REGION.trim().toLowerCase() } : null;
  // Juez de construcción (Azure OpenAI / Microsoft Foundry). Opcional: sin esto se usan solo las reglas.
  const azureOpenai = env.AZURE_OPENAI_ENDPOINT && env.AZURE_OPENAI_KEY && env.AZURE_OPENAI_DEPLOYMENT
    ? { endpoint: env.AZURE_OPENAI_ENDPOINT.trim(), apiKey: env.AZURE_OPENAI_KEY, deployment: env.AZURE_OPENAI_DEPLOYMENT.trim(), reasoning: env.AZURE_OPENAI_REASONING || null } : null;
  // Jueces GRATUITOS (sin tarjeta): Groq y Google Gemini. Con los dos, califican juntos como jurado.
  const groq = env.GROQ_API_KEY ? { apiKey: env.GROQ_API_KEY, model: env.GROQ_MODEL || 'openai/gpt-oss-120b' } : null;
  const gemini = env.GEMINI_API_KEY ? { apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL || 'gemini-3.5-flash-lite' } : null;
  return {
    azure,
    azureOpenai,
    groq,
    gemini,
    port: num(env.PORT, 4747),
    host: env.HOST || '0.0.0.0',
    storage: env.DATABASE_URL || env.STORAGE_DRIVER === 'postgres' || env.PILOT_FREE === 'true' || env.RENDER === 'true' ? 'postgres' : 'sqlite',
    databaseUrl: env.DATABASE_URL,
    dbPath: env.DB_PATH || 'data/english47.db',
    cookieSecure: env.COOKIE_SECURE === 'true',
    pilotFree: env.PILOT_FREE === 'true',
    voiceEnabled: env.VOICE_ENABLED !== 'false',
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
      stt: num(env.LIMIT_STT_SECONDS_MONTH, azure ? FREE_AZURE_LIMITS.stt : 36000),
      tts: num(env.LIMIT_TTS_CHARS_MONTH, azure ? FREE_AZURE_LIMITS.tts : 600000),
      llm: num(env.LIMIT_LLM_TOKENS_MONTH, 3000000),
      // Juez: unos 900 tokens por respuesta. 1,5 M al mes ≈ 1.600 respuestas y menos de 1 dólar con un modelo mini.
      judge: num(env.LIMIT_JUDGE_TOKENS_MONTH, azureOpenai ? 1500000 : 4000000),
      sttPerUserDay: num(env.LIMIT_STT_SECONDS_USER_DAY, 900),
    },
    alertAt: num(env.USAGE_ALERT_AT, 0.8),
    // Tarifas: vacias a proposito. Se llenan con precios verificados del proveedor elegido.
    rates: {
      sttPerSecond: num(env.RATE_STT_PER_SECOND, null),
      ttsPerChar: null, // Realtime factura tokens; la tarifa heredada por carácter no aplica.
      llmPerToken: num(env.RATE_LLM_PER_TOKEN, null),
      judgePerToken: num(env.RATE_JUDGE_PER_TOKEN, null),
    },
  };
}

export function loadDotEnv(path = '.env') {
  if (existsSync(path)) process.loadEnvFile(path);
}
