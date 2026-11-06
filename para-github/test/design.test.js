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

test('combinaciones de texto cumplen 4.5:1', () => {
  const pairs = [
    ['text', 'bg'], ['text-2', 'bg'], ['green-text', 'bg'], ['blue-text', 'bg'], ['ink', 'bg'],
    ['ink', 'green'], ['amber-text', 'amber-soft'], ['blue-text', 'blue-soft'], ['ink', 'blue-soft'], ['ink', 'green-soft'],
  ];
  for (const [fg, bg] of pairs) {
    const ratio = contrast(token(fg), token(bg));
    assert.ok(ratio >= 4.5, `${fg} sobre ${bg}: ${ratio.toFixed(2)}`);
  }
  assert.ok(contrast('#ffffff', token('ink')) >= 7, 'accion principal: blanco sobre tinta');
});

test('el blanco sobre verde brillante queda descartado para botones', () => {
  assert.ok(contrast('#ffffff', token('green')) < 4.5, 'por eso el boton verde usa tinta oscura');
});
