// node.ts - carrega o bundle gerado no servidor/testes (fs). O front importa o JSON como URL.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCatalog } from './catalog';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'generated');
let cached: any = null;

export function loadBundle(): any {
  if (!cached) cached = JSON.parse(readFileSync(join(dir, 'bundle.json'), 'utf8'));
  return cached;
}
export function bundleHash(): string {
  try { return JSON.parse(readFileSync(join(dir, 'bundle.meta.json'), 'utf8')).hash; } catch { return 'unknown'; }
}
export const loadCatalog = () => createCatalog(loadBundle());
