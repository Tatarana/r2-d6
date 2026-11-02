// rollback.ts - desfaz as ultimas migracoes aplicadas usando os arquivos <tag>.down.sql (escritos a mao ao lado do "up").
// Uso: npm run db:rollback -w @r2d6/api [-- --steps 2]   (em producao exige tambem --yes)
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { loadConfig } from '../config';

export const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

interface JournalEntry { idx: number; when: number; tag: string }
export const journal = (): JournalEntry[] => JSON.parse(readFileSync(join(MIGRATIONS_DIR, 'meta', '_journal.json'), 'utf8')).entries;
export const downFile = (tag: string) => join(MIGRATIONS_DIR, `${tag}.down.sql`);

/** Desfaz as `steps` migracoes mais recentes (cada uma numa transacao) e apaga o registro dela na tabela do drizzle. Retorna as tags desfeitas. */
export async function rollback(url: string, steps = 1): Promise<string[]> {
  const entries = journal();
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  const done: string[] = [];
  try {
    const { rows } = await client.query('select created_at from drizzle.__drizzle_migrations order by created_at desc limit $1', [steps]);
    for (const { created_at } of rows) {
      const entry = entries.find((e) => String(e.when) === String(created_at));
      if (!entry) throw new Error(`migração aplicada (created_at ${created_at}) não está no _journal.json`);
      const file = downFile(entry.tag);
      if (!existsSync(file)) throw new Error(`falta ${entry.tag}.down.sql: escreva o SQL que desfaz ${entry.tag}.sql`);
      const statements = readFileSync(file, 'utf8').split('--> statement-breakpoint').map((s) => s.trim()).filter(Boolean);
      await client.query('begin');
      try {
        for (const sql of statements) await client.query(sql);
        await client.query('delete from drizzle.__drizzle_migrations where created_at = $1', [created_at]);
        await client.query('commit');
      } catch (e) { await client.query('rollback'); throw e; }
      done.push(entry.tag);
    }
  } finally {
    await client.end();
  }
  return done;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const cfg = loadConfig();
  const args = process.argv.slice(2);
  const i = args.indexOf('--steps');
  const steps = i >= 0 ? Math.max(1, Number(args[i + 1]) || 1) : 1;
  if (cfg.isProd && !args.includes('--yes')) {
    console.error('[db] produção: o rollback pode apagar dados. Faça um backup (branch no Neon) e rode de novo com --yes.');
    process.exit(1);
  }
  rollback(cfg.DATABASE_URL, steps)
    .then((tags) => console.log(tags.length ? `[db] desfeitas: ${tags.join(', ')}` : '[db] nenhuma migração aplicada para desfazer.'))
    .catch((e) => { console.error('[db] falha no rollback:', e.message); process.exit(1); });
}
