import { pilotWav } from './pilot-wav.js';
// Audio por turnos. Cada reproduccion y grabacion tiene un propietario cancelable.
import { ApiError } from './core.js';

let playbackEpoch = 0;
let currentAudio = null;
let currentUrl = null;
let finishPlayback = null;
let speechRequest = null;

export function stopPlayback() {
  playbackEpoch += 1;
  speechRequest?.abort();
  speechRequest = null;
  finishPlayback?.(false);
  finishPlayback = null;
  if (currentAudio) { currentAudio.pause(); currentAudio.src = ''; currentAudio = null; }
  if (currentUrl) { URL.revokeObjectURL(currentUrl); currentUrl = null; }
  window.speechSynthesis?.cancel();
}

function englishVoice() {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  return voices.find((v) => v.lang === 'en-US' && /natural|samantha|google/i.test(v.name))
    ?? voices.find((v) => v.lang === 'en-US')
    ?? voices.find((v) => v.lang?.startsWith('en'));
}

export const deviceVoiceAvailable = () => Boolean(window.speechSynthesis && typeof window.SpeechSynthesisUtterance === 'function');

function speakDeviceAt(text, { slow }, epoch) {
  return new Promise((resolve) => {
    if (epoch !== playbackEpoch || !deviceVoiceAvailable()) { resolve(false); return; }
    const u = new window.SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = slow ? 0.7 : 0.95;
    const voice = englishVoice();
    if (voice) u.voice = voice;
    let settled = false;
    let timer;
    const finish = (ok) => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      u.onend = null; u.onerror = null;
      if (finishPlayback === finish) finishPlayback = null;
      resolve(ok);
    };
    finishPlayback = finish;
    u.onend = () => finish(true);
    u.onerror = () => finish(false);
    // No confundir un timeout de movil con haber escuchado la frase.
    timer = setTimeout(() => {
      finish(false);
      if (epoch === playbackEpoch) window.speechSynthesis?.cancel();
    }, Math.max(10000, text.length * (slow ? 260 : 180)));
    try { window.speechSynthesis.speak(u); } catch { finish(false); }
  });
}

/** true solo si el navegador confirma onend; cancelar o fallar devuelve false. */
export function speakDevice(text, { slow = false } = {}) {
  stopPlayback();
  return speakDeviceAt(text, { slow }, playbackEpoch);
}

function playBlobAt(blob, { slow }, epoch) {
  return new Promise((resolve, reject) => {
    if (epoch !== playbackEpoch) { resolve(false); return; }
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentUrl = url; currentAudio = audio;
    audio.playbackRate = slow ? 0.75 : 1;
    let settled = false;
    const finish = (ok, error) => {
      if (settled) return;
      settled = true;
      audio.onended = null; audio.onerror = null;
      audio.pause(); audio.src = '';
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      if (currentUrl === url) currentUrl = null;
      if (finishPlayback === finish) finishPlayback = null;
      if (error) reject(error); else resolve(ok);
    };
    finishPlayback = finish;
    audio.onended = () => finish(true);
    audio.onerror = () => finish(false, new Error('No se pudo reproducir el audio.'));
    try { Promise.resolve(audio.play()).catch((e) => finish(false, e)); }
    catch (e) { finish(false, e); }
  });
}

/** Detener o iniciar otra frase tambien cancela la descarga de voz anterior. */
export async function speakCustomer(text, { slow = false, useServer = false, onFallback } = {}) {
  stopPlayback();
  const epoch = playbackEpoch;
  if (!useServer) return speakDeviceAt(text, { slow }, epoch);
  const controller = new AbortController();
  speechRequest = controller;
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch('/api/voice/speak', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }), signal: controller.signal,
    });
    if (epoch !== playbackEpoch) return false;
    if (!res.ok) throw new Error('speech_unavailable');
    const blob = await res.blob();
    if (epoch !== playbackEpoch) return false;
    clearTimeout(timer);
    return await playBlobAt(blob, { slow }, epoch);
  } catch {
    if (epoch !== playbackEpoch) return false;
    onFallback?.();
    return speakDeviceAt(text, { slow }, epoch);
  } finally {
    clearTimeout(timer);
    if (speechRequest === controller) speechRequest = null;
  }
}

export function playLocal(blob) {
  stopPlayback();
  return playBlobAt(blob, { slow: false }, playbackEpoch);
}

const PREFERRED = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
export function micSupport() {
  if (!window.isSecureContext) return { ok: false, code: 'insecure', message: 'El micrófono necesita https. Puedes responder por texto.' };
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return { ok: false, code: 'unsupported', message: 'Este navegador no permite grabar. Puedes responder por texto.' };
  return { ok: true };
}
const MIC_ERRORS = {
  NotAllowedError: { code: 'denied', message: 'Activa el permiso del micrófono en los ajustes del navegador, o responde por texto.' },
  NotFoundError: { code: 'no_mic', message: 'No encontramos un micrófono. Puedes responder por texto.' },
  NotReadableError: { code: 'busy', message: 'Otra app está usando el micrófono. Ciérrala e inténtalo de nuevo.' },
};

export class TurnRecorder {
  constructor({ maxMs = 60000, onAutoStop } = {}) {
    this.maxMs = Math.min(60000, Math.max(400, maxMs));
    this.onAutoStop = onAutoStop;
    this.stream = null; this.recorder = null; this.ctx = null;
    this.active = false; this.epoch = 0; this.starting = false;
  }

