// build.mjs - gera packages/data/generated/bundle.json a partir de data/ (tools/build_app_data.py --out).
// Sem Python, copia app/data/bundle.json (v1) e avisa. Grava bundle.meta.json com o hash.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const outDir = join(root, 'packages', 'data', 'generated');
const out = join(outDir, 'bundle.json');
mkdirSync(outDir, { recursive: true });

let done = false;
for (const py of ['python', 'py', 'python3']) {
  const r = spawnSync(py, [join(root, 'tools', 'build_app_data.py'), '--out', out], { encoding: 'utf8' });
  if (r.status === 0) { process.stdout.write(r.stdout.split('\n').slice(0, 3).join('\n') + '\n'); done = true; break; }
}
if (!done) {
  const v1 = join(root, 'app', 'data', 'bundle.json');
  if (!existsSync(v1)) { console.error('Python não encontrado e app/data/bundle.json ausente: não foi possível gerar os dados.'); process.exit(1); }
  copyFileSync(v1, out);
  console.warn('Python não encontrado: usei a cópia de app/data/bundle.json (v1).');
}
const buf = readFileSync(out);
const sha = createHash('sha256').update(buf).digest('hex').slice(0, 16);
// hash do conteudo sem o carimbo de data (meta.generated) para ser estavel entre geracoes
const stable = createHash('sha256').update(JSON.stringify({ ...JSON.parse(buf), meta: null })).digest('hex').slice(0, 16);
writeFileSync(join(outDir, 'bundle.meta.json'), JSON.stringify({ sha256: sha, hash: stable, bytes: buf.length }, null, 2));
console.log(`bundle ${stable} (${(buf.length / 1024).toFixed(0)} KiB)`);
