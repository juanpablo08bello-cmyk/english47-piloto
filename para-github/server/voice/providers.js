// Adaptadores intercambiables. Cada capacidad es independiente:
//   stt.transcribe({ audio, mimeType })           -> { text }
//   llm.customerTurn({ scenario, ... })           -> { say, done, ledger, tokens }
//   llm.evaluate({ scenario, ... })               -> { summary, tokens }
//   tts.speak({ text })                           -> { audio, mimeType }
// Para sumar un proveedor: escribe un objeto con estas funciones y registralo en index.js.
import Anthropic from '@anthropic-ai/sdk';
import { customerSystemPrompt, evaluatorSystemPrompt, CUSTOMER_SCHEMA, EVALUATOR_SCHEMA } from '../sim/prompts.js';

export class ProviderError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const EXTENSIONS = { 'audio/webm': 'webm', 'audio/mp4': 'mp4', 'audio/x-m4a': 'm4a', 'audio/aac': 'm4a', 'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/flac': 'flac', 'audio/ogg': 'ogg' };

function httpError(status) {
  if (status === 401 || status === 403) return new ProviderError('auth', 'El proveedor rechazó la credencial.');
  if (status === 429) return new ProviderError('rate_limited', 'El proveedor limitó las peticiones.');
  return new ProviderError('provider', `El proveedor respondió con estado ${status}.`);
}

async function guardedFetch(url, options) {
  try {
    return await fetch(url, { ...options, signal: AbortSignal.timeout(45000) });
  } catch {
    throw new ProviderError('network', 'No se pudo contactar al proveedor.');
  }
}

/** POST /v1/audio/transcriptions (multipart). Verificado contra la documentacion oficial, nov. 2026. */
export function openAiStt({ apiKey, baseUrl, model }) {
  return {
    name: `openai:${model}`,
    async transcribe({ audio, mimeType }) {
      const base = mimeType.split(';')[0].trim().toLowerCase();
      const ext = EXTENSIONS[base] ?? 'webm';
      const form = new FormData();
      form.append('file', new Blob([audio], { type: base }), `turn.${ext}`);
      form.append('model', model);
      form.append('response_format', 'json');
      form.append('prompt', 'A restaurant server in Miami Beach speaking English with a Spanish accent, talking to a guest about food, drinks and the check. Transcribe what is actually said, including mistakes and negations. Do not rewrite it into corrected or more polite English.');
      if (model.startsWith('gpt-transcribe')) form.append('languages[]', 'en');
      else form.append('language', 'en');
      const res = await guardedFetch(`${baseUrl}/audio/transcriptions`, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, body: form });
      if (!res.ok) throw httpError(res.status);
      let data;
      try { data = await res.json(); } catch { throw new ProviderError('provider', 'La transcripción no devolvió JSON válido.'); }
      if (typeof data.text !== 'string') throw new ProviderError('provider', 'La transcripción no devolvió texto.');
      return { text: data.text.trim() };
    },
  };
}

function mapAnthropicError(err) {
  if (err instanceof ProviderError) return err;
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) return new ProviderError('auth', 'El proveedor rechazó la credencial.');
  if (err instanceof Anthropic.RateLimitError) return new ProviderError('rate_limited', 'El proveedor limitó las peticiones.');
  if (err instanceof Anthropic.APIConnectionError) return new ProviderError('network', 'No se pudo contactar al proveedor.');
  if (err instanceof Anthropic.APIError) return new ProviderError('provider', `El proveedor respondió con estado ${err.status}.`);
  return new ProviderError('provider', 'Respuesta inesperada del proveedor.');
}

export function anthropicLlm({ apiKey, baseUrl, model }) {
  const client = new Anthropic({ apiKey, ...(baseUrl ? { baseURL: baseUrl } : {}), timeout: 45000, maxRetries: 1 });

  async function jsonCall({ system, messages, schema, effort, maxTokens }) {
    let response;
    try {
      response = await client.beta.messages.create({
        model,
        max_tokens: maxTokens,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort, format: { type: 'json_schema', schema } },
        system,
        messages,
      });
    } catch (err) {
      throw mapAnthropicError(err);
    }
    if (response.stop_reason === 'refusal') throw new ProviderError('refused', 'El modelo no respondió a esta petición.');
    if (response.stop_reason === 'max_tokens') throw new ProviderError('provider', 'La respuesta quedó incompleta.');
    const text = response.content.find((block) => block.type === 'text')?.text;
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new ProviderError('provider', 'La respuesta no tenía el formato esperado.');
    }
    return { data, tokens: (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0) };
  }

  return {
    name: `anthropic:${model}`,
    async customerTurn({ scenario, menu, turns, ledger, instruction }) {
      const lines = turns.map((t) => `${t.role === 'guest' ? 'GUEST (you)' : 'SERVER'}: ${t.text}`).join('\n') || '(The server has just approached. Say your first line.)';
      const content = `Conversation so far:\n${lines}\n\nFacts confirmed so far: ${ledger || 'none yet'}${instruction ? `\n\nDirection for this line: ${instruction}` : ''}`;
      const { data, tokens } = await jsonCall({
        system: customerSystemPrompt(scenario, menu),
        messages: [{ role: 'user', content }],
        schema: CUSTOMER_SCHEMA,
        effort: 'low',
        maxTokens: 4000,
      });
      return { say: String(data.say), done: Boolean(data.done), ledger: String(data.confirmed_facts ?? ''), tokens };
    },
    async evaluate({ scenario, menu, turns, heardVia }) {
      const lines = turns.map((t) => `${t.role === 'guest' ? 'GUEST' : 'SERVER'}: ${t.text}`).join('\n');
      const { data, tokens } = await jsonCall({
        system: evaluatorSystemPrompt(scenario, menu, heardVia),
        messages: [{ role: 'user', content: `Transcript to evaluate:\n${lines}` }],
        schema: EVALUATOR_SCHEMA,
        effort: 'medium',
        maxTokens: 8000,
      });
      return { summary: data, tokens };
    },
  };
}
