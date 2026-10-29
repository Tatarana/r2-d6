// setup.mjs - prepara o ambiente de dev: .env, dados, banco (espera), migracoes e seed. Roda no `predev`.
// Uso: node scripts/setup.mjs [--quick]
import { copyFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const log = (m) => console.log(`[setup] ${m}`);

// 1) .env
if (!existsSync(join(root, '.env'))) {
  copyFileSync(join(root, '.env.example'), join(root, '.env'));
  log('.env criado a partir de .env.example');
}
const { config } = await import('dotenv');
config({ path: join(root, '.env'), quiet: true });
const url = process.env.DATABASE_URL ?? 'postgres://r2d6:r2d6@127.0.0.1:5432/r2d6';

// 2) dados de regras
spawnSync(process.execPath, [join(root, 'scripts', 'ensure-data.mjs')], { stdio: 'inherit' });

// 3) espera o banco
async function waitDb(timeoutMs = 60000) {
  const t0 = Date.now();
  let last;
  while (Date.now() - t0 < timeoutMs) {
    const c = new pg.Client({ connectionString: url });
    try { await c.connect(); await c.query('select 1'); await c.end(); return; } catch (e) { last = e; try { await c.end(); } catch {} }
    await new Promise((r) => setTimeout(r, 1500));
  }
  console.error(`\n[setup] Não consegui falar com o Postgres (${url.replace(/:[^:@/]*@/, ':***@')}).\n` +
    '        Suba o Docker Desktop e rode:  docker compose up -d\n        Detalhe: ' + (last?.message ?? last));
  process.exit(1);
}
await waitDb();
log('banco acessível');

// 4) garante o banco de testes
try {
  const admin = new pg.Client({ connectionString: url });
  await admin.connect();
  const r = await admin.query("select 1 from pg_database where datname = 'r2d6_test'");
  if (!r.rowCount) { await admin.query('create database r2d6_test'); log('banco r2d6_test criado'); }
  await admin.end();
} catch (e) { log(`aviso: não foi possível checar r2d6_test (${e.message})`); }

// 5) migracoes e seed
const tsx = (file) => spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['tsx', file], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
let r = tsx('apps/api/src/db/migrate.ts');
if (r.status !== 0) process.exit(r.status ?? 1);
const c = new pg.Client({ connectionString: url });
await c.connect();
const users = await c.query('select count(*)::int as n from "user"');
await c.end();
if (users.rows[0].n === 0) {
  log('sem usuários: semeando dados de demonstração');
  r = tsx('apps/api/src/db/seed.ts');
  if (r.status !== 0) process.exit(r.status ?? 1);
}
log('pronto.');
