import { loadConfig } from '../src/config';
import { runMigrations } from '../src/db/migrate';

export default async function setup() {
  const cfg = loadConfig();
  await runMigrations(cfg.DATABASE_URL_TEST);
}
