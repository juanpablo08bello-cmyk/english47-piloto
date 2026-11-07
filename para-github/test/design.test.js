// Contraste WCAG de las combinaciones usadas en la interfaz (texto normal: minimo 4.5:1).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync('public/styles.css', 'utf8');
const token = (name) => css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))[1];

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test('el texto sobre el lienzo y las superficies cumple 4.5:1', () => {
  const pairs = [['text', 'bg'], ['text-2', 'bg'], ['text', 'surface'], ['text-2', 'surface'], ['text', 'surface-2'], ['action', 'bg'], ['good', 'surface'], ['warn', 'surface']];
  for (const [fg, bg] of pairs) {
    const ratio = contrast(token(fg), token(bg));
    assert.ok(ratio >= 4.5, `${fg} sobre ${bg}: ${ratio.toFixed(2)}`);
  }
});

test('el texto negro sobre cada color de sección cumple 4.5:1', () => {
  for (const color of ['action', 'learn', 'table', 'improve', 'pink', 'sky', 'good', 'warn']) {
    const ratio = contrast(token('ink'), token(color));
    assert.ok(ratio >= 4.5, `negro sobre ${color}: ${ratio.toFixed(2)}`);
  }
});

test('las secciones de voz no ofrecen escritura y la de texto no usa audio', () => {
  for (const file of ['mesas.js', 'mejorar.js']) {
    const code = readFileSync(`public/js/${file}`, 'utf8');
    assert.doesNotMatch(code, /<input|<textarea/, `${file} permite escribir`);
  }
  const voz = readFileSync('public/js/voz.js', 'utf8');
  assert.doesNotMatch(voz, /<input|<textarea/);
  assert.match(voz, /Podrías decirlo así/, 'un intento sin ayuda con otras palabras no se marca como error');
  for (const file of ['sim.js', 'voice-lab.js']) assert.doesNotMatch(readFileSync(`public/js/${file}`, 'utf8'), /<textarea|<input(?![^>]*checkbox)/, `${file} permite escribir`);
  const aprender = readFileSync('public/js/aprender.js', 'utf8');
  assert.doesNotMatch(aprender, /audio\.js|voz\.js|speak|Recorder/);
});