  async start() {
    if (this.active || this.starting) throw new ApiError(0, 'busy', 'Ya hay una grabación en curso.');
    const support = micSupport();
    if (!support.ok) throw new ApiError(0, support.code, support.message);
    const epoch = ++this.epoch;
    this.starting = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      // El usuario pudo salir mientras el sistema mostraba el permiso.
      if (epoch !== this.epoch) {
        stream.getTracks().forEach((t) => t.stop());
        throw new ApiError(0, 'cancelled', 'La grabación se canceló.');
      }
      this.stream = stream;
      const MR = window.MediaRecorder;
      const mimeType = PREFERRED.find((t) => MR.isTypeSupported?.(t));
      this.recorder = new MR(stream, mimeType ? { mimeType } : undefined);
      this.chunks = []; this.peak = 0; this.levelKnown = false; this.stopPromise = null; this.recordingError = null;
      this.recorder.ondataavailable = (e) => { if (e.data.size) this.chunks.push(e.data); };
      this.recorder.onerror = () => {
        this.recordingError = new ApiError(0, 'recording_error', 'Se interrumpió la grabación. Inténtalo de nuevo o escribe tu respuesta.');
        this.abort();
      };
      this.startedAt = performance.now();
      this.recorder.start(); this.active = true;
      this.watchLevel();
      this.timer = setTimeout(() => {
        if (!this.active) return;
        if (this.onAutoStop) this.onAutoStop();
        else this.stop().catch(() => {});
      }, this.maxMs);
    } catch (err) {
      this.release();
      if (err instanceof ApiError) throw err;
      const info = MIC_ERRORS[err.name] ?? { code: 'mic_error', message: 'No pudimos grabar. Inténtalo de nuevo o responde por texto.' };
      throw new ApiError(0, info.code, info.message);
    } finally { this.starting = false; }
  }

  watchLevel() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Un contexto suspendido no permite concluir que el alumno guardo silencio.
      if (this.ctx.state !== 'running') { this.levelKnown = false; return; }
      const source = this.ctx.createMediaStreamSource(this.stream);
      const analyser = this.ctx.createAnalyser(); analyser.fftSize = 512; source.connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      const tick = () => {
        if (!this.active) return;
        analyser.getByteTimeDomainData(data);
        for (const v of data) this.peak = Math.max(this.peak, Math.abs(v - 128));
        this.raf = requestAnimationFrame(tick);
      };
      this.levelKnown = true; tick();
    } catch { this.levelKnown = false; }
  }

  stop() {
    if (this.starting) { this.abort(); return Promise.resolve(null); }
    if (this.stopPromise) return this.stopPromise;
    if (this.recordingError) return Promise.reject(this.recordingError);
    if (!this.recorder || this.recorder.state === 'inactive') { this.release(); return Promise.resolve(null); }
    clearTimeout(this.timer);
    const recorder = this.recorder;
    const ms = performance.now() - this.startedAt;
    this.stopPromise = new Promise((resolve, reject) => {
      this.finishStop = (value, error) => { this.finishStop = null; if (error) reject(error); else resolve(value); };
      recorder.onstop = () => {
        const type = recorder.mimeType || this.chunks[0]?.type || 'audio/webm';
        const blob = new Blob(this.chunks, { type });
        const silent = !blob.size || ms < 400 || (this.levelKnown && this.peak < 6);
        this.release();
        this.finishStop?.({ blob, ms: Math.round(ms), silent, mimeType: type.split(';')[0] });
      };
      try { recorder.stop(); } catch (err) { this.release(); this.finishStop?.(null, err); }
    });
    return this.stopPromise;
  }

  release() {
    this.active = false;
    clearTimeout(this.timer); cancelAnimationFrame(this.raf);
    this.stream?.getTracks().forEach((t) => t.stop()); this.stream = null;
    if (this.ctx && this.ctx.state !== 'closed') this.ctx.close().catch(() => {});
    this.ctx = null;
  }

  abort() {
    this.epoch += 1;
    if (this.recorder) {
      this.recorder.onstop = null; this.recorder.onerror = null;
      if (this.recorder.state !== 'inactive') { try { this.recorder.stop(); } catch { /* detenido */ } }
    }
    this.release();
    this.finishStop?.(null, this.recordingError);
  }
}

/** Solo transcribe: nunca manda el texto a la mesa sin confirmacion del alumno. */
export async function transcribe({ blob, ms, mimeType }, onSent, { signal, asWav = false } = {}) {
  if (asWav) ({blob,ms,mimeType}=await pilotWav(blob));
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  if (signal?.aborted) cancel();
  const timer = setTimeout(cancel, 55000);
  try {
    const res = await fetch('/api/voice/transcribe', {
      method: 'POST', headers: { 'Content-Type': mimeType, 'X-Audio-Ms': String(ms) }, body: blob, signal: controller.signal,
    });
    onSent?.();
    let data;
    try { data = await res.json(); } catch { throw new ApiError(res.status, 'bad_response', 'La transcripción no respondió correctamente. Reintenta el envío o escribe tu respuesta.'); }
    if (!res.ok) throw new ApiError(res.status, data.error, data.message);
    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (signal?.aborted) throw new ApiError(0, 'cancelled', 'Se canceló el envío de audio.');
    throw new ApiError(0, controller.signal.aborted ? 'timeout' : 'network', 'No pudimos transcribir el audio. Reintenta el envío o responde por texto.');
  } finally {
    clearTimeout(timer); signal?.removeEventListener('abort', cancel);
  }
}
