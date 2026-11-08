// Prueba la ruta real de los adaptadores contra un proveedor simulado local.
// Comprueba forma de las peticiones, memoria de la orden, limites y errores.
// No sustituye la prueba con credenciales reales ni en un celular.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WebSocketServer } from 'ws';
import { createServer } from 'node:http';
import { startApp, login } from './helpers.js';

function fakeProvider() {
  const calls = { stt: [], tts: [], llm: [] };
  const state = { fail: null, sttText: 'Good evening, can I start you off with some water?' };
  const server = createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks);
      if (state.fail) { res.writeHead(state.fail, { 'content-type': 'application/json' }); res.end('{"error":{"type":"x","message":"x"}}'); return; }
      if (req.url.endsWith('/audio/transcriptions')) {
        calls.stt.push({ auth: req.headers.authorization, type: req.headers['content-type'], body: raw.toString('latin1') });
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ text: state.sttText }));
        return;
      }
      if (req.url.startsWith('/v1/messages')) {
        const body = JSON.parse(raw);
        calls.llm.push({ key: req.headers.authorization, beta: req.headers['anthropic-beta'], url: req.url, body });
        const isEvaluator = body.system.includes('You evaluate');
        const reply = isEvaluator
          ? { did_well: 'Ofreciste agua con cortesía: «can I start you off».', improvements: [{ yours: 'x', corrected: 'y', alternative: 'z', why: 'w' }, { yours: 'a', corrected: 'b', alternative: 'c', why: 'd' }, { yours: 'extra', corrected: 'e', alternative: 'e', why: 'e' }], criteria: [{ id: 'greet', met: true }, { id: 'confirm', met: true }, { id: 'side_apart', met: false }] }
          : { say: 'Still water, please. I will have the ribeye.', done: calls.llm.length >= 3, confirmed_facts: 'still water; ribeye' };
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({
          id: 'msg_1', type: 'message', role: 'assistant', model: body.model, stop_reason: state.stopReason ?? 'end_turn', stop_sequence: null,
          content: [{ type: 'text', text: JSON.stringify(reply) }], usage: { input_tokens: 100, output_tokens: 20 },
        }));
        return;
      }
      res.writeHead(404); res.end();
    });
  });
  const wss = new WebSocketServer({ server });
  wss.on('connection', (ws, req) => {
    ws.send(JSON.stringify({type:'session.created'}));
    ws.on('message', raw => {
      const event=JSON.parse(raw);
      if(event.type==='session.update') ws.send(JSON.stringify({type:'session.updated'}));
      if(event.type==='response.create') {
        calls.tts.push({auth:req.headers.authorization,url:req.url,body:event.response});
        ws.send(JSON.stringify({type:'response.output_audio.delta',delta:Buffer.from('FAKEAUDIO!').toString('base64')}));
        ws.send(JSON.stringify({type:'response.output_audio_transcript.done',transcript:JSON.parse(event.response.input[0].content[0].text).text_to_read}));
        ws.send(JSON.stringify({type:'response.done',response:{status:'completed'}}));
      }
    });
  });
  return { calls, state, server };
}

async function setup(extraEnv = {}) {
  const fake = fakeProvider();
  await new Promise((ok) => fake.server.listen(0, '127.0.0.1', ok));
  const url = `http://127.0.0.1:${fake.server.address().port}`;
  const app = await startApp({
    env: { ANTHROPIC_API_KEY: 'test-llm-secret', ANTHROPIC_BASE_URL: url, OPENAI_API_KEY: 'test-audio-secret', OPENAI_BASE_URL: `${url}/v1`, ...extraEnv },
  });
  return { fake, app, stop: async () => { await app.stop(); fake.server.closeAllConnections(); await new Promise((ok) => fake.server.close(ok)); } };
}

const audioBody = () => Buffer.alloc(4000, 7);
async function sendAudio(app, api, cookieApi) {
  return cookieApi('POST', '/api/voice/transcribe', undefined, { 'content-type': 'audio/mp4', 'x-audio-ms': '3000' });
}

