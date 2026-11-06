import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { loadConfig, loadDotEnv } from './config.js';
import { openStorage } from './storage/index.js';
import { tx } from './db.js';
import { createApp } from './app.js';
import { createInvitation } from './auth.js';
import { createVoiceServices, voiceStatus } from './voice/index.js';

loadDotEnv();
const config = loadConfig();
const db = await openStorage(config);
const services = createVoiceServices(config);
const server = createApp({ db, config, services });

const invite = await tx(db, async () => {
  if (db.lock) await db.lock(-1);
  const hasAdmin = await db.prepare(`SELECT 1 FROM users WHERE role='admin' AND active=1`).get();
  if (!hasAdmin) {
    let bootstrapCode;
    if (config.storage === 'postgres') {
      const pending = await db.prepare("SELECT 1 FROM invitations WHERE role='admin' AND revoked=0 AND used_by IS NULL AND expires_at>?").get(Date.now());
      if (pending) return;
      bootstrapCode = process.env.ADMIN_INVITE_CODE;
      if (!/^[A-Za-z0-9_-]{32,128}$/.test(bootstrapCode ?? '')) throw Error('Configura ADMIN_INVITE_CODE como secreto privado aleatorio antes del primer arranque.');
      // Exige una invitación nueva cuando la anterior caduca.
      const { createHash } = await import('node:crypto');
      const hash = createHash('sha256').update(bootstrapCode).digest('hex');
      const existing = await db.prepare("SELECT id FROM invitations WHERE role='admin' AND code_hash=?").get(hash);
      if (existing) throw Error('La invitación de administrador caducó o ya se usó. Genera un secreto nuevo.');
    }
    await db.prepare(`UPDATE invitations SET revoked=1 WHERE role='admin' AND used_by IS NULL`).run();
    const { code } = await createInvitation(db, { role: 'admin', label: 'primer administrador', bootstrapCode }, Date.now());
    return config.storage === 'sqlite' ? code : null;
  }
});
server.listen(config.port, config.host, () => {
  console.log(`ENGLISH47 en http://localhost:${config.port}`);
  console.log(voiceStatus(services, config).missing.join(' · '));
  if (invite) {
    const origin = process.env.PUBLIC_ORIGIN || process.env.RENDER_EXTERNAL_URL || `http://localhost:${config.port}`;
    const url = `${origin}/#/invite/${invite}`;
    if (config.storage === 'sqlite') writeFileSync(join(dirname(config.dbPath), 'primer-administrador.txt'), url + '\n', {mode:0o600});
    console.log(`Invitación inicial privada de administrador: ${url}`);
  }
});
