// ops.ts - operacoes sobre a ficha (ADR-0007): subconjunto do JSON Patch + `inc` para contadores.
// Puro; usado no cliente (otimista/outbox) e no servidor (aplicar, rebase, conflito).

export type Op =
  | { op: 'add' | 'replace'; path: string; value: any }
  | { op: 'remove'; path: string }
  | { op: 'inc'; path: string; value: number };

export interface Conflict { path: string; mine: Op; theirs: Op }

const clone = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

export function parsePointer(path: string): string[] {
  if (path === '' || path === '/') return [];
  if (path[0] !== '/') throw new Error(`caminho inválido: ${path}`);
  return path.slice(1).split('/').map((s) => s.replace(/~1/g, '/').replace(/~0/g, '~'));
}
export const toPointer = (parts: (string | number)[]) => (parts.length ? '/' + parts.map((p) => String(p).replace(/~/g, '~0').replace(/\//g, '~1')).join('/') : '');

const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype']);

/** Aplica as operacoes a uma copia do documento. Lanca Error se o caminho nao existe. */
export function applyOps<T = any>(doc: T, ops: Op[]): T {
  const out: any = clone(doc);
  for (const op of ops) {
    const parts = parsePointer(op.path);
    if (!parts.length) throw new Error('operação na raiz não é permitida');
    if (parts.some((p) => FORBIDDEN.has(p))) throw new Error(`caminho proibido: ${op.path}`);
    let parent: any = out;
    for (let i = 0; i < parts.length - 1; i++) {
      parent = parent?.[parts[i]];
      if (parent === undefined || parent === null || typeof parent !== 'object') throw new Error(`caminho não existe: ${op.path}`);
    }
    const key = parts[parts.length - 1];
    const isArr = Array.isArray(parent);
    const idx = isArr ? (key === '-' ? parent.length : Number(key)) : -1;
    if (isArr && (!Number.isInteger(idx) || idx < 0 || idx > parent.length)) throw new Error(`índice inválido: ${op.path}`);
    switch (op.op) {
      case 'add':
        if (isArr) parent.splice(idx, 0, clone(op.value)); else parent[key] = clone(op.value);
        break;
      case 'replace':
        if (isArr) { if (idx >= parent.length) throw new Error(`índice inválido: ${op.path}`); parent[idx] = clone(op.value); }
        else { if (!(key in parent)) throw new Error(`caminho não existe: ${op.path}`); parent[key] = clone(op.value); }
        break;
      case 'remove':
        if (isArr) { if (idx >= parent.length) throw new Error(`índice inválido: ${op.path}`); parent.splice(idx, 1); }
        else { if (!(key in parent)) throw new Error(`caminho não existe: ${op.path}`); delete parent[key]; }
        break;
      case 'inc': {
        const cur = isArr ? parent[idx] : parent[key];
        if (typeof cur !== 'number' || typeof op.value !== 'number') throw new Error(`inc exige número: ${op.path}`);
        if (isArr) parent[idx] = cur + op.value; else parent[key] = cur + op.value;
        break;
      }
      default: throw new Error(`operação desconhecida: ${(op as any).op}`);
    }
  }
  return out as T;
}

const isPrefix = (a: string[], b: string[]) => a.length <= b.length && a.every((p, i) => p === b[i]);
const related = (a: string, b: string) => { const x = parsePointer(a), y = parsePointer(b); return isPrefix(x, y) || isPrefix(y, x); };

/**
 * Conflitos entre as operacoes novas (`mine`, feitas sobre a base) e as ja gravadas depois da base (`theirs`).
 * Regras (ADR-0007): inc x inc comuta; qualquer outra combinacao no mesmo caminho (ou ancestral/descendente) conflita.
 * add/remove em listas deslocam indices: conflita com qualquer op no mesmo array.
 */
export function findConflicts(mine: Op[], theirs: Op[]): Conflict[] {
  const out: Conflict[] = [];
  for (const m of mine) {
    for (const t of theirs) {
      if (m.op === 'inc' && t.op === 'inc') continue;
      if (related(m.path, t.path)) { out.push({ path: m.path, mine: m, theirs: t }); break; }
      const shifts = (o: Op) => o.op === 'remove' || (o.op === 'add' && Array.isArray(guessArray(o)));
      if ((t.op === 'remove' || t.op === 'add') && related(parentPath(t.path), m.path) && shifts(t)) { out.push({ path: m.path, mine: m, theirs: t }); break; }
    }
  }
  return out;
}
const guessArray = (o: Op) => (/\/(\d+|-)$/.test(o.path) ? [] : null);
const parentPath = (p: string) => p.slice(0, p.lastIndexOf('/'));

/** Rebase: aplica `mine` sobre o documento atual se nao houver conflito. */
export function rebase<T = any>(current: T, mine: Op[], theirs: Op[]): { ok: true; doc: T } | { ok: false; conflicts: Conflict[] } {
  const conflicts = findConflicts(mine, theirs);
  if (conflicts.length) return { ok: false, conflicts };
  return { ok: true, doc: applyOps(current, mine) };
}

// ------------------------------------------------------------------ contadores e limites
const COUNTER_PATHS = [/^\/character_points$/, /^\/force_points$/, /^\/dark_side_points$/, /^\/credits$/, /^\/move$/, /^\/weapons\/\d+\/ammo_used$/];
export const isCounterPath = (path: string) => COUNTER_PATHS.some((r) => r.test(path));

/** Aplica limites (nao negativo; munição <= máximo). Devolve avisos do que foi cortado. */
export function clampSheet(sheet: any): string[] {
  const warns: string[] = [];
  for (const k of ['character_points', 'force_points', 'dark_side_points', 'credits', 'move']) {
    if (typeof sheet[k] === 'number' && sheet[k] < 0) { warns.push(`${k} ajustado para 0`); sheet[k] = 0; }
  }
  (sheet.weapons || []).forEach((w: any, i: number) => {
    if (typeof w.ammo_used === 'number') {
      if (w.ammo_used < 0) { w.ammo_used = 0; warns.push(`weapons/${i}/ammo_used ajustado para 0`); }
      if (typeof w.ammo_max === 'number' && w.ammo_max > 0 && w.ammo_used > w.ammo_max) { w.ammo_used = w.ammo_max; warns.push(`weapons/${i}/ammo_used limitado a ${w.ammo_max}`); }
    }
  });
  return warns;
}

// ------------------------------------------------------------------ diff -> ops (cliente)
/** Gera operacoes que levam `before` a `after`. Contadores numericos viram `inc` (comutam entre aparelhos). */
export function diffOps(before: any, after: any, path: (string | number)[] = []): Op[] {
  if (JSON.stringify(before) === JSON.stringify(after)) return [];
  const p = toPointer(path);
  if (typeof before === 'number' && typeof after === 'number' && isCounterPath(p)) return [{ op: 'inc', path: p, value: after - before }];
  const bothObj = before && after && typeof before === 'object' && typeof after === 'object';
  if (bothObj && Array.isArray(before) !== Array.isArray(after)) return [{ op: 'replace', path: p, value: after }];
  if (bothObj && Array.isArray(before) && Array.isArray(after)) {
    if (before.length === after.length) return before.flatMap((b, i) => diffOps(b, after[i], [...path, i]));
    // lista mudou de tamanho: add/remove por posicao quando e so acrescimo/remocao no fim; senao troca a lista toda
    if (after.length > before.length && before.every((b, i) => JSON.stringify(b) === JSON.stringify(after[i]))) {
      return after.slice(before.length).map((v) => ({ op: 'add' as const, path: toPointer([...path, '-']), value: v }));
    }
    for (let i = 0; i < after.length + 1; i++) {
      // remocao de um item no meio/fim
      if (before.length === after.length + 1) {
        const rest = [...before.slice(0, i), ...before.slice(i + 1)];
        if (JSON.stringify(rest) === JSON.stringify(after)) return [{ op: 'remove', path: toPointer([...path, i]) }];
      }
    }
    return [{ op: 'replace', path: p, value: after }];
  }
  if (bothObj) {
    const ops: Op[] = [];
    for (const k of Object.keys(before)) {
      if (!(k in after)) ops.push({ op: 'remove', path: toPointer([...path, k]) });
      else ops.push(...diffOps(before[k], after[k], [...path, k]));
    }
    for (const k of Object.keys(after)) if (!(k in before)) ops.push({ op: 'add', path: toPointer([...path, k]), value: after[k] });
    return ops;
  }
  return [{ op: 'replace', path: p, value: after }];
}

/** Ops que o mestre pode aplicar na ficha do jogador (ADR/auth 9.2): CP/FP/DSP, ferimento e creditos. */
export const GM_ALLOWED_PATHS = [/^\/character_points$/, /^\/force_points$/, /^\/dark_side_points$/, /^\/credits$/, /^\/wound_status$/];
export const isGmOp = (op: Op) => GM_ALLOWED_PATHS.some((r) => r.test(op.path));
