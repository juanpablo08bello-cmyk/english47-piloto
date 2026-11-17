import test from 'node:test';
import assert from 'node:assert/strict';
import { startApp, login } from './helpers.js';
import { createVoiceServices } from '../server/voice/index.js';
import { loadConfig } from '../server/config.js';
import { descargar, htmlATexto, ipPrivada, leerEntrada, urlSegura } from '../server/menu-import.js';

test('Importar menú: SSRF bloquea direcciones privadas y esquemas raros', async () => {
  for (const ip of ['127.0.0.1', '10.1.2.3', '192.168.0.9', '172.20.0.1', '169.254.169.254', '::1', 'fd00::1', '::ffff:10.0.0.1']) assert.equal(ipPrivada(ip), true, ip);
  for (const ip of ['8.8.8.8', '1.1.1.1', '2606:4700::1111']) assert.equal(ipPrivada(ip), false, ip);
  assert.ok((await urlSegura('file:///etc/passwd')).error);
  assert.ok((await urlSegura('http://localhost:4747/api')).error);
  assert.ok((await urlSegura('http://user:pw@example.com/')).error);
  assert.ok((await urlSegura('http://169.254.169.254/latest/meta-data')).error);
  assert.ok((await urlSegura('https://menu.example.com/', async () => [{ address: '10.0.0.5' }])).error, 'un nombre que resuelve a IP privada se rechaza');
  assert.ok((await urlSegura('https://menu.example.com/', async () => [{ address: '93.184.216.34' }])).url);
  const redirige = await descargar('https://menu.example.com/', {
    resolver: async (h) => [{ address: h === 'menu.example.com' ? '93.184.216.34' : '10.0.0.1' }],
    fetcher: async () => new Response(null, { status: 302, headers: { location: 'http://interno.local/x' } }),
  });
  assert.ok(redirige.error, 'una redirección a una dirección privada se rechaza');
});

test('Importar menú: HTML a texto y validación de la entrada', () => {
  assert.equal(htmlATexto('<style>x{}</style><p>Fish &amp; chips</p><script>alert(1)</script>'), 'Fish & chips');
  assert.ok(leerEntrada({}).error);
  assert.ok(leerEntrada({ archivo: 'AAAA', mime: 'text/html' }).error);
  assert.ok(leerEntrada({ archivo: '!!!', mime: 'image/png' }).error);
  assert.equal(leerEntrada({ archivo: 'data:image/png;base64,AAAA', mime: 'image/png' }).archivo.base64, 'AAAA');
  assert.equal(leerEntrada({ link: 'https://a.com' }).link, 'https://a.com');
});

test('Importar menú: sin IA configurada se oculta; con extractor simulado devuelve borrador, valida y limita por día', async () => {
  const sin = await startApp({ env: {} });
  try {
    const ana = await login(sin, 'ana');
    const menu = await ana('GET', '/api/mesas/menu');
    assert.equal(menu.data.importar, true);
    assert.equal(menu.data.ia, false, 'sin clave de IA no se leen fotos ni links');
    assert.equal((await ana('POST', '/api/mesas/menu/importar', { link: 'https://a.com' })).status, 503);
    const demo = await ana('POST', '/api/mesas/menu/importar', { demo: 'divino' });
    assert.equal(demo.status, 200);
    assert.equal(demo.data.demo, true);
    assert.ok(demo.data.total >= 50 && demo.data.total <= 60);
    const guardado = await ana('POST', '/api/mesas/menu', { platos: demo.data.platos, modo: 'reemplazar' });
    assert.equal(guardado.status, 200, JSON.stringify(guardado.data).slice(0, 300));
    assert.ok(guardado.data.requisitos.listo, 'la carta de ejemplo alcanza para jugar');
  } finally { await sin.stop(); }

  const config = loadConfig({});
  const services = { ...createVoiceServices(config), menuExtractor: async () => [
    { plato: 'Grilled Snapper', categoria: 'principal', descripcion: 'Lemon and capers', precio: 38, alergenos: [] },
    { plato: '', categoria: 'principal', descripcion: '', precio: 1, alergenos: [] },
    { plato: 'Key Lime Pie', categoria: 'postre', descripcion: '', precio: 12, alergenos: [] },
  ], menuResolver: async () => [{ address: '93.184.216.34' }], menuFetch: async () => new Response('<p>Menu</p>', { status: 200, headers: { 'content-type': 'text/html' } }) };
  const app = await startApp({ services });
  try {
    const ana = await login(app, 'ana');
    assert.equal((await ana('GET', '/api/mesas/menu')).data.ia, true);
    const foto = await ana('POST', '/api/mesas/menu/importar', { archivo: 'AAAA', mime: 'image/jpeg' });
    assert.equal(foto.status, 200);
    assert.equal(foto.data.total, 2);
    assert.equal(foto.data.descartados, 1);
    assert.equal(foto.data.borrador, true);
    assert.equal((await ana('GET', '/api/mesas/menu')).data.total, 0, 'nada se guarda hasta confirmar');
    assert.equal((await ana('POST', '/api/mesas/menu/importar', { link: 'https://menu.example.com' })).status, 200);
    assert.equal((await ana('POST', '/api/mesas/menu/importar', { link: 'http://127.0.0.1/' })).status, 400);
    assert.equal((await ana('POST', '/api/mesas/menu/importar', { archivo: 'AAAA', mime: 'image/jpeg' })).status, 200);
    assert.equal((await ana('POST', '/api/mesas/menu/importar', { archivo: 'AAAA', mime: 'image/jpeg' })).status, 429, 'máximo 3 por día');
  } finally { await app.stop(); }
});
