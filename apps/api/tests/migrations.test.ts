// migrations.test.ts - toda migracao tem o .down.sql e o ciclo up -> down -> up funciona num banco descartavel.
import { existsSync } from 'node:fs';
import pg from 'pg';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config';
import { runMigrations } from '../src/db/migrate';
import { downFile, journal, rollback } from '../src/db/rollback';

const cfg = loadConfig({ NODE_ENV: 'test' });

async function q<T = any>(url: string, sql: string, params: any[] = []) {
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try { return (await c.query(sql, params)).rows as T[]; } finally { await c.end(); }
}

describe('migrações reversíveis (B-211)', () => {
  it('cada migração do journal tem o arquivo de volta', () => {
    for (const e of journal()) expect(existsSync(downFile(e.tag)), `${e.tag}.down.sql`).toBe(true);
  });

  it('aplica, desfaz tudo e aplica de novo', async () => {
    const name = `r2d6_mig_${Date.now()}`;
    const url = new URL(cfg.DATABASE_URL_TEST);
    await q(url.toString(), `create database ${name}`);
    url.pathname = `/${name}`;
    const tmp = url.toString();
    const tables = async () => (await q<{ n: string }>(tmp, "select count(*)::int as n from pg_tables where schemaname = 'public'"))[0].n;
    try {
      await runMigrations(tmp);
      expect(Number(await tables())).toBeGreaterThan(10);
      const undone = await rollback(tmp, journal().length);
      expect(undone).toEqual(journal().map((e) => e.tag).reverse());
      expect(Number(await tables())).toBe(0);
      expect(await q(tmp, 'select * from drizzle.__drizzle_migrations')).toHaveLength(0);
      expect(await rollback(tmp)).toEqual([]); // nada mais a desfazer
      await runMigrations(tmp);
      expect(Number(await tables())).toBeGreaterThan(10);
    } finally {
      url.pathname = new URL(cfg.DATABASE_URL_TEST).pathname;
      await q(url.toString(), `drop database if exists ${name} with (force)`);
    }
  });
});
