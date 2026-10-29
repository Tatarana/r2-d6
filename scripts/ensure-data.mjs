// ensure-data.mjs - gera packages/data/generated/bundle.json se ainda nao existir (usado por predev e test).
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
if (!existsSync(join(root, 'packages', 'data', 'generated', 'bundle.json'))) {
  console.log('[dados] bundle ausente: gerando a partir de data/ ...');
  const r = spawnSync(process.execPath, [join(root, 'packages', 'data', 'scripts', 'build.mjs')], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
