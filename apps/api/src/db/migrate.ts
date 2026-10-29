// migrate.ts - aplica as migracoes SQL versionadas (drizzle-kit generate).
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../config';
import { createDb } from './client';

export async function runMigrations(url: string) {
  const { db, pool } = createDb(url);
  try {
    await migrate(db, { migrationsFolder: join(dirname(fileURLToPath(import.meta.url)), 'migrations') });
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const cfg = loadConfig();
  runMigrations(cfg.DATABASE_URL).then(() => console.log('[db] migrações aplicadas.')).catch((e) => { console.error('[db] falha na migração:', e.message); process.exit(1); });
}
