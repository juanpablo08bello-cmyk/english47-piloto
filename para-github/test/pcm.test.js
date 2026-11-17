// Captura del micrófono → WAV 16 kHz mono (web/src/lib/pcm.ts). Es lo que se manda al servidor tal cual (sin decodificar en Safari).
import test from 'node:test';
import assert from 'node:assert/strict';
import { downsample, encodeWav, isServerWav, WAV_RATE, WAV_MAX_S } from '../web/src/lib/pcm.ts';

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
