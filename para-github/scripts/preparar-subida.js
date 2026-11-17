// Prepara la carpeta `subir-a-github/` para arrastrarla a GitHub (Render se actualiza solo desde ahi).
// Incluye el servidor, el contenido y el cliente nuevo YA COMPILADO dentro de `public/`: asi Render no necesita
// compilar nada ni cambiar variables. No incluye .env, la base local, arte ni documentos de trabajo.
//   node scripts/preparar-subida.js
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';

const OUT = 'subir-a-github';
const run = (cmd, args, cwd) => spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: true });

console.log('[subida] compilando el cliente…');
if (run('npx', ['vite', 'build'], 'web').status !== 0) { console.error('La compilacion fallo.'); process.exit(1); }

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
for (const d of ['server', 'content', 'scripts', 'test']) cpSync(d, `${OUT}/${d}`, { recursive: true });
for (const f of ['package.json', 'package-lock.json', '.env.example', 'README.md', 'PILOTO.md', 'POSTGRES.md', 'VOZ.md', 'REVISION.md', 'CHANGELOG.md', 'PARA_EL_PRIMO.md']) if (existsSync(f)) cpSync(f, `${OUT}/${f}`);
mkdirSync(`${OUT}/docs`);
for (const f of ['DESIGN.md', 'PROYECTO.md']) if (existsSync(`docs/${f}`)) cpSync(`docs/${f}`, `${OUT}/docs/${f}`);
// El cliente nuevo ocupa `public/`, que es lo que el servidor sirve por defecto.
cpSync('web/dist', `${OUT}/public`, { recursive: true });
writeFileSync(`${OUT}/.gitignore`, 'node_modules/\ndata/\n.env\n*.zip\nrespaldos/\n');
console.log(`[subida] listo: ${OUT}/ (arrastra su contenido al repositorio de GitHub)`);
