// Publica la app: prueba, compila, copia a una copia limpia de GitHub y hace push. Render redespliega solo.
//   npm run publicar                (usa el ultimo mensaje de commit local)
//   npm run publicar -- "mensaje"   (mensaje propio)
//   npm run publicar -- --simular   (hace todo menos el push)
// Requiere `gh auth login` hecho una vez en este computador. Nunca copia .env, data/ ni node_modules.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const REPO = 'juanpablo08bello-cmyk/english47-piloto';
const simular = process.argv.includes('--simular');
const mensajeArg = process.argv.slice(2).find((a) => !a.startsWith('--'));
const run = (cmd, args, cwd, opts = {}) => spawnSync(cmd, args, { cwd, stdio: opts.capture ? 'pipe' : 'inherit', shell: ['npm', 'npx'].includes(cmd), encoding: 'utf8' });
const paso = (txt) => console.log(`\n[publicar] ${txt}`);
const falla = (txt) => { console.error(`\n[publicar] ALTO: ${txt}`); process.exit(1); };

paso('1/5 pruebas del servidor');
if (run('npm', ['test'], '.', { capture: true }).status !== 0) falla('npm test fallo; no se publica.');
paso('2/5 compilando el cliente');
if (run('npx', ['vite', 'build'], 'web', { capture: true }).status !== 0) falla('la compilacion fallo.');

const mensaje = mensajeArg ?? run('git', ['log', '-1', '--format=%B'], '.', { capture: true }).stdout.trim();
const tmp = mkdtempSync(join(tmpdir(), 'e47-publicar-'));
try {
  paso('3/5 bajando una copia limpia de GitHub');
  if (run('gh', ['repo', 'clone', REPO, tmp, '--', '--depth', '1'], '.').status !== 0) falla('no pude clonar (¿gh auth login?).');
  const dest = join(tmp, 'para-github');

  paso('4/5 copiando servidor, contenido y cliente compilado');
  for (const d of ['server', 'content', 'scripts', 'test']) { rmSync(join(dest, d), { recursive: true, force: true }); cpSync(d, join(dest, d), { recursive: true }); }
  rmSync(join(dest, 'web', 'dist'), { recursive: true, force: true });
  cpSync('web/dist', join(dest, 'web', 'dist'), { recursive: true });
  for (const f of ['package.json', 'package-lock.json', 'README.md', 'PILOTO.md', 'POSTGRES.md', 'VOZ.md', 'REVISION.md', 'CHANGELOG.md', 'PARA_EL_PRIMO.md']) if (existsSync(f)) cpSync(f, join(dest, f));

  run('git', ['add', '-A'], tmp);
  if (!run('git', ['status', '--porcelain'], tmp, { capture: true }).stdout.trim()) { console.log('[publicar] Nada nuevo: GitHub ya tiene esta version.'); process.exit(0); }
  const commit = run('git', ['-c', 'user.name=english47-local', '-c', 'user.email=local@english47.invalid', 'commit', '-q', '-m', mensaje], tmp);
  if (commit.status !== 0) falla('el commit fallo.');
  if (simular) { console.log('[publicar] --simular: todo listo, sin push.'); process.exit(0); }
  paso('5/5 subiendo a GitHub (Render redespliega solo, tarda 2-5 min)');
  if (run('git', ['push', 'origin', 'HEAD:main'], tmp).status !== 0) falla('el push fallo.');
  console.log(`\n[publicar] Listo: https://github.com/${REPO}  ->  https://english47-piloto.onrender.com`);
} finally { rmSync(tmp, { recursive: true, force: true }); }
