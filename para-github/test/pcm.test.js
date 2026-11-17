// Captura del micrófono → WAV 16 kHz mono (web/src/lib/pcm.ts). Es lo que se manda al servidor tal cual (sin decodificar en Safari).
import test from 'node:test';
import assert from 'node:assert/strict';
import { downsample, encodeWav, isServerWav, normalize, stats, WAV_RATE, WAV_MAX_S } from '../web/src/lib/pcm.ts';

const tone = (rate, seconds, hz = 440, amp = 0.5) => Float32Array.from({ length: Math.round(rate * seconds) }, (_, i) => amp * Math.sin((2 * Math.PI * hz * i) / rate));
const chunked = (arr, size) => { const out = []; for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size)); return out; };

test('baja 48 kHz y 44,1 kHz a 16 kHz con la duración correcta, venga en los bloques que venga', () => {
  for (const rate of [48000, 44100, 16000, 32000]) {
    const out = downsample(chunked(tone(rate, 2), 4096), rate);
    assert.ok(Math.abs(out.length - 2 * WAV_RATE) <= 2, `${rate} Hz → ${out.length} muestras`);
  }
});

test('conserva la amplitud de una voz a 440 Hz y el silencio sigue siendo silencio', () => {
  const out = downsample(chunked(tone(48000, 1), 4096), 48000);
  const peak = out.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  assert.ok(peak > 0.45 && peak <= 0.5, `pico ${peak}`);
  assert.equal(downsample([new Float32Array(48000)], 48000).every((v) => v === 0), true);
  assert.equal(downsample([], 48000).length, 0);
});

test('nunca pasa de 30 s (límite del servidor)', () => {
  const out = downsample(chunked(tone(48000, 35), 4096), 48000);
  assert.equal(out.length, WAV_RATE * WAV_MAX_S);
});

test('el WAV tiene cabecera PCM 16 bit mono 16 kHz y lo reconoce isServerWav', async () => {
  const wav = encodeWav(downsample(chunked(tone(48000, 1), 4096), 48000));
  assert.equal(wav.type, 'audio/wav');
  const v = new DataView(await wav.arrayBuffer());
  assert.equal(v.getUint32(24, true), 16000);
  assert.equal(v.getUint16(22, true), 1);
  assert.equal(v.getUint16(34, true), 16);
  assert.equal(v.getUint32(40, true), wav.size - 44);
  assert.equal(await isServerWav(wav), true);
  assert.equal(await isServerWav(new Blob([new Uint8Array(500)], { type: 'audio/webm' })), false);
  assert.equal(await isServerWav(new Blob([], { type: 'audio/wav' })), false);
});

test('recorta lo que se sale de [-1, 1] sin dar la vuelta', async () => {
  const wav = encodeWav(Float32Array.from([2, -2, 0.5]));
  const v = new DataView(await wav.arrayBuffer());
  assert.equal(v.getInt16(44, true), 32767);
  assert.equal(v.getInt16(46, true), -32767);
});

test('una voz muy baja (iPhone sin control de ganancia) se sube a un nivel que el reconocedor entiende', () => {
  const quiet = tone(16000, 1, 300, 0.01);
  const { out, gain } = normalize(quiet);
  assert.ok(gain > 5, `ganancia ${gain}`);
  const { rms, peak } = stats(out);
  assert.ok(rms > 0.08 && rms < 0.2, `rms ${rms}`);
  assert.ok(peak <= 1);
});

test('no toca el silencio total ni una voz que ya viene fuerte', () => {
  assert.equal(normalize(new Float32Array(16000)).gain, 1);
  assert.equal(normalize(tone(16000, 1, 300, 0.6)).gain, 1);
});

test('un pico enorme no pasa de 1 tras subir el volumen', () => {
  const x = tone(16000, 1, 300, 0.02); x[100] = 0.9;
  const { out } = normalize(x);
  assert.ok(out.every((v) => Math.abs(v) <= 1));
});