test('voz conectada: las tres capacidades reportan disponibles y pronunciacion no', async () => {
  const { app, stop } = await setup();
  const api = await login(app, 'ana');
  const s = (await api('GET', '/api/voice/status')).data;
  assert.equal(s.aiAvailable, true);
  assert.equal(s.capabilities.transcription.available, true);
  assert.equal(s.capabilities.speech.available, true);
  assert.equal(s.capabilities.pronunciation.available, false);
  assert.ok(!JSON.stringify(s).includes('secret'), 'no expone claves');
  await stop();
});

test('conversacion IA por turnos: cliente y evaluador separados, usa menu y recuerda la orden', async () => {
  const { app, fake, stop } = await setup();
  const api = await login(app, 'ana');
  const { sim } = (await api('POST', '/api/sim', { scenarioId: 'dinner_for_two', mode: 'ai', helpMode: 'work' })).data;
  assert.equal(sim.mode, 'ai');
  assert.equal(sim.demoOptions, null);
  const t1 = (await api('POST', `/api/sim/${sim.id}/turn`, { text: 'Welcome in! Still or sparkling water?', source: 'audio', requestId: 'a' })).data;
  await api('POST', `/api/sim/${sim.id}/turn`, { text: 'Welcome in! Still or sparkling water?', source: 'audio', requestId: 'a' });
  assert.equal(fake.calls.llm.length, 2, 'una peticion duplicada no vuelve a llamar al proveedor');
  assert.equal(t1.sim.waiterTurns, 1);
  await api('POST', `/api/sim/${sim.id}/turn`, { text: 'How would you like that cooked?', source: 'audio', requestId: 'b' });

  const last = fake.calls.llm.at(-1);
  assert.equal(last.key, 'Bearer test-llm-secret');
  assert.match(last.beta, /server-side-fallback/);
  assert.equal(last.body.model, 'claude-opus-5-5');
  assert.equal(last.body.output_config.format.type, 'json_schema');
  assert.equal(last.body.temperature, undefined);
  assert.ok(last.body.system.includes('12 oz Ribeye'), 'el cliente recibe el menu');
  assert.ok(!last.body.system.includes('You evaluate'), 'el cliente no lleva reglas de evaluador');
  const content = last.body.messages[0].content;
  assert.ok(content.includes('still water; ribeye'), 'recuerda lo confirmado');
  assert.ok(content.includes('Still or sparkling'), 'recuerda la conversacion');

  const end = (await api('POST', `/api/sim/${sim.id}/finish`)).data;
  const evalCall = fake.calls.llm.at(-1);
  assert.ok(evalCall.body.system.includes('You evaluate'));
  assert.ok(evalCall.body.system.includes('do not comment on accent or pronunciation'), 'con audio avisa que es una transcripcion');
  assert.equal(end.sim.summary.evaluator, 'ai');
  assert.equal(end.sim.summary.evaluationBasis, 'transcript');
  assert.equal(end.sim.summary.pronunciation, 'not_evaluated');
  assert.equal(end.sim.summary.improvements.length, 2, 'nunca mas de dos mejoras');
  assert.equal(end.rewards.xp, 25);
  await stop();
});

