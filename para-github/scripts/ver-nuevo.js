// Compila el cliente nuevo (web/) y lo sirve junto al servidor con una base LOCAL de demostración (nunca produccion).
//   npm run ver-nuevo      -> abre http://localhost:4748 e inicia sesion con la cuenta que se imprime
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const run = (cmd, args, cwd) => spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: true });

console.log('[ver-nuevo] compilando el cliente 2.0…');
if (run('npx', ['vite', 'build'], 'web').status !== 0) { console.error('La compilacion fallo.'); process.exit(1); }

const DB = 'data/ver-nuevo.db';
const CUENTA = 'data/ver-nuevo-cuenta.json';
console.log('[ver-nuevo] preparando una cuenta de demostracion en una base local limpia…');
if (run('node', ['--disable-warning=ExperimentalWarning', 'scripts/dev-seed.js', DB, CUENTA, 'demo']).status !== 0) process.exit(1);
const { username, password } = JSON.parse(readFileSync(CUENTA, 'utf8'));

process.env.DB_PATH = DB;
process.env.CLIENT_DIR = 'web/dist';
console.log(`\n================  CLIENTE 2.0  ================\n  Abre:       http://localhost:4748\n  Usuario:    ${username}\n  Contraseña: ${password}\n  (base local de demostración, sin conexión a producción; Ctrl+C para salir)\n===============================================\n`);
await import('./dev-local.js');
