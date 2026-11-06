// Azure Speech por REST: voz del cliente, transcripción y evaluación de pronunciación.
// La clave solo vive en el servidor. El audio se envía y se descarta; aquí no se guarda nada.
import { ProviderError } from './providers.js';

const DEFAULT_VOICE = 'en-US-AvaNeural';
const DEFAULT_RATE = '-8%';
const VOICE_ID = /^[a-z]{2}-[A-Z]{2}-[A-Za-z]+Neural$/;
const REGION = /^[a-z0-9]{3,30}$/;
const TTS_TIMEOUT_MS = 15000;
const STT_TIMEOUT_MS = 20000;

const xml = (text) => String(text).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));

function failure(status) {
  if (status === 429) return new ProviderError('rate_limited', 'Azure alcanzó su límite por ahora.');
  if (status === 401 || status === 403) return new ProviderError('auth', 'Azure rechazó la clave.');
  return new ProviderError('provider', 'Azure no pudo completar esta operación.');
}

export function azureSpeech({ apiKey, region }, transport = fetch, { retryMs = 800 } = {}) {
  if (!apiKey || !REGION.test(region ?? '')) return null;
  const headers = { 'Ocp-Apim-Subscription-Key': apiKey, 'User-Agent': 'english47' };

  async function call(url, init, timeoutMs, signal) {
    for (let attempt = 0; ; attempt++) {
      const timeout = AbortSignal.timeout(timeoutMs);
      let res;
      try {
        res = await transport(url, { ...init, signal: signal ? AbortSignal.any([signal, timeout]) : timeout, redirect: 'error' });
      } catch {
        throw new ProviderError(signal?.aborted ? 'cancelled' : 'network', 'No recibimos respuesta de Azure.');
      }
      if (res.ok) return res;
      if (res.status >= 500 && attempt === 0 && !signal?.aborted) {
        await new Promise((ok) => setTimeout(ok, retryMs));
        continue;
      }
      throw failure(res.status);
    }
  }

  const recognizeUrl = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`;
  const audioHeaders = { ...headers, 'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000', Accept: 'application/json' };

  async function recognize(audio, extraHeaders = {}) {
    const res = await call(recognizeUrl, { method: 'POST', headers: { ...audioHeaders, ...extraHeaders }, body: audio }, STT_TIMEOUT_MS);
    let data;
    try { data = await res.json(); } catch { throw new ProviderError('provider', 'Azure no devolvió una respuesta utilizable.'); }
    if (data.RecognitionStatus === 'Success') return data.NBest?.[0] ?? null;
    if (data.RecognitionStatus === 'NoMatch' || data.RecognitionStatus === 'InitialSilenceTimeout' || data.RecognitionStatus === 'BabbleTimeout') return null;
    throw new ProviderError('provider', 'Azure no pudo reconocer el audio.');
  }

  return {
    stt: {
      name: 'azure:speech-to-text',
      async transcribe({ audio }) {
        const best = await recognize(audio);
        return { text: best?.Display ?? '' };
      },
    },
    tts: {
      name: 'azure:neural-voices',
      async speak({ text, signal, azure, rate }) {
        const voice = VOICE_ID.test(azure ?? '') ? azure : DEFAULT_VOICE;
        const lang = voice.slice(0, 5);
        const pace = /^-\d{1,2}%$/.test(rate ?? '') ? rate : DEFAULT_RATE;
        const ssml = `<speak version="1.0" xml:lang="${lang}"><voice name="${voice}"><prosody rate="${pace}">${xml(text)}</prosody></voice></speak>`;
        const res = await call(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm' },
          body: ssml,
        }, TTS_TIMEOUT_MS, signal);
        const audio = Buffer.from(await res.arrayBuffer());
        if (audio.length < 100) throw new ProviderError('provider', 'Azure devolvió un audio vacío.');
        return { audio, mimeType: 'audio/wav' };
      },
    },
    pronunciation: {
      name: 'azure:pronunciation-assessment',
      async assess({ audio, reference }) {
        const config = { ReferenceText: reference, GradingSystem: 'HundredMark', Granularity: 'Word', Dimension: 'Comprehensive', EnableMiscue: true };
        const best = await recognize(audio, { 'Pronunciation-Assessment': Buffer.from(JSON.stringify(config)).toString('base64') });
        if (!best) return { status: 'silence', text: '' };
        // La respuesta trae las puntuaciones en la raíz o dentro de PronunciationAssessment, según el formato.
        const score = best.PronunciationAssessment ?? best;
        const words = (best.Words ?? []).map((w) => {
          const s = w.PronunciationAssessment ?? w;
          return { word: w.Word, accuracy: Number(s.AccuracyScore ?? 0), error: s.ErrorType ?? 'None' };
        });
        return {
          status: 'ok',
          text: best.Display ?? '',
          score: Number(score.PronScore ?? 0),
          accuracy: Number(score.AccuracyScore ?? 0),
          fluency: Number(score.FluencyScore ?? 0),
          completeness: Number(score.CompletenessScore ?? 0),
          words,
        };
      },
    },
  };
}