test('transcripcion: envia multipart, no guarda el audio y maneja silencio y ambiguedad', async () => {
  const { app, fake, stop } = await setup();
  const api = await login(app, 'ana');
  const raw = async (bytes, type = 'audio/mp4') => {
    const cookie = (await fetch(`${app.base}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'ana', password: 'password123' }) })).headers.get('set-cookie').split(';')[0];
    const res = await fetch(`${app.base}/api/voice/transcribe`, { method: 'POST', headers: { cookie, 'content-type': type, 'x-audio-ms': '3000' }, body: bytes });
    return { status: res.status, data: await res.json() };
  };
  const ok = await raw(audioBody());
  assert.equal(ok.data.status, 'ok');
  assert.match(fake.calls.stt[0].type, /multipart\/form-data/);
  assert.equal(fake.calls.stt[0].auth, 'Bearer test-audio-secret');
  assert.ok(fake.calls.stt[0].body.includes('name="model"'));
  assert.ok(fake.calls.stt[0].body.includes('gpt-transcribe'));
  assert.ok(fake.calls.stt[0].body.includes('turn.mp4'));

  assert.equal((await raw(Buffer.alloc(100))).data.status, 'silence');
  assert.equal(fake.calls.stt.length, 1, 'el silencio no gasta llamadas');
  fake.state.sttText = 'water';
  assert.equal((await raw(audioBody())).data.status, 'confirm');
  fake.state.sttText = '...';
  assert.equal((await raw(audioBody())).data.status, 'unclear');
  assert.equal((await raw(audioBody(), 'text/plain')).status, 415);

  const tables = app.db.prepare(`SELECT sql FROM sqlite_master WHERE type='table'`).all().map((t) => t.sql).join(' ');
  assert.ok(!/BLOB/i.test(tables), 'no existe almacenamiento de audio');
  void api; void sendAudio;
  await stop();
});

test('voz del cliente: devuelve audio del proveedor', async () => {
  const { app, fake, stop } = await setup();
  const api = await login(app, 'ana');
  const r = await api('POST', '/api/voice/speak', { text: 'Still water, please.' });
  assert.equal(r.status, 200);
  assert.equal(Buffer.from(r.data).subarray(44).toString(), 'FAKEAUDIO!');
  assert.match(fake.calls.tts[0].url, /model=gpt-realtime-2.1-mini/);
  assert.equal(fake.calls.tts[0].auth, 'Bearer test-audio-secret');
  assert.deepEqual(fake.calls.tts[0].body.output_modalities, ['audio']);
  await stop();
});

test('limites: al agotarse responde 429 y permite seguir en demo', async () => {
  const { app, stop } = await setup({ LIMIT_LLM_TOKENS_MONTH: '100' });
  const api = await login(app, 'ana');
  const first = await api('POST', '/api/sim', { scenarioId: 'drinks_first', mode: 'ai' });
  assert.equal(first.status, 200);
  const second = await api('POST', `/api/sim/${first.data.sim.id}/turn`, { text: 'Can I get you a drink?' });
  assert.equal(second.status, 429);
  assert.equal(second.data.error, 'limit_reached');
  const demo = await api('POST', '/api/sim', { scenarioId: 'drinks_first', mode: 'demo' });
  assert.equal(demo.status, 200, 'la demo sigue disponible');
  await stop();
});

test('fallos del proveedor: mensaje recuperable, y la conversacion no se pierde', async () => {
  const { app, fake, stop } = await setup();
  const api = await login(app, 'ana');
  const { sim } = (await api('POST', '/api/sim', { scenarioId: 'drinks_first', mode: 'ai' })).data;
  fake.state.fail = 401;
  const denied = await api('POST', `/api/sim/${sim.id}/turn`, { text: 'Can I get you a drink?' });
  assert.equal(denied.status, 502);
  assert.equal(denied.data.error, 'provider_auth');
  assert.ok(!JSON.stringify(denied.data).includes('secret'));
  fake.state.fail = null;
  const retry = await api('POST', `/api/sim/${sim.id}/turn`, { text: 'Can I get you a drink?' });
  assert.equal(retry.status, 200);
  // Si el evaluador falla, no se inventa una correccion.
  fake.state.fail = 500;
  const end = (await api('POST', `/api/sim/${sim.id}/finish`)).data;
  assert.equal(end.sim.summary.evaluator, 'unavailable');
  assert.equal(end.sim.summary.improvements.length, 0);
  await stop();
});

test('administracion: consumo sin tarifas inventadas', async () => {
  const { app, stop } = await setup();
  const api = await login(app, 'ana');
  await api('POST', '/api/voice/speak', { text: 'Hello' });
  const { createInvitation } = await import('../server/auth.js');
  const { code } = await createInvitation(app.db, { role: 'admin' }, app.clockBox.now);
  const admin = app.client();
  await admin('POST', '/api/auth/redeem', { code, username: 'jefe', displayName: 'Jefe', password: 'password123' });
  const u = (await admin('GET', '/api/admin/overview')).data.usage;
  assert.equal(u.rows.find((r) => r.key === 'tts').used, 5);
  assert.equal(u.estimatedTotal, null, 'sin tarifas configuradas no se estima costo');
  await stop();
});
