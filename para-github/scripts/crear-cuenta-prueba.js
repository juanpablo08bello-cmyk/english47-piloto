// Crea una cuenta de alumno de prueba con contrasena aleatoria, usando las mismas
// invitaciones de la app. La contrasena solo se muestra en esta consola.
import { randomBytes } from 'node:crypto';
import { loadConfig, loadDotEnv } from '../server/config.js';
import { openStorage } from '../server/storage/index.js';
import { createInvitation, redeemInvitation } from '../server/auth.js';

loadDotEnv();
const username = process.argv[2] ?? 'revision.prueba';
const db = await openStorage(loadConfig());
const now = Date.now();
const invitation = await createInvitation(db, { role: 'student', label: 'Cuenta de prueba' }, now);
if (!invitation.ok) {
  console.error(invitation.message);
  process.exit(1);
}
const password = randomBytes(15).toString('base64url');
const result = await redeemInvitation(db, { code: invitation.code, username, displayName: 'Prueba', password }, now);
await db.close();
if (!result.ok) {
  console.error(result.message);
  process.exit(1);
}
console.log(`usuario: ${username}`);
console.log(`contrasena: ${password}`);
